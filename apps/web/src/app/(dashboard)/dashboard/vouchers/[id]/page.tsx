'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/formatCurrency';
import { useAuthStore } from '@/stores/auth.store';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Download,
  Eye,
  File,
  FileImage,
  FileSpreadsheet,
  FileText as FileTextIcon,
  Paperclip,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import VoucherPrintLayout from './VoucherPrintLayout';
import { useVoucherPrintPdf } from './useVoucherPrintPdf';

// --- Types ---

interface Account {
  id: string;
  code: string;
  name: string;
  accountType: string;
  isActive: boolean;
}

interface LineItem {
  id: string;
  accountId: string;
  debit: string;
  credit: string;
  narration: string | null;
  lineOrder: number;
  account: { id: string; code: string; name: string };
}

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

interface VoucherDetail {
  id: string;
  voucherNumber: string;
  voucherType: string;
  status: string;
  date: string;
  narration: string;
  reference: string | null;
  totalAmount: string;
  currencyCode: string;
  contactId?: string | null;
  contact?: { id: string; name: string; invoiceTerms?: string | null; paymentTermDays?: number | null } | null;
  createdBy?: { firstName: string; lastName: string };
  approvedBy?: { firstName: string; lastName: string } | null;
  rejectionReason?: string | null;
  createdAt: string;
  lineItems: LineItem[];
  attachments?: Attachment[];
}

interface ExistingAllocation {
  id: string;
  amount: string;
  paidAt: string;
  invoiceVoucher: {
    id: string;
    voucherNumber: string;
    voucherType: string;
    totalAmount: string;
    date: string;
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType === 'application/pdf') return FileTextIcon;
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    mimeType === 'text/csv'
  )
    return FileSpreadsheet;
  return File;
}

// --- Zod Schema ---

const lineItemSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  debit: z.string(),
  credit: z.string(),
  narration: z.string().max(500).optional(),
});

const voucherSchema = z
  .object({
    date: z.string().min(1, 'Date is required'),
    narration: z.string().min(1, 'Narration is required').max(1000, 'Narration must be 1000 characters or less'),
    reference: z.string().optional(),
    lineItems: z.array(lineItemSchema).min(2, 'At least 2 line items are required'),
  })
  .superRefine((data, ctx) => {
    let totalDebit = 0;
    let totalCredit = 0;

    data.lineItems.forEach((item, index) => {
      const debit = parseFloat(item.debit) || 0;
      const credit = parseFloat(item.credit) || 0;

      if (debit < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Debit cannot be negative', path: ['lineItems', index, 'debit'] });
      }
      if (credit < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Credit cannot be negative', path: ['lineItems', index, 'credit'] });
      }
      if (debit > 0 && credit > 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'A line cannot have both debit and credit', path: ['lineItems', index, 'debit'] });
      }
      if (debit === 0 && credit === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a debit or credit amount', path: ['lineItems', index, 'debit'] });
      }

      totalDebit += debit;
      totalCredit += credit;
    });

    if (totalDebit === 0 && totalCredit === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Totals cannot both be zero', path: ['lineItems'] });
    }
    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Debits must equal Credits (difference: ${Math.abs(totalDebit - totalCredit).toFixed(4)})`,
        path: ['lineItems'],
      });
    }
  });

type VoucherFormData = z.infer<typeof voucherSchema>;

// --- Constants ---

const typeLabels: Record<string, string> = {
  PAYMENT: 'Payment',
  RECEIPT: 'Receipt',
  JOURNAL: 'Journal',
  CONTRA: 'Contra',
  SALES: 'Sales',
  PURCHASE: 'Purchase',
  CREDIT_NOTE: 'Credit Note',
  DEBIT_NOTE: 'Debit Note',
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  REJECTED: 'bg-red-100 text-red-700',
  POSTED: 'bg-green-100 text-green-700',
  REVERSED: 'bg-purple-100 text-purple-700',
};

const APPROVER_ROLES = ['OWNER', 'CHIEF_ACCOUNTANT'];

const defaultLineItem = { accountId: '', debit: '', credit: '', narration: '' };

// --- Confirmation Modal ---

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
  loading,
  children,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  children?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        {children}
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50',
              confirmClass || 'bg-primary-600 hover:bg-primary-700',
            )}
          >
            {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Account Combobox ---

function AccountCombobox({
  accounts,
  value,
  onChange,
  hasError,
}: {
  accounts: Account[];
  value: string;
  onChange: (id: string) => void;
  hasError: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = accounts.find((a) => a.id === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = accounts.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
  });

  return (
    <div ref={ref} className="relative">
      <div
        className={cn(
          'flex w-full cursor-pointer items-center rounded-lg border text-sm outline-none focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20',
          hasError ? 'border-red-300' : 'border-gray-300',
        )}
      >
        <input
          type="text"
          placeholder={selected ? `${selected.code} — ${selected.name}` : 'Search account...'}
          value={open ? search : selected ? `${selected.code} — ${selected.name}` : ''}
          onFocus={() => { setOpen(true); setSearch(''); }}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg bg-transparent px-2 py-1.5 outline-none placeholder:text-gray-400"
        />
        <ChevronDown className="mr-2 h-3.5 w-3.5 shrink-0 text-gray-400" />
      </div>
      {open && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">No accounts found</li>
          ) : (
            filtered.map((a) => (
              <li
                key={a.id}
                onMouseDown={() => { onChange(a.id); setSearch(''); setOpen(false); }}
                className={cn(
                  'cursor-pointer px-3 py-1.5 text-sm hover:bg-primary-50',
                  a.id === value && 'bg-primary-50 font-medium text-primary-700',
                )}
              >
                <span className="font-mono text-gray-500">{a.code}</span>
                <span className="mx-1.5 text-gray-300">—</span>
                <span>{a.name}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

// --- Attachment Preview Modal ---

function AttachmentPreviewModal({
  attachment,
  voucherId,
  onClose,
}: {
  attachment: Attachment | null;
  voucherId: string;
  onClose: () => void;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!attachment) return;

    let revoked = false;
    setLoading(true);
    setBlobUrl(null);

    api
      .getFileUrl(`/vouchers/${voucherId}/attachments/${attachment.id}/download`)
      .then((url) => {
        if (!revoked) setBlobUrl(url);
        else URL.revokeObjectURL(url);
      })
      .catch(() => {
        // failed to load — blobUrl stays null
      })
      .finally(() => {
        if (!revoked) setLoading(false);
      });

    return () => {
      revoked = true;
    };
  }, [attachment, voucherId]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  useEffect(() => {
    if (!attachment) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [attachment, onClose]);

  if (!attachment) return null;

  const isImage = attachment.mimeType.startsWith('image/');
  const isPdf = attachment.mimeType === 'application/pdf';
  const Icon = getFileIcon(attachment.mimeType);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 bg-gray-900/90 px-4 py-3 text-white">
        <Icon className="h-5 w-5 shrink-0 text-gray-300" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{attachment.fileName}</p>
          <p className="text-xs text-gray-400">{formatFileSize(attachment.fileSize)}</p>
        </div>
        <button
          type="button"
          onClick={() =>
            api.downloadFile(
              `/vouchers/${voucherId}/attachments/${attachment.id}/download`,
              attachment.fileName,
            )
          }
          className="flex items-center gap-1.5 rounded-lg border border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-200 hover:bg-gray-700"
        >
          <Download className="h-4 w-4" />
          Download
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center overflow-auto p-4">
        {loading ? (
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
        ) : isImage && blobUrl ? (
          <img
            src={blobUrl}
            alt={attachment.fileName}
            className="max-h-[85vh] max-w-full object-contain"
          />
        ) : isPdf && blobUrl ? (
          <iframe
            src={blobUrl}
            title={attachment.fileName}
            className="h-full w-full max-w-4xl rounded-lg bg-white"
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-center text-white">
            <Icon className="h-16 w-16 text-gray-400" />
            <p className="text-lg font-medium">Preview not available for this file type</p>
            <button
              type="button"
              onClick={() =>
                api.downloadFile(
                  `/vouchers/${voucherId}/attachments/${attachment.id}/download`,
                  attachment.fileName,
                )
              }
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
            >
              <Download className="h-4 w-4" />
              Download File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Read-Only View ---

function VoucherView({
  voucher,
  userRole,
  companyName,
  onEdit,
  onRefresh,
}: {
  voucher: VoucherDetail;
  userRole: string;
  companyName: string;
  onEdit: () => void;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const isEditable = voucher.status === 'DRAFT' || voucher.status === 'REJECTED';
  const canApprove = APPROVER_ROLES.includes(userRole);
  const formatAmount = (v: string) => formatCurrency(v, voucher.currencyCode);
  const { printRef, handlePrint, handleExportPdf, isExporting } = useVoucherPrintPdf(voucher);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>(voucher.attachments || []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const viewFileInputRef = useRef<HTMLInputElement>(null);

  const handleViewUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const result = await api.uploadFiles<{ attachments: Attachment[] }>(
        `/vouchers/${voucher.id}/attachments`,
        Array.from(files),
      );
      setAttachments((prev) => [...prev, ...result.attachments]);
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Upload failed');
    }
    setUploading(false);
    if (viewFileInputRef.current) viewFileInputRef.current.value = '';
  };

  const handleViewDeleteAttachment = async (attachmentId: string) => {
    try {
      await api.delete(`/vouchers/${voucher.id}/attachments/${attachmentId}`);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  };

  // Modal states
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReverseConfirm, setShowReverseConfirm] = useState(false);
  const [existingAllocations, setExistingAllocations] = useState<ExistingAllocation[]>([]);

  useEffect(() => {
    const canHaveAllocations =
      voucher.status === 'POSTED' &&
      (voucher.voucherType === 'RECEIPT' ||
        voucher.voucherType === 'PAYMENT' ||
        voucher.voucherType === 'JOURNAL') &&
      !!voucher.contactId;
    if (!canHaveAllocations) {
      setExistingAllocations([]);
      return;
    }
    api
      .get<ExistingAllocation[]>(`/payment-allocations/payment/${voucher.id}`)
      .then((rows) => setExistingAllocations(Array.isArray(rows) ? rows : []))
      .catch(() => setExistingAllocations([]));
  }, [voucher.id, voucher.status, voucher.voucherType, voucher.contactId]);

  const handleAction = async (action: () => Promise<void>) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'An unexpected error occurred');
    }
    setActionLoading(false);
  };

  const deleteVoucher = () =>
    handleAction(async () => {
      await api.delete(`/vouchers/${voucher.id}`);
      setShowDeleteConfirm(false);
      router.push('/dashboard/vouchers');
    });

  const reverseVoucher = () =>
    handleAction(async () => {
      await api.post(`/vouchers/${voucher.id}/reverse`, {});
      setShowReverseConfirm(false);
      onRefresh();
    });

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard/vouchers')}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{voucher.voucherNumber}</h1>
              <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', statusColors[voucher.status])}>
                {voucher.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {typeLabels[voucher.voucherType] || voucher.voucherType} Voucher
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {isExporting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export PDF
          </button>

          {/* Legacy DRAFT rows (pre-Save&Post era) can still be deleted */}
          {voucher.status === 'DRAFT' && (
            <>
              <button
                onClick={onEdit}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          )}

          {/* POSTED: Reverse (approvers only) */}
          {voucher.status === 'POSTED' && canApprove && (
            <button
              onClick={() => setShowReverseConfirm(true)}
              className="flex items-center gap-2 rounded-lg border border-orange-300 px-3 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reverse
            </button>
          )}

        </div>
      </div>

      {/* Action Error */}
      {actionError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* Rejection Reason Banner */}
      {voucher.rejectionReason && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="font-medium">Rejection Reason:</span> {voucher.rejectionReason}
        </div>
      )}

      {/* Details Card */}
      <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Voucher Details</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Date</dt>
            <dd className="mt-1 text-sm text-gray-900">{new Date(voucher.date).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Type</dt>
            <dd className="mt-1 text-sm text-gray-900">{typeLabels[voucher.voucherType] || voucher.voucherType}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-gray-500">Narration</dt>
            <dd className="mt-1 text-sm text-gray-900">{voucher.narration}</dd>
          </div>
          {voucher.reference && (
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Reference</dt>
              <dd className="mt-1 text-sm text-gray-900">{voucher.reference}</dd>
            </div>
          )}
          {voucher.createdBy && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Created By</dt>
              <dd className="mt-1 text-sm text-gray-900">{voucher.createdBy.firstName} {voucher.createdBy.lastName}</dd>
            </div>
          )}
          {voucher.approvedBy && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Approved By</dt>
              <dd className="mt-1 text-sm text-gray-900">{voucher.approvedBy.firstName} {voucher.approvedBy.lastName}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-gray-500">Created At</dt>
            <dd className="mt-1 text-sm text-gray-900">{new Date(voucher.createdAt).toLocaleString()}</dd>
          </div>
        </dl>
      </div>

      {/* Line Items Card */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Line Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-10 px-3 py-2.5 text-left text-xs font-medium uppercase text-gray-500">#</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium uppercase text-gray-500">Account</th>
                <th className="w-36 px-3 py-2.5 text-right text-xs font-medium uppercase text-gray-500">Debit</th>
                <th className="w-36 px-3 py-2.5 text-right text-xs font-medium uppercase text-gray-500">Credit</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium uppercase text-gray-500">Narration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {voucher.lineItems.map((li, i) => (
                <tr key={li.id}>
                  <td className="px-3 py-2.5 text-sm text-gray-500">{i + 1}</td>
                  <td className="px-3 py-2.5 text-sm text-gray-900">
                    <span className="font-mono text-gray-500">{li.account.code}</span>
                    <span className="mx-1.5 text-gray-300">—</span>
                    {li.account.name}
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm text-gray-900">
                    {Number(li.debit) > 0 ? formatAmount(li.debit) : ''}
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm text-gray-900">
                    {Number(li.credit) > 0 ? formatAmount(li.credit) : ''}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-gray-700">{li.narration || ''}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-medium">
                <td className="px-3 py-2.5 text-sm text-gray-700" colSpan={2}>Totals</td>
                <td className="px-3 py-2.5 text-right text-sm text-gray-900">
                  {formatCurrency(voucher.lineItems.reduce((s, li) => s + Number(li.debit), 0), voucher.currencyCode)}
                </td>
                <td className="px-3 py-2.5 text-right text-sm text-gray-900">
                  {formatCurrency(voucher.lineItems.reduce((s, li) => s + Number(li.credit), 0), voucher.currencyCode)}
                </td>
                <td className="px-3 py-2.5 text-sm">
                  <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Balanced
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Attachments Card */}
      {(isEditable || attachments.length > 0) && (
        <div className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">
                Attachments{attachments.length > 0 ? ` (${attachments.length})` : ''}
              </h2>
            </div>
            {isEditable && (
              <>
                <button
                  type="button"
                  onClick={() => viewFileInputRef.current?.click()}
                  disabled={uploading || attachments.length >= 10}
                  className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Upload Files
                </button>
                <input
                  ref={viewFileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                  onChange={handleViewUpload}
                  className="hidden"
                />
              </>
            )}
          </div>

          {uploadError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {uploadError}
            </div>
          )}

          {attachments.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {attachments.map((att) => {
                const Icon = getFileIcon(att.mimeType);
                return (
                  <li key={att.id} className="flex items-center gap-3 py-3">
                    <Icon className="h-5 w-5 shrink-0 text-gray-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{att.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(att.fileSize)} &middot; {new Date(att.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewAttachment(att)}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        api.downloadFile(
                          `/vouchers/${voucher.id}/attachments/${att.id}/download`,
                          att.fileName,
                        )
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                    {isEditable && (
                      <button
                        type="button"
                        onClick={() => handleViewDeleteAttachment(att.id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete attachment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-8 text-center">
              <Paperclip className="mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">No attachments yet</p>
              <p className="mt-1 text-xs text-gray-400">Upload images, PDFs, or documents</p>
            </div>
          )}

          {isEditable && (
            <p className="mt-3 text-xs text-gray-400">
              {attachments.length}/10 files &middot; Max 10 MB each &middot; Images, PDF, Office docs, CSV, TXT
            </p>
          )}
        </div>
      )}

      {/* --- Confirmation Modals --- */}

      {/* Delete */}
      <ConfirmModal
        open={showDeleteConfirm}
        title="Delete Voucher"
        message={`Permanently delete voucher ${voucher.voucherNumber}? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmClass="bg-red-600 hover:bg-red-700"
        onConfirm={deleteVoucher}
        onCancel={() => setShowDeleteConfirm(false)}
        loading={actionLoading}
      />

      {/* Reverse */}
      <ConfirmModal
        open={showReverseConfirm}
        title="Reverse Voucher"
        message={`Reverse voucher ${voucher.voucherNumber}? A new reversing voucher will be created with swapped debits and credits.`}
        confirmLabel="Reverse"
        confirmClass="bg-orange-600 hover:bg-orange-700"
        onConfirm={reverseVoucher}
        onCancel={() => setShowReverseConfirm(false)}
        loading={actionLoading}
      />

      {/* Attachment Preview */}
      <AttachmentPreviewModal
        attachment={previewAttachment}
        voucherId={voucher.id}
        onClose={() => setPreviewAttachment(null)}
      />

      {/* Off-screen print layout */}
      <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
        <VoucherPrintLayout ref={printRef} voucher={voucher} companyName={companyName} />
      </div>
    </div>
  );
}

// --- Edit Form ---

function VoucherEditForm({
  voucher,
  accounts,
  onCancel,
  onSaved,
}: {
  voucher: VoucherDetail;
  accounts: Account[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>(voucher.attachments || []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<VoucherFormData>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      date: voucher.date.split('T')[0],
      narration: voucher.narration,
      reference: voucher.reference || '',
      lineItems: voucher.lineItems.map((li) => ({
        accountId: li.accountId,
        debit: Number(li.debit) > 0 ? String(Number(li.debit)) : '',
        credit: Number(li.credit) > 0 ? String(Number(li.credit)) : '',
        narration: li.narration || '',
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });
  const watchedLineItems = useWatch({ control, name: 'lineItems' });

  const totalDebit = (watchedLineItems || []).reduce((sum, item) => sum + (parseFloat(item?.debit) || 0), 0);
  const totalCredit = (watchedLineItems || []).reduce((sum, item) => sum + (parseFloat(item?.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.0001 && (totalDebit > 0 || totalCredit > 0);

  const handleDebitChange = (index: number, value: string) => {
    setValue(`lineItems.${index}.debit`, value, { shouldValidate: false });
    if (parseFloat(value) > 0) {
      setValue(`lineItems.${index}.credit`, '', { shouldValidate: false });
    }
  };

  const handleCreditChange = (index: number, value: string) => {
    setValue(`lineItems.${index}.credit`, value, { shouldValidate: false });
    if (parseFloat(value) > 0) {
      setValue(`lineItems.${index}.debit`, '', { shouldValidate: false });
    }
  };

  const onSubmit = async (data: VoucherFormData) => {
    setSubmitting(true);
    setApiError(null);
    try {
      await api.patch(`/vouchers/${voucher.id}`, {
        date: data.date,
        narration: data.narration,
        reference: data.reference || undefined,
        lineItems: data.lineItems.map((item) => ({
          accountId: item.accountId,
          debit: item.debit || '0',
          credit: item.credit || '0',
          narration: item.narration || undefined,
        })),
      });
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError('An unexpected error occurred');
      }
    }
    setSubmitting(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);
    try {
      const result = await api.uploadFiles<{ attachments: Attachment[] }>(
        `/vouchers/${voucher.id}/attachments`,
        Array.from(files),
      );
      setAttachments((prev) => [...prev, ...result.attachments]);
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Upload failed');
    }
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await api.delete(`/vouchers/${voucher.id}/attachments/${attachmentId}`);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Delete failed');
    }
  };

  const lineItemsRootError = errors.lineItems?.message || errors.lineItems?.root?.message;

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Edit {voucher.voucherNumber}</h1>
            <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', statusColors[voucher.status])}>
              {voucher.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {typeLabels[voucher.voucherType] || voucher.voucherType} Voucher
          </p>
        </div>
      </div>

      {apiError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Header Fields Card */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Voucher Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Voucher Type</label>
              <input
                type="text"
                disabled
                value={typeLabels[voucher.voucherType] || voucher.voucherType}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('date')}
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                  errors.date ? 'border-red-300' : 'border-gray-300',
                )}
              />
              {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Narration <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('narration')}
                rows={2}
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                  errors.narration ? 'border-red-300' : 'border-gray-300',
                )}
              />
              {errors.narration && <p className="mt-1 text-xs text-red-600">{errors.narration.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Reference</label>
              <input
                type="text"
                {...register('reference')}
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                  errors.reference ? 'border-red-300' : 'border-gray-300',
                )}
              />
              {errors.reference && <p className="mt-1 text-xs text-red-600">{errors.reference.message}</p>}
            </div>
          </div>
        </div>

        {/* Line Items Card */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
            <button
              type="button"
              onClick={() => append({ ...defaultLineItem })}
              className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Add Row
            </button>
          </div>

          {lineItemsRootError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {lineItemsRootError}
            </div>
          )}

          <div className="-mx-6 overflow-x-auto px-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-10 px-3 py-2.5 text-left text-xs font-medium uppercase text-gray-500">#</th>
                  <th className="min-w-[220px] px-3 py-2.5 text-left text-xs font-medium uppercase text-gray-500">
                    Account <span className="text-red-500">*</span>
                  </th>
                  <th className="w-36 px-3 py-2.5 text-right text-xs font-medium uppercase text-gray-500">Debit</th>
                  <th className="w-36 px-3 py-2.5 text-right text-xs font-medium uppercase text-gray-500">Credit</th>
                  <th className="min-w-[160px] px-3 py-2.5 text-left text-xs font-medium uppercase text-gray-500">Narration</th>
                  <th className="w-12 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fields.map((field, index) => {
                  const lineErrors = errors.lineItems?.[index];
                  return (
                    <tr key={field.id}>
                      <td className="px-3 py-2 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-3 py-2">
                        <AccountCombobox
                          accounts={accounts}
                          value={watchedLineItems?.[index]?.accountId || ''}
                          onChange={(id) => setValue(`lineItems.${index}.accountId`, id, { shouldValidate: false })}
                          hasError={!!lineErrors?.accountId}
                        />
                        {lineErrors?.accountId && <p className="mt-0.5 text-xs text-red-600">{lineErrors.accountId.message}</p>}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number" step="0.01" min="0" placeholder="0.00"
                          {...register(`lineItems.${index}.debit`)}
                          onChange={(e) => handleDebitChange(index, e.target.value)}
                          className={cn(
                            'w-full rounded-lg border px-2 py-1.5 text-right text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                            lineErrors?.debit ? 'border-red-300' : 'border-gray-300',
                          )}
                        />
                        {lineErrors?.debit && <p className="mt-0.5 text-xs text-red-600">{lineErrors.debit.message}</p>}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number" step="0.01" min="0" placeholder="0.00"
                          {...register(`lineItems.${index}.credit`)}
                          onChange={(e) => handleCreditChange(index, e.target.value)}
                          className={cn(
                            'w-full rounded-lg border px-2 py-1.5 text-right text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                            lineErrors?.credit ? 'border-red-300' : 'border-gray-300',
                          )}
                        />
                        {lineErrors?.credit && <p className="mt-0.5 text-xs text-red-600">{lineErrors.credit.message}</p>}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text" placeholder="Optional"
                          {...register(`lineItems.${index}.narration`)}
                          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          disabled={fields.length <= 2}
                          className={cn(
                            'rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600',
                            fields.length <= 2 && 'cursor-not-allowed opacity-30 hover:bg-transparent hover:text-gray-400',
                          )}
                          title={fields.length <= 2 ? 'Minimum 2 line items required' : 'Remove row'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-medium">
                  <td className="px-3 py-2.5 text-sm text-gray-700" colSpan={2}>Totals</td>
                  <td className="px-3 py-2.5 text-right text-sm text-gray-900">{formatCurrency(totalDebit, voucher.currencyCode)}</td>
                  <td className="px-3 py-2.5 text-right text-sm text-gray-900">{formatCurrency(totalCredit, voucher.currencyCode)}</td>
                  <td className="px-3 py-2.5 text-sm" colSpan={2}>
                    {totalDebit === 0 && totalCredit === 0 ? (
                      <span className="text-gray-400">—</span>
                    ) : isBalanced ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Balanced</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        Diff: {formatCurrency(Math.abs(totalDebit - totalCredit), voucher.currencyCode)}
                      </span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Attachments Card */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Attachments</h2>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || attachments.length >= 10}
              className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {uploading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {uploadError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {uploadError}
            </div>
          )}

          {attachments.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {attachments.map((att) => {
                const Icon = getFileIcon(att.mimeType);
                return (
                  <li key={att.id} className="flex items-center gap-3 py-3">
                    <Icon className="h-5 w-5 shrink-0 text-gray-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{att.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(att.fileSize)} &middot; {new Date(att.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewAttachment(att)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Preview attachment"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAttachment(att.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete attachment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-8 text-center">
              <Paperclip className="mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">No attachments yet</p>
              <p className="mt-1 text-xs text-gray-400">Upload images, PDFs, or documents</p>
            </div>
          )}

          <p className="mt-3 text-xs text-gray-400">
            {attachments.length}/10 files &middot; Max 10 MB each &middot; Images, PDF, Office docs, CSV, TXT
          </p>
        </div>

        <AttachmentPreviewModal
          attachment={previewAttachment}
          voucherId={voucher.id}
          onClose={() => setPreviewAttachment(null)}
        />

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Page Component ---

export default function VoucherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const userRole = useAuthStore((s) => s.user?.role || '');
  const tenant = useAuthStore((s) => s.tenant);

  const [voucher, setVoucher] = useState<VoucherDetail | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadVoucher();
    loadAccounts();
  }, [id]);

  const loadVoucher = async () => {
    setLoading(true);
    try {
      const data = await api.get<VoucherDetail>(`/vouchers/${id}`);
      setVoucher(data);
    } catch (err) {
      console.error('Failed to load voucher:', err);
      router.push('/dashboard/vouchers');
    }
    setLoading(false);
  };

  const loadAccounts = async () => {
    try {
      const data = await api.get<Account[] | { data: Account[] }>('/accounts', { isActive: true });
      const list = Array.isArray(data) ? data : data.data || [];
      setAccounts(list.filter((a) => a.isActive));
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!voucher) return null;

  if (editing) {
    return (
      <VoucherEditForm
        voucher={voucher}
        accounts={accounts}
        onCancel={() => setEditing(false)}
        onSaved={() => { setEditing(false); loadVoucher(); }}
      />
    );
  }

  return (
    <VoucherView
      voucher={voucher}
      userRole={userRole}
      companyName={tenant?.name || 'Company'}
      onEdit={() => setEditing(true)}
      onRefresh={loadVoucher}
    />
  );
}
