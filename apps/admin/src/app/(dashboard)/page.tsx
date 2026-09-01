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
import { useTheme } from '@/components/theme-provider';

const TIER_CONFIG: Record<string, { color: string; bg: string; price: number; label: string; unitLimit: number }> = {
  LITE:         { color: '#6b7280', bg: 'bg-muted text-muted-foreground border border-border',   price: 99,   label: 'Lite',         unitLimit: 5 },
  STARTER:      { color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800',    price: 299,  label: 'Starter',      unitLimit: 25 },
  GROWTH:       { color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800', price: 699,  label: 'Growth',       unitLimit: 75 },
  PROFESSIONAL: { color: '#8b5cf6', bg: 'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800', price: 1499, label: 'Professional', unitLimit: 200 },
  BUSINESS:     { color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800',    price: 2999, label: 'Business',     unitLimit: 500 },
  ENTERPRISE:   { color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800', price: 0,    label: 'Enterprise',   unitLimit: 999999 },
};

function StatCard({
  title, value, subtitle, icon: Icon, trend, color,
}: {
  title: string; value: string | number; subtitle?: string;
  icon: any; trend?: number; color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors shadow-xs">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend)}% vs last month
            </div>
          )}
        </div>
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const tooltipStyle = {
    backgroundColor: isDark ? '#18181b' : '#ffffff',
    borderColor: isDark ? '#27272a' : '#e4e4e7',
    borderRadius: '12px',
    color: isDark ? '#fafafa' : '#09090b',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    fontSize: '12px',
  };

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
        <h1 className="text-2xl font-bold text-foreground">Product Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">RentFlow SaaS metrics — subscriptions, revenue, and growth</p>
      </div>

      {/* Top KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Recurring Revenue"
          value={`₹${((stats?.mrr ?? 0) / 1000).toFixed(1)}k`}
          subtitle={`${totalActiveSubscriptions} active subscriptions`}
          icon={IndianRupee}
          color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
        />
        <StatCard
          title="Total Landlords"
          value={stats?.totalLandlords ?? '—'}
          subtitle={`${stats?.newUsersThisMonth ?? 0} new this month`}
          icon={Crown}
          trend={stats?.userGrowthPct}
          color="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
        />
        <StatCard
          title="Total Tenants"
          value={stats?.totalTenants ?? '—'}
          subtitle={`on ${stats?.totalProperties ?? 0} properties`}
          icon={Users}
          color="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
        />
        <StatCard
          title="Rent Collected (Month)"
          value={formatCurrency(stats?.totalRevenueThisMonth ?? 0)}
          subtitle={`${stats?.paidPaymentsThisMonth ?? 0} payments verified`}
          icon={CreditCard}
          trend={stats?.revenueGrowthPct}
          color="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
        />
      </div>

      {/* Subscription Tier Cards */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-500" /> Subscription Breakdown
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {(['LITE', 'STARTER', 'GROWTH', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'] as const).map(tier => {
            const cfg = TIER_CONFIG[tier];
            if (!cfg) return null;
            const count = stats?.subscriptionBreakdown?.[tier] ?? 0;
            const rev = cfg.price * count;
            return (
              <div key={tier} className="bg-card border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg}`}>{cfg.label}</span>
                  <span className="text-xs text-muted-foreground">{cfg.price > 0 ? `₹${cfg.price.toLocaleString('en-IN')}/mo` : 'Custom'}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{count}</p>
                <p className="text-xs text-muted-foreground mt-1">landlords · {cfg.unitLimit === 999999 ? '500+' : `≤${cfg.unitLimit}`} units</p>
                <p className="text-xs font-semibold mt-2" style={{ color: cfg.color }}>
                  {cfg.price > 0 ? `₹${rev.toLocaleString('en-IN')} MRR` : 'Custom MRR'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" /> Rent Collected (Last 6 Months)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats?.revenueChart ?? []}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e4e4e7'} />
              <XAxis dataKey="month" tick={{ fill: isDark ? '#a1a1aa' : '#71717a', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: isDark ? '#a1a1aa' : '#71717a', fontSize: 11 }} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Collected']} />
              <Area type="monotone" dataKey="collected" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tier distribution bar */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-indigo-500" /> Plans by Landlords
          </h2>
          {tierBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={tierBreakdown} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e4e4e7'} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: isDark ? '#a1a1aa' : '#71717a', fontSize: 11 }} axisLine={false} />
                  <YAxis tick={{ fill: isDark ? '#a1a1aa' : '#71717a', fontSize: 11 }} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, 'Landlords']} />
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
                      <span className="text-muted-foreground">{t.label}</span>
                    </div>
                    <span className="font-medium text-foreground">{t.count} · ₹{t.revenue.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No subscriptions yet</div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Platform health */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-indigo-500" /> Platform Health
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Active Landlord Orgs', value: stats?.activeOrgs ?? '—', icon: CheckCircle2, color: 'text-emerald-500' },
              { label: 'Total Properties', value: stats?.totalProperties ?? '—', icon: Building2, color: 'text-blue-500' },
              { label: 'Active Properties', value: stats?.activeProperties ?? '—', icon: Building2, color: 'text-indigo-500' },
              { label: 'Total Users', value: stats?.totalUsers ?? '—', icon: Users, color: 'text-purple-500' },
              { label: 'New Signups This Month', value: stats?.newUsersThisMonth ?? '—', icon: ArrowUpRight, color: 'text-emerald-500' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <row.icon className={`h-3.5 w-3.5 ${row.color}`} />
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Signups */}
        <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-500" /> Recent Signups
            </h2>
            <a href="/users" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">View all</a>
          </div>
          <div className="divide-y divide-border">
            {(recentUsers ?? []).map((u: any) => (
              <div key={u._id} className="flex items-center gap-3 px-5 py-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-xs">
                  {u.firstName?.[0]}{u.lastName?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${u.role === 'LANDLORD' ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800' :
                      u.role === 'TENANT' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                        'bg-muted text-muted-foreground border border-border'
                    }`}>
                    {u.role}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{timeAgo(u.createdAt)}</span>
                </div>
              </div>
            ))}
            {!recentUsers?.length && (
              <p className="text-center text-muted-foreground text-sm py-8">No users yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
