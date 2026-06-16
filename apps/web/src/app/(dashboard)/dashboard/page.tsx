'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/formatCurrency';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  BarChart3,
  Users,
  Landmark,
  BookOpen,
  ArrowLeftRight,
} from 'lucide-react';

/* ─── Types ─── */

interface Voucher {
  id: string;
  voucherNumber: string;
  voucherType: string;
  status: string;
  date: string;
  narration: string;
  totalAmount: string;
  currencyCode: string;
}

interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  narration: string;
  lines: { debit: string; credit: string }[];
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  currency: string;
  isActive: boolean;
  account: { id: string; code: string; name: string };
}

/* ─── Constants ─── */

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

/* ─── Data Fetching Hook ─── */

function useApiData<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetcher()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error };
}

/* ─── Shared Components ─── */

function WidgetShell({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 ${className}`}
    >
      {children}
    </div>
  );
}

function WidgetLoading() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  );
}

function WidgetError() {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
      <AlertCircle className="h-4 w-4" />
      Unable to load
    </div>
  );
}

/* ─── Financial Snapshot Widget (OWNER, CHIEF_ACCOUNTANT) ─── */

function FinancialSnapshotWidget({ currency }: { currency: string }) {
  const today = new Date().toISOString().split('T')[0];
  const yearStart = `${new Date().getFullYear()}-01-01`;

  const bs = useApiData(() =>
    api.get<any>('/reports/balance-sheet', { asOfDate: today }),
  );
  const is = useApiData(() =>
    api.get<any>('/reports/income-statement', {
      fromDate: yearStart,
      toDate: today,
    }),
  );

  if (bs.loading || is.loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <WidgetShell key={i}>
            <WidgetLoading />
          </WidgetShell>
        ))}
      </div>
    );
  }

  if (bs.error && is.error) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <WidgetShell key={i}>
            <WidgetError />
          </WidgetShell>
        ))}
      </div>
    );
  }

  const bsData = bs.data?.data || bs.data;
  const isData = is.data?.data || is.data;

  const assets = bsData?.assets?.total ?? 0;
  const liabilities = bsData?.liabilities?.total ?? 0;
  const equity = bsData?.equity?.total ?? 0;
  const netIncome = isData?.netIncome ?? 0;

  const cards = [
    {
      label: 'Total Assets',
      value: assets,
      icon: TrendingUp,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Total Liabilities',
      value: liabilities,
      icon: TrendingDown,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },
    {
      label: 'Net Equity',
      value: equity,
      icon: Scale,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Net Income',
      value: netIncome,
      icon: DollarSign,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const isNegative =
          card.label === 'Net Income' && Number(card.value) < 0;
        return (
          <WidgetShell key={card.label}>
            <div className={`inline-flex rounded-lg p-2 ${card.iconBg}`}>
              <card.icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
            <p className="mt-3 text-sm text-gray-500">{card.label}</p>
            <p
              className={`mt-1 text-2xl font-semibold ${isNegative ? 'text-red-600' : 'text-gray-900'}`}
            >
              {formatCurrency(card.value, currency)}
            </p>
          </WidgetShell>
        );
      })}
    </div>
  );
}

/* ─── Pending Approvals Widget (OWNER, CHIEF_ACCOUNTANT) ─── */

function PendingApprovalsWidget({ currency }: { currency: string }) {
  const { data, loading, error } = useApiData(() =>
    api.get<any>('/vouchers', { status: 'PENDING_APPROVAL', limit: 10 }),
  );

  const vouchers: Voucher[] = data?.data || data || [];
  const total = data?.meta?.total ?? vouchers.length;

  return (
    <WidgetShell>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Pending Approvals
        </h3>
        {!loading && !error && total > 0 && (
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
            {total}
          </span>
        )}
      </div>
      {loading ? (
        <WidgetLoading />
      ) : error ? (
        <WidgetError />
      ) : vouchers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-gray-400">
          <CheckCircle2 className="h-8 w-8" />
          No pending approvals
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-gray-100">
          {vouchers.map((v) => (
            <li key={v.id} className="flex items-center justify-between py-3">
              <div>
                <Link
                  href={`/dashboard/vouchers/${v.id}`}
                  className="font-mono text-sm font-medium text-primary-600 hover:underline"
                >
                  {v.voucherNumber}
                </Link>
                <p className="mt-0.5 text-xs text-gray-500">
                  {new Date(v.date).toLocaleDateString()} &middot;{' '}
                  {typeLabels[v.voucherType] || v.voucherType}
                </p>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(v.totalAmount, v.currencyCode || currency)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}

/* ─── Recent Activity Widget (OWNER) ─── */

function RecentActivityWidget({ currency }: { currency: string }) {
  const { data, loading, error } = useApiData(() =>
    api.get<any>('/vouchers', { status: 'POSTED', limit: 5 }),
  );

  const vouchers: Voucher[] = data?.data || data || [];

  return (
    <WidgetShell>
      <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
      {loading ? (
        <WidgetLoading />
      ) : error ? (
        <WidgetError />
      ) : vouchers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-gray-400">
          <FileText className="h-8 w-8" />
          No recent activity
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-gray-100">
          {vouchers.map((v) => (
            <li key={v.id} className="flex items-center justify-between py-3">
              <div>
                <Link
                  href={`/dashboard/vouchers/${v.id}`}
                  className="font-mono text-sm font-medium text-primary-600 hover:underline"
                >
                  {v.voucherNumber}
                </Link>
                <p className="mt-0.5 text-xs text-gray-500">
                  {new Date(v.date).toLocaleDateString()} &middot;{' '}
                  {typeLabels[v.voucherType] || v.voucherType}
                </p>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(v.totalAmount, v.currencyCode || currency)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}

/* ─── Bank Reconciliation Widget (CHIEF_ACCOUNTANT) ─── */

function BankReconciliationWidget() {
  const { data, loading, error } = useApiData(() =>
    api.get<any>('/bank-reconciliation/bank-accounts'),
  );

  const accounts: BankAccount[] = data?.data || data || [];

  return (
    <WidgetShell>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Bank Accounts</h3>
        <Link
          href="/dashboard/bank"
          className="text-xs font-medium text-primary-600 hover:underline"
        >
          View all
        </Link>
      </div>
      {loading ? (
        <WidgetLoading />
      ) : error ? (
        <WidgetError />
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-gray-400">
          <Landmark className="h-8 w-8" />
          No bank accounts configured
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-gray-100">
          {accounts.map((a) => (
            <li key={a.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {a.bankName}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  ****{a.accountNumber.slice(-4)}
                </p>
              </div>
              <span className="font-mono text-xs text-gray-500">
                {a.account?.code}
              </span>
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}

/* ─── Recent Journal Entries Widget (CHIEF_ACCOUNTANT) ─── */

function RecentJournalEntriesWidget({ currency }: { currency: string }) {
  const { data, loading, error } = useApiData(() =>
    api.get<any>('/journal-entries', { limit: 5 }),
  );

  const entries: JournalEntry[] = data?.data || data || [];

  return (
    <WidgetShell>
      <h3 className="text-sm font-semibold text-gray-900">
        Recent Journal Entries
      </h3>
      {loading ? (
        <WidgetLoading />
      ) : error ? (
        <WidgetError />
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-gray-400">
          <ArrowLeftRight className="h-8 w-8" />
          No journal entries
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500">
                <th className="pb-2 pr-4">Entry #</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Narration</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((e) => {
                const total = e.lines.reduce(
                  (s, l) => s + Number(l.debit),
                  0,
                );
                return (
                  <tr key={e.id}>
                    <td className="py-2.5 pr-4 font-mono text-gray-900">
                      {e.entryNumber}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-500">
                      {new Date(e.entryDate).toLocaleDateString()}
                    </td>
                    <td className="max-w-[200px] truncate py-2.5 pr-4 text-gray-500">
                      {e.narration}
                    </td>
                    <td className="py-2.5 text-right font-medium text-gray-900">
                      {formatCurrency(total, currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </WidgetShell>
  );
}

/* ─── Vouchers Summary Widget (ACCOUNTANT) ─── */

function VouchersSummaryWidget() {
  const draft = useApiData(() =>
    api.get<any>('/vouchers', { status: 'DRAFT', limit: 1 }),
  );
  const pending = useApiData(() =>
    api.get<any>('/vouchers', { status: 'PENDING_APPROVAL', limit: 1 }),
  );
  const posted = useApiData(() =>
    api.get<any>('/vouchers', { status: 'POSTED', limit: 1 }),
  );

  const cards = [
    {
      label: 'Draft',
      count: draft.data?.meta?.total ?? 0,
      loading: draft.loading,
      error: draft.error,
      icon: FileText,
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
    },
    {
      label: 'Pending Approval',
      count: pending.data?.meta?.total ?? 0,
      loading: pending.loading,
      error: pending.error,
      icon: Clock,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
    },
    {
      label: 'Posted',
      count: posted.data?.meta?.total ?? 0,
      loading: posted.loading,
      error: posted.error,
      icon: CheckCircle2,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <WidgetShell key={card.label}>
          {card.loading ? (
            <WidgetLoading />
          ) : card.error ? (
            <WidgetError />
          ) : (
            <>
              <div className={`inline-flex rounded-lg p-2 ${card.iconBg}`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <p className="mt-3 text-sm text-gray-500">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {card.count}
              </p>
            </>
          )}
        </WidgetShell>
      ))}
    </div>
  );
}

/* ─── Recent Vouchers Widget (ACCOUNTANT) ─── */

function RecentVouchersWidget({ currency }: { currency: string }) {
  const { data, loading, error } = useApiData(() =>
    api.get<any>('/vouchers', { limit: 5 }),
  );

  const vouchers: Voucher[] = data?.data || data || [];

  return (
    <WidgetShell>
      <h3 className="text-sm font-semibold text-gray-900">Recent Vouchers</h3>
      {loading ? (
        <WidgetLoading />
      ) : error ? (
        <WidgetError />
      ) : vouchers.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-gray-400">
          <FileText className="h-8 w-8" />
          No vouchers yet
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500">
                <th className="pb-2 pr-4">Number</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vouchers.map((v) => (
                <tr key={v.id}>
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/dashboard/vouchers/${v.id}`}
                      className="font-mono font-medium text-primary-600 hover:underline"
                    >
                      {v.voucherNumber}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-500">
                    {new Date(v.date).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-500">
                    {typeLabels[v.voucherType] || v.voucherType}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[v.status] || ''}`}
                    >
                      {v.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-medium text-gray-900">
                    {formatCurrency(v.totalAmount, v.currencyCode || currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WidgetShell>
  );
}

/* ─── Quick Actions Widget (all roles) ─── */

interface QuickAction {
  label: string;
  href: string;
  primary?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

const quickActionsByRole: Record<string, QuickAction[]> = {
  OWNER: [
    {
      label: 'New Voucher',
      href: '/dashboard/vouchers?action=new',
      primary: true,
      icon: Plus,
    },
    { label: 'View Reports', href: '/dashboard/reports', icon: BarChart3 },
    { label: 'Manage Users', href: '/dashboard/users', icon: Users },
    {
      label: 'Bank Reconciliation',
      href: '/dashboard/bank',
      icon: Landmark,
    },
  ],
  FINANCE_MANAGER: [
    {
      label: 'New Voucher',
      href: '/dashboard/vouchers?action=new',
      primary: true,
      icon: Plus,
    },
    {
      label: 'Chart of Accounts',
      href: '/dashboard/accounts',
      icon: BookOpen,
    },
    {
      label: 'Bank Reconciliation',
      href: '/dashboard/bank',
      icon: Landmark,
    },
    { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  ],
  ASSISTANT_MANAGER_BILLING: [
    {
      label: 'New Voucher',
      href: '/dashboard/vouchers?action=new',
      primary: true,
      icon: Plus,
    },
    {
      label: 'Chart of Accounts',
      href: '/dashboard/accounts',
      icon: BookOpen,
    },
    {
      label: 'Bank Reconciliation',
      href: '/dashboard/bank',
      icon: Landmark,
    },
    { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  ],
  SENIOR_OFFICE_PAYMENTS: [
    {
      label: 'New Voucher',
      href: '/dashboard/vouchers?action=new',
      primary: true,
      icon: Plus,
    },
    { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    {
      label: 'Journal Entries',
      href: '/dashboard/journal',
      icon: ArrowLeftRight,
    },
  ],
  SENIOR_ARAP_OFFICER: [
    {
      label: 'New Voucher',
      href: '/dashboard/vouchers?action=new',
      primary: true,
      icon: Plus,
    },
    {
      label: 'Bank Reconciliation',
      href: '/dashboard/bank',
      icon: Landmark,
    },
    { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  ],
  PAYMENT_OFFICER: [
    {
      label: 'New Voucher',
      href: '/dashboard/vouchers?action=new',
      primary: true,
      icon: Plus,
    },
    { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    {
      label: 'Journal Entries',
      href: '/dashboard/journal',
      icon: ArrowLeftRight,
    },
  ],
};

function QuickActionsWidget({ role }: { role: string }) {
  const actions = quickActionsByRole[role] || quickActionsByRole.PAYMENT_OFFICER;

  return (
    <WidgetShell>
      <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
      <div className="mt-4 flex flex-wrap gap-3">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={
              action.primary
                ? 'inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700'
                : 'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
            }
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </Link>
        ))}
      </div>
    </WidgetShell>
  );
}

/* ─── Dashboard Page ─── */

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const tenant = useAuthStore((s) => s.tenant);
  const role = user?.role ?? 'PAYMENT_OFFICER';
  const currency = tenant?.baseCurrency ?? 'USD';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {tenant?.name} &mdash; Here&apos;s an overview of your accounting
          system.
        </p>
      </div>

      {role === 'OWNER' && (
        <>
          <FinancialSnapshotWidget currency={currency} />
          <div className="grid gap-6 lg:grid-cols-2">
            <PendingApprovalsWidget currency={currency} />
            <RecentActivityWidget currency={currency} />
          </div>
          <QuickActionsWidget role={role} />
        </>
      )}

      {role === 'FINANCE_MANAGER' && (
        <>
          <FinancialSnapshotWidget currency={currency} />
          <div className="grid gap-6 lg:grid-cols-2">
            <PendingApprovalsWidget currency={currency} />
            <BankReconciliationWidget />
          </div>
          <RecentJournalEntriesWidget currency={currency} />
          <QuickActionsWidget role={role} />
        </>
      )}

      {role === 'ASSISTANT_MANAGER_BILLING' && (
        <>
          <FinancialSnapshotWidget currency={currency} />
          <div className="grid gap-6 lg:grid-cols-2">
            <PendingApprovalsWidget currency={currency} />
            <BankReconciliationWidget />
          </div>
          <RecentJournalEntriesWidget currency={currency} />
          <QuickActionsWidget role={role} />
        </>
      )}

      {['SENIOR_OFFICE_PAYMENTS', 'SENIOR_ARAP_OFFICER', 'PAYMENT_OFFICER'].includes(role) && (
        <>
          <VouchersSummaryWidget />
          <RecentVouchersWidget currency={currency} />
          <QuickActionsWidget role={role} />
        </>
      )}
    </div>
  );
}
