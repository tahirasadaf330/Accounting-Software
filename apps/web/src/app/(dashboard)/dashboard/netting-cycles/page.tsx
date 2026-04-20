'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import { useAuthStore } from '@/stores/auth.store';

interface NettingCycle {
  id: string;
  contactName: string;
  startDate: string;
  endDate: string;
  dueDate: string;
  status: string;
  netTotal: string;
  netNature: string;
  invoices: any[];
}

interface Contact {
  id: string;
  name: string;
  paymentTermDays: number | null;
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-gray-100 text-gray-700',
  PENDING_AM: 'bg-blue-100 text-blue-700',
  PENDING_CEO: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  AM_REJECTED: 'bg-red-100 text-red-700',
  CEO_REJECTED: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  OPEN: 'Open',
  PENDING_AM: 'Pending AM Approval',
  PENDING_CEO: 'Pending CEO Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  AM_REJECTED: 'AM Rejected',
  CEO_REJECTED: 'CEO Rejected',
};

export default function NettingCyclesPage() {
  const router = useRouter();
  const tenant = useAuthStore((s) => s.tenant);
  const user = useAuthStore((s) => s.user);
  const baseCurrency = tenant?.baseCurrency ?? 'USD';
  const canManage = user?.role === 'OWNER' || user?.role === 'CHIEF_ACCOUNTANT';

  const [cycles, setCycles] = useState<NettingCycle[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactFilter, setContactFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create cycle modal
  const [showCreate, setShowCreate] = useState(false);
  const [createContactId, setCreateContactId] = useState('');
  const [createStartDate, setCreateStartDate] = useState('');
  const [createEndDate, setCreateEndDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [availableInvoices, setAvailableInvoices] = useState<any[]>([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<NettingCycle | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fmt = (amount: string | number) => formatCurrency(amount, baseCurrency);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/netting-cycles/${deleteTarget.id}`);
      setDeleteTarget(null);
      loadCycles();
    } catch { /* ignore */ }
    setDeleteLoading(false);
  };

  useEffect(() => {
    api.get<any>('/contacts', { isActive: true }).then((data) => {
      const list = Array.isArray(data) ? data : data.data || [];
      setContacts(list);
    }).catch(() => {});
    loadCycles();
  }, []);

  const loadCycles = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (contactFilter) params.contactId = contactFilter;
      if (statusFilter) params.status = statusFilter;
      const data = await api.get<NettingCycle[]>('/netting-cycles', params);
      setCycles(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    loadCycles();
  }, [contactFilter, statusFilter]);

  // Auto-calculate end date when contact and start date are set
  useEffect(() => {
    if (createContactId && createStartDate) {
      const contact = contacts.find((c) => c.id === createContactId);
      if (contact?.paymentTermDays) {
        const start = new Date(createStartDate);
        const end = new Date(start);
        end.setDate(end.getDate() + contact.paymentTermDays - 1);
        setCreateEndDate(end.toISOString().split('T')[0]);
      }
    }
  }, [createContactId, createStartDate, contacts]);

  // Fetch unpaid invoices when contact + dates are set
  useEffect(() => {
    if (createContactId && createStartDate && createEndDate) {
      setLoadingInvoices(true);
      api.get<any[]>('/netting-cycles/unpaid-invoices', {
        contactId: createContactId,
        startDate: createStartDate,
        endDate: createEndDate,
      }).then((data) => {
        setAvailableInvoices(data);
        setSelectedInvoiceIds(data.map((inv: any) => inv.id)); // select all by default
      }).catch(() => {
        setAvailableInvoices([]);
      }).finally(() => setLoadingInvoices(false));
    } else {
      setAvailableInvoices([]);
      setSelectedInvoiceIds([]);
    }
  }, [createContactId, createStartDate, createEndDate]);

  const handleCreate = async () => {
    if (!createContactId || !createStartDate || !createEndDate) {
      setCreateError('All fields are required');
      return;
    }
    if (selectedInvoiceIds.length === 0) {
      setCreateError('Please select at least one invoice');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      await api.post('/netting-cycles', {
        contactId: createContactId,
        startDate: createStartDate,
        endDate: createEndDate,
        invoiceIds: selectedInvoiceIds,
      });
      setShowCreate(false);
      setCreateContactId('');
      setCreateStartDate('');
      setCreateEndDate('');
      setAvailableInvoices([]);
      setSelectedInvoiceIds([]);
      loadCycles();
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create cycle');
    }
    setCreating(false);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Invoice Netting</h1>
        {canManage && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" /> Create Netting
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={contactFilter}
          onChange={(e) => setContactFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Contacts</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="PENDING_AM">Pending AM Approval</option>
          <option value="PENDING_CEO">Pending CEO Approval</option>
          <option value="APPROVED">Approved</option>
          <option value="AM_REJECTED">AM Rejected</option>
          <option value="CEO_REJECTED">CEO Rejected</option>
        </select>
      </div>

      {/* Cycles list */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : cycles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 text-gray-500 shadow-sm ring-1 ring-gray-200">
          <p className="text-sm">No netting cycles found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cycles.map((cycle) => (
            <div
              key={cycle.id}
              onClick={() => router.push(`/dashboard/netting-cycles/${cycle.id}`)}
              className="cursor-pointer rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 hover:ring-primary-300 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{cycle.contactName}</h3>
                  <p className="text-sm text-gray-500">
                    {cycle.startDate} — {cycle.endDate} | Due: {cycle.dueDate}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[cycle.status] || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabels[cycle.status] || cycle.status}
                  </span>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{fmt(cycle.netTotal)}</p>
                    <p className={`text-xs font-medium ${cycle.netNature === 'Receivable' ? 'text-green-600' : cycle.netNature === 'Payable' ? 'text-red-600' : 'text-gray-500'}`}>
                      {cycle.netNature}
                    </p>
                  </div>
                  {canManage && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(cycle); }}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete netting"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400">{cycle.invoices.length} invoice(s) in this cycle</p>
            </div>
          ))}
        </div>
      )}

      {/* Create Netting Modal */}
      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Delete Netting</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete the netting record for <strong>{deleteTarget.contactName}</strong> ({deleteTarget.startDate} — {deleteTarget.endDate})?
            </p>
            <p className="mt-1 text-xs text-gray-400">This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Invoice Netting</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Contact *</label>
                <select
                  value={createContactId}
                  onChange={(e) => setCreateContactId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select contact</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Start Date *</label>
                  <input
                    type="date"
                    value={createStartDate}
                    onChange={(e) => setCreateStartDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">End Date *</label>
                  <input
                    type="date"
                    value={createEndDate}
                    onChange={(e) => setCreateEndDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              {/* Invoice selection */}
              {availableInvoices.length > 0 && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Select Invoices ({selectedInvoiceIds.length}/{availableInvoices.length})
                  </label>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-300 divide-y divide-gray-100">
                    {availableInvoices.map((inv) => (
                      <label key={inv.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedInvoiceIds.includes(inv.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedInvoiceIds((p) => [...p, inv.id]);
                            else setSelectedInvoiceIds((p) => p.filter((id) => id !== inv.id));
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-mono text-gray-700">{inv.voucherNumber}</span>
                            <span className={`text-xs font-medium ${inv.voucherType === 'SALES' ? 'text-green-600' : 'text-red-600'}`}>
                              {inv.voucherType === 'SALES' ? 'Receivable' : 'Payable'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500 mt-0.5">
                            <span>
                              Billing Period:{' '}
                              {inv.periodStart && inv.periodEnd
                                ? `${inv.periodStart} — ${inv.periodEnd}`
                                : '—'}
                            </span>
                            <span>Remaining: {fmt(inv.remaining)}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            Invoice Date: {inv.date} | Amount: {fmt(inv.totalAmount)}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="mt-1 flex gap-2">
                    <button type="button" onClick={() => setSelectedInvoiceIds(availableInvoices.map((i: any) => i.id))} className="text-xs text-primary-600 hover:underline">Select All</button>
                    <button type="button" onClick={() => setSelectedInvoiceIds([])} className="text-xs text-gray-500 hover:underline">Clear All</button>
                  </div>
                </div>
              )}
              {loadingInvoices && (
                <div className="flex items-center justify-center py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                  <span className="ml-2 text-sm text-gray-500">Loading invoices...</span>
                </div>
              )}
              {!loadingInvoices && createContactId && createStartDate && createEndDate && availableInvoices.length === 0 && (
                <p className="text-sm text-gray-500">No unpaid invoices found for this customer in the selected period.</p>
              )}

              {createError && <p className="text-sm text-red-600">{createError}</p>}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowCreate(false); setCreateError(''); }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
