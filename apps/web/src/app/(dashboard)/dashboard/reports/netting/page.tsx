'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/formatCurrency';
import { useAuthStore } from '@/stores/auth.store';

interface NettingRow {
  id: string;
  voucherNumber: string;
  voucherType: string;
  contactName: string;
  date: string;
  totalAmount: string;
  totalPaid: string;
  remaining: string;
  status: string;
  lastPaidAt: string | null;
  dueDate: string | null;
}

interface NettingSection {
  rows: NettingRow[];
  totalAmount: string;
  totalPaid: string;
  totalRemaining: string;
}

interface NettingReport {
  receivable: NettingSection;
  payable: NettingSection;
  netPosition: string;
  netNature: string;
}

interface Contact {
  id: string;
  name: string;
}

const statusColors: Record<string, string> = {
  UNPAID: 'bg-red-100 text-red-700',
  PARTIAL: 'bg-amber-100 text-amber-700',
  SETTLED: 'bg-green-100 text-green-700',
};

export default function NettingReportPage() {
  const router = useRouter();
  const tenant = useAuthStore((s) => s.tenant);
  const baseCurrency = tenant?.baseCurrency ?? 'USD';

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactId, setContactId] = useState('');
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [showSettled, setShowSettled] = useState(false);
  const [report, setReport] = useState<NettingReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<any>('/contacts', { isActive: true }).then((data) => {
      const list = Array.isArray(data) ? data : data.data || [];
      setContacts(list);
    }).catch(() => {});
  }, []);

  const fmt = (amount: string | number) => formatCurrency(amount, baseCurrency);

  const formatDateTime = (iso: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };

  const generate = async () => {
    setLoading(true);
    try {
      const params: any = { fromDate, toDate, showSettled: showSettled.toString() };
      if (contactId) params.contactId = contactId;
      const data = await api.get<NettingReport>('/payment-allocations/netting-report', params);
      setReport(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const renderSection = (title: string, section: NettingSection, isReceivable: boolean) => {
    const paidLabel = isReceivable ? 'Received' : 'Paid';
    const paidAtLabel = isReceivable ? 'Received At' : 'Paid At';

    return (
      <div className="mb-8">
        <h3 className="mb-3 text-base font-semibold text-gray-900">
          {title}
        </h3>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Invoice</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Contact</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Amount</th>
                <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">{paidLabel}</th>
                <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Remaining</th>
                <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{paidAtLabel}</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {section.rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-gray-500">No invoices</td>
                </tr>
              ) : (
                section.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-gray-700">{row.voucherNumber}</td>
                    <td className="px-3 py-2 text-gray-600">{row.contactName}</td>
                    <td className="px-3 py-2 text-gray-500">{row.date}</td>
                    <td className="px-3 py-2 text-right text-gray-900">{fmt(row.totalAmount)}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{fmt(row.totalPaid)}</td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900">{fmt(row.remaining)}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[row.status] || 'bg-gray-100 text-gray-600'}`}>
                        {row.status === 'PARTIAL' ? 'Partial' : row.status === 'SETTLED' ? 'Settled' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{formatDateTime(row.lastPaidAt)}</td>
                    <td className="px-3 py-2 text-gray-500">{row.dueDate || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
            {section.rows.length > 0 && (
              <tfoot className="border-t-2 border-gray-300 bg-gray-50">
                <tr className="font-semibold text-sm">
                  <td colSpan={3} className="px-3 py-2">Total {title}</td>
                  <td className="px-3 py-2 text-right">{fmt(section.totalAmount)}</td>
                  <td className="px-3 py-2 text-right">{fmt(section.totalPaid)}</td>
                  <td className="px-3 py-2 text-right">{fmt(section.totalRemaining)}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard/reports')}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Netting Report</h1>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Contact</label>
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Contacts</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 pb-1">
          <input
            type="checkbox"
            id="showSettled"
            checked={showSettled}
            onChange={(e) => setShowSettled(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-600"
          />
          <label htmlFor="showSettled" className="text-sm text-gray-700">Show Settled</label>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Generate'}
        </button>
      </div>

      {/* Report */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : report ? (
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          {renderSection('Sales Invoices (Receivable)', report.receivable, true)}
          {renderSection('Purchase Invoices (Payable)', report.payable, false)}

          {/* Net Position */}
          <div className="rounded-lg border-2 border-gray-300 bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Net Position</p>
            <p className="text-2xl font-bold text-gray-900">
              {fmt(report.netPosition)}
              <span className={`ml-3 inline-flex items-center rounded-md px-3 py-1 text-sm font-medium ring-1 ring-inset ${
                report.netNature === 'Receivable'
                  ? 'text-green-700 bg-green-50 ring-green-600/20'
                  : 'text-red-700 bg-red-50 ring-red-600/20'
              }`}>
                {report.netNature}
              </span>
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {fmt(report.receivable.totalRemaining)} Receivable − {fmt(report.payable.totalRemaining)} Payable
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 text-gray-500 shadow-sm ring-1 ring-gray-200">
          <p className="text-sm">Select filters and click Generate to view the netting report</p>
        </div>
      )}
    </div>
  );
}
