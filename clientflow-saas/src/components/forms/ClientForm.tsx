import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { createClient, type ClientRow } from "../../lib/db";

type Props = {
  onSave: (client: ClientRow) => void;
  onClose: () => void;
  initialClient?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
  } | null;
};

export default function ClientForm({ onSave, onClose, initialClient }: Props) {
  const isEdit = !!initialClient?.id;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Prefill when editing (or when switching which client is being edited)
  useEffect(() => {
    if (initialClient) {
      setName(initialClient.name ?? "");
      setEmail(initialClient.email ?? "");
      setPhone(initialClient.phone ?? "");
      setCompany(initialClient.company ?? "");
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setCompany("");
    }
  }, [initialClient]);

  async function handleSubmit() {
    if (!name.trim()) {
      setErrorMsg("Client name is required.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);

      if (isEdit && initialClient?.id) {
        // Update existing client
        const { data, error } = await supabase
          .from("clients")
          .update({
            name: name.trim(),
            email: email.trim() ? email.trim() : null,
            phone: phone.trim() ? phone.trim() : null,
            company: company.trim() ? company.trim() : null,
          })
          .eq("id", initialClient.id)
          .select("*")
          .single();

        if (error) throw error;

        // Keep the parent flow the same: call onSave then close
        onSave(data as ClientRow);
        onClose();
        return;
      }

      // Create new client (your existing helper)
      const newClient = await createClient({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        company: company.trim(),
      });

      onSave(newClient);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message ?? "Failed to save client");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Client" : "Add Client"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 p-6">
          {errorMsg && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Client Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Acme Co"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="contact@acme.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">
                Phone
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Company
            </label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Acme Incorporated"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              className="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Save Client"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
