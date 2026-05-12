'use client';

import { useState, useEffect, useMemo, useRef, Fragment } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Printer,
  Download,
  FileSpreadsheet,
  FileText,
  MessageSquare,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/formatCurrency';
import { useAuthStore } from '@/stores/auth.store';
import ReportPrintLayout from './ReportPrintLayout';
import { useReportPrintPdf } from './useReportPrintPdf';
import { exportInvoiceReportExcel } from './exportInvoiceReportExcel';
import ContactQuickViewModal from '@/components/ContactQuickViewModal';
import CommentsModal from '@/components/CommentsModal';
import MarkPaidModal from '@/components/MarkPaidModal';
import NettingSettlementModal from '@/components/NettingSettlementModal';

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
  isActive: boolean;
}

type ReportType = 'trial-balance' | 'balance-sheet' | 'income-statement' | 'statement-of-account' | 'invoice-report' | 'ar-report' | 'ap-report';

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

function ContactCombobox({
  contacts,
  value,
  onChange,
}: {
  contacts: Contact[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = contacts.find((c) => c.id === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = contacts.filter((c) => {
    if (!search) return true;
    return c.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div ref={ref} className="relative">
      <div className="flex w-full cursor-pointer items-center rounded-lg border border-gray-300 text-sm outline-none focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20">
        <input
          type="text"
          placeholder={selected ? selected.name : 'All contacts...'}
          value={open ? search : selected ? selected.name : ''}
          onFocus={() => { setOpen(true); setSearch(''); }}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg bg-transparent px-3 py-2 outline-none placeholder:text-gray-400"
        />
        <ChevronDown className="mr-2 h-3.5 w-3.5 shrink-0 text-gray-400" />
      </div>
      {open && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <li
            onMouseDown={() => { onChange(''); setSearch(''); setOpen(false); }}
            className={cn('cursor-pointer px-3 py-1.5 text-sm hover:bg-primary-50 text-gray-500 italic', !value && 'bg-primary-50')}
          >
            All contacts
          </li>
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">No contacts found</li>
          ) : (
            filtered.map((c) => (
              <li
                key={c.id}
                onMouseDown={() => { onChange(c.id); setSearch(''); setOpen(false); }}
                className={cn('cursor-pointer px-3 py-1.5 text-sm hover:bg-primary-50', c.id === value && 'bg-primary-50 font-medium text-primary-700')}
              >
                {c.name}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

const AGING_LABELS: Record<string, string> = {
  current: 'Current',
  '1-30': '1–30 Days',
  '31-60': '31–60 Days',
  '61-90': '61–90 Days',
  '91+': '91+ Days',
};

const AGING_COLORS: Record<string, string> = {
  current: 'bg-green-50 ring-green-200 text-green-700',
  '1-30': 'bg-yellow-50 ring-yellow-200 text-yellow-700',
  '31-60': 'bg-orange-50 ring-orange-200 text-orange-700',
  '61-90': 'bg-red-50 ring-red-200 text-red-700',
  '91+': 'bg-red-100 ring-red-300 text-red-800',
};

const NEW_AGING_BUCKETS = [
  { key: 'current', label: 'Current',    color: 'bg-green-50 ring-green-200 text-green-800',   activeColor: 'bg-green-200 ring-green-400 text-green-900' },
  { key: '1-7',     label: '1–7 Days',   color: 'bg-yellow-50 ring-yellow-200 text-yellow-800', activeColor: 'bg-yellow-200 ring-yellow-400 text-yellow-900' },
  { key: '8-15',    label: '8–15 Days',  color: 'bg-amber-50 ring-amber-200 text-amber-800',    activeColor: 'bg-amber-200 ring-amber-400 text-amber-900' },
  { key: '16-30',   label: '16–30 Days', color: 'bg-orange-50 ring-orange-200 text-orange-800', activeColor: 'bg-orange-200 ring-orange-400 text-orange-900' },
  { key: '31-60',   label: '31–60 Days', color: 'bg-red-50 ring-red-200 text-red-800',          activeColor: 'bg-red-200 ring-red-400 text-red-900' },
  { key: '61-90',   label: '61–90 Days', color: 'bg-red-100 ring-red-300 text-red-800',         activeColor: 'bg-red-300 ring-red-500 text-red-900' },
  { key: '91+',     label: '91+ Days',   color: 'bg-red-200 ring-red-400 text-red-900',         activeColor: 'bg-red-400 ring-red-600 text-white' },
] as const;

function getNewBucket(daysOverdue: number): string {
  if (daysOverdue <= 0) return 'current';
  if (daysOverdue <= 7) return '1-7';
  if (daysOverdue <= 15) return '8-15';
  if (daysOverdue <= 30) return '16-30';
  if (daysOverdue <= 60) return '31-60';
  if (daysOverdue <= 90) return '61-90';
  return '91+';
}

const AGING_BADGE: Record<string, string> = {
  current: 'bg-green-100 text-green-700',
  '1-30': 'bg-yellow-100 text-yellow-700',
  '31-60': 'bg-orange-100 text-orange-700',
  '61-90': 'bg-red-100 text-red-700',
  '91+': 'bg-red-200 text-red-800',
};

const PENDING_NETTING_STATUSES = new Set(['OPEN', 'PENDING_AM', 'PENDING_CEO']);

const CYCLE_STATUS_LABELS: Record<string, string> = {
  OPEN:        'Open',
  PENDING_AM:  'Pending AM Approval',
  PENDING_CEO: 'Pending CEO Approval',
  APPROVED:    'Approved',
  PARTIAL:     'Partial',
  SETTLED:     'Settled',
};

const CONTACT_TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  BOTH:     { label: 'BOTH',     cls: 'bg-purple-100 text-purple-700' },
  CUSTOMER: { label: 'Customer', cls: 'bg-green-100 text-green-700'   },
  VENDOR:   { label: 'Vendor',   cls: 'bg-blue-100 text-blue-700'     },
};

function ARAPReportView({
  data,
  formatAmount,
  onRefresh,
}: {
  data: any;
  formatAmount: (v: any) => string;
  onRefresh?: () => void;
}) {
  const isAR = data.reportType === 'AR';
  const title = isAR ? 'Accounts Receivable (AR) Report' : 'Accounts Payable (AP) Report';
  const contactLabel = isAR ? 'Customer' : 'Vendor';
  const hasNettingAdjustment = Number(data.summary?.nettingAdjustment) > 0;

  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set());
  const [expandedCycles, setExpandedCycles] = useState<Set<string>>(new Set());
  const [contactModalId, setContactModalId] = useState<string | null>(null);
  const [commentsVoucher, setCommentsVoucher] = useState<{ id: string; number: string } | null>(null);
  const [markPaidVoucher, setMarkPaidVoucher] = useState<{ id: string; number: string; alreadyPaid: boolean; outstandingAmount?: string; currencyCode?: string } | null>(null);
  const [settlementCycle, setSettlementCycle] = useState<{ id: string; contactName: string; cycleLabel: string; arTotal: string; apTotal: string; currencyCode?: string } | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);

  const groupedContacts = useMemo(() => {
    const rows: any[] = data.rows ?? [];
    const map = new Map<string, any>();
    for (const row of rows) {
      const key = row.contactId || row.contactName;
      if (!map.has(key)) {
        map.set(key, {
          contactId: row.contactId,
          contactName: row.contactName,
          contactType: row.contactType ?? 'CUSTOMER',
          bankAccountLast4: null,
          totalOutstanding: 0,
          rows: [],
        });
      }
      const group = map.get(key)!;
      if (!group.bankAccountLast4 && row.bankAccountLast4) {
        group.bankAccountLast4 = row.bankAccountLast4;
      }
      group.totalOutstanding += Number(row.outstandingAmount);
      group.rows.push(row);
    }
    return Array.from(map.values()).sort((a, b) => a.contactName.localeCompare(b.contactName));
  }, [data.rows]);

  const bucketTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const row of data.rows ?? []) {
      const b = getNewBucket(Number(row.daysOverdue));
      totals[b] = (totals[b] ?? 0) + Number(row.outstandingAmount);
    }
    return totals;
  }, [data.rows]);

  const filteredGroups = useMemo(() => {
    if (!selectedBucket) return groupedContacts;
    return groupedContacts
      .map((group) => ({
        ...group,
        rows: group.rows.filter((r: any) => getNewBucket(Number(r.daysOverdue)) === selectedBucket),
      }))
      .filter((group) => group.rows.length > 0);
  }, [groupedContacts, selectedBucket]);

  const allContactIds = filteredGroups.map((g) => g.contactId);
  const areAllExpanded = allContactIds.length > 0 && allContactIds.every((id) => expandedContacts.has(id));

  const toggleContact = (contactId: string) => {
    setExpandedContacts((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) next.delete(contactId);
      else next.add(contactId);
      return next;
    });
  };

  const toggleCycle = (voucherId: string) => {
    setExpandedCycles((prev) => {
      const next = new Set(prev);
      if (next.has(voucherId)) next.delete(voucherId);
      else next.add(voucherId);
      return next;
    });
  };

  const handleExpandAll = () => setExpandedContacts(new Set(filteredGroups.map((g) => g.contactId)));
  const handleCollapseAll = () => { setExpandedContacts(new Set()); setExpandedCycles(new Set()); };

  const getFirstPayable = (group: any): { id: string; number: string; alreadyPaid: boolean; outstandingAmount?: string; currencyCode?: string } | null => {
    // For CUSTOMER/VENDOR: find first payable top-level row
    const topLevel = group.rows.find((r: any) =>
      Number(r.outstandingAmount) > 0 &&
      !r.isNettingSettlement &&
      !PENDING_NETTING_STATUSES.has(r.nettingCycleStatus),
    );
    if (topLevel) return {
      id: topLevel.voucherId,
      number: topLevel.voucherNumber,
      alreadyPaid: !!topLevel.markedPaid,
      outstandingAmount: topLevel.outstandingAmount,
      currencyCode: topLevel.currencyCode,
    };

    // For BOTH contacts: search constituent rows inside settlement rows.
    // Only pick the correct voucher type to avoid wrong-account mark-paid (SALES for AR, PURCHASE for AP).
    // No pending-status filter here — individual Mark Paid is allowed on these rows, so Mark Paid All should be too.
    const expectedType = isAR ? 'SALES' : 'PURCHASE';
    for (const row of group.rows) {
      if (!Array.isArray(row.constituentRows)) continue;
      for (const inv of row.constituentRows) {
        if (
          Number(inv.outstandingAmount) > 0 &&
          !inv.markedPaid &&
          inv.voucherType === expectedType
        ) {
          return {
            id: inv.voucherId,
            number: inv.voucherNumber,
            alreadyPaid: false,
            outstandingAmount: inv.outstandingAmount,
            currencyCode: inv.currencyCode,
          };
        }
      }
    }
    return null;
  };

  // For a settlement row: find first payable constituent of the correct type for this report
  const getSettlementPayable = (row: any) => {
    const expectedType = isAR ? 'SALES' : 'PURCHASE';
    const inv = (row.constituentRows ?? []).find((c: any) =>
      Number(c.outstandingAmount) > 0 && !c.markedPaid && c.voucherType === expectedType,
    );
    return inv ? {
      id: inv.voucherId,
      number: inv.voucherNumber,
      alreadyPaid: false,
      outstandingAmount: inv.outstandingAmount,
      currencyCode: inv.currencyCode,
    } : null;
  };

  // For a settlement row in an APPROVED/PARTIAL cycle: build the payload to open
  // the netting settlement modal (offset + cash flow).
  const buildSettlementCyclePayload = (row: any) => {
    const constituents: any[] = Array.isArray(row.constituentRows) ? row.constituentRows : [];
    let arTotal = 0;
    let apTotal = 0;
    for (const c of constituents) {
      const out = Number(c.outstandingAmount);
      if (!Number.isFinite(out) || out <= 0) continue;
      if (c.voucherType === 'SALES') arTotal += out;
      else if (c.voucherType === 'PURCHASE') apTotal += out;
    }
    const currencyCode = constituents.find((c) => c.currencyCode)?.currencyCode;
    return {
      id: row.nettingCycleId as string,
      contactName: row.contactName ?? '—',
      cycleLabel: row.voucherNumber as string,
      arTotal: arTotal.toFixed(4),
      apTotal: apTotal.toFixed(4),
      currencyCode,
    };
  };

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">
        {title}
        <span className="ml-2 text-sm font-normal text-gray-500">as of {data.asOfDate}</span>
      </h2>
      {data.filters?.showOutstandingOnly && (
        <p className="mb-4 text-xs text-gray-400">Showing outstanding balances only</p>
      )}

      {/* Aging filter cards — click to filter the table by day range */}
      <div className="mb-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {NEW_AGING_BUCKETS.map((b) => {
          const amount = bucketTotals[b.key] ?? 0;
          const isSelected = selectedBucket === b.key;
          return (
            <button
              key={b.key}
              type="button"
              onClick={() => setSelectedBucket(isSelected ? null : b.key)}
              title={isSelected ? 'Click to clear filter' : `Click to filter by ${b.label}`}
              className={cn(
                'rounded-lg p-3 ring-1 text-left transition-colors',
                isSelected ? b.activeColor : b.color,
                'hover:opacity-80',
              )}
            >
              <p className="text-xs font-semibold uppercase">{b.label}</p>
              <p className="mt-1 text-base font-bold">{formatAmount(amount)}</p>
              {isSelected && <p className="mt-0.5 text-[10px] opacity-75">Active filter ✕</p>}
            </button>
          );
        })}
      </div>
      {selectedBucket && (
        <p className="mb-4 text-xs text-primary-600">
          Showing {filteredGroups.length} {contactLabel.toLowerCase()}{filteredGroups.length !== 1 ? 's' : ''} with invoices overdue {selectedBucket === 'current' ? '(not overdue)' : selectedBucket === '91+' ? '91+ days' : `${selectedBucket} days`}
          {' — '}
          <button type="button" className="underline" onClick={() => setSelectedBucket(null)}>Clear filter</button>
        </p>
      )}

      {/* Summary totals */}
      <div className={cn('mb-6 grid gap-4', hasNettingAdjustment ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3')}>
        <div className="rounded-lg bg-gray-50 p-4 ring-1 ring-gray-200">
          <p className="text-xs font-medium uppercase text-gray-500">Total Invoiced</p>
          <p className="mt-1 text-lg font-bold text-gray-800">{formatAmount(data.summary.totalInvoiced)}</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-4 ring-1 ring-blue-200">
          <p className="text-xs font-medium uppercase text-blue-600">Total Paid</p>
          <p className="mt-1 text-lg font-bold text-blue-800">{formatAmount(data.summary.totalPaid)}</p>
        </div>
        {hasNettingAdjustment && (
          <div className="rounded-lg bg-gray-50 p-4 ring-1 ring-gray-200">
            <p className="text-xs font-medium uppercase text-gray-500">Gross Outstanding</p>
            <p className="mt-1 text-lg font-bold text-gray-700">{formatAmount(data.summary.grossOutstanding)}</p>
            <p className="mt-0.5 text-xs text-gray-400">Before netting offset</p>
          </div>
        )}
        {hasNettingAdjustment && (
          <div className="rounded-lg bg-purple-50 p-4 ring-1 ring-purple-200">
            <p className="text-xs font-medium uppercase text-purple-600">Netting Offset</p>
            <p className="mt-1 text-lg font-bold text-purple-800">−{formatAmount(data.summary.nettingAdjustment)}</p>
            <p className="mt-0.5 text-xs text-purple-400">Approved cycle offsets</p>
          </div>
        )}
        <div className={cn('rounded-lg p-4 ring-1', hasNettingAdjustment ? 'sm:col-span-1' : '', Number(data.summary.totalOutstanding) > 0 ? 'bg-red-50 ring-red-200' : 'bg-green-50 ring-green-200')}>
          <p className={cn('text-xs font-medium uppercase', Number(data.summary.totalOutstanding) > 0 ? 'text-red-600' : 'text-green-600')}>
            {hasNettingAdjustment ? 'Net Outstanding' : 'Total Outstanding'}
          </p>
          <p className={cn('mt-1 text-lg font-bold', Number(data.summary.totalOutstanding) > 0 ? 'text-red-800' : 'text-green-800')}>{formatAmount(data.summary.totalOutstanding)}</p>
        </div>
      </div>

      {/* Expand / collapse all */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {filteredGroups.length}{selectedBucket ? ` of ${groupedContacts.length}` : ''} {contactLabel}{filteredGroups.length !== 1 ? 's' : ''}
        </p>
        {filteredGroups.length > 0 && (
          <button
            type="button"
            onClick={areAllExpanded ? handleCollapseAll : handleExpandAll}
            className="text-xs font-medium text-primary-600 hover:text-primary-800"
          >
            {areAllExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        )}
      </div>

      {/* Grouped table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{contactLabel} / Invoice</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Due Date</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Invoice Amt</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Paid</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Outstanding</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Aging</th>
              <th className="px-3 py-3 text-center text-xs font-medium uppercase text-gray-500">SOA</th>
              <th className="px-3 py-3 text-center text-xs font-medium uppercase text-gray-500">Comments</th>
              <th className="px-3 py-3 text-center text-xs font-medium uppercase text-gray-500">Mark Paid</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredGroups.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-sm text-gray-400">
                  {selectedBucket ? `No records in the ${selectedBucket === 'current' ? 'current (not overdue)' : selectedBucket + ' day'} bucket.` : 'No records found for the selected filters.'}
                </td>
              </tr>
            )}
            {filteredGroups.map((group) => {
              const isExpanded = expandedContacts.has(group.contactId);
              const firstPayable = getFirstPayable(group);

              return (
                <Fragment key={group.contactId}>
                  {/* Level 1 — Contact header */}
                  <tr className="border-t-2 border-gray-200 bg-gray-100">
                    <td colSpan={10} className="px-4 py-2.5">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => toggleContact(group.contactId)}
                          className="flex items-center gap-2 font-semibold text-gray-900 hover:text-primary-700"
                        >
                          {isExpanded
                            ? <ChevronDown className="h-4 w-4 text-gray-500" />
                            : <ChevronRight className="h-4 w-4 text-gray-500" />}
                          {group.contactName}
                          {CONTACT_TYPE_BADGE[group.contactType] && (
                            <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', CONTACT_TYPE_BADGE[group.contactType].cls)}>
                              {CONTACT_TYPE_BADGE[group.contactType].label}
                            </span>
                          )}
                          {group.bankAccountLast4 && (
                            <span className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-[11px] text-gray-700">····{group.bankAccountLast4}</span>
                          )}
                        </button>
                        <span className={cn('text-sm font-semibold', Number(group.totalOutstanding) > 0 ? 'text-red-700' : 'text-green-600')}>
                          {formatAmount(group.totalOutstanding)}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Level 2 — detail rows */}
                  {isExpanded && group.rows.map((row: any, rowIdx: number) => {
                    const isSettlement = row.isNettingSettlement === true;
                    const isPendingCycle = isSettlement && PENDING_NETTING_STATUSES.has(row.nettingCycleStatus);
                    const isPendingNetting = !isSettlement && row.nettingCycleId && PENDING_NETTING_STATUSES.has(row.nettingCycleStatus);
                    const isCycleExpanded = isSettlement && expandedCycles.has(row.voucherId);
                    const hasConstituents = isSettlement && Array.isArray(row.constituentRows) && row.constituentRows.length > 0;
                    const settlementPayable = isSettlement ? getSettlementPayable(row) : null;

                    return (
                      <Fragment key={`row-${row.voucherId}-${rowIdx}`}>
                        <tr className={cn(isSettlement ? 'bg-purple-50 hover:bg-purple-100' : 'bg-white hover:bg-gray-50')}>
                          {/* Identifier column */}
                          <td className="px-4 py-2">
                            <div className={cn('flex items-center gap-1.5', isSettlement ? 'pl-6' : 'pl-6')}>
                              {isSettlement ? (
                                <>
                                  {hasConstituents ? (
                                    <button
                                      type="button"
                                      onClick={() => toggleCycle(row.voucherId)}
                                      className="shrink-0 text-purple-500 hover:text-purple-800"
                                    >
                                      {isCycleExpanded
                                        ? <ChevronDown className="h-3.5 w-3.5" />
                                        : <ChevronRight className="h-3.5 w-3.5" />}
                                    </button>
                                  ) : (
                                    <span className="w-3.5 shrink-0" />
                                  )}
                                  <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs font-semibold text-purple-700">NET</span>
                                  <span className="font-medium text-purple-700">Netting Settlement</span>
                                  {isPendingCycle && (
                                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                                      {CYCLE_STATUS_LABELS[row.nettingCycleStatus] ?? row.nettingCycleStatus}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <Link
                                    href={`/dashboard/vouchers/${row.voucherId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-primary-700 hover:underline"
                                  >
                                    {row.voucherNumber}
                                    <ExternalLink className="h-3 w-3 opacity-60" />
                                  </Link>
                                  {isPendingNetting && (
                                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">Pending Netting</span>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-gray-500">{row.date}</td>
                          <td className="whitespace-nowrap px-4 py-2 text-gray-500">{row.dueDate ?? '—'}</td>
                          <td className="whitespace-nowrap px-4 py-2 text-right text-gray-900">{formatAmount(row.totalAmount)}</td>
                          <td className="whitespace-nowrap px-4 py-2 text-right text-blue-700">{formatAmount(row.paidAmount)}</td>
                          <td className="whitespace-nowrap px-4 py-2 text-right font-semibold">
                            <span className={Number(row.outstandingAmount) > 0 ? 'text-red-700' : 'text-green-600'}>
                              {formatAmount(row.outstandingAmount)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2">
                            <span className={cn('rounded px-2 py-0.5 text-xs font-medium', AGING_BADGE[row.agingBucket])}>
                              {AGING_LABELS[row.agingBucket]}
                              {row.daysOverdue > 0 && <span className="ml-1 opacity-75">({row.daysOverdue}d)</span>}
                            </span>
                          </td>
                          {/* SOA */}
                          <td className="whitespace-nowrap px-3 py-2 text-center">
                            {!isSettlement && row.contactId ? (
                              <Link href={`/dashboard/contacts/${row.contactId}/statement`} target="_blank" rel="noopener noreferrer"
                                className="inline-flex rounded-lg p-1.5 text-gray-500 hover:bg-primary-50 hover:text-primary-700"
                                title="View Statement of Account"
                              >
                                <FileText className="h-4 w-4" />
                              </Link>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          {/* Comments */}
                          <td className="whitespace-nowrap px-3 py-2 text-center">
                            {!isSettlement ? (
                              <button type="button"
                                onClick={() => setCommentsVoucher({ id: row.voucherId, number: row.voucherNumber })}
                                className="relative inline-flex rounded-lg p-1.5 text-gray-500 hover:bg-primary-50 hover:text-primary-700"
                                title="View / add comments"
                              >
                                <MessageSquare className="h-4 w-4" />
                                {row.commentCount > 0 && (
                                  <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-semibold leading-none text-white">
                                    {row.commentCount}
                                  </span>
                                )}
                              </button>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          {/* Mark Paid */}
                          <td className="whitespace-nowrap px-3 py-2 text-center">
                            {isSettlement ? (
                              settlementPayable ? (
                                <button type="button"
                                  onClick={() => {
                                    // Always open the Settle Netting Cycle modal on synthetic rows so the user
                                    // sees the net AR/AP regardless of approval state. The modal itself shows a
                                    // warning and disables submit until the cycle is APPROVED or PARTIAL.
                                    setSettlementCycle(buildSettlementCyclePayload(row));
                                  }}
                                  className="inline-flex rounded-lg p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-700"
                                  title="Settle this netting cycle (offset AR/AP and pay the net)"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </button>
                              ) : (
                                <button type="button" disabled title="All invoices in this cycle are fully paid"
                                  className="inline-flex cursor-not-allowed rounded-lg p-1.5 text-green-500"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </button>
                              )
                            ) : (
                              <button type="button"
                                onClick={() => setMarkPaidVoucher({ id: row.voucherId, number: row.voucherNumber, alreadyPaid: !!row.markedPaid, outstandingAmount: row.outstandingAmount, currencyCode: row.currencyCode })}
                                className={cn('inline-flex rounded-lg p-1.5 hover:bg-green-50', row.markedPaid ? 'text-green-600' : 'text-gray-400 hover:text-green-700')}
                                title={row.markedPaid ? 'Fully paid' : 'Mark as paid'}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Level 3 — constituent invoice rows */}
                        {isCycleExpanded && row.constituentRows?.map((inv: any, invIdx: number) => (
                          <tr key={`inv-${inv.voucherId}-${invIdx}`} className="bg-purple-50/50 hover:bg-purple-50">
                            <td className="px-4 py-1.5">
                              <div className="flex items-center gap-1.5 pl-14">
                                <Link href={`/dashboard/vouchers/${inv.voucherId}`} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-mono text-xs text-primary-700 hover:underline"
                                >
                                  {inv.voucherNumber}
                                  <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                                </Link>
                                {inv.voucherType === 'SALES'
                                  ? <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">SALES</span>
                                  : <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">PURCHASE</span>}
                                <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-600">In Cycle</span>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 py-1.5 text-xs text-gray-500">{inv.date}</td>
                            <td className="whitespace-nowrap px-4 py-1.5 text-xs text-gray-500">{inv.dueDate ?? '—'}</td>
                            <td className="whitespace-nowrap px-4 py-1.5 text-right text-xs text-gray-900">{formatAmount(inv.totalAmount)}</td>
                            <td className="whitespace-nowrap px-4 py-1.5 text-right text-xs text-blue-700">{formatAmount(inv.paidAmount)}</td>
                            <td className="whitespace-nowrap px-4 py-1.5 text-right text-xs font-semibold">
                              <span className={Number(inv.outstandingAmount) > 0 ? 'text-red-700' : 'text-green-600'}>
                                {formatAmount(inv.outstandingAmount)}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-1.5">
                              <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', AGING_BADGE[inv.agingBucket])}>
                                {AGING_LABELS[inv.agingBucket]}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-1.5 text-center">
                              {inv.contactId ? (
                                <Link href={`/dashboard/contacts/${inv.contactId}/statement`} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex rounded-lg p-1 text-gray-400 hover:bg-primary-50 hover:text-primary-700"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                </Link>
                              ) : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="whitespace-nowrap px-3 py-1.5 text-center">
                              <button type="button"
                                onClick={() => setCommentsVoucher({ id: inv.voucherId, number: inv.voucherNumber })}
                                className="relative inline-flex rounded-lg p-1 text-gray-400 hover:bg-primary-50 hover:text-primary-700"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                                {inv.commentCount > 0 && (
                                  <span className="absolute -top-1 -right-1 inline-flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-primary-600 px-1 text-[9px] font-semibold leading-none text-white">
                                    {inv.commentCount}
                                  </span>
                                )}
                              </button>
                            </td>
                            <td className="whitespace-nowrap px-3 py-1.5 text-center">
                              {(() => {
                                const wrongType = isAR ? inv.voucherType === 'PURCHASE' : inv.voucherType === 'SALES';
                                const wrongTypeTitle = isAR
                                  ? 'This is a payable — mark paid from the AP report'
                                  : 'This is a receivable — mark paid from the AR report';
                                return wrongType ? (
                                  <button type="button" disabled title={wrongTypeTitle}
                                    className="inline-flex cursor-not-allowed rounded-lg p-1 text-gray-300"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  </button>
                                ) : (
                                  <button type="button"
                                    onClick={() => setMarkPaidVoucher({ id: inv.voucherId, number: inv.voucherNumber, alreadyPaid: !!inv.markedPaid, outstandingAmount: inv.outstandingAmount, currencyCode: inv.currencyCode })}
                                    className={cn('inline-flex rounded-lg p-1 hover:bg-green-50', inv.markedPaid ? 'text-green-600' : 'text-gray-400 hover:text-green-700')}
                                    title={inv.markedPaid ? 'Fully paid' : 'Mark as paid'}
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  </button>
                                );
                              })()}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}

                  {/* Contact footer — visible when expanded */}
                  {isExpanded && (
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <td colSpan={10} className="px-4 py-2">
                        <div className="flex items-center justify-between pl-6">
                          <span className="text-xs font-medium text-gray-500">Total — {group.contactName}</span>
                          <div className="flex items-center gap-4">
                            <span className={cn('text-sm font-semibold', Number(group.totalOutstanding) > 0 ? 'text-red-700' : 'text-green-600')}>
                              {formatAmount(group.totalOutstanding)}
                            </span>
                            {firstPayable && (
                              <button
                                type="button"
                                onClick={() => setMarkPaidVoucher(firstPayable)}
                                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Mark Paid All
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <ContactQuickViewModal
        open={contactModalId != null}
        contactId={contactModalId}
        onClose={() => setContactModalId(null)}
      />

      <CommentsModal
        open={commentsVoucher != null}
        voucherId={commentsVoucher?.id ?? null}
        voucherNumber={commentsVoucher?.number}
        onClose={() => setCommentsVoucher(null)}
        onCommentAdded={() => onRefresh?.()}
      />

      <MarkPaidModal
        open={markPaidVoucher != null}
        voucherId={markPaidVoucher?.id ?? null}
        voucherNumber={markPaidVoucher?.number}
        alreadyPaid={markPaidVoucher?.alreadyPaid}
        outstandingAmount={markPaidVoucher?.outstandingAmount}
        currencyCode={markPaidVoucher?.currencyCode}
        onClose={() => setMarkPaidVoucher(null)}
        onSuccess={() => onRefresh?.()}
      />

      <NettingSettlementModal
        open={settlementCycle != null}
        cycleId={settlementCycle?.id ?? null}
        contactName={settlementCycle?.contactName}
        cycleLabel={settlementCycle?.cycleLabel}
        arTotal={settlementCycle?.arTotal}
        apTotal={settlementCycle?.apTotal}
        currencyCode={settlementCycle?.currencyCode}
        onClose={() => setSettlementCycle(null)}
        onSuccess={() => onRefresh?.()}
      />
    </div>
  );
}

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const tenant = useAuthStore((s) => s.tenant);
  const baseCurrency = tenant?.baseCurrency ?? 'USD';
  const [activeReport, setActiveReport] = useState<ReportType>('trial-balance');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    fromDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
  });
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [invoiceFilters, setInvoiceFilters] = useState({
    type: '',
    contactId: '',
    periodStart: '',
    periodEnd: '',
  });
  const [arApFilters, setArApFilters] = useState({
    contactId: '',
    showOutstandingOnly: true,
    includeNettingAdjustments: true,
  });
  const reports = [
    { id: 'trial-balance' as const, name: 'Trial Balance' },
    { id: 'balance-sheet' as const, name: 'Balance Sheet' },
    { id: 'income-statement' as const, name: 'Income Statement' },
    { id: 'statement-of-account' as const, name: 'Statement of Account' },
    { id: 'invoice-report' as const, name: 'Invoice Report' },
    { id: 'ar-report' as const, name: 'AR Report' },
    { id: 'ap-report' as const, name: 'AP Report' },
  ];

  const { printRef, handlePrint, handleExportPdf, isExporting } = useReportPrintPdf(activeReport);
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  useEffect(() => {
    const report = searchParams.get('report') as ReportType | null;
    if (report && reports.some((r) => r.id === report)) {
      setActiveReport(report);
      setReportData(null);
      setSelectedAccountId('');
      setInvoiceFilters({ type: '', contactId: '', periodStart: '', periodEnd: '' });
      setArApFilters({ contactId: '', showOutstandingOnly: true, includeNettingAdjustments: true });
    }
  }, [searchParams]);

  useEffect(() => {
    const loadAccounts = async () => {
      setAccountsLoading(true);
      try {
        const data = await api.get<Account[] | { data: Account[] }>('/accounts', { isActive: true });
        const list = Array.isArray(data) ? data : data.data || [];
        setAccounts(list.filter((a) => a.isActive));
      } catch (err) {
        console.error('Failed to load accounts:', err);
      }
      setAccountsLoading(false);
    };
    const loadContacts = async () => {
      try {
        const data = await api.get<Contact[] | { data: Contact[] }>('/contacts', { isActive: true });
        const list = Array.isArray(data) ? data : (data as any).data || [];
        setContacts(list.filter((c: Contact) => c.isActive));
      } catch (err) {
        console.error('Failed to load contacts:', err);
      }
    };
    loadAccounts();
    loadContacts();
  }, []);

  const generateReport = async (arApOverride?: Partial<typeof arApFilters>) => {
    setLoading(true);
    setReportData(null);
    setError(null);
    try {
      let data;
      switch (activeReport) {
        case 'trial-balance':
          data = await api.get('/reports/trial-balance', { asOfDate: dateRange.toDate });
          break;
        case 'balance-sheet':
          data = await api.get('/reports/balance-sheet', { asOfDate: dateRange.toDate });
          break;
        case 'income-statement':
          data = await api.get('/reports/income-statement', {
            fromDate: dateRange.fromDate,
            toDate: dateRange.toDate,
          });
          break;
        case 'statement-of-account':
          data = await api.get(`/reports/statement-of-account/${selectedAccountId}`, {
            fromDate: dateRange.fromDate,
            toDate: dateRange.toDate,
          });
          break;
        case 'invoice-report': {
          const params: Record<string, string> = {
            dateFrom: dateRange.fromDate,
            dateTo: dateRange.toDate,
          };
          if (invoiceFilters.type) params.type = invoiceFilters.type;
          if (invoiceFilters.contactId) params.contactId = invoiceFilters.contactId;
          if (invoiceFilters.periodStart) params.periodStart = invoiceFilters.periodStart;
          if (invoiceFilters.periodEnd) params.periodEnd = invoiceFilters.periodEnd;
          data = await api.get('/reports/invoices', params);
          break;
        }
        case 'ar-report': {
          const f = { ...arApFilters, ...arApOverride };
          const params: Record<string, string> = { asOfDate: dateRange.toDate };
          if (f.contactId) params.contactId = f.contactId;
          params.showOutstandingOnly = String(f.showOutstandingOnly);
          params.includeNettingAdjustments = String(f.includeNettingAdjustments);
          data = await api.get('/reports/ar', params);
          break;
        }
        case 'ap-report': {
          const f = { ...arApFilters, ...arApOverride };
          const params: Record<string, string> = { asOfDate: dateRange.toDate };
          if (f.contactId) params.contactId = f.contactId;
          params.showOutstandingOnly = String(f.showOutstandingOnly);
          params.includeNettingAdjustments = String(f.includeNettingAdjustments);
          data = await api.get('/reports/ap', params);
          break;
        }
      }
      setReportData(data);
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      const message =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        'Failed to generate report. Please check your filters and try again.';
      setError(Array.isArray(message) ? message.join(', ') : String(message));
    }
    setLoading(false);
  };

  const formatAmount = (amount: number | string) => formatCurrency(amount, baseCurrency);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
        <p className="mt-1 text-sm text-gray-600">Generate and view financial reports</p>
      </div>

      {/* Report selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        {reports.map((r) => (
          <button
            key={r.id}
            onClick={() => { setActiveReport(r.id); setReportData(null); setError(null); setSelectedAccountId(''); setInvoiceFilters({ type: '', contactId: '', periodStart: '', periodEnd: '' }); setArApFilters({ contactId: '', showOutstandingOnly: true, includeNettingAdjustments: true }); }}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium',
              activeReport === r.id
                ? 'bg-primary-100 text-primary-700'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50',
            )}
          >
            {r.name}
          </button>
        ))}
      </div>

      {/* Date filters */}
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        {activeReport === 'statement-of-account' && (
          <div className="w-64">
            <label className="mb-1 block text-sm font-medium text-gray-700">Account</label>
            <AccountCombobox
              accounts={accounts}
              value={selectedAccountId}
              onChange={setSelectedAccountId}
            />
          </div>
        )}
        {activeReport === 'invoice-report' && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
                {[{ label: 'All', value: '' }, { label: 'Sales', value: 'SALES' }, { label: 'Purchases', value: 'PURCHASE' }].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setInvoiceFilters((p) => ({ ...p, type: opt.value }))}
                    className={cn(
                      'px-3 py-2 font-medium',
                      invoiceFilters.type === opt.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-52">
              <label className="mb-1 block text-sm font-medium text-gray-700">Contact</label>
              <ContactCombobox
                contacts={contacts}
                value={invoiceFilters.contactId}
                onChange={(id) => setInvoiceFilters((p) => ({ ...p, contactId: id }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Period Start</label>
              <input
                type="date"
                value={invoiceFilters.periodStart}
                onChange={(e) => setInvoiceFilters((p) => ({ ...p, periodStart: e.target.value }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Period End</label>
              <input
                type="date"
                value={invoiceFilters.periodEnd}
                onChange={(e) => setInvoiceFilters((p) => ({ ...p, periodEnd: e.target.value }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </>
        )}
        {(activeReport === 'ar-report' || activeReport === 'ap-report') && (
          <>
            <div className="w-52">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {activeReport === 'ar-report' ? 'Customer' : 'Vendor'}
              </label>
              <ContactCombobox
                contacts={contacts.filter((c) =>
                  activeReport === 'ar-report'
                    ? c.type === 'CUSTOMER' || c.type === 'BOTH'
                    : c.type === 'VENDOR' || c.type === 'BOTH',
                )}
                value={arApFilters.contactId}
                onChange={(id) => setArApFilters((p) => ({ ...p, contactId: id }))}
              />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={arApFilters.showOutstandingOnly}
                  onChange={(e) => setArApFilters((p) => ({ ...p, showOutstandingOnly: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600"
                />
                Outstanding only
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={arApFilters.includeNettingAdjustments}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setArApFilters((p) => ({ ...p, includeNettingAdjustments: val }));
                    if (reportData) generateReport({ includeNettingAdjustments: val });
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600"
                />
                Netting-adjusted view
              </label>
            </div>
          </>
        )}
        {activeReport !== 'trial-balance' && activeReport !== 'ar-report' && activeReport !== 'ap-report' && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">From Date</label>
            <input
              type="date"
              value={dateRange.fromDate}
              onChange={(e) => setDateRange((p) => ({ ...p, fromDate: e.target.value }))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {activeReport === 'trial-balance' || activeReport === 'ar-report' || activeReport === 'ap-report'
              ? 'As of Date'
              : 'To Date'}
          </label>
          <input
            type="date"
            value={dateRange.toDate}
            onChange={(e) => setDateRange((p) => ({ ...p, toDate: e.target.value }))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={() => generateReport()}
          disabled={loading || (activeReport === 'statement-of-account' && !selectedAccountId)}
          className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {/* Report output */}
      {reportData && (
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          {/* Print / Export buttons */}
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            {activeReport === 'invoice-report' && (
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  exportInvoiceReportExcel(reportData, `Invoice_Report_${today}.xlsx`);
                }}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export Excel
              </button>
            )}
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
          </div>

          {activeReport === 'trial-balance' && reportData.rows && (
            <div>
              <h2 className="mb-4 text-lg font-semibold">
                Trial Balance
                <span className="ml-2 text-sm font-normal text-gray-500">as of {reportData.asOfDate}</span>
              </h2>
              <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Account</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Debit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportData.rows.map((row: any, i: number) => (
                    <tr key={i}>
                      <td className="px-4 py-2 text-sm font-mono text-gray-500">{row.accountCode}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{row.accountName}</td>
                      <td className="px-4 py-2 text-right text-sm text-gray-900">
                        {Number(row.debit) > 0 ? formatAmount(row.debit) : ''}
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-gray-900">
                        {Number(row.credit) > 0 ? formatAmount(row.credit) : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-sm">Total</td>
                    <td className="px-4 py-3 text-right text-sm">{formatAmount(reportData.totalDebit)}</td>
                    <td className="px-4 py-3 text-right text-sm">{formatAmount(reportData.totalCredit)}</td>
                  </tr>
                </tfoot>
              </table>
              </div>
            </div>
          )}

          {activeReport === 'balance-sheet' && (
            <div>
              <h2 className="mb-4 text-lg font-semibold">
                Balance Sheet
                <span className="ml-2 text-sm font-normal text-gray-500">as of {reportData.asOfDate}</span>
              </h2>
              {(['assets', 'liabilities', 'equity'] as const).map((section) => (
                <div key={section} className="mb-6">
                  <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">
                    {reportData[section]?.title || section}
                  </h3>
                  {reportData[section]?.rows?.map((row: any, i: number) => (
                    <div key={i} className="flex justify-between border-b border-gray-100 px-4 py-2 text-sm">
                      <span className="text-gray-700">
                        <span className="mr-2 font-mono text-gray-400">{row.accountCode}</span>
                        {row.accountName}
                      </span>
                      <span className="font-medium text-gray-900">
                        {Number(row.debit) > 0 ? formatAmount(row.debit) : formatAmount(row.credit)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between bg-gray-50 px-4 py-2 text-sm font-semibold">
                    <span>Total {reportData[section]?.title || section}</span>
                    <span>{formatAmount(reportData[section]?.total || 0)}</span>
                  </div>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t-2 border-gray-300 bg-gray-50 px-4 py-3 text-sm font-bold">
                <span>Total Liabilities & Equity</span>
                <span>{formatAmount(reportData.totalLiabilitiesAndEquity || 0)}</span>
              </div>
            </div>
          )}

          {activeReport === 'income-statement' && (
            <div>
              <h2 className="mb-4 text-lg font-semibold">
                Income Statement
                <span className="ml-2 text-sm font-normal text-gray-500">
                  {reportData.periodStart} to {reportData.periodEnd}
                </span>
              </h2>
              {[
                { key: 'revenue', data: reportData.revenue },
                { key: 'cogs', data: reportData.costOfGoodsSold },
                { key: 'expenses', data: reportData.expenses },
              ]
                .filter((s) => s.data)
                .map((section) => (
                  <div key={section.key} className="mb-4">
                    <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">{section.data.title}</h3>
                    {section.data.rows?.map((row: any, j: number) => (
                      <div key={j} className="flex justify-between border-b border-gray-100 px-4 py-2 text-sm">
                        <span className="text-gray-700">
                          <span className="mr-2 font-mono text-gray-400">{row.accountCode}</span>
                          {row.accountName}
                        </span>
                        <span className="font-medium text-gray-900">
                          {Number(row.debit) > 0 ? formatAmount(row.debit) : formatAmount(row.credit)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between bg-gray-50 px-4 py-2 text-sm font-semibold">
                      <span>Total {section.data.title}</span>
                      <span>{formatAmount(section.data.total)}</span>
                    </div>
                  </div>
                ))}
              {reportData.grossProfit !== undefined && (
                <div className="mb-4 flex justify-between border-t border-gray-200 px-4 py-2 text-sm font-semibold">
                  <span>Gross Profit</span>
                  <span>{formatAmount(reportData.grossProfit)}</span>
                </div>
              )}
              {reportData.netIncome !== undefined && (
                <div className="mt-2 flex justify-between border-t-2 border-gray-300 bg-gray-50 px-4 py-3 text-sm font-bold">
                  <span>Net Income</span>
                  <span className={Number(reportData.netIncome) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatAmount(reportData.netIncome)}
                  </span>
                </div>
              )}
            </div>
          )}

          {activeReport === 'statement-of-account' && (
            <div>
              <h2 className="mb-4 text-lg font-semibold">
                Statement of Account
                <span className="ml-2 text-sm font-normal text-gray-500">
                  <span className="font-mono">{reportData.accountCode}</span> — {reportData.accountName}
                </span>
              </h2>
              <p className="mb-4 text-sm text-gray-500">
                {reportData.periodStart} to {reportData.periodEnd}
              </p>
              <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Voucher #</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Narration</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Debit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Credit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Opening Balance */}
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-700">
                      Opening Balance
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-gray-900" />
                    <td className="px-4 py-2 text-right text-sm text-gray-900" />
                    <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                      {formatAmount(reportData.openingBalance)}
                    </td>
                  </tr>
                  {/* Transaction lines */}
                  {reportData.lines?.map((line: any, i: number) => (
                    <tr key={i}>
                      <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">{line.date}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-sm font-mono text-gray-500">
                        {line.voucherNumber}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{line.narration}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-sm text-gray-900">
                        {Number(line.debit) > 0 ? formatAmount(line.debit) : ''}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-sm text-gray-900">
                        {Number(line.credit) > 0 ? formatAmount(line.credit) : ''}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right text-sm text-gray-900">
                        {formatAmount(line.runningBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm">Closing Balance</td>
                    <td className="px-4 py-3 text-right text-sm">{formatAmount(reportData.totalDebit)}</td>
                    <td className="px-4 py-3 text-right text-sm">{formatAmount(reportData.totalCredit)}</td>
                    <td className="px-4 py-3 text-right text-sm">
                      <div>
                        {formatAmount(reportData.closingBalance)}
                        {reportData.closingBalanceNature && (
                          <span className={`ml-2 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${reportData.closingBalanceNature === 'Receivable' ? 'text-green-700 bg-green-50 ring-green-600/20' : reportData.closingBalanceNature === 'Payable' ? 'text-red-700 bg-red-50 ring-red-600/20' : 'text-gray-500 bg-gray-50 ring-gray-500/20'}`}>
                            {reportData.closingBalanceNature}
                          </span>
                        )}
                      </div>
                      {reportData.closingDueDate && (
                        <div className="mt-1 text-xs font-normal text-gray-500">
                          Due: {reportData.closingDueDate}
                        </div>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
              </div>
            </div>
          )}

          {(activeReport === 'ar-report' || activeReport === 'ap-report') && reportData && (
            <ARAPReportView data={reportData} formatAmount={formatAmount} onRefresh={generateReport} />
          )}

          {activeReport === 'invoice-report' && (
            <div>
              <h2 className="mb-4 text-lg font-semibold">
                Invoice Report
                <span className="ml-2 text-sm font-normal text-gray-500">
                  {reportData.filters?.dateFrom} to {reportData.filters?.dateTo}
                </span>
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Voucher #</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Reference</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Narration</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Period</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reportData.rows?.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-6 text-center text-sm text-gray-400">
                          No invoices found for the selected filters.
                        </td>
                      </tr>
                    )}
                    {reportData.rows?.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-2 text-gray-500">{row.date}</td>
                        <td className="whitespace-nowrap px-4 py-2 font-mono text-gray-500">{row.voucherNumber}</td>
                        <td className="whitespace-nowrap px-4 py-2">
                          <span className={cn(
                            'rounded px-2 py-0.5 text-xs font-medium',
                            row.voucherType === 'SALES' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700',
                          )}>
                            {row.voucherType}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-900">{row.contactName ?? '—'}</td>
                        <td className="px-4 py-2 text-gray-500">{row.reference ?? '—'}</td>
                        <td className="px-4 py-2 text-gray-900">{row.narration}</td>
                        <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500">
                          {row.periodStart && row.periodEnd
                            ? `${row.periodStart} — ${row.periodEnd}`
                            : row.periodStart ?? row.periodEnd ?? '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-right font-medium text-gray-900">
                          {formatAmount(row.totalAmount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-500">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary footer */}
              {reportData.summary && (
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-green-50 p-4 ring-1 ring-green-200">
                    <p className="text-xs font-medium uppercase text-green-600">Total Sales</p>
                    <p className="mt-1 text-lg font-bold text-green-800">{formatAmount(reportData.summary.totalSales)}</p>
                    <p className="text-xs text-green-600">{reportData.summary.totalSalesCount} invoices</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-4 ring-1 ring-blue-200">
                    <p className="text-xs font-medium uppercase text-blue-600">Total Purchases</p>
                    <p className="mt-1 text-lg font-bold text-blue-800">{formatAmount(reportData.summary.totalPurchases)}</p>
                    <p className="text-xs text-blue-600">{reportData.summary.totalPurchasesCount} invoices</p>
                  </div>
                  <div className={cn(
                    'rounded-lg p-4 ring-1',
                    Number(reportData.summary.netBalance) >= 0
                      ? 'bg-gray-50 ring-gray-200'
                      : 'bg-red-50 ring-red-200',
                  )}>
                    <p className="text-xs font-medium uppercase text-gray-600">Net Balance</p>
                    <p className={cn(
                      'mt-1 text-lg font-bold',
                      Number(reportData.summary.netBalance) >= 0 ? 'text-gray-800' : 'text-red-700',
                    )}>
                      {formatAmount(reportData.summary.netBalance)}
                    </p>
                    <p className="text-xs text-gray-500">Sales minus Purchases</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!reportData && !loading && !error && (
        <div className="flex flex-col items-center justify-center rounded-xl bg-white p-12 shadow-sm ring-1 ring-gray-200">
          <BarChart3 className="mb-4 h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-500">Select a report and date range, then click Generate</p>
        </div>
      )}

      {/* Off-screen print layout */}
      {reportData && (
        <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
          <ReportPrintLayout
            ref={printRef}
            reportType={activeReport}
            reportData={reportData}
            companyName={tenant?.name || 'Company'}
            baseCurrency={baseCurrency}
            dateRange={dateRange}
            selectedAccount={selectedAccount ? { code: selectedAccount.code, name: selectedAccount.name } : null}
          />
        </div>
      )}
    </div>
  );
}
