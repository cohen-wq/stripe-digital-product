import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import AppLayout from "./layout/AppLayout";

import HomePage from "./pages/HomePage";
import CalendarPage from "./pages/CalendarPage";
import ClientsPage from "./pages/ClientsPage";
import JobsPage from "./pages/JobsPage";
import InvoicesPage from "./pages/InvoicesPage";
import BillingPage from "./pages/BillingPage";
import AuthPage from "./components/auth/AuthPage";

function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(true);
  const [canAccessPaid, setCanAccessPaid] = useState(false);

  const checkAccess = useCallback(async (nextUser: any | null) => {
    if (!nextUser) {
      setCanAccessPaid(false);
      setAccessLoading(false);
      return;
    }

    const email = String(nextUser.email ?? "").toLowerCase();
    if (email === "cohen.p.blanchard@gmail.com") {
      setCanAccessPaid(true);
      setAccessLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("status, current_period_end")
        .eq("user_id", nextUser.id)
        .maybeSingle();

      if (error) throw error;

      const status = String(data?.status ?? "").toLowerCase();
      const isActive = status === "active" || status === "trialing";
      let valid = isActive;

      if (valid && data?.current_period_end) {
        const endDate = new Date(data.current_period_end);
        if (!Number.isNaN(endDate.getTime()) && endDate.getTime() < Date.now()) {
          valid = false;
        }
      }

      setCanAccessPaid(valid);
    } catch (err) {
      console.error("Subscription check error:", err);
      setCanAccessPaid(false);
    } finally {
      setAccessLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthLoading(false);
      checkAccess(data.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setAuthLoading(false);
        checkAccess(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [checkAccess]);

  if (authLoading || accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <Router>
      {user ? (
        <AppLayout
          canAccessPaid={canAccessPaid}
          onSubscribe={() => {
            window.location.href = "/billing";
          }}
        >
          <Routes>
            <Route path="/" element={<HomePage isPreview={!canAccessPaid} />} />
            <Route path="/calendar" element={<CalendarPage isPreview={!canAccessPaid} />} />
            <Route path="/clients" element={<ClientsPage isPreview={!canAccessPaid} />} />
            <Route path="/jobs" element={<JobsPage isPreview={!canAccessPaid} />} />
            <Route path="/invoices" element={<InvoicesPage isPreview={!canAccessPaid} />} />
            <Route path="/billing" element={<BillingPage canAccessPaid={canAccessPaid} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AppLayout>
      ) : (
        <AuthPage />
      )}
    </Router>
  );
}

export default App;
