import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, Lock } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ClientForm from "../components/forms/ClientForm";
import { supabase } from "../lib/supabase";

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  created_at: string;
};

export default function ClientsPage({ isPreview }: { isPreview: boolean }) {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();

  const goSubscribe = () => navigate("/billing");

  const upgradePrompt = () => {
    // keep it simple + obvious
    goSubscribe();
  };

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("id, name, email, phone, company, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading clients:", error);
      setClients([]);
      setLoading(false);
      return;
    }

    setClients((data as Client[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Auto-open add flow if arriving with ?new=1
  useEffect(() => {
    const shouldOpen = searchParams.get("new") === "1";
    if (shouldOpen && !isPreview) setShowAdd(true);
  }, [searchParams, isPreview]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const name = (c.name ?? "").toLowerCase();
      const email = (c.email ?? "").toLowerCase();
      const company = (c.company ?? "").toLowerCase();
      const phone = (c.phone ?? "").toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        company.includes(q) ||
        phone.includes(q)
      );
    });
  }, [clients, search]);

  const handleCloseForm = () => {
    setShowAdd(false);
    setEditingClient(null);

    // Clear ?new=1 if it exists so refreshes/back nav don’t keep reopening
    if (searchParams.get("new") === "1") {
      const next = new URLSearchParams(searchParams);
      next.delete("new");
      setSearchParams(next, { replace: true });
    }
  };

  const handleSaveClient = async () => {
    if (isPreview) return;
    try {
      setSaving(true);
      await fetchClients();
      handleCloseForm();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (client: Client) => {
    if (isPreview) return upgradePrompt();
    setEditingClient(client);
    setShowAdd(true);
  };

  const handleDelete = async (client: Client) => {
    if (isPreview) return upgradePrompt();

    const ok = confirm(`Delete "${client.name}"? This cannot be undone.`);
    if (!ok) return;

    try {
      setSaving(true);

      const { error } = await supabase.from("clients").delete().eq("id", client.id);
      if (error) {
        console.error("Delete client error:", error);
        alert(error.message ?? "Failed to delete client");
        return;
      }

      // Update UI immediately
      setClients((prev) => prev.filter((c) => c.id !== client.id));

      // If we were editing this client, close the form
      if (editingClient?.id === client.id) {
        handleCloseForm();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Preview banner */}
      {isPreview && (
        <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-blue-700">
                <Lock size={18} />
              </div>
              <div>
                <p className="font-semibold text-blue-900">Preview mode</p>
                <p className="text-sm text-blue-800">
                  You can view the Clients page, but creating, editing, and deleting are locked.
                  Subscribe to unlock.
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

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-800">
            Clients
            {isPreview && <Lock size={20} className="text-blue-700" />}
          </h1>
          <p className="text-gray-600">Manage your client list and contact info.</p>
        </div>

        <button
          onClick={() => {
            if (isPreview) return upgradePrompt();
            setEditingClient(null);
            setShowAdd(true);
          }}
          disabled={isPreview}
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-white shadow transition ${
            isPreview
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          title={isPreview ? "Subscribe to unlock" : "Add Client"}
        >
          <Plus size={18} />
          Add Client
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="text-gray-500">
            <Search size={18} />
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients by name, email, phone, or company..."
            className="w-full outline-none text-gray-800"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="text-gray-600">Loading clients...</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-600">
            <p className="font-medium">No clients yet.</p>
            <p className="text-sm mt-1">Click “Add Client” to create your first client.</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isPreview ? "opacity-95" : ""}`}>
            {filtered.map((c) => (
              <div key={c.id} className="border rounded-lg p-4 hover:shadow-sm transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-gray-800">{c.name}</h3>
                    {c.company ? (
                      <p className="text-sm text-gray-600">{c.company}</p>
                    ) : (
                      <p className="text-sm text-gray-400">No company</p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(c)}
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
                      type="button"
                      onClick={() => handleDelete(c)}
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

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div>
                    {c.email ? (
                      <p className="text-sm text-gray-700">{c.email}</p>
                    ) : (
                      <p className="text-sm text-gray-400">No email</p>
                    )}
                    {c.phone ? (
                      <p className="text-sm text-gray-700">{c.phone}</p>
                    ) : (
                      <p className="text-sm text-gray-400">No phone</p>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Only allow form for paid/admin */}
      {!isPreview && showAdd && (
        <ClientForm
          onSave={handleSaveClient}
          onClose={handleCloseForm}
          initialClient={editingClient}
        />
      )}

      {saving && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow px-4 py-3 text-gray-800">Saving...</div>
        </div>
      )}
    </div>
  );
}
