'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, User, Shield, Building2, CreditCard, Clock,
  CheckCircle2, AlertTriangle, Calendar, Phone, Mail,
  IndianRupee, Lock, UserX, UserCheck, Trash2, Award,
  Sparkles, History, FileText, Check, ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate, formatDateShort, timeAgo, cn } from '@/lib/utils';

const ROLE_BADGE: Record<string, string> = {
  LANDLORD:         'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/60 dark:text-indigo-300 dark:border-indigo-700/50',
  TENANT:           'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-700/50',
  BROKER:           'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/60 dark:text-amber-300 dark:border-amber-700/50',
  PROPERTY_MANAGER: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/60 dark:text-blue-300 dark:border-blue-700/50',
  SUPER_ADMIN:      'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/60 dark:text-red-300 dark:border-red-700/50',
};

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'score' | 'stays' | 'payments'>('profile');

  // Queries
  const { data: tenantRes, isLoading: loadingTenant } = useQuery({
    queryKey: ['admin-tenant-detail', id],
    queryFn: () => apiClient.get(`/api/v1/tenants/${id}`).then(r => r.data.data),
    retry: false,
  });

  const { data: staysRes } = useQuery({
    queryKey: ['admin-tenant-stays', id],
    queryFn: () => apiClient.get(`/api/v1/tenants/${id}/stay-history`).then(r => r.data.data),
    retry: false,
  });

  const { data: scoreRes } = useQuery({
    queryKey: ['admin-tenant-reliability', id],
    queryFn: () => apiClient.get(`/api/v1/reliability/tenant/${id}`).then(r => r.data.data),
    retry: false,
  });

  const { data: paymentsRes } = useQuery({
    queryKey: ['admin-tenant-payments', id],
    queryFn: () => apiClient.get('/api/v1/payments', { params: { tenantId: id, limit: 50 } }).then(r => r.data),
    retry: false,
  });

  // Suspend / Activate Mutations
  const { mutate: suspendUser } = useMutation({
    mutationFn: (userId: string) => apiClient.patch(`/api/v1/admin/users/${userId}/suspend`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tenant-detail', id] });
    },
  });

  const { mutate: activateUser } = useMutation({
    mutationFn: (userId: string) => apiClient.patch(`/api/v1/admin/users/${userId}/activate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-tenant-detail', id] });
    },
  });

  const tenant = tenantRes;
  const user = tenant?.userId;
  const reliability = scoreRes;
  const stays = staysRes ?? (tenant ? [tenant] : []);
  const payments = paymentsRes?.data ?? [];

  if (loadingTenant) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-40 bg-muted rounded-2xl" />
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
    );
  }

  if (!tenant && !user) {
    return (
      <div className="p-12 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-foreground">User Record Not Found</h2>
        <p className="text-sm text-muted-foreground">The requested tenant or user ID could not be loaded.</p>
        <Link
          href="/users"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm border"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Users
        </Link>
      </div>
    );
  }

  const score = reliability?.currentScore ?? 85;
  const breakdown = reliability?.breakdown ?? {};

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Bar */}
      <div className="flex items-center gap-3">
        <Link href="/users" className="p-2 rounded-xl bg-card border hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-xs text-muted-foreground">User ID: {user?._id || id}</p>
        </div>
      </div>

      {/* User Header Card */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg flex-shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{user?.firstName} {user?.lastName}</h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${ROLE_BADGE[user?.role] ?? 'bg-muted text-muted-foreground'}`}>
                {user?.role?.replace('_', ' ')}
              </span>
              <span className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-semibold',
                user?.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700',
              )}>
                {user?.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-1.5">
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {user?.email}</span>
              {user?.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {user?.phone}</span>}
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Joined {formatDateShort(user?.createdAt || tenant?.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {user?.status === 'ACTIVE' ? (
            <button
              onClick={() => {
                if (confirm(`Suspend user account for ${user?.firstName}?`)) suspendUser(user?._id || id);
              }}
              className="px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <UserX className="h-4 w-4" /> Suspend Account
            </button>
          ) : (
            <button
              onClick={() => activateUser(user?._id || id)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <UserCheck className="h-4 w-4" /> Activate Account
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border space-x-6 text-sm font-medium overflow-x-auto">
        {[
          { key: 'profile', label: 'Tenancy Overview', icon: User },
          { key: 'score', label: 'Reliability Score & Rating', icon: Shield },
          { key: 'stays', label: `Stay History (${stays.length})`, icon: History },
          { key: 'payments', label: 'Payment Records', icon: CreditCard },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={cn(
              'flex items-center gap-2 pb-3 border-b-2 transition-all whitespace-nowrap',
              activeTab === key
                ? 'border-indigo-600 text-indigo-600 font-semibold dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── 1. TENANCY OVERVIEW TAB ─────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-600" /> Current Tenancy Property
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Property</span>
                <span className="font-semibold text-foreground">{tenant?.propertyId?.name || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Room / Unit</span>
                <span className="font-semibold text-foreground">Room {tenant?.roomId?.roomNumber || '—'} ({tenant?.roomId?.type || 'Standard'})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Monthly Rent</span>
                <span className="font-bold text-indigo-600">{formatCurrency(tenant?.agreedRent || 0)}/mo</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Security Deposit</span>
                <span className="font-bold text-foreground">{formatCurrency(tenant?.securityDeposit || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Rent Due Day</span>
                <span className="font-medium text-foreground">{tenant?.rentDueDay || 5}th of month</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Landlord / Owner</span>
                <span className="font-medium text-foreground">
                  {tenant?.landlordId?.firstName} {tenant?.landlordId?.lastName} ({tenant?.landlordId?.phone || '—'})
                </span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" /> Verified Identity & KYC
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Identity Status</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                  {user?.isKycVerified || tenant?.verificationStatus?.aadhaar === 'VERIFIED' ? 'VERIFIED' : 'PENDING'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Email Verification</span>
                <span className="font-semibold text-emerald-600">{user?.isEmailVerified ? '✓ Verified' : 'Pending'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Phone Verification</span>
                <span className="font-semibold text-blue-600">{user?.phone ? '✓ Registered' : 'None'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-muted-foreground">Emergency Contact</span>
                <span className="font-medium text-foreground">
                  {tenant?.emergencyContact?.name ? `${tenant.emergencyContact.name} (${tenant.emergencyContact.relation || 'Contact'})` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Emergency Phone</span>
                <span className="font-mono text-foreground">{tenant?.emergencyContact?.phone || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. RELIABILITY SCORE TAB ─────────────────────────── */}
      {activeTab === 'score' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/40 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest">RentFlow Reliability Score</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-5xl font-black text-white">{score}</span>
                <span className="text-lg text-indigo-300">/ 100</span>
              </div>
              <p className="text-sm font-semibold text-emerald-400 mt-1">
                {score >= 90 ? 'Tier 1 Prime Tenant' : score >= 75 ? 'Tier 2 Consistent Record' : 'Standard Rating'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 max-w-sm text-xs text-indigo-200">
              Score is calculated objectively based on on-time clearing, KYC verification, lease continuity, and zero outstanding overdue balances.
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-5">
            {[
              { label: 'Payment History', value: breakdown.paymentHistory ?? 90, weight: '35%' },
              { label: 'KYC Verification', value: breakdown.kycVerification ?? 80, weight: '20%' },
              { label: 'Tenancy Stability', value: breakdown.tenancyStability ?? 85, weight: '20%' },
              { label: 'Outstanding Dues', value: breakdown.outstandingDues ?? 95, weight: '15%' },
              { label: 'Agreement Status', value: breakdown.agreementStatus ?? 90, weight: '10%' },
            ].map(f => (
              <div key={f.label} className="p-4 rounded-2xl bg-card border text-center space-y-1">
                <p className="text-[11px] text-muted-foreground truncate">{f.label}</p>
                <p className="text-xl font-bold text-foreground">{f.value}%</p>
                <p className="text-[10px] text-muted-foreground font-semibold">{f.weight} weight</p>
                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${f.value}%` }} />
                </div>
              </div>
            ))}
          </div>

          {reliability?.positiveFactors?.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Verified Positive Reliability Drivers
              </h3>
              <div className="space-y-2">
                {reliability.positiveFactors.map((factor: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-foreground bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900">
                    <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 3. STAY HISTORY TAB ──────────────────────────────── */}
      {activeTab === 'stays' && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="font-bold text-base text-foreground">Complete Tenancy & Stay History</h3>
            <p className="text-xs text-muted-foreground mt-0.5">All rental stays and properties rented by this tenant on RentFlow</p>
          </div>
          {stays.length === 0 ? (
            <p className="text-center py-10 text-xs text-muted-foreground">No stay history records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Property</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Room</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Landlord</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Joining Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Vacating Date</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">Agreed Rent</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stays.map((s: any) => (
                    <tr key={s._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-foreground">
                        {s.propertyId?.name ?? 'Property'}
                      </td>
                      <td className="px-5 py-3.5 text-foreground">
                        Room {s.roomId?.roomNumber || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs">
                        {s.landlordId?.firstName} {s.landlordId?.lastName}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs">
                        {s.joiningDate ? formatDate(s.joiningDate) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs">
                        {s.vacatingDate ? formatDate(s.vacatingDate) : 'Present'}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-foreground">
                        {formatCurrency(s.agreedRent || 0)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={cn(
                          'px-2.5 py-0.5 rounded-full text-xs font-semibold',
                          s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground',
                        )}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 4. PAYMENT RECORDS TAB ───────────────────────────── */}
      {activeTab === 'payments' && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="font-bold text-base text-foreground">Rent & Payment History</h3>
          </div>
          {payments.length === 0 ? (
            <p className="text-center py-10 text-xs text-muted-foreground">No payment records found for this tenant.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Period</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Due Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Paid Date</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">Amount</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((p: any) => (
                    <tr key={p._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-foreground">
                        Month {p.month} · {p.year}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">
                        {p.dueDate ? formatDate(p.dueDate) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">
                        {p.paidAt ? formatDate(p.paidAt) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-foreground">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={cn(
                          'px-2.5 py-0.5 rounded-full text-xs font-semibold',
                          p.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
                        )}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
