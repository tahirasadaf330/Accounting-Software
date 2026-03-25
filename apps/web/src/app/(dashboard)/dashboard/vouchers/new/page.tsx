'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/formatCurrency';
import { useAuthStore } from '@/stores/auth.store';
import { ArrowLeft, ChevronDown, Plus, Trash2 } from 'lucide-react';

// --- Types ---

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

// --- Zod Schema ---

const lineItemSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  debit: z.string(),
  credit: z.string(),
  narration: z.string().max(500).optional(),
});

const voucherSchema = z
  .object({
    voucherType: z.enum(
      ['PAYMENT', 'RECEIPT', 'JOURNAL', 'CONTRA', 'SALES', 'PURCHASE', 'CREDIT_NOTE', 'DEBIT_NOTE'],
      { required_error: 'Voucher type is required' },
    ),
    date: z.string().min(1, 'Date is required'),
    narration: z.string().min(1, 'Narration is required').max(1000, 'Narration must be 1000 characters or less'),
    reference: z.string().max(255, 'Reference must be 255 characters or less').optional(),
    lineItems: z.array(lineItemSchema).min(2, 'At least 2 line items are required'),
  })
  .superRefine((data, ctx) => {
    let totalDebit = 0;
    let totalCredit = 0;

    data.lineItems.forEach((item, index) => {
      const debit = parseFloat(item.debit) || 0;
      const credit = parseFloat(item.credit) || 0;

      if (debit < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Debit cannot be negative',
          path: ['lineItems', index, 'debit'],
        });
      }
      if (credit < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Credit cannot be negative',
          path: ['lineItems', index, 'credit'],
        });
      }
      if (debit > 0 && credit > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'A line cannot have both debit and credit',
          path: ['lineItems', index, 'debit'],
        });
      }
      if (debit === 0 && credit === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a debit or credit amount',
          path: ['lineItems', index, 'debit'],
        });
      }

      totalDebit += debit;
      totalCredit += credit;
    });

    if (totalDebit === 0 && totalCredit === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Totals cannot both be zero',
        path: ['lineItems'],
      });
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

const voucherTypes = [
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'RECEIPT', label: 'Receipt' },
  { value: 'JOURNAL', label: 'Journal' },
  { value: 'CONTRA', label: 'Contra' },
  { value: 'SALES', label: 'Sales' },
  { value: 'PURCHASE', label: 'Purchase' },
  { value: 'CREDIT_NOTE', label: 'Credit Note' },
  { value: 'DEBIT_NOTE', label: 'Debit Note' },
];

const defaultLineItem = { accountId: '', debit: '', credit: '', narration: '' };

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

  // Close on outside click
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
          onFocus={() => {
            setOpen(true);
            setSearch('');
          }}
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
                onMouseDown={() => {
                  onChange(a.id);
                  setSearch('');
                  setOpen(false);
                }}
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

// --- Component ---

export default function NewVoucherPage() {
  const router = useRouter();
  const baseCurrency = useAuthStore((s) => s.tenant?.baseCurrency ?? 'USD');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<VoucherFormData>({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      voucherType: undefined,
      date: new Date().toISOString().split('T')[0],
      narration: '',
      reference: '',
      lineItems: [{ ...defaultLineItem }, { ...defaultLineItem }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  });

  const watchedLineItems = useWatch({ control, name: 'lineItems' });
  const watchedVoucherType = useWatch({ control, name: 'voucherType' });

  const totalDebit = (watchedLineItems || []).reduce((sum, item) => sum + (parseFloat(item?.debit) || 0), 0);
  const totalCredit = (watchedLineItems || []).reduce((sum, item) => sum + (parseFloat(item?.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.0001 && (totalDebit > 0 || totalCredit > 0);

  useEffect(() => {
    loadAccounts();
    loadContacts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await api.get<Account[] | { data: Account[] }>('/accounts', { isActive: true });
      const list = Array.isArray(data) ? data : data.data || [];
      setAccounts(list.filter((a) => a.isActive));
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const loadContacts = async () => {
    try {
      const data = await api.get<Contact[]>('/contacts', { isActive: 'true' });
      setContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  };

  const handleContactChange = (contactId: string) => {
    setSelectedContactId(contactId);
    if (contactId) {
      const contact = contacts.find((c) => c.id === contactId);
      if (contact?.accountId) {
        // Auto-populate the first line item with the contact's trade account
        setValue('lineItems.0.accountId', contact.accountId, { shouldValidate: false });
      }
    }
  };

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
      const body: any = {
        voucherType: data.voucherType,
        date: data.date,
        narration: data.narration,
        reference: data.reference || undefined,
        lineItems: data.lineItems.map((item) => ({
          accountId: item.accountId,
          debit: item.debit || '0',
          credit: item.credit || '0',
          narration: item.narration || undefined,
        })),
      };
      if (selectedContactId) {
        body.contactId = selectedContactId;
      }
      const result = await api.post<{ id: string }>('/vouchers', body);
      router.push(`/dashboard/vouchers/${result.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message);
      } else {
        setApiError('An unexpected error occurred');
      }
    }
    setSubmitting(false);
  };

  // Find the top-level lineItems error from superRefine
  const lineItemsRootError =
    errors.lineItems?.message || errors.lineItems?.root?.message;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push('/dashboard/vouchers')}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Voucher</h1>
          <p className="mt-1 text-sm text-gray-600">Create a new financial transaction</p>
        </div>
      </div>

      {/* API Error Banner */}
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
            {/* Voucher Type */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Voucher Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register('voucherType')}
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                  errors.voucherType ? 'border-red-300' : 'border-gray-300',
                )}
              >
                <option value="">Select type...</option>
                {voucherTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {errors.voucherType && (
                <p className="mt-1 text-xs text-red-600">{errors.voucherType.message}</p>
              )}
            </div>

            {/* Date */}
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

            {/* Narration */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Narration <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('narration')}
                rows={2}
                placeholder="Description of the transaction"
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                  errors.narration ? 'border-red-300' : 'border-gray-300',
                )}
              />
              {errors.narration && (
                <p className="mt-1 text-xs text-red-600">{errors.narration.message}</p>
              )}
            </div>

            {/* Reference */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Reference</label>
              <input
                type="text"
                {...register('reference')}
                placeholder="Invoice number, cheque number, etc."
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                  errors.reference ? 'border-red-300' : 'border-gray-300',
                )}
              />
              {errors.reference && (
                <p className="mt-1 text-xs text-red-600">{errors.reference.message}</p>
              )}
            </div>

            {/* Contact selector */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Contact</label>
              <select
                value={selectedContactId}
                onChange={(e) => handleContactChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="">Select contact (optional)</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.accountCode ? ` (${c.accountCode})` : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Selecting a contact will auto-populate their trade account in line items
              </p>
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
                  <th className="min-w-[160px] px-3 py-2.5 text-left text-xs font-medium uppercase text-gray-500">
                    Narration
                  </th>
                  <th className="w-12 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fields.map((field, index) => {
                  const lineErrors = errors.lineItems?.[index];
                  return (
                    <tr key={field.id}>
                      <td className="px-3 py-2 text-sm text-gray-500">{index + 1}</td>
                      {/* Account */}
                      <td className="px-3 py-2">
                        <AccountCombobox
                          accounts={accounts}
                          value={watchedLineItems?.[index]?.accountId || ''}
                          onChange={(id) => setValue(`lineItems.${index}.accountId`, id, { shouldValidate: false })}
                          hasError={!!lineErrors?.accountId}
                        />
                        {lineErrors?.accountId && (
                          <p className="mt-0.5 text-xs text-red-600">{lineErrors.accountId.message}</p>
                        )}
                      </td>
                      {/* Debit */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...register(`lineItems.${index}.debit`)}
                          onChange={(e) => handleDebitChange(index, e.target.value)}
                          className={cn(
                            'w-full rounded-lg border px-2 py-1.5 text-right text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                            lineErrors?.debit ? 'border-red-300' : 'border-gray-300',
                          )}
                        />
                        {lineErrors?.debit && (
                          <p className="mt-0.5 text-xs text-red-600">{lineErrors.debit.message}</p>
                        )}
                      </td>
                      {/* Credit */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...register(`lineItems.${index}.credit`)}
                          onChange={(e) => handleCreditChange(index, e.target.value)}
                          className={cn(
                            'w-full rounded-lg border px-2 py-1.5 text-right text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                            lineErrors?.credit ? 'border-red-300' : 'border-gray-300',
                          )}
                        />
                        {lineErrors?.credit && (
                          <p className="mt-0.5 text-xs text-red-600">{lineErrors.credit.message}</p>
                        )}
                      </td>
                      {/* Line Narration */}
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          placeholder="Optional"
                          {...register(`lineItems.${index}.narration`)}
                          className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                        />
                      </td>
                      {/* Remove */}
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
              {/* Totals */}
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-medium">
                  <td className="px-3 py-2.5 text-sm text-gray-700" colSpan={2}>
                    Totals
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm text-gray-900">
                    {formatCurrency(totalDebit, baseCurrency)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm text-gray-900">
                    {formatCurrency(totalCredit, baseCurrency)}
                  </td>
                  <td className="px-3 py-2.5 text-sm" colSpan={2}>
                    {totalDebit === 0 && totalCredit === 0 ? (
                      <span className="text-gray-400">—</span>
                    ) : isBalanced ? (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Balanced
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        Diff: {formatCurrency(Math.abs(totalDebit - totalCredit), baseCurrency)}
                      </span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/vouchers')}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Save as Draft
          </button>
        </div>
      </form>
    </div>
  );
}
