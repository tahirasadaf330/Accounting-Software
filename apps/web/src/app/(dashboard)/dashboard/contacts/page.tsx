'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useDebounced } from '@/lib/useDebounced';
import { Pagination } from '@/components/Pagination';
import { Plus, Pencil, Trash2, FileText, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth.store';
import AddContactModal from './AddContactModal';
import EditContactModal from './EditContactModal';

interface Contact {
  id: string;
  type: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  taxId: string | null;
  creditLimit: string | null;
  minThreshold: string | null;
  paymentTermDays: number | null;
  currencyCode: string;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankIban: string | null;
  bankSwiftCode: string | null;
  bankRoutingNumber: string | null;
  bankAddress: string | null;
  paymentMethod: 'WIRE' | 'ACH' | null;
  accountClassification: 'PREPAYMENT' | 'POSTPAYMENT' | null;
  isActive: boolean;
  amApprovalRequired: boolean;
  accountId: string | null;
  accountCode: string | null;
  accountName: string | null;
  businessUnitId: string | null;
  businessUnitName: string | null;
  inHouseManagers: { id: string; name: string; email: string }[];
  partnerManagers: { id: string; name: string; email: string }[];
  createdAt: string;
}

const typeBadgeColors: Record<string, string> = {
  CUSTOMER: 'bg-blue-100 text-blue-700',
  VENDOR: 'bg-orange-100 text-orange-700',
  BOTH: 'bg-purple-100 text-purple-700',
};

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  confirmColor = 'red',
  loading,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: 'red' | 'blue' | 'green';
  loading: boolean;
  error?: string;
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
        {error && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
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
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ContactsResponse {
  data: Contact[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showAddModal, setShowAddModal] = useState(false);

  const debouncedSearch = useDebounced(search, 300);

  // Edit state
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'OWNER' || user?.role === 'CHIEF_ACCOUNTANT';

  // Reset to page 1 whenever filters/search/page size change.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, typeFilter, pageSize]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        limit: pageSize,
      };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (typeFilter) params.type = typeFilter;
      const data = await api.get<ContactsResponse>('/contacts', params);
      setContacts(data.data ?? []);
      setTotal(data.meta?.total ?? data.data?.length ?? 0);
    } catch (err) {
      console.error('Failed to load contacts:', err);
      setContacts([]);
      setTotal(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, typeFilter, page, pageSize]);

  const handleAddSuccess = () => {
    setShowAddModal(false);
    loadContacts();
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingContact(null);
    loadContacts();
  };

  const handleDeleteClick = (contact: Contact) => {
    setDeleteTarget(contact);
    setDeleteError('');
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await api.delete(`/contacts/${deleteTarget.id}`);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      loadContacts();
    } catch (err) {
      if (err instanceof ApiError) {
        setDeleteError(err.message || 'Failed to delete contact');
      } else {
        setDeleteError('An unexpected error occurred');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewStatement = (contact: Contact) => {
    router.push(`/dashboard/contacts/${contact.id}/statement`);
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return '—';
    const num = parseFloat(value);
    return isNaN(num) ? value : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your customers, vendors, and their trade accounts</p>
        </div>
        <div className="flex items-center gap-3">
          {canManage && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Add Contact
            </button>
          )}
        </div>
      </div>

      {/* Search bar + Type filter */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, city, country, tax ID, or account..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="">All Types</option>
          <option value="CUSTOMER">Customer</option>
          <option value="VENDOR">Vendor</option>
          <option value="BOTH">Both</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500">
            <p className="text-sm">No contacts found</p>
            {canManage && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Add your first contact
              </button>
            )}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Business Unit</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Account</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Credit Limit</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contacts.map((contact) => (
                <tr key={contact.id} className={cn('hover:bg-gray-50', !contact.isActive && 'opacity-50')}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{contact.name}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', typeBadgeColors[contact.type] || 'bg-gray-100 text-gray-600')}>
                      {contact.type === 'BOTH' ? 'Customer & Vendor' : contact.type.charAt(0) + contact.type.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {contact.businessUnitName || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{contact.email || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{contact.phone || '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    {contact.accountCode ? (
                      <span className="font-mono text-gray-600">{contact.accountCode}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatCurrency(contact.creditLimit)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={contact.isActive ? 'text-green-600' : 'text-gray-400'}>
                      {contact.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleViewStatement(contact)}
                        className="rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                        title="View Statement"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      {canManage && (
                        <>
                          <button
                            onClick={() => handleEdit(contact)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            title="Edit contact"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(contact)}
                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            title="Delete contact"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
        {!loading && total > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      <AddContactModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />

      <EditContactModal
        open={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingContact(null); }}
        onSuccess={handleEditSuccess}
        contact={editingContact}
      />

      <ConfirmModal
        open={showDeleteConfirm}
        title="Delete Contact"
        message={`Are you sure you want to permanently delete contact "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="red"
        loading={deleteLoading}
        error={deleteError}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setShowDeleteConfirm(false); setDeleteTarget(null); setDeleteError(''); }}
      />
    </div>
  );
}
