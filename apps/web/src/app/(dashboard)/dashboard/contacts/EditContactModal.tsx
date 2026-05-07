'use client';

import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import CurrencySelect from '@/components/CurrencySelect';

type PaymentMethod = 'WIRE' | 'ACH';
type AccountClassification = 'PREPAYMENT' | 'POSTPAYMENT';

function MultiSelectDropdown({
  label,
  options,
  selectedIds,
  onChange,
}: {
  label: string;
  options: { id: string; name: string; email: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedNames = options
    .filter((o) => selectedIds.includes(o.id))
    .map((o) => o.name);

  return (
    <div ref={ref} className="relative">
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 px-3 py-2 text-left text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
      >
        {selectedNames.length > 0 ? (
          <span className="truncate text-gray-900">{selectedNames.join(', ')}</span>
        ) : (
          <span className="text-gray-400">Select {label.toLowerCase()}</span>
        )}
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {options.length === 0 ? (
            <div className="p-3 text-center text-sm text-gray-500">No managers available</div>
          ) : (
            options.map((am) => (
              <label
                key={am.id}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(am.id)}
                  onChange={(e) => {
                    if (e.target.checked) onChange([...selectedIds, am.id]);
                    else onChange(selectedIds.filter((id) => id !== am.id));
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600"
                />
                <span className="font-medium">{am.name}</span>
                <span className="text-gray-400">—</span>
                <span className="truncate text-gray-500">{am.email}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

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
  bankBeneficiaryName: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankIban: string | null;
  bankSwiftCode: string | null;
  bankRoutingNumber: string | null;
  bankAddress: string | null;
  paymentMethod: PaymentMethod | null;
  accountClassification: AccountClassification | null;
  isActive: boolean;
  amApprovalRequired: boolean;
  accountId: string | null;
  accountCode: string | null;
  accountName: string | null;
  businessUnitId: string | null;
  businessUnitName: string | null;
  inHouseManagers: { id: string; name: string; email: string }[];
  partnerManagers: { id: string; name: string; email: string }[];
}

const typeBadgeColors: Record<string, string> = {
  CUSTOMER: 'bg-blue-100 text-blue-700',
  VENDOR: 'bg-orange-100 text-orange-700',
  BOTH: 'bg-purple-100 text-purple-700',
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contact: Contact | null;
}

export default function EditContactModal({ open, onClose, onSuccess, contact }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState('');
  const [businessUnitId, setBusinessUnitId] = useState('');
  const [businessUnits, setBusinessUnits] = useState<{ id: string; name: string }[]>([]);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [taxId, setTaxId] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [minThreshold, setMinThreshold] = useState('');
  const [paymentTermDays, setPaymentTermDays] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [amApprovalRequired, setAmApprovalRequired] = useState(false);
  const [billingStartDate, setBillingStartDate] = useState('');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [bankBeneficiaryName, setBankBeneficiaryName] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIban, setBankIban] = useState('');
  const [bankSwiftCode, setBankSwiftCode] = useState('');
  const [bankRoutingNumber, setBankRoutingNumber] = useState('');
  const [bankAddress, setBankAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [accountClassification, setAccountClassification] = useState<AccountClassification | ''>('');
  const [inHouseManagerIds, setInHouseManagerIds] = useState<string[]>([]);
  const [partnerManagerIds, setPartnerManagerIds] = useState<string[]>([]);
  const [accountManagers, setAccountManagers] = useState<{ id: string; name: string; email: string; managerType: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadAccountManagers = async () => {
    try {
      const data = await api.get<any[]>('/account-managers', { isActive: true });
      setAccountManagers(data);
    } catch {
      setAccountManagers([]);
    }
  };

  const loadBusinessUnits = async () => {
    try {
      const data = await api.get<any[]>('/business-units', { isActive: true });
      setBusinessUnits(data);
    } catch {
      setBusinessUnits([]);
    }
  };

  useEffect(() => {
    if (open && contact) {
      setName(contact.name);
      setBusinessUnitId(contact.businessUnitId || '');
      setEmail(contact.email || '');
      setPhone(contact.phone || '');
      setAddress(contact.address || '');
      setCity(contact.city || '');
      setState(contact.state || '');
      setCountry(contact.country || '');
      setPostalCode(contact.postalCode || '');
      setTaxId(contact.taxId || '');
      setCreditLimit(contact.creditLimit || '');
      setMinThreshold(contact.minThreshold || '');
      setPaymentTermDays(contact.paymentTermDays?.toString() || '');
      setIsActive(contact.isActive);
      setAmApprovalRequired(contact.amApprovalRequired ?? false);
      setBillingStartDate((contact as any).billingStartDate || '');
      setCurrencyCode(contact.currencyCode || 'USD');
      setBankBeneficiaryName(contact.bankBeneficiaryName || '');
      setBankName(contact.bankName || '');
      setBankAccountNumber(contact.bankAccountNumber || '');
      setBankIban(contact.bankIban || '');
      setBankSwiftCode(contact.bankSwiftCode || '');
      setBankRoutingNumber(contact.bankRoutingNumber || '');
      setBankAddress(contact.bankAddress || '');
      setPaymentMethod((contact.paymentMethod as PaymentMethod | null) || '');
      setAccountClassification((contact.accountClassification as AccountClassification | null) || '');
      setInHouseManagerIds((contact.inHouseManagers || []).map((am: any) => am.id));
      setPartnerManagerIds((contact.partnerManagers || []).map((am: any) => am.id));
      setError('');
      setFieldErrors({});
      setSubmitting(false);
      loadAccountManagers();
      loadBusinessUnits();
    }
  }, [open, contact]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Contact name is required';
    if (!businessUnitId) errors.businessUnitId = 'Business unit is required';
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Invalid email format';
    }
    if (creditLimit.trim() && (isNaN(Number(creditLimit)) || Number(creditLimit) < 0)) {
      errors.creditLimit = 'Credit limit must be a non-negative number';
    }
    if (minThreshold.trim()) {
      const t = Number(minThreshold);
      if (isNaN(t) || t < 0) {
        errors.minThreshold = 'Threshold must be a non-negative number';
      }
    }
    if (paymentTermDays.trim()) {
      const days = parseInt(paymentTermDays, 10);
      if (isNaN(days) || days < 1 || days > 365) {
        errors.paymentTermDays = 'Payment terms must be between 1 and 365 days';
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact) return;
    setError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const body: any = {
        name: name.trim(),
        businessUnitId,
        amApprovalRequired,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        country: country.trim() || null,
        postalCode: postalCode.trim() || null,
        taxId: taxId.trim() || null,
        isActive,
        billingStartDate: billingStartDate || null,
        currencyCode: currencyCode || 'USD',
        bankBeneficiaryName: bankBeneficiaryName.trim() || null,
        bankName: bankName.trim() || null,
        bankAccountNumber: bankAccountNumber.trim() || null,
        bankIban: bankIban.trim() || null,
        bankSwiftCode: bankSwiftCode.trim() || null,
        bankRoutingNumber: bankRoutingNumber.trim() || null,
        bankAddress: bankAddress.trim() || null,
        paymentMethod: paymentMethod || null,
        accountClassification: accountClassification || null,
        inHouseManagerIds,
        partnerManagerIds,
      };
      if (creditLimit.trim()) body.creditLimit = Number(creditLimit);
      if (minThreshold.trim()) body.minThreshold = Number(minThreshold);
      if (paymentTermDays.trim()) body.paymentTermDays = parseInt(paymentTermDays, 10);

      await api.patch(`/contacts/${contact.id}`, body);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors) {
          const mapped: Record<string, string> = {};
          for (const [field, messages] of Object.entries(err.errors)) {
            mapped[field] = Array.isArray(messages) ? messages[0] : String(messages);
          }
          setFieldErrors((prev) => ({ ...prev, ...mapped }));
        } else {
          setError(err.message || 'Failed to update contact');
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !contact) return null;

  const typeLabel = contact.type === 'BOTH' ? 'Customer & Vendor' : contact.type.charAt(0) + contact.type.slice(1).toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/30 transition-opacity" onClick={onClose} />

      <div
        ref={panelRef}
        className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-xl animate-slide-in-right"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Edit Contact</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

              {/* Contact Type (read-only) */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Contact Type</p>
                <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', typeBadgeColors[contact.type] || 'bg-gray-100 text-gray-600')}>
                  {typeLabel}
                </span>
              </div>

              {/* Linked Account (read-only) */}
              {contact.accountCode && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Linked Account</p>
                  <p className="text-sm text-gray-900">{contact.accountCode} – {contact.accountName}</p>
                </div>
              )}

              {/* Name */}
              <div>
                <label htmlFor="edit-name" className="mb-1 block text-sm font-medium text-gray-700">
                  Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: '' })); }}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                    fieldErrors.name ? 'border-red-300' : 'border-gray-300',
                  )}
                />
                {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
              </div>

              {/* Business Unit */}
              <div>
                <label htmlFor="edit-businessUnitId" className="mb-1 block text-sm font-medium text-gray-700">
                  Business Unit <span className="text-red-500">*</span>
                </label>
                <select
                  id="edit-businessUnitId"
                  value={businessUnitId}
                  onChange={(e) => { setBusinessUnitId(e.target.value); setFieldErrors((p) => ({ ...p, businessUnitId: '' })); }}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                    fieldErrors.businessUnitId ? 'border-red-300' : 'border-gray-300',
                  )}
                >
                  <option value="">Select a business unit</option>
                  {businessUnits.map((bu) => (
                    <option key={bu.id} value={bu.id}>{bu.name}</option>
                  ))}
                </select>
                {fieldErrors.businessUnitId && <p className="mt-1 text-xs text-red-600">{fieldErrors.businessUnitId}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="edit-email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="edit-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: '' })); }}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                    fieldErrors.email ? 'border-red-300' : 'border-gray-300',
                  )}
                />
                {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="edit-phone" className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                <input
                  id="edit-phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              {/* Address */}
              <div>
                <label htmlFor="edit-address" className="mb-1 block text-sm font-medium text-gray-700">Address</label>
                <input
                  id="edit-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-city" className="mb-1 block text-sm font-medium text-gray-700">City</label>
                  <input id="edit-city" type="text" value={city} onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
                </div>
                <div>
                  <label htmlFor="edit-state" className="mb-1 block text-sm font-medium text-gray-700">State</label>
                  <input id="edit-state" type="text" value={state} onChange={(e) => setState(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-country" className="mb-1 block text-sm font-medium text-gray-700">Country</label>
                  <input id="edit-country" type="text" value={country} onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
                </div>
                <div>
                  <label htmlFor="edit-postalCode" className="mb-1 block text-sm font-medium text-gray-700">Postal Code</label>
                  <input id="edit-postalCode" type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
                </div>
              </div>

              {/* Tax ID */}
              <div>
                <label htmlFor="edit-taxId" className="mb-1 block text-sm font-medium text-gray-700">Tax ID</label>
                <input id="edit-taxId" type="text" value={taxId} onChange={(e) => setTaxId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
              </div>

              {/* Credit Limit & Payment Terms */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-creditLimit" className="mb-1 block text-sm font-medium text-gray-700">Credit Limit</label>
                  <input id="edit-creditLimit" type="text" value={creditLimit}
                    onChange={(e) => { setCreditLimit(e.target.value); setFieldErrors((p) => ({ ...p, creditLimit: '' })); }}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                      fieldErrors.creditLimit ? 'border-red-300' : 'border-gray-300',
                    )}
                  />
                  {fieldErrors.creditLimit && <p className="mt-1 text-xs text-red-600">{fieldErrors.creditLimit}</p>}
                </div>
                <div>
                  <label htmlFor="edit-paymentTermDays" className="mb-1 block text-sm font-medium text-gray-700">Payment Terms (days)</label>
                  <input id="edit-paymentTermDays" type="text" value={paymentTermDays}
                    onChange={(e) => { setPaymentTermDays(e.target.value); setFieldErrors((p) => ({ ...p, paymentTermDays: '' })); }}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                      fieldErrors.paymentTermDays ? 'border-red-300' : 'border-gray-300',
                    )}
                  />
                  {fieldErrors.paymentTermDays && <p className="mt-1 text-xs text-red-600">{fieldErrors.paymentTermDays}</p>}
                </div>
              </div>

              {/* Min Threshold */}
              <div>
                <label htmlFor="edit-minThreshold" className="mb-1 block text-sm font-medium text-gray-700">
                  Min Threshold
                </label>
                <input
                  id="edit-minThreshold"
                  type="number"
                  inputMode="decimal"
                  value={minThreshold}
                  onChange={(e) => { setMinThreshold(e.target.value); setFieldErrors((p) => ({ ...p, minThreshold: '' })); }}
                  placeholder="e.g. 1000"
                  min="0"
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                    fieldErrors.minThreshold ? 'border-red-300' : 'border-gray-300',
                  )}
                />
                {fieldErrors.minThreshold ? (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.minThreshold}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    Vouchers, receipts, and payments below this amount will be blocked.
                  </p>
                )}
              </div>

              {/* Billing Start Date */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Billing Start Date</label>
                <input
                  type="date"
                  value={billingStartDate}
                  onChange={(e) => setBillingStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              {/* Currency */}
              <div>
                <label htmlFor="edit-currencyCode" className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
                <CurrencySelect id="edit-currencyCode" value={currencyCode} onChange={setCurrencyCode} />
              </div>

              {/* Account Type (prepayment / post payment) */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Account Type</label>
                <div className="flex items-center gap-4">
                  {([
                    { value: 'PREPAYMENT', label: 'Prepayment' },
                    { value: 'POSTPAYMENT', label: 'Post Payment' },
                  ] as const).map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="radio"
                        name="edit-accountClassification"
                        checked={accountClassification === opt.value}
                        onChange={() => setAccountClassification(opt.value)}
                        className="text-primary-600"
                      />
                      {opt.label}
                    </label>
                  ))}
                  {accountClassification && (
                    <button
                      type="button"
                      onClick={() => setAccountClassification('')}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Method of Payment */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Method of Payment</label>
                <div className="flex items-center gap-4">
                  {(['WIRE', 'ACH'] as const).map((m) => (
                    <label key={m} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="radio"
                        name="edit-paymentMethod"
                        checked={paymentMethod === m}
                        onChange={() => setPaymentMethod(m)}
                        className="text-primary-600"
                      />
                      {m}
                    </label>
                  ))}
                  {paymentMethod && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('')}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Bank Details */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">Bank Details</p>

                <div>
                  <label htmlFor="edit-bankBeneficiaryName" className="mb-1 block text-xs font-medium text-gray-600">Beneficiary Name</label>
                  <input
                    id="edit-bankBeneficiaryName"
                    type="text"
                    value={bankBeneficiaryName}
                    onChange={(e) => setBankBeneficiaryName(e.target.value)}
                    placeholder="Account holder name"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                <div>
                  <label htmlFor="edit-bankName" className="mb-1 block text-xs font-medium text-gray-600">Bank Name</label>
                  <input
                    id="edit-bankName"
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="edit-bankAccountNumber" className="mb-1 block text-xs font-medium text-gray-600">Account Number</label>
                    <input
                      id="edit-bankAccountNumber"
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-bankIban" className="mb-1 block text-xs font-medium text-gray-600">IBAN</label>
                    <input
                      id="edit-bankIban"
                      type="text"
                      value={bankIban}
                      onChange={(e) => setBankIban(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="edit-bankSwiftCode" className="mb-1 block text-xs font-medium text-gray-600">Swift / Sort Code</label>
                    <input
                      id="edit-bankSwiftCode"
                      type="text"
                      value={bankSwiftCode}
                      onChange={(e) => setBankSwiftCode(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-bankRoutingNumber" className="mb-1 block text-xs font-medium text-gray-600">Routing Number</label>
                    <input
                      id="edit-bankRoutingNumber"
                      type="text"
                      value={bankRoutingNumber}
                      onChange={(e) => setBankRoutingNumber(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="edit-bankAddress" className="mb-1 block text-xs font-medium text-gray-600">Bank Address</label>
                  <input
                    id="edit-bankAddress"
                    type="text"
                    value={bankAddress}
                    onChange={(e) => setBankAddress(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>

              <MultiSelectDropdown
                label="In-House Manager(s)"
                options={accountManagers.filter((am) => am.managerType === 'IN_HOUSE')}
                selectedIds={inHouseManagerIds}
                onChange={setInHouseManagerIds}
              />

              {/* AM Approval Required */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={amApprovalRequired}
                    onChange={(e) => setAmApprovalRequired(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600"
                  />
                  <span>
                    <span className="block font-medium text-gray-700">AM Approval Required</span>
                    <span className="block text-xs text-gray-500">
                      When enabled, transactions for this contact will require Account Manager approval.
                    </span>
                  </span>
                </label>
              </div>

              <MultiSelectDropdown
                label="Partner Manager(s)"
                options={accountManagers.filter((am) => am.managerType === 'PARTNER')}
                selectedIds={partnerManagerIds}
                onChange={setPartnerManagerIds}
              />

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-primary-600"
                  />
                  Active
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
