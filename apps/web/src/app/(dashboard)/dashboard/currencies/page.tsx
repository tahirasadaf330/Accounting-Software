'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Pagination } from '@/components/Pagination';
import { useDebounced } from '@/lib/useDebounced';
import { Search } from 'lucide-react';

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isActive: boolean;
}

interface CurrenciesResponse {
  data: Currency[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const debouncedSearch = useDebounced(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const loadCurrencies = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: pageSize };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const data = await api.get<CurrenciesResponse>('/currencies', params);
      setCurrencies(data.data ?? []);
      setTotal(data.meta?.total ?? data.data?.length ?? 0);
    } catch (err) {
      console.error('Failed to load currencies:', err);
      setCurrencies([]);
      setTotal(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCurrencies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, page, pageSize]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Currencies</h1>
        <p className="mt-1 text-sm text-gray-600">View supported currencies and exchange rates</p>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
            </div>
          ) : currencies.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
              <p className="text-sm">No currencies found</p>
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
        {!loading && total > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>
    </div>
  );
}
