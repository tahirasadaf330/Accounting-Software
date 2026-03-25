'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  AccountType,
  NormalBalance,
  ACCOUNT_TYPE_NORMAL_BALANCE,
  ACCOUNT_CODE_RANGES,
  AccountLevel,
} from '@accounting-saas/shared';

interface FlatAccount {
  id: string;
  code: string;
  name: string;
  accountType: string;
  level: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  flatAccounts: FlatAccount[];
}

const LEVEL_LABELS: Record<number, string> = {
  1: 'Category',
  2: 'Group',
  3: 'Sub-Group',
  4: 'Detail',
};

const ACCOUNT_TYPE_OPTIONS = Object.values(AccountType);

export default function AddAccountModal({ open, onClose, onSuccess, flatAccounts }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  const [accountType, setAccountType] = useState<AccountType | ''>('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [normalBalance, setNormalBalance] = useState<NormalBalance | ''>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Reset form whenever modal opens
  useEffect(() => {
    if (open) {
      setAccountType('');
      setCode('');
      setName('');
      setParentId('');
      setNormalBalance('');
      setDescription('');
      setError('');
      setFieldErrors({});
      setSubmitting(false);
    }
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // When accountType changes, reset parent and auto-set normalBalance
  const handleAccountTypeChange = useCallback((type: AccountType | '') => {
    setAccountType(type);
    setParentId('');
    setFieldErrors((prev) => ({ ...prev, accountType: '', code: '', parentId: '' }));
    if (type) {
      setNormalBalance(ACCOUNT_TYPE_NORMAL_BALANCE[type]);
    } else {
      setNormalBalance('');
    }
  }, []);

  // Compute level from parent selection
  const selectedParent = flatAccounts.find((a) => a.id === parentId);
  const computedLevel = selectedParent ? selectedParent.level + 1 : 1;

  // Filter parent options: match selected type, level 1-3
  const parentOptions = accountType
    ? flatAccounts.filter(
        (a) => a.accountType === accountType && a.level < 4,
      )
    : [];

  // Code range for selected type
  const codeRange = accountType ? ACCOUNT_CODE_RANGES[accountType] : null;

  // Client-side validation
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!accountType) errors.accountType = 'Account type is required';
    if (!code.trim()) {
      errors.code = 'Account code is required';
    } else if (!/^\d+$/.test(code.trim())) {
      errors.code = 'Account code must be numeric';
    } else if (codeRange) {
      const num = parseInt(code.trim(), 10);
      if (num < codeRange.min || num > codeRange.max) {
        errors.code = `Code must be between ${codeRange.min} and ${codeRange.max} for ${accountType}`;
      }
    }
    if (!name.trim()) errors.name = 'Account name is required';
    if (!normalBalance) errors.normalBalance = 'Normal balance is required';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      await api.post('/accounts', {
        code: code.trim(),
        name: name.trim(),
        accountType,
        parentId: parentId || undefined,
        level: computedLevel,
        normalBalance,
        description: description.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setFieldErrors((prev) => ({ ...prev, code: 'This account code already exists' }));
        } else if (err.errors) {
          // Map field-level errors from API
          const mapped: Record<string, string> = {};
          for (const [field, messages] of Object.entries(err.errors)) {
            mapped[field] = Array.isArray(messages) ? messages[0] : String(messages);
          }
          setFieldErrors((prev) => ({ ...prev, ...mapped }));
        } else {
          setError(err.message || 'Failed to create account');
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        ref={panelRef}
        className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-xl animate-slide-in-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Add Account</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}

              {/* Account Type */}
              <div>
                <label htmlFor="accountType" className="mb-1 block text-sm font-medium text-gray-700">
                  Account Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="accountType"
                  value={accountType}
                  onChange={(e) => handleAccountTypeChange(e.target.value as AccountType | '')}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                    fieldErrors.accountType ? 'border-red-300' : 'border-gray-300',
                  )}
                >
                  <option value="">Select account type</option>
                  {ACCOUNT_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {fieldErrors.accountType && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.accountType}</p>
                )}
              </div>

              {/* Account Code */}
              <div>
                <label htmlFor="code" className="mb-1 block text-sm font-medium text-gray-700">
                  Account Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, code: '' }));
                  }}
                  placeholder={codeRange ? `e.g. ${codeRange.min}` : 'Enter code'}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                    fieldErrors.code ? 'border-red-300' : 'border-gray-300',
                  )}
                />
                {codeRange && !fieldErrors.code && (
                  <p className="mt-1 text-xs text-gray-500">
                    Valid range: {codeRange.min}–{codeRange.max}
                  </p>
                )}
                {fieldErrors.code && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.code}</p>
                )}
              </div>

              {/* Account Name */}
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder="e.g. Cash in Hand"
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                    fieldErrors.name ? 'border-red-300' : 'border-gray-300',
                  )}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
                )}
              </div>

              {/* Parent Account */}
              <div>
                <label htmlFor="parentId" className="mb-1 block text-sm font-medium text-gray-700">
                  Parent Account
                </label>
                <select
                  id="parentId"
                  value={parentId}
                  onChange={(e) => {
                    setParentId(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, parentId: '' }));
                  }}
                  disabled={!accountType}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:bg-gray-50 disabled:text-gray-400',
                    fieldErrors.parentId ? 'border-red-300' : 'border-gray-300',
                  )}
                >
                  <option value="">None (top-level)</option>
                  {parentOptions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} – {a.name} (L{a.level})
                    </option>
                  ))}
                </select>
                {!accountType && (
                  <p className="mt-1 text-xs text-gray-500">Select an account type first</p>
                )}
                {fieldErrors.parentId && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.parentId}</p>
                )}
              </div>

              {/* Level (read-only) */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Level</label>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  {computedLevel} – {LEVEL_LABELS[computedLevel] || `Level ${computedLevel}`}
                </div>
              </div>

              {/* Normal Balance */}
              <div>
                <label htmlFor="normalBalance" className="mb-1 block text-sm font-medium text-gray-700">
                  Normal Balance <span className="text-red-500">*</span>
                </label>
                <select
                  id="normalBalance"
                  value={normalBalance}
                  onChange={(e) => {
                    setNormalBalance(e.target.value as NormalBalance | '');
                    setFieldErrors((prev) => ({ ...prev, normalBalance: '' }));
                  }}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                    fieldErrors.normalBalance ? 'border-red-300' : 'border-gray-300',
                  )}
                >
                  <option value="">Select normal balance</option>
                  <option value={NormalBalance.DEBIT}>DEBIT</option>
                  <option value={NormalBalance.CREDIT}>CREDIT</option>
                </select>
                {accountType && (
                  <p className="mt-1 text-xs text-gray-500">
                    Auto-set from type. Override if needed.
                  </p>
                )}
                {fieldErrors.normalBalance && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.normalBalance}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Optional description"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
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
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
