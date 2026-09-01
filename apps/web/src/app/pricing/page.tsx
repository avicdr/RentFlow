'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Crown, Check, X, Building2, ArrowRight, ShieldCheck, Lock,
  ChevronDown, ChevronUp, HelpCircle, Sparkles, BedDouble,
  Layers, Users, Star,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-provider';

const LANDLORD_URL = process.env.NEXT_PUBLIC_LANDLORD_URL ?? 'http://localhost:3002';

const PLANS = [
  {
    key: 'LITE',
    name: 'Lite',
    unitLimit: 'Up to 5 units',
    monthlyPrice: '₹99',
    annualPrice: '₹990',
    desc: 'Perfect for individual landlords trying RentFlow',
    icon: '🏠',
    color: '#64748b',
    highlight: false,
    isCustom: false,
    features: [
      'Up to 5 rental units',
      'Unlimited properties',
      'UPI & Razorpay rent collection',
      'Digital tenant KYC',
      'Automated PDF rent receipts',
      'Payment tracking & history',
      'Standard email support',
    ],
    missing: ['Bulk room configurator', 'Room availability calendar', 'Priority support'],
    cta: 'Get Started with Lite',
  },
  {
    key: 'STARTER',
    name: 'Starter',
    unitLimit: 'Up to 25 units',
    monthlyPrice: '₹299',
    annualPrice: '₹2,990',
    desc: 'For small landlords with multiple rental units',
    icon: '🚀',
    color: '#3b82f6',
    highlight: false,
    isCustom: false,
    features: [
      'Up to 25 rental units',
      'Unlimited properties',
      'Everything in Lite',
      'Bulk room configurator',
      'Tenant application portal',
      'RentPass™ tenant checks',
      'Real-time vacancy tracker',
      'Email & ticket support',
    ],
    missing: ['Room availability calendar', 'Priority chat support'],
    cta: 'Start with Starter',
  },
  {
    key: 'GROWTH',
    name: 'Growth',
    unitLimit: 'Up to 75 units',
    monthlyPrice: '₹699',
    annualPrice: '₹6,990',
    desc: 'For PG owners & growing rental businesses',
    icon: '📈',
    color: '#6366f1',
    highlight: true,
    isCustom: false,
    features: [
      'Up to 75 rental units',
      'Unlimited properties',
      'Everything in Starter',
      'Room availability calendar',
      'Public property listing page',
      'Utility & sub-meter billing',
      'Revenue & occupancy analytics',
      'Priority chat support',
    ],
    missing: ['AI lease analyzer', 'Dedicated manager'],
    cta: 'Choose Growth',
  },
  {
    key: 'PROFESSIONAL',
    name: 'Professional',
    unitLimit: 'Up to 200 units',
    monthlyPrice: '₹1,499',
    annualPrice: '₹14,990',
    desc: 'For large PGs & professional property managers',
    icon: '🏢',
    color: '#8b5cf6',
    highlight: false,
    isCustom: false,
    features: [
      'Up to 200 rental units',
      'Unlimited properties',
      'Everything in Growth',
      'AI lease agreement analyzer',
      'Custom landlord branding',
      'Advanced financial reports',
      'Manager & staff roles',
      '24/7 priority support',
    ],
    missing: ['Dedicated account manager'],
    cta: 'Get Professional',
  },
  {
    key: 'BUSINESS',
    name: 'Business',
    unitLimit: 'Up to 500 units',
    monthlyPrice: '₹2,999',
    annualPrice: '₹29,990',
    desc: 'For large property operators & hostel chains',
    icon: '👑',
    color: '#f59e0b',
    highlight: false,
    isCustom: false,
    features: [
      'Up to 500 rental units',
      'Unlimited properties',
      'Everything in Professional',
      'Multi-property master dashboard',
      'Custom tenant onboarding flows',
      'Dedicated account manager',
      'Webhook & API integrations',
      'SLA guarantee',
    ],
    missing: [],
    cta: 'Choose Business',
  },
  {
    key: 'ENTERPRISE',
    name: 'Enterprise',
    unitLimit: '500+ units',
    monthlyPrice: 'Custom',
    annualPrice: 'Custom',
    desc: 'For institutional portfolios & enterprise operators',
    icon: '🌐',
    color: '#10b981',
    highlight: false,
    isCustom: true,
    features: [
      '500+ rental units',
      'Unlimited properties',
      'Custom onboarding & migration',
      'Custom contracts & SLAs',
      'Dedicated support engineering',
      'Custom integrations & webhooks',
      'Enterprise audit logs & compliance',
    ],
    missing: [],
    cta: "Let's Talk",
  },
];

const FAQS = [
  {
    q: 'What is a unit?',
    a: 'A unit is an individual rentable space that can be independently occupied and managed by a tenant. For example, a PG with 50 rentable rooms has 50 units, while an apartment building with 300 individually rentable apartments has 300 units.',
  },
  {
    q: 'Are properties included in my plan limit?',
    a: 'No. RentFlow plans are based entirely on rental units, not properties. You can manage unlimited properties as long as your total number of managed units across all properties remains within your plan limit.',
  },
  {
    q: 'What happens if I have a large property?',
    a: 'That is exactly what RentFlow’s unit-based pricing is designed for! A property with 300 individually rentable units counts as 300 units (requiring the Business plan), regardless of whether it is technically one single building.',
  },
  {
    q: 'Do vacant units count toward my subscription limit?',
    a: 'Yes. Managed rental units count toward your plan even when they are currently vacant. The subscription limit represents your total managed rental inventory created in RentFlow.',
  },
  {
    q: 'Can I manage multiple properties on one account?',
    a: 'Yes, absolutely! Whether you manage 1 property with 20 units or 10 properties with 2 units each, both require the Starter plan (up to 25 units). Property count never forces you into a higher tier.',
  },
  {
    q: 'How does annual billing work?',
    a: 'Annual billing provides approximately 2 months free compared to paying monthly (pay for 10 months, get 12 months of service). For example, Starter is ₹299/mo or ₹2,990/year.',
  },
  {
    q: 'Is there a free plan?',
    a: 'RentFlow does not offer a free tier. Our most affordable plan is Lite at ₹99/month, allowing you to manage up to 5 rental units with full Razorpay rent collection, digital KYC, and PDF receipts.',
  },
  {
    q: 'How does downgrading work?',
    a: 'If you want to switch to a lower plan, you must first reduce your managed units in RentFlow so your total active units do not exceed the target plan limit. We never delete your data automatically.',
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070710] text-slate-900 dark:text-white transition-colors duration-200">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="border-b border-slate-200/80 dark:border-white/10 px-6 py-4 sticky top-0 backdrop-blur-xl z-50 bg-white/80 dark:bg-[#070710]/80 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">RentFlow</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium">
              Home
            </Link>
            <a
              href={`${LANDLORD_URL}/login`}
              className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Sign In
            </a>
            <a
              href={`${LANDLORD_URL}/register`}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 shadow-sm"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
            >
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero Section ───────────────────────────────────────── */}
      <section className="pt-20 pb-16 px-4 text-center max-w-5xl mx-auto">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mb-6 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
          <Crown className="h-3.5 w-3.5" /> Unit-Based Pricing
        </span>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
          Simple pricing that scales with{' '}
          <span style={{ backgroundImage: 'linear-gradient(135deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            your rental business
          </span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
          Pay based on the rental units you manage — not the number of properties you own.
          Whether you manage one property or one hundred, your plan stays fair and transparent.
        </p>

        {/* Billing Toggle */}
        <div className="mt-10 inline-flex items-center gap-3 p-1.5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xs">
          <button
            onClick={() => setBillingCycle('MONTHLY')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              billingCycle === 'MONTHLY'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('ANNUAL')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              billingCycle === 'ANNUAL'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Annual Billing</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black">
              Save ~2 months
            </span>
          </button>
        </div>
      </section>

      {/* ── Plans Grid (6 in one line on desktop) ───────────────── */}
      <section className="py-8 px-4 max-w-7xl mx-auto">
        <div className="grid gap-3.5 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 items-stretch">
          {PLANS.map((plan) => {
            const price = billingCycle === 'ANNUAL' ? plan.annualPrice : plan.monthlyPrice;
            const period = plan.isCustom ? '' : billingCycle === 'ANNUAL' ? '/year' : '/mo';

            return (
              <div
                key={plan.key}
                className={`relative rounded-2xl overflow-hidden transition-all duration-300 flex flex-col h-full bg-white dark:bg-white/[0.03] ${
                  plan.highlight
                    ? 'border-2 border-indigo-500 shadow-xl'
                    : 'border border-slate-200 dark:border-white/10 hover:shadow-lg'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
                )}

                {/* Header */}
                <div className={`p-4 ${plan.highlight ? 'bg-indigo-50/60 dark:bg-indigo-950/40' : 'bg-slate-50/50 dark:bg-white/[0.02]'}`}>
                  {plan.highlight && (
                    <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-xs">
                      ⭐ Popular
                    </span>
                  )}
                  <div className="text-2xl mb-2">{plan.icon}</div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{plan.name}</h3>
                  <div className="inline-block mt-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40">
                    {plan.unitLimit}
                  </div>

                  <div className="mt-4">
                    {plan.isCustom ? (
                      <span className="text-2xl font-black" style={{ color: plan.color }}>Custom</span>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">{price}</span>
                        <span className="text-slate-500 text-xs">{period}</span>
                      </div>
                    )}
                  </div>

                  {billingCycle === 'ANNUAL' && !plan.isCustom && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                      🎉 Saves ~2 months
                    </p>
                  )}

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 leading-relaxed line-clamp-2">{plan.desc}</p>
                </div>

                {/* Body / Features */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <ul className="space-y-2 mb-4 flex-1">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 leading-tight">
                        <div className="h-3.5 w-3.5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                          <Check className="h-2 w-2 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span>{feat}</span>
                      </li>
                    ))}
                    {plan.missing.map((feat) => (
                      <li key={feat} className="flex items-start gap-1.5 text-[11px] text-slate-400 dark:text-slate-600 leading-tight">
                        <div className="h-3.5 w-3.5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-slate-100 dark:bg-white/5">
                          <X className="h-2 w-2 text-slate-400 dark:text-slate-600" />
                        </div>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={plan.isCustom ? 'mailto:sales@rentflow.in?subject=Enterprise%20Plan%20Inquiry' : `${LANDLORD_URL}/register`}
                    className={`block w-full text-center py-2.5 rounded-xl font-bold text-xs transition-all hover:scale-105 ${
                      plan.highlight
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                        : plan.isCustom
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/15'
                    }`}
                  >
                    {plan.cta}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── What is a Unit Deep Dive ───────────────────────────── */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <div className="rounded-3xl p-8 md:p-10 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-indigo-500/20 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center">
              <BedDouble className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">What exactly is a "Unit"?</h2>
          </div>

          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-6">
            <strong className="text-indigo-600 dark:text-indigo-400">A Unit is an individual rentable living space that can be independently occupied and managed by a tenant.</strong>{' '}
            A Property is the physical location (e.g. "Sunshine PG"). Units are the rentable spaces inside it.
            You are charged according to the rental units you manage — not the number of properties you own.
          </p>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { title: 'Independent House', desc: '1 property · 1 rentable house = 1 Unit', icon: '🏡' },
              { title: 'Apartment Building', desc: '1 building · 300 rentable flats = 300 Units', icon: '🏢' },
              { title: 'PG / Co-Living', desc: '1 property · 50 rentable rooms = 50 Units', icon: '🛏️' },
              { title: 'Multiple Properties', desc: '5 properties · 10 units total = 10 Units (Starter)', icon: '🏘️' },
              { title: 'Shared Tenancy', desc: '3 people sharing 1 room together = 1 Unit', icon: '👥' },
              { title: 'Vacant Units', desc: 'Vacant units count toward managed inventory', icon: '🔑' },
            ].map((ex) => (
              <div key={ex.title} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10">
                <div className="text-2xl mb-2">{ex.icon}</div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{ex.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{ex.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security & Razorpay Banner ─────────────────────────── */}
      <section className="py-6 px-4 max-w-4xl mx-auto">
        <div className="p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Secured by Razorpay</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                PCI-DSS Level 1 certified · UPI, Debit/Credit Cards, Netbanking &amp; Wallets supported.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {['UPI', 'Visa', 'Mastercard', 'RuPay', 'Netbanking'].map((m) => (
              <span key={m} className="text-xs font-semibold px-2.5 py-1 rounded-xl text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10">
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ Section ────────────────────────────────────────── */}
      <section className="py-20 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Got questions?</span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-2">Frequently Asked Questions</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Everything you need to know about RentFlow unit-based pricing</p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={faq.q}
                className="rounded-2xl overflow-hidden transition-colors bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 shadow-xs"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 dark:text-white text-sm"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────── */}
      <section className="py-16 px-4 max-w-5xl mx-auto pb-24">
        <div className="rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden border border-slate-200 dark:border-white/10 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 dark:from-[#0f0c24] dark:via-[#161336] dark:to-[#0d0a20] shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            Ready to streamline your rental business?
          </h2>
          <p className="text-slate-600 dark:text-indigo-200 text-sm mt-3 max-w-xl mx-auto">
            Get started today with Lite for just ₹99/month. Manage up to 5 rental units with Razorpay rent collection &amp; digital KYC.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={`${LANDLORD_URL}/register`}
              className="px-8 py-3.5 rounded-2xl bg-indigo-600 dark:bg-white text-white dark:text-indigo-900 font-extrabold text-sm hover:bg-indigo-700 dark:hover:bg-indigo-50 transition-all shadow-xl hover:scale-105"
            >
              Get Started for ₹99/mo →
            </a>
            <a
              href="mailto:sales@rentflow.in?subject=Enterprise%20Plan%20Inquiry"
              className="px-6 py-3.5 rounded-2xl border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white font-semibold text-sm hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              Let's Talk
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-white/10 py-8 px-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} RentFlow Technologies Pvt. Ltd. All rights reserved. Unit-based pricing for modern landlords.</p>
      </footer>
    </div>
  );
}
