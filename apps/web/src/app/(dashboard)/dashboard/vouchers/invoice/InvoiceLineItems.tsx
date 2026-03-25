'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Account {
  id: string;
  code: string;
  name: string;
  accountType: string;
  isActive: boolean;
}

export interface InvoiceLine {
  id: string;
  description: string;
  accountId: string;
  amount: string;
}

interface InvoiceLineItemsProps {
  lines: InvoiceLine[];
  onChange: (lines: InvoiceLine[]) => void;
  accounts: Account[];
  currencySymbol?: string;
  errors?: Record<string, string>;
}

function AccountCombobox({
  accounts,
  value,
  onChange,
  hasError,
}: {
  accounts: Account[];
  value: string;
  onChange: (id: string) => void;
  hasError?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = accounts.find((a) => a.id === value);

  const filtered = accounts.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm outline-none transition-colors',
          hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
            : 'border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
        )}
      >
        {selected ? (
          <span className="truncate text-gray-900">
            {selected.code} — {selected.name}
          </span>
        ) : (
          <span className="text-gray-400">Select account</span>
        )}
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search accounts..."
                className="w-full rounded-md border border-gray-200 py-1.5 pl-9 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-sm text-gray-500">No accounts found</div>
            ) : (
              filtered.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onMouseDown={() => {
                    onChange(account.id);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={cn(
                    'flex w-full items-center px-3 py-2 text-left text-sm hover:bg-gray-50',
                    value === account.id && 'bg-primary-50',
                  )}
                >
                  <span className="font-mono text-gray-600">{account.code}</span>
                  <span className="mx-2 text-gray-400">—</span>
                  <span className="truncate text-gray-900">{account.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function InvoiceLineItems({
  lines,
  onChange,
  accounts,
  currencySymbol = '$',
  errors = {},
}: InvoiceLineItemsProps) {
  const addLine = () => {
    onChange([
      ...lines,
      {
        id: crypto.randomUUID(),
        description: '',
        accountId: '',
        amount: '',
      },
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    onChange(lines.filter((line) => line.id !== id));
  };

  const updateLine = (id: string, field: keyof InvoiceLine, value: string) => {
    onChange(
      lines.map((line) =>
        line.id === id ? { ...line, [field]: value } : line,
      ),
    );
  };

  const total = lines.reduce((sum, line) => {
    const amount = parseFloat(line.amount) || 0;
    return sum + amount;
  }, 0);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="w-10 px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">#</th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Description</th>
              <th className="w-64 px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Account</th>
              <th className="w-32 px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Amount</th>
              <th className="w-10 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.map((line, index) => (
              <tr key={line.id} className="group">
                <td className="px-3 py-2 text-sm text-gray-500">{index + 1}</td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={line.description}
                    onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                    placeholder="Item description"
                    className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </td>
                <td className="px-3 py-2">
                  <AccountCombobox
                    accounts={accounts}
                    value={line.accountId}
                    onChange={(id) => updateLine(line.id, 'accountId', id)}
                    hasError={!!errors[`lines.${index}.accountId`]}
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      {currencySymbol}
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={line.amount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        updateLine(line.id, 'amount', val);
                      }}
                      placeholder="0.00"
                      className={cn(
                        'w-full rounded-md border px-2.5 py-1.5 pl-6 text-right text-sm outline-none',
                        errors[`lines.${index}.amount`]
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500',
                      )}
                    />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    disabled={lines.length <= 1}
                    className={cn(
                      'rounded p-1 text-gray-400 transition-colors',
                      lines.length > 1
                        ? 'hover:bg-red-50 hover:text-red-600'
                        : 'cursor-not-allowed opacity-30',
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200 bg-gray-50">
              <td colSpan={3} className="px-3 py-3">
                <button
                  type="button"
                  onClick={addLine}
                  className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Line
                </button>
              </td>
              <td className="px-3 py-3 text-right">
                <div className="text-xs uppercase text-gray-500">Total</div>
                <div className="text-lg font-semibold text-gray-900">
                  {currencySymbol}
                  {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {errors.lines && (
        <p className="text-sm text-red-600">{errors.lines}</p>
      )}
    </div>
  );
}
