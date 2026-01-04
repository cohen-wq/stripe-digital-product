import { useState } from 'react';

interface InvoiceItem {
    id: number;
    description: string;
    quantity: number;
    price: number;
}

interface InvoiceFormProps {
    onSave: (invoiceData: any) => void;
    onClose: () => void;
}

export default function InvoiceForm({ onSave, onClose }: InvoiceFormProps) {
    const [formData, setFormData] = useState({
        clientName: '',
        invoiceNumber: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        status: 'draft',
        notes: '',
        taxRate: 0,
        discount: 0
    });

    const [items, setItems] = useState<InvoiceItem[]>([
        { id: 1, description: '', quantity: 1, price: 0 }
    ]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'taxRate' || name === 'discount' ? parseFloat(value) || 0 : value
        }));
    };

    const handleItemChange = (id: number, field: keyof InvoiceItem, value: string) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                return {
                    ...item,
                    [field]: field === 'description' ? value : parseFloat(value) || 0
                };
            }
            return item;
        }));
    };

    const addItem = () => {
        setItems(prev => [
            ...prev,
            { id: prev.length + 1, description: '', quantity: 1, price: 0 }
        ]);
    };

    const removeItem = (id: number) => {
        if (items.length > 1) {
            setItems(prev => prev.filter(item => item.id !== id));
        }
    };

    const calculateTotal = () => {
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const tax = subtotal * (formData.taxRate / 100);
        const discountAmount = subtotal * (formData.discount / 100);
        return {
            subtotal,
            tax,
            discount: discountAmount,
            total: subtotal + tax - discountAmount
        };
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const totals = calculateTotal();
        const invoiceData = {
            ...formData,
            items,
            ...totals
        };
        onSave(invoiceData);
    };

    const totals = calculateTotal();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Generate Invoice</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
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
                                    name="invoiceNumber"
                                    value={formData.invoiceNumber}
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
                                    name="date"
                                    value={formData.date}
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
                                                onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                placeholder="Item description"
                                                required
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
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
                                                    value={item.price}
                                                    onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                                                    className="w-full px-3 py-2 pl-7 border border-gray-300 rounded-md"
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-2 text-right">
                                            <span className="font-medium">
                                                ${(item.quantity * item.price).toFixed(2)}
                                            </span>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes
                                </label>
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
                                                name="discount"
                                                value={formData.discount}
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
                                Generate Invoice
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}