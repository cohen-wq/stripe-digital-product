import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false, // Stripe requires raw body
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

// Read raw request body into a Buffer
async function readBuffer(readable: any) {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const sig = req.headers["stripe-signature"];
    if (!sig) return res.status(400).send("Missing stripe-signature header");

    const buf = await readBuffer(req);

    const event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );

    // Helper: update subscription row by stripe customer id
    async function updateByCustomerId(customerId: string, payload: any) {
      const { data: row, error } = await supabaseAdmin
        .from("user_subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      if (error) throw error;
      if (!row?.user_id) return;

      const { error: upsertErr } = await supabaseAdmin
        .from("user_subscriptions")
        .upsert({
          user_id: row.user_id,
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
          ...payload,
        });

      if (upsertErr) throw upsertErr;
    }

    // --- Stripe event handling ---
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      // Use `any` to avoid Stripe type mismatch errors across package versions
      const sub = event.data.object as any;

      const customerId = String(sub.customer);
      const stripeStatus = String(sub.status ?? "incomplete").toLowerCase();
      const status =
        stripeStatus === "active" || stripeStatus === "trialing"
          ? "active"
          : stripeStatus;

      const cpeUnix =
        typeof sub.current_period_end === "number" ? sub.current_period_end : null;

      await updateByCustomerId(customerId, {
        stripe_subscription_id: String(sub.id),
        status,
        current_period_end: cpeUnix ? new Date(cpeUnix * 1000).toISOString() : null,
      });
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as any;
      const customerId = String(sub.customer);

      await updateByCustomerId(customerId, {
        stripe_subscription_id: String(sub.id),
        status: "canceled",
        current_period_end: null,
      });
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("stripe-webhook error:", err);
    return res
      .status(400)
      .send(`Webhook Error: ${err?.message ?? "Unknown error"}`);
  }
}
