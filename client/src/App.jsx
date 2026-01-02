import { useState } from "react";

export default function App() {
  const [loading, setLoading] = useState(false);

  const startCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4242/create-checkout-session", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("No checkout URL returned");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <span style={styles.badge}>Test Mode</span>

        <h1 style={styles.title}>Demo Digital Product</h1>

        <p style={styles.description}>
          A clean, reusable Stripe Checkout flow built with a secure backend.
          Designed to be dropped directly into a real application.
        </p>

        <div style={styles.priceRow}>
          <span style={styles.price}>$9</span>
          <span style={styles.cents}>.00</span>
        </div>

        <button
          onClick={startCheckout}
          disabled={loading}
          style={{
            ...styles.button,
            ...(loading ? styles.buttonDisabled : {}),
          }}
        >
          {loading ? "Redirecting…" : "Pay with Stripe"}
        </button>

        <div style={styles.footer}>
          Secure checkout · One-time payment
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100vw",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(180deg, #FFFDF9 0%, #F4EFE6 100%)",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial",
    color: "#1f2937",
  },

  card: {
    width: "100%",
    maxWidth: 520,
    padding: "48px 44px",
    background: "#ffffff",
    borderRadius: 20,
    textAlign: "center",
    boxShadow: "0 32px 64px rgba(0, 0, 0, 0.08)",
    border: "1px solid rgba(0, 0, 0, 0.06)",
  },

  badge: {
    display: "inline-block",
    marginBottom: 18,
    padding: "6px 14px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    background: "#F3F4F6",
    color: "#6B7280",
  },

  title: {
    fontSize: 32,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    marginBottom: 14,
  },

  description: {
    fontSize: 15.5,
    lineHeight: 1.6,
    color: "#6B7280",
    marginBottom: 32,
  },

  priceRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: 28,
  },

  price: {
    fontSize: 48,
    fontWeight: 700,
    letterSpacing: "-0.03em",
  },

  cents: {
    fontSize: 20,
    marginLeft: 2,
    marginBottom: 6,
    color: "#6B7280",
  },

  button: {
    width: "100%",
    padding: "14px 18px",
    borderRadius: 12,
    border: "none",
    background: "#111827",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },

  buttonDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
  },

  footer: {
    marginTop: 20,
    fontSize: 12.5,
    color: "#9CA3AF",
  },
};
