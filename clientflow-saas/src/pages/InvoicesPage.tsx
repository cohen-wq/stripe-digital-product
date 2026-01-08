import { useEffect, useMemo, useState } from "react";
import { Plus, Search, FileText, Download, Trash2, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import InvoiceForm from "../components/forms/InvoiceForm";
import { supabase } from "../lib/supabase";
import {
  downloadInvoicePdf,
  type PdfInvoice,
  type PdfInvoiceItem,
} from "../lib/invoicePdf";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

type Invoice = {
  id: string;
  number: string;
  clientName: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  total: number;
  status: InvoiceStatus;
  user_id: string;
};

type FormItem = {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type InvoiceFormPayload = {
  id?: string; // present when editing
  number: string;
  clientName: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  notes?: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  items: FormItem[];
};

const statusStyles: Record<InvoiceStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-gray-200 text-gray-700",
};

export default function InvoicesPage({ isPreview }: { isPreview: boolean }) {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [showAddInvoice, setShowAddInvoice] = useState(false);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingInvoice, setEditingInvoice] = useState<InvoiceFormPayload | null>(
    null
  );
  const [loadingEdit, setLoadingEdit] = useState(false);

  const today = () => new Date().toISOString().slice(0, 10);

  const goSubscribe = () => navigate("/billing");
  const upgradePrompt = () => goSubscribe();

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

      const { data, error } = await supabase
        .from("invoices")
        .select("id, number, client_name, invoice_date, due_date, total, status, user_id")
        .eq("user_id", session.user.id)
        .order("invoice_date", { ascending: false });

      if (error) throw error;

      const normalized: Invoice[] = (data || []).map((row: any) => ({
        id: String(row.id),
        number: row.number ?? "",
        clientName: row.client_name ?? "",
        invoiceDate: row.invoice_date ?? today(),
        dueDate: row.due_date ?? today(),
        total: Number(row.total ?? 0),
        status: (row.status ?? "draft") as InvoiceStatus,
        user_id: row.user_id,
      }));

      setInvoices(normalized);
    } catch (err) {
      console.error(err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ✅ Create OR Update invoice + items (based on payload.id)
  const handleSaveInvoice = async (payload: InvoiceFormPayload) => {
    if (isPreview) return upgradePrompt();

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.user) throw new Error("Not signed in");

      const userId = session.user.id;

      const invoicePayload = {
        user_id: userId,
        number: payload.number ?? `INV-${1000 + invoices.length + 1}`,
        client_name: payload.clientName ?? "",
        invoice_date: payload.invoiceDate ?? today(),
        due_date: payload.dueDate ?? today(),
        status: (payload.status ?? "draft") as InvoiceStatus,
        notes: payload.notes ?? null,
        currency: "USD",
        subtotal: Number(payload.subtotal ?? 0),
        tax: Number(payload.tax ?? 0),
        discount: Number(payload.discount ?? 0),
        total: Number(payload.total ?? 0),
      };

      // EDIT: update invoice
      if (payload.id) {
        const { data: updatedInvoice, error: updErr } = await supabase
          .from("invoices")
          .update(invoicePayload)
          .eq("id", payload.id)
          .eq("user_id", userId)
          .select(
            "id, number, client_name, invoice_date, due_date, subtotal, tax, discount, total, status, currency, notes, user_id"
          )
          .single();

        if (updErr) throw updErr;

        const invoiceId = String((updatedInvoice as any).id);

        // Replace items: delete old then insert current
        const { error: delItemsErr } = await supabase
          .from("invoice_items")
          .delete()
          .eq("invoice_id", invoiceId)
          .eq("user_id", userId);

        if (delItemsErr) throw delItemsErr;

        const itemRows = (payload.items || []).map((it, idx) => ({
          user_id: userId,
          invoice_id: invoiceId,
          description: String(it.description ?? "").trim(),
          quantity: Number(it.quantity ?? 0),
          unit_price: Number(it.unitPrice ?? 0),
          line_total: Number(
            it.lineTotal ?? Number(it.quantity ?? 0) * Number(it.unitPrice ?? 0)
          ),
          sort_order: idx,
        }));

        if (itemRows.length > 0) {
          const { error: itemsErr } = await supabase.from("invoice_items").insert(itemRows);
          if (itemsErr) throw itemsErr;
        }

        const updatedForList: Invoice = {
          id: invoiceId,
          number: (updatedInvoice as any).number ?? "",
          clientName: (updatedInvoice as any).client_name ?? "",
          invoiceDate: (updatedInvoice as any).invoice_date ?? today(),
          dueDate: (updatedInvoice as any).due_date ?? today(),
          total: Number((updatedInvoice as any).total ?? 0),
          status: ((updatedInvoice as any).status ?? "draft") as InvoiceStatus,
          user_id: (updatedInvoice as any).user_id,
        };

        setInvoices((prev) => prev.map((x) => (x.id === invoiceId ? updatedForList : x)));
        setEditingInvoice(null);
        setShowAddInvoice(false);
        return;
      }

      // CREATE: insert invoice
      const { data: createdInvoice, error: invErr } = await supabase
        .from("invoices")
        .insert(invoicePayload)
        .select(
          "id, number, client_name, invoice_date, due_date, subtotal, tax, discount, total, status, currency, notes, user_id"
        )
        .single();

      if (invErr) throw invErr;

      const invoiceId = String((createdInvoice as any).id);

      const itemRows = (payload.items || []).map((it, idx) => ({
        user_id: userId,
        invoice_id: invoiceId,
        description: String(it.description ?? "").trim(),
        quantity: Number(it.quantity ?? 0),
        unit_price: Number(it.unitPrice ?? 0),
        line_total: Number(
          it.lineTotal ?? Number(it.quantity ?? 0) * Number(it.unitPrice ?? 0)
        ),
        sort_order: idx,
      }));

      if (itemRows.length > 0) {
        const { error: itemsErr } = await supabase.from("invoice_items").insert(itemRows);
        if (itemsErr) throw itemsErr;
      }

      const createdForList: Invoice = {
        id: invoiceId,
        number: (createdInvoice as any).number ?? "",
        clientName: (createdInvoice as any).client_name ?? "",
        invoiceDate: (createdInvoice as any).invoice_date ?? today(),
        dueDate: (createdInvoice as any).due_date ?? today(),
        total: Number((createdInvoice as any).total ?? 0),
        status: ((createdInvoice as any).status ?? "draft") as InvoiceStatus,
        user_id: (createdInvoice as any).user_id,
      };

      setInvoices((prev) => [createdForList, ...prev]);
      setShowAddInvoice(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save invoice. Check console for details.");
    }
  };

  const handleEditInvoice = async (invoiceId: string) => {
    if (isPreview) return upgradePrompt();

    setLoadingEdit(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.user) throw new Error("Not signed in");

      const { data: inv, error: invErr } = await supabase
        .from("invoices")
        .select("id, number, client_name, invoice_date, due_date, status, notes, subtotal, tax, discount, total")
        .eq("id", invoiceId)
        .single();

      if (invErr) throw invErr;

      const { data: items, error: itemsErr } = await supabase
        .from("invoice_items")
        .select("id, description, quantity, unit_price, line_total, sort_order")
        .eq("invoice_id", invoiceId)
        .order("sort_order", { ascending: true });

      if (itemsErr) throw itemsErr;

      const formItems: FormItem[] = (items || []).map((it: any, idx: number) => ({
        id: idx + 1,
        description: it.description ?? "",
        quantity: Number(it.quantity ?? 1),
        unitPrice: Number(it.unit_price ?? 0),
        lineTotal: Number(it.line_total ?? 0),
      }));

      setEditingInvoice({
        id: String(inv.id),
        number: inv.number ?? "",
        clientName: inv.client_name ?? "",
        invoiceDate: inv.invoice_date ?? today(),
        dueDate: inv.due_date ?? today(),
        status: (inv.status ?? "draft") as InvoiceStatus,
        notes: inv.notes ?? "",
        subtotal: Number(inv.subtotal ?? 0),
        tax: Number(inv.tax ?? 0),
        discount: Number(inv.discount ?? 0),
        total: Number(inv.total ?? 0),
        items:
          formItems.length
            ? formItems
            : [{ id: 1, description: "", quantity: 1, unitPrice: 0, lineTotal: 0 }],
      });

      setShowAddInvoice(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load invoice for editing.");
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (isPreview) return upgradePrompt();

    const ok = confirm("Delete this invoice? This cannot be undone.");
    if (!ok) return;

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.user) throw new Error("Not signed in");

      const userId = session.user.id;

      const { error: delItemsErr } = await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", invoiceId)
        .eq("user_id", userId);

      if (delItemsErr) throw delItemsErr;

      const { error: delInvErr } = await supabase
        .from("invoices")
        .delete()
        .eq("id", invoiceId)
        .eq("user_id", userId);

      if (delInvErr) throw delInvErr;

      setInvoices((prev) => prev.filter((x) => x.id !== invoiceId));

      if (editingInvoice?.id === invoiceId) {
        setEditingInvoice(null);
        setShowAddInvoice(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete invoice.");
    }
  };

  const handleDownloadPdf = async (invoiceId: string) => {
    if (isPreview) return upgradePrompt();

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.user) throw new Error("Not signed in");

      const { data: inv, error: invErr } = await supabase
        .from("invoices")
        .select(
          "id, number, status, currency, client_name, client_email, client_company, invoice_date, due_date, subtotal, tax, discount, total, notes, user_id"
        )
        .eq("id", invoiceId)
        .single();

      if (invErr) throw invErr;
      if (!inv) throw new Error("Invoice not found");

      const { data: items, error: itemsErr } = await supabase
        .from("invoice_items")
        .select("description, quantity, unit_price, line_total, sort_order")
        .eq("invoice_id", invoiceId)
        .order("sort_order", { ascending: true });

      if (itemsErr) throw itemsErr;

      const pdfInvoice: PdfInvoice = {
        number: inv.number ?? "INV",
        status: inv.status ?? "draft",
        currency: inv.currency ?? "USD",
        clientName: inv.client_name ?? "",
        clientEmail: inv.client_email ?? null,
        clientCompany: inv.client_company ?? null,
        invoiceDate: inv.invoice_date ?? today(),
        dueDate: inv.due_date ?? today(),
        subtotal: Number(inv.subtotal ?? 0),
        tax: Number(inv.tax ?? 0),
        discount: Number(inv.discount ?? 0),
        total: Number(inv.total ?? 0),
        notes: inv.notes ?? null,
      };

      const pdfItems: PdfInvoiceItem[] = (items || []).map((it: any) => ({
        description: it.description ?? "",
        quantity: Number(it.quantity ?? 0),
        unitPrice: Number(it.unit_price ?? 0),
        lineTotal: Number(it.line_total ?? 0),
      }));

      downloadInvoicePdf(pdfInvoice, pdfItems);
    } catch (err) {
      console.error(err);
      alert("Failed to download PDF.");
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
                  You can view invoices, but creating, editing, deleting, and PDF download are locked.
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

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-800">
            Invoices
            {isPreview && <Lock size={20} className="text-blue-700" />}
          </h1>
          <p className="text-gray-600">Create and track invoices for your clients</p>
        </div>

        <button
          onClick={() => {
            if (isPreview) return upgradePrompt();
            setEditingInvoice(null);
            setShowAddInvoice(true);
          }}
          disabled={isPreview}
          className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-white transition ${
            isPreview ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
          title={isPreview ? "Subscribe to unlock" : "New Invoice"}
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
              onClick={() => {
                if (isPreview) return upgradePrompt();
                setEditingInvoice(null);
                setShowAddInvoice(true);
              }}
              disabled={isPreview}
              className={`rounded-md px-4 py-2 text-white transition ${
                isPreview ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              Create your first invoice
            </button>
          </div>
        ) : (
          <div className={`w-full overflow-x-auto ${isPreview ? "opacity-95" : ""}`}>
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-700">
                <tr>
                  <th className="px-6 py-3">Invoice</th>
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Due</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{inv.number}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{inv.clientName}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(inv.invoiceDate).toLocaleDateString()}
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

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditInvoice(inv.id)}
                          className={`px-3 py-2 text-sm rounded-lg border transition ${
                            isPreview
                              ? "text-gray-300 border-gray-200 cursor-not-allowed"
                              : "hover:bg-gray-50"
                          }`}
                          disabled={isPreview || loadingEdit}
                          title={isPreview ? "Subscribe to unlock" : "Edit"}
                        >
                          {loadingEdit ? "Loading..." : "Edit"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className={`px-3 py-2 text-sm rounded-lg border transition ${
                            isPreview
                              ? "text-gray-300 border-gray-200 cursor-not-allowed"
                              : "hover:bg-gray-50"
                          }`}
                          disabled={isPreview}
                          title={isPreview ? "Subscribe to unlock" : "Delete"}
                        >
                          <Trash2 size={16} />
                        </button>

                        <button
                          onClick={() => handleDownloadPdf(inv.id)}
                          className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
                            isPreview
                              ? "border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed"
                              : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                          }`}
                          disabled={isPreview}
                          title={isPreview ? "Subscribe to unlock" : "Download PDF"}
                        >
                          <Download className="h-4 w-4" />
                          Download PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paid/admin only */}
      {!isPreview && showAddInvoice && (
        <InvoiceForm
          onClose={() => {
            setShowAddInvoice(false);
            setEditingInvoice(null);
          }}
          onSave={handleSaveInvoice}
          initialInvoice={editingInvoice}
        />
      )}
    </div>
  );
}
