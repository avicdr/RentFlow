'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users, Building2, CreditCard, TrendingUp, Activity,
  ArrowUpRight, ArrowDownRight, Crown, Layers, Zap, CheckCircle2,
  IndianRupee, BarChart2,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import apiClient from '@/lib/api-client';
import { formatCurrency, timeAgo } from '@/lib/utils';

const TOOLTIP_STYLE = {
  backgroundColor: '#111827',
  border: '1px solid #1f2937',
  borderRadius: '8px',
  color: '#e5e7eb',
  fontSize: '12px',
};

const TIER_CONFIG: Record<string, { color: string; bg: string; price: number; label: string }> = {
  SOLO:       { color: '#6b7280', bg: 'bg-gray-600/20 text-gray-400',   price: 499,  label: 'Solo' },
  GROWTH:     { color: '#10b981', bg: 'bg-emerald-600/20 text-emerald-400', price: 1499, label: 'Growth' },
  SCALE:      { color: '#6366f1', bg: 'bg-indigo-600/20 text-indigo-400',  price: 2999, label: 'Scale' },
  ENTERPRISE: { color: '#f59e0b', bg: 'bg-amber-600/20 text-amber-400',    price: 4999, label: 'Enterprise' },
};

function StatCard({
  title, value, subtitle, icon: Icon, trend, color,
}: {
  title: string; value: string | number; subtitle?: string;
  icon: any; trend?: number; color: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend)}% vs last month
            </div>
          )}
        </div>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['admin', 'platform-stats'],
    queryFn: () => apiClient.get('/api/v1/admin/stats').then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const { data: recentUsers } = useQuery({
    queryKey: ['admin', 'recent-users'],
    queryFn: () => apiClient.get('/api/v1/admin/users?limit=6&sort=createdAt').then(r => r.data.data),
  });

  const tierBreakdown = stats?.subscriptionBreakdown
    ? Object.entries(stats.subscriptionBreakdown as Record<string, number>).map(([tier, count]) => ({
        tier,
        count,
        label: TIER_CONFIG[tier]?.label ?? tier,
        revenue: (TIER_CONFIG[tier]?.price ?? 0) * count,
        color: TIER_CONFIG[tier]?.color ?? '#6366f1',
      }))
    : [];

  const totalActiveSubscriptions = tierBreakdown.reduce((s, t) => s + t.count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Product Overview</h1>
        <p className="text-gray-400 text-sm mt-1">RentFlow SaaS metrics — subscriptions, revenue, and growth</p>
      </div>

      {/* Top KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Recurring Revenue"
          value={`₹${((stats?.mrr ?? 0) / 1000).toFixed(1)}k`}
          subtitle={`${totalActiveSubscriptions} active subscriptions`}
          icon={IndianRupee}
          color="bg-emerald-600/20 text-emerald-400"
        />
        <StatCard
          title="Total Landlords"
          value={stats?.totalLandlords ?? '—'}
          subtitle={`${stats?.newUsersThisMonth ?? 0} new this month`}
          icon={Crown}
          trend={stats?.userGrowthPct}
          color="bg-indigo-600/20 text-indigo-400"
        />
        <StatCard
          title="Total Tenants"
          value={stats?.totalTenants ?? '—'}
          subtitle={`on ${stats?.totalProperties ?? 0} properties`}
          icon={Users}
          color="bg-purple-600/20 text-purple-400"
        />
        <StatCard
          title="Rent Collected (Month)"
          value={formatCurrency(stats?.totalRevenueThisMonth ?? 0)}
          subtitle={`${stats?.paidPaymentsThisMonth ?? 0} payments verified`}
          icon={CreditCard}
          trend={stats?.revenueGrowthPct}
          color="bg-blue-600/20 text-blue-400"
        />
      </div>

      {/* Subscription Tier Cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-400" /> Subscription Breakdown
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(['SOLO', 'GROWTH', 'SCALE', 'ENTERPRISE'] as const).map(tier => {
            const cfg = TIER_CONFIG[tier];
            const count = stats?.subscriptionBreakdown?.[tier] ?? 0;
            const rev = cfg.price * count;
            return (
              <div key={tier} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg}`}>{cfg.label}</span>
                  <span className="text-xs text-gray-500">₹{cfg.price.toLocaleString('en-IN')}/mo</span>
                </div>
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className="text-xs text-gray-500 mt-1">landlords</p>
                <p className="text-xs font-semibold mt-2" style={{ color: cfg.color }}>
                  ₹{rev.toLocaleString('en-IN')} MRR
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-400" /> Rent Collected (Last 6 Months)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats?.revenueChart ?? []}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Collected']} />
              <Area type="monotone" dataKey="collected" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tier distribution bar */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-indigo-400" /> Plans by Landlords
          </h2>
          {tierBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={tierBreakdown} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [v, 'Landlords']} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {tierBreakdown.map((t, i) => <Cell key={i} fill={t.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {tierBreakdown.map(t => (
                  <div key={t.tier} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: t.color }} />
                      <span className="text-gray-400">{t.label}</span>
                    </div>
                    <span className="font-medium text-gray-200">{t.count} · ₹{t.revenue.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No subscriptions yet</div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Platform health */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-indigo-400" /> Platform Health
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Active Landlord Orgs', value: stats?.activeOrgs ?? '—', icon: CheckCircle2, color: 'text-emerald-400' },
              { label: 'Total Properties', value: stats?.totalProperties ?? '—', icon: Building2, color: 'text-blue-400' },
              { label: 'Active Properties', value: stats?.activeProperties ?? '—', icon: Building2, color: 'text-indigo-400' },
              { label: 'Total Users', value: stats?.totalUsers ?? '—', icon: Users, color: 'text-purple-400' },
              { label: 'New Signups This Month', value: stats?.newUsersThisMonth ?? '—', icon: ArrowUpRight, color: 'text-emerald-400' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-800/60 last:border-0">
                <div className="flex items-center gap-2">
                  <row.icon className={`h-3.5 w-3.5 ${row.color}`} />
                  <span className="text-sm text-gray-400">{row.label}</span>
                </div>
                <span className="text-sm font-semibold text-white">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Signups */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-400" /> Recent Signups
            </h2>
            <a href="/users" className="text-xs text-indigo-400 hover:text-indigo-300">View all</a>
          </div>
          <div className="divide-y divide-gray-800/60">
            {(recentUsers ?? []).map((u: any) => (
              <div key={u._id} className="flex items-center gap-3 px-5 py-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600/40 to-purple-600/40 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {u.firstName?.[0]}{u.lastName?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-200 truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    u.role === 'LANDLORD'  ? 'bg-indigo-900/50 text-indigo-300' :
                    u.role === 'TENANT'   ? 'bg-emerald-900/50 text-emerald-300' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {u.role}
                  </span>
                  <span className="text-xs text-gray-600">{timeAgo(u.createdAt)}</span>
                </div>
              </div>
            ))}
            {!recentUsers?.length && (
              <p className="text-center text-gray-600 text-sm py-8">No users yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
