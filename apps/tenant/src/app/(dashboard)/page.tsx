'use client';

import { useQuery } from '@tanstack/react-query';
import { Home, CreditCard, AlertTriangle, CheckCircle, Clock, Building2 } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { formatCurrency, formatDate } from '@/lib/utils';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function TenantDashboard() {
  const user = useAuthStore(s => s.user);

  const { data: profile } = useQuery({
    queryKey: ['tenant-profile'],
    queryFn: () => apiClient.get('/api/v1/tenants/my-profile').then(r => r.data.data),
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['my-payments'],
    queryFn: () => apiClient.get('/api/v1/payments', { params: { limit: 6 } }).then(r => r.data),
  });

  const payments = paymentsData?.data ?? [];
  const pendingPayments = payments.filter((p: any) => ['PENDING', 'PAYMENT_SUBMITTED', 'UNDER_REVIEW'].includes(p.status));
  const latestPending = pendingPayments[0];

  const STATUS_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
    PENDING: { icon: AlertTriangle, label: 'Payment Due', color: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20' },
    PAYMENT_SUBMITTED: { icon: Clock, label: 'Submitted — Awaiting Review', color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20' },
    UNDER_REVIEW: { icon: Clock, label: 'Under Review', color: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20' },
    PAID: { icon: CheckCircle, label: 'Paid', color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20' },
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <p className="text-indigo-200 text-sm">Good day,</p>
        <h1 className="text-2xl font-bold mt-1">{user?.firstName} {user?.lastName}</h1>
        {profile && (
          <div className="mt-4 flex items-center gap-2 text-indigo-100 text-sm">
            <Building2 className="h-4 w-4" />
            <span>{profile.propertyId?.name} — Room {profile.roomId?.roomNumber}</span>
          </div>
        )}
      </div>

      {/* Rent Due Alert */}
      {latestPending && (
        <Link href={`/payments/${latestPending._id}`}>
          <div className={`rounded-xl p-4 border ${
            latestPending.status === 'PENDING' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900/50 dark:bg-yellow-900/20' :
            latestPending.status === 'PAYMENT_SUBMITTED' ? 'border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/20' :
            'border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-900/20'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">
                  {MONTHS[(latestPending.month ?? 1) - 1]} {latestPending.year} Rent
                </p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(latestPending.amount)}</p>
                <p className={`text-sm mt-1 font-medium ${
                  latestPending.status === 'PENDING' ? 'text-yellow-700 dark:text-yellow-400' : 'text-blue-700 dark:text-blue-400'
                }`}>
                  {STATUS_CONFIG[latestPending.status]?.label ?? latestPending.status}
                </p>
              </div>
              {latestPending.status === 'PENDING' && (
                <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold text-sm">
                  Pay Now
                </div>
              )}
            </div>
            {latestPending.status === 'PENDING' && (
              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">Due: {formatDate(latestPending.dueDate)}</p>
            )}
          </div>
        </Link>
      )}

      {/* Quick Stats */}
      {profile && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4 border">
            <p className="text-sm text-muted-foreground">Monthly Rent</p>
            <p className="text-xl font-bold text-foreground mt-1">{formatCurrency(profile.agreedRent)}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border">
            <p className="text-sm text-muted-foreground">Due Every</p>
            <p className="text-xl font-bold text-foreground mt-1">{profile.rentDueDay}th</p>
          </div>
          <div className="bg-card rounded-xl p-4 border">
            <p className="text-sm text-muted-foreground">Deposit Paid</p>
            <p className="text-xl font-bold text-foreground mt-1">{formatCurrency(profile.securityDeposit)}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border">
            <p className="text-sm text-muted-foreground">Since</p>
            <p className="text-xl font-bold text-foreground mt-1">{new Date(profile.joiningDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
          </div>
        </div>
      )}

      {/* Recent Payments */}
      <div className="bg-card rounded-xl border">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Recent Payments</h2>
          <Link href="/payments" className="text-sm text-indigo-600 font-medium">View all</Link>
        </div>
        <div className="divide-y">
          {payments.slice(0, 5).map((p: any) => {
            const cfg = STATUS_CONFIG[p.status];
            const Icon = cfg?.icon ?? Clock;
            return (
              <Link key={p._id} href={`/payments/${p._id}`} className="flex items-center justify-between p-4 hover:bg-muted">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${cfg?.color ?? 'bg-muted text-muted-foreground'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{MONTHS[(p.month ?? 1) - 1]} {p.year} Rent</p>
                    <p className="text-xs text-muted-foreground">{cfg?.label ?? p.status}</p>
                  </div>
                </div>
                <p className="font-semibold">{formatCurrency(p.amount)}</p>
              </Link>
            );
          })}
          {payments.length === 0 && (
            <p className="text-center py-8 text-sm text-muted-foreground">No payment records yet</p>
          )}
        </div>
      </div>

      {/* Landlord Contact */}
      {profile?.landlordId && (
        <div className="bg-card rounded-xl border p-4">
          <h2 className="font-semibold mb-3">Your Landlord</h2>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-semibold text-sm">
              {profile.landlordId?.firstName?.[0]}{profile.landlordId?.lastName?.[0]}
            </div>
            <div>
              <p className="font-medium">{profile.landlordId?.firstName} {profile.landlordId?.lastName}</p>
              <p className="text-sm text-muted-foreground">{profile.landlordId?.phone}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
