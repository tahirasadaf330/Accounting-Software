'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import { useAuthStore } from '@/stores/auth.store';

type BalanceNature = 'Receivable' | 'Payable' | 'Settled';

interface StatementLine {
  date: string;
  voucherId: string;
  voucherNumber: string;
  narration: string;
  debit: string;
  credit: string;
  runningBalance: string;
  balanceNature: BalanceNature;
}

interface ContactStatement {
  contactId: string;
  contactName: string;
  contactType: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  periodStart: string;
  periodEnd: string;
  currency: string;
  openingBalance: string;
  openingBalanceNature: BalanceNature;
  lines: StatementLine[];
  closingBalance: string;
  closingBalanceNature: BalanceNature;
  closingDueDate: string | null;
  totalDebit: string;
  totalCredit: string;
}

export default function ContactStatementPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;

  const tenant = useAuthStore((s) => s.tenant);
  const baseCurrency = tenant?.baseCurrency ?? 'USD';

  const [statement, setStatement] = useState<ContactStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
  });

  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const loadStatement = async () => {
    setLoading(true);
    try {
      const data = await api.get<ContactStatement>(
        `/contacts/${contactId}/statement`,
        { fromDate: dateRange.fromDate, toDate: dateRange.toDate },
      );
      setStatement(data);
    } catch (err) {
      console.error('Failed to load statement:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (contactId) {
      loadStatement();
    }
  }, [contactId]);

  const formatAmount = (amount: string | number) => formatCurrency(amount, baseCurrency);

  const natureColor = (nature: BalanceNature) => {
    if (nature === 'Receivable') return 'text-green-700 bg-green-50 ring-green-600/20';
    if (nature === 'Payable') return 'text-red-700 bg-red-50 ring-red-600/20';
    return 'text-gray-500 bg-gray-50 ring-gray-500/20';
  };

  const NatureBadge = ({ nature }: { nature: BalanceNature }) => (
    <span className={`ml-2 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${natureColor(nature)}`}>
      {nature}
    </span>
  );

  const handlePrint = useCallback(() => {
    const node = printRef.current;
    if (!node) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '1100px';
    iframe.style.height = '600px';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Statement of Account</title>
          <style>
            @page { margin: 10mm; size: landscape; }
            body { margin: 0; padding: 0; }
          </style>
        </head>
        <body>${node.innerHTML}</body>
      </html>
    `);
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 250);
    };

    setTimeout(() => {
      if (iframe.parentNode) {
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (iframe.parentNode) document.body.removeChild(iframe);
        }, 1000);
      }
    }, 500);
  }, []);

  const handleExportPdf = useCallback(async () => {
    const node = printRef.current;
    if (!node) return;

    setIsExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const today = new Date().toISOString().split('T')[0];
      const filename = `Statement_of_Account_${statement?.contactName?.replace(/\s+/g, '_') || 'report'}_${today}.pdf`;

      await html2pdf()
        .set({
          margin: 10,
          filename,
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        })
        .from(node)
        .save();
    } catch (err) {
      console.error('PDF export failed:', err);
    }
    setIsExporting(false);
  }, [statement]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/contacts')}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Statement of Account</h1>
            {statement && (
              <p className="mt-1 text-sm text-gray-600">
                {statement.contactName} — Account: {statement.accountCode} ({statement.accountName})
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Date range filter */}
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">From Date</label>
          <input
            type="date"
            value={dateRange.fromDate}
            onChange={(e) => setDateRange((p) => ({ ...p, fromDate: e.target.value }))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">To Date</label>
          <input
            type="date"
            value={dateRange.toDate}
            onChange={(e) => setDateRange((p) => ({ ...p, toDate: e.target.value }))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={loadStatement}
          disabled={loading}
          className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Generate'}
        </button>
        {statement && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {isExporting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export PDF
            </button>
          </div>
        )}
      </div>

      {/* Statement data */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : statement ? (
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          {/* Print layout (hidden, used for print/PDF) */}
          <div ref={printRef} style={{ position: 'absolute', left: '-9999px', top: 0 }}>
            <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', padding: '20px' }}>
              <h2 style={{ textAlign: 'center', marginBottom: '4px' }}>Statement of Account</h2>
              <p style={{ textAlign: 'center', marginBottom: '4px', color: '#666' }}>
                Contact: {statement.contactName}
              </p>
              <p style={{ textAlign: 'center', marginBottom: '12px', color: '#666' }}>
                Account: {statement.accountCode} — {statement.accountName} | Period: {statement.periodStart} to {statement.periodEnd}
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #333' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Voucher #</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>Narration</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px' }}>Debit</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px' }}>Credit</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px' }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
                    <td style={{ padding: '6px 8px' }} colSpan={5}><strong>Opening Balance</strong></td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}><strong>{formatAmount(statement.openingBalance)}</strong></td>
                  </tr>
                  {statement.lines.map((line, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '6px 8px' }}>{line.date}</td>
                      <td style={{ padding: '6px 8px' }}>{line.voucherNumber}</td>
                      <td style={{ padding: '6px 8px' }}>{line.narration}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{Number(line.debit) > 0 ? formatAmount(line.debit) : ''}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{Number(line.credit) > 0 ? formatAmount(line.credit) : ''}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{formatAmount(line.runningBalance)}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid #333', backgroundColor: '#f9f9f9' }}>
                    <td style={{ padding: '6px 8px' }} colSpan={3}><strong>Closing Balance</strong></td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}><strong>{formatAmount(statement.totalDebit)}</strong></td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}><strong>{formatAmount(statement.totalCredit)}</strong></td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                      <div>
                        <strong>{formatAmount(statement.closingBalance)}</strong>
                        <span style={{ marginLeft: '6px', fontSize: '10px', color: statement.closingBalanceNature === 'Receivable' ? '#15803d' : statement.closingBalanceNature === 'Payable' ? '#b91c1c' : '#6b7280' }}>
                          {statement.closingBalanceNature}
                        </span>
                      </div>
                      {statement.closingDueDate && (
                        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>
                          Due: {statement.closingDueDate}
                        </div>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Visible table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Voucher #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Narration</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Debit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Credit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* Opening balance row */}
                <tr className="bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-500" colSpan={5}>
                    <span className="font-medium text-gray-700">Opening Balance</span>
                  </td>
                  <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                    {formatAmount(statement.openingBalance)}
                  </td>
                </tr>

                {statement.lines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                      No transactions in this period
                    </td>
                  </tr>
                ) : (
                  statement.lines.map((line, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">{line.date}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm font-mono text-gray-600">
                        {line.voucherId ? (
                          <Link
                            href={`/dashboard/vouchers/${line.voucherId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-700 hover:underline"
                          >
                            {line.voucherNumber}
                          </Link>
                        ) : (
                          line.voucherNumber
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{line.narration}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-sm text-gray-900">
                        {Number(line.debit) > 0 ? formatAmount(line.debit) : ''}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-sm text-gray-900">
                        {Number(line.credit) > 0 ? formatAmount(line.credit) : ''}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-sm font-medium text-gray-900">
                        {formatAmount(line.runningBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="border-t-2 border-gray-300 bg-gray-50">
                <tr>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900" colSpan={3}>
                    Closing Balance
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {formatAmount(statement.totalDebit)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {formatAmount(statement.totalCredit)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    <div>
                      {formatAmount(statement.closingBalance)}
                      <NatureBadge nature={statement.closingBalanceNature} />
                    </div>
                    {statement.closingDueDate && (
                      <div className="mt-1 text-xs font-normal text-gray-500">
                        Due: {statement.closingDueDate}
                      </div>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 text-gray-500 shadow-sm ring-1 ring-gray-200">
          <p className="text-sm">Select a date range and click Generate to view the statement</p>
        </div>
      )}
    </div>
  );
}
