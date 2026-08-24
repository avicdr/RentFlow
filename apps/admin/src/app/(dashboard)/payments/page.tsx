'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Search, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import apiClient from '@/lib/api-client';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  PAID: { color: 'bg-emerald-900/50 text-emerald-400', label: 'Paid' },
  PENDING: { color: 'bg-yellow-900/50 text-yellow-400', label: 'Pending' },
  PAYMENT_SUBMITTED: { color: 'bg-blue-900/50 text-blue-400', label: 'Submitted' },
  UNDER_REVIEW: { color: 'bg-orange-900/50 text-orange-400', label: 'Under Review' },
  REJECTED: { color: 'bg-red-900/50 text-red-400', label: 'Rejected' },
};

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: () => apiClient.get('/api/v1/payments').then(r => r.data.data),
  });

  const payments: any[] = data ?? [];
  const filtered = payments.filter((p: any) => {
    const matchSearch = `${p.tenantId?.userId?.firstName} ${p.tenantId?.userId?.email} ${p.submission?.utrNumber}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">All Payments</h1>
        <p className="text-gray-400 text-sm mt-1">Platform-wide payment records</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by tenant, UTR..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="PAYMENT_SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="PAID">Paid</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 border-b border-gray-700">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-400">Tenant</th>
              <th className="text-left px-4 py-3 font-medium text-gray-400 hidden md:table-cell">Period</th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-gray-400 hidden lg:table-cell">UTR</th>
              <th className="text-left px-4 py-3 font-medium text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td></tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-600">No payments found</td></tr>
            ) : (
              filtered.map((p: any) => {
                const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.PENDING;
                return (
                  <tr key={p._id} className="hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{p.tenantId?.userId?.firstName} {p.tenantId?.userId?.lastName}</p>
                      <p className="text-xs text-gray-500">{p.propertyId?.name}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-300">{p.month}/{p.year}</td>
                    <td className="px-4 py-3 font-medium text-white">₹{(p.amount ?? 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-400 font-mono text-xs">{p.submission?.utrNumber ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
