import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function normalizeStatus(stripeStatus: string) {
  const status = stripeStatus.toLowerCase();
  if (status === "active" || status === "trialing") return "active";
  return status;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Missing server config" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!token) {
    return new Response(JSON.stringify({ error: "Missing Authorization token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(
    token
  );

  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "Invalid user token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const user = userData.user;
  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

  try {
    const existing = await stripe.customers.search({
      query: `metadata['supabase_user_id']:'${user.id}'`,
      limit: 1,
    });

    if (!existing.data.length) {
      return new Response(JSON.stringify({ error: "No Stripe customer found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customer = existing.data[0];
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 10,
    });

    const pick =
      subs.data.find((sub) => ["active", "trialing"].includes(sub.status)) ??
      subs.data.sort((a, b) => b.created - a.created)[0];

    if (!pick) {
      await supabaseAdmin.from("user_subscriptions").upsert({
        user_id: user.id,
        stripe_customer_id: customer.id,
        status: "inactive",
        current_period_end: null,
        updated_at: new Date().toISOString(),
      });

      return new Response(JSON.stringify({ status: "inactive" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const status = normalizeStatus(pick.status);
    const cpe =
      typeof pick.current_period_end === "number"
        ? new Date(pick.current_period_end * 1000).toISOString()
        : null;

    const { error: upsertErr } = await supabaseAdmin
      .from("user_subscriptions")
      .upsert({
        user_id: user.id,
        stripe_customer_id: customer.id,
        stripe_subscription_id: pick.id,
        status,
        current_period_end: cpe,
        updated_at: new Date().toISOString(),
      });

    if (upsertErr) throw upsertErr;

    return new Response(
      JSON.stringify({
        status,
        current_period_end: cpe,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message ?? "Sync failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
