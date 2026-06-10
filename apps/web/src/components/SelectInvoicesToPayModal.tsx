'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Upload, Loader2, FileText, Trash2, CheckSquare, Square } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';

interface InvoiceRow {
  voucherId: string;
  voucherNumber: string;
  outstandingAmount: string;
  currencyCode?: string;
}

interface Props {
  open: boolean;
  invoices: InvoiceRow[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function SelectInvoicesToPayModal({ open, invoices, onClose, onSuccess }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<Record<string, 'pending' | 'done' | 'error'>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const initChecked: Record<string, boolean> = {};
    const initAmounts: Record<string, string> = {};
    for (const inv of invoices) {
      initChecked[inv.voucherId] = true;
      const n = Number(inv.outstandingAmount);
      initAmounts[inv.voucherId] = Number.isFinite(n) ? n.toFixed(2) : inv.outstandingAmount;
    }
    setChecked(initChecked);
    setAmounts(initAmounts);
    setFile(null);
    setSubmitting(false);
    setProgress({});
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [open, invoices]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const allSelected = invoices.length > 0 && invoices.every((inv) => checked[inv.voucherId]);

  const toggleAll = () => {
    const next = !allSelected;
    const update: Record<string, boolean> = {};
    for (const inv of invoices) update[inv.voucherId] = next;
    setChecked(update);
  };

  const selectedInvoices = invoices.filter((inv) => checked[inv.voucherId]);

  const totalSelected = selectedInvoices.reduce((sum, inv) => {
    const n = Number(amounts[inv.voucherId]);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);

  const currencyCode = invoices[0]?.currencyCode;

  const amountInvalid = (inv: InvoiceRow) => {
    const n = Number(amounts[inv.voucherId]);
    const outstanding = Number(inv.outstandingAmount);
    return !Number.isFinite(n) || n <= 0 || (outstanding > 0 && n > outstanding);
  };

  const canSubmit =
    !submitting &&
    selectedInvoices.length > 0 &&
    selectedInvoices.every((inv) => !amountInvalid(inv));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setErrors({});

    let anySuccess = false;
    for (const inv of selectedInvoices) {
      setProgress((p) => ({ ...p, [inv.voucherId]: 'pending' }));
      try {
        const fd = new FormData();
        fd.append('paymentAmount', amounts[inv.voucherId]);
        if (file) fd.append('file', file);
        await api.postFormData(`/vouchers/${inv.voucherId}/mark-paid`, fd);
        setProgress((p) => ({ ...p, [inv.voucherId]: 'done' }));
        anySuccess = true;
      } catch (err) {
        setProgress((p) => ({ ...p, [inv.voucherId]: 'error' }));
        setErrors((prev) => ({
          ...prev,
          [inv.voucherId]: err instanceof ApiError ? err.message : 'Failed',
        }));
      }
    }

    setSubmitting(false);
    if (anySuccess) onSuccess();
    const stillFailed = selectedInvoices.some((inv) => progress[inv.voucherId] === 'error' || errors[inv.voucherId]);
    if (!stillFailed) onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 flex w-full max-w-lg flex-col rounded-xl bg-white shadow-xl max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Select Invoices to Pay</h2>
            <p className="mt-0.5 text-xs text-gray-500">{invoices.length} outstanding invoice{invoices.length !== 1 ? 's' : ''}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          <div className="overflow-y-auto px-6 py-4 space-y-3 flex-1">
            {/* Select all toggle */}
            <button
              type="button"
              onClick={toggleAll}
              className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-800"
            >
              {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>

            {/* Invoice rows */}
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {invoices.map((inv) => {
                const isChecked = !!checked[inv.voucherId];
                const st = progress[inv.voucherId];
                const errMsg = errors[inv.voucherId];
                return (
                  <div key={inv.voucherId} className={cn('flex items-center gap-3 px-3 py-2.5', st === 'done' && 'bg-green-50', st === 'error' && 'bg-red-50')}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(inv.voucherId)}
                      disabled={submitting}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 shrink-0"
                    />
                    <span className="font-mono text-xs text-gray-700 w-28 shrink-0">{inv.voucherNumber}</span>
                    <span className="text-xs text-gray-500 shrink-0">
                      Outstanding: {currencyCode ? `${currencyCode} ` : ''}
                      {Number(inv.outstandingAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <div className="ml-auto flex flex-col items-end gap-0.5">
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        step="0.01"
                        max={inv.outstandingAmount}
                        value={amounts[inv.voucherId] ?? ''}
                        onChange={(e) => setAmounts((prev) => ({ ...prev, [inv.voucherId]: e.target.value }))}
                        disabled={!isChecked || submitting}
                        className={cn(
                          'w-28 rounded-lg border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400',
                          isChecked && amountInvalid(inv) ? 'border-red-300' : 'border-gray-300',
                          (!isChecked || submitting) && 'cursor-not-allowed bg-gray-50 opacity-60',
                        )}
                      />
                      {errMsg && <p className="text-xs text-red-600">{errMsg}</p>}
                      {st === 'done' && <p className="text-xs text-green-600">Paid</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment proof */}
            <div>
              <p className="mb-1 text-sm font-medium text-gray-700">Payment Proof <span className="text-gray-400 font-normal">(optional, shared)</span></p>
              {file ? (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-5 w-5 shrink-0 text-gray-500" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="ml-3 rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="select-pay-file"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-4 cursor-pointer hover:border-primary-400 hover:bg-primary-50/40"
                >
                  <Upload className="h-5 w-5 text-gray-400" />
                  <p className="mt-1 text-sm font-medium text-gray-700">Click to upload</p>
                  <p className="mt-0.5 text-xs text-gray-500">Image or PDF</p>
                  <input
                    ref={fileInputRef}
                    id="select-pay-file"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3 shrink-0">
            <div className="text-xs text-gray-500">
              {selectedInvoices.length} selected &middot; Total{' '}
              <span className="font-semibold text-gray-800">
                {currencyCode ? `${currencyCode} ` : ''}
                {totalSelected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Pay Selected
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
