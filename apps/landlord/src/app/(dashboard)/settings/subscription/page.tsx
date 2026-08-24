'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Crown, Check, Zap, Building2, BarChart3, Headphones,
  Globe, Users, Star, ShieldCheck, AlertCircle, Loader2, X,
} from 'lucide-react';
import apiClient from '@/lib/api-client';

declare global {
  interface Window { Razorpay: any; }
}

const TIERS = [
  {
    key: 'SOLO', label: 'Solo', price: 499, priceLabel: '₹499',
    limit: '1 Property', description: 'For individual landlords',
    icon: '🏠', gradient: 'from-slate-700 to-slate-900',
    ring: 'ring-slate-400',
    features: ['1 property', 'Up to 10 tenants', 'Razorpay payments', 'Payment tracking', 'PDF receipts'],
  },
  {
    key: 'GROWTH', label: 'Growth', price: 1499, priceLabel: '₹1,499',
    limit: '2–5 Properties', description: 'For growing portfolios',
    icon: '📈', gradient: 'from-indigo-500 to-indigo-700', recommended: true,
    ring: 'ring-indigo-500',
    features: ['Up to 5 properties', 'Unlimited tenants', 'Advanced analytics', 'Priority support', 'PDF receipts', 'KYC & DigiLocker'],
  },
  {
    key: 'SCALE', label: 'Scale', price: 2999, priceLabel: '₹2,999',
    limit: '5–10 Properties', description: 'Scale your business',
    icon: '🚀', gradient: 'from-violet-500 to-purple-700',
    ring: 'ring-violet-500',
    features: ['Up to 10 properties', 'Unlimited tenants', 'Full analytics suite', 'Priority support', 'API access', 'PDF receipts'],
  },
  {
    key: 'ENTERPRISE', label: 'Enterprise', price: 4999, priceLabel: '₹4,999',
    limit: 'Unlimited', description: 'For large-scale operations',
    icon: '👑', gradient: 'from-amber-500 to-orange-600',
    ring: 'ring-amber-500',
    features: ['Unlimited properties', 'Unlimited tenants', 'Full analytics suite', '24/7 support', 'API access', 'Dedicated manager'],
  },
];

const COMPARISON = [
  { label: 'Max Properties',    values: ['1', '5', '10', '∞'],          icon: Building2 },
  { label: 'Tenants',          values: ['10', '∞', '∞', '∞'],          icon: Users },
  { label: 'Analytics',        values: ['Basic', 'Advanced', 'Full', 'Full'], icon: BarChart3 },
  { label: 'Priority Support', values: ['❌', '✅', '✅', '24/7'],      icon: Headphones },
  { label: 'API Access',       values: ['❌', '❌', '✅', '✅'],        icon: Globe },
  { label: 'Dedicated Manager',values: ['❌', '❌', '❌', '✅'],        icon: Star },
];

export default function SubscriptionPage() {
  const qc = useQueryClient();
  const [processingTier, setProcessingTier] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [rzpReady, setRzpReady] = useState(false);

  useEffect(() => {
    if (window.Razorpay) { setRzpReady(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onload = () => setRzpReady(true);
    document.body.appendChild(s);
    return () => { /* script stays for session */ };
  }, []);

  const { data: sub, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => apiClient.get('/api/v1/subscriptions').then((r) => r.data.data),
  });

  const handleUpgrade = useCallback(async (tierKey: string) => {
    if (processingTier) return;
    setProcessingTier(tierKey);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      // 1. Create Razorpay order
      const { data: orderRes } = await apiClient.post('/api/v1/subscriptions/create-order', { tier: tierKey });
      const order = orderRes.data;
      const tierInfo = TIERS.find((t) => t.key === tierKey)!;

      // 2. Open checkout
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: 'INR',
          name: 'RentFlow',
          description: `${tierInfo.label} Plan — Monthly`,
          order_id: order.id,
          theme: { color: '#4f46e5' },
          prefill: {},
          modal: { ondismiss: () => reject(new Error('cancelled')) },
          handler: async (response: any) => {
            try {
              await apiClient.post('/api/v1/subscriptions/verify-payment', {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                tier: tierKey,
              });
              resolve();
            } catch (e) { reject(e); }
          },
        });
        rzp.open();
      });

      await qc.invalidateQueries({ queryKey: ['subscription'] });
      setSuccessMsg(`🎉 You're now on the ${tierInfo.label} plan!`);
    } catch (err: any) {
      if (err?.message !== 'cancelled') {
        setErrorMsg(err?.response?.data?.message ?? err?.message ?? 'Payment failed. Please try again.');
      }
    } finally {
      setProcessingTier(null);
    }
  }, [processingTier, qc]);

  const currentTier = sub?.tier ?? 'SOLO';
  const currentCount = sub?.currentCount ?? 0;
  const currentLimit = sub?.limit ?? 1;
  const currentTierInfo = TIERS.find((t) => t.key === currentTier);
  const usagePct = currentLimit === 999 ? Math.min((currentCount / (currentCount + 1)) * 100, 90) : Math.min((currentCount / currentLimit) * 100, 100);
  const atLimit = currentCount >= currentLimit && currentLimit !== 999;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-16">
      {/* ── Current Plan Hero ─────────────────────────────────── */}
      <div
        className="relative rounded-3xl overflow-hidden p-8 md:p-10 text-white"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4c1d95 100%)' }}
      >
        {/* decorative blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-indigo-400/10 translate-y-1/3 -translate-x-1/6 pointer-events-none" />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-14 w-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-3xl">
                {currentTierInfo?.icon ?? '🏠'}
              </div>
              <div>
                <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest">Current Plan</p>
                <h1 className="text-4xl font-black tracking-tight">{currentTierInfo?.label ?? currentTier}</h1>
              </div>
            </div>
            <p className="text-indigo-200/80 text-sm">{currentTierInfo?.description}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Secured by Razorpay
            </div>
          </div>
          <div className="text-right">
            <p className="text-6xl font-black">{currentTierInfo?.priceLabel ?? '₹0'}</p>
            <p className="text-indigo-300/70 text-sm mt-1">per month + GST</p>
          </div>
        </div>

        {/* Usage bar */}
        <div className="relative mt-8">
          <div className="flex justify-between text-sm mb-2.5">
            <span className="text-indigo-200">Property usage</span>
            <span className="font-bold">
              {currentCount} / {currentLimit === 999 ? '∞' : currentLimit}
            </span>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${usagePct}%`, background: atLimit ? 'linear-gradient(90deg,#f97316,#ef4444)' : 'linear-gradient(90deg,#818cf8,#a78bfa)' }}
            />
          </div>
          {atLimit && (
            <p className="mt-2 text-xs text-yellow-300 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" /> Limit reached — upgrade to add more properties
            </p>
          )}
        </div>
      </div>

      {/* ── Toast messages ────────────────────────────────────── */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <ShieldCheck className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          <p className="text-emerald-800 text-sm font-medium flex-1">{successMsg}</p>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-emerald-600"><X className="h-4 w-4" /></button>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-800 text-sm font-medium flex-1">{errorMsg}</p>
          <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* ── Plan Cards ───────────────────────────────────────── */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="text-2xl font-bold text-foreground">Upgrade your plan</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted border border-border rounded-full px-4 py-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            All payments secured by Razorpay
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-[420px] bg-muted rounded-3xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TIERS.map((tier) => {
              const isCurrent = tier.key === currentTier;
              const isProcessing = processingTier === tier.key;
              return (
                <div
                  key={tier.key}
                  className={`relative rounded-3xl overflow-hidden flex flex-col transition-all duration-300 ${
                    isCurrent
                      ? `ring-2 ${tier.ring} shadow-2xl`
                      : 'border border-border hover:shadow-xl hover:-translate-y-1'
                  }`}
                >
                  {/* Gradient header */}
                  <div className={`bg-gradient-to-br ${tier.gradient} p-6 text-white`}>
                    {tier.recommended && !isCurrent && (
                      <span className="absolute top-4 right-4 text-xs font-bold bg-white/20 border border-white/30 text-white px-2.5 py-1 rounded-full">
                        ⭐ Popular
                      </span>
                    )}
                    {isCurrent && (
                      <span className="absolute top-4 right-4 text-xs font-bold bg-white/20 border border-white/30 text-white px-2.5 py-1 rounded-full">
                        ✓ Active
                      </span>
                    )}
                    <div className="text-4xl mb-3">{tier.icon}</div>
                    <h3 className="text-xl font-extrabold">{tier.label}</h3>
                    <p className="text-white/60 text-xs mt-0.5">{tier.limit}</p>
                    <div className="mt-4">
                      <span className="text-4xl font-black">{tier.priceLabel}</span>
                      <span className="text-white/50 text-sm">/mo</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="bg-card p-6 flex-1 flex flex-col">
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                          <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <Check className="h-3 w-3 text-emerald-600" />
                          </div>
                          {f}
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <div className="w-full py-3 rounded-2xl bg-muted text-muted-foreground text-sm font-semibold text-center">
                        Current Plan ✓
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(tier.key)}
                        disabled={!!processingTier || !rzpReady}
                        className={`w-full py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2
                          bg-gradient-to-r ${tier.gradient} hover:opacity-90 active:scale-95 
                          transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isProcessing ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                        ) : (
                          <><Zap className="h-4 w-4" /> Upgrade to {tier.label}</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Feature Comparison ───────────────────────────────── */}
      <div className="bg-card rounded-3xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-muted flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Full Feature Comparison</h2>
            <p className="text-muted-foreground text-sm mt-0.5">See everything included in each plan</p>
          </div>
          <Crown className="h-6 w-6 text-indigo-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground min-w-[180px]">Feature</th>
                {TIERS.map((t) => (
                  <th
                    key={t.key}
                    className={`text-center py-4 px-4 font-bold ${
                      t.key === currentTier ? 'text-indigo-600 bg-indigo-50/60' : 'text-foreground'
                    }`}
                  >
                    <span className="text-lg">{t.icon}</span>
                    <div className="text-xs font-normal text-muted-foreground mt-0.5">{t.priceLabel}/mo</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {COMPARISON.map((row) => (
                <tr key={row.label} className="hover:bg-muted/60 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2.5">
                      <row.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-foreground">{row.label}</span>
                    </div>
                  </td>
                  {row.values.map((v, i) => (
                    <td
                      key={i}
                      className={`text-center py-4 px-4 ${
                        TIERS[i].key === currentTier
                          ? 'bg-indigo-50/60 text-indigo-700 font-semibold'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t bg-muted text-xs text-muted-foreground flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          All plans include SSL encryption, automated PDF receipts, and 24×7 platform uptime. Billed monthly. Cancel anytime.
        </div>
      </div>
    </div>
  );
}
