import * as XLSX from 'xlsx';

interface InvoiceRow {
  voucherNumber: string;
  date: string | null;
  voucherType: string;
  contactName: string | null;
  reference: string | null;
  narration: string;
  periodStart: string | null;
  periodEnd: string | null;
  totalAmount: string;
  status: string;
}

interface InvoiceSummary {
  totalSales: string;
  totalSalesCount: number;
  totalPurchases: string;
  totalPurchasesCount: number;
  netBalance: string;
}

interface InvoiceReportData {
  rows: InvoiceRow[];
  summary: InvoiceSummary;
}

export function exportInvoiceReportExcel(data: InvoiceReportData, filename: string) {
  const headers = [
    'Voucher #',
    'Date',
    'Type',
    'Contact',
    'Reference',
    'Narration',
    'Period Start',
    'Period End',
    'Amount',
    'Status',
  ];

  const dataRows = data.rows.map((r) => [
    r.voucherNumber,
    r.date ?? '',
    r.voucherType,
    r.contactName ?? '',
    r.reference ?? '',
    r.narration,
    r.periodStart ?? '',
    r.periodEnd ?? '',
    parseFloat(r.totalAmount),
    r.status,
  ]);

  const sheetData: any[][] = [
    headers,
    ...dataRows,
    [],
    ['Summary'],
    ['Total Sales', '', '', '', '', '', '', '', parseFloat(data.summary.totalSales), `(${data.summary.totalSalesCount} invoices)`],
    ['Total Purchases', '', '', '', '', '', '', '', parseFloat(data.summary.totalPurchases), `(${data.summary.totalPurchasesCount} invoices)`],
    ['Net Balance', '', '', '', '', '', '', '', parseFloat(data.summary.netBalance), ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Auto-size columns
  const colWidths = headers.map((h, i) => {
    const maxLen = Math.max(
      h.length,
      ...dataRows.map((r) => String(r[i] ?? '').length),
    );
    return { wch: Math.min(maxLen + 2, 40) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Invoice Report');
  XLSX.writeFile(wb, filename);
}
