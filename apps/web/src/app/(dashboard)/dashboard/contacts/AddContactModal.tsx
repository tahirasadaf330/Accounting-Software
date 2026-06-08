'use client';

import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import CurrencySelect from '@/components/CurrencySelect';

type PaymentMethod = 'WIRE' | 'ACH' | 'USDT';
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

interface Account {
  id: string;
  code: string;
  name: string;
  accountType: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddContactModal({ open, onClose, onSuccess }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  const [contactType, setContactType] = useState<'CUSTOMER' | 'VENDOR' | 'BOTH'>('CUSTOMER');
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
  const [amApprovalRequired, setAmApprovalRequired] = useState(false);
  const [partnerManagerIds, setPartnerManagerIds] = useState<string[]>([]);
  const [accountManagers, setAccountManagers] = useState<{ id: string; name: string; email: string; managerType: string }[]>([]);
  const [autoCreateAccount, setAutoCreateAccount] = useState(true);
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setContactType('CUSTOMER');
      setName('');
      setBusinessUnitId('');
      setEmail('');
      setPhone('');
      setAddress('');
      setCity('');
      setState('');
      setCountry('');
      setPostalCode('');
      setTaxId('');
      setCreditLimit('');
      setMinThreshold('');
      setPaymentTermDays('');
      setBillingStartDate('');
      setCurrencyCode('USD');
      setBankName('');
      setBankAccountNumber('');
      setBankIban('');
      setBankSwiftCode('');
      setBankRoutingNumber('');
      setBankAddress('');
      setPaymentMethod('');
      setAccountClassification('');
      setInHouseManagerIds([]);
      setAmApprovalRequired(false);
      setPartnerManagerIds([]);
      setAutoCreateAccount(true);
      setAccountId('');
      setError('');
      setFieldErrors({});
      setSubmitting(false);
      loadAccounts();
      loadAccountManagers();
      loadBusinessUnits();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const loadAccounts = async () => {
    try {
      const data = await api.get<any>('/accounts', { isActive: true });
      const list = Array.isArray(data) ? data : data.data || [];
      setAccounts(list.filter((a: Account) => a.accountType === 'ASSET'));
    } catch {
      setAccounts([]);
    }
  };

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

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Contact name is required';
    if (!businessUnitId) errors.businessUnitId = 'Business unit is required';
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Invalid email format';
    }
    if (!autoCreateAccount && !accountId) {
      errors.accountId = 'Please select an account or enable auto-create';
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
    setError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const body: any = {
        name: name.trim(),
        type: contactType,
        businessUnitId,
        amApprovalRequired,
        autoCreateAccount,
      };
      if (email.trim()) body.email = email.trim();
      if (phone.trim()) body.phone = phone.trim();
      if (address.trim()) body.address = address.trim();
      if (city.trim()) body.city = city.trim();
      if (state.trim()) body.state = state.trim();
      if (country.trim()) body.country = country.trim();
      if (postalCode.trim()) body.postalCode = postalCode.trim();
      if (taxId.trim()) body.taxId = taxId.trim();
      if (creditLimit.trim()) body.creditLimit = Number(creditLimit);
      if (minThreshold.trim()) body.minThreshold = Number(minThreshold);
      if (paymentTermDays.trim()) body.paymentTermDays = parseInt(paymentTermDays, 10);
      if (!autoCreateAccount && accountId) body.accountId = accountId;
      if (currencyCode) body.currencyCode = currencyCode;
      if (bankBeneficiaryName.trim()) body.bankBeneficiaryName = bankBeneficiaryName.trim();
      if (bankName.trim()) body.bankName = bankName.trim();
      if (bankAccountNumber.trim()) body.bankAccountNumber = bankAccountNumber.trim();
      if (bankIban.trim()) body.bankIban = bankIban.trim();
      if (bankSwiftCode.trim()) body.bankSwiftCode = bankSwiftCode.trim();
      if (bankRoutingNumber.trim()) body.bankRoutingNumber = bankRoutingNumber.trim();
      if (bankAddress.trim()) body.bankAddress = bankAddress.trim();
      if (paymentMethod) body.paymentMethod = paymentMethod;
      if (accountClassification) body.accountClassification = accountClassification;
      if (billingStartDate) body.billingStartDate = billingStartDate;
      if (inHouseManagerIds.length > 0) body.inHouseManagerIds = inHouseManagerIds;
      if (partnerManagerIds.length > 0) body.partnerManagerIds = partnerManagerIds;

      await api.post('/contacts', body);
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
          setError(err.message || 'Failed to create contact');
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/30 transition-opacity" onClick={onClose} />

      <div
        ref={panelRef}
        className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-xl animate-slide-in-right"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Add Contact</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

              {/* Contact Type */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Contact Type</label>
                <div className="flex items-center gap-4">
                  {(['CUSTOMER', 'VENDOR', 'BOTH'] as const).map((t) => (
                    <label key={t} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="radio"
                        name="contactType"
                        checked={contactType === t}
                        onChange={() => setContactType(t)}
                        className="text-primary-600"
                      />
                      {t === 'BOTH' ? 'Both' : t.charAt(0) + t.slice(1).toLowerCase()}
                    </label>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                  Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: '' })); }}
                  placeholder="e.g. Acme Corp"
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                    fieldErrors.name ? 'border-red-300' : 'border-gray-300',
                  )}
                />
                {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
              </div>

              {/* Business Unit */}
              <div>
                <label htmlFor="businessUnitId" className="mb-1 block text-sm font-medium text-gray-700">
                  Business Unit <span className="text-red-500">*</span>
                </label>
                <select
                  id="businessUnitId"
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
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: '' })); }}
                  placeholder="contact@example.com"
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                    fieldErrors.email ? 'border-red-300' : 'border-gray-300',
                  )}
                />
                {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="off"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1-555-0100"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              {/* Address fields */}
              <div>
                <label htmlFor="address" className="mb-1 block text-sm font-medium text-gray-700">Address</label>
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="city" className="mb-1 block text-sm font-medium text-gray-700">City</label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
                <div>
                  <label htmlFor="state" className="mb-1 block text-sm font-medium text-gray-700">State</label>
                  <input
                    id="state"
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="country" className="mb-1 block text-sm font-medium text-gray-700">Country</label>
                  <input
                    id="country"
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
                <div>
                  <label htmlFor="postalCode" className="mb-1 block text-sm font-medium text-gray-700">Postal Code</label>
                  <input
                    id="postalCode"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>

              {/* Tax ID */}
              <div>
                <label htmlFor="taxId" className="mb-1 block text-sm font-medium text-gray-700">Tax ID</label>
                <input
                  id="taxId"
                  type="text"
                  autoComplete="off"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="e.g. EIN-123456789"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              {/* Credit Limit & Payment Terms */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="creditLimit" className="mb-1 block text-sm font-medium text-gray-700">Credit Limit</label>
                  <input
                    id="creditLimit"
                    type="number"
                    inputMode="decimal"
                    autoComplete="off"
                    value={creditLimit}
                    onChange={(e) => { setCreditLimit(e.target.value); setFieldErrors((p) => ({ ...p, creditLimit: '' })); }}
                    placeholder="e.g. 50000"
                    min="0"
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                      fieldErrors.creditLimit ? 'border-red-300' : 'border-gray-300',
                    )}
                  />
                  {fieldErrors.creditLimit && <p className="mt-1 text-xs text-red-600">{fieldErrors.creditLimit}</p>}
                </div>
                <div>
                  <label htmlFor="paymentTermDays" className="mb-1 block text-sm font-medium text-gray-700">Payment Terms (days)</label>
                  <input
                    id="paymentTermDays"
                    type="number"
                    inputMode="numeric"
                    autoComplete="off"
                    value={paymentTermDays}
                    onChange={(e) => { setPaymentTermDays(e.target.value); setFieldErrors((p) => ({ ...p, paymentTermDays: '' })); }}
                    placeholder="e.g. 30"
                    min="1"
                    max="365"
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
                <label htmlFor="minThreshold" className="mb-1 block text-sm font-medium text-gray-700">
                  Min Threshold
                </label>
                <input
                  id="minThreshold"
                  type="number"
                  inputMode="decimal"
                  autoComplete="off"
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
                <label htmlFor="currencyCode" className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
                <CurrencySelect id="currencyCode" value={currencyCode} onChange={setCurrencyCode} />
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
                        name="accountClassification"
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
                  {(['WIRE', 'ACH', 'USDT'] as const).map((m) => (
                    <label key={m} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
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
                  <label htmlFor="bankBeneficiaryName" className="mb-1 block text-xs font-medium text-gray-600">Beneficiary Name</label>
                  <input
                    id="bankBeneficiaryName"
                    type="text"
                    value={bankBeneficiaryName}
                    onChange={(e) => setBankBeneficiaryName(e.target.value)}
                    placeholder="Account holder name"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                <div>
                  <label htmlFor="bankName" className="mb-1 block text-xs font-medium text-gray-600">Bank Name</label>
                  <input
                    id="bankName"
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. Chase Bank"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="bankAccountNumber" className="mb-1 block text-xs font-medium text-gray-600">Account Number</label>
                    <input
                      id="bankAccountNumber"
                      type="text"
                      autoComplete="off"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="bankIban" className="mb-1 block text-xs font-medium text-gray-600">IBAN</label>
                    <input
                      id="bankIban"
                      type="text"
                      autoComplete="off"
                      value={bankIban}
                      onChange={(e) => setBankIban(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="bankSwiftCode" className="mb-1 block text-xs font-medium text-gray-600">Swift / Sort Code</label>
                    <input
                      id="bankSwiftCode"
                      type="text"
                      autoComplete="off"
                      value={bankSwiftCode}
                      onChange={(e) => setBankSwiftCode(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="bankRoutingNumber" className="mb-1 block text-xs font-medium text-gray-600">Routing Number</label>
                    <input
                      id="bankRoutingNumber"
                      type="text"
                      autoComplete="off"
                      value={bankRoutingNumber}
                      onChange={(e) => setBankRoutingNumber(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="bankAddress" className="mb-1 block text-xs font-medium text-gray-600">Bank Address</label>
                  <input
                    id="bankAddress"
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

              {/* Account Link */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="mb-3 text-sm font-medium text-gray-700">Trade Account</p>
                <div className="flex items-center gap-3 mb-3">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="radio"
                      name="accountMode"
                      checked={autoCreateAccount}
                      onChange={() => { setAutoCreateAccount(true); setAccountId(''); setFieldErrors((p) => ({ ...p, accountId: '' })); }}
                      className="text-primary-600"
                    />
                    Auto-create account
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input
                      type="radio"
                      name="accountMode"
                      checked={!autoCreateAccount}
                      onChange={() => setAutoCreateAccount(false)}
                      className="text-primary-600"
                    />
                    Select existing account
                  </label>
                </div>
                {autoCreateAccount ? (
                  <p className="text-xs text-gray-500">
                    A new trade account will be automatically created under Accounts Receivable (1200 range).
                  </p>
                ) : (
                  <div>
                    <select
                      value={accountId}
                      onChange={(e) => { setAccountId(e.target.value); setFieldErrors((p) => ({ ...p, accountId: '' })); }}
                      className={cn(
                        'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                        fieldErrors.accountId ? 'border-red-300' : 'border-gray-300',
                      )}
                    >
                      <option value="">Select an account</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} – {a.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.accountId && <p className="mt-1 text-xs text-red-600">{fieldErrors.accountId}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
