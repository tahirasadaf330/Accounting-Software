'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/formatCurrency';
import { CheckCircle2 } from 'lucide-react';

export interface UnpaidInvoiceRow {
  id: string;
  voucherNumber: string;
  voucherType: 'SALES' | 'PURCHASE';
  totalAmount: string;
  date: string;
  totalPaid: string;
  remaining: string;
  status: 'UNPAID' | 'PARTIAL' | 'SETTLED';
  billingPeriodKey: string;
  billingPeriodLabel: string;
}

export interface AllocationSelection {
  invoiceVoucherId: string;
  voucherNumber: string;
  voucherType: 'SALES' | 'PURCHASE';
  amount: number;
  paidAt: string;
}

interface Props {
  contactId: string;
  contactType: 'CUSTOMER' | 'VENDOR' | 'BOTH';
  voucherType: string;
  currency: string;
  paymentDate: string;
  onChange: (selections: AllocationSelection[]) => void;
}

function statusBadge(status: UnpaidInvoiceRow['status']) {
  const map: Record<string, string> = {
    UNPAID: 'bg-red-100 text-red-700',
    PARTIAL: 'bg-amber-100 text-amber-700',
    SETTLED: 'bg-green-100 text-green-700',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

export default function InvoiceAllocationPanel({
  contactId,
  contactType,
  voucherType,
  currency,
  paymentDate,
  onChange,
}: Props) {
  const [invoices, setInvoices] = useState<UnpaidInvoiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!contactId) {
      setInvoices([]);
      return;
    }
    setLoading(true);
    setError(null);

    const params: Record<string, string> = {};
    if (contactType === 'CUSTOMER') params.paymentType = 'RECEIPT';
    else if (contactType === 'VENDOR') params.paymentType = 'PAYMENT';
    // BOTH -> no paymentType filter, service returns SALES + PURCHASE

    api
      .get<UnpaidInvoiceRow[]>(
        `/payment-allocations/unpaid-invoices/${contactId}`,
        params,
      )
      .then((data) => {
        const active = (Array.isArray(data) ? data : []).filter(
          (inv) => inv.status !== 'SETTLED',
        );
        setInvoices(active);
        setChecked({});
        setAmounts({});
      })
      .catch((e) => setError(e?.message || 'Failed to load invoices'))
      .finally(() => setLoading(false));
  }, [contactId, contactType]);

  // Group by billing period
  const groups = useMemo(() => {
    const byKey = new Map<string, { label: string; rows: UnpaidInvoiceRow[] }>();
    for (const inv of invoices) {
      const key = inv.billingPeriodKey || 'ungrouped';
      const label = inv.billingPeriodLabel || 'No billing period';
      if (!byKey.has(key)) byKey.set(key, { label, rows: [] });
      byKey.get(key)!.rows.push(inv);
    }
    // Sort keys ascending (date-like keys or 'ungrouped' last)
    return Array.from(byKey.entries())
      .sort((a, b) => {
        if (a[0] === 'ungrouped') return 1;
        if (b[0] === 'ungrouped') return -1;
        return a[0].localeCompare(b[0]);
      })
      .map(([key, v]) => ({ key, label: v.label, rows: v.rows }));
  }, [invoices]);

  // Bubble selections to parent whenever they change
  useEffect(() => {
    const sels: AllocationSelection[] = [];
    for (const inv of invoices) {
      if (!checked[inv.id]) continue;
      const amt = parseFloat(amounts[inv.id] || '0');
      if (!amt || amt <= 0) continue;
      sels.push({
        invoiceVoucherId: inv.id,
        voucherNumber: inv.voucherNumber,
        voucherType: inv.voucherType,
        amount: amt,
        paidAt: new Date(paymentDate).toISOString(),
      });
    }
    onChange(sels);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, amounts, invoices, paymentDate]);

  const toggle = (inv: UnpaidInvoiceRow) => {
    setChecked((prev) => {
      const next = { ...prev, [inv.id]: !prev[inv.id] };
      return next;
    });
    setAmounts((prev) => {
      if (prev[inv.id]) return prev;
      return { ...prev, [inv.id]: parseFloat(inv.remaining).toFixed(2) };
    });
  };

  const settlePeriod = (rows: UnpaidInvoiceRow[]) => {
    const allTicked = rows.every((r) => checked[r.id]);
    const nextChecked = { ...checked };
    const nextAmounts = { ...amounts };
    for (const r of rows) {
      if (allTicked) {
        nextChecked[r.id] = false;
      } else {
        nextChecked[r.id] = true;
        nextAmounts[r.id] = parseFloat(r.remaining).toFixed(2);
      }
    }
    setChecked(nextChecked);
    setAmounts(nextAmounts);
  };

  if (!contactId) return null;
  if (loading) {
    return (
      <div className="mb-6 rounded-xl bg-white p-6 text-sm text-gray-500 shadow-sm ring-1 ring-gray-200">
        Loading outstanding invoices…
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
  if (invoices.length === 0) {
    return (
      <div className="mb-6 rounded-xl bg-white p-6 text-sm text-gray-500 shadow-sm ring-1 ring-gray-200">
        No outstanding invoices for this contact.
      </div>
    );
  }

  const isBoth = contactType === 'BOTH';

  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Outstanding Invoices
        </h2>
        <span className="text-xs text-gray-500">
          {isBoth
            ? 'Customer + Vendor — both sides shown with netting'
            : contactType === 'CUSTOMER'
              ? 'Sales invoices'
              : 'Purchase invoices'}
        </span>
      </div>

      {groups.map((g) => {
        const rx = g.rows.filter((r) => r.voucherType === 'SALES');
        const py = g.rows.filter((r) => r.voucherType === 'PURCHASE');
        const rxRemaining = rx.reduce(
          (s, r) => s + parseFloat(r.remaining),
          0,
        );
        const pyRemaining = py.reduce(
          (s, r) => s + parseFloat(r.remaining),
          0,
        );
        const net = rxRemaining - pyRemaining;
        const allTicked = g.rows.every((r) => checked[r.id]);

        const renderRow = (inv: UnpaidInvoiceRow) => (
          <tr key={inv.id} className="border-t border-gray-100">
            <td className="px-2 py-2">
              <input
                type="checkbox"
                checked={!!checked[inv.id]}
                onChange={() => toggle(inv)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </td>
            <td className="px-2 py-2 font-mono text-xs text-gray-700">
              {inv.voucherNumber}
            </td>
            <td className="px-2 py-2 text-xs text-gray-600">{inv.date}</td>
            <td className="px-2 py-2 text-right text-xs text-gray-700">
              {formatCurrency(parseFloat(inv.totalAmount), currency)}
            </td>
            <td className="px-2 py-2 text-right text-xs text-gray-700">
              {formatCurrency(parseFloat(inv.remaining), currency)}
            </td>
            <td className="px-2 py-2">
              <span
                className={cn(
                  'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
                  statusBadge(inv.status),
                )}
              >
                {inv.status}
              </span>
            </td>
            <td className="px-2 py-2">
              <input
                type="number"
                step="0.01"
                min="0"
                max={inv.remaining}
                disabled={!checked[inv.id]}
                value={amounts[inv.id] || ''}
                onChange={(e) =>
                  setAmounts((prev) => ({ ...prev, [inv.id]: e.target.value }))
                }
                className="w-28 rounded border border-gray-300 px-2 py-1 text-right text-xs outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 disabled:bg-gray-50 disabled:text-gray-400"
                placeholder="0.00"
              />
            </td>
          </tr>
        );

        const tableHead = (
          <thead className="bg-gray-50">
            <tr>
              <th className="w-8 px-2 py-1.5" />
              <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase text-gray-500">
                #
              </th>
              <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase text-gray-500">
                Date
              </th>
              <th className="px-2 py-1.5 text-right text-[10px] font-medium uppercase text-gray-500">
                Total
              </th>
              <th className="px-2 py-1.5 text-right text-[10px] font-medium uppercase text-gray-500">
                Remaining
              </th>
              <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase text-gray-500">
                Status
              </th>
              <th className="w-32 px-2 py-1.5 text-right text-[10px] font-medium uppercase text-gray-500">
                Allocate
              </th>
            </tr>
          </thead>
        );

        return (
          <div
            key={g.key}
            className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <div className="text-sm font-semibold text-gray-800">
                {g.label}
              </div>
              <button
                type="button"
                onClick={() => settlePeriod(g.rows)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition',
                  allTicked
                    ? 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'border-primary-300 bg-primary-50 text-primary-700 hover:bg-primary-100',
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {allTicked ? 'Unsettle period' : 'Settle period'}
              </button>
            </div>

            {isBoth ? (
              <div className="p-4 space-y-4">
                {rx.length > 0 && (
                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Receivables (Sales)
                    </div>
                    <table className="min-w-full">
                      {tableHead}
                      <tbody>{rx.map(renderRow)}</tbody>
                    </table>
                  </div>
                )}
                {py.length > 0 && (
                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Payables (Purchase)
                    </div>
                    <table className="min-w-full">
                      {tableHead}
                      <tbody>{py.map(renderRow)}</tbody>
                    </table>
                  </div>
                )}
                <div className="flex justify-end gap-6 border-t border-gray-100 pt-2 text-xs">
                  <span className="text-gray-600">
                    Receivable:{' '}
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(rxRemaining, currency)}
                    </span>
                  </span>
                  <span className="text-gray-600">
                    Payable:{' '}
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(pyRemaining, currency)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'font-semibold',
                      net >= 0 ? 'text-green-700' : 'text-amber-700',
                    )}
                  >
                    Net: {formatCurrency(Math.abs(net), currency)}{' '}
                    {net >= 0 ? 'Receivable' : 'Payable'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <table className="min-w-full">
                  {tableHead}
                  <tbody>{g.rows.map(renderRow)}</tbody>
                </table>
                <div className="mt-2 flex justify-end border-t border-gray-100 pt-2 text-xs text-gray-600">
                  Total remaining:{' '}
                  <span className="ml-2 font-semibold text-gray-900">
                    {formatCurrency(
                      rx.length ? rxRemaining : pyRemaining,
                      currency,
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
