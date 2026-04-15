'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Send, Check, X as XIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';
import { useAuthStore } from '@/stores/auth.store';

interface NettingCycleDetail {
  id: string;
  contactId: string;
  contactName: string;
  contactType: string;
  billingCycleDays: number | null;
  startDate: string;
  endDate: string;
  dueDate: string;
  status: string;
  invoices: {
    id: string;
    voucherNumber: string;
    voucherType: string;
    totalAmount: string;
    totalPaid: string;
    remaining: string;
    status: string;
    lastPaidAt: string | null;
    date: string;
  }[];
  carryForward: {
    amount: string;
    nature: string;
    items: { voucherNumber: string; voucherType: string; remaining: string }[];
  };
  netTotal: string;
  netNature: string;
  amApprovedBy: string | null;
  amApprovedAt: string | null;
  ceoApprovedBy: string | null;
  ceoApprovedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  comments: {
    id: string;
    message: string;
    user: string;
    userId: string;
    createdAt: string;
  }[];
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

const invoiceStatusColors: Record<string, string> = {
  UNPAID: 'bg-red-100 text-red-700',
  PARTIAL: 'bg-amber-100 text-amber-700',
  SETTLED: 'bg-green-100 text-green-700',
};

export default function NettingCycleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cycleId = params.id as string;
  const tenant = useAuthStore((s) => s.tenant);
  const user = useAuthStore((s) => s.user);
  const baseCurrency = tenant?.baseCurrency ?? 'USD';
  const isOwner = user?.role === 'OWNER';
  const canManage = isOwner || user?.role === 'CHIEF_ACCOUNTANT';

  const [cycle, setCycle] = useState<NettingCycleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Comment
  const [comment, setComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // Reject
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fmt = (amount: string | number) => formatCurrency(amount, baseCurrency);

  const loadCycle = async () => {
    setLoading(true);
    try {
      const data = await api.get<NettingCycleDetail>(`/netting-cycles/${cycleId}`);
      setCycle(data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    if (cycleId) loadCycle();
  }, [cycleId]);

  const handleAction = async (action: string, body?: any) => {
    setActionLoading(true);
    setActionError('');
    try {
      await api.post(`/netting-cycles/${cycleId}/${action}`, body || {});
      loadCycle();
    } catch (err: any) {
      setActionError(err?.message || 'Action failed');
    }
    setActionLoading(false);
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setCommentLoading(true);
    try {
      await api.post(`/netting-cycles/${cycleId}/comments`, { message: comment.trim() });
      setComment('');
      loadCycle();
    } catch { /* ignore */ }
    setCommentLoading(false);
  };

  const handleReject = async () => {
    await handleAction('reject', { reason: rejectReason });
    setShowReject(false);
    setRejectReason('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!cycle) {
    return <div className="p-12 text-center text-gray-500">Netting cycle not found</div>;
  }

  const receivableInvoices = cycle.invoices.filter((i) => i.voucherType === 'SALES');
  const payableInvoices = cycle.invoices.filter((i) => i.voucherType === 'PURCHASE');

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/netting-cycles')}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {cycle.contactName}
              <span className={`ml-3 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[cycle.status]}`}>
                {statusLabels[cycle.status]}
              </span>
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Cycle: {cycle.startDate} — {cycle.endDate} | Due: {cycle.dueDate}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {cycle.status === 'OPEN' && canManage && (
            <button
              onClick={() => handleAction('send-to-am')}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> Send to AM
            </button>
          )}
          {cycle.status === 'PENDING_AM' && (
            <span className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 ring-1 ring-blue-200">
              Waiting for AM approval
            </span>
          )}
          {cycle.status === 'PENDING_CEO' && (
            <span className="rounded-lg bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 ring-1 ring-amber-200">
              Waiting for CEO approval
            </span>
          )}
        </div>
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>
      )}

      {/* Approval trail */}
      {(cycle.amApprovedBy || cycle.ceoApprovedBy || cycle.rejectedBy) && (
        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 space-y-1 text-sm">
          {cycle.amApprovedBy && (
            <p className="text-green-700">AM Approved by {cycle.amApprovedBy} on {new Date(cycle.amApprovedAt!).toLocaleString()}</p>
          )}
          {cycle.ceoApprovedBy && (
            <p className="text-green-700">CEO Approved by {cycle.ceoApprovedBy} on {new Date(cycle.ceoApprovedAt!).toLocaleString()}</p>
          )}
          {cycle.rejectedBy && (
            <p className="text-red-700">Rejected by {cycle.rejectedBy} on {new Date(cycle.rejectedAt!).toLocaleString()}
              {cycle.rejectionReason && <span> — "{cycle.rejectionReason}"</span>}
            </p>
          )}
        </div>
      )}

      {/* Invoices */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        {/* Receivable */}
        {receivableInvoices.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Sales Invoices (Receivable)</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Invoice</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Amount</th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Received</th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Remaining</th>
                    <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {receivableInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-3 py-2 font-mono text-gray-700">{inv.voucherNumber}</td>
                      <td className="px-3 py-2 text-gray-500">{inv.date}</td>
                      <td className="px-3 py-2 text-right">{fmt(inv.totalAmount)}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{fmt(inv.totalPaid)}</td>
                      <td className="px-3 py-2 text-right font-medium">{fmt(inv.remaining)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${invoiceStatusColors[inv.status]}`}>
                          {inv.status === 'PARTIAL' ? 'Partial' : inv.status === 'SETTLED' ? 'Settled' : 'Unpaid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payable */}
        {payableInvoices.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Purchase Invoices (Payable)</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Invoice</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Amount</th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Paid</th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Remaining</th>
                    <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payableInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-3 py-2 font-mono text-gray-700">{inv.voucherNumber}</td>
                      <td className="px-3 py-2 text-gray-500">{inv.date}</td>
                      <td className="px-3 py-2 text-right">{fmt(inv.totalAmount)}</td>
                      <td className="px-3 py-2 text-right text-gray-600">{fmt(inv.totalPaid)}</td>
                      <td className="px-3 py-2 text-right font-medium">{fmt(inv.remaining)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${invoiceStatusColors[inv.status]}`}>
                          {inv.status === 'PARTIAL' ? 'Partial' : inv.status === 'SETTLED' ? 'Settled' : 'Unpaid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Carry Forward */}
        {parseFloat(cycle.carryForward.amount) > 0 && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            <p className="font-medium text-amber-800">
              Carry Forward: {fmt(cycle.carryForward.amount)} {cycle.carryForward.nature}
            </p>
            {cycle.carryForward.items.map((item, i) => (
              <p key={i} className="text-amber-600 text-xs mt-1">
                {item.voucherNumber} — {fmt(item.remaining)} remaining
              </p>
            ))}
          </div>
        )}

        {/* Net Total */}
        <div className="rounded-lg border-2 border-gray-300 bg-gray-50 p-4 text-center">
          <p className="text-sm text-gray-500 mb-1">Net Total</p>
          <p className="text-2xl font-bold text-gray-900">
            {fmt(cycle.netTotal)}
            <span className={`ml-3 inline-flex items-center rounded-md px-3 py-1 text-sm font-medium ring-1 ring-inset ${
              cycle.netNature === 'Receivable'
                ? 'text-green-700 bg-green-50 ring-green-600/20'
                : cycle.netNature === 'Payable'
                ? 'text-red-700 bg-red-50 ring-red-600/20'
                : 'text-gray-500 bg-gray-50 ring-gray-500/20'
            }`}>
              {cycle.netNature}
            </span>
          </p>
        </div>
      </div>

      {/* Comments */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Comments ({cycle.comments.length})</h3>

        {cycle.comments.length > 0 && (
          <div className="space-y-3 mb-4">
            {cycle.comments.map((c) => (
              <div key={c.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{c.user}</span>
                  <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-700">{c.message}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleComment()}
            placeholder="Type your comment here..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
          <button
            onClick={handleComment}
            disabled={commentLoading || !comment.trim()}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {commentLoading ? '...' : 'Post'}
          </button>
        </div>
      </div>

      {/* Reject Modal */}
      {showReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Reject Netting Cycle</h3>
            <div className="mt-3">
              <label className="mb-1 block text-sm font-medium text-gray-700">Reason (optional)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="Why are you rejecting this cycle?"
              />
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => { setShowReject(false); setRejectReason(''); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
