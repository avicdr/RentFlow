'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Crown, Check, Zap, Building2, BarChart3, Headphones,
  Globe, Users, Star, ShieldCheck, AlertCircle, Loader2, X,
  HelpCircle, Info, Sparkles,
} from 'lucide-react';
import apiClient from '@/lib/api-client';

declare global {
  interface Window { Razorpay: any; }
}

interface PlanItem {
  key: string;
  label: string;
  unitLimit: number;
  limitLabel: string;
  monthlyPrice: number;
  annualPrice: number;
  monthlyLabel: string;
  annualLabel: string;
  description: string;
  icon: string;
  gradient: string;
  ring: string;
  recommended?: boolean;
  isEnterprise?: boolean;
  features: string[];
}

const PLANS: PlanItem[] = [
  {
    key: 'LITE',
    label: 'Lite',
    unitLimit: 5,
    limitLabel: 'Up to 5 units',
    monthlyPrice: 99,
    annualPrice: 990,
    monthlyLabel: '₹99',
    annualLabel: '₹990',
    description: 'Perfect for individual landlords',
    icon: '🏠',
    gradient: 'from-slate-700 to-slate-900',
    ring: 'ring-slate-400',
    features: ['Up to 5 rental units', 'Unlimited properties', 'UPI & Razorpay payments', 'Digital tenant KYC', 'PDF receipts', 'Payment tracking'],
  },
  {
    key: 'STARTER',
    label: 'Starter',
    unitLimit: 25,
    limitLabel: 'Up to 25 units',
    monthlyPrice: 299,
    annualPrice: 2990,
    monthlyLabel: '₹299',
    annualLabel: '₹2,990',
    description: 'For small landlords with multiple units',
    icon: '🚀',
    gradient: 'from-blue-600 to-indigo-700',
    ring: 'ring-blue-500',
    features: ['Up to 25 rental units', 'Unlimited properties', 'Everything in Lite', 'Bulk room configurator', 'Tenant applications', 'RentPass™ checks', 'Vacancy tracker'],
  },
  {
    key: 'GROWTH',
    label: 'Growth',
    unitLimit: 75,
    limitLabel: 'Up to 75 units',
    monthlyPrice: 699,
    annualPrice: 6990,
    monthlyLabel: '₹699',
    annualLabel: '₹6,990',
    description: 'For PG owners & growing businesses',
    icon: '📈',
    gradient: 'from-indigo-600 to-violet-700',
    ring: 'ring-indigo-500',
    recommended: true,
    features: ['Up to 75 rental units', 'Unlimited properties', 'Everything in Starter', 'Room availability calendar', 'Marketplace listing', 'Utility billing', 'Revenue analytics', 'Priority chat support'],
  },
  {
    key: 'PROFESSIONAL',
    label: 'Professional',
    unitLimit: 200,
    limitLabel: 'Up to 200 units',
    monthlyPrice: 1499,
    annualPrice: 14990,
    monthlyLabel: '₹1,499',
    annualLabel: '₹14,990',
    description: 'For large PGs & property managers',
    icon: '🏢',
    gradient: 'from-violet-600 to-purple-800',
    ring: 'ring-violet-500',
    features: ['Up to 200 rental units', 'Unlimited properties', 'Everything in Growth', 'AI lease analyzer', 'Custom branding', 'Financial reports', 'Manager roles', '24/7 support'],
  },
  {
    key: 'BUSINESS',
    label: 'Business',
    unitLimit: 500,
    limitLabel: 'Up to 500 units',
    monthlyPrice: 2999,
    annualPrice: 29990,
    monthlyLabel: '₹2,999',
    annualLabel: '₹29,990',
    description: 'For large property operators',
    icon: '👑',
    gradient: 'from-amber-600 to-orange-700',
    ring: 'ring-amber-500',
    features: ['Up to 500 rental units', 'Unlimited properties', 'Everything in Professional', 'Multi-property dashboard', 'Tenant onboarding flows', 'Dedicated account manager', 'Webhook integrations'],
  },
  {
    key: 'ENTERPRISE',
    label: 'Enterprise',
    unitLimit: 999999,
    limitLabel: '500+ units',
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyLabel: 'Custom',
    annualLabel: 'Custom',
    description: 'For large property management portfolios',
    icon: '🌐',
    gradient: 'from-emerald-600 to-teal-800',
    ring: 'ring-emerald-500',
    isEnterprise: true,
    features: ['500+ rental units', 'Unlimited properties', 'Custom onboarding & SLA', 'Dedicated account manager', 'Custom integrations', 'Enterprise reporting', 'Custom contracts'],
  },
];

const COMPARISON = [
  { label: 'Unit Limit', values: ['5', '25', '75', '200', '500', '500+'], icon: Users },
  { label: 'Properties Allowed', values: ['Unlimited', 'Unlimited', 'Unlimited', 'Unlimited', 'Unlimited', 'Unlimited'], icon: Building2 },
  { label: 'Monthly Price', values: ['₹99', '₹299', '₹699', '₹1,499', '₹2,999', 'Custom'], icon: Crown },
  { label: 'Annual Price (~2 mo free)', values: ['₹990', '₹2,990', '₹6,990', '₹14,990', '₹29,990', 'Custom'], icon: Sparkles },
  { label: 'Availability Calendar', values: ['❌', '❌', '✅', '✅', '✅', '✅'], icon: BarChart3 },
  { label: 'AI Lease Analyzer', values: ['❌', '❌', '❌', '✅', '✅', '✅'], icon: Globe },
  { label: 'Priority Support', values: ['Email', 'Email', 'Chat', '24/7', '24/7', 'Dedicated'], icon: Headphones },
  { label: 'Dedicated Account Manager', values: ['❌', '❌', '❌', '❌', '✅', '✅'], icon: Star },
];

export default function SubscriptionPage() {
  const qc = useQueryClient();
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [processingTier, setProcessingTier] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [rzpReady, setRzpReady] = useState(false);
  const [showUnitExplainer, setShowUnitExplainer] = useState(false);

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
    const plan = PLANS.find((p) => p.key === tierKey);
    if (!plan) return;

    if (plan.isEnterprise) {
      window.location.href = 'mailto:sales@rentflow.in?subject=Enterprise%20Plan%20Inquiry';
      return;
    }

    setProcessingTier(tierKey);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      // 1. Create Razorpay order with billingCycle
      const { data: orderRes } = await apiClient.post('/api/v1/subscriptions/create-order', {
        tier: tierKey,
        billingCycle,
      });
      const order = orderRes.data;

      // 2. Open checkout
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: 'INR',
          name: 'RentFlow',
          description: `${plan.label} Plan — ${billingCycle === 'ANNUAL' ? 'Annual (Save ~2 mo)' : 'Monthly'}`,
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
              });
              resolve();
            } catch (e) { reject(e); }
          },
        });
        rzp.open();
      });

      await qc.invalidateQueries({ queryKey: ['subscription'] });
      setSuccessMsg(`🎉 You're now on the ${plan.label} plan (${billingCycle.toLowerCase()})!`);
    } catch (err: any) {
      if (err?.message !== 'cancelled') {
        setErrorMsg(err?.response?.data?.message ?? err?.message ?? 'Payment failed. Please try again.');
      }
    } finally {
      setProcessingTier(null);
    }
  }, [processingTier, billingCycle, qc]);

  const currentTier = sub?.tier ?? 'LITE';
  const managedUnits = sub?.managedUnits ?? 0;
  const unitLimit = sub?.unitLimit ?? 5;
  const unitsRemaining = sub?.unitsRemaining ?? Math.max(0, unitLimit - managedUnits);
  const totalProperties = sub?.totalProperties ?? 0;
  const activeTenants = sub?.activeTenants ?? 0;
  const currentPlan = PLANS.find((p) => p.key === currentTier) ?? PLANS[0];
  const isEnterpriseCurrent = currentTier === 'ENTERPRISE' || unitLimit >= 999999;
  const usagePct = isEnterpriseCurrent ? Math.min((managedUnits / (managedUnits + 10)) * 100, 90) : Math.min((managedUnits / unitLimit) * 100, 100);
  const atLimit = managedUnits >= unitLimit && !isEnterpriseCurrent;

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
                {currentPlan.icon}
              </div>
              <div>
                <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest">Current Plan</p>
                <h1 className="text-4xl font-black tracking-tight">{currentPlan.label}</h1>
              </div>
            </div>
            <p className="text-indigo-200/80 text-sm">{currentPlan.description}</p>
            <div className="mt-3 flex items-center gap-4 text-xs text-indigo-200">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" /> Secured by Razorpay
              </span>
              <span>•</span>
              <span>Billing: <strong className="text-white">{sub?.billingCycle === 'ANNUAL' ? 'Annual' : 'Monthly'}</strong></span>
              <span>•</span>
              <span>Properties: <strong className="text-white">{totalProperties}</strong></span>
              <span>•</span>
              <span>Active Tenants: <strong className="text-white">{activeTenants}</strong></span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-5xl font-black">
              {currentPlan.isEnterprise
                ? 'Custom'
                : sub?.billingCycle === 'ANNUAL'
                  ? currentPlan.annualLabel
                  : currentPlan.monthlyLabel}
            </p>
            <p className="text-indigo-300/70 text-sm mt-1">
              {currentPlan.isEnterprise ? 'Contact sales' : sub?.billingCycle === 'ANNUAL' ? 'per year (saves ~2 mo)' : 'per month'}
            </p>
          </div>
        </div>

        {/* Usage bar */}
        <div className="relative mt-8">
          <div className="flex justify-between items-center text-sm mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-indigo-200 font-medium">Managed Rental Units</span>
              <button
                onClick={() => setShowUnitExplainer(!showUnitExplainer)}
                className="text-indigo-300 hover:text-white transition-colors"
                title="What is a unit?"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
            <span className="font-bold">
              {managedUnits} / {isEnterpriseCurrent ? '500+' : unitLimit} Units Used
              {!isEnterpriseCurrent && ` (${unitsRemaining} Remaining)`}
            </span>
          </div>
          <div className="h-3 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${usagePct}%`,
                background: atLimit ? 'linear-gradient(90deg,#f97316,#ef4444)' : 'linear-gradient(90deg,#818cf8,#a78bfa)',
              }}
            />
          </div>
          {atLimit && (
            <p className="mt-2 text-xs text-yellow-300 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" /> Limit reached ({unitLimit}/{unitLimit} units) — upgrade your plan to add more rental units
            </p>
          )}
        </div>
      </div>

      {/* ── What is a Unit Explainer Card ─────────────────────── */}
      <div className="bg-card border border-indigo-100 dark:border-indigo-950/60 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center flex-shrink-0">
            <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-foreground text-base">Pay based on rental units — not properties</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>What is a unit?</strong> A unit is an individual rentable living space that can be independently occupied and managed by a tenant.
              For example, a PG with 50 rooms = 50 units. An apartment building with 300 apartments = 300 units.
              Whether you manage 1 property or 100 properties, your plan is based only on the total rental units you manage.
            </p>
            <div className="grid sm:grid-cols-3 gap-3 pt-2 text-xs text-muted-foreground">
              <div className="p-2.5 rounded-xl bg-muted border border-border">
                <span className="font-semibold text-foreground block mb-0.5">Independent House</span>
                1 House = 1 Unit
              </div>
              <div className="p-2.5 rounded-xl bg-muted border border-border">
                <span className="font-semibold text-foreground block mb-0.5">PG / Hostel</span>
                50 Rooms = 50 Units
              </div>
              <div className="p-2.5 rounded-xl bg-muted border border-border">
                <span className="font-semibold text-foreground block mb-0.5">Apartment Building</span>
                300 Flats = 300 Units
              </div>
            </div>
          </div>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Choose the plan for your inventory</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Scales with the number of rental units you manage</p>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center gap-2 p-1 bg-muted border border-border rounded-2xl">
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                billingCycle === 'MONTHLY'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('ANNUAL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'ANNUAL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Annual Billing</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/30 text-emerald-100 font-black">
                Save ~2 mo
              </span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-[440px] bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4 items-stretch">
            {PLANS.map((plan) => {
              const isCurrent = plan.key === currentTier;
              const isProcessing = processingTier === plan.key;
              const priceDisplay = billingCycle === 'ANNUAL' ? plan.annualLabel : plan.monthlyLabel;
              const periodDisplay = plan.isEnterprise ? '' : billingCycle === 'ANNUAL' ? '/year' : '/mo';

              return (
                <div
                  key={plan.key}
                  className={`relative rounded-2xl overflow-hidden flex flex-col transition-all duration-300 h-full ${
                    isCurrent
                      ? `ring-2 ${plan.ring} shadow-xl`
                      : 'border border-border hover:shadow-lg hover:-translate-y-0.5'
                  }`}
                >
                  {/* Gradient header */}
                  <div className={`bg-gradient-to-br ${plan.gradient} p-4 text-white`}>
                    {plan.recommended && !isCurrent && (
                      <span className="absolute top-2.5 right-2.5 text-[10px] font-bold bg-white/20 border border-white/30 text-white px-2 py-0.5 rounded-full">
                        ⭐ Popular
                      </span>
                    )}
                    {isCurrent && (
                      <span className="absolute top-2.5 right-2.5 text-[10px] font-bold bg-white/20 border border-white/30 text-white px-2 py-0.5 rounded-full">
                        ✓ Active
                      </span>
                    )}
                    <div className="text-2xl mb-2">{plan.icon}</div>
                    <h3 className="text-base font-extrabold">{plan.label}</h3>
                    <p className="text-white/70 text-[11px] font-semibold mt-0.5">{plan.limitLabel}</p>
                    <div className="mt-3">
                      <span className="text-2xl font-black">{priceDisplay}</span>
                      <span className="text-white/60 text-xs ml-1">{periodDisplay}</span>
                    </div>
                    {billingCycle === 'ANNUAL' && !plan.isEnterprise && (
                      <p className="text-emerald-300 text-[10px] font-medium mt-1">
                        ~2 mo free
                      </p>
                    )}
                  </div>

                  {/* Body */}
                  <div className="bg-card p-4 flex-1 flex flex-col justify-between">
                    <p className="text-[11px] text-muted-foreground mb-3 line-clamp-2">{plan.description}</p>
                    <ul className="space-y-2 mb-4 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-[11px] text-foreground leading-tight">
                          <div className="h-3.5 w-3.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="h-2 w-2 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <div className="w-full py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-semibold text-center">
                        Current Plan ✓
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(plan.key)}
                        disabled={!!processingTier || (!rzpReady && !plan.isEnterprise)}
                        className={`w-full py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5
                          bg-gradient-to-r ${plan.gradient} hover:opacity-90 active:scale-95 
                          transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isProcessing ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...</>
                        ) : plan.isEnterprise ? (
                          <><Crown className="h-3.5 w-3.5" /> Let's Talk</>
                        ) : (
                          <><Zap className="h-3.5 w-3.5" /> Upgrade to {plan.label}</>
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
      <div className="bg-card rounded-3xl border border-border shadow-xs overflow-hidden">
        <div className="p-6 border-b border-border bg-muted flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Full Feature Comparison</h2>
            <p className="text-muted-foreground text-sm mt-0.5">Plans tailored for rental inventories from 5 to 500+ units</p>
          </div>
          <Crown className="h-6 w-6 text-indigo-500" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-6 font-semibold text-muted-foreground min-w-[180px]">Feature</th>
                {PLANS.map((t) => (
                  <th
                    key={t.key}
                    className={`text-center py-4 px-3 font-bold ${
                      t.key === currentTier ? 'text-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/30' : 'text-foreground'
                    }`}
                  >
                    <span className="text-base">{t.icon}</span>
                    <div className="text-xs font-semibold">{t.label}</div>
                    <div className="text-[11px] font-normal text-muted-foreground mt-0.5">
                      {billingCycle === 'ANNUAL' ? t.annualLabel : t.monthlyLabel}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {COMPARISON.map((row) => (
                <tr key={row.label} className="hover:bg-muted/60 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2.5">
                      <row.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium text-foreground text-xs">{row.label}</span>
                    </div>
                  </td>
                  {row.values.map((v, i) => (
                    <td
                      key={i}
                      className={`text-center py-4 px-3 text-xs ${
                        PLANS[i].key === currentTier
                          ? 'bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-semibold'
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
        <div className="px-6 py-4 border-t border-border bg-muted text-xs text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            All plans include SSL encryption, automated PDF receipts, unlimited properties, and 24×7 uptime.
          </span>
          <span className="font-semibold text-foreground">No free plan · Starting at ₹99/mo</span>
        </div>
      </div>
    </div>
  );
}
