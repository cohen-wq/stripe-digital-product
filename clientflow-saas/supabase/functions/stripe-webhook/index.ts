import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe";
import { Buffer } from "node:buffer";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// NOTE: Deploy this function with --no-verify-jwt (Stripe won't send auth tokens).
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
  const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return new Response("Missing Stripe webhook config", { status: 500 });
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response("Missing Supabase service role config", { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
  let event: Stripe.Event;
  try {
    const rawBody = await req.arrayBuffer();
    event = stripe.webhooks.constructEvent(
      Buffer.from(rawBody),
      sig,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    return new Response(`Webhook Error: ${err?.message ?? "Invalid payload"}`, {
      status: 400,
    });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  async function updateByCustomerId(
    customerId: string,
    payload: Record<string, unknown>
  ) {
    const { data: row, error } = await supabaseAdmin
      .from("user_subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (error) throw error;
    if (!row?.user_id) return false;

    const { error: upsertErr } = await supabaseAdmin
      .from("user_subscriptions")
      .upsert({
        user_id: row.user_id,
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
        ...payload,
      });

    if (upsertErr) throw upsertErr;
    return true;
  }

  async function upsertByUserId(
    userId: string,
    payload: Record<string, unknown>
  ) {
    const { error: upsertErr } = await supabaseAdmin
      .from("user_subscriptions")
      .upsert({
        user_id: userId,
        updated_at: new Date().toISOString(),
        ...payload,
      });

    if (upsertErr) throw upsertErr;
  }

  try {
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      const sub = event.data.object as any;
      const customerId = String(sub.customer);
      const userId = String(sub?.metadata?.supabase_user_id ?? "");
      const stripeStatus = String(sub.status ?? "incomplete").toLowerCase();
      const status =
        stripeStatus === "active" || stripeStatus === "trialing"
          ? "active"
          : stripeStatus;

      const cpeUnix =
        typeof sub.current_period_end === "number" ? sub.current_period_end : null;

      const payload = {
        stripe_subscription_id: String(sub.id),
        status,
        current_period_end: cpeUnix ? new Date(cpeUnix * 1000).toISOString() : null,
      };

      const updated = await updateByCustomerId(customerId, payload);
      if (!updated && userId) {
        await upsertByUserId(userId, {
          stripe_customer_id: customerId,
          ...payload,
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as any;
      const customerId = String(sub.customer);
      const userId = String(sub?.metadata?.supabase_user_id ?? "");

      const payload = {
        stripe_subscription_id: String(sub.id),
        status: "canceled",
        current_period_end: null,
      };

      const updated = await updateByCustomerId(customerId, payload);
      if (!updated && userId) {
        await upsertByUserId(userId, {
          stripe_customer_id: customerId,
          ...payload,
        });
      }
    }

    if (
      event.type === "checkout.session.completed" ||
      event.type === "invoice.paid" ||
      event.type === "invoice.payment_succeeded"
    ) {
      const obj = event.data.object as any;
      const subscriptionId = String(obj?.subscription ?? "");
      if (!subscriptionId) {
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      const customerId = String(sub.customer);
      const userId = String(sub.metadata?.supabase_user_id ?? obj?.metadata?.supabase_user_id ?? "");
      const stripeStatus = String(sub.status ?? "incomplete").toLowerCase();
      const status =
        stripeStatus === "active" || stripeStatus === "trialing"
          ? "active"
          : stripeStatus;

      const cpeUnix =
        typeof (sub as any).current_period_end === "number"
          ? (sub as any).current_period_end
          : null;

      const payload = {
        stripe_subscription_id: String(sub.id),
        status,
        current_period_end: cpeUnix ? new Date(cpeUnix * 1000).toISOString() : null,
      };

      const updated = await updateByCustomerId(customerId, payload);
      if (!updated && userId) {
        await upsertByUserId(userId, {
          stripe_customer_id: customerId,
          ...payload,
        });
      }
    }
  } catch (err: any) {
    return new Response(`Webhook update error: ${err?.message ?? "Unknown error"}`, {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
