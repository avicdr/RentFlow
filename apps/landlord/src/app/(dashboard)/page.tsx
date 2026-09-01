'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Building2, Users, CreditCard, AlertTriangle, TrendingUp, Clock,
  Crown, BedDouble, ArrowUpRight, ShieldCheck, DoorOpen, Wrench,
  CheckCircle2, ArrowRight,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth.store';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function StatCard({ title, value, icon: Icon, subtitle, color }: {
  title: string; value: string | number; icon: any; subtitle?: string; color: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow rounded-3xl border shadow-xs">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-extrabold text-foreground mt-2">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`rounded-2xl p-3.5 ${color} shadow-sm`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isPropertyManager = user?.role === 'PROPERTY_MANAGER';

  // Analytics for Owner
  const { data: analytics } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => apiClient.get('/api/v1/analytics/dashboard').then((r) => r.data.data),
    enabled: !isPropertyManager,
  });

  // PM Assigned Properties
  const { data: assignedPropsRes, isLoading: isAssignedLoading } = useQuery({
    queryKey: ['pm-assigned-properties'],
    queryFn: () => apiClient.get('/api/v1/property-managers/my/assigned-properties').then((r) => r.data.data),
    enabled: isPropertyManager,
  });

  // PM & Landlord Pending Reviews
  const { data: pendingReview } = useQuery({
    queryKey: ['payments', 'pending-review'],
    queryFn: () => apiClient.get('/api/v1/payments/pending-review').then((r) => r.data.data),
  });

  // PM & Landlord Complaints
  const { data: complaintsRes } = useQuery({
    queryKey: ['dashboard-complaints'],
    queryFn: () => apiClient.get('/api/v1/complaints', { params: { limit: 5, status: 'OPEN' } }).then((r) => r.data.data),
  });

  // Landlord Subscription
  const { data: sub } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => apiClient.get('/api/v1/subscriptions').then((r) => r.data.data),
    enabled: !isPropertyManager,
  });

  const assignedProperties: any[] = assignedPropsRes || [];
  const openComplaints: any[] = complaintsRes || [];

  // If Property Manager, render specialized PM Dashboard
  if (isPropertyManager) {
    const totalRooms = assignedProperties.reduce((acc, a) => acc + (a.property?.totalRooms || 0), 0);
    const totalBeds = assignedProperties.reduce((acc, a) => acc + (a.property?.totalBeds || 0), 0);
    const occupiedBeds = assignedProperties.reduce((acc, a) => acc + (a.property?.occupiedBeds || 0), 0);
    const availableBeds = Math.max(0, totalBeds - occupiedBeds);
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 font-bold text-xs shadow-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" /> Property Manager Workspace
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2 tracking-tight">
              Good day, {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Here is the operational overview for your assigned properties.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Assigned Properties"
            value={assignedProperties.length}
            icon={Building2}
            color="bg-indigo-600"
            subtitle="Locations under your management"
          />
          <StatCard
            title="Total Units / Rooms"
            value={totalRooms}
            icon={DoorOpen}
            subtitle={`${totalBeds} total beds`}
            color="bg-violet-600"
          />
          <StatCard
            title="Occupied Units"
            value={`${occupiedBeds} (${occupancyRate}%)`}
            icon={Users}
            subtitle={`${availableBeds} beds available`}
            color="bg-emerald-600"
          />
          <StatCard
            title="Open Maintenance"
            value={openComplaints.length}
            icon={Wrench}
            subtitle="Tenant tickets pending"
            color="bg-amber-600"
          />
        </div>

        {/* Empty State vs Assigned Properties Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">My Properties</h2>
              <p className="text-xs text-muted-foreground">Properties currently assigned to you by the owner</p>
            </div>
            <Link
              href="/properties"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {isAssignedLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-muted rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : assignedProperties.length === 0 ? (
            <Card className="rounded-3xl border text-center py-16">
              <CardContent className="space-y-4">
                <div className="h-16 w-16 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs">
                  <Building2 className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">No properties assigned</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    You currently don't have access to any properties. Contact the account owner to get assigned to a property.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assignedProperties.map((item) => {
                const p = item.property || {};
                const owner = item.landlord || {};
                const occupied = p.occupiedBeds || 0;
                const total = p.totalBeds || 0;
                const available = Math.max(0, total - occupied);

                return (
                  <Card
                    key={p._id}
                    className="rounded-3xl border shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden bg-card"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold flex-shrink-0">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-base text-foreground truncate">{p.name || 'Property'}</h3>
                            <p className="text-xs text-muted-foreground truncate">{p.address?.city || 'Location'}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                          {p.type || 'PG'}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-1">
                      <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-muted/40 border text-center text-xs">
                        <div>
                          <p className="text-[10px] text-muted-foreground font-medium">Rooms</p>
                          <p className="font-extrabold text-foreground mt-0.5">{p.totalRooms || 0}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Occupied</p>
                          <p className="font-extrabold text-foreground mt-0.5">{occupied}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Available</p>
                          <p className="font-extrabold text-foreground mt-0.5">{available}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                        <span>Owner: <strong>{owner.firstName ? `${owner.firstName} ${owner.lastName || ''}` : 'Owner'}</strong></span>
                        <Link
                          href={`/properties/${p._id}`}
                          className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <span>Manage</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Operational Widgets */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Payment Reviews */}
          <Card className="rounded-3xl border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  Rent Payments Awaiting Verification ({pendingReview?.length ?? 0})
                </span>
                <Link href="/payments" className="text-xs text-indigo-600 hover:underline font-normal">
                  View All
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {(pendingReview ?? []).slice(0, 4).map((p: any) => (
                <div key={p._id} className="flex items-center justify-between p-3 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 text-xs">
                  <div>
                    <p className="font-bold text-foreground">{p.tenantName}</p>
                    <p className="text-muted-foreground mt-0.5">
                      ₹{p.amount.toLocaleString('en-IN')} · {p.month}/{p.year} {p.propertyName ? `· ${p.propertyName}` : ''}
                    </p>
                  </div>
                  <Link
                    href={`/payments`}
                    className="text-xs px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors"
                  >
                    Verify
                  </Link>
                </div>
              ))}
              {(pendingReview?.length ?? 0) === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">No pending rent proofs to verify 🎉</p>
              )}
            </CardContent>
          </Card>

          {/* Open Maintenance Complaints */}
          <Card className="rounded-3xl border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-indigo-600" />
                  Open Maintenance Requests ({openComplaints.length})
                </span>
                <Link href="/complaints" className="text-xs text-indigo-600 hover:underline font-normal">
                  View All
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {openComplaints.slice(0, 4).map((c: any) => (
                <div key={c._id} className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-foreground truncate">{c.title}</p>
                    <p className="text-muted-foreground mt-0.5 truncate">
                      {c.propertyId?.name || 'Property'} · Priority: {c.priority}
                    </p>
                  </div>
                  <Link
                    href={`/complaints`}
                    className="text-xs px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors flex-shrink-0"
                  >
                    Resolve
                  </Link>
                </div>
              ))}
              {openComplaints.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">No open maintenance requests 🎉</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Otherwise, render Owner Dashboard
  const planLabel = sub?.planInfo?.label ?? sub?.tier ?? 'Lite';
  const managedUnits = sub?.managedUnits ?? 0;
  const unitLimit = sub?.unitLimit ?? 5;
  const isEnterprise = sub?.tier === 'ENTERPRISE' || unitLimit >= 999999;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
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
        <Card className="lg:col-span-2 rounded-3xl border shadow-xs">
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
        <Card className="rounded-3xl border shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Pending Review ({pendingReview?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(pendingReview ?? []).slice(0, 5).map((p: any) => (
              <div key={p._id} className="flex items-center justify-between p-3 bg-orange-50/60 dark:bg-orange-950/20 rounded-2xl border border-orange-100 dark:border-orange-900/40">
                <div>
                  <p className="font-semibold text-sm text-foreground">{p.tenantName}</p>
                  <p className="text-xs text-muted-foreground">
                    ₹{p.amount.toLocaleString('en-IN')} — {p.month}/{p.year}
                  </p>
                </div>
                <Link href={`/payments`} className="text-xs text-indigo-600 font-bold hover:underline">
                  Review
                </Link>
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
