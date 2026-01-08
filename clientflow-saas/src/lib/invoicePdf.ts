// src/lib/invoicePdf.ts
import jsPDF from "jspdf";

export type PdfInvoice = {
  number: string;
  status?: string;
  currency?: string;

  clientName: string;
  clientEmail?: string | null;
  clientCompany?: string | null;

  invoiceDate: string; // YYYY-MM-DD
  dueDate: string;     // YYYY-MM-DD

  subtotal: number;
  tax: number;
  discount: number;
  total: number;

  notes?: string | null;
};

export type PdfInvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

function money(n: number, currency = "USD") {
  const fixed = (Math.round(n * 100) / 100).toFixed(2);
  return currency === "USD" ? `$${fixed}` : `${fixed} ${currency}`;
}

export function buildInvoicePdfDoc(invoice: PdfInvoice, items: PdfInvoiceItem[]) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("INVOICE", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Invoice #: ${invoice.number}`, pageWidth - margin, y, { align: "right" });

  y += 22;
  doc.text(`Date: ${invoice.invoiceDate}`, pageWidth - margin, y, { align: "right" });
  y += 16;
  doc.text(`Due: ${invoice.dueDate}`, pageWidth - margin, y, { align: "right" });

  y += 28;
  doc.setFont("helvetica", "bold");
  doc.text("Bill To", margin, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.text(invoice.clientName || "-", margin, y);
  y += 14;

  if (invoice.clientCompany) {
    doc.text(invoice.clientCompany, margin, y);
    y += 14;
  }
  if (invoice.clientEmail) {
    doc.text(String(invoice.clientEmail), margin, y);
    y += 14;
  }

  y += 22;
  doc.setFont("helvetica", "bold");
  doc.text("Description", margin, y);
  doc.text("Qty", pageWidth - margin - 160, y, { align: "right" });
  doc.text("Unit", pageWidth - margin - 90, y, { align: "right" });
  doc.text("Total", pageWidth - margin, y, { align: "right" });

  doc.setFont("helvetica", "normal");
  y += 10;
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;

  const currency = invoice.currency || "USD";

  for (const it of items) {
    if (y > 680) {
      doc.addPage();
      y = margin;
    }

    const desc = it.description || "-";
    const wrapped = doc.splitTextToSize(desc, pageWidth - margin * 2 - 200);

    doc.text(wrapped, margin, y);
    doc.text(String(it.quantity ?? 0), pageWidth - margin - 160, y, { align: "right" });
    doc.text(money(it.unitPrice ?? 0, currency), pageWidth - margin - 90, y, { align: "right" });
    doc.text(money(it.lineTotal ?? 0, currency), pageWidth - margin, y, { align: "right" });

    y += wrapped.length * 12 + 10;
  }

  y += 10;
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;

  const rightX = pageWidth - margin;
  const labelX = pageWidth - margin - 140;

  const row = (label: string, value: string) => {
    doc.text(label, labelX, y);
    doc.text(value, rightX, y, { align: "right" });
    y += 16;
  };

  row("Subtotal", money(invoice.subtotal ?? 0, currency));
  row("Tax", money(invoice.tax ?? 0, currency));
  row("Discount", money(invoice.discount ?? 0, currency));

  doc.setFont("helvetica", "bold");
  row("Total", money(invoice.total ?? 0, currency));
  doc.setFont("helvetica", "normal");

  if (invoice.notes) {
    y += 14;
    doc.setFont("helvetica", "bold");
    doc.text("Notes", margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    const noteWrapped = doc.splitTextToSize(String(invoice.notes), pageWidth - margin * 2);
    doc.text(noteWrapped, margin, y);
  }

  return doc;
}

export function downloadInvoicePdf(invoice: PdfInvoice, items: PdfInvoiceItem[]) {
  const doc = buildInvoicePdfDoc(invoice, items);
  const safeNumber = (invoice.number || "invoice").replace(/[^\w\-]+/g, "_");
  doc.save(`${safeNumber}.pdf`);
}
