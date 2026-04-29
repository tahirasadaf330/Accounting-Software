'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Pagination } from '@/components/Pagination';
import { Users, Plus, X, Mail, RefreshCw, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: {
    firstName: string;
    lastName: string;
  };
}

const roleColors: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-700',
  CHIEF_ACCOUNTANT: 'bg-blue-100 text-blue-700',
  ACCOUNTANT: 'bg-green-100 text-green-700',
  SUPER_ADMIN: 'bg-red-100 text-red-700',
};

const invitationStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
};

function InviteUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('ACCOUNTANT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/users/invite', { email, firstName, lastName, role });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Invite team member</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-gray-700">
                First name
              </label>
              <input
                id="firstName"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-gray-700">
                Last name
              </label>
              <input
                id="lastName"
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="inviteEmail" className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="inviteEmail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label htmlFor="role" className="mb-1 block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="ACCOUNTANT">Accountant</option>
              <option value="CHIEF_ACCOUNTANT">Chief Accountant</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.get<any>('/users', { page, limit: pageSize });
      setUsers(data.data || data || []);
      setUsersTotal(data.meta?.total ?? (Array.isArray(data) ? data.length : 0));
    } catch (err) {
      console.error('Failed to load users:', err);
    }
    setLoading(false);
  };

  const loadInvitations = async () => {
    try {
      const data = await api.get<Invitation[]>('/users/invitations');
      setInvitations(data || []);
    } catch (err) {
      console.error('Failed to load invitations:', err);
    }
  };

  const handleInviteSuccess = () => {
    setShowInviteModal(false);
    loadInvitations();
  };

  const handleResendInvitation = async (id: string) => {
    try {
      await api.post(`/users/invitations/${id}/resend`);
      loadInvitations();
    } catch (err) {
      console.error('Failed to resend invitation:', err);
    }
  };

  const handleCancelInvitation = async (id: string) => {
    try {
      await api.post(`/users/invitations/${id}/cancel`);
      loadInvitations();
    } catch (err) {
      console.error('Failed to cancel invitation:', err);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="mt-1 text-sm text-gray-600">Manage users and roles</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Invite User
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500">
            <Users className="mb-4 h-12 w-12 text-gray-300" />
            <p className="text-sm">No team members found</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', roleColors[u.role])}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={u.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-400'}>
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
        {!loading && usersTotal > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={usersTotal}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Mail className="h-5 w-5 text-gray-400" />
            Invitations
          </h2>
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Invited by</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Sent</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {inv.firstName} {inv.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{inv.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', roleColors[inv.role])}>
                        {inv.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', invitationStatusColors[inv.status])}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {inv.invitedBy.firstName} {inv.invitedBy.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleResendInvitation(inv.id)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
                            title="Resend invitation"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Resend
                          </button>
                          <button
                            onClick={() => handleCancelInvitation(inv.id)}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                            title="Cancel invitation"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showInviteModal && (
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={handleInviteSuccess}
        />
      )}
    </div>
  );
}
