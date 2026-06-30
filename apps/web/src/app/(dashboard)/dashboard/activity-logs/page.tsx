'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { Activity, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  newValue: { description?: string } | null;
  timestamp: string;
  ipAddress: string | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
}

interface ApiResponse {
  data: ActivityLog[];
  total: number;
  page: number;
  limit: number;
}

const ACTION_COLORS: Record<string, string> = {
  login: 'bg-green-100 text-green-700',
  logout: 'bg-gray-100 text-gray-600',
  created: 'bg-blue-100 text-blue-700',
  updated: 'bg-yellow-100 text-yellow-700',
  deleted: 'bg-red-100 text-red-700',
};

const ENTITY_TYPES = ['', 'Voucher', 'Contact', 'Account', 'User', 'FiscalYear', 'NettingCycle', 'BusinessUnit', 'AccountManager', 'Currency'];

export default function ActivityLogsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const limit = 50;

  useEffect(() => {
    if (user && user.role !== 'OWNER' && user.role !== 'FINANCE_MANAGER') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (entityType) params.set('entityType', entityType);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await api.get<ApiResponse>(`/activity-logs?${params.toString()}`);
      setLogs(res.data);
      setTotal(res.total);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, entityType, from, to]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  function formatDate(ts: string) {
    return new Date(ts).toLocaleString();
  }

  function userName(log: ActivityLog) {
    if (!log.user) return 'System';
    const name = `${log.user.firstName ?? ''} ${log.user.lastName ?? ''}`.trim();
    return name || log.user.email;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Activity className="h-6 w-6 text-blue-500" />
        <h1 className="text-2xl font-bold text-white">Activity Logs</h1>
        <span className="ml-auto text-sm text-gray-400">{total} total records</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">Entity Type</label>
          <select
            value={entityType}
            onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
            className="bg-gray-700 border border-gray-600 text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>{t || 'All Types'}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="bg-gray-700 border border-gray-600 text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="bg-gray-700 border border-gray-600 text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {(entityType || from || to) && (
          <div className="flex items-end">
            <button
              onClick={() => { setEntityType(''); setFrom(''); setTo(''); setPage(1); }}
              className="text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded border border-gray-600 hover:border-gray-400 transition"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
            <Search className="h-8 w-8" />
            <p>No activity logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Timestamp</th>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Entity</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                    <td className="px-4 py-3 text-white whitespace-nowrap">{userName(log)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-700')}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{log.entityType}</td>
                    <td className="px-4 py-3 text-gray-300">{log.newValue?.description ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{log.ipAddress ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded border border-gray-600 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded border border-gray-600 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
