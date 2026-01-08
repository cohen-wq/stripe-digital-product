import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, Lock } from "lucide-react";
import { supabase } from "../lib/supabase";
import JobForm from "../components/forms/JobForm";
import type { Job } from "../components/forms/JobForm"; // ✅ type-only import
import { useNavigate, useSearchParams } from "react-router-dom";

type JobRow = {
  id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  status: "planned" | "in_progress" | "awaiting_payment" | "completed";
  start_date: string | null;
  due_date: string | null;
  amount_estimated: number | null;
  created_at: string;
  clients?: { name: string | null } | null;
};

export default function JobsPage({ isPreview }: { isPreview: boolean }) {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<JobRow | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const goSubscribe = () => navigate("/billing");
  const upgradePrompt = () => goSubscribe();

  const fetchJobs = async () => {
    // Try join with clients(name). If it fails, fallback to plain select.
    const joined = await supabase
      .from("jobs")
      .select("*, clients(name)")
      .order("created_at", { ascending: false });

    if (!joined.error) {
      setJobs((joined.data as JobRow[]) || []);
      return;
    }

    const plain = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    setJobs((plain.data as JobRow[]) || []);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // ✅ Auto-open create flow if arriving with ?new=1 (paid only)
  useEffect(() => {
    if (searchParams.get("new") === "1" && !isPreview) {
      setSelected(null);
      setShowForm(true);
    }
  }, [searchParams, isPreview]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;

    return jobs.filter((j) => {
      const clientName = (j.clients?.name ?? "").toLowerCase();
      return (
        j.title.toLowerCase().includes(q) ||
        (j.description ?? "").toLowerCase().includes(q) ||
        clientName.includes(q)
      );
    });
  }, [jobs, search]);

  const openNew = () => {
    if (isPreview) return upgradePrompt();
    setSelected(null);
    setShowForm(true);
  };

  const openEdit = (row: JobRow) => {
    if (isPreview) return upgradePrompt();
    setSelected(row);
    setShowForm(true);
  };

  const deleteJob = async (id: string) => {
    if (isPreview) return upgradePrompt();

    const ok = confirm("Delete this job? This cannot be undone.");
    if (!ok) return;

    await supabase.from("jobs").delete().eq("id", id);
    fetchJobs();
  };

  const toJobForm = (row: JobRow): Job => ({
    id: row.id,
    client_id: row.client_id,
    title: row.title,
    description: row.description ?? "",
    status: row.status,
    start_date: row.start_date,
    due_date: row.due_date,
    amount_estimated: Number(row.amount_estimated ?? 0),
  });

  const handleCloseForm = () => {
    setShowForm(false);

    // ✅ Clear ?new=1 so refresh/back nav doesn’t keep reopening
    if (searchParams.get("new") === "1") {
      const next = new URLSearchParams(searchParams);
      next.delete("new");
      setSearchParams(next, { replace: true });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Preview banner */}
      {isPreview && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-blue-700">
                <Lock size={18} />
              </div>
              <div>
                <p className="font-semibold text-blue-900">Preview mode</p>
                <p className="text-sm text-blue-800">
                  You can view Jobs & Projects, but creating, editing, and deleting are locked.
                  Subscribe to unlock actions.
                </p>
              </div>
            </div>

            <button
              onClick={goSubscribe}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Subscribe to unlock
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            Jobs & Projects
            {isPreview && <Lock size={18} className="text-blue-700" />}
          </h1>
          <p className="text-sm text-gray-500">
            Manage all your projects, track progress, and meet deadlines.
          </p>
        </div>

        <button
          onClick={openNew}
          disabled={isPreview}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition ${
            isPreview ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
          title={isPreview ? "Subscribe to unlock" : "Add Job"}
        >
          <Plus size={18} /> Add Job
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs by title or client..."
            className="w-full pl-10 pr-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div className={`grid gap-3 ${isPreview ? "opacity-95" : ""}`}>
        {filtered.map((j) => (
          <div key={j.id} className="border rounded-xl p-4 bg-white">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-gray-500">
                  {j.clients?.name ? `Client: ${j.clients.name}` : "No client"}
                </div>

                <div
                  className={`mt-1 font-semibold ${
                    isPreview ? "text-gray-900" : "cursor-pointer hover:underline"
                  }`}
                  onClick={() => {
                    if (isPreview) return upgradePrompt();
                    openEdit(j);
                  }}
                  title={isPreview ? "Subscribe to unlock editing" : "Edit"}
                >
                  {j.title}
                </div>

                {j.description && (
                  <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {j.description}
                  </div>
                )}

                <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-3">
                  {j.start_date && <div>Start: {j.start_date}</div>}
                  {j.due_date && <div>Due: {j.due_date}</div>}
                  <div>${Number(j.amount_estimated ?? 0).toFixed(2)}</div>
                  <div className="capitalize">{j.status.replace("_", " ")}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(j)}
                  disabled={isPreview}
                  className={`px-3 py-2 text-sm rounded-lg border transition ${
                    isPreview
                      ? "text-gray-300 border-gray-200 cursor-not-allowed"
                      : "hover:bg-gray-50"
                  }`}
                  title={isPreview ? "Subscribe to unlock" : "Edit"}
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteJob(j.id)}
                  disabled={isPreview}
                  className={`px-3 py-2 text-sm rounded-lg border transition ${
                    isPreview
                      ? "text-gray-300 border-gray-200 cursor-not-allowed"
                      : "hover:bg-gray-50"
                  }`}
                  title={isPreview ? "Subscribe to unlock" : "Delete"}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-sm text-gray-500">No jobs found.</div>
        )}
      </div>

      {/* Paid/admin only */}
      {!isPreview && showForm && (
        <JobForm
          job={selected ? toJobForm(selected) : null}
          onClose={handleCloseForm}
          onSaved={fetchJobs} // ✅ correct prop name
        />
      )}
    </div>
  );
}
