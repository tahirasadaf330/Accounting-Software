'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
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
  const canManage = ['OWNER', 'ASSISTANT_MANAGER_BILLING'].includes(user?.role ?? '');

  const [cycles, setCycles] = useState<NettingCycle[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactFilter, setContactFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create cycle modal
  const [showCreate, setShowCreate] = useState(false);
  const [createContactId, setCreateContactId] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const contactDropdownRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (contactDropdownRef.current && !contactDropdownRef.current.contains(e.target as Node)) {
        setShowContactDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch unpaid invoices when contact + end date are set
  useEffect(() => {
    if (createContactId && createEndDate) {
      setLoadingInvoices(true);
      api.get<any[]>('/netting-cycles/unpaid-invoices', {
        contactId: createContactId,
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
  }, [createContactId, createEndDate]);

  const handleCreate = async () => {
    if (!createContactId || !createEndDate) {
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
        endDate: createEndDate,
        invoiceIds: selectedInvoiceIds,
      });
      setShowCreate(false);
      setCreateContactId('');
      setContactSearch('');
      setCreateEndDate('');
      setAvailableInvoices([]);
      setSelectedInvoiceIds([]);
      loadCycles();
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create cycle');
    }
    setCreating(false);
  };

  const selectedInvoices = availableInvoices.filter((inv) => selectedInvoiceIds.includes(inv.id));
  const totalReceivable = selectedInvoices
    .filter((inv) => inv.voucherType === 'SALES')
    .reduce((sum, inv) => sum + parseFloat(inv.remaining || '0'), 0);
  const totalPayable = selectedInvoices
    .filter((inv) => inv.voucherType === 'PURCHASE')
    .reduce((sum, inv) => sum + parseFloat(inv.remaining || '0'), 0);
  const netAmount = totalReceivable - totalPayable;
  const netNature = netAmount > 0 ? 'Receivable' : netAmount < 0 ? 'Payable' : 'Settled';

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
                <div ref={contactDropdownRef} className="relative">
                  <div
                    className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    onClick={() => setShowContactDropdown((v) => !v)}
                  >
                    <span className={createContactId ? 'text-gray-900' : 'text-gray-400'}>
                      {createContactId ? contacts.find((c) => c.id === createContactId)?.name : 'Select contact'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                  </div>
                  {showContactDropdown && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                      <div className="p-2 border-b border-gray-100">
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search contacts..."
                          value={contactSearch}
                          onChange={(e) => setContactSearch(e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <ul className="max-h-48 overflow-y-auto py-1">
                        {contacts
                          .filter((c) => c.name.toLowerCase().includes(contactSearch.toLowerCase()))
                          .map((c) => (
                            <li
                              key={c.id}
                              onClick={() => {
                                setCreateContactId(c.id);
                                setContactSearch('');
                                setShowContactDropdown(false);
                              }}
                              className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-50 ${createContactId === c.id ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-900'}`}
                            >
                              {c.name}
                            </li>
                          ))}
                        {contacts.filter((c) => c.name.toLowerCase().includes(contactSearch.toLowerCase())).length === 0 && (
                          <li className="px-3 py-2 text-sm text-gray-400">No contacts found</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
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
                  {selectedInvoiceIds.length > 0 && (
                    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Total Receivable</span>
                        <span className="font-medium text-green-600">{fmt(totalReceivable)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Total Payable</span>
                        <span className="font-medium text-red-600">{fmt(totalPayable)}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-1.5 flex items-center justify-between text-sm font-semibold text-gray-900">
                        <span>Net Total</span>
                        <span className="flex items-center gap-2">
                          {fmt(Math.abs(netAmount))}
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            netNature === 'Receivable'
                              ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20'
                              : netNature === 'Payable'
                              ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {netNature}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {loadingInvoices && (
                <div className="flex items-center justify-center py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                  <span className="ml-2 text-sm text-gray-500">Loading invoices...</span>
                </div>
              )}
              {!loadingInvoices && createContactId && createEndDate && availableInvoices.length === 0 && (
                <p className="text-sm text-gray-500">No unpaid invoices found for this customer in the selected period.</p>
              )}

              {createError && <p className="text-sm text-red-600">{createError}</p>}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowCreate(false); setCreateError(''); setContactSearch(''); }}
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
