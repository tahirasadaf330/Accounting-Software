'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { cn } from '@/lib/cn';
import { api, ApiError } from '@/lib/api';
import ContactSelector from '../invoice/ContactSelector';
import InvoiceLineItems, { InvoiceLine } from '../invoice/InvoiceLineItems';
import FileDropzone, { PendingFile } from '../invoice/FileDropzone';

interface Account {
  id: string;
  code: string;
  name: string;
  accountType: string;
  isActive: boolean;
}

interface Contact {
  id: string;
  name: string;
  type: string;
  accountId: string | null;
  accountCode: string | null;
  accountName: string | null;
  isActive: boolean;
}

const invoiceSchema = z.object({
  contactId: z.string().min(1, 'Contact is required'),
  date: z.string().min(1, 'Date is required'),
  reference: z.string().max(255).optional(),
  narration: z.string().min(1, 'Narration is required').max(1000),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
  lines: z
    .array(
      z.object({
        id: z.string(),
        description: z.string().max(500).optional(),
        accountId: z.string().min(1, 'Account is required'),
        amount: z.string().refine((v) => parseFloat(v) > 0, 'Amount must be positive'),
      }),
    )
    .min(1, 'At least one line required'),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function SalesInvoicePage() {
  const router = useRouter();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [contactId, setContactId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [narration, setNarration] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [lines, setLines] = useState<InvoiceLine[]>([
    { id: crypto.randomUUID(), description: '', accountId: '', amount: '' },
  ]);
  const [files, setFiles] = useState<PendingFile[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [contactsRes, accountsRes] = await Promise.all([
          api.get<Contact[]>('/contacts', { isActive: true }),
          api.get<Account[]>('/accounts', { isActive: true }),
        ]);

        const contactList = Array.isArray(contactsRes) ? contactsRes : [];
        setContacts(contactList.filter((c) => c.type === 'CUSTOMER' || c.type === 'BOTH'));

        const accountList = Array.isArray(accountsRes) ? accountsRes : [];
        setAccounts(accountList.filter((a) => a.accountType === 'REVENUE' && a.isActive));
      } catch (err) {
        console.error('Failed to load data:', err);
      }
      setLoading(false);
    }

    loadData();
  }, []);

  const selectedContact = contacts.find((c) => c.id === contactId);

  useEffect(() => {
    if (selectedContact) {
      setNarration(`Sales Invoice to ${selectedContact.name}`);
    }
  }, [selectedContact]);

  const validate = (): boolean => {
    const formData: InvoiceFormData = {
      contactId,
      date,
      reference,
      narration,
      periodStart,
      periodEnd,
      lines,
    };

    const result = invoiceSchema.safeParse(formData);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path.join('.');
        newErrors[path] = err.message;
      });
      setErrors(newErrors);
      return false;
    }

    if (!selectedContact?.accountId) {
      setErrors({ contactId: 'Selected contact has no trade account linked' });
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);
    setApiError(null);

    try {
      const total = lines.reduce((sum, line) => sum + (parseFloat(line.amount) || 0), 0);

      const lineItems = [
        {
          accountId: selectedContact!.accountId,
          debit: total.toString(),
          credit: '0',
          narration: 'Trade Receivable',
        },
        ...lines.map((line) => ({
          accountId: line.accountId,
          debit: '0',
          credit: line.amount,
          narration: line.description || undefined,
        })),
      ];

      const body = {
        voucherType: 'SALES',
        date,
        narration,
        reference: reference || undefined,
        contactId,
        periodStart: periodStart || undefined,
        periodEnd: periodEnd || undefined,
        lineItems,
      };

      const result = await api.post<{ id: string }>('/vouchers', body);

      if (files.length > 0) {
        try {
          await api.uploadFiles(
            `/vouchers/${result.id}/attachments`,
            files.map((f) => f.file),
          );
        } catch (uploadErr) {
          console.error('Failed to upload attachments:', uploadErr);
        }
      }

      files.forEach((f) => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });

      router.push(`/dashboard/vouchers/${result.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError('An unexpected error occurred');
      }
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/dashboard/vouchers"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary-600" />
          <h1 className="text-xl font-semibold text-gray-900">Sales Invoice</h1>
        </div>
      </div>

      {apiError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase text-gray-500">Invoice Details</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2',
                  errors.date
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500/20',
                )}
              />
              {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Reference / Invoice #
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="INV-001"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Period Start <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Period End <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase text-gray-500">Customer</h2>

          <ContactSelector
            contacts={contacts}
            value={contactId}
            onChange={setContactId}
            filterTypes={['CUSTOMER', 'BOTH']}
            placeholder="Select a customer..."
            hasError={!!errors.contactId}
          />
          {errors.contactId && <p className="mt-1 text-xs text-red-600">{errors.contactId}</p>}

          {selectedContact && !selectedContact.accountId && (
            <p className="mt-2 text-sm text-amber-600">
              This contact has no trade account. Please link an account first.
            </p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase text-gray-500">Invoice Lines</h2>

          <InvoiceLineItems
            lines={lines}
            onChange={setLines}
            accounts={accounts}
            errors={errors}
          />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase text-gray-500">Attachments</h2>

          <FileDropzone files={files} onChange={setFiles} />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase text-gray-500">Narration</h2>

          <textarea
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            rows={2}
            placeholder="Description of this invoice..."
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2',
              errors.narration
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500/20',
            )}
          />
          {errors.narration && <p className="mt-1 text-xs text-red-600">{errors.narration}</p>}
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/dashboard/vouchers"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Invoice
          </button>
        </div>
      </form>
    </div>
  );
}
