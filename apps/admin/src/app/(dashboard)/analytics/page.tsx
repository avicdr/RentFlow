'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Users, Building2, CreditCard, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '@/lib/api-client';
import { useTheme } from '@/components/theme-provider';

export default function AdminAnalyticsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartTooltipStyle = {
    backgroundColor: isDark ? '#18181b' : '#ffffff',
    borderColor: isDark ? '#27272a' : '#e4e4e7',
    borderRadius: '12px',
    color: isDark ? '#fafafa' : '#09090b',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    fontSize: '12px',
  };

  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => apiClient.get('/api/v1/admin/stats').then(r => r.data.data),
  });

  const { data: paymentHealth } = useQuery({
    queryKey: ['analytics', 'payment-health'],
    queryFn: () => apiClient.get('/api/v1/analytics/payment-health').then(r => r.data.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform-wide performance metrics</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Users', value: stats?.totalUsers ?? '—', icon: Users, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800' },
          { label: 'Total Properties', value: stats?.totalProperties ?? '—', icon: Building2, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800' },
          { label: 'Revenue This Month', value: `₹${((stats?.totalRevenueThisMonth ?? 0) / 1000).toFixed(0)}k`, icon: CreditCard, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800' },
          { label: 'Open Complaints', value: stats?.openComplaints ?? '—', icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">{label}</p>
                <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
              </div>
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-500" /> Platform Revenue — Last 6 Months
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={stats?.revenueChart ?? []}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e4e4e7'} />
            <XAxis dataKey="month" tick={{ fill: isDark ? '#a1a1aa' : '#71717a', fontSize: 11 }} axisLine={false} />
            <YAxis tick={{ fill: isDark ? '#a1a1aa' : '#71717a', fontSize: 11 }} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
            <Area type="monotone" dataKey="collected" stroke="#6366f1" strokeWidth={2} fill="url(#grad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Payment Health */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-emerald-500" /> Payment Health by Property
        </h2>
        {(paymentHealth?.byProperty ?? []).length === 0 ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">No data available yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={paymentHealth.byProperty}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e4e4e7'} />
              <XAxis dataKey="propertyName" tick={{ fill: isDark ? '#a1a1aa' : '#71717a', fontSize: 10 }} axisLine={false} />
              <YAxis tick={{ fill: isDark ? '#a1a1aa' : '#71717a', fontSize: 10 }} axisLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="paid" fill="#10b981" radius={[4,4,0,0]} name="Paid" />
              <Bar dataKey="pending" fill="#f59e0b" radius={[4,4,0,0]} name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
