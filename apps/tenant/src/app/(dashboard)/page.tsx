'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Home, CreditCard, AlertTriangle, CheckCircle, Clock, Building2,
  Shield, FileText, Zap, KeyRound, MessageCircle, ArrowRight,
  Download, Sparkles, Check, ChevronRight,
} from 'lucide-react';
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

  const { data: scoreData } = useQuery({
    queryKey: ['my-reliability-score'],
    queryFn: () => apiClient.get('/api/v1/reliability/me').then(r => r.data.data),
  });

  const { data: utilityData } = useQuery({
    queryKey: ['my-utilities'],
    queryFn: () => apiClient.get('/api/v1/utilities/my-bills').then(r => r.data),
  });

  const { data: complaintsData } = useQuery({
    queryKey: ['my-complaints'],
    queryFn: () => apiClient.get('/api/v1/complaints', { params: { limit: 5 } }).then(r => r.data),
  });

  const payments = paymentsData?.data ?? [];
  const pendingPayments = payments.filter((p: any) => ['PENDING', 'PAYMENT_SUBMITTED', 'UNDER_REVIEW'].includes(p.status));
  const latestPending = pendingPayments[0];
  const paidPayments = payments.filter((p: any) => p.status === 'PAID');

  const pendingUtilities = (utilityData?.data ?? []).filter((b: any) => b.status === 'PENDING' || b.status === 'OVERDUE');
  const openComplaints = (complaintsData?.data ?? []).filter((c: any) => ['OPEN', 'IN_PROGRESS'].includes(c.status));

  const score = scoreData?.currentScore ?? 88;

  const STATUS_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
    PENDING: { icon: AlertTriangle, label: 'Payment Due', color: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20' },
    PAYMENT_SUBMITTED: { icon: Clock, label: 'Submitted — Awaiting Review', color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20' },
    UNDER_REVIEW: { icon: Clock, label: 'Under Review', color: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20' },
    PAID: { icon: CheckCircle, label: 'Paid', color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20' },
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8 max-w-6xl mx-auto">
      {/* ── 1. WELCOME HERO & PASSPORT BANNER ─────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
                <Shield className="h-3.5 w-3.5 text-indigo-200" />
                Verified Resident
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-100 text-xs font-semibold">
                <Check className="h-3 w-3 text-emerald-300" /> Active Lease
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good day, {user?.firstName} {user?.lastName}
            </h1>
            {profile && (
              <div className="mt-2 flex flex-wrap items-center gap-4 text-indigo-100 text-sm">
                <span className="flex items-center gap-1.5 font-medium">
                  <Building2 className="h-4 w-4 text-indigo-300" />
                  {profile.propertyId?.name}
                </span>
                <span className="text-indigo-300">·</span>
                <span>Room {profile.roomId?.roomNumber || '101'}</span>
                <span className="text-indigo-300">·</span>
                <span>Rent ₹{(profile.agreedRent || 0).toLocaleString('en-IN')}/mo</span>
              </div>
            )}
          </div>

          {/* Quick RentPass Capsule */}
          <Link
            href="/rentpass"
            className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-all group"
          >
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center font-black text-xl text-white">
              {score}
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs font-bold text-indigo-200 uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" /> RentPass Score
              </div>
              <p className="text-sm font-semibold text-white mt-0.5">Reliability: Excellent</p>
              <p className="text-[11px] text-indigo-200 flex items-center gap-1 mt-0.5 group-hover:underline">
                View & Share Passport <ChevronRight className="h-3 w-3" />
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* ── 2. RENT DUE ALERT (IF PENDING) ────────────────────── */}
      {latestPending && (
        <Link href={`/payments/${latestPending._id}`} className="block mt-2">
          <div className={`rounded-2xl p-5 border bg-card shadow-sm hover:border-indigo-400 transition-all ${
            latestPending.status === 'PENDING' ? 'border-l-4 border-l-yellow-500 border-yellow-200 dark:border-yellow-800/60 dark:border-l-yellow-500' :
            latestPending.status === 'PAYMENT_SUBMITTED' ? 'border-l-4 border-l-blue-500 border-blue-200 dark:border-blue-800/60 dark:border-l-blue-500' :
            'border-l-4 border-l-orange-500 border-orange-200 dark:border-orange-800/60 dark:border-l-orange-500'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground text-sm">
                  {MONTHS[(latestPending.month ?? 1) - 1]} {latestPending.year} Rent
                </p>
                <p className="text-2xl font-extrabold mt-1 text-foreground">{formatCurrency(latestPending.amount)}</p>
                <p className={`text-xs mt-1 font-semibold flex items-center gap-1.5 ${
                  latestPending.status === 'PENDING' ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'
                }`}>
                  <Clock className="h-3.5 w-3.5" />
                  {STATUS_CONFIG[latestPending.status]?.label ?? latestPending.status}
                </p>
              </div>
              {latestPending.status === 'PENDING' && (
                <div className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-yellow-500/20">
                  Pay Now
                </div>
              )}
            </div>
            {latestPending.status === 'PENDING' && (
              <p className="text-xs text-muted-foreground mt-2 font-medium">Due by {formatDate(latestPending.dueDate)}</p>
            )}
          </div>
        </Link>
      )}

      {/* ── 3. TENANT SUPER-APP FEATURE TILES ─────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          { title: 'RentPass', sub: `${score}/100 Score`, href: '/rentpass', icon: Shield, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
          { title: 'My Rent', sub: 'Pay & Records', href: '/payments', icon: CreditCard, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
          { title: 'Receipts', sub: `${paidPayments.length} Available`, href: '/receipts', icon: FileText, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
          { title: 'Utilities', sub: `${pendingUtilities.length} Due`, href: '/utilities', icon: Zap, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
          { title: 'Deposit', sub: formatCurrency(profile?.securityDeposit || 0), href: '/deposit', icon: KeyRound, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
          { title: 'Messages', sub: 'Chat Landlord', href: '/messages', icon: MessageCircle, color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/40' },
        ].map(({ title, sub, href, icon: Icon, color }) => (
          <Link
            key={title}
            href={href}
            className="p-4 rounded-2xl bg-card border border-border hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color} mb-3 group-hover:scale-105 transition-transform`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── 4. TWO-COLUMN WORKFLOWS ───────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Payment Receipts */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <h2 className="font-bold text-base text-foreground">Recent Payments & Receipts</h2>
              <p className="text-xs text-muted-foreground">Download verified tax receipts</p>
            </div>
            <Link href="/receipts" className="text-xs text-indigo-600 font-semibold hover:underline">
              View all receipts →
            </Link>
          </div>

          <div className="divide-y divide-border">
            {payments.slice(0, 4).map((p: any) => {
              const cfg = STATUS_CONFIG[p.status];
              const Icon = cfg?.icon ?? Clock;
              return (
                <Link key={p._id} href={`/payments/${p._id}`} className="flex items-center justify-between py-3.5 hover:bg-muted/40 rounded-xl px-2 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${cfg?.color ?? 'bg-muted text-muted-foreground'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{MONTHS[(p.month ?? 1) - 1]} {p.year} Rent</p>
                      <p className="text-xs text-muted-foreground">{cfg?.label ?? p.status}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-foreground">{formatCurrency(p.amount)}</p>
                    {p.status === 'PAID' && (
                      <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 justify-end">
                        <Download className="h-3 w-3" /> Receipt ready
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
            {payments.length === 0 && (
              <p className="text-center py-8 text-xs text-muted-foreground">No payment records yet</p>
            )}
          </div>
        </div>

        {/* Maintenance & Support */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <h2 className="font-bold text-base text-foreground">Maintenance & Requests</h2>
              <p className="text-xs text-muted-foreground">Active tickets and property fixes</p>
            </div>
            <Link href="/complaints" className="text-xs text-indigo-600 font-semibold hover:underline">
              New request →
            </Link>
          </div>

          <div className="divide-y divide-border">
            {(complaintsData?.data ?? []).slice(0, 3).map((c: any) => (
              <Link key={c._id} href={`/complaints`} className="flex items-center justify-between py-3.5 hover:bg-muted/40 rounded-xl px-2 transition-colors">
                <div>
                  <p className="font-semibold text-sm text-foreground">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.category} · {formatDate(c.createdAt)}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  c.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {c.status.replace(/_/g, ' ')}
                </span>
              </Link>
            ))}
            {(complaintsData?.data ?? []).length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground">
                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-50" />
                No open maintenance requests. Everything in order!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 5. LANDLORD CONTACT & HELP ───────────────────────── */}
      {profile?.landlordId && (
        <div className="bg-card rounded-2xl border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
              {profile.landlordId?.firstName?.[0]}{profile.landlordId?.lastName?.[0]}
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">{profile.landlordId?.firstName} {profile.landlordId?.lastName}</p>
              <p className="text-xs text-muted-foreground">Property Manager & Landlord · {profile.landlordId?.phone || 'Phone on file'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/messages">
              <button className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 transition-colors">
                <MessageCircle className="h-4 w-4" /> Message Landlord
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
