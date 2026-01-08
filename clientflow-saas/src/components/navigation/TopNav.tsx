import { Lock } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function TopNav({
  canAccessPaid,
  onSubscribe,
}: {
  canAccessPaid: boolean;
  onSubscribe: () => void;
}) {
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    // App.tsx should detect user is null and show AuthPage automatically,
    // but we also navigate to be safe:
    navigate("/");
  }

  const linkBase =
    "px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const linkActive = "bg-blue-600 text-white";
  const linkInactive = "text-gray-700 hover:bg-gray-100";

  return (
    <nav className="bg-white shadow-md border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <img
              src="/taskperch-logo.png"
              alt="TaskPerch"
              className="h-14 w-auto"
            />
          </div>

          <div className="flex items-center gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/clients"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              <span className="flex items-center gap-1">
                Clients
                {!canAccessPaid && <Lock size={14} />}
              </span>
            </NavLink>

            <NavLink
              to="/calendar"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              <span className="flex items-center gap-1">
                Calendar
                {!canAccessPaid && <Lock size={14} />}
              </span>
            </NavLink>

            <NavLink
              to="/jobs"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              <span className="flex items-center gap-1">
                Jobs
                {!canAccessPaid && <Lock size={14} />}
              </span>
            </NavLink>

            <NavLink
              to="/invoices"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              <span className="flex items-center gap-1">
                Invoices
                {!canAccessPaid && <Lock size={14} />}
              </span>
            </NavLink>

            <NavLink
              to="/billing"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Billing
            </NavLink>

            {!canAccessPaid && (
              <button
                onClick={onSubscribe}
                className="ml-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Subscribe
              </button>
            )}

            <button
              onClick={handleSignOut}
              className="ml-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
