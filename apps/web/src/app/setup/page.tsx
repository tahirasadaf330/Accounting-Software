'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
}

interface Template {
  id: string;
  industry: string;
  name: string;
  description: string | null;
}

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const STEP_LABELS = ['Company Profile', 'Currency & Fiscal', 'Business Type'];

export default function SetupPage() {
  const router = useRouter();
  const { tenant, isAuthenticated, _hasHydrated, setupTenant } = useAuthStore();

  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Company Profile
  const [profile, setProfile] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    taxId: '',
    registrationNumber: '',
  });

  // Step 2: Currency & Fiscal
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [fiscalYearStartMonth, setFiscalYearStartMonth] = useState(1);
  const [timezone, setTimezone] = useState('');
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  // Step 3: Business Type
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Pre-fill tenant name and detect browser timezone
  useEffect(() => {
    if (tenant?.name) {
      setProfile((prev) => ({ ...prev, name: tenant.name }));
    }
    try {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {
      setTimezone('UTC');
    }
  }, [tenant]);

  // Redirect guard
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) {
      router.replace('/login');
    } else if (tenant?.status !== 'PENDING_SETUP') {
      router.replace('/dashboard');
    }
  }, [_hasHydrated, isAuthenticated, tenant, router]);

  // Load currencies and templates
  useEffect(() => {
    if (!_hasHydrated || !isAuthenticated) return;

    api.get<Currency[]>('/currencies').then(setCurrencies).catch(() => {});
    api.get<Template[]>('/accounts/templates').then(setTemplates).catch(() => {});
  }, [_hasHydrated, isAuthenticated]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNext = () => {
    setError('');
    if (step === 0) {
      if (!profile.name.trim()) {
        setError('Company name is required');
        return;
      }
    }
    if (step === 1) {
      if (!baseCurrency) {
        setError('Please select a base currency');
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError('');
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setError('');
    if (!selectedTemplateId) {
      setError('Please select a business type');
      return;
    }

    setLoading(true);
    try {
      await setupTenant({
        ...profile,
        baseCurrency,
        fiscalYearStartMonth,
        timezone,
        coaTemplateId: selectedTemplateId,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Setup failed');
      setLoading(false);
    }
  };

  if (!_hasHydrated || !isAuthenticated || tenant?.status !== 'PENDING_SETUP') {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Set up your organization</h1>
        <p className="mt-2 text-sm text-gray-600">
          Complete these steps to get started with your accounting
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                    i < step
                      ? 'bg-primary-600 text-white'
                      : i === step
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-500',
                  )}
                >
                  {i < step ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={cn(
                    'mt-1.5 text-xs font-medium',
                    i <= step ? 'text-primary-600' : 'text-gray-400',
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-full -mt-4',
                    i < step ? 'bg-primary-600' : 'bg-gray-200',
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* Step 1: Company Profile */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
              Company name *
            </label>
            <input
              id="name"
              name="name"
              required
              value={profile.name}
              onChange={handleProfileChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div>
            <label htmlFor="address" className="mb-1 block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              id="address"
              name="address"
              value={profile.address}
              onChange={handleProfileChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className="mb-1 block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                id="city"
                name="city"
                value={profile.city}
                onChange={handleProfileChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label htmlFor="state" className="mb-1 block text-sm font-medium text-gray-700">
                State / Province
              </label>
              <input
                id="state"
                name="state"
                value={profile.state}
                onChange={handleProfileChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="postalCode" className="mb-1 block text-sm font-medium text-gray-700">
                Postal code
              </label>
              <input
                id="postalCode"
                name="postalCode"
                value={profile.postalCode}
                onChange={handleProfileChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label htmlFor="country" className="mb-1 block text-sm font-medium text-gray-700">
                Country
              </label>
              <input
                id="country"
                name="country"
                value={profile.country}
                onChange={handleProfileChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                value={profile.phone}
                onChange={handleProfileChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={profile.email}
                onChange={handleProfileChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="website" className="mb-1 block text-sm font-medium text-gray-700">
              Website
            </label>
            <input
              id="website"
              name="website"
              value={profile.website}
              onChange={handleProfileChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              placeholder="https://"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="taxId" className="mb-1 block text-sm font-medium text-gray-700">
                Tax ID
              </label>
              <input
                id="taxId"
                name="taxId"
                value={profile.taxId}
                onChange={handleProfileChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label htmlFor="registrationNumber" className="mb-1 block text-sm font-medium text-gray-700">
                Registration number
              </label>
              <input
                id="registrationNumber"
                name="registrationNumber"
                value={profile.registrationNumber}
                onChange={handleProfileChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Currency & Fiscal */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label htmlFor="baseCurrency" className="mb-1 block text-sm font-medium text-gray-700">
              Base currency *
            </label>
            <select
              id="baseCurrency"
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} - {c.name} ({c.symbol})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              This is the primary currency for your books. It cannot be changed later.
            </p>
          </div>

          <div>
            <label htmlFor="fiscalYearStartMonth" className="mb-1 block text-sm font-medium text-gray-700">
              Fiscal year start month *
            </label>
            <select
              id="fiscalYearStartMonth"
              value={fiscalYearStartMonth}
              onChange={(e) => setFiscalYearStartMonth(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Most businesses use January. Some use April (UK), July (Australia), or October.
            </p>
          </div>

          <div>
            <label htmlFor="timezone" className="mb-1 block text-sm font-medium text-gray-700">
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            >
              {Intl.supportedValuesOf('timeZone').map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Step 3: Business Type */}
      {step === 2 && (
        <div>
          <p className="mb-4 text-sm text-gray-600">
            Choose a chart of accounts template that best matches your business. You can customize it later.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTemplateId(t.id)}
                className={cn(
                  'rounded-lg border-2 p-4 text-left transition-colors',
                  selectedTemplateId === t.id
                    ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                )}
              >
                <p className="text-sm font-semibold text-gray-900">{t.industry}</p>
                {t.description && (
                  <p className="mt-1 text-xs text-gray-500 line-clamp-2">{t.description}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between">
        <div>
          {step > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
          )}
        </div>
        <div>
          {step < 2 ? (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
