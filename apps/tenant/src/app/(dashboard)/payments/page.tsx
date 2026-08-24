'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  CreditCard, CheckCircle, Clock, AlertTriangle, XCircle,
  Download, ChevronRight, Filter, TrendingUp, ArrowRight,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; dot: string }> = {
  PENDING: { label: 'Due', icon: AlertTriangle, color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500' },
  PAYMENT_SUBMITTED: { label: 'Submitted', icon: Clock, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500 animate-pulse' },
  UNDER_REVIEW: { label: 'Under Review', icon: Clock, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500 animate-pulse' },
  PAID: { label: 'Paid', icon: CheckCircle, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { label: 'Rejected', icon: XCircle, color: 'text-red-700', bg: 'bg-red-50 border-red-200', dot: 'bg-red-500' },
};

const FILTER_TABS = ['ALL', 'PENDING', 'PAYMENT_SUBMITTED', 'PAID', 'REJECTED'];

export default function PaymentsPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ['my-payments', statusFilter, yearFilter],
    queryFn: () =>
      apiClient.get('/api/v1/payments', {
        params: {
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          year: yearFilter,
          limit: 50,
        },
      }).then(r => r.data),
  });

  const payments = data?.data ?? [];

  // Computed stats
  const paidTotal = payments.filter((p: any) => p.status === 'PAID').reduce((a: number, p: any) => a + p.amount, 0);
  const pendingCount = payments.filter((p: any) => ['PENDING', 'PAYMENT_SUBMITTED', 'UNDER_REVIEW'].includes(p.status)).length;
  const paidCount = payments.filter((p: any) => p.status === 'PAID').length;

  // Group by month for timeline view
  const grouped: Record<string, any[]> = {};
  payments.forEach((p: any) => {
    const key = `${MONTHS[(p.month ?? 1) - 1]} ${p.year}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  });

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payment Activity</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your complete rent payment history</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl border p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Paid This Year</p>
          <p className="text-lg font-bold text-emerald-600">{formatCurrency(paidTotal)}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Paid Months</p>
          <p className="text-lg font-bold text-foreground">{paidCount}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Pending</p>
          <p className={cn('text-lg font-bold', pendingCount > 0 ? 'text-orange-600' : 'text-muted-foreground')}>{pendingCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {FILTER_TABS.map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all',
                statusFilter === f
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-card text-muted-foreground border-border hover:border-indigo-300'
              )}
            >
              {f === 'ALL' ? 'All' : STATUS_CONFIG[f]?.label ?? f}
            </button>
          ))}
        </div>
        <select
          value={yearFilter}
          onChange={e => setYearFilter(+e.target.value)}
          className="ml-auto h-8 px-2 text-xs rounded-lg border border-border text-muted-foreground"
        >
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Payment Feed */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No payment records found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([month, monthPayments]) => (
            <div key={month}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{month}</p>
              <div className="space-y-2.5">
                {monthPayments.map((p: any) => {
                  const cfg = STATUS_CONFIG[p.status];
                  const Icon = cfg?.icon ?? Clock;
                  const isPendingAction = ['PENDING', 'REJECTED'].includes(p.status);

                  return (
                    <Link
                      key={p._id}
                      href={`/payments/${p._id}`}
                      className="flex items-center gap-4 bg-card rounded-xl border p-4 hover:border-indigo-200 hover:shadow-sm transition-all"
                    >
                      {/* Status icon */}
                      <div className={cn('h-10 w-10 rounded-xl border flex items-center justify-center flex-shrink-0', cfg?.bg)}>
                        <Icon className={cn('h-5 w-5', cfg?.color)} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {MONTHS[(p.month ?? 1) - 1]} {p.year} Rent
                          </p>
                          <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border', cfg?.bg, cfg?.color)}>
                            <div className={cn('h-1.5 w-1.5 rounded-full', cfg?.dot)} />
                            {cfg?.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Due {formatDate(p.dueDate)}
                          {p.paidAt && ` · Paid ${formatDate(p.paidAt)}`}
                        </p>
                        {p.status === 'REJECTED' && p.rejectionReason && (
                          <p className="text-xs text-red-500 mt-1">Reason: {p.rejectionReason}</p>
                        )}
                        {p.submission?.utrNumber && (
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono">UTR: {p.submission.utrNumber}</p>
                        )}
                      </div>

                      {/* Amount + action */}
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <p className="font-bold text-foreground">{formatCurrency(p.amount)}</p>
                        {isPendingAction && (
                          <span className={cn(
                            'text-xs px-2.5 py-1 rounded-lg font-semibold',
                            p.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
                          )}>
                            {p.status === 'REJECTED' ? 'Retry' : 'Pay Now'}
                          </span>
                        )}
                        {p.status === 'PAID' && p.receipt && (
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments/${p._id}/receipt`}
                            target="_blank"
                            onClick={e => e.stopPropagation()}
                            className="text-xs px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 font-medium flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" /> Receipt
                          </a>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
