'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Zap, Droplet, Flame, Wifi, FileText, CheckCircle,
  Clock, AlertTriangle, Calendar, Download, ExternalLink,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

const TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  ELECTRICITY: { icon: Zap, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40', label: 'Electricity' },
  WATER: { icon: Droplet, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40', label: 'Water' },
  GAS: { icon: Flame, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/40', label: 'Gas / PNG' },
  INTERNET: { icon: Wifi, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40', label: 'Internet / WiFi' },
  OTHER: { icon: FileText, color: 'text-slate-500 bg-slate-50 dark:bg-slate-950/40', label: 'Other Utility' },
};

export default function TenantUtilitiesPage() {
  const [filterType, setFilterType] = useState<string>('');

  const { data: billsRes, isLoading } = useQuery({
    queryKey: ['my-tenant-utilities', filterType],
    queryFn: () => apiClient.get('/api/v1/utilities/my-bills', { params: { type: filterType || undefined } }).then(r => r.data),
  });

  const bills = billsRes?.data ?? [];
  const summary = billsRes?.summary ?? { totalBills: 0, pendingAmount: 0, paidAmount: 0 };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Utility Bills & Charges</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Electricity, water, internet, and meter charges billed by your landlord
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground font-medium">Pending Dues</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {formatCurrency(summary.pendingAmount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Awaiting settlement</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground font-medium">Total Settled</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(summary.paidAmount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Paid bills this tenancy</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground font-medium">Total Utility Records</p>
            <p className="text-2xl font-bold text-foreground mt-1">{summary.totalBills}</p>
            <p className="text-xs text-muted-foreground mt-1">Billed cycles on file</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: '', label: 'All Bills' },
          { key: 'ELECTRICITY', label: 'Electricity' },
          { key: 'WATER', label: 'Water' },
          { key: 'INTERNET', label: 'Internet' },
          { key: 'GAS', label: 'Gas' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setFilterType(t.key)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap',
              filterType === t.key
                ? 'bg-indigo-600 text-white'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Bills List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Utility Statements</CardTitle>
          <CardDescription>Itemized billing issued by property management</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">Loading utility bills...</div>
          ) : bills.length === 0 ? (
            <div className="p-12">
              <EmptyState
                icon={Zap}
                title="No utility bills"
                description="Any electricity or water sub-meter bills issued by your landlord will appear here."
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {bills.map((b: any) => {
                const cfg = TYPE_CONFIG[b.type] || TYPE_CONFIG.OTHER;
                const Icon = cfg.icon;
                const isOverdue = b.status === 'OVERDUE' || (b.status === 'PENDING' && new Date(b.dueDate) < new Date());

                return (
                  <div key={b._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${cfg.color} flex-shrink-0 mt-0.5`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-foreground">{cfg.label}</h4>
                          <span className="text-xs text-muted-foreground font-normal">· {b.billingPeriod}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Due {formatDate(b.dueDate)} {b.notes && `· "${b.notes}"`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      <div className="text-right">
                        <p className="text-lg font-extrabold text-foreground">{formatCurrency(b.amount)}</p>
                        <span className={cn(
                          'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full',
                          b.status === 'PAID'
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700'
                            : isOverdue
                            ? 'bg-red-100 dark:bg-red-950/50 text-red-700'
                            : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700',
                        )}>
                          {b.status === 'PAID' ? <CheckCircle className="h-3 w-3" /> : isOverdue ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {b.status === 'PAID' ? 'Settled' : isOverdue ? 'Overdue' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
