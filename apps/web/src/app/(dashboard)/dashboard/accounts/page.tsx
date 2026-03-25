'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { Plus, ChevronRight, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth.store';
import AddAccountModal from './AddAccountModal';
import EditAccountModal from './EditAccountModal';

interface Account {
  id: string;
  code: string;
  name: string;
  accountType: string;
  level: number;
  normalBalance: string;
  isActive: boolean;
  isSystem?: boolean;
  description?: string | null;
  children?: Account[];
}

// ── Confirm Modal ──────────────────────────────────────────────
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

// ── Account Row ────────────────────────────────────────────────
function AccountRow({
  account,
  depth = 0,
  canEdit,
  onEdit,
  onDelete,
}: {
  account: Account;
  depth?: number;
  canEdit?: boolean;
  onEdit?: (account: Account) => void;
  onDelete?: (account: Account) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = account.children && account.children.length > 0;

  const typeColors: Record<string, string> = {
    ASSET: 'bg-blue-100 text-blue-700',
    LIABILITY: 'bg-red-100 text-red-700',
    EQUITY: 'bg-purple-100 text-purple-700',
    REVENUE: 'bg-green-100 text-green-700',
    COGS: 'bg-orange-100 text-orange-700',
    EXPENSE: 'bg-amber-100 text-amber-700',
  };

  return (
    <>
      <tr className={cn('hover:bg-gray-50', !account.isActive && 'opacity-50')}>
        <td className="whitespace-nowrap px-4 py-2 text-sm">
          <div className="flex items-center" style={{ paddingLeft: `${depth * 24}px` }}>
            {hasChildren ? (
              <button onClick={() => setExpanded(!expanded)} className="mr-2 text-gray-400">
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <span className="mr-2 w-4" />
            )}
            <span className="font-mono text-gray-500">{account.code}</span>
          </div>
        </td>
        <td className="px-4 py-2 text-sm font-medium text-gray-900">{account.name}</td>
        <td className="px-4 py-2 text-sm">
          <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', typeColors[account.accountType])}>
            {account.accountType}
          </span>
        </td>
        <td className="px-4 py-2 text-sm text-gray-500">{account.normalBalance}</td>
        <td className="px-4 py-2 text-sm text-gray-500">L{account.level}</td>
        <td className="px-4 py-2 text-sm">
          <span className={account.isActive ? 'text-green-600' : 'text-gray-400'}>
            {account.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        {canEdit && (
          <td className="px-4 py-2 text-sm">
            <div className="flex items-center gap-1">
              {!account.isSystem && (
                <button
                  onClick={() => onEdit?.(account)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  title="Edit account"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {!account.isSystem && (
                <button
                  onClick={() => onDelete?.(account)}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Delete account"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </td>
        )}
      </tr>
      {expanded && hasChildren && account.children!.map((child) => (
        <AccountRow
          key={child.id}
          account={child}
          depth={depth + 1}
          canEdit={canEdit}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'tree' | 'flat'>('tree');
  const [showAddModal, setShowAddModal] = useState(false);
  const [flatAccounts, setFlatAccounts] = useState<Account[]>([]);

  // Edit state
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === 'OWNER' || user?.role === 'CHIEF_ACCOUNTANT';

  useEffect(() => {
    loadAccounts();
  }, [view]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      if (view === 'tree') {
        const data = await api.get<Account[]>('/accounts/tree');
        setAccounts(data);
      } else {
        const data = await api.get<any>('/accounts');
        setAccounts(data.data || data);
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
    setLoading(false);
  };

  const handleOpenAddModal = async () => {
    try {
      const data = await api.get<any>('/accounts');
      setFlatAccounts(data.data || data);
    } catch {
      setFlatAccounts([]);
    }
    setShowAddModal(true);
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    loadAccounts();
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingAccount(null);
    loadAccounts();
  };

  const handleDeleteClick = (account: Account) => {
    setDeleteTarget(account);
    setDeleteError('');
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await api.delete(`/accounts/${deleteTarget.id}`);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      loadAccounts();
    } catch (err) {
      if (err instanceof ApiError) {
        setDeleteError(err.message || 'Failed to delete account');
      } else {
        setDeleteError('An unexpected error occurred');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your account hierarchy</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-gray-300">
            <button
              onClick={() => setView('tree')}
              className={cn('px-3 py-1.5 text-sm', view === 'tree' ? 'bg-gray-100 font-medium' : '')}
            >
              Tree
            </button>
            <button
              onClick={() => setView('flat')}
              className={cn('px-3 py-1.5 text-sm', view === 'flat' ? 'bg-gray-100 font-medium' : '')}
            >
              Flat
            </button>
          </div>
          {canManage && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Add Account
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Normal</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Level</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                {canManage && (
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accounts.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  canEdit={canManage}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddAccountModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
        flatAccounts={flatAccounts}
      />

      <EditAccountModal
        open={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingAccount(null); }}
        onSuccess={handleEditSuccess}
        account={editingAccount}
      />

      <ConfirmModal
        open={showDeleteConfirm}
        title="Delete Account"
        message={`Are you sure you want to permanently delete account "${deleteTarget?.code} – ${deleteTarget?.name}"? This action cannot be undone.`}
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
