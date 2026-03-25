'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DollarSign } from 'lucide-react';

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isActive: boolean;
}

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    try {
      const data = await api.get<any>('/currencies');
      setCurrencies(data.data || data || []);
    } catch (err) {
      console.error('Failed to load currencies:', err);
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Currencies</h1>
        <p className="mt-1 text-sm text-gray-600">View supported currencies and exchange rates</p>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Symbol</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Decimals</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currencies.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900">{c.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{c.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{c.symbol}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{c.decimalPlaces}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={c.isActive ? 'text-green-600' : 'text-gray-400'}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
