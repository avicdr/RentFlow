'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, Users, CreditCard, AlertTriangle, TrendingUp, Clock, Crown, BedDouble, ArrowUpRight } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth.store';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

function StatCard({ title, value, icon: Icon, subtitle, color }: {
  title: string; value: string | number; icon: any; subtitle?: string; color: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`rounded-2xl p-3 ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: analytics } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => apiClient.get('/api/v1/analytics/dashboard').then((r) => r.data.data),
  });

  const { data: pendingReview } = useQuery({
    queryKey: ['payments', 'pending-review'],
    queryFn: () => apiClient.get('/api/v1/payments/pending-review').then((r) => r.data.data),
  });

  const { data: sub } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => apiClient.get('/api/v1/subscriptions').then((r) => r.data.data),
  });

  const planLabel = sub?.planInfo?.label ?? sub?.tier ?? 'Lite';
  const managedUnits = sub?.managedUnits ?? 0;
  const unitLimit = sub?.unitLimit ?? 5;
  const isEnterprise = sub?.tier === 'ENTERPRISE' || unitLimit >= 999999;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.firstName}! Here's your portfolio overview.
          </p>
        </div>
        <Link
          href="/settings/subscription"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors self-start sm:self-auto"
        >
          <Crown className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Plan: <strong>{planLabel}</strong></span>
          <span className="text-indigo-400 dark:text-indigo-500">•</span>
          <span>{managedUnits}/{isEnterprise ? '∞' : unitLimit} Units</span>
          <ArrowUpRight className="h-3 w-3 opacity-60" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Properties"
          value={analytics?.totalProperties ?? 0}
          icon={Building2}
          color="bg-indigo-500"
          subtitle="Physical locations"
        />
        <StatCard
          title="Managed Units"
          value={isEnterprise ? `${managedUnits}` : `${managedUnits} / ${unitLimit}`}
          icon={BedDouble}
          subtitle={isEnterprise ? 'Unlimited units' : `${Math.max(0, unitLimit - managedUnits)} units remaining`}
          color="bg-violet-500"
        />
        <StatCard
          title="Active Tenants"
          value={analytics?.activeTenants ?? 0}
          icon={Users}
          color="bg-emerald-500"
        />
        <StatCard
          title="Collected This Month"
          value={`₹${(analytics?.collectedThisMonth ?? 0).toLocaleString('en-IN')}`}
          icon={CreditCard}
          subtitle={`of ₹${(analytics?.totalDueThisMonth ?? 0).toLocaleString('en-IN')} due`}
          color="bg-blue-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Revenue — Last 6 Months
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={analytics?.revenueChart ?? []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Collected']} />
                <Area type="monotone" dataKey="collected" stroke="#4f46e5" strokeWidth={2} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pending Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Pending Review ({pendingReview?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(pendingReview ?? []).slice(0, 5).map((p: any) => (
              <div key={p._id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                <div>
                  <p className="font-medium text-sm">{p.tenantName}</p>
                  <p className="text-xs text-muted-foreground">
                    ₹{p.amount.toLocaleString('en-IN')} — {p.month}/{p.year}
                  </p>
                </div>
                <a href={`/payments/${p._id}`} className="text-xs text-indigo-600 font-medium hover:underline">
                  Review
                </a>
              </div>
            ))}
            {(pendingReview?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No pending reviews 🎉</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
