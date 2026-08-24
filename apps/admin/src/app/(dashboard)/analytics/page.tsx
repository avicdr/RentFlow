'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Users, Building2, CreditCard, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import apiClient from '@/lib/api-client';

const CHART_STYLE = {
  backgroundColor: '#111827', border: '1px solid #1f2937',
  borderRadius: '8px', color: '#e5e7eb', fontSize: '12px',
};

export default function AdminAnalyticsPage() {
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
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Platform-wide performance metrics</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Users', value: stats?.totalUsers ?? '—', icon: Users, color: 'text-indigo-400 bg-indigo-600/20' },
          { label: 'Total Properties', value: stats?.totalProperties ?? '—', icon: Building2, color: 'text-emerald-400 bg-emerald-600/20' },
          { label: 'Revenue This Month', value: `₹${((stats?.totalRevenueThisMonth ?? 0) / 1000).toFixed(0)}k`, icon: CreditCard, color: 'text-blue-400 bg-blue-600/20' },
          { label: 'Open Complaints', value: stats?.openComplaints ?? '—', icon: AlertTriangle, color: 'text-orange-400 bg-orange-600/20' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{label}</p>
                <p className="text-3xl font-bold text-white mt-2">{value}</p>
              </div>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-400" /> Platform Revenue — Last 6 Months
        </h2>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={stats?.revenueChart ?? []}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={CHART_STYLE} formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
            <Area type="monotone" dataKey="collected" stroke="#6366f1" strokeWidth={2} fill="url(#grad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Payment Health */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-emerald-400" /> Payment Health by Property
        </h2>
        {(paymentHealth?.byProperty ?? []).length === 0 ? (
          <div className="h-32 flex items-center justify-center text-gray-600 text-sm">No data available yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={paymentHealth.byProperty}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="propertyName" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} />
              <Tooltip contentStyle={CHART_STYLE} />
              <Bar dataKey="paid" fill="#10b981" radius={[4,4,0,0]} name="Paid" />
              <Bar dataKey="pending" fill="#f59e0b" radius={[4,4,0,0]} name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
