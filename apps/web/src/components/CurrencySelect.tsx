'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  isActive: boolean;
}

interface Props {
  value: string;
  onChange: (code: string) => void;
  id?: string;
  hasError?: boolean;
  disabled?: boolean;
  className?: string;
  includeBlank?: boolean;
}

export default function CurrencySelect({
  value,
  onChange,
  id,
  hasError,
  disabled,
  className,
  includeBlank,
}: Props) {
  const ALLOWED_CURRENCIES = ['USD', 'EUR', 'GBP'];
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<Currency[] | { data: Currency[] }>('/currencies');
        const list = Array.isArray(data) ? data : data.data || [];
        if (!cancelled) setCurrencies(list.filter((c) => c.isActive && ALLOWED_CURRENCIES.includes(c.code)));
      } catch {
        if (!cancelled) setCurrencies([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || loading}
      className={cn(
        'w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:bg-gray-50 disabled:text-gray-500',
        hasError ? 'border-red-300' : 'border-gray-300',
        className,
      )}
    >
      {includeBlank && <option value="">Select currency</option>}
      {currencies.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code} — {c.name}
        </option>
      ))}
    </select>
  );
}
