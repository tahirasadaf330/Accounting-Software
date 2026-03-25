'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, User, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Contact {
  id: string;
  name: string;
  type: string;
  accountId: string | null;
  accountCode: string | null;
  accountName: string | null;
  isActive: boolean;
}

interface ContactSelectorProps {
  contacts: Contact[];
  value: string;
  onChange: (contactId: string) => void;
  filterTypes: string[];
  placeholder?: string;
  hasError?: boolean;
  disabled?: boolean;
}

const typeBadgeColors: Record<string, string> = {
  CUSTOMER: 'bg-blue-100 text-blue-700',
  VENDOR: 'bg-orange-100 text-orange-700',
  BOTH: 'bg-purple-100 text-purple-700',
};

export default function ContactSelector({
  contacts,
  value,
  onChange,
  filterTypes,
  placeholder = 'Search contact...',
  hasError = false,
  disabled = false,
}: ContactSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selected = contacts.find((c) => c.id === value);

  const filtered = contacts
    .filter((c) => filterTypes.includes(c.type) && c.isActive)
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.accountCode?.toLowerCase().includes(q) ||
        c.accountName?.toLowerCase().includes(q)
      );
    });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (contactId: string) => {
    onChange(contactId);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm outline-none transition-colors',
          hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
            : 'border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
          disabled && 'cursor-not-allowed bg-gray-100 opacity-60',
        )}
      >
        {selected ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <User className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="truncate font-medium text-gray-900">{selected.name}</span>
            <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', typeBadgeColors[selected.type])}>
              {selected.type}
            </span>
            {selected.accountCode && (
              <span className="truncate text-gray-500">({selected.accountCode})</span>
            )}
          </div>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <div className="flex items-center gap-1">
          {selected && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or account..."
                className="w-full rounded-md border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No contacts found
              </div>
            ) : (
              filtered.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onMouseDown={() => handleSelect(contact.id)}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50',
                    value === contact.id && 'bg-primary-50',
                  )}
                >
                  <User className="h-4 w-4 shrink-0 text-gray-400" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-gray-900">{contact.name}</span>
                      <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-xs font-medium', typeBadgeColors[contact.type])}>
                        {contact.type}
                      </span>
                    </div>
                    {contact.accountId ? (
                      <p className="truncate text-xs text-gray-500">
                        Account: {contact.accountCode} — {contact.accountName}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600">No trade account linked</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
