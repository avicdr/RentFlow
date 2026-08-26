'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Shield, CheckCircle2, AlertTriangle, TrendingUp, Sparkles,
  Check, Clock, Award, ArrowUpRight, ArrowDownRight, Info,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatDate, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function TenantReliabilityPage() {
  const { data: scoreRes, isLoading } = useQuery({
    queryKey: ['my-reliability-score'],
    queryFn: () => apiClient.get('/api/v1/reliability/me').then(r => r.data.data),
  });

  const scoreData = scoreRes;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse p-4">
        <div className="h-48 bg-muted rounded-3xl" />
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
    );
  }

  const score = scoreData?.currentScore ?? 85;
  const breakdown = scoreData?.breakdown ?? {};
  const events = scoreData?.events ?? [];

  const getScoreRating = (s: number) => {
    if (s >= 90) return { label: 'Excellent', color: 'text-emerald-600 dark:text-emerald-400', desc: 'Top tier tenant reliability record' };
    if (s >= 75) return { label: 'Very Good', color: 'text-indigo-600 dark:text-indigo-400', desc: 'Strong consistent rental record' };
    if (s >= 60) return { label: 'Fair', color: 'text-amber-600 dark:text-amber-400', desc: 'Average consistency with room for improvement' };
    return { label: 'Needs Improvement', color: 'text-red-500', desc: 'Multiple late payments or unverified documents' };
  };

  const rating = getScoreRating(score);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
            <Shield className="h-3.5 w-3.5" /> RentFlow Trust Engine
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">Tenant Reliability Score</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Transparent, factor-driven reliability score updated with every rental milestone
        </p>
      </div>

      {/* Hero Score Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border-2 border-indigo-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Current Reliability Rating</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-5xl sm:text-6xl font-black text-foreground">{score}</span>
            <span className="text-lg font-bold text-muted-foreground">/ 100</span>
          </div>
          <p className={cn('text-base font-bold mt-1', rating.color)}>{rating.label} · {rating.desc}</p>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 max-w-xs text-xs text-muted-foreground space-y-1.5">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-indigo-600" /> How It Works
          </p>
          <p>
            Your score recalculates automatically upon verified on-time payments, completed leases, and verified KYC documents.
          </p>
        </div>
      </div>

      {/* 5 Factors Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Score Breakdown Factors</CardTitle>
          <CardDescription>We believe trust shouldn't be a black box. Here is exactly how your score is weighed:</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Payment Consistency', weight: '35% weight', score: breakdown.paymentHistory ?? 90, desc: 'On-time rent clearing with zero chargebacks or bounced payments' },
            { label: 'KYC & Identity Verification', weight: '20% weight', score: breakdown.kycVerification ?? 80, desc: 'Government-verified Aadhaar / PAN and verified phone/email' },
            { label: 'Tenancy Stability', weight: '20% weight', score: breakdown.tenancyStability ?? 85, desc: 'Duration of consistent stay and completed lease agreements' },
            { label: 'Outstanding Dues Clearance', weight: '15% weight', score: breakdown.outstandingDues ?? 95, desc: 'Zero pending or overdue rent and utility balances' },
            { label: 'Agreement Compliance', weight: '10% weight', score: breakdown.agreementStatus ?? 90, desc: 'Active signed lease agreement and adherence to society norms' },
          ].map(f => (
            <div key={f.label} className="p-4 rounded-2xl bg-muted/40 border space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-lg font-bold text-foreground">{f.score}%</span>
                  <span className="text-[11px] text-muted-foreground block">{f.weight}</span>
                </div>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${f.score}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Positive Signals & Recommendations */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Positive Score Drivers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(scoreData?.positiveFactors ?? []).map((factor: string, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs text-foreground bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900">
                <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                <span>{factor}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-600">
              <Sparkles className="h-4 w-4" /> Tips to Boost Your Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 text-foreground">
              💡 Pay rent before the 5th of each month to build on-time streaks.
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 text-foreground">
              💡 Complete full Aadhaar verification under the KYC center.
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 text-foreground">
              💡 Clear utility bills promptly when issued by your landlord.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score History / Events Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Score Change History</CardTitle>
          <CardDescription>Log of score adjustments and verified rental events</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-center py-6 text-xs text-muted-foreground">No recent score change events.</p>
          ) : (
            <div className="divide-y divide-border">
              {events.map((e: any, idx: number) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${
                      e.delta > 0
                        ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700'
                        : e.delta < 0
                        ? 'bg-red-100 dark:bg-red-950/50 text-red-700'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {e.delta > 0 ? `+${e.delta}` : e.delta < 0 ? `${e.delta}` : '='}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{e.reason}</p>
                      <p className="text-muted-foreground">{formatDate(e.timestamp)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-foreground text-sm">{e.newScore}</span>
                    <span className="text-muted-foreground"> (was {e.previousScore})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
