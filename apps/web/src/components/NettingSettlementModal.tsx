'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Upload, Loader2, FileText, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';

interface Props {
  open: boolean;
  cycleId: string | null;
  contactName?: string;
  cycleLabel?: string;
  arTotal?: string;
  apTotal?: string;
  currencyCode?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

function formatAmount(value: string | undefined): string {
  if (!value) return '0.00';
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function NettingSettlementModal({
  open,
  cycleId,
  contactName,
  cycleLabel,
  arTotal,
  apTotal,
  currencyCode,
  onClose,
  onSuccess,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [cashAmount, setCashAmount] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const arNum = useMemo(() => {
    const n = Number(arTotal ?? '');
    return Number.isFinite(n) ? n : 0;
  }, [arTotal]);
  const apNum = useMemo(() => {
    const n = Number(apTotal ?? '');
    return Number.isFinite(n) ? n : 0;
  }, [apTotal]);

  const offset = Math.min(arNum, apNum);
  const netSigned = arNum - apNum;
  const netAbs = Math.abs(netSigned);
  const netDirection: 'Receivable' | 'Payable' | 'Settled' =
    netAbs <= 0.0001 ? 'Settled' : netSigned > 0 ? 'Receivable' : 'Payable';
  const netStr = netAbs.toFixed(2);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setError(null);
    setSubmitting(false);
    setCashAmount(netStr);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [open, netStr]);

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
    if (!cycleId) return;

    setSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      if (file) fd.append('file', file);
      fd.append('cashAmount', cashAmount);

      await api.postFormData(`/netting-cycles/${cycleId}/settle`, fd);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to settle netting cycle',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const curPrefix = currencyCode ? `${currencyCode} ` : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 flex w-full max-w-md flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Settle Netting Cycle
            </h2>
            {(contactName || cycleLabel) && (
              <p className="mt-0.5 text-xs text-gray-500">
                {contactName}
                {contactName && cycleLabel ? ' · ' : ''}
                {cycleLabel && <span className="font-mono">{cycleLabel}</span>}
              </p>
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
            <p className="text-sm text-gray-600">
              The AR and AP invoices in this cycle will be offset against each
              other for <span className="font-medium">{curPrefix}{formatAmount(offset.toFixed(4))}</span>.
              Any remaining net will be settled in cash for the amount entered below.
            </p>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">AR total</span>
                <span className="font-mono font-medium text-gray-900">
                  {curPrefix}{formatAmount(arTotal)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-gray-500">AP total</span>
                <span className="font-mono font-medium text-gray-900">
                  {curPrefix}{formatAmount(apTotal)}
                </span>
              </div>
              <div className="my-2 border-t border-gray-200" />
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Net</span>
                <span className="font-mono font-semibold text-gray-900">
                  {curPrefix}{formatAmount(netStr)}{' '}
                  <span
                    className={cn(
                      'ml-1 rounded px-1.5 py-0.5 text-[10px] font-medium',
                      netDirection === 'Receivable' &&
                        'bg-green-100 text-green-700',
                      netDirection === 'Payable' && 'bg-red-100 text-red-700',
                      netDirection === 'Settled' &&
                        'bg-gray-200 text-gray-600',
                    )}
                  >
                    {netDirection}
                  </span>
                </span>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-700">
                Cash to settle net
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {netAbs <= 0.0001
                  ? 'No cash needed — AR and AP offset to zero.'
                  : 'Settling the full net.'}
              </p>
              <input
                type="text"
                readOnly
                tabIndex={-1}
                value={cashAmount}
                aria-readonly="true"
                className="mt-1 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:outline-none"
              />
            </div>

            <div>
              <p className="mb-1 text-sm font-medium text-gray-700">
                Payment Proof
              </p>
              {file ? (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-5 w-5 shrink-0 text-gray-500" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current)
                        fileInputRef.current.value = '';
                    }}
                    className="ml-3 rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="settle-file"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-6 hover:border-primary-400 hover:bg-primary-50/40"
                >
                  <Upload className="h-6 w-6 text-gray-400" />
                  <p className="mt-2 text-sm font-medium text-gray-700">
                    Click to upload
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">Image or PDF</p>
                  <input
                    ref={fileInputRef}
                    id="settle-file"
                    type="file"
                    accept="image/*,application/pdf"
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
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Settle Cycle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
