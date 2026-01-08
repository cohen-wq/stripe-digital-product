import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import QuickActions from "../components/dashboard/QuickActions";

type Stats = {
  clientsCount: number;
  activeJobsCount: number;
  completedJobsCount: number;
  revenueThisMonth: number;
};

type UpcomingEvent = {
  id: string;
  title: string;
  description: string;
  date: string; // yyyy-MM-dd
  startTime: string;
  endTime: string;
  type: string;
  clientName?: string;
  color: string;
};

function isSameMonth(d: Date, now: Date) {
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export default function HomePage({ isPreview = false }: { isPreview?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    clientsCount: 0,
    activeJobsCount: 0,
    completedJobsCount: 0,
    revenueThisMonth: 0,
  });
  const [eventsLoading, setEventsLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);

  const revenueFormatted = useMemo(() => {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(stats.revenueThisMonth || 0);
  }, [stats.revenueThisMonth]);

  const countClients = useCallback(async (userId: string | null) => {
    if (userId) {
      const filtered = await supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      if (!filtered.error) return filtered.count ?? 0;

      const msg = filtered.error.message?.toLowerCase?.() ?? "";
      if (!msg.includes("user_id")) {
        console.warn("Clients count error:", filtered.error.message);
        return 0;
      }
    }

    const plain = await supabase.from("clients").select("id", { count: "exact", head: true });
    if (plain.error) {
      console.warn("Clients count fallback error:", plain.error.message);
      return 0;
    }
    return plain.count ?? 0;
  }, []);

  const fetchJobsRows = useCallback(async (userId: string | null) => {
    if (userId) {
      const filtered = await supabase
        .from("jobs")
        .select("id, status, amount_estimated, created_at")
        .eq("user_id", userId);

      if (!filtered.error) return filtered.data ?? [];

      const msg = filtered.error.message?.toLowerCase?.() ?? "";
      if (!msg.includes("user_id")) {
        console.warn("Jobs fetch error:", filtered.error.message);
        return [];
      }
    }

    const plain = await supabase
      .from("jobs")
      .select("id, status, amount_estimated, created_at");

    if (plain.error) {
      console.warn("Jobs fetch fallback error:", plain.error.message);
      return [];
    }
    return plain.data ?? [];
  }, []);

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);

    try {
      const { data: userResp, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const userId = userResp?.user?.id ?? null;

      const clientsCount = await countClients(userId);
      const jobs = await fetchJobsRows(userId);

      const now = new Date();

      let activeJobsCount = 0;
      let completedJobsCount = 0;
      let revenueThisMonth = 0;

      for (const j of jobs as any[]) {
        const status = String(j.status ?? "").toLowerCase();

        if (status === "completed") {
          completedJobsCount += 1;

          const createdAt = new Date(j.created_at);
          if (!isNaN(createdAt.getTime()) && isSameMonth(createdAt, now)) {
            const amt = Number(j.amount_estimated ?? 0);
            if (isFinite(amt)) revenueThisMonth += amt;
          }
        } else {
          activeJobsCount += 1;
        }
      }

      setStats({
        clientsCount,
        activeJobsCount,
        completedJobsCount,
        revenueThisMonth,
      });
    } catch (e: any) {
      console.error("Dashboard stats error:", e?.message ?? e);
    } finally {
      setLoading(false);
    }
  }, [countClients, fetchJobsRows]);

  const fetchUpcomingEvents = useCallback(async () => {
    setEventsLoading(true);

    try {
      const { data: userResp, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const userId = userResp?.user?.id ?? null;

      const today = new Date().toISOString().slice(0, 10);

      const normalizeEvent = (row: any): UpcomingEvent => ({
        id: String(row.id),
        title: row.title ?? "",
        description: row.description ?? "",
        date: row.event_date ?? "",
        startTime: row.start_time ?? "",
        endTime: row.end_time ?? "",
        type: row.type ?? "event",
        clientName: row.client_name ?? "",
        color: row.color ?? "bg-blue-500",
      });

      const baseQuery = supabase
        .from("calendar_events")
        .select(
          "id,title,description,event_date,start_time,end_time,type,client_name,color,user_id"
        )
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(5);

      if (userId) {
        const filtered = await baseQuery.eq("user_id", userId);
        if (!filtered.error) {
          setUpcomingEvents((filtered.data ?? []).map(normalizeEvent));
          return;
        }

        const msg = filtered.error.message?.toLowerCase?.() ?? "";
        if (!msg.includes("user_id")) {
          console.warn("Upcoming events error:", filtered.error.message);
          setUpcomingEvents([]);
          return;
        }
      }

      const plain = await baseQuery;
      if (plain.error) {
        console.warn("Upcoming events fallback error:", plain.error.message);
        setUpcomingEvents([]);
        return;
      }

      setUpcomingEvents((plain.data ?? []).map(normalizeEvent));
    } catch (e: any) {
      console.error("Upcoming events error:", e?.message ?? e);
      setUpcomingEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  // ✅ ALWAYS fetch once when this page mounts (fixes your "—" issue)
  useEffect(() => {
    fetchDashboardStats();
    fetchUpcomingEvents();
  }, [fetchDashboardStats, fetchUpcomingEvents]);

  // ✅ ALSO refresh when navigating back to dashboard routes
  useEffect(() => {
    if (location.pathname === "/" || location.pathname === "/dashboard") {
      fetchDashboardStats();
      fetchUpcomingEvents();
    }
  }, [location.pathname, fetchDashboardStats, fetchUpcomingEvents]);

  const formatEventTime = (event: UpcomingEvent) => {
    if (!event.date) return "";
    const time = event.startTime ? ` ${event.startTime}` : "";
    const dateObj = new Date(`${event.date}T${event.startTime || "00:00"}`);
    if (Number.isNaN(dateObj.getTime())) return `${event.date}${time}`;
    return `${dateObj.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })}${event.startTime ? ` • ${event.startTime}` : ""}`;
  };

  const cardBase =
    "bg-white rounded-lg shadow p-6 text-left transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
      <p className="text-gray-600 mb-8">Welcome back! Here's what's happening with your business.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <button type="button" className={cardBase} onClick={() => navigate("/clients")}>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Clients</h3>
          <p className="text-3xl font-bold text-gray-800">{loading ? "—" : stats.clientsCount}</p>
          <p className="text-sm text-gray-500 mt-2">→ View clients</p>
        </button>

        <button type="button" className={cardBase} onClick={() => navigate("/jobs")}>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Active Jobs</h3>
          <p className="text-3xl font-bold text-gray-800">{loading ? "—" : stats.activeJobsCount}</p>
          <p className="text-sm text-gray-500 mt-2">→ View jobs</p>
        </button>

        <button type="button" className={cardBase} onClick={() => navigate("/jobs")}>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Completed Jobs</h3>
          <p className="text-3xl font-bold text-gray-800">
            {loading ? "—" : stats.completedJobsCount}
          </p>
          <p className="text-sm text-gray-500 mt-2">→ View completed</p>
        </button>

        <button type="button" className={cardBase} onClick={() => navigate("/jobs")}>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Revenue This Month</h3>
          <p className="text-3xl font-bold text-gray-800">{loading ? "—" : revenueFormatted}</p>
          <p className="text-sm text-gray-500 mt-2">→ View revenue</p>
        </button>
      </div>

      <section className="mb-8">
        <QuickActions isPreview={isPreview} />
      </section>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Events</h2>
        {eventsLoading ? (
          <p className="text-sm text-gray-500">Loading events…</p>
        ) : upcomingEvents.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming events yet.</p>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => navigate("/calendar")}
                className="w-full text-left rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 font-medium text-gray-900 truncate">
                    <span className={`h-2 w-2 rounded-full ${event.color}`} />
                    <span className="truncate">{event.title || "Untitled event"}</span>
                  </span>
                  <span className="text-sm text-gray-500 shrink-0">{formatEventTime(event)}</span>
                </div>
                {(event.description || event.clientName) && (
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    {event.description || event.clientName}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
