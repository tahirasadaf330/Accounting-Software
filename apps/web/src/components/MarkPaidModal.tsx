'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Upload, Loader2, FileText, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';

interface Props {
  open: boolean;
  voucherId: string | null;
  voucherNumber?: string | null;
  alreadyPaid?: boolean;
  outstandingAmount?: string;
  currencyCode?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function MarkPaidModal({
  open,
  voucherId,
  voucherNumber,
  alreadyPaid,
  outstandingAmount,
  currencyCode,
  onClose,
  onSuccess,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const outstandingNum = useMemo(() => {
    const n = Number(outstandingAmount ?? '');
    return Number.isFinite(n) ? n : 0;
  }, [outstandingAmount]);

  const formattedOutstanding = useMemo(() => {
    if (!outstandingAmount) return '';
    const n = Number(outstandingAmount);
    if (!Number.isFinite(n)) return outstandingAmount;
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [outstandingAmount]);

  const initialAmount = useMemo(() => {
    if (!outstandingAmount) return '';
    const n = Number(outstandingAmount);
    return Number.isFinite(n) ? n.toFixed(2) : outstandingAmount;
  }, [outstandingAmount]);

  const amountNum = Number(amount);
  const amountInvalid =
    amount === '' ||
    !Number.isFinite(amountNum) ||
    amountNum <= 0 ||
    (outstandingNum > 0 && amountNum > outstandingNum);

  const amountErrorMessage = (() => {
    if (amount === '') return null;
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return 'Amount must be greater than zero';
    }
    if (outstandingNum > 0 && amountNum > outstandingNum) {
      return 'Amount cannot exceed outstanding';
    }
    return null;
  })();

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setError(null);
    setSubmitting(false);
    setAmount(initialAmount);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (initialAmount) {
      queueMicrotask(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
      });
    }
  }, [open, initialAmount]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherId) return;

    setSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      if (file) fd.append('file', file);
      fd.append('paymentAmount', amount);

      await api.postFormData(`/vouchers/${voucherId}/mark-paid`, fd);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to mark as paid');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 flex w-full max-w-md flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Mark as Paid</h2>
            {voucherNumber && (
              <p className="mt-0.5 font-mono text-xs text-gray-500">{voucherNumber}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            {alreadyPaid && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                This invoice is already fully paid.
              </div>
            )}

            <p className="text-sm text-gray-600">
              A payment voucher will be created and allocated against this invoice. The
              invoice's outstanding will reduce by the amount entered below.
            </p>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-700">Amount</p>
              {outstandingAmount && (
                <p className="mt-0.5 text-xs text-gray-500">
                  Outstanding: {currencyCode ? `${currencyCode} ` : ''}
                  {formattedOutstanding}
                </p>
              )}
              <input
                ref={amountInputRef}
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                max={outstandingAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={alreadyPaid}
                className={cn(
                  'mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400',
                  amountErrorMessage
                    ? 'border-red-300 focus:ring-red-300'
                    : 'border-gray-300',
                  alreadyPaid && 'cursor-not-allowed bg-gray-50 opacity-60',
                )}
              />
              {amountErrorMessage && (
                <p className="mt-1 text-xs text-red-600">{amountErrorMessage}</p>
              )}
            </div>

            <div>
              <p className="mb-1 text-sm font-medium text-gray-700">Payment Proof</p>
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
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="ml-3 rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="mark-paid-file"
                  className={cn(
                    'flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-6',
                    alreadyPaid
                      ? 'cursor-not-allowed bg-gray-50 opacity-60'
                      : 'cursor-pointer hover:border-primary-400 hover:bg-primary-50/40',
                  )}
                >
                  <Upload className="h-6 w-6 text-gray-400" />
                  <p className="mt-2 text-sm font-medium text-gray-700">Click to upload</p>
                  <p className="mt-0.5 text-xs text-gray-500">Image or PDF</p>
                  <input
                    ref={fileInputRef}
                    id="mark-paid-file"
                    type="file"
                    accept="image/*,application/pdf"
                    disabled={alreadyPaid}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setFile(f);
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || alreadyPaid || amountInvalid}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Mark as Paid
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
