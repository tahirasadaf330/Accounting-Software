'use client';

import { useEffect, useState } from 'react';
import { X, ExternalLink, Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';

interface ContactDetail {
  id: string;
  name: string;
  type: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  taxId: string | null;
  currencyCode: string;
  paymentTermDays: number | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankIban: string | null;
  bankSwiftCode: string | null;
  bankRoutingNumber: string | null;
  bankAddress: string | null;
  paymentMethod: 'WIRE' | 'ACH' | null;
  accountClassification: 'PREPAYMENT' | 'POSTPAYMENT' | null;
  accountCode: string | null;
  accountName: string | null;
  businessUnitName: string | null;
}

interface Props {
  open: boolean;
  contactId: string | null;
  onClose: () => void;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-gray-500">{label}</p>
      <p className="mt-0.5 break-words text-sm text-gray-900">{value || <span className="text-gray-400">—</span>}</p>
    </div>
  );
}

export default function ContactQuickViewModal({ open, contactId, onClose }: Props) {
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !contactId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setContact(null);
    (async () => {
      try {
        const data = await api.get<ContactDetail>(`/contacts/${contactId}`);
        if (!cancelled) setContact(data);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load contact');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, contactId]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 flex max-h-[85vh] w-full max-w-xl flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            {contact ? contact.name : 'Contact'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 text-sm">
          {loading && (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          {contact && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Type" value={contact.type === 'BOTH' ? 'Customer & Vendor' : contact.type} />
                <Field label="Business Unit" value={contact.businessUnitName} />
                <Field label="Email" value={contact.email} />
                <Field label="Phone" value={contact.phone} />
                <Field label="Currency" value={contact.currencyCode} />
                <Field label="Payment Terms" value={contact.paymentTermDays != null ? `${contact.paymentTermDays} days` : null} />
                <Field
                  label="Account Type"
                  value={
                    contact.accountClassification === 'PREPAYMENT'
                      ? 'Prepayment'
                      : contact.accountClassification === 'POSTPAYMENT'
                      ? 'Post Payment'
                      : null
                  }
                />
                <Field label="Method of Payment" value={contact.paymentMethod} />
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-gray-600">Address</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Address" value={contact.address} />
                  <Field label="City" value={contact.city} />
                  <Field label="State" value={contact.state} />
                  <Field label="Country" value={contact.country} />
                  <Field label="Postal Code" value={contact.postalCode} />
                  <Field label="Tax ID" value={contact.taxId} />
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-gray-600">Bank Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Bank Name" value={contact.bankName} />
                  <Field label="Account Number" value={contact.bankAccountNumber} />
                  <Field label="IBAN" value={contact.bankIban} />
                  <Field label="Swift / Sort Code" value={contact.bankSwiftCode} />
                  <Field label="Routing Number" value={contact.bankRoutingNumber} />
                  <Field label="Bank Address" value={contact.bankAddress} />
                </div>
              </div>

              {contact.accountCode && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-gray-600">Linked Trade Account</p>
                  <p className="text-sm text-gray-900">
                    <span className="font-mono">{contact.accountCode}</span> – {contact.accountName}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-6 py-3">
          {contact && (
            <a
              href={`/dashboard/contacts/${contact.id}/statement`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              <ExternalLink className="h-4 w-4" />
              View Statement
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
