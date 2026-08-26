'use client';

import { useQuery } from '@tanstack/react-query';
import {
  KeyRound, Shield, CheckCircle2, AlertCircle, FileText,
  Calendar, Building2, HelpCircle, ArrowRight, IndianRupee,
} from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function TenantDepositPage() {
  const { data: profileRes, isLoading: loadingProfile } = useQuery({
    queryKey: ['tenant-deposit-profile'],
    queryFn: () => apiClient.get('/api/v1/tenants/my-profile').then(r => r.data.data),
  });

  const { data: utilitiesRes } = useQuery({
    queryKey: ['tenant-deposit-utilities'],
    queryFn: () => apiClient.get('/api/v1/utilities/my-bills').then(r => r.data),
  });

  const profile = profileRes;
  const deposit = profile?.securityDeposit ?? 0;
  const pendingUtilities = (utilitiesRes?.data ?? [])
    .filter((b: any) => b.status === 'PENDING' || b.status === 'OVERDUE')
    .reduce((acc: number, b: any) => acc + (b.amount || 0), 0);

  const estimatedRefund = Math.max(0, deposit - pendingUtilities);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
            <KeyRound className="h-3.5 w-3.5" /> Security & Protection
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">Security Deposit</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track your active rental deposit and estimated settlement refund
        </p>
      </div>

      {/* Hero Deposit Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 border-2 border-indigo-500/30 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Active Security Deposit</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl sm:text-5xl font-black text-white">{formatCurrency(deposit)}</span>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" /> Active & Held in Trust
              </span>
              {profile?.joiningDate && (
                <span className="text-xs text-indigo-200">
                  Paid on {formatDate(profile.joiningDate)}
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 max-w-xs text-xs text-indigo-200 space-y-1">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-indigo-300" /> Protected Record
            </p>
            <p>
              Your deposit terms are linked directly to your active lease agreement with {profile?.propertyId?.name}.
            </p>
          </div>
        </div>
      </div>

      {/* Settlement Estimator Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estimated Settlement Calculator</CardTitle>
          <CardDescription>
            Live estimation of your deposit refund balance upon lease conclusion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-5 rounded-2xl bg-muted/40 border divide-y divide-border text-sm">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-muted-foreground">Original Deposit Paid</span>
              <span className="font-bold text-foreground">{formatCurrency(deposit)}</span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                Pending Utility Dues
                {pendingUtilities > 0 && (
                  <span className="text-[10px] text-amber-600 font-bold bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
                    Active Dues
                  </span>
                )}
              </span>
              <span className="font-bold text-red-600">
                - {formatCurrency(pendingUtilities)}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-muted-foreground">Documented Repair / Maintenance Charges</span>
              <span className="font-bold text-muted-foreground">₹0</span>
            </div>

            <div className="pt-4 flex items-center justify-between text-base">
              <span className="font-extrabold text-foreground">Estimated Net Refund</span>
              <span className="font-black text-xl text-emerald-600 dark:text-emerald-400">
                {formatCurrency(estimatedRefund)}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-indigo-600" /> Refund Policy Reminder
            </p>
            <p>
              According to standard rental guidelines, security deposits are refunded within 30 days of vacating following room inspection and key handover.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
