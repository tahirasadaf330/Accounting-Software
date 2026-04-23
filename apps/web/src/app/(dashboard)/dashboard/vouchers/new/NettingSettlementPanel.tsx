'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/formatCurrency';
import { CalendarDays, CheckCircle2, CircleDot } from 'lucide-react';

interface ApprovedCycle {
  id: string;
  startDate: string;
  endDate: string;
  status: 'APPROVED' | 'PARTIAL';
  salesCount: number;
  purchaseCount: number;
  salesTotal: string;
  purchaseTotal: string;
  netTotal: string;
  netNature: 'Receivable' | 'Payable' | 'Settled';
}

export interface NettingAllocationSelection {
  nettingCycleId: string;
  cycleRef: string;
  amount: number;
  paidAt: string;
  netNature: 'Receivable' | 'Payable';
}

interface Props {
  contactId: string;
  voucherType: string;
  paymentDate: string;
  currency: string;
  onChange: (selections: NettingAllocationSelection[]) => void;
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const sameMonth = s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth();
  const monthFmt = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' });
  const dayFmt = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' });
  return sameMonth
    ? `${s.getDate()} – ${e.getDate()} ${monthFmt.format(e)}`
    : `${dayFmt.format(s)} – ${dayFmt.format(e)}`;
}

function cycleRef(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const sameMonth = s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth();
  return sameMonth
    ? new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(s)
    : `${new Intl.DateTimeFormat('en', { month: 'short' }).format(s)} – ${new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(e)}`;
}

export default function NettingSettlementPanel({
  contactId,
  voucherType,
  paymentDate,
  currency,
  onChange,
}: Props) {
  const [cycles, setCycles] = useState<ApprovedCycle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!contactId) { setCycles([]); return; }
    setLoading(true);
    setError(null);
    api
      .get<ApprovedCycle[]>('/netting-cycles/approved-for-settlement', { contactId })
      .then((data) => { setCycles(Array.isArray(data) ? data : []); setChecked({}); setAmounts({}); })
      .catch((e) => setError(e?.message || 'Failed to load netting cycles'))
      .finally(() => setLoading(false));
  }, [contactId]);

  // Bubble selections to parent
  useEffect(() => {
    const sels: NettingAllocationSelection[] = [];
    for (const c of cycles) {
      if (!checked[c.id]) continue;
      const amt = parseFloat(amounts[c.id] || '0');
      if (!amt || amt <= 0) continue;
      sels.push({
        nettingCycleId: c.id,
        cycleRef: cycleRef(c.startDate, c.endDate),
        amount: amt,
        paidAt: new Date(paymentDate).toISOString(),
        netNature: c.netNature as 'Receivable' | 'Payable',
      });
    }
    onChange(sels);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, amounts, cycles, paymentDate]);

  const toggle = (c: ApprovedCycle) => {
    setChecked((prev) => ({ ...prev, [c.id]: !prev[c.id] }));
    setAmounts((prev) => {
      if (prev[c.id]) return prev;
      return { ...prev, [c.id]: parseFloat(c.netTotal).toFixed(2) };
    });
  };

  const selectedCount = Object.values(checked).filter(Boolean).length;
  // Receivable cycles are cash-in (+), Payable cycles are cash-out (−)
  const selectedNet = cycles
    .filter((c) => checked[c.id])
    .reduce((s, c) => {
      const amt = parseFloat(amounts[c.id] || '0');
      return s + (c.netNature === 'Receivable' ? amt : -amt);
    }, 0);

  if (!contactId) return null;

  if (loading) {
    return (
      <div className="mb-6 rounded-xl bg-white p-6 text-sm text-gray-500 shadow-sm ring-1 ring-gray-200">
        Loading netting cycles…
      </div>
    );
  }
  if (error) {
    return (
      <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }
  if (cycles.length === 0) {
    return (
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Invoice Nettings</h2>
        <p className="text-sm text-gray-500">
          No approved netting cycles for this contact. Create and approve a netting cycle first on the{' '}
          <a href="/dashboard/netting-cycles" className="text-primary-600 underline hover:text-primary-700">
            Netting Cycles
          </a>{' '}
          page.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Invoice Nettings</h2>
        <span className="text-xs text-gray-500">Select cycles to settle</span>
      </div>

      <div className="space-y-3">
        {cycles.map((c) => {
          const isChecked = !!checked[c.id];
          const enteredAmount = parseFloat(amounts[c.id] || '0');
          const netAmount = parseFloat(c.netTotal);
          const isFull = enteredAmount >= netAmount - 0.01;

          return (
            <div
              key={c.id}
              className={cn(
                'rounded-xl border bg-white shadow-sm transition-all',
                isChecked ? 'border-primary-300 ring-1 ring-primary-200' : 'border-gray-200',
              )}
            >
              {/* Header row */}
              <div className="flex items-center gap-3 px-5 py-3">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(c)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed"
                />
                <CalendarDays className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="flex-1 text-sm font-semibold text-gray-800">
                  {formatDateRange(c.startDate, c.endDate)}
                </span>
                {/* Status badge */}
                <span className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium',
                  c.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700',
                )}>
                  {c.status === 'APPROVED' ? 'Approved' : 'Partial'}
                </span>
                {/* Net nature badge */}
                <span className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  c.netNature === 'Receivable' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
                )}>
                  {c.netNature}
                </span>
              </div>

              {/* Invoice breakdown */}
              <div className="border-t border-gray-100 px-5 py-3">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-500">
                  <span>
                    <span className="font-medium text-gray-700">{c.salesCount}</span> Sales invoice{c.salesCount !== 1 ? 's' : ''}
                    {' · '}
                    <span className="font-medium text-green-700">{formatCurrency(parseFloat(c.salesTotal), currency)}</span>
                    {' remaining'}
                  </span>
                  <span>
                    <span className="font-medium text-gray-700">{c.purchaseCount}</span> Purchase invoice{c.purchaseCount !== 1 ? 's' : ''}
                    {' · '}
                    <span className="font-medium text-red-700">{formatCurrency(parseFloat(c.purchaseTotal), currency)}</span>
                    {' remaining'}
                  </span>
                </div>

                {/* Net amount */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Net amount:</span>
                  <span className={cn(
                    'text-sm font-bold',
                    c.netNature === 'Receivable' ? 'text-green-700' : 'text-red-700',
                  )}>
                    {formatCurrency(netAmount, currency)}
                  </span>
                </div>

                {/* Amount input + settlement badge */}
                {isChecked && (
                  <div className="mt-3 flex items-center gap-3">
                    <label className="text-xs font-medium text-gray-600 shrink-0">Amount to settle:</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={c.netTotal}
                      value={amounts[c.id] || ''}
                      onChange={(e) => setAmounts((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      className="w-36 rounded-lg border border-gray-300 px-3 py-1.5 text-right text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    />
                    <span className={cn(
                      'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                      isFull
                        ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
                        : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
                    )}>
                      {isFull ? (
                        <><CheckCircle2 className="h-3.5 w-3.5" /> Full Settlement</>
                      ) : (
                        <><CircleDot className="h-3.5 w-3.5" /> Partial</>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      {selectedCount > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 px-4 py-2.5">
          <span className="text-sm text-primary-800">
            <span className="font-semibold">{selectedCount}</span> netting cycle{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <span className="flex items-center gap-2 text-sm font-bold text-primary-900">
            <span className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              selectedNet >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
            )}>
              {selectedNet >= 0 ? 'Net Receivable' : 'Net Payable'}
            </span>
            Net: {formatCurrency(Math.abs(selectedNet), currency)}
          </span>
        </div>
      )}
    </div>
  );
}
