'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield, Sparkles, CheckCircle2, Copy, Check, Share2, Eye,
  Trash2, Clock, Calendar, Lock, Building2, UserCheck, AlertCircle,
  ExternalLink, Loader2, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function TenantRentPassPage() {
  const qc = useQueryClient();
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [shareLabel, setShareLabel] = useState('New Rental Application');
  const [expiryDays, setExpiryDays] = useState(30);
  const [privacy, setPrivacy] = useState({
    showScore: true,
    showRentalHistory: true,
    showKYCStatus: true,
    showPaymentConsistency: true,
  });

  // Queries
  const { data: rentPassRes, isLoading } = useQuery({
    queryKey: ['my-rentpass'],
    queryFn: () => apiClient.get('/api/v1/rentpass/me').then(r => r.data.data),
  });

  const { data: sharesRes } = useQuery({
    queryKey: ['my-rentpass-shares'],
    queryFn: () => apiClient.get('/api/v1/rentpass/shares').then(r => r.data.data),
  });

  // Mutations
  const { mutate: createShare, isPending: creatingShare } = useMutation({
    mutationFn: (data: any) => apiClient.post('/api/v1/rentpass/share', data).then(r => r.data.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['my-rentpass-shares'] });
      setShowShareModal(false);
      handleCopyLink(data.token);
    },
  });

  const { mutate: revokeShare } = useMutation({
    mutationFn: (shareId: string) => apiClient.delete(`/api/v1/rentpass/shares/${shareId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-rentpass-shares'] });
    },
  });

  const handleCopyLink = (token: string) => {
    const fullUrl = `${window.location.origin}/rentpass/view/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 3000);
  };

  const pass = rentPassRes;
  const shares = sharesRes ?? [];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse p-4">
        <div className="h-64 bg-muted rounded-3xl" />
        <div className="h-48 bg-muted rounded-2xl" />
      </div>
    );
  }

  if (!pass) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 font-bold text-xs shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> RentFlow Portable Passport
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">RentPass™</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your verified portable rental reputation across India
          </p>
        </div>

        <Button
          onClick={() => setShowShareModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2 rounded-xl shadow-lg shadow-indigo-500/20"
        >
          <Share2 className="h-4 w-4" /> Share RentPass
        </Button>
      </div>

      {/* ── DIGITAL RENTPASS PASSPORT CARD ───────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-indigo-50/40 to-purple-50/40 dark:from-[#0d0b24] dark:via-[#130f36] dark:to-[#0d0b24] border-2 border-indigo-200 dark:border-indigo-500/30 p-6 sm:p-8 text-foreground dark:text-white shadow-xl transition-all">
        {/* Glow background accent */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Passport Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-indigo-100 dark:border-indigo-500/20 relative z-10">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center font-extrabold text-2xl text-white shadow-lg shadow-indigo-500/20">
              {pass.tenant?.fullName?.[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{pass.tenant?.fullName}</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800 text-xs font-bold shadow-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> KYC Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-indigo-200 mt-1">
                Verified Resident · On RentFlow since {new Date(pass.tenant?.memberSince).getFullYear()}
              </p>
            </div>
          </div>

          {/* Reliability Score Ring */}
          <div className="flex items-center gap-4 bg-indigo-50/80 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-400/30 rounded-2xl p-3 px-5 self-start sm:self-auto shadow-xs">
            <div className="text-center">
              <span className="text-3xl font-black text-indigo-700 dark:text-white">{pass.reliabilityScore?.score}</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-indigo-300"> / 100</span>
            </div>
            <div className="border-l border-indigo-200 dark:border-indigo-500/30 pl-3">
              <p className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">Reliability Score</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold mt-0.5">Top Tier Rental Record</p>
            </div>
          </div>
        </div>

        {/* Verified Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-indigo-100 dark:border-indigo-500/20 relative z-10">
          <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/90 dark:border-white/10 shadow-xs">
            <p className="text-xs text-slate-500 dark:text-indigo-200 font-medium">On-Time Payments</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {pass.paymentConsistency?.onTimeRate}%
            </p>
            <p className="text-[11px] text-slate-500 dark:text-indigo-300 mt-1">
              {pass.paymentConsistency?.onTimePayments} / {pass.paymentConsistency?.totalTransactions} on-time
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/90 dark:border-white/10 shadow-xs">
            <p className="text-xs text-slate-500 dark:text-indigo-200 font-medium">Verified Rent Paid</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {formatCurrency(pass.paymentConsistency?.totalPaidRent ?? 0)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-indigo-300 mt-1">Total through platform</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/90 dark:border-white/10 shadow-xs">
            <p className="text-xs text-slate-500 dark:text-indigo-200 font-medium">Tenancy History</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {pass.rentalHistory?.totalMonthsRented} mo
            </p>
            <p className="text-[11px] text-slate-500 dark:text-indigo-300 mt-1">
              {pass.rentalHistory?.totalPropertiesRented} propert{pass.rentalHistory?.totalPropertiesRented === 1 ? 'y' : 'ies'} rented
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/90 dark:border-white/10 shadow-xs">
            <p className="text-xs text-slate-500 dark:text-indigo-200 font-medium">Outstanding Dues</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(pass.paymentConsistency?.outstandingDues ?? 0)}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-300 mt-1 font-semibold">Clean balance record</p>
          </div>
        </div>

        {/* Breakdown Factors & Positive Highlights */}
        <div className="pt-6 space-y-4 relative z-10">
          <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">Verified Trust Signals</p>
          <div className="flex flex-wrap gap-2">
            {(pass.reliabilityScore?.positiveFactors ?? []).map((factor: string, i: number) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-400/30 text-xs font-semibold text-indigo-900 dark:text-indigo-100 shadow-xs"
              >
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                {factor}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── ACTIVE SHARED RENTPASS LINKS ─────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Active Share Links</CardTitle>
              <CardDescription>Secure, expiring links you have generated for landlords & brokers</CardDescription>
            </div>
            <Button onClick={() => setShowShareModal(true)} variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" /> New Link
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {shares.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              You haven't generated any shareable links yet. Click "Share RentPass" to create one.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {shares.map((s: any) => {
                const isExpired = new Date() > new Date(s.expiresAt);
                return (
                  <div key={s._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-foreground">{s.label || 'Share Link'}</p>
                        {s.isRevoked ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/50 text-red-700">Revoked</span>
                        ) : isExpired ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700">Expired</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700">Active</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                        <span>Expires {formatDate(s.expiresAt)}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {s.viewsCount || 0} views</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!s.isRevoked && !isExpired && (
                        <>
                          <Button
                            onClick={() => handleCopyLink(s.token)}
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs h-8"
                          >
                            {copiedToken === s.token ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                            {copiedToken === s.token ? 'Copied' : 'Copy Link'}
                          </Button>
                          <Link href={`/rentpass/view/${s.token}`} target="_blank">
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button
                            onClick={() => {
                              if (confirm('Revoke this share link immediately?')) revokeShare(s._id);
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs"
                          >
                            Revoke
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── CREATE SHARE LINK MODAL ──────────────────────────── */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Share Your RentPass™</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Generate a secure, privacy-filtered link for landlords</p>
              </div>
              <button onClick={() => setShowShareModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                createShare({
                  label: shareLabel,
                  expiryDays,
                  ...privacy,
                });
              }}
              className="p-6 space-y-4"
            >
              <div className="space-y-1.5">
                <Label>Link Label / Purpose</Label>
                <Input
                  required
                  value={shareLabel}
                  onChange={e => setShareLabel(e.target.value)}
                  placeholder="e.g. Application for Green Heights"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Link Expiration</Label>
                <select
                  value={expiryDays}
                  onChange={e => setExpiryDays(+e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                >
                  <option value={7}>7 Days</option>
                  <option value={30}>30 Days (Recommended)</option>
                  <option value={90}>90 Days</option>
                </select>
              </div>

              {/* Privacy Controls */}
              <div className="pt-2 border-t border-border space-y-3">
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">Privacy Controls</p>

                {[
                  { key: 'showScore', label: 'Include Reliability Score & Rating' },
                  { key: 'showPaymentConsistency', label: 'Include On-Time Payment Percentage' },
                  { key: 'showRentalHistory', label: 'Include Months Rented & Properties count' },
                  { key: 'showKYCStatus', label: 'Include KYC Verification Badge' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center justify-between cursor-pointer text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <input
                      type="checkbox"
                      checked={(privacy as any)[key]}
                      onChange={e => setPrivacy(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="rounded border-border text-indigo-600"
                    />
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowShareModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creatingShare} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {creatingShare ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Generating...</> : 'Generate Secure Link'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
