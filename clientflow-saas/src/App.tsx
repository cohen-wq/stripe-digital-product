import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import AppLayout from "./layout/AppLayout";

import HomePage from "./pages/HomePage";
import CalendarPage from "./pages/CalendarPage";
import ClientsPage from "./pages/ClientsPage";
import JobsPage from "./pages/JobsPage";
import InvoicesPage from "./pages/InvoicesPage";
import AuthPage from "./components/auth/AuthPage";

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <Router>
      {user ? (
        <AppLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
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
