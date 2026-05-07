'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  BarChart3,
  ChevronDown,
  Printer,
  Download,
  FileSpreadsheet,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  FileText,
  MessageSquare,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/formatCurrency';
import { useAuthStore } from '@/stores/auth.store';
import ReportPrintLayout from './ReportPrintLayout';
import { useReportPrintPdf } from './useReportPrintPdf';
import { exportInvoiceReportExcel } from './exportInvoiceReportExcel';
import ContactQuickViewModal from '@/components/ContactQuickViewModal';
import CommentsModal from '@/components/CommentsModal';
import MarkPaidModal from '@/components/MarkPaidModal';

interface Account {
  id: string;
  code: string;
  name: string;
  accountType: string;
  isActive: boolean;
}

interface Contact {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

type ReportType = 'trial-balance' | 'balance-sheet' | 'income-statement' | 'statement-of-account' | 'invoice-report' | 'ar-report' | 'ap-report';

function AccountCombobox({
  accounts,
  value,
  onChange,
}: {
  accounts: Account[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = accounts.find((a) => a.id === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = accounts.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
  });

  return (
    <div ref={ref} className="relative">
      <div className="flex w-full cursor-pointer items-center rounded-lg border border-gray-300 text-sm outline-none focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20">
        <input
          type="text"
          placeholder={selected ? `${selected.code} — ${selected.name}` : 'Search account...'}
          value={open ? search : selected ? `${selected.code} — ${selected.name}` : ''}
          onFocus={() => {
            setOpen(true);
            setSearch('');
          }}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg bg-transparent px-3 py-2 outline-none placeholder:text-gray-400"
        />
        <ChevronDown className="mr-2 h-3.5 w-3.5 shrink-0 text-gray-400" />
      </div>

      {open && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">No accounts found</li>
          ) : (
            filtered.map((a) => (
              <li
                key={a.id}
                onMouseDown={() => {
                  onChange(a.id);
                  setSearch('');
                  setOpen(false);
                }}
                className={cn(
                  'cursor-pointer px-3 py-1.5 text-sm hover:bg-primary-50',
                  a.id === value && 'bg-primary-50 font-medium text-primary-700',
                )}
              >
                <span className="font-mono text-gray-500">{a.code}</span>
                <span className="mx-1.5 text-gray-300">—</span>
                <span>{a.name}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

function ContactCombobox({
  contacts,
  value,
  onChange,
}: {
  contacts: Contact[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = contacts.find((c) => c.id === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = contacts.filter((c) => {
    if (!search) return true;
    return c.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div ref={ref} className="relative">
      <div className="flex w-full cursor-pointer items-center rounded-lg border border-gray-300 text-sm outline-none focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20">
        <input
          type="text"
          placeholder={selected ? selected.name : 'All contacts...'}
          value={open ? search : selected ? selected.name : ''}
          onFocus={() => { setOpen(true); setSearch(''); }}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg bg-transparent px-3 py-2 outline-none placeholder:text-gray-400"
        />
        <ChevronDown className="mr-2 h-3.5 w-3.5 shrink-0 text-gray-400" />
      </div>
      {open && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <li
            onMouseDown={() => { onChange(''); setSearch(''); setOpen(false); }}
            className={cn('cursor-pointer px-3 py-1.5 text-sm hover:bg-primary-50 text-gray-500 italic', !value && 'bg-primary-50')}
          >
            All contacts
          </li>
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">No contacts found</li>
          ) : (
            filtered.map((c) => (
              <li
                key={c.id}
                onMouseDown={() => { onChange(c.id); setSearch(''); setOpen(false); }}
                className={cn('cursor-pointer px-3 py-1.5 text-sm hover:bg-primary-50', c.id === value && 'bg-primary-50 font-medium text-primary-700')}
              >
                {c.name}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

const AGING_LABELS: Record<string, string> = {
  current: 'Current',
  '1-30': '1–30 Days',
  '31-60': '31–60 Days',
  '61-90': '61–90 Days',
  '91+': '91+ Days',
};

const AGING_COLORS: Record<string, string> = {
  current: 'bg-green-50 ring-green-200 text-green-700',
  '1-30': 'bg-yellow-50 ring-yellow-200 text-yellow-700',
  '31-60': 'bg-orange-50 ring-orange-200 text-orange-700',
  '61-90': 'bg-red-50 ring-red-200 text-red-700',
  '91+': 'bg-red-100 ring-red-300 text-red-800',
};

const AGING_BADGE: Record<string, string> = {
  current: 'bg-green-100 text-green-700',
  '1-30': 'bg-yellow-100 text-yellow-700',
  '31-60': 'bg-orange-100 text-orange-700',
  '61-90': 'bg-red-100 text-red-700',
  '91+': 'bg-red-200 text-red-800',
};

type SortKey =
  | 'contactName'
  | 'voucherNumber'
  | 'date'
  | 'dueDate'
  | 'totalAmount'
  | 'paidAmount'
  | 'outstandingAmount'
  | 'agingBucket'
  | 'markedPaid';

const AGING_ORDER: Record<string, number> = {
  current: 0,
  '1-30': 1,
  '31-60': 2,
  '61-90': 3,
  '91+': 4,
};

function compareValues(a: any, b: any, key: SortKey): number {
  const va = a[key];
  const vb = b[key];

  if (key === 'totalAmount' || key === 'paidAmount' || key === 'outstandingAmount') {
    return Number(va) - Number(vb);
  }
  if (key === 'agingBucket') {
    return (AGING_ORDER[va] ?? 0) - (AGING_ORDER[vb] ?? 0);
  }
  if (key === 'markedPaid') {
    return (va ? 1 : 0) - (vb ? 1 : 0);
  }
  // string-ish: contactName, voucherNumber, date, dueDate
  const sa = String(va ?? '');
  const sb = String(vb ?? '');
  return sa.localeCompare(sb);
}

function SortHeader({
  label,
  sortKey,
  active,
  direction,
  onSort,
  align = 'left',
}: {
  label: string;
  sortKey: SortKey;
  active: SortKey | null;
  direction: 'asc' | 'desc';
  onSort: (k: SortKey) => void;
  align?: 'left' | 'right' | 'center';
}) {
  const isActive = active === sortKey;
  return (
    <th
      className={cn(
        'px-4 py-3 text-xs font-medium uppercase text-gray-500',
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left',
      )}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex items-center gap-1 hover:text-gray-900',
          align === 'right' && 'flex-row-reverse',
          isActive && 'text-gray-900',
        )}
      >
        {label}
        {!isActive && <ArrowUpDown className="h-3 w-3 opacity-40" />}
        {isActive && direction === 'asc' && <ArrowUp className="h-3 w-3" />}
        {isActive && direction === 'desc' && <ArrowDown className="h-3 w-3" />}
      </button>
    </th>
  );
}

function ARAPReportView({
  data,
  formatAmount,
  onRefresh,
}: {
  data: any;
  formatAmount: (v: any) => string;
  onRefresh?: () => void;
}) {
  const isAR = data.reportType === 'AR';
  const title = isAR ? 'Accounts Receivable (AR) Report' : 'Accounts Payable (AP) Report';
  const contactLabel = isAR ? 'Customer' : 'Vendor';

  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [contactModalId, setContactModalId] = useState<string | null>(null);
  const [commentsVoucher, setCommentsVoucher] = useState<{ id: string; number: string } | null>(null);
  const [markPaidVoucher, setMarkPaidVoucher] = useState<{ id: string; number: string; alreadyPaid: boolean } | null>(null);

  const handleSort = (k: SortKey) => {
    if (sortKey === k) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(k);
      setSortDir('asc');
    }
  };

  const sortedRows = useMemo(() => {
    const rows = data.rows ?? [];
    if (!sortKey) return rows;
    const factor = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => compareValues(a, b, sortKey) * factor);
  }, [data.rows, sortKey, sortDir]);

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">
        {title}
        <span className="ml-2 text-sm font-normal text-gray-500">as of {data.asOfDate}</span>
      </h2>
      {data.filters?.showOutstandingOnly && (
        <p className="mb-4 text-xs text-gray-400">Showing outstanding balances only</p>
      )}

      {/* Aging summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(['current', '1-30', '31-60', '61-90', '91+'] as const).map((bucket) => {
          const key = bucket === 'current' ? 'current' : bucket === '1-30' ? 'days1to30' : bucket === '31-60' ? 'days31to60' : bucket === '61-90' ? 'days61to90' : 'days91plus';
          return (
            <div key={bucket} className={cn('rounded-lg p-3 ring-1', AGING_COLORS[bucket])}>
              <p className="text-xs font-semibold uppercase">{AGING_LABELS[bucket]}</p>
              <p className="mt-1 text-base font-bold">{formatAmount(data.summary.aging[key])}</p>
            </div>
          );
        })}
      </div>

      {/* Summary totals */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-gray-50 p-4 ring-1 ring-gray-200">
          <p className="text-xs font-medium uppercase text-gray-500">Total Invoiced</p>
          <p className="mt-1 text-lg font-bold text-gray-800">{formatAmount(data.summary.totalInvoiced)}</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-4 ring-1 ring-blue-200">
          <p className="text-xs font-medium uppercase text-blue-600">Total Paid</p>
          <p className="mt-1 text-lg font-bold text-blue-800">{formatAmount(data.summary.totalPaid)}</p>
        </div>
        <div className={cn('rounded-lg p-4 ring-1', Number(data.summary.totalOutstanding) > 0 ? 'bg-red-50 ring-red-200' : 'bg-green-50 ring-green-200')}>
          <p className={cn('text-xs font-medium uppercase', Number(data.summary.totalOutstanding) > 0 ? 'text-red-600' : 'text-green-600')}>Total Outstanding</p>
          <p className={cn('mt-1 text-lg font-bold', Number(data.summary.totalOutstanding) > 0 ? 'text-red-800' : 'text-green-800')}>{formatAmount(data.summary.totalOutstanding)}</p>
        </div>
      </div>

      {/* Detail table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <SortHeader label={contactLabel} sortKey="contactName" active={sortKey} direction={sortDir} onSort={handleSort} />
              <SortHeader label="Invoice #" sortKey="voucherNumber" active={sortKey} direction={sortDir} onSort={handleSort} />
              <SortHeader label="Date" sortKey="date" active={sortKey} direction={sortDir} onSort={handleSort} />
              <SortHeader label="Due Date" sortKey="dueDate" active={sortKey} direction={sortDir} onSort={handleSort} />
              <SortHeader label="Invoice Amt" sortKey="totalAmount" active={sortKey} direction={sortDir} onSort={handleSort} align="right" />
              <SortHeader label="Paid" sortKey="paidAmount" active={sortKey} direction={sortDir} onSort={handleSort} align="right" />
              <SortHeader label="Outstanding" sortKey="outstandingAmount" active={sortKey} direction={sortDir} onSort={handleSort} align="right" />
              <SortHeader label="Aging" sortKey="agingBucket" active={sortKey} direction={sortDir} onSort={handleSort} />
              <th className="px-3 py-3 text-center text-xs font-medium uppercase text-gray-500" title="Statement of Account">SOA</th>
              <th className="px-3 py-3 text-center text-xs font-medium uppercase text-gray-500" title="Comments">Comments</th>
              <SortHeader label="Mark Paid" sortKey="markedPaid" active={sortKey} direction={sortDir} onSort={handleSort} align="center" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedRows.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-6 text-center text-sm text-gray-400">
                  No records found for the selected filters.
                </td>
              </tr>
            )}
            {sortedRows.map((row: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">
                  {row.contactId ? (
                    <button
                      type="button"
                      onClick={() => setContactModalId(row.contactId)}
                      className="text-primary-700 hover:underline"
                    >
                      {row.contactName}
                    </button>
                  ) : (
                    <span className="text-gray-900">{row.contactName}</span>
                  )}
                  {row.bankAccountLast4 && (
                    <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-600">
                      ····{row.bankAccountLast4}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-2 font-mono">
                  <Link
                    href={`/dashboard/vouchers/${row.voucherId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary-700 hover:underline"
                  >
                    {row.voucherNumber}
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-500">{row.date}</td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-500">{row.dueDate ?? '—'}</td>
                <td className="whitespace-nowrap px-4 py-2 text-right text-gray-900">{formatAmount(row.totalAmount)}</td>
                <td className="whitespace-nowrap px-4 py-2 text-right text-blue-700">{formatAmount(row.paidAmount)}</td>
                <td className="whitespace-nowrap px-4 py-2 text-right font-semibold">
                  <span className={Number(row.outstandingAmount) > 0 ? 'text-red-700' : 'text-green-600'}>
                    {formatAmount(row.outstandingAmount)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                  <span className={cn('rounded px-2 py-0.5 text-xs font-medium', AGING_BADGE[row.agingBucket])}>
                    {AGING_LABELS[row.agingBucket]}
                    {row.daysOverdue > 0 && <span className="ml-1 opacity-75">({row.daysOverdue}d)</span>}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-center">
                  {row.contactId ? (
                    <Link
                      href={`/dashboard/contacts/${row.contactId}/statement`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-lg p-1.5 text-gray-500 hover:bg-primary-50 hover:text-primary-700"
                      title="View Statement of Account"
                    >
                      <FileText className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => setCommentsVoucher({ id: row.voucherId, number: row.voucherNumber })}
                    className="relative inline-flex rounded-lg p-1.5 text-gray-500 hover:bg-primary-50 hover:text-primary-700"
                    title="View / add comments"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {row.commentCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-semibold leading-none text-white">
                        {row.commentCount}
                      </span>
                    )}
                  </button>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() =>
                      setMarkPaidVoucher({
                        id: row.voucherId,
                        number: row.voucherNumber,
                        alreadyPaid: !!row.markedPaid,
                      })
                    }
                    className={cn(
                      'inline-flex rounded-lg p-1.5 hover:bg-green-50',
                      row.markedPaid ? 'text-green-600' : 'text-gray-400 hover:text-green-700',
                    )}
                    title={row.markedPaid ? 'Fully paid' : 'Mark as paid'}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ContactQuickViewModal
        open={contactModalId != null}
        contactId={contactModalId}
        onClose={() => setContactModalId(null)}
      />

      <CommentsModal
        open={commentsVoucher != null}
        voucherId={commentsVoucher?.id ?? null}
        voucherNumber={commentsVoucher?.number}
        onClose={() => setCommentsVoucher(null)}
        onCommentAdded={() => onRefresh?.()}
      />

      <MarkPaidModal
        open={markPaidVoucher != null}
        voucherId={markPaidVoucher?.id ?? null}
        voucherNumber={markPaidVoucher?.number}
        alreadyPaid={markPaidVoucher?.alreadyPaid}
        onClose={() => setMarkPaidVoucher(null)}
        onSuccess={() => onRefresh?.()}
      />
    </div>
  );
}

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const tenant = useAuthStore((s) => s.tenant);
  const baseCurrency = tenant?.baseCurrency ?? 'USD';
  const [activeReport, setActiveReport] = useState<ReportType>('trial-balance');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
  });
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [invoiceFilters, setInvoiceFilters] = useState({
    type: '',
    contactId: '',
    periodStart: '',
    periodEnd: '',
  });
  const [arApFilters, setArApFilters] = useState({
    contactId: '',
    showOutstandingOnly: true,
  });
  const reports = [
    { id: 'trial-balance' as const, name: 'Trial Balance' },
    { id: 'balance-sheet' as const, name: 'Balance Sheet' },
    { id: 'income-statement' as const, name: 'Income Statement' },
    { id: 'statement-of-account' as const, name: 'Statement of Account' },
    { id: 'invoice-report' as const, name: 'Invoice Report' },
    { id: 'ar-report' as const, name: 'AR Report' },
    { id: 'ap-report' as const, name: 'AP Report' },
  ];

  const { printRef, handlePrint, handleExportPdf, isExporting } = useReportPrintPdf(activeReport);
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  useEffect(() => {
    const report = searchParams.get('report') as ReportType | null;
    if (report && reports.some((r) => r.id === report)) {
      setActiveReport(report);
      setReportData(null);
      setSelectedAccountId('');
      setInvoiceFilters({ type: '', contactId: '', periodStart: '', periodEnd: '' });
      setArApFilters({ contactId: '', showOutstandingOnly: true });
    }
  }, [searchParams]);

  useEffect(() => {
    const loadAccounts = async () => {
      setAccountsLoading(true);
      try {
        const data = await api.get<Account[] | { data: Account[] }>('/accounts', { isActive: true });
        const list = Array.isArray(data) ? data : data.data || [];
        setAccounts(list.filter((a) => a.isActive));
      } catch (err) {
        console.error('Failed to load accounts:', err);
      }
      setAccountsLoading(false);
    };
    const loadContacts = async () => {
      try {
        const data = await api.get<Contact[] | { data: Contact[] }>('/contacts', { isActive: true });
        const list = Array.isArray(data) ? data : (data as any).data || [];
        setContacts(list.filter((c: Contact) => c.isActive));
      } catch (err) {
        console.error('Failed to load contacts:', err);
      }
    };
    loadAccounts();
    loadContacts();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setReportData(null);
    setError(null);
    try {
      let data;
      switch (activeReport) {
        case 'trial-balance':
          data = await api.get('/reports/trial-balance', { asOfDate: dateRange.toDate });
          break;
        case 'balance-sheet':
          data = await api.get('/reports/balance-sheet', { asOfDate: dateRange.toDate });
          break;
        case 'income-statement':
          data = await api.get('/reports/income-statement', {
            fromDate: dateRange.fromDate,
            toDate: dateRange.toDate,
          });
          break;
        case 'statement-of-account':
          data = await api.get(`/reports/statement-of-account/${selectedAccountId}`, {
            fromDate: dateRange.fromDate,
            toDate: dateRange.toDate,
          });
          break;
        case 'invoice-report': {
          const params: Record<string, string> = {
            dateFrom: dateRange.fromDate,
            dateTo: dateRange.toDate,
          };
          if (invoiceFilters.type) params.type = invoiceFilters.type;
          if (invoiceFilters.contactId) params.contactId = invoiceFilters.contactId;
          if (invoiceFilters.periodStart) params.periodStart = invoiceFilters.periodStart;
          if (invoiceFilters.periodEnd) params.periodEnd = invoiceFilters.periodEnd;
          data = await api.get('/reports/invoices', params);
          break;
        }
        case 'ar-report': {
          const params: Record<string, string> = { asOfDate: dateRange.toDate };
          if (arApFilters.contactId) params.contactId = arApFilters.contactId;
          params.showOutstandingOnly = String(arApFilters.showOutstandingOnly);
          data = await api.get('/reports/ar', params);
          break;
        }
        case 'ap-report': {
          const params: Record<string, string> = { asOfDate: dateRange.toDate };
          if (arApFilters.contactId) params.contactId = arApFilters.contactId;
          params.showOutstandingOnly = String(arApFilters.showOutstandingOnly);
          data = await api.get('/reports/ap', params);
          break;
        }
      }
      setReportData(data);
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      const message =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        'Failed to generate report. Please check your filters and try again.';
      setError(Array.isArray(message) ? message.join(', ') : String(message));
    }
    setLoading(false);
  };

  const formatAmount = (amount: number | string) => formatCurrency(amount, baseCurrency);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
        <p className="mt-1 text-sm text-gray-600">Generate and view financial reports</p>
      </div>

      {/* Report selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        {reports.map((r) => (
          <button
            key={r.id}
            onClick={() => { setActiveReport(r.id); setReportData(null); setError(null); setSelectedAccountId(''); setInvoiceFilters({ type: '', contactId: '', periodStart: '', periodEnd: '' }); setArApFilters({ contactId: '', showOutstandingOnly: true }); }}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium',
              activeReport === r.id
                ? 'bg-primary-100 text-primary-700'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50',
            )}
          >
            {r.name}
          </button>
        ))}
      </div>

      {/* Date filters */}
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        {activeReport === 'statement-of-account' && (
          <div className="w-64">
            <label className="mb-1 block text-sm font-medium text-gray-700">Account</label>
            <AccountCombobox
              accounts={accounts}
              value={selectedAccountId}
              onChange={setSelectedAccountId}
            />
          </div>
        )}
        {activeReport === 'invoice-report' && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
                {[{ label: 'All', value: '' }, { label: 'Sales', value: 'SALES' }, { label: 'Purchases', value: 'PURCHASE' }].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setInvoiceFilters((p) => ({ ...p, type: opt.value }))}
                    className={cn(
                      'px-3 py-2 font-medium',
                      invoiceFilters.type === opt.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-52">
              <label className="mb-1 block text-sm font-medium text-gray-700">Contact</label>
              <ContactCombobox
                contacts={contacts}
                value={invoiceFilters.contactId}
                onChange={(id) => setInvoiceFilters((p) => ({ ...p, contactId: id }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Period Start</label>
              <input
                type="date"
                value={invoiceFilters.periodStart}
                onChange={(e) => setInvoiceFilters((p) => ({ ...p, periodStart: e.target.value }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Period End</label>
              <input
                type="date"
                value={invoiceFilters.periodEnd}
                onChange={(e) => setInvoiceFilters((p) => ({ ...p, periodEnd: e.target.value }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </>
        )}
        {(activeReport === 'ar-report' || activeReport === 'ap-report') && (
          <>
            <div className="w-52">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {activeReport === 'ar-report' ? 'Customer' : 'Vendor'}
              </label>
              <ContactCombobox
                contacts={contacts.filter((c) =>
                  activeReport === 'ar-report'
                    ? c.type === 'CUSTOMER' || c.type === 'BOTH'
                    : c.type === 'VENDOR' || c.type === 'BOTH',
                )}
                value={arApFilters.contactId}
                onChange={(id) => setArApFilters((p) => ({ ...p, contactId: id }))}
              />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={arApFilters.showOutstandingOnly}
                  onChange={(e) => setArApFilters((p) => ({ ...p, showOutstandingOnly: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600"
                />
                Outstanding only
              </label>
            </div>
          </>
        )}
        {activeReport !== 'trial-balance' && activeReport !== 'ar-report' && activeReport !== 'ap-report' && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">From Date</label>
            <input
              type="date"
              value={dateRange.fromDate}
              onChange={(e) => setDateRange((p) => ({ ...p, fromDate: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {activeReport === 'trial-balance' || activeReport === 'ar-report' || activeReport === 'ap-report'
              ? 'As of Date'
              : 'To Date'}
          </label>
          <input
            type="date"
            value={dateRange.toDate}
            onChange={(e) => setDateRange((p) => ({ ...p, toDate: e.target.value }))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={generateReport}
          disabled={loading || (activeReport === 'statement-of-account' && !selectedAccountId)}
          className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {/* Report output */}
      {reportData && (
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          {/* Print / Export buttons */}
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            {activeReport === 'invoice-report' && (
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  exportInvoiceReportExcel(reportData, `Invoice_Report_${today}.xlsx`);
                }}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export Excel
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              type="button"
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

          {activeReport === 'trial-balance' && reportData.rows && (
            <div>
              <h2 className="mb-4 text-lg font-semibold">
                Trial Balance
                <span className="ml-2 text-sm font-normal text-gray-500">as of {reportData.asOfDate}</span>
              </h2>
              <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Account</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Debit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportData.rows.map((row: any, i: number) => (
                    <tr key={i}>
                      <td className="px-4 py-2 text-sm font-mono text-gray-500">{row.accountCode}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{row.accountName}</td>
                      <td className="px-4 py-2 text-right text-sm text-gray-900">
                        {Number(row.debit) > 0 ? formatAmount(row.debit) : ''}
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-gray-900">
                        {Number(row.credit) > 0 ? formatAmount(row.credit) : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-sm">Total</td>
                    <td className="px-4 py-3 text-right text-sm">{formatAmount(reportData.totalDebit)}</td>
                    <td className="px-4 py-3 text-right text-sm">{formatAmount(reportData.totalCredit)}</td>
                  </tr>
                </tfoot>
              </table>
              </div>
            </div>
          )}

          {activeReport === 'balance-sheet' && (
            <div>
              <h2 className="mb-4 text-lg font-semibold">
                Balance Sheet
                <span className="ml-2 text-sm font-normal text-gray-500">as of {reportData.asOfDate}</span>
              </h2>
              {(['assets', 'liabilities', 'equity'] as const).map((section) => (
                <div key={section} className="mb-6">
                  <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">
                    {reportData[section]?.title || section}
                  </h3>
                  {reportData[section]?.rows?.map((row: any, i: number) => (
                    <div key={i} className="flex justify-between border-b border-gray-100 px-4 py-2 text-sm">
                      <span className="text-gray-700">
                        <span className="mr-2 font-mono text-gray-400">{row.accountCode}</span>
                        {row.accountName}
                      </span>
                      <span className="font-medium text-gray-900">
                        {Number(row.debit) > 0 ? formatAmount(row.debit) : formatAmount(row.credit)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between bg-gray-50 px-4 py-2 text-sm font-semibold">
                    <span>Total {reportData[section]?.title || section}</span>
                    <span>{formatAmount(reportData[section]?.total || 0)}</span>
                  </div>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t-2 border-gray-300 bg-gray-50 px-4 py-3 text-sm font-bold">
                <span>Total Liabilities & Equity</span>
                <span>{formatAmount(reportData.totalLiabilitiesAndEquity || 0)}</span>
              </div>
            </div>
          )}

          {activeReport === 'income-statement' && (
            <div>
              <h2 className="mb-4 text-lg font-semibold">
                Income Statement
                <span className="ml-2 text-sm font-normal text-gray-500">
                  {reportData.periodStart} to {reportData.periodEnd}
                </span>
              </h2>
              {[
                { key: 'revenue', data: reportData.revenue },
                { key: 'cogs', data: reportData.costOfGoodsSold },
                { key: 'expenses', data: reportData.expenses },
              ]
                .filter((s) => s.data)
                .map((section) => (
                  <div key={section.key} className="mb-4">
                    <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">{section.data.title}</h3>
                    {section.data.rows?.map((row: any, j: number) => (
                      <div key={j} className="flex justify-between border-b border-gray-100 px-4 py-2 text-sm">
                        <span className="text-gray-700">
                          <span className="mr-2 font-mono text-gray-400">{row.accountCode}</span>
                          {row.accountName}
                        </span>
                        <span className="font-medium text-gray-900">
                          {Number(row.debit) > 0 ? formatAmount(row.debit) : formatAmount(row.credit)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between bg-gray-50 px-4 py-2 text-sm font-semibold">
                      <span>Total {section.data.title}</span>
                      <span>{formatAmount(section.data.total)}</span>
                    </div>
                  </div>
                ))}
              {reportData.grossProfit !== undefined && (
                <div className="mb-4 flex justify-between border-t border-gray-200 px-4 py-2 text-sm font-semibold">
                  <span>Gross Profit</span>
                  <span>{formatAmount(reportData.grossProfit)}</span>
                </div>
              )}
              {reportData.netIncome !== undefined && (
                <div className="mt-2 flex justify-between border-t-2 border-gray-300 bg-gray-50 px-4 py-3 text-sm font-bold">
                  <span>Net Income</span>
                  <span className={Number(reportData.netIncome) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatAmount(reportData.netIncome)}
                  </span>
                </div>
              )}
            </div>
          )}

          {activeReport === 'statement-of-account' && (
            <div>
              <h2 className="mb-4 text-lg font-semibold">
                Statement of Account
                <span className="ml-2 text-sm font-normal text-gray-500">
                  <span className="font-mono">{reportData.accountCode}</span> — {reportData.accountName}
                </span>
              </h2>
              <p className="mb-4 text-sm text-gray-500">
                {reportData.periodStart} to {reportData.periodEnd}
              </p>
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
                  {/* Opening Balance */}
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-700">
                      Opening Balance
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-gray-900" />
                    <td className="px-4 py-2 text-right text-sm text-gray-900" />
                    <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                      {formatAmount(reportData.openingBalance)}
                    </td>
                  </tr>
                  {/* Transaction lines */}
                  {reportData.lines?.map((line: any, i: number) => (
                    <tr key={i}>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">{line.date}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm font-mono text-gray-500">
                        {line.voucherNumber}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{line.narration}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-sm text-gray-900">
                        {Number(line.debit) > 0 ? formatAmount(line.debit) : ''}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-sm text-gray-900">
                        {Number(line.credit) > 0 ? formatAmount(line.credit) : ''}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-sm text-gray-900">
                        {formatAmount(line.runningBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm">Closing Balance</td>
                    <td className="px-4 py-3 text-right text-sm">{formatAmount(reportData.totalDebit)}</td>
                    <td className="px-4 py-3 text-right text-sm">{formatAmount(reportData.totalCredit)}</td>
                    <td className="px-4 py-3 text-right text-sm">
                      <div>
                        {formatAmount(reportData.closingBalance)}
                        {reportData.closingBalanceNature && (
                          <span className={`ml-2 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${reportData.closingBalanceNature === 'Receivable' ? 'text-green-700 bg-green-50 ring-green-600/20' : reportData.closingBalanceNature === 'Payable' ? 'text-red-700 bg-red-50 ring-red-600/20' : 'text-gray-500 bg-gray-50 ring-gray-500/20'}`}>
                            {reportData.closingBalanceNature}
                          </span>
                        )}
                      </div>
                      {reportData.closingDueDate && (
                        <div className="mt-1 text-xs font-normal text-gray-500">
                          Due: {reportData.closingDueDate}
                        </div>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
              </div>
            </div>
          )}

          {(activeReport === 'ar-report' || activeReport === 'ap-report') && reportData && (
            <ARAPReportView data={reportData} formatAmount={formatAmount} onRefresh={generateReport} />
          )}

          {activeReport === 'invoice-report' && (
            <div>
              <h2 className="mb-4 text-lg font-semibold">
                Invoice Report
                <span className="ml-2 text-sm font-normal text-gray-500">
                  {reportData.filters?.dateFrom} to {reportData.filters?.dateTo}
                </span>
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Voucher #</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Reference</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Narration</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Period</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reportData.rows?.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-6 text-center text-sm text-gray-400">
                          No invoices found for the selected filters.
                        </td>
                      </tr>
                    )}
                    {reportData.rows?.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-2 text-gray-500">{row.date}</td>
                        <td className="whitespace-nowrap px-4 py-2 font-mono text-gray-500">{row.voucherNumber}</td>
                        <td className="whitespace-nowrap px-4 py-2">
                          <span className={cn(
                            'rounded px-2 py-0.5 text-xs font-medium',
                            row.voucherType === 'SALES' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700',
                          )}>
                            {row.voucherType}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-900">{row.contactName ?? '—'}</td>
                        <td className="px-4 py-2 text-gray-500">{row.reference ?? '—'}</td>
                        <td className="px-4 py-2 text-gray-900">{row.narration}</td>
                        <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500">
                          {row.periodStart && row.periodEnd
                            ? `${row.periodStart} — ${row.periodEnd}`
                            : row.periodStart ?? row.periodEnd ?? '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-right font-medium text-gray-900">
                          {formatAmount(row.totalAmount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary footer */}
              {reportData.summary && (
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-green-50 p-4 ring-1 ring-green-200">
                    <p className="text-xs font-medium uppercase text-green-600">Total Sales</p>
                    <p className="mt-1 text-lg font-bold text-green-800">{formatAmount(reportData.summary.totalSales)}</p>
                    <p className="text-xs text-green-600">{reportData.summary.totalSalesCount} invoices</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-4 ring-1 ring-blue-200">
                    <p className="text-xs font-medium uppercase text-blue-600">Total Purchases</p>
                    <p className="mt-1 text-lg font-bold text-blue-800">{formatAmount(reportData.summary.totalPurchases)}</p>
                    <p className="text-xs text-blue-600">{reportData.summary.totalPurchasesCount} invoices</p>
                  </div>
                  <div className={cn(
                    'rounded-lg p-4 ring-1',
                    Number(reportData.summary.netBalance) >= 0
                      ? 'bg-gray-50 ring-gray-200'
                      : 'bg-red-50 ring-red-200',
                  )}>
                    <p className="text-xs font-medium uppercase text-gray-600">Net Balance</p>
                    <p className={cn(
                      'mt-1 text-lg font-bold',
                      Number(reportData.summary.netBalance) >= 0 ? 'text-gray-800' : 'text-red-700',
                    )}>
                      {formatAmount(reportData.summary.netBalance)}
                    </p>
                    <p className="text-xs text-gray-500">Sales minus Purchases</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!reportData && !loading && !error && (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 shadow-sm ring-1 ring-gray-200">
          <BarChart3 className="mb-4 h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-500">Select a report and date range, then click Generate</p>
        </div>
      )}

      {/* Off-screen print layout */}
      {reportData && (
        <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
          <ReportPrintLayout
            ref={printRef}
            reportType={activeReport}
            reportData={reportData}
            companyName={tenant?.name || 'Company'}
            baseCurrency={baseCurrency}
            dateRange={dateRange}
            selectedAccount={selectedAccount ? { code: selectedAccount.code, name: selectedAccount.name } : null}
          />
        </div>
      )}
    </div>
  );
}
