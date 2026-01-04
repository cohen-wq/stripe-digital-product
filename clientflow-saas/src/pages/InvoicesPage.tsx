import { useEffect, useMemo, useState } from "react";
import { Plus, Search, FileText } from "lucide-react";
import InvoiceForm from "../components/forms/InvoiceForm";
import { supabase } from "../lib/supabase";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

type Invoice = {
  id: string;
  number: string;
  clientName: string;
  date: string;
  dueDate: string;
  total: number;
  status: InvoiceStatus;
  user_id: string;
};

const statusStyles: Record<InvoiceStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-gray-200 text-gray-700",
};

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddInvoice, setShowAddInvoice] = useState(false);

  // Real data only (starts empty for new users)
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session?.user) {
        setInvoices([]);
        return;
      }

      // Common DB naming: client_name, due_date, assigned snake_case
      const { data, error } = await supabase
        .from("invoices")
        .select("id,number,client_name,date,due_date,total,status,user_id")
        .order("date", { ascending: false });

      if (error) throw error;

      const normalized: Invoice[] = (data || []).map((row: any) => ({
        id: String(row.id),
        number: row.number ?? "",
        clientName: row.client_name ?? "",
        date: row.date ?? new Date().toISOString().slice(0, 10),
        dueDate: row.due_date ?? new Date().toISOString().slice(0, 10),
        total: Number(row.total ?? 0),
        status: (row.status ?? "draft") as InvoiceStatus,
        user_id: row.user_id,
      }));

      setInvoices(normalized);
    } catch (err) {
      // No popups — log + show empty UI
      console.error(err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return invoices;

    return invoices.filter((inv) => {
      return (
        inv.number.toLowerCase().includes(q) ||
        inv.clientName.toLowerCase().includes(q) ||
        inv.status.toLowerCase().includes(q)
      );
    });
  }, [invoices, searchTerm]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const handleCreateInvoice = async (newInvoice: any) => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.user) throw new Error("Not signed in");

      const payload = {
        user_id: session.user.id,
        number: newInvoice?.number ?? `INV-${1000 + invoices.length + 1}`,
        client_name: newInvoice?.clientName ?? "",
        date: newInvoice?.date ?? new Date().toISOString().slice(0, 10),
        due_date: newInvoice?.dueDate ?? new Date().toISOString().slice(0, 10),
        total: Number(newInvoice?.total ?? 0),
        status: (newInvoice?.status ?? "draft") as InvoiceStatus,
      };

      const { data, error } = await supabase
        .from("invoices")
        .insert(payload)
        .select("id,number,client_name,date,due_date,total,status,user_id")
        .single();

      if (error) throw error;

      const created: Invoice = {
        id: String((data as any).id),
        number: (data as any).number ?? "",
        clientName: (data as any).client_name ?? "",
        date: (data as any).date ?? new Date().toISOString().slice(0, 10),
        dueDate: (data as any).due_date ?? new Date().toISOString().slice(0, 10),
        total: Number((data as any).total ?? 0),
        status: ((data as any).status ?? "draft") as InvoiceStatus,
        user_id: (data as any).user_id,
      };

      setInvoices((prev) => [created, ...prev]);
      setShowAddInvoice(false);
    } catch (err) {
      console.error(err);
      // No popups
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Invoices</h1>
          <p className="text-gray-600">Create and track invoices for your clients</p>
        </div>

        <button
          onClick={() => setShowAddInvoice(true)}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          New Invoice
        </button>
      </div>

      {/* Controls */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by invoice number, client, or status..."
            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <div className="border-b bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <FileText className="h-4 w-4" />
            Billing History
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-14 text-center">
            <div className="text-gray-500">Loading invoices...</div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mb-2 text-gray-500">No invoices found.</div>
            <button
              onClick={() => setShowAddInvoice(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
            >
              Create your first invoice
            </button>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-700">
                <tr>
                  <th className="px-6 py-3">Invoice</th>
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Due</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{inv.number}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{inv.clientName}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(inv.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(inv.total)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[inv.status]}`}
                      >
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Form Modal */}
      {showAddInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Create Invoice</h2>
              <button
                onClick={() => setShowAddInvoice(false)}
                className="rounded-md px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="p-6">
              <InvoiceForm
                onClose={() => setShowAddInvoice(false)}
                onSave={(newInvoice: any) => {
                  handleCreateInvoice(newInvoice);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
