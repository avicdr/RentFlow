'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend,
} from 'recharts';
import { Building2, TrendingUp, Users, CreditCard, AlertTriangle } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { SkeletonDashboard } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

const CHART_TOOLTIP = { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' };
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['landlord-analytics'],
    queryFn: () => apiClient.get('/api/v1/analytics/dashboard').then(r => r.data.data),
  });

  const { data: properties } = useQuery({
    queryKey: ['all-properties-analytics'],
    queryFn: () => apiClient.get('/api/v1/properties').then(r => r.data.data),
  });

  if (isLoading) return <SkeletonDashboard />;
  if (!analytics && !isLoading) return (
    <EmptyState icon={TrendingUp} title="No analytics yet" description="Analytics appear once you have properties with tenants and payment activity." />
  );

  const propertyPerf = (analytics?.propertyPerformance ?? []).map((p: any, i: number) => ({
    ...p,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Performance across your portfolio</p>
      </div>

      {/* Top KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Revenue (Month)', value: formatCurrency(analytics?.totalRevenueThisMonth ?? 0), icon: CreditCard, color: 'bg-indigo-50 text-indigo-600', delta: analytics?.revenueGrowthPct },
          { label: 'Occupancy Rate', value: `${analytics?.occupancyRate ?? 0}%`, icon: Building2, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Collection Rate', value: `${analytics?.collectionRate ?? 0}%`, icon: TrendingUp, color: 'bg-blue-50 text-blue-600' },
          { label: 'Open Complaints', value: analytics?.openComplaints ?? 0, icon: AlertTriangle, color: 'bg-orange-50 text-orange-600' },
        ].map(({ label, value, icon: Icon, color, delta }) => (
          <div key={label} className="bg-card rounded-xl border p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
                {delta !== undefined && (
                  <p className={cn('text-xs font-medium mt-1', delta >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                    {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}% vs last month
                  </p>
                )}
              </div>
              <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', color)}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold text-foreground mb-4">Revenue — Last 6 Months</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics?.revenueChart ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v: number) => [formatCurrency(v), 'Collected']} />
              <Bar dataKey="collected" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Property-wise occupancy */}
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold text-foreground mb-4">Property-wise Occupancy</h2>
          {propertyPerf.length === 0 ? (
            <EmptyState icon={Building2} title="No properties yet" compact />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={propertyPerf} cx="50%" cy="50%" outerRadius={60} innerRadius={30} dataKey="occupiedBeds" paddingAngle={3}>
                    {propertyPerf.map((entry: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {propertyPerf.map((p: any, i: number) => (
                  <div key={p.propertyId} className="flex items-center gap-2 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="flex-1 text-muted-foreground truncate">{p.name}</span>
                    <span className="font-medium text-foreground">{p.occupiedBeds}/{p.totalBeds}</span>
                    <span className="text-muted-foreground">({p.occupancyRate}%)</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Property Performance Table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-foreground">Property Performance</h2>
        </div>
        {propertyPerf.length === 0 ? (
          <EmptyState icon={Building2} title="No property data" compact />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Property</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">Occupancy</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">Revenue (Month)</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">Collection Rate</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">Open Complaints</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {propertyPerf.map((p: any, i: number) => (
                  <tr key={p.propertyId} className="hover:bg-muted">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="font-medium text-foreground">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${p.occupancyRate}%` }} />
                        </div>
                        <span className="font-medium text-foreground w-10 text-right">{p.occupancyRate}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-foreground">{formatCurrency(p.revenue ?? 0)}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={cn('font-medium', (p.collectionRate ?? 0) >= 90 ? 'text-emerald-600' : (p.collectionRate ?? 0) >= 70 ? 'text-yellow-600' : 'text-red-600')}>
                        {p.collectionRate ?? 0}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={cn('font-medium', (p.openComplaints ?? 0) > 0 ? 'text-orange-600' : 'text-muted-foreground')}>
                        {p.openComplaints ?? 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Health */}
      <div className="bg-card rounded-xl border p-5">
        <h2 className="font-semibold text-foreground mb-4">Tenant Payment Health</h2>
        {(analytics?.tenantPaymentHealth ?? []).length === 0 ? (
          <EmptyState icon={CreditCard} title="No payment data" description="Payment health data appears after your first billing cycle." compact />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Tenant</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Paid</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Pending</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Overdue</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {analytics.tenantPaymentHealth.map((t: any) => (
                  <tr key={t.tenantId} className="hover:bg-muted">
                    <td className="px-4 py-2.5 font-medium text-foreground">{t.name}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-600 font-medium">{t.paid}</td>
                    <td className="px-4 py-2.5 text-right text-yellow-600 font-medium">{t.pending}</td>
                    <td className="px-4 py-2.5 text-right text-red-600 font-medium">{t.overdue}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={cn('font-semibold', t.paymentRate >= 90 ? 'text-emerald-600' : t.paymentRate >= 70 ? 'text-yellow-600' : 'text-red-600')}>
                        {t.paymentRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
