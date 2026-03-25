'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/formatCurrency';
import { useAuthStore } from '@/stores/auth.store';
import { ArrowLeftRight, ChevronDown, ChevronUp, RotateCcw, Search } from 'lucide-react';

interface JournalEntryLine {
  id: string;
  debit: string;
  credit: string;
  narration: string | null;
  account: { code: string; name: string };
}

interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  narration: string;
  isReversing: boolean;
  voucher?: {
    id: string;
    voucherNumber: string;
    voucherType: string;
    status: string;
  };
  lines: JournalEntryLine[];
}

const typeLabels: Record<string, string> = {
  PAYMENT: 'Payment',
  RECEIPT: 'Receipt',
  JOURNAL: 'Journal',
  CONTRA: 'Contra',
  SALES: 'Sales',
  PURCHASE: 'Purchase',
  CREDIT_NOTE: 'Credit Note',
  DEBIT_NOTE: 'Debit Note',
};

export default function JournalEntriesPage() {
  const router = useRouter();
  const baseCurrency = useAuthStore((s) => s.tenant?.baseCurrency ?? 'USD');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadEntries();
  }, [search, dateFrom, dateTo]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: 1, limit: 50 };
      if (search) params.search = search;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const data = await api.get<any>('/journal-entries', params);
      setEntries(data.data || []);
    } catch (err) {
      console.error('Failed to load journal entries:', err);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString();
  const formatAmount = (amount: string) =>
    Number(amount) > 0
      ? formatCurrency(amount, baseCurrency)
      : '';

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Journal Entries</h1>
        <p className="mt-1 text-sm text-gray-600">Posted general ledger entries</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search entries..."
              className="rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Search
          </button>
        </form>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
          <label className="text-sm text-gray-500">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        {(search || dateFrom || dateTo) && (
          <button
            type="button"
            onClick={() => { setSearch(''); setSearchInput(''); setDateFrom(''); setDateTo(''); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500">
            <ArrowLeftRight className="mb-4 h-12 w-12 text-gray-300" />
            <p className="text-sm">No journal entries found</p>
            <p className="text-xs text-gray-400">Journal entries are created when vouchers are approved</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-8 px-4 py-3" />
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Entry Number</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Voucher</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Narration</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => {
                const isOpen = expanded === entry.id;
                const totalDebit = entry.lines.reduce((s, l) => s + Number(l.debit), 0);
                return (
                  <tr key={entry.id} className="group">
                    <td colSpan={7} className="p-0">
                      {/* Header row */}
                      <button
                        onClick={() => toggle(entry.id)}
                        className="flex w-full items-center hover:bg-gray-50"
                      >
                        <span className="w-8 px-4 py-3 text-gray-400">
                          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </span>
                        <span className="flex-1 px-4 py-3 text-left text-sm font-mono text-primary-600">
                          {entry.isReversing && <RotateCcw className="mr-1.5 inline h-3.5 w-3.5 text-purple-500" />}
                          {entry.entryNumber}
                        </span>
                        <span className="w-28 px-4 py-3 text-left text-sm text-gray-500">{formatDate(entry.entryDate)}</span>
                        <span className="w-36 px-4 py-3 text-left text-sm">
                          {entry.voucher && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/vouchers/${entry.voucher!.id}`); }}
                              className="font-mono text-primary-600 hover:text-primary-800 hover:underline"
                            >
                              {entry.voucher.voucherNumber}
                            </button>
                          )}
                        </span>
                        <span className="w-28 px-4 py-3 text-left text-sm text-gray-700">
                          {entry.voucher ? (typeLabels[entry.voucher.voucherType] || entry.voucher.voucherType) : ''}
                        </span>
                        <span className="min-w-0 flex-1 truncate px-4 py-3 text-left text-sm text-gray-700">
                          {entry.narration}
                        </span>
                        <span className="w-32 px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {formatCurrency(totalDebit, baseCurrency)}
                        </span>
                      </button>

                      {/* Expanded line items */}
                      {isOpen && (
                        <div className="border-t border-gray-100 bg-gray-50 px-12 py-3">
                          <table className="min-w-full">
                            <thead>
                              <tr className="text-xs font-medium uppercase text-gray-500">
                                <th className="w-10 py-2 text-left">#</th>
                                <th className="py-2 text-left">Account</th>
                                <th className="w-36 py-2 text-right">Debit</th>
                                <th className="w-36 py-2 text-right">Credit</th>
                                <th className="py-2 text-left">Narration</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entry.lines.map((line, i) => (
                                <tr key={line.id} className="text-sm">
                                  <td className="py-1.5 text-gray-400">{i + 1}</td>
                                  <td className="py-1.5">
                                    <span className="font-mono text-gray-500">{line.account.code}</span>
                                    <span className="mx-1.5 text-gray-300">—</span>
                                    <span className="text-gray-700">{line.account.name}</span>
                                  </td>
                                  <td className="py-1.5 text-right text-gray-900">{formatAmount(line.debit)}</td>
                                  <td className="py-1.5 text-right text-gray-900">{formatAmount(line.credit)}</td>
                                  <td className="py-1.5 text-gray-600">{line.narration || ''}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t border-gray-200 text-sm font-medium">
                                <td className="py-1.5" />
                                <td className="py-1.5 text-gray-700">Totals</td>
                                <td className="py-1.5 text-right text-gray-900">
                                  {formatAmount(String(entry.lines.reduce((s, l) => s + Number(l.debit), 0)))}
                                </td>
                                <td className="py-1.5 text-right text-gray-900">
                                  {formatAmount(String(entry.lines.reduce((s, l) => s + Number(l.credit), 0)))}
                                </td>
                                <td />
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
