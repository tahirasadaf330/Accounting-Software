'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/formatCurrency';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  Landmark,
  Link2,
  Plus,
  RefreshCw,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';

// --- Types ---

interface Account {
  id: string;
  code: string;
  name: string;
  accountType: string;
  isActive: boolean;
}

interface BankAccount {
  id: string;
  accountType: string;
  bankName: string;
  accountNumber: string;
  walletAddress?: string | null;
  currency: string;
  isActive: boolean;
  account: { id: string; code: string; name: string };
}

interface BankStatement {
  id: string;
  bankAccountId: string;
  statementDate: string;
  openingBalance: string;
  closingBalance: string;
  fileName: string;
  totalEntries: number;
  createdAt: string;
  _count?: { lines: number };
}

interface BankStatementLine {
  id: string;
  date: string;
  description: string;
  reference: string | null;
  debit: string;
  credit: string;
  balance: string;
}

interface JournalEntryLine {
  id: string;
  debit: string;
  credit: string;
  description: string;
  journalEntry: {
    id: string;
    entryNumber: string;
    entryDate: string;
    narration: string;
  };
}

interface ReconciliationMatch {
  id: string;
  matchType: string;
  bankStatementLine: BankStatementLine;
  journalEntryLine: JournalEntryLine;
}

interface Reconciliation {
  id: string;
  bankAccountId: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  notes: string | null;
  reconciledBy: string | null;
  bankAccount: BankAccount;
  matches: ReconciliationMatch[];
  summary: {
    matchedCount: number;
    unmatchedBankLines: number;
    unmatchedJournalEntries: number;
  };
}

interface StatementLineForm {
  date: string;
  description: string;
  reference: string;
  debit: string;
  credit: string;
  balance: string;
}

// --- Constants ---

type ViewMode = 'accounts' | 'statements' | 'reconciliation';

const matchTypeLabels: Record<string, string> = {
  EXACT_AMOUNT_DATE: 'Exact (Date + Amount)',
  EXACT_AMOUNT: 'Exact Amount',
  REFERENCE_MATCH: 'Reference Match',
  MANUAL: 'Manual',
};

const matchTypeColors: Record<string, string> = {
  EXACT_AMOUNT_DATE: 'bg-green-100 text-green-700',
  EXACT_AMOUNT: 'bg-blue-100 text-blue-700',
  REFERENCE_MATCH: 'bg-purple-100 text-purple-700',
  MANUAL: 'bg-gray-100 text-gray-700',
};

const formatDate = (d: string) => new Date(d).toLocaleDateString();

// --- Confirm Modal ---

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  confirmColor = 'red',
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor?: 'red' | 'blue' | 'green';
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  const colors = {
    red: 'bg-red-600 hover:bg-red-700',
    blue: 'bg-primary-600 hover:bg-primary-700',
    green: 'bg-green-600 hover:bg-green-700',
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn('rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50', colors[confirmColor])}
          >
            {loading ? 'Processing...' : confirmLabel}
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
}: {
  accounts: Account[];
  value: string;
  onChange: (id: string) => void;
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
      <div className="flex w-full cursor-pointer items-center rounded-lg border border-gray-300 text-sm outline-none focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20">
        <input
          type="text"
          placeholder={selected ? `${selected.code} — ${selected.name}` : 'Search account...'}
          value={open ? search : selected ? `${selected.code} — ${selected.name}` : ''}
          onFocus={() => {
            setOpen(true);
            setSearch('');
          }}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg bg-transparent px-3 py-2 outline-none placeholder:text-gray-400"
        />
        <ChevronDown className="mr-2 h-3.5 w-3.5 shrink-0 text-gray-400" />
      </div>

      {open && (
        <ul className="absolute z-[200] mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
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

// --- Add Bank Account Modal ---

function AddBankAccountModal({
  open,
  accounts,
  onClose,
  onCreated,
}: {
  open: boolean;
  accounts: Account[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [accountType, setAccountType] = useState<'BANK' | 'CRYPTO'>('BANK');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [accountId, setAccountId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isCrypto = accountType === 'CRYPTO';

  const reset = () => {
    setAccountType('BANK');
    setBankName('');
    setAccountNumber('');
    setWalletAddress('');
    setCurrency('USD');
    setAccountId('');
    setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !accountNumber.trim() || !accountId) {
      setError('All required fields must be filled.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/bank-reconciliation/bank-accounts', {
        accountType,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        walletAddress: walletAddress.trim() || undefined,
        currency: currency.trim() || 'USD',
        accountId,
      });
      onCreated();
      reset();
    } catch (err: any) {
      setError(err?.message || 'Failed to create account.');
    }
    setSubmitting(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="mx-4 flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Add {isCrypto ? 'Crypto' : 'Bank'} Account
          </h3>
          <button onClick={handleClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {/* Account Type Toggle */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Account Type</label>
            <div className="flex rounded-lg border border-gray-300 p-1">
              <button
                type="button"
                onClick={() => setAccountType('BANK')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  !isCrypto ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50',
                )}
              >
                <Landmark className="h-4 w-4" />
                Bank
              </button>
              <button
                type="button"
                onClick={() => setAccountType('CRYPTO')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isCrypto ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-50',
                )}
              >
                <Wallet className="h-4 w-4" />
                Crypto
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {isCrypto ? 'Exchange / Wallet Name' : 'Bank Name'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder={isCrypto ? 'e.g. Binance, MetaMask' : 'e.g. National Bank'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {isCrypto ? 'Account / User ID' : 'Account Number'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder={isCrypto ? 'e.g. user@binance or UID-12345' : 'e.g. 1234567890'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {isCrypto && (
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Wallet Address <span className="text-xs text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="e.g. 0xAbc123..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder={isCrypto ? 'e.g. USDT, BTC, ETH' : 'USD'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Linked COA Account <span className="text-red-500">*</span>
            </label>
            <AccountCombobox accounts={accounts} value={accountId} onChange={setAccountId} />
          </div>
          </div>

          <div className="shrink-0 flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50',
                isCrypto ? 'bg-orange-500 hover:bg-orange-600' : 'bg-primary-600 hover:bg-primary-700',
              )}
            >
              {submitting ? 'Creating...' : `Add ${isCrypto ? 'Crypto' : 'Bank'} Account`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Edit Bank Account Modal ---

function EditBankAccountModal({
  account,
  onClose,
  onUpdated,
}: {
  account: BankAccount | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [currency, setCurrency] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (account) {
      setBankName(account.bankName);
      setAccountNumber(account.accountNumber);
      setWalletAddress(account.walletAddress || '');
      setCurrency(account.currency);
      setError('');
    }
  }, [account]);

  if (!account) return null;

  const isCrypto = account.accountType === 'CRYPTO';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !accountNumber.trim()) {
      setError('Name and account number are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.patch(`/bank-reconciliation/bank-accounts/${account.id}`, {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        walletAddress: walletAddress.trim() || null,
        currency: currency.trim() || 'USD',
      });
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update account.');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="mx-4 w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Edit {isCrypto ? 'Crypto' : 'Bank'} Account
          </h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {isCrypto ? 'Exchange / Wallet Name' : 'Bank Name'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {isCrypto ? 'Account / User ID' : 'Account Number'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          {isCrypto && (
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Wallet Address <span className="text-xs text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          )}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Import Statement Modal ---

function ImportStatementModal({
  open,
  bankAccountId,
  onClose,
  onImported,
}: {
  open: boolean;
  bankAccountId: string;
  onClose: () => void;
  onImported: () => void;
}) {
  const [statementDate, setStatementDate] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [fileName, setFileName] = useState('');
  const [lines, setLines] = useState<StatementLineForm[]>([
    { date: '', description: '', reference: '', debit: '', credit: '', balance: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const addLine = () => {
    setLines([...lines, { date: '', description: '', reference: '', debit: '', credit: '', balance: '' }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof StatementLineForm, value: string) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statementDate || !openingBalance || !closingBalance || !fileName.trim()) {
      setError('Statement date, opening balance, closing balance, and file name are required.');
      return;
    }
    const validLines = lines.filter((l) => l.date && l.description);
    if (validLines.length === 0) {
      setError('At least one statement line with date and description is required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/bank-reconciliation/bank-accounts/${bankAccountId}/statements`, {
        statementDate,
        openingBalance: parseFloat(openingBalance) || 0,
        closingBalance: parseFloat(closingBalance) || 0,
        fileName: fileName.trim(),
        lines: validLines.map((l) => ({
          date: l.date,
          description: l.description,
          reference: l.reference || null,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
          balance: parseFloat(l.balance) || 0,
        })),
      });
      onImported();
      onClose();
      setStatementDate('');
      setOpeningBalance('');
      setClosingBalance('');
      setFileName('');
      setLines([{ date: '', description: '', reference: '', debit: '', credit: '', balance: '' }]);
    } catch (err: any) {
      setError(err?.message || 'Failed to import statement.');
    }
    setSubmitting(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Import Bank Statement</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Statement Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={statementDate}
                onChange={(e) => setStatementDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                File Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. January_2026.csv"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Opening Balance <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Closing Balance <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          {/* Statement Lines */}
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Statement Lines</label>
              <button
                type="button"
                onClick={addLine}
                className="flex items-center gap-1 rounded-lg bg-primary-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Row
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Reference</th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Debit</th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Credit</th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Balance</th>
                    <th className="w-10 px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.map((line, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5">
                        <input
                          type="date"
                          value={line.date}
                          onChange={(e) => updateLine(i, 'date', e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-primary-500"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={line.description}
                          onChange={(e) => updateLine(i, 'description', e.target.value)}
                          placeholder="Description"
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-primary-500"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={line.reference}
                          onChange={(e) => updateLine(i, 'reference', e.target.value)}
                          placeholder="Ref"
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-primary-500"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.debit}
                          onChange={(e) => updateLine(i, 'debit', e.target.value)}
                          placeholder="0.00"
                          className="w-full rounded border border-gray-300 px-2 py-1 text-right text-sm outline-none focus:border-primary-500"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.credit}
                          onChange={(e) => updateLine(i, 'credit', e.target.value)}
                          placeholder="0.00"
                          className="w-full rounded border border-gray-300 px-2 py-1 text-right text-sm outline-none focus:border-primary-500"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={line.balance}
                          onChange={(e) => updateLine(i, 'balance', e.target.value)}
                          placeholder="0.00"
                          className="w-full rounded border border-gray-300 px-2 py-1 text-right text-sm outline-none focus:border-primary-500"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(i)}
                          disabled={lines.length <= 1}
                          className={cn(
                            'rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600',
                            lines.length <= 1 && 'cursor-not-allowed opacity-30',
                          )}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? 'Importing...' : 'Import Statement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Start Reconciliation Modal ---

function StartReconciliationModal({
  open,
  bankAccount,
  onClose,
  onStarted,
}: {
  open: boolean;
  bankAccount: BankAccount | null;
  onClose: () => void;
  onStarted: (reconciliationId: string) => void;
}) {
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodStart || !periodEnd) {
      setError('Period start and end dates are required.');
      return;
    }
    if (new Date(periodEnd) <= new Date(periodStart)) {
      setError('Period end must be after period start.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await api.post<any>('/bank-reconciliation/reconciliations', {
        bankAccountId: bankAccount?.id,
        periodStart,
        periodEnd,
        notes: notes.trim() || undefined,
      });
      const reconId = result.id || result.data?.id;
      onStarted(reconId);
      onClose();
      setPeriodStart('');
      setPeriodEnd('');
      setNotes('');
    } catch (err: any) {
      setError(err?.message || 'Failed to start reconciliation.');
    }
    setSubmitting(false);
  };

  if (!open || !bankAccount) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Start Reconciliation</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <div className="mb-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4" />
              <span className="font-medium">{bankAccount.bankName}</span>
            </div>
            <p className="mt-1 text-xs">
              ****{bankAccount.accountNumber.slice(-4)} &middot; {bankAccount.currency}
            </p>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Period Start <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Period End <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes for this reconciliation..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? 'Starting...' : 'Start Reconciliation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Statements View ---

function StatementsView({
  bankAccount,
  statements,
  loading,
  onBack,
}: {
  bankAccount: BankAccount;
  statements: BankStatement[];
  loading: boolean;
  onBack: () => void;
}) {
  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Statements</h1>
          <p className="mt-1 text-sm text-gray-600">
            {bankAccount.bankName} &middot; ****{bankAccount.accountNumber.slice(-4)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : statements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 shadow-sm ring-1 ring-gray-200">
          <FileText className="mb-4 h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-500">No statements imported yet</p>
          <p className="text-xs text-gray-400">Import a statement from the accounts view</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Statement Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Opening Bal</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Closing Bal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">File Name</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Line Count</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Imported On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {statements.map((stmt) => (
                  <tr key={stmt.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{formatDate(stmt.statementDate)}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(stmt.openingBalance, bankAccount.currency)}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(stmt.closingBalance, bankAccount.currency)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{stmt.fileName}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {stmt._count?.lines ?? stmt.totalEntries ?? 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(stmt.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Reconciliation Dashboard ---

function ReconciliationDashboard({
  reconciliation,
  reconLoading,
  unmatchedBankLines,
  unmatchedJournalEntries,
  selectedBankLine,
  selectedJournalLine,
  onSelectBankLine,
  onSelectJournalLine,
  onAutoMatch,
  onManualMatch,
  onUnmatch,
  onComplete,
  onBack,
  actionLoading,
}: {
  reconciliation: Reconciliation;
  reconLoading: boolean;
  unmatchedBankLines: BankStatementLine[];
  unmatchedJournalEntries: JournalEntryLine[];
  selectedBankLine: string | null;
  selectedJournalLine: string | null;
  onSelectBankLine: (id: string | null) => void;
  onSelectJournalLine: (id: string | null) => void;
  onAutoMatch: () => void;
  onManualMatch: () => void;
  onUnmatch: (matchId: string) => void;
  onComplete: () => void;
  onBack: () => void;
  actionLoading: boolean;
}) {
  const isCompleted = reconciliation.status === 'COMPLETED';
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [autoMatchResult, setAutoMatchResult] = useState<string | null>(null);

  const bankAccount = reconciliation.bankAccount;
  const summary = reconciliation.summary;

  const handleAutoMatch = async () => {
    setAutoMatchResult(null);
    onAutoMatch();
  };

  if (reconLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {bankAccount?.bankName} ****{bankAccount?.accountNumber?.slice(-4)}
              </h1>
              <span
                className={cn(
                  'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                  isCompleted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700',
                )}
              >
                {reconciliation.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {formatDate(reconciliation.periodStart)} &ndash; {formatDate(reconciliation.periodEnd)}
            </p>
          </div>
        </div>
        {!isCompleted && (
          <button
            onClick={() => setShowCompleteConfirm(true)}
            disabled={actionLoading}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Complete Reconciliation
          </button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Matched</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.matchedCount ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-100 p-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Unmatched Bank Lines</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.unmatchedBankLines ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-100 p-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Unmatched Journal Entries</p>
              <p className="text-2xl font-bold text-gray-900">{summary?.unmatchedJournalEntries ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Match Card */}
      {!isCompleted && (
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Auto-Match</h2>
              <p className="mt-1 text-xs text-gray-500">
                Automatically match bank statement lines with journal entries based on amount, date, and reference.
              </p>
            </div>
            <button
              onClick={handleAutoMatch}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {actionLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Run Auto-Match
            </button>
          </div>
          {autoMatchResult && (
            <div className="mt-3 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">{autoMatchResult}</div>
          )}
        </div>
      )}

      {/* Matched Items Table */}
      <div className="mb-6 rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="border-b border-gray-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-900">
            Matched Items ({reconciliation.matches?.length ?? 0})
          </h2>
        </div>
        {reconciliation.matches?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase text-gray-500">Bank Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase text-gray-500">Bank Description</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase text-gray-500">Bank Amount</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase text-gray-500">Match Type</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase text-gray-500">Journal Entry #</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase text-gray-500">Journal Date</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase text-gray-500">Journal Amount</th>
                  <th className="w-20 px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reconciliation.matches.map((match) => {
                  const bankLine = match.bankStatementLine;
                  const journalLine = match.journalEntryLine;
                  const bankAmount = Number(bankLine?.debit || 0) - Number(bankLine?.credit || 0);
                  const journalAmount = Number(journalLine?.debit || 0) - Number(journalLine?.credit || 0);
                  return (
                    <tr key={match.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-sm text-gray-900">
                        {bankLine?.date ? formatDate(bankLine.date) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-700">{bankLine?.description || '—'}</td>
                      <td className="px-4 py-2.5 text-right text-sm text-gray-900">
                        {formatCurrency(Math.abs(bankAmount), bankAccount?.currency)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                            matchTypeColors[match.matchType] || 'bg-gray-100 text-gray-700',
                          )}
                        >
                          {matchTypeLabels[match.matchType] || match.matchType}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm font-mono text-gray-900">
                        {journalLine?.journalEntry?.entryNumber || '—'}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-900">
                        {journalLine?.journalEntry?.entryDate
                          ? formatDate(journalLine.journalEntry.entryDate)
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-sm text-gray-900">
                        {formatCurrency(Math.abs(journalAmount), bankAccount?.currency)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {!isCompleted && (
                          <button
                            onClick={() => onUnmatch(match.id)}
                            disabled={actionLoading}
                            className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            title="Unmatch"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-8 text-center text-sm text-gray-500">No matched items yet</div>
        )}
      </div>

      {/* Unmatched Items — Side by Side Panels */}
      {!isCompleted && (
        <div className="mb-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-gray-900">Unmatched Items</h2>
            <button
              onClick={onManualMatch}
              disabled={!selectedBankLine || !selectedJournalLine || actionLoading}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Link2 className="h-4 w-4" />
              Match Selected
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Left: Unmatched Bank Lines */}
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
              <div className="border-b border-gray-200 px-4 py-3">
                <h3 className="text-xs font-semibold uppercase text-gray-500">
                  Bank Lines ({unmatchedBankLines.length})
                </h3>
              </div>
              {unmatchedBankLines.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Ref</th>
                        <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Debit</th>
                        <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {unmatchedBankLines.map((line) => (
                        <tr
                          key={line.id}
                          onClick={() => onSelectBankLine(selectedBankLine === line.id ? null : line.id)}
                          className={cn(
                            'cursor-pointer hover:bg-gray-50',
                            selectedBankLine === line.id && 'bg-primary-50 ring-2 ring-primary-300',
                          )}
                        >
                          <td className="px-3 py-2 text-sm text-gray-900">{formatDate(line.date)}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">{line.description}</td>
                          <td className="px-3 py-2 text-sm text-gray-500">{line.reference || '—'}</td>
                          <td className="px-3 py-2 text-right text-sm text-gray-900">
                            {Number(line.debit) > 0 ? formatCurrency(line.debit, bankAccount?.currency) : ''}
                          </td>
                          <td className="px-3 py-2 text-right text-sm text-gray-900">
                            {Number(line.credit) > 0 ? formatCurrency(line.credit, bankAccount?.currency) : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-sm text-gray-500">No unmatched bank lines</div>
              )}
            </div>

            {/* Right: Unmatched Journal Entries */}
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
              <div className="border-b border-gray-200 px-4 py-3">
                <h3 className="text-xs font-semibold uppercase text-gray-500">
                  Journal Entries ({unmatchedJournalEntries.length})
                </h3>
              </div>
              {unmatchedJournalEntries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Entry #</th>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Narration</th>
                        <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Debit</th>
                        <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {unmatchedJournalEntries.map((line) => (
                        <tr
                          key={line.id}
                          onClick={() => onSelectJournalLine(selectedJournalLine === line.id ? null : line.id)}
                          className={cn(
                            'cursor-pointer hover:bg-gray-50',
                            selectedJournalLine === line.id && 'bg-primary-50 ring-2 ring-primary-300',
                          )}
                        >
                          <td className="px-3 py-2 text-sm font-mono text-gray-900">
                            {line.journalEntry?.entryNumber || '—'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {line.journalEntry?.entryDate ? formatDate(line.journalEntry.entryDate) : '—'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700">
                            {line.journalEntry?.narration || line.description || '—'}
                          </td>
                          <td className="px-3 py-2 text-right text-sm text-gray-900">
                            {Number(line.debit) > 0 ? formatCurrency(line.debit, bankAccount?.currency) : ''}
                          </td>
                          <td className="px-3 py-2 text-right text-sm text-gray-900">
                            {Number(line.credit) > 0 ? formatCurrency(line.credit, bankAccount?.currency) : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-sm text-gray-500">No unmatched journal entries</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Complete Reconciliation Confirm Modal */}
      <ConfirmModal
        open={showCompleteConfirm}
        title="Complete Reconciliation"
        message="Mark this reconciliation as complete? No further changes can be made after completion."
        confirmLabel="Complete"
        confirmColor="green"
        loading={actionLoading}
        onConfirm={() => {
          setShowCompleteConfirm(false);
          onComplete();
        }}
        onCancel={() => setShowCompleteConfirm(false)}
      />
    </div>
  );
}

// --- Main Page Component ---

export default function BankReconciliationPage() {
  // View mode
  const [activeView, setActiveView] = useState<ViewMode>('accounts');

  // Bank accounts
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // COA accounts (for combobox)
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Selected bank account (for statements / reconciliation context)
  const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccount | null>(null);

  // Modal booleans
  const [showAddBankAccount, setShowAddBankAccount] = useState(false);
  const [showImportStatement, setShowImportStatement] = useState(false);
  const [editBankAccount, setEditBankAccount] = useState<BankAccount | null>(null);
  const [deleteConfirmAccount, setDeleteConfirmAccount] = useState<BankAccount | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showStartReconciliation, setShowStartReconciliation] = useState(false);

  // Statements
  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [statementsLoading, setStatementsLoading] = useState(false);

  // Reconciliation
  const [activeReconciliation, setActiveReconciliation] = useState<Reconciliation | null>(null);
  const [reconLoading, setReconLoading] = useState(false);

  // Unmatched items
  const [unmatchedBankLines, setUnmatchedBankLines] = useState<BankStatementLine[]>([]);
  const [unmatchedJournalEntries, setUnmatchedJournalEntries] = useState<JournalEntryLine[]>([]);

  // Selection for manual matching
  const [selectedBankLine, setSelectedBankLine] = useState<string | null>(null);
  const [selectedJournalLine, setSelectedJournalLine] = useState<string | null>(null);

  // Action state
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // --- Data Loading ---

  const loadBankAccounts = async () => {
    try {
      const data = await api.get<any>('/bank-reconciliation/bank-accounts');
      setBankAccounts(data.data || data || []);
    } catch (err) {
      console.error('Failed to load bank accounts:', err);
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

  const loadStatements = async (bankAccountId: string) => {
    setStatementsLoading(true);
    try {
      const data = await api.get<any>(`/bank-reconciliation/bank-accounts/${bankAccountId}/statements`);
      setStatements(data.data || data || []);
    } catch (err) {
      console.error('Failed to load statements:', err);
    }
    setStatementsLoading(false);
  };

  const loadReconciliation = async (id: string) => {
    setReconLoading(true);
    try {
      const data = await api.get<Reconciliation>(`/bank-reconciliation/reconciliations/${id}`);
      setActiveReconciliation(data);
    } catch (err) {
      console.error('Failed to load reconciliation:', err);
    }
    setReconLoading(false);
  };

  const loadUnmatchedItems = async (id: string) => {
    try {
      const data = await api.get<any>(`/bank-reconciliation/reconciliations/${id}/unmatched`);
      setUnmatchedBankLines(data.bankLines || data.unmatchedBankLines || []);
      setUnmatchedJournalEntries(data.journalEntries || data.unmatchedJournalEntries || []);
    } catch (err) {
      console.error('Failed to load unmatched items:', err);
    }
  };

  // --- On Mount ---

  useEffect(() => {
    loadBankAccounts();
    loadAccounts();
  }, []);

  // --- Actions ---

  const handleViewStatements = async (bank: BankAccount) => {
    setSelectedBankAccount(bank);
    await loadStatements(bank.id);
    setActiveView('statements');
  };

  const handleStartReconciliation = (bank: BankAccount) => {
    setSelectedBankAccount(bank);
    setShowStartReconciliation(true);
  };

  const handleDeleteBankAccount = async () => {
    if (!deleteConfirmAccount) return;
    setDeleting(true);
    try {
      await api.delete(`/bank-reconciliation/bank-accounts/${deleteConfirmAccount.id}`);
      setDeleteConfirmAccount(null);
      loadBankAccounts();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete account.');
    }
    setDeleting(false);
  };

  const handleReconciliationStarted = async (reconciliationId: string) => {
    await loadReconciliation(reconciliationId);
    await loadUnmatchedItems(reconciliationId);
    setActiveView('reconciliation');
  };

  const handleAutoMatch = async () => {
    if (!activeReconciliation) return;
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/bank-reconciliation/reconciliations/${activeReconciliation.id}/auto-match`, {});
      await loadReconciliation(activeReconciliation.id);
      await loadUnmatchedItems(activeReconciliation.id);
      setSuccessMessage('Auto-match completed successfully.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setError(err?.message || 'Auto-match failed.');
    }
    setActionLoading(false);
  };

  const handleManualMatch = async () => {
    if (!activeReconciliation || !selectedBankLine || !selectedJournalLine) return;
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/bank-reconciliation/reconciliations/${activeReconciliation.id}/match`, {
        bankStatementLineId: selectedBankLine,
        journalEntryLineId: selectedJournalLine,
      });
      setSelectedBankLine(null);
      setSelectedJournalLine(null);
      await loadReconciliation(activeReconciliation.id);
      await loadUnmatchedItems(activeReconciliation.id);
    } catch (err: any) {
      setError(err?.message || 'Manual match failed.');
    }
    setActionLoading(false);
  };

  const handleUnmatch = async (matchId: string) => {
    if (!activeReconciliation) return;
    setActionLoading(true);
    setError('');
    try {
      await api.delete(`/bank-reconciliation/reconciliations/${activeReconciliation.id}/matches/${matchId}`);
      await loadReconciliation(activeReconciliation.id);
      await loadUnmatchedItems(activeReconciliation.id);
    } catch (err: any) {
      setError(err?.message || 'Unmatch failed.');
    }
    setActionLoading(false);
  };

  const handleCompleteReconciliation = async () => {
    if (!activeReconciliation) return;
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/bank-reconciliation/reconciliations/${activeReconciliation.id}/complete`, {});
      await loadReconciliation(activeReconciliation.id);
      await loadUnmatchedItems(activeReconciliation.id);
      setSuccessMessage('Reconciliation completed successfully.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setError(err?.message || 'Failed to complete reconciliation.');
    }
    setActionLoading(false);
  };

  const handleBackToAccounts = () => {
    setActiveView('accounts');
    setSelectedBankAccount(null);
    setActiveReconciliation(null);
    setUnmatchedBankLines([]);
    setUnmatchedJournalEntries([]);
    setSelectedBankLine(null);
    setSelectedJournalLine(null);
    setError('');
    setSuccessMessage('');
  };

  // --- Render ---

  // Global error / success banners
  const banners = (
    <>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError('')} className="ml-2 font-medium underline">
            Dismiss
          </button>
        </div>
      )}
      {successMessage && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}
    </>
  );

  // --- Statements View ---
  if (activeView === 'statements' && selectedBankAccount) {
    return (
      <div>
        {banners}
        <StatementsView
          bankAccount={selectedBankAccount}
          statements={statements}
          loading={statementsLoading}
          onBack={handleBackToAccounts}
        />
      </div>
    );
  }

  // --- Reconciliation View ---
  if (activeView === 'reconciliation' && activeReconciliation) {
    return (
      <div>
        {banners}
        <ReconciliationDashboard
          reconciliation={activeReconciliation}
          reconLoading={reconLoading}
          unmatchedBankLines={unmatchedBankLines}
          unmatchedJournalEntries={unmatchedJournalEntries}
          selectedBankLine={selectedBankLine}
          selectedJournalLine={selectedJournalLine}
          onSelectBankLine={setSelectedBankLine}
          onSelectJournalLine={setSelectedJournalLine}
          onAutoMatch={handleAutoMatch}
          onManualMatch={handleManualMatch}
          onUnmatch={handleUnmatch}
          onComplete={handleCompleteReconciliation}
          onBack={handleBackToAccounts}
          actionLoading={actionLoading}
        />
      </div>
    );
  }

  // --- Accounts View (default) ---
  return (
    <div>
      {banners}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Reconciliation</h1>
          <p className="mt-1 text-sm text-gray-600">Manage bank accounts and reconcile statements</p>
        </div>
        <button
          onClick={() => setShowAddBankAccount(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Add Bank Account
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : bankAccounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 shadow-sm ring-1 ring-gray-200">
          <Landmark className="mb-4 h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-500">No bank accounts configured</p>
          <p className="text-xs text-gray-400">Add a bank account to start reconciling</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bankAccounts.map((bank) => {
            const isCrypto = bank.accountType === 'CRYPTO';
            return (
            <div
              key={bank.id}
              className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className={cn('rounded-lg p-2', isCrypto ? 'bg-orange-100' : 'bg-blue-100')}>
                  {isCrypto
                    ? <Wallet className="h-5 w-5 text-orange-500" />
                    : <Landmark className="h-5 w-5 text-blue-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{bank.bankName}</h3>
                    <span className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                      isCrypto ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700',
                    )}>
                      {isCrypto ? 'CRYPTO' : 'BANK'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">****{bank.accountNumber.slice(-4)}</p>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-sm text-gray-600">
                <p>
                  <span className="text-gray-500">Linked:</span>{' '}
                  <span className="font-mono">{bank.account?.code}</span> {bank.account?.name}
                </p>
                <p>
                  <span className="text-gray-500">Currency:</span> {bank.currency}
                </p>
                {isCrypto && bank.walletAddress && (
                  <p className="truncate">
                    <span className="text-gray-500">Wallet:</span>{' '}
                    <span className="font-mono text-xs">{bank.walletAddress}</span>
                  </p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setSelectedBankAccount(bank);
                    setShowImportStatement(true);
                  }}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Import
                </button>
                <button
                  onClick={() => handleViewStatements(bank)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Statements
                </button>
                <button
                  onClick={() => handleStartReconciliation(bank)}
                  className="flex-1 rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Reconcile
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setEditBankAccount(bank)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteConfirmAccount(bank)}
                  className="flex-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          );})}
        </div>
      )}

      {/* Modals */}
      <AddBankAccountModal
        open={showAddBankAccount}
        accounts={accounts}
        onClose={() => setShowAddBankAccount(false)}
        onCreated={() => {
          loadBankAccounts();
          setShowAddBankAccount(false);
        }}
      />
      <ImportStatementModal
        open={showImportStatement}
        bankAccountId={selectedBankAccount?.id || ''}
        onClose={() => setShowImportStatement(false)}
        onImported={() => {
          setShowImportStatement(false);
          setSuccessMessage('Statement imported successfully.');
          setTimeout(() => setSuccessMessage(''), 4000);
        }}
      />
      <StartReconciliationModal
        open={showStartReconciliation}
        bankAccount={selectedBankAccount}
        onClose={() => setShowStartReconciliation(false)}
        onStarted={handleReconciliationStarted}
      />
      <EditBankAccountModal
        account={editBankAccount}
        onClose={() => setEditBankAccount(null)}
        onUpdated={() => { loadBankAccounts(); setEditBankAccount(null); }}
      />
      <ConfirmModal
        open={!!deleteConfirmAccount}
        title="Delete Account"
        message={`Are you sure you want to delete "${deleteConfirmAccount?.bankName}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="red"
        loading={deleting}
        onConfirm={handleDeleteBankAccount}
        onCancel={() => setDeleteConfirmAccount(null)}
      />
    </div>
  );
}
