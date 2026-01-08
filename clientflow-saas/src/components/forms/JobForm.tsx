import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type JobStatus = "planned" | "in_progress" | "awaiting_payment" | "completed";

type Client = {
  id: string;
  name: string;
  company?: string | null;
};

export type Job = {
  id?: string;
  client_id?: string | null;
  title: string;
  description?: string | null;
  status: JobStatus;
  start_date?: string | null; // yyyy-mm-dd
  due_date?: string | null;   // yyyy-mm-dd
  amount_estimated?: number | null; // matches DB column
};

export default function JobForm({
  job,
  onClose,
  onSaved,
}: {
  job?: Job | null;
  onClose: () => void;
  onSaved: () => void; // IMPORTANT: we use onSaved everywhere (not onSave)
}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [form, setForm] = useState<Job>({
    client_id: null,
    title: "",
    description: "",
    status: "planned",
    start_date: null,
    due_date: null,
    amount_estimated: 0,
  });

  useEffect(() => {
    if (job) {
      setForm({
        id: job.id,
        client_id: job.client_id ?? null,
        title: job.title ?? "",
        description: job.description ?? "",
        status: job.status ?? "planned",
        start_date: job.start_date ?? null,
        due_date: job.due_date ?? null,
        amount_estimated: Number(job.amount_estimated ?? 0),
      });
    } else {
      setForm({
        client_id: null,
        title: "",
        description: "",
        status: "planned",
        start_date: null,
        due_date: null,
        amount_estimated: 0,
      });
    }
  }, [job]);

  useEffect(() => {
    const fetchClients = async () => {
      // If your clients table exists, this will populate the dropdown.
      const { data } = await supabase
        .from("clients")
        .select("id, name, company")
        .order("created_at", { ascending: false });

      setClients((data as Client[]) || []);
    };

    fetchClients();
  }, []);

  const setField = (key: keyof Job, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    setErrorMsg("");
    const title = (form.title ?? "").trim();
    if (!title) {
      setErrorMsg("Title is required.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      setLoading(false);
      setErrorMsg("You must be signed in to save a job.");
      return;
    }

    const payload = {
      user_id: user.id,
      client_id: form.client_id ?? null,
      title,
      description: form.description ?? "",
      status: form.status,
      start_date: form.start_date || null,
      due_date: form.due_date || null,
      amount_estimated: Number(form.amount_estimated ?? 0),
    };

    const res = job?.id
      ? await supabase.from("jobs").update(payload).eq("id", job.id)
      : await supabase.from("jobs").insert(payload);

    if (res.error) {
      setLoading(false);
      setErrorMsg(res.error.message);
      return;
    }

    setLoading(false);
    onSaved();   // refresh the list
    onClose();   // close the modal
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-3xl rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">{job ? "Edit Job" : "New Job"}</h2>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-black">
            Close
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 text-sm text-red-600">
            {errorMsg}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="text-sm text-gray-600">Client (optional)</label>
            <select
              value={form.client_id ?? ""}
              onChange={(e) => setField("client_id", e.target.value || null)}
              className="w-full mt-2 border rounded-lg px-3 py-2"
            >
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.company ? ` — ${c.company}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600">Title</label>
            <input
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              className="w-full mt-2 border rounded-lg px-3 py-2"
              placeholder="Application Build"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Description</label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) => setField("description", e.target.value)}
              className="w-full mt-2 border rounded-lg px-3 py-2 min-h-[120px]"
              placeholder="Optional details…"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-sm text-gray-600">Status</label>
              <select
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
                className="w-full mt-2 border rounded-lg px-3 py-2"
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="awaiting_payment">Awaiting Payment</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600">Estimated Amount ($)</label>
              <input
                type="number"
                value={Number(form.amount_estimated ?? 0)}
                onChange={(e) => setField("amount_estimated", e.target.value)}
                className="w-full mt-2 border rounded-lg px-3 py-2"
                placeholder="5000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-sm text-gray-600">Start date</label>
              <input
                type="date"
                value={form.start_date ?? ""}
                onChange={(e) => setField("start_date", e.target.value || null)}
                className="w-full mt-2 border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Due date</label>
              <input
                type="date"
                value={form.due_date ?? ""}
                onChange={(e) => setField("due_date", e.target.value || null)}
                className="w-full mt-2 border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button onClick={onClose} className="px-5 py-2 rounded-lg border">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-black text-white disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Job"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
