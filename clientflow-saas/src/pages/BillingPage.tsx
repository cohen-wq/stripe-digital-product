import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function BillingPage() {
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);

  async function getAccessToken() {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    const token = sessionData.session?.access_token;
    if (!token) {
      throw new Error("No session token. Sign out and sign in again.");
    }

    return token;
  }

  function formatFunctionError(error: {
    status?: number;
    context?: { status?: number; body?: unknown };
    details?: unknown;
    message?: string;
  }) {
    const status = error?.status ?? error?.context?.status ?? "unknown";
    const ctxBody = error?.context?.body ?? error?.details ?? null;
    const details =
      ctxBody === null
        ? ""
        : typeof ctxBody === "string"
        ? ctxBody
        : JSON.stringify(ctxBody);

    return `${error.message ?? "Request failed"} (status ${status})${
      details ? ` | body: ${details}` : ""
    }`;
  }

  async function startCheckout() {
    setLoading(true);
    setErrorText(null);
    setStatusText(null);

    try {
      const priceId = import.meta.env.VITE_STRIPE_PRICE_ID as
        | string
        | undefined;
      if (!priceId) {
        throw new Error(
          "Missing VITE_STRIPE_PRICE_ID in your frontend .env (restart dev server after adding)."
        );
      }

      const token = await getAccessToken();

      const { data, error } = await supabase.functions.invoke("bright-processor", {
        body: {
          priceId,
          successUrl: `${window.location.origin}/billing?success=true`,
          cancelUrl: `${window.location.origin}/billing?canceled=true`,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (error) {
        throw new Error(formatFunctionError(error));
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error(`No url returned from function. Response: ${JSON.stringify(data)}`);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-4">Upgrade to TaskPerch Pro</h1>
      <p className="text-gray-600 mb-8">
        Explore the app freely, then unlock real actions when you're ready. No contracts.
        Cancel anytime.
      </p>

      <div className="grid md:grid-cols-2 gap-10 items-start">
        <ul className="space-y-4 text-lg">
          <li>✅ Create and manage unlimited clients</li>
          <li>✅ Track jobs and monthly revenue</li>
          <li>✅ Schedule work on the calendar</li>
          <li>✅ Generate invoices and PDFs</li>
          <li>✅ Unlock all forms, buttons, and actions</li>
        </ul>

        <div className="border rounded-xl p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="text-5xl font-bold">$9</div>
            <div className="text-gray-500">per month</div>
          </div>

          <button
            onClick={startCheckout}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Redirecting…" : "Subscribe →"}
          </button>

          {statusText && (
            <p className="text-xs text-gray-400 mt-2 text-center break-all">
              {statusText}
            </p>
          )}

          {errorText && (
            <p className="text-red-600 text-sm mt-3 text-center break-all">
              {errorText}
            </p>
          )}

          <p className="text-sm text-gray-500 mt-4 text-center">
            Secure Stripe Checkout · Access unlocks only after Stripe confirms your
            subscription
          </p>
        </div>
      </div>
    </div>
  );
}
