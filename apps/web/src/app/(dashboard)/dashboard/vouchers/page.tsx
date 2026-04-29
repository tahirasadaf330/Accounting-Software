'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useDebounced } from '@/lib/useDebounced';
import { Pagination } from '@/components/Pagination';
import { Plus, FileText, ChevronDown, ShoppingCart, Receipt, Search, CreditCard, Wallet } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Voucher {
  id: string;
  voucherNumber: string;
  reference?: string;
  voucherType: string;
  status: string;
  date: string;
  narration: string;
  totalAmount: string;
  currencyCode: string;
  createdBy?: { firstName: string; lastName: string };
}

interface VouchersResponse {
  data: Voucher[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  REJECTED: 'bg-red-100 text-red-700',
  POSTED: 'bg-green-100 text-green-700',
  REVERSED: 'bg-purple-100 text-purple-700',
};

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

export default function VouchersPage() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [refreshKey, setRefreshKey] = useState(0);
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounced(search, 300);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCreateDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset to page 1 whenever filters / search / page size change.
  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch, pageSize]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = {
          page,
          limit: pageSize,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        };
        if (statusFilter) params.status = statusFilter;
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        const data = await api.get<VouchersResponse>('/vouchers', params);
        if (cancelled) return;
        setVouchers(data.data ?? []);
        setTotal(data.meta?.total ?? data.data?.length ?? 0);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load vouchers:', err);
          setVouchers([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [statusFilter, debouncedSearch, page, pageSize, refreshKey]);

  // Re-fetch when the tab regains focus (e.g., after viewing/creating a
  // voucher in another tab) so a freshly created voucher shows up at row 1.
  useEffect(() => {
    const handleFocus = () => {
      setPage(1);
      setRefreshKey((k) => k + 1);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const formatDate = (d: string) => new Date(d).toLocaleDateString();
  const formatAmount = (amount: string, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount));

  const showingResults = useMemo(() => vouchers.length > 0, [vouchers]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vouchers</h1>
          <p className="mt-1 text-sm text-gray-600">Manage financial transactions</p>
        </div>
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            New
            <ChevronDown className={cn('h-4 w-4 transition-transform', createDropdownOpen && 'rotate-180')} />
          </button>
          {createDropdownOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
              <button
                onClick={() => { router.push('/dashboard/vouchers/new?type=PAYMENT'); setCreateDropdownOpen(false); }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <CreditCard className="h-4 w-4 text-red-500" />
                Payment Voucher
              </button>
              <button
                onClick={() => { router.push('/dashboard/vouchers/new?type=RECEIPT'); setCreateDropdownOpen(false); }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <Wallet className="h-4 w-4 text-green-500" />
                Receipt Voucher
              </button>
              <div className="my-1 border-t border-gray-100" />
              <button
                onClick={() => { router.push('/dashboard/vouchers/new'); setCreateDropdownOpen(false); }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <FileText className="h-4 w-4 text-gray-400" />
                General Voucher
              </button>
              <button
                onClick={() => { router.push('/dashboard/vouchers/sales-invoice'); setCreateDropdownOpen(false); }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <Receipt className="h-4 w-4 text-blue-500" />
                Sales Invoice
              </button>
              <button
                onClick={() => { router.push('/dashboard/vouchers/purchase-invoice'); setCreateDropdownOpen(false); }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <ShoppingCart className="h-4 w-4 text-orange-500" />
                Purchase Invoice
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {['', 'POSTED', 'REVERSED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium',
                statusFilter === s
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50',
              )}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by number, type, status, contact, amount, date..."
            className="h-9 w-80 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
            </div>
          ) : !showingResults ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
              <FileText className="mb-4 h-12 w-12 text-gray-300" />
              <p className="text-sm">{debouncedSearch ? 'No vouchers match your search' : 'No vouchers found'}</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Number</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Narration</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-mono">
                      <button
                        onClick={() => router.push(`/dashboard/vouchers/${v.id}`)}
                        className="text-primary-600 hover:text-primary-800 hover:underline"
                      >
                        {v.voucherNumber}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{v.reference || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{formatDate(v.date)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {typeLabels[v.voucherType] || v.voucherType}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-700">{v.narration}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {formatAmount(v.totalAmount, v.currencyCode)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', statusColors[v.status])}>
                        {v.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && total > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>
    </div>
  );
}
