import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "../lib/supabase";

type Client = {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  created_at: string;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    setLoading(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      // If not signed in, page should be empty (auth gate should handle routing anyway)
      if (!session?.user) {
        setClients([]);
        return;
      }

      const { data, error } = await supabase
        .from("clients")
        .select("id,name,email,company,created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setClients((data as Client[]) || []);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to load clients");
      setClients([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddClient() {
    if (!name.trim()) return;

    setSaving(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.user) throw new Error("Not signed in");

      const payload = {
        user_id: session.user.id,
        name: name.trim(),
        email: email.trim() ? email.trim() : null,
        company: company.trim() ? company.trim() : null,
      };

      const { error } = await supabase.from("clients").insert(payload);
      if (error) throw error;

      setName("");
      setEmail("");
      setCompany("");
      setShowAdd(false);

      await loadClients();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to add client");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-gray-500">Manage your clients. Starts empty for new users.</p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* ADD CLIENT FORM */}
      {showAdd && (
        <div className="bg-white border rounded-md p-4 space-y-3">
          <input
            placeholder="Client name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          <input
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />

          <div className="flex gap-2">
            <button
              onClick={handleAddClient}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              disabled={saving}
              className="px-4 py-2 border rounded disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* CLIENT LIST */}
      <div className="bg-white border rounded-md">
        {loading && <div className="p-6 text-gray-500">Loading clients…</div>}

        {!loading && clients.length === 0 && (
          <div className="p-6 text-gray-500">No clients yet. Add your first one.</div>
        )}

        {!loading &&
          clients.map((client) => (
            <div key={client.id} className="p-4 border-t flex justify-between">
              <div>
                <div className="font-medium">{client.name}</div>
                <div className="text-sm text-gray-500">
                  {client.company || "—"} • {client.email || "—"}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
