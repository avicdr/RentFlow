'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { CreditCard, Search, Filter, Eye, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/misc';
import { formatCurrency, formatDate } from '@/lib/utils';

const STATUS_ICONS: Record<string, JSX.Element> = {
  PENDING: <AlertCircle className="h-4 w-4 text-yellow-500" />,
  PAYMENT_SUBMITTED: <Clock className="h-4 w-4 text-blue-500" />,
  UNDER_REVIEW: <Clock className="h-4 w-4 text-orange-500" />,
  PAID: <CheckCircle className="h-4 w-4 text-green-500" />,
  REJECTED: <XCircle className="h-4 w-4 text-red-500" />,
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PAYMENT_SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  PAID: 'Paid',
  REJECTED: 'Rejected',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  PAYMENT_SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-200',
  UNDER_REVIEW: 'bg-orange-50 text-orange-700 border-orange-200',
  PAID: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', { status: statusFilter, month: monthFilter, year: yearFilter, page }],
    queryFn: () =>
      apiClient.get('/api/v1/payments', {
        params: {
          status: statusFilter || undefined,
          month: monthFilter || undefined,
          year: yearFilter || undefined,
          page,
          limit: 20,
        },
      }).then(r => r.data),
  });

  const payments = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage and verify rent payments</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[140px]"
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[120px]"
          value={monthFilter}
          onChange={e => { setMonthFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Months</option>
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={yearFilter}
          onChange={e => { setYearFilter(e.target.value); setPage(1); }}
        >
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tenant</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Period</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Due Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">UTR</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td></tr>
                  ))
                ) : payments.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No payments found</td></tr>
                ) : payments.map((p: any) => (
                  <tr key={p._id} className="hover:bg-muted transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.tenantId?.userId?.firstName ?? 'N/A'} {p.tenantId?.userId?.lastName ?? ''}</div>
                      <div className="text-xs text-muted-foreground">{p.tenantId?.userId?.phone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs">{MONTHS[(p.month ?? 1) - 1]} {p.year}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(p.dueDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[p.status] ?? ''}`}>
                        {STATUS_ICONS[p.status]}
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {p.submission?.utrNumber ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/payments/${p._id}`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, meta.total)} of {meta.total}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
