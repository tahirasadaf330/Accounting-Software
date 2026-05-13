'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Upload, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';

interface VendorOption {
  id: string;
  name: string;
  type: string;
  accountId: string | null;
  isActive: boolean;
}

interface MatchedInvoice {
  reference: string;
  voucherId: string;
  amount: string;
}

interface PreviewRow {
  rowNumber: number;
  date: string;
  amount: string;
  invoiceRefs: string[];
  matchedInvoices: MatchedInvoice[];
  apAccountCode: string;
  bankAccountCode: string;
}

interface InvalidRow {
  rowNumber: number;
  raw: Record<string, unknown>;
  errors: string[];
}

interface PreviewResponse {
  totalRows: number;
  valid: PreviewRow[];
  invalid: InvalidRow[];
}

interface CommitResponse {
  created: number;
  failed: { rowNumber: number; error: string }[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export default function ImportPaymentVouchersModal({
  open,
  onClose,
  onCompleted,
}: Props) {
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [contactId, setContactId] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [step, setStep] = useState<'pick' | 'preview' | 'done'>('pick');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [commitResult, setCommitResult] = useState<CommitResponse | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep('pick');
    setError(null);
    setPreview(null);
    setCommitResult(null);
    setFile(null);
    setContactId('');

    let cancelled = false;
    setVendorsLoading(true);
    api
      .get<VendorOption[]>('/contacts', { isActive: true })
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : [];
        setVendors(
          list.filter(
            (c) => (c.type === 'VENDOR' || c.type === 'BOTH') && c.isActive,
          ),
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load vendors');
      })
      .finally(() => {
        if (!cancelled) setVendorsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedVendor = useMemo(
    () => vendors.find((v) => v.id === contactId) ?? null,
    [vendors, contactId],
  );

  const canPreview = contactId && file && !working;

  const handlePreview = async () => {
    if (!contactId || !file) return;
    setError(null);
    setWorking(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('contactId', contactId);
      const res = await api.postFormData<PreviewResponse>(
        '/vouchers/import/payment-vouchers/preview',
        fd,
      );
      setPreview(res);
      setStep('preview');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Preview failed');
    } finally {
      setWorking(false);
    }
  };

  const handleCommit = async () => {
    if (!contactId || !file) return;
    setError(null);
    setWorking(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('contactId', contactId);
      const res = await api.postFormData<CommitResponse>(
        '/vouchers/import/payment-vouchers/commit',
        fd,
      );
      setCommitResult(res);
      setStep('done');
      onCompleted?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Import failed');
    } finally {
      setWorking(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Import Payment Vouchers from Excel
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Reads the {`"Voucher"`} sheet. Each row creates a PAYMENT voucher
              and allocates it against the invoices listed in column D.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            disabled={working}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'pick' && (
            <div className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Vendor <span className="text-red-500">*</span>
                </label>
                {vendorsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading vendors…
                  </div>
                ) : (
                  <select
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">Select a vendor…</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                )}
                {selectedVendor && !selectedVendor.accountId && (
                  <p className="mt-1 text-xs text-red-600">
                    This vendor has no linked GL account.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Excel file (.xlsx) <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
                />
                {file && (
                  <p className="mt-1 text-xs text-gray-500">
                    Selected: <span className="font-medium">{file.name}</span> ({Math.round(file.size / 1024)} KB)
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-gray-900">
                  Expected column layout (sheet {`"Voucher"`})
                </h3>
                <p className="mb-2 text-xs text-gray-600">
                  First 2 rows are skipped as banners/headers. Data starts at row 3.
                </p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-1 pr-3">Col</th>
                      <th className="py-1 pr-3">Header</th>
                      <th className="py-1">Maps to</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr><td className="py-0.5 pr-3 font-mono">A</td><td className="py-0.5 pr-3">Voucher Type</td><td>must be {`"Payment"`}</td></tr>
                    <tr><td className="py-0.5 pr-3 font-mono">B</td><td className="py-0.5 pr-3">Date</td><td>Voucher.date</td></tr>
                    <tr><td className="py-0.5 pr-3 font-mono">C</td><td className="py-0.5 pr-3">Amount ($)</td><td>Total payment amount</td></tr>
                    <tr><td className="py-0.5 pr-3 font-mono">D</td><td className="py-0.5 pr-3 font-medium">Invoice # Paid</td><td className="font-medium">Comma-separated invoice refs</td></tr>
                    <tr><td className="py-0.5 pr-3 font-mono">E</td><td className="py-0.5 pr-3">Contact</td><td>Must match selected vendor</td></tr>
                    <tr><td className="py-0.5 pr-3 font-mono">F</td><td className="py-0.5 pr-3">Line Item 1 - Client (account)</td><td>AP account (DR)</td></tr>
                    <tr><td className="py-0.5 pr-3 font-mono">G</td><td className="py-0.5 pr-3">Line Item 2 - Bank (account)</td><td>Bank account (CR)</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 'preview' && preview && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Total rows" value={preview.totalRows} tone="gray" />
                <Stat label="Valid" value={preview.valid.length} tone="green" />
                <Stat label="Invalid" value={preview.invalid.length} tone="red" />
              </div>

              {preview.valid.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">
                    Will import ({preview.valid.length})
                  </h3>
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-gray-50 text-left text-gray-600">
                        <tr>
                          <th className="px-3 py-2">Row</th>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Invoices paid</th>
                          <th className="px-3 py-2">AP/Bank</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {preview.valid.slice(0, 200).map((r) => (
                          <tr key={r.rowNumber}>
                            <td className="px-3 py-1.5 text-gray-500">{r.rowNumber}</td>
                            <td className="px-3 py-1.5">{r.date}</td>
                            <td className="px-3 py-1.5 font-mono">
                              {r.matchedInvoices.map((m) => (
                                <div key={m.voucherId}>{m.reference} <span className="text-gray-400">({m.amount})</span></div>
                              ))}
                            </td>
                            <td className="px-3 py-1.5 font-mono">{r.apAccountCode} / {r.bankAccountCode}</td>
                            <td className="px-3 py-1.5 text-right font-mono">{r.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {preview.invalid.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">
                    Will skip ({preview.invalid.length})
                  </h3>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-red-200">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-red-50 text-left text-red-700">
                        <tr>
                          <th className="px-3 py-2">Row</th>
                          <th className="px-3 py-2">Errors</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-100">
                        {preview.invalid.slice(0, 100).map((r) => (
                          <tr key={r.rowNumber}>
                            <td className="px-3 py-1.5 text-gray-500">{r.rowNumber}</td>
                            <td className="px-3 py-1.5 text-red-700">{r.errors.join('; ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'done' && commitResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Imported {commitResult.created} payment voucher(s).
                </span>
              </div>
              {commitResult.failed.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">
                    Failed during commit ({commitResult.failed.length})
                  </h3>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-red-200">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-red-50 text-left text-red-700">
                        <tr>
                          <th className="px-3 py-2">Row</th>
                          <th className="px-3 py-2">Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-100">
                        {commitResult.failed.map((r) => (
                          <tr key={r.rowNumber}>
                            <td className="px-3 py-1.5 text-gray-500">{r.rowNumber}</td>
                            <td className="px-3 py-1.5 text-red-700">{r.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
          {step === 'pick' && (
            <>
              <button
                onClick={onClose}
                disabled={working}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePreview}
                disabled={!canPreview}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Preview
              </button>
            </>
          )}
          {step === 'preview' && (
            <>
              <button
                onClick={() => setStep('pick')}
                disabled={working}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleCommit}
                disabled={working || (preview?.valid.length ?? 0) === 0}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {working ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Import {preview?.valid.length ?? 0} voucher(s)
              </button>
            </>
          )}
          {step === 'done' && (
            <button
              onClick={onClose}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'gray' | 'green' | 'red';
}) {
  const toneCls =
    tone === 'green'
      ? 'bg-green-50 text-green-700'
      : tone === 'red'
        ? 'bg-red-50 text-red-700'
        : 'bg-gray-50 text-gray-700';
  return (
    <div className={`rounded-lg p-3 ${toneCls}`}>
      <div className="text-xs font-medium">{label}</div>
      <div className="mt-0.5 text-2xl font-semibold">{value}</div>
    </div>
  );
}
