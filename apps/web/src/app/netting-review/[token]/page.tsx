'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Check, X as XIcon } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface NettingReview {
  id: string;
  contactName: string;
  contactType: string;
  companyName: string;
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
    date: string;
  }[];
  carryForward: {
    amount: string;
    nature: string;
    items: { voucherNumber: string; remaining: string }[];
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
  PENDING_AM: 'Pending Your Review',
  PENDING_CEO: 'Approved — Pending CEO',
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

function fmt(amount: string | number) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function NettingReviewPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<NettingReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionDone, setActionDone] = useState('');
  const [comment, setComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/netting-review/${token}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Invalid or expired link');
      }
      setData(await res.json());
    } catch (err: any) {
      setError(err.message || 'Failed to load');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/netting-review/${token}/approve`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed');
      }
      setActionDone('approved');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
    setActionLoading(false);
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/netting-review/${token}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed');
      }
      setActionDone('rejected');
      setShowReject(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
    setActionLoading(false);
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setCommentLoading(true);
    try {
      await fetch(`${API_BASE}/netting-review/${token}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: comment.trim() }),
      });
      setComment('');
      loadData();
    } catch { /* ignore */ }
    setCommentLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-xl bg-white p-8 shadow-lg text-center">
          <div className="text-4xl mb-4">🔗</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const canAct = data.status === 'PENDING_AM' || data.status === 'PENDING_CEO';
  const receivable = data.invoices.filter((i) => i.voucherType === 'SALES');
  const payable = data.invoices.filter((i) => i.voucherType === 'PURCHASE');

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="rounded-xl bg-white p-6 shadow-sm mb-6">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500">{data.companyName}</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Netting Cycle Review</h1>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{data.contactName}</h2>
              <p className="text-sm text-gray-500">
                {data.startDate} — {data.endDate} | Due: {data.dueDate}
              </p>
            </div>
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusColors[data.status]}`}>
              {statusLabels[data.status] || data.status}
            </span>
          </div>

          {actionDone && (
            <div className={`mt-4 rounded-lg p-3 text-sm text-center font-medium ${actionDone === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {actionDone === 'approved' ? 'You have approved this netting cycle. It has been forwarded to CEO for final approval.' : 'You have rejected this netting cycle.'}
            </div>
          )}
        </div>

        {/* Approval trail */}
        {(data.amApprovedBy || data.ceoApprovedBy || data.rejectedBy) && (
          <div className="rounded-xl bg-white p-4 shadow-sm mb-6 space-y-1 text-sm">
            {data.amApprovedBy && <p className="text-green-700">AM Approved: {data.amApprovedBy} on {new Date(data.amApprovedAt!).toLocaleString()}</p>}
            {data.ceoApprovedBy && <p className="text-green-700">CEO Approved: {data.ceoApprovedBy} on {new Date(data.ceoApprovedAt!).toLocaleString()}</p>}
            {data.rejectedBy && (
              <p className="text-red-700">Rejected: {data.rejectedBy} on {new Date(data.rejectedAt!).toLocaleString()}
                {data.rejectionReason && <span> — "{data.rejectionReason}"</span>}
              </p>
            )}
          </div>
        )}

        {/* Invoices */}
        <div className="rounded-xl bg-white p-6 shadow-sm mb-6">
          {receivable.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Sales Invoices (Receivable)</h3>
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
                  {receivable.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-3 py-2 font-mono">{inv.voucherNumber}</td>
                      <td className="px-3 py-2 text-gray-500">{inv.date}</td>
                      <td className="px-3 py-2 text-right">{fmt(inv.totalAmount)}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{fmt(inv.totalPaid)}</td>
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
          )}

          {payable.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Purchase Invoices (Payable)</h3>
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
                  {payable.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-3 py-2 font-mono">{inv.voucherNumber}</td>
                      <td className="px-3 py-2 text-gray-500">{inv.date}</td>
                      <td className="px-3 py-2 text-right">{fmt(inv.totalAmount)}</td>
                      <td className="px-3 py-2 text-right text-gray-500">{fmt(inv.totalPaid)}</td>
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
          )}

          {/* Carry Forward */}
          {parseFloat(data.carryForward.amount) > 0 && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
              <p className="font-medium text-amber-800">Carry Forward: {fmt(data.carryForward.amount)} {data.carryForward.nature}</p>
              {data.carryForward.items.map((item, i) => (
                <p key={i} className="text-amber-600 text-xs mt-1">{item.voucherNumber} — {fmt(item.remaining)} remaining</p>
              ))}
            </div>
          )}

          {/* Net Total */}
          <div className="rounded-lg border-2 border-gray-300 bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Net Total</p>
            <p className="text-2xl font-bold text-gray-900">
              {fmt(data.netTotal)}
              <span className={`ml-3 inline-flex items-center rounded-md px-3 py-1 text-sm font-medium ring-1 ring-inset ${
                data.netNature === 'Receivable' ? 'text-green-700 bg-green-50 ring-green-600/20'
                : data.netNature === 'Payable' ? 'text-red-700 bg-red-50 ring-red-600/20'
                : 'text-gray-500 bg-gray-50 ring-gray-500/20'
              }`}>
                {data.netNature}
              </span>
            </p>
          </div>
        </div>

        {/* Comments */}
        <div className="rounded-xl bg-white p-6 shadow-sm mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Comments ({data.comments.length})</h3>
          {data.comments.length > 0 && (
            <div className="space-y-3 mb-4">
              {data.comments.map((c) => (
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
              placeholder="Type your comment..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleComment}
              disabled={commentLoading || !comment.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Post
            </button>
          </div>
        </div>

        {/* Action buttons */}
        {canAct && !actionDone && (
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setShowReject(true)}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              <XIcon className="h-4 w-4" /> Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <Check className="h-4 w-4" /> Approve
            </button>
          </div>
        )}

        {/* Reject modal */}
        {showReject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900">Reject Netting Cycle</h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="Reason for rejection (optional)"
              />
              <div className="mt-4 flex justify-end gap-3">
                <button onClick={() => { setShowReject(false); setRejectReason(''); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={handleReject} disabled={actionLoading} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                  {actionLoading ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 mt-8">
          This is a secure review link. Do not share it with unauthorized persons.
        </div>
      </div>
    </div>
  );
}
