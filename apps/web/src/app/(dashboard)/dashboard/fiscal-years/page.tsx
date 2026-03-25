'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Calendar, ChevronDown, ChevronUp, Lock, LockOpen, Plus, X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface FiscalPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  periodNumber: number;
  isClosed: boolean;
}

interface FiscalYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
  periods: FiscalPeriod[];
}

// ── Confirm Modal ──────────────────────────────────────────────
function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  confirmColor = 'red',
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: 'red' | 'blue' | 'green';
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  const colors = {
    red: 'bg-red-600 hover:bg-red-700',
    blue: 'bg-primary-600 hover:bg-primary-700',
    green: 'bg-green-600 hover:bg-green-700',
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn('rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50', colors[confirmColor])}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create Fiscal Year Modal ───────────────────────────────────
function CreateFiscalYearModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const currentYear = new Date().getFullYear();
  const [name, setName] = useState(`FY ${currentYear}`);
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) {
      setError('All fields are required.');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('End date must be after start date.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/fiscal-years', { name: name.trim(), startDate, endDate });
      onCreated();
      onClose();
      // Reset form
      setName(`FY ${currentYear}`);
      setStartDate(`${currentYear}-01-01`);
      setEndDate(`${currentYear}-12-31`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create fiscal year.');
    }
    setSubmitting(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">New Fiscal Year</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="FY 2026"
              maxLength={100}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>
          <p className="mb-4 text-xs text-gray-500">
            12 monthly periods will be generated automatically.
          </p>
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Fiscal Year'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function FiscalYearsPage() {
  const { user } = useAuthStore();
  const userRole = user?.role || '';
  const canManage = ['OWNER', 'CHIEF_ACCOUNTANT'].includes(userRole);
  const canReopen = userRole === 'OWNER';

  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Confirm modal state
  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmColor: 'red' | 'blue' | 'green';
    action: () => Promise<void>;
  }>({ open: false, title: '', message: '', confirmLabel: '', confirmColor: 'blue', action: async () => {} });

  useEffect(() => {
    loadFiscalYears();
  }, []);

  const loadFiscalYears = async () => {
    setLoading(true);
    try {
      const data = await api.get<any>('/fiscal-years');
      setFiscalYears(data.data || data || []);
    } catch (err) {
      console.error('Failed to load fiscal years:', err);
    }
    setLoading(false);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString();

  const closePeriod = (period: FiscalPeriod) => {
    setConfirm({
      open: true,
      title: 'Close Period',
      message: `Close "${period.name}"? Transactions can no longer be posted to this period. All prior periods must already be closed.`,
      confirmLabel: 'Close Period',
      confirmColor: 'red',
      action: async () => {
        setActionLoading(period.id);
        setError('');
        try {
          await api.post(`/fiscal-years/periods/${period.id}/close`, {});
          await loadFiscalYears();
        } catch (err: any) {
          setError(err?.message || 'Failed to close period.');
        }
        setActionLoading(null);
      },
    });
  };

  const reopenPeriod = (period: FiscalPeriod) => {
    setConfirm({
      open: true,
      title: 'Reopen Period',
      message: `Reopen "${period.name}"? This will allow transactions to be posted to this period again. No later periods can be closed.`,
      confirmLabel: 'Reopen Period',
      confirmColor: 'blue',
      action: async () => {
        setActionLoading(period.id);
        setError('');
        try {
          await api.post(`/fiscal-years/periods/${period.id}/reopen`, {});
          await loadFiscalYears();
        } catch (err: any) {
          setError(err?.message || 'Failed to reopen period.');
        }
        setActionLoading(null);
      },
    });
  };

  const closeYear = (fy: FiscalYear) => {
    const openPeriods = fy.periods
      .filter((p) => !p.isClosed)
      .sort((a, b) => a.periodNumber - b.periodNumber);
    const openCount = openPeriods.length;

    setConfirm({
      open: true,
      title: 'Close Fiscal Year',
      message: openCount > 0
        ? `Close "${fy.name}"? This will close all ${openCount} open period${openCount > 1 ? 's' : ''} and then close the fiscal year. No further transactions can be posted to this year.`
        : `Close "${fy.name}"? All periods are already closed. This will lock the fiscal year and prevent any further changes.`,
      confirmLabel: 'Close Fiscal Year',
      confirmColor: 'red',
      action: async () => {
        setActionLoading(fy.id);
        setError('');
        try {
          // Close all open periods sequentially (backend enforces order)
          for (const period of openPeriods) {
            await api.post(`/fiscal-years/periods/${period.id}/close`, {});
          }
          // Now close the fiscal year itself
          await api.post(`/fiscal-years/${fy.id}/close`, {});
          await loadFiscalYears();
        } catch (err: any) {
          setError(err?.message || 'Failed to close fiscal year.');
          await loadFiscalYears(); // Refresh to show partial progress
        }
        setActionLoading(null);
      },
    });
  };

  const handleConfirm = async () => {
    await confirm.action();
    setConfirm((c) => ({ ...c, open: false }));
  };

  const getProgress = (fy: FiscalYear) => {
    if (!fy.periods?.length) return { closed: 0, total: 0 };
    const closed = fy.periods.filter((p) => p.isClosed).length;
    return { closed, total: fy.periods.length };
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fiscal Years</h1>
          <p className="mt-1 text-sm text-gray-600">Manage accounting periods</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            New Fiscal Year
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError('')} className="ml-2 font-medium underline">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : fiscalYears.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 shadow-sm ring-1 ring-gray-200">
          <Calendar className="mb-4 h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-500">No fiscal years configured</p>
          {canManage && (
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Create your first fiscal year
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {fiscalYears.map((fy) => {
            const isOpen = expanded === fy.id;
            const progress = getProgress(fy);
            const allPeriodsClosed = progress.closed === progress.total && progress.total > 0;

            return (
              <div key={fy.id} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
                {/* Header */}
                <button
                  onClick={() => setExpanded(isOpen ? null : fy.id)}
                  className="flex w-full items-center justify-between px-6 py-4 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>
                    <h3 className="text-sm font-semibold text-gray-900">{fy.name}</h3>
                    <span className="text-sm text-gray-500">
                      {formatDate(fy.startDate)} &ndash; {formatDate(fy.endDate)}
                    </span>
                    {!fy.isClosed && progress.total > 0 && (
                      <span className="text-xs text-gray-400">
                        {progress.closed}/{progress.total} periods closed
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium',
                      fy.isClosed ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700',
                    )}
                  >
                    {fy.isClosed ? 'Closed' : 'Open'}
                  </span>
                </button>

                {/* Expanded periods */}
                {isOpen && fy.periods && (
                  <div className="border-t border-gray-200 px-6 py-4">
                    {/* Close Year button */}
                    {canManage && !fy.isClosed && (
                      <div className="mb-4">
                        <button
                          onClick={() => closeYear(fy)}
                          disabled={actionLoading === fy.id}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {actionLoading === fy.id ? 'Closing...' : 'Close Fiscal Year'}
                        </button>
                        <span className="ml-3 text-xs text-gray-500">
                          {allPeriodsClosed
                            ? 'All periods are closed. This will lock the fiscal year.'
                            : `This will close all ${progress.total - progress.closed} open period${progress.total - progress.closed > 1 ? 's' : ''} and lock the fiscal year.`}
                        </span>
                      </div>
                    )}

                    {/* Progress bar */}
                    {!fy.isClosed && progress.total > 0 && (
                      <div className="mb-4">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-primary-500 transition-all"
                            style={{ width: `${(progress.closed / progress.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Period grid */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {fy.periods
                        .sort((a, b) => a.periodNumber - b.periodNumber)
                        .map((period) => (
                          <div
                            key={period.id}
                            className={cn(
                              'rounded-lg border p-3 text-sm',
                              period.isClosed ? 'border-gray-200 bg-gray-50' : 'border-green-200 bg-green-50',
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{period.name}</p>
                                <p className="text-xs text-gray-500">
                                  {formatDate(period.startDate)} &ndash; {formatDate(period.endDate)}
                                </p>
                              </div>
                              {period.isClosed ? (
                                <Lock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                              ) : (
                                <LockOpen className="h-3.5 w-3.5 shrink-0 text-green-500" />
                              )}
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <span
                                className={cn(
                                  'text-xs font-medium',
                                  period.isClosed ? 'text-gray-500' : 'text-green-600',
                                )}
                              >
                                {period.isClosed ? 'Closed' : 'Open'}
                              </span>

                              {/* Period actions */}
                              {!fy.isClosed && (
                                <>
                                  {!period.isClosed && canManage && (
                                    <button
                                      onClick={() => closePeriod(period)}
                                      disabled={actionLoading === period.id}
                                      className="rounded px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                                    >
                                      {actionLoading === period.id ? '...' : 'Close'}
                                    </button>
                                  )}
                                  {period.isClosed && canReopen && (
                                    <button
                                      onClick={() => reopenPeriod(period)}
                                      disabled={actionLoading === period.id}
                                      className="rounded px-2 py-0.5 text-xs font-medium text-primary-600 hover:bg-primary-50 disabled:opacity-50"
                                    >
                                      {actionLoading === period.id ? '...' : 'Reopen'}
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreateFiscalYearModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={loadFiscalYears} />
      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.confirmLabel}
        confirmColor={confirm.confirmColor}
        loading={actionLoading !== null}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm((c) => ({ ...c, open: false }))}
      />
    </div>
  );
}
