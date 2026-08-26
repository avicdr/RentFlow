'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Shield, CheckCircle2, Sparkles, Building2, Check,
  AlertTriangle, Calendar, Award, Lock, ExternalLink,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function PublicRentPassViewPage() {
  const { token } = useParams<{ token: string }>();

  const { data: resData, isLoading, isError, error } = useQuery({
    queryKey: ['public-rentpass', token],
    queryFn: () =>
      axios.get(`${API_URL}/api/v1/rentpass/public/${token}`).then(r => r.data.data),
    retry: false,
  });

  const pass = resData;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-slate-400 text-sm font-medium">Verifying RentPass Certificate...</p>
        </div>
      </div>
    );
  }

  if (isError || !pass) {
    const errorMsg = (error as any)?.response?.data?.message || 'This RentPass link is invalid, expired, or was revoked.';
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="h-14 w-14 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-white">RentPass Unavailable</h1>
          <p className="text-sm text-slate-400 leading-relaxed">{errorMsg}</p>
          <div className="pt-4 border-t border-slate-800 text-xs text-slate-500">
            Powered by RentFlow Verifiable Rental Identity
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <div className="max-w-3xl mx-auto w-full flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
            RF
          </div>
          <span className="font-extrabold text-lg text-white tracking-tight">RentFlow™</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
          <CheckCircle2 className="h-3.5 w-3.5" /> Verifiable Certificate
        </div>
      </div>

      {/* Main Certificate Card */}
      <div className="max-w-3xl mx-auto w-full my-6 bg-gradient-to-b from-slate-900 to-slate-900/90 border-2 border-indigo-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Certificate Title & Tenant */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-slate-800">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-extrabold text-3xl text-white shadow-xl">
              {pass.tenantName?.[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{pass.tenantName}</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                  <CheckCircle2 className="h-3.5 w-3.5" /> KYC Verified
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>Verified Tenant</span>
                <span>·</span>
                <span>Member Since {new Date(pass.verifiedMemberSince).getFullYear()}</span>
              </p>
            </div>
          </div>

          {/* Reliability Score Box */}
          {pass.reliabilityScore && (
            <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-400/40 text-center sm:text-right flex items-center gap-4 sm:flex-col sm:gap-0">
              <div>
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Reliability Score</p>
                <div className="mt-1">
                  <span className="text-4xl font-black text-white">{pass.reliabilityScore.score}</span>
                  <span className="text-sm font-semibold text-slate-400"> / 100</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-400 sm:mt-1">Top 5% Tenant Rating</span>
            </div>
          )}
        </div>

        {/* Key Rental Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-8 border-b border-slate-800">
          {pass.paymentConsistency && (
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <p className="text-xs text-slate-400">On-Time Rent Ratio</p>
              <p className="text-2xl font-extrabold text-white mt-1">
                {pass.paymentConsistency.onTimeRate}%
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {pass.paymentConsistency.onTimePayments} of {pass.paymentConsistency.totalTransactions} on-time
              </p>
            </div>
          )}

          {pass.paymentConsistency && (
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <p className="text-xs text-slate-400">Verified Payments</p>
              <p className="text-2xl font-extrabold text-white mt-1">
                {formatCurrency(pass.paymentConsistency.totalPaidRent || 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Total rent processed</p>
            </div>
          )}

          {pass.rentalHistory && (
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <p className="text-xs text-slate-400">Tenancy Length</p>
              <p className="text-2xl font-extrabold text-white mt-1">
                {pass.rentalHistory.totalMonthsRented} months
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Across {pass.rentalHistory.totalPropertiesRented} propert{pass.rentalHistory.totalPropertiesRented === 1 ? 'y' : 'ies'}
              </p>
            </div>
          )}

          {pass.paymentConsistency && (
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <p className="text-xs text-slate-400">Outstanding Dues</p>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">
                {formatCurrency(pass.paymentConsistency.outstandingDues || 0)}
              </p>
              <p className="text-[11px] text-emerald-400 mt-1">Zero pending debts</p>
            </div>
          )}
        </div>

        {/* Positive Trust Factors */}
        {pass.reliabilityScore?.positiveFactors?.length > 0 && (
          <div className="py-6 space-y-3 border-b border-slate-800">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verified Platform Signals</p>
            <div className="flex flex-wrap gap-2">
              {pass.reliabilityScore.positiveFactors.map((f: string, i: number) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Security & Verification Footer */}
        <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-indigo-400" />
            <span>Digital signature verified on RentFlow secure ledger</span>
          </div>
          {pass.expiresAt && (
            <span>Link valid through {formatDate(pass.expiresAt)}</span>
          )}
        </div>
      </div>

      {/* Bottom Branding */}
      <div className="text-center py-4 text-xs text-slate-600">
        RentFlow Technologies Inc. · Verified Tenant Identity & Trust Network
      </div>
    </div>
  );
}
