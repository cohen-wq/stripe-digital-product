import { useEffect, useState } from "react";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

type InvoiceItem = {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type InvoiceFormPayload = {
  id?: string;
  number: string;
  clientName: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: InvoiceStatus;
  notes?: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  items: InvoiceItem[];
};

interface InvoiceFormProps {
  onSave: (invoiceData: InvoiceFormPayload) => void;
  onClose: () => void;
  initialInvoice?: InvoiceFormPayload | null;
}

export default function InvoiceForm({ onSave, onClose, initialInvoice }: InvoiceFormProps) {
  const isEdit = !!initialInvoice?.id;

  const [formData, setFormData] = useState({
    number: "",
    clientName: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    status: "draft" as InvoiceStatus,
    notes: "",
    taxRate: 0,     // percent
    discountRate: 0 // percent
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 1, description: "", quantity: 1, unitPrice: 0, lineTotal: 0 }
  ]);

  // Prefill for edit
  useEffect(() => {
    if (initialInvoice) {
      setFormData({
        number: initialInvoice.number ?? "",
        clientName: initialInvoice.clientName ?? "",
        invoiceDate: initialInvoice.invoiceDate ?? new Date().toISOString().split("T")[0],
        dueDate: initialInvoice.dueDate ?? "",
        status: (initialInvoice.status ?? "draft") as InvoiceStatus,
        notes: (initialInvoice.notes ?? "") as string,
        taxRate: 0,
        discountRate: 0,
      });

      // Convert initial items
      const initItems = Array.isArray(initialInvoice.items) && initialInvoice.items.length
        ? initialInvoice.items.map((it, idx) => ({
            id: idx + 1,
            description: it.description ?? "",
            quantity: Number(it.quantity ?? 1),
            unitPrice: Number(it.unitPrice ?? 0),
            lineTotal: Number(it.lineTotal ?? (Number(it.quantity ?? 1) * Number(it.unitPrice ?? 0))),
          }))
        : [{ id: 1, description: "", quantity: 1, unitPrice: 0, lineTotal: 0 }];

      setItems(initItems);
    }
  }, [initialInvoice]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "taxRate" || name === "discountRate"
          ? parseFloat(value) || 0
          : value
    }));
  };

  const handleItemChange = (id: number, field: keyof InvoiceItem, value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const next: InvoiceItem = {
          ...item,
          [field]:
            field === "description"
              ? (value as any)
              : (parseFloat(value) || 0)
        };

        // keep lineTotal updated
        const qty = Number(next.quantity ?? 0);
        const unit = Number(next.unitPrice ?? 0);
        next.lineTotal = Number((qty * unit).toFixed(2));

        return next;
      })
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: prev.length + 1, description: "", quantity: 1, unitPrice: 0, lineTotal: 0 }
    ]);
  };

  const removeItem = (id: number) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.lineTotal ?? 0), 0);
    const tax = subtotal * (formData.taxRate / 100);
    const discount = subtotal * (formData.discountRate / 100);
    const total = subtotal + tax - discount;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  };

  const totals = calculateTotals();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: InvoiceFormPayload = {
      id: initialInvoice?.id,
      number: formData.number,
      clientName: formData.clientName,
      invoiceDate: formData.invoiceDate,
      dueDate: formData.dueDate,
      status: formData.status,
      notes: formData.notes,
      subtotal: totals.subtotal,
      tax: totals.tax,
      discount: totals.discount,
      total: totals.total,
      items: items.map((it, idx) => ({
        id: idx + 1,
        description: it.description,
        quantity: Number(it.quantity ?? 0),
        unitPrice: Number(it.unitPrice ?? 0),
        lineTotal: Number(it.lineTotal ?? 0),
      })),
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {isEdit ? "Edit Invoice" : "Generate Invoice"}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  name="number"
                  value={formData.number}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="INV-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  name="invoiceDate"
                  value={formData.invoiceDate}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-3">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client/Business Name *
                  </label>
                  <input
                    type="text"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter client/business name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-700">Invoice Items</h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + Add Item
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Item description"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        min="1"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="relative">
                        <span className="absolute left-3 top-2">$</span>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(item.id, "unitPrice", e.target.value)}
                          className="w-full px-3 py-2 pl-7 border border-gray-300 rounded-md"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="font-medium">${item.lineTotal.toFixed(2)}</span>
                    </div>
                    <div className="col-span-1">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes or terms"
                />
              </div>

              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm text-gray-600">Tax Rate:</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        name="taxRate"
                        value={formData.taxRate}
                        onChange={handleFormChange}
                        className="w-16 px-2 py-1 border rounded"
                        min="0"
                        max="100"
                      />
                      <span className="ml-1">%</span>
                    </div>
                  </div>
                  <span className="font-medium">${totals.tax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm text-gray-600">Discount:</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        name="discountRate"
                        value={formData.discountRate}
                        onChange={handleFormChange}
                        className="w-16 px-2 py-1 border rounded"
                        min="0"
                        max="100"
                      />
                      <span className="ml-1">%</span>
                    </div>
                  </div>
                  <span className="font-medium text-red-600">-${totals.discount.toFixed(2)}</span>
                </div>

                <div className="pt-3 border-t">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition"
              >
                {isEdit ? "Save Changes" : "Generate Invoice"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
