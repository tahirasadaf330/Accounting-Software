'use client';

import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Building2, Save, X, ShieldCheck, ShieldOff, Loader2, Copy, Check, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Password changed successfully.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
              <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
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
                {submitting ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function MfaModal({ enabled, onClose, onSuccess }: { enabled: boolean; onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<'loading' | 'setup' | 'verify' | 'disable'>('loading');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (enabled) {
      setStep('disable');
      return;
    }
    // Start setup flow
    api.post<any>('/auth/mfa/setup')
      .then((res) => {
        setQrCodeUrl(res.qrCodeUrl);
        setSecret(res.secret);
        setStep('setup');
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Failed to set up MFA');
        setStep('setup');
      });
  }, [enabled]);

  const handleCopy = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/mfa/verify', { code });
      setSuccess(true);
      onSuccess();
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Verification failed');
    }
    setSubmitting(false);
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/mfa/disable', { code });
      setSuccess(true);
      onSuccess();
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to disable MFA');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {enabled ? (
              <ShieldOff className="h-5 w-5 text-red-500" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-green-600" />
            )}
            <h2 className="text-lg font-semibold text-gray-900">
              {enabled ? 'Disable Two-Factor Authentication' : 'Enable Two-Factor Authentication'}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {enabled ? 'Two-factor authentication disabled.' : 'Two-factor authentication enabled.'}
          </div>
        ) : step === 'loading' ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : step === 'disable' ? (
          <form onSubmit={handleDisable} className="mt-4 space-y-4">
            <p className="text-sm text-gray-600">
              Enter the 6-digit code from your authenticator app to disable two-factor authentication.
            </p>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                autoFocus
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-center font-mono text-lg tracking-widest outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
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
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Disabling...' : 'Disable MFA'}
              </button>
            </div>
          </form>
        ) : step === 'setup' ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-600">
              Scan the QR code below with your authenticator app (e.g. Google Authenticator, Authy).
            </p>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {qrCodeUrl && (
              <div className="flex justify-center">
                <img src={qrCodeUrl} alt="MFA QR Code" className="h-48 w-48" />
              </div>
            )}
            {secret && (
              <div>
                <p className="text-xs font-medium text-gray-500">Or enter this key manually:</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-mono text-gray-800 select-all">
                    {secret}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-lg border border-gray-300 p-2 text-gray-500 hover:bg-gray-50"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep('verify')}
                disabled={!qrCodeUrl}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="mt-4 space-y-4">
            <p className="text-sm text-gray-600">
              Enter the 6-digit code from your authenticator app to complete setup.
            </p>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                autoFocus
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-center font-mono text-lg tracking-widest outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setStep('setup'); setCode(''); setError(null); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? 'Verifying...' : 'Enable MFA'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function LogoSection({ isOwner }: { isOwner: boolean }) {
  const tenant = useAuthStore((s) => s.tenant);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let revoked: string | null = null;
    if (tenant?.hasLogo) {
      api.getFileUrl('/tenant/profile/logo').then((u) => {
        revoked = u;
        setPreviewUrl(u);
      }).catch(() => setPreviewUrl(null));
    } else {
      setPreviewUrl(null);
    }
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [tenant?.hasLogo]);

  const handleFile = async (file: File) => {
    setError(null);
    setSuccess(null);
    if (file.size > 2 * 1024 * 1024) {
      setError('Logo must be 2 MB or smaller');
      return;
    }
    setBusy(true);
    try {
      await api.uploadFiles('/tenant/profile/logo', [file]);
      await fetchProfile();
      setSuccess('Logo updated');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    }
    setBusy(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = async () => {
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      await api.delete('/tenant/profile/logo');
      await fetchProfile();
      setSuccess('Logo removed');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove logo');
    }
    setBusy(false);
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary-100 p-2">
          <ImageIcon className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Company Logo</h2>
          <p className="text-xs text-gray-500">
            {isOwner
              ? 'PNG, JPEG, WebP, SVG, or GIF — up to 2 MB. Shown in the sidebar and header.'
              : 'Only the organization owner can change the logo.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="mt-6 flex items-center gap-6">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50">
          {previewUrl ? (
            <img src={previewUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
          ) : (
            <ImageIcon className="h-8 w-8 text-gray-300" />
          )}
        </div>

        {isOwner && (
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {tenant?.hasLogo ? 'Replace Logo' : 'Upload Logo'}
            </button>
            {tenant?.hasLogo && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={busy}
                className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface TenantProfile {
  id: string;
  name: string;
  slug: string;
  baseCurrency: string;
  fiscalYearStartMonth: number;
  timezone: string;
  locale: string;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  taxId: string | null;
  registrationNumber: string | null;
  status: string;
  createdAt: string;
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const tenant = useAuthStore((s) => s.tenant);
  const isOwner = user?.role === 'OWNER';

  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [form, setForm] = useState({
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

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setProfileLoading(true);
    try {
      const data = await api.get<TenantProfile>('/tenant/profile');
      setProfile(data);
      setForm({
        name: data.name || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        postalCode: data.postalCode || '',
        country: data.country || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        taxId: data.taxId || '',
        registrationNumber: data.registrationNumber || '',
      });
    } catch (err) {
      console.error('Failed to load tenant profile:', err);
    }
    setProfileLoading(false);
  };

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const data = await api.patch<TenantProfile>('/tenant/profile', {
        name: form.name || undefined,
        address: form.address,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        country: form.country,
        phone: form.phone,
        email: form.email || undefined,
        website: form.website || undefined,
        taxId: form.taxId,
        registrationNumber: form.registrationNumber,
      });
      setProfile(data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveError(err.message);
      } else {
        setSaveError('An unexpected error occurred');
      }
    }
    setSaving(false);
  };

  const inputClass = (editable: boolean) =>
    cn(
      'mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none',
      editable
        ? 'border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
        : 'border-gray-200 bg-gray-50 text-gray-500',
    );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your account and organization settings</p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                defaultValue={user?.firstName}
                disabled
                className={inputClass(false)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                defaultValue={user?.lastName}
                disabled
                className={inputClass(false)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                defaultValue={user?.email}
                disabled
                className={inputClass(false)}
              />
            </div>
          </div>
        </div>

        {/* Company Profile */}
        {tenant && (
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary-100 p-2">
                  <Building2 className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Company Profile</h2>
                  <p className="text-xs text-gray-500">
                    {isOwner ? 'Update your company details' : 'View company details'}
                  </p>
                </div>
              </div>
              {isOwner && !profileLoading && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </button>
              )}
            </div>

            {saveError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                Company profile updated successfully.
              </div>
            )}

            {profileLoading ? (
              <div className="mt-6 flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {/* General */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase text-gray-400">General</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Organization Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        disabled={!isOwner}
                        className={inputClass(isOwner)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Slug</label>
                      <input
                        type="text"
                        defaultValue={profile?.slug}
                        disabled
                        className={inputClass(false)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Base Currency</label>
                      <input
                        type="text"
                        defaultValue={profile?.baseCurrency}
                        disabled
                        className={inputClass(false)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Timezone</label>
                      <input
                        type="text"
                        defaultValue={profile?.timezone}
                        disabled
                        className={inputClass(false)}
                      />
                    </div>
                  </div>
                </div>

                {/* Tax & Registration */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase text-gray-400">Tax & Registration</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tax ID</label>
                      <input
                        type="text"
                        value={form.taxId}
                        onChange={(e) => handleChange('taxId', e.target.value)}
                        disabled={!isOwner}
                        placeholder={isOwner ? 'e.g. 12-3456789' : '—'}
                        className={inputClass(isOwner)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Registration Number</label>
                      <input
                        type="text"
                        value={form.registrationNumber}
                        onChange={(e) => handleChange('registrationNumber', e.target.value)}
                        disabled={!isOwner}
                        placeholder={isOwner ? 'e.g. REG-2024-001' : '—'}
                        className={inputClass(isOwner)}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase text-gray-400">Contact Information</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        disabled={!isOwner}
                        placeholder={isOwner ? '+1-555-123-4567' : '—'}
                        className={inputClass(isOwner)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        disabled={!isOwner}
                        placeholder={isOwner ? 'info@company.com' : '—'}
                        className={inputClass(isOwner)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Website</label>
                      <input
                        type="url"
                        value={form.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                        disabled={!isOwner}
                        placeholder={isOwner ? 'https://company.com' : '—'}
                        className={inputClass(isOwner)}
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold uppercase text-gray-400">Address</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Street Address</label>
                      <input
                        type="text"
                        value={form.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        disabled={!isOwner}
                        placeholder={isOwner ? '123 Main Street, Suite 100' : '—'}
                        className={inputClass(isOwner)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">City</label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        disabled={!isOwner}
                        placeholder={isOwner ? 'New York' : '—'}
                        className={inputClass(isOwner)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">State / Province</label>
                      <input
                        type="text"
                        value={form.state}
                        onChange={(e) => handleChange('state', e.target.value)}
                        disabled={!isOwner}
                        placeholder={isOwner ? 'NY' : '—'}
                        className={inputClass(isOwner)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                      <input
                        type="text"
                        value={form.postalCode}
                        onChange={(e) => handleChange('postalCode', e.target.value)}
                        disabled={!isOwner}
                        placeholder={isOwner ? '10001' : '—'}
                        className={inputClass(isOwner)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Country</label>
                      <input
                        type="text"
                        value={form.country}
                        onChange={(e) => handleChange('country', e.target.value)}
                        disabled={!isOwner}
                        placeholder={isOwner ? 'United States' : '—'}
                        className={inputClass(isOwner)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Company Logo */}
        {tenant && <LogoSection isOwner={isOwner} />}

        {/* Security settings (password / MFA) removed — authentication is handled by Microsoft SSO. */}
      </div>
    </div>
  );
}
