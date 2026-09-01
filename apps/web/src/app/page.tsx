'use client';

import Link from 'next/link';
import {
  Building2, CheckCircle, Shield, Zap, Users, CreditCard,
  MessageSquare, BarChart3, ChevronRight, Star, ArrowRight,
  Bell, FileCheck, Lock, Check, X, Crown,
  Smartphone, Scale, TrendingUp, Globe,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-provider';

const LANDLORD_URL = process.env.NEXT_PUBLIC_LANDLORD_URL ?? 'http://localhost:3002';
const TENANT_URL = process.env.NEXT_PUBLIC_TENANT_URL ?? 'http://localhost:3004';

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#080810]/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}
          >
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">RentFlow</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-400">
          {[
            { label: 'Features', href: '#features' },
            { label: 'How it works', href: '#how-it-works' },
            { label: 'Pricing', href: '/pricing' },
            { label: 'Reviews', href: '#testimonials' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="hover:text-indigo-600 dark:hover:text-white transition-colors duration-200"
            >
              {label}
            </a>
          ))}
        </div>

        {/* CTA & ThemeToggle */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <a
            href={`${LANDLORD_URL}/login`}
            className="hidden sm:block text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Sign In
          </a>
          <a
            href={`${LANDLORD_URL}/register`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:scale-105 hover:brightness-110 shadow-sm"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-32 pb-24 px-4 overflow-hidden">
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-20 dark:opacity-20 blur-[120px] pointer-events-none bg-indigo-400 dark:bg-indigo-600" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full opacity-15 dark:opacity-10 blur-[100px] pointer-events-none bg-purple-400 dark:bg-purple-600" />

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(currentColor 1px,transparent 1px),linear-gradient(90deg,currentColor 1px,transparent 1px)', backgroundSize: '64px 64px' }} />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          {/* Kicker headline */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs sm:text-sm font-semibold bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 shadow-xs">
            <span>⚡</span> Replace the spreadsheets, notebooks, whatsapp and chaos with one place that actually keeps up
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-[5.2rem] font-black leading-[1.06] tracking-tight text-slate-900 dark:text-white">
            The Control Center{' '}
            <br className="hidden sm:block" />
            <span style={{ backgroundImage: 'linear-gradient(90deg,#6366f1 0%,#a855f7 50%,#f43f5e 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Your Properties Never Had
            </span>
          </h1>

          <p className="mt-8 text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Razorpay-powered rent collection, AI lease analysis, tenant management,
            and property analytics — built for Indian landlords &amp; PG owners.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={`${LANDLORD_URL}/register`}
              className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-white text-base font-bold transition-all hover:scale-105 shadow-xl"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
            >
              Get Started — From ₹99/mo <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href={`${TENANT_URL}/login`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all shadow-xs"
            >
              Tenant Portal <ChevronRight className="h-5 w-5" />
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            {['Plans start at ₹99/mo', 'Pay based on rental units', 'Cancel anytime'].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" /> {t}
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="mt-24 relative max-w-5xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl bg-slate-900">
            {/* Browser chrome */}
            <div className="px-4 py-3 flex items-center gap-3 bg-slate-800 dark:bg-[#0f0f1a] border-b border-slate-700 dark:border-white/10">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 rounded-md h-6 flex items-center justify-center max-w-[220px] mx-auto bg-slate-700/50 dark:bg-white/5">
                <span className="text-xs text-slate-300 dark:text-slate-500">landlord.rentflow.com</span>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-5 bg-slate-950 dark:bg-[#070712]">
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Properties', value: '12', color: '#818cf8', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)' },
                  { label: 'Managed Units', value: '47 / 75', color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)' },
                  { label: 'Collected', value: '₹2.4L', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)' },
                  { label: 'Pending', value: '3', color: '#fb923c', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.2)' },
                ].map(({ label, value, color, bg, border }) => (
                  <div key={label} className="rounded-xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
                    <p className="text-xs mb-1 text-slate-400">{label}</p>
                    <p className="text-xl sm:text-2xl font-black" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 rounded-xl p-4 bg-white/5 border border-white/10">
                  <p className="text-xs text-slate-400 mb-3">Revenue — Last 6 Months</p>
                  <div className="flex items-end gap-2 h-24">
                    {[45, 68, 52, 83, 61, 96].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-lg relative bg-indigo-500/20 h-full">
                        <div className="absolute bottom-0 left-0 right-0 rounded-t-lg"
                          style={{ height: `${h}%`, background: 'linear-gradient(180deg,#818cf8,#4f46e5)' }} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-4 bg-white/5 border border-white/10">
                  <p className="text-xs text-slate-400 mb-3">Pending Review</p>
                  {['Ravi Kumar', 'Priya Singh', 'Ahmed K.'].map((n) => (
                    <div key={n} className="flex items-center justify-between py-2 border-b border-white/5">
                      <p className="text-xs font-medium text-slate-300">{n}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-500/20 text-amber-300">Review</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cities */}
        <div className="mt-16 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 font-medium">Trusted by landlords &amp; PG owners across India</p>
          <div className="flex flex-wrap justify-center gap-6">
            {['Bengaluru', 'Pune', 'Hyderabad', 'Mumbai', 'Chennai', 'Delhi NCR', 'Ahmedabad'].map((c) => (
              <span key={c} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-sm font-medium">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
const features = [
  { icon: CreditCard, title: 'Razorpay Payments', badge: 'New', badgeColor: '#10b981', desc: 'Tenants pay via UPI, cards, or netbanking. Instant payment confirmation and PDF receipts auto-sent.' },
  { icon: Building2, title: 'Multi-Property & Rooms', badge: 'Popular', badgeColor: '#6366f1', desc: 'Bulk room creation by type — 10 Triple Sharing in one click. Full occupancy tracking across all properties.' },
  { icon: Scale, title: 'AI Lease Analyzer', badge: 'AI', badgeColor: '#8b5cf6', desc: 'Upload your lease PDF. Gemini AI spots risky clauses, explains them in plain English, and suggests fairer alternatives.' },
  { icon: Bell, title: 'Smart Notifications', badge: null, badgeColor: '', desc: 'Automated rent reminders, payment alerts, and complaint notifications. Never chase rent manually again.' },
  { icon: MessageSquare, title: 'Complaint Management', badge: null, badgeColor: '', desc: 'Tenants raise complaints with photos. Track resolution with a full timeline and priority labels.' },
  { icon: FileCheck, title: 'Document Vault', badge: 'Compliance', badgeColor: '#3b82f6', desc: 'Upload and view lease agreements, Aadhaar, ID proofs. Full bidirectional document vault per tenant.' },
  { icon: BarChart3, title: 'Revenue Analytics', badge: null, badgeColor: '', desc: '6-month revenue charts, occupancy rates, and payment health dashboards — all in real time.' },
  { icon: Shield, title: 'Audit Trail', badge: 'Security', badgeColor: '#64748b', desc: 'Every action logged with timestamp. Immutable audit log for compliance and dispute resolution.' },
];

function Features() {
  return (
    <section id="features" className="py-28 px-4 bg-slate-100/50 dark:bg-black/20 border-y border-slate-200/60 dark:border-white/5 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mb-4 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
            <Zap className="h-3.5 w-3.5" /> Everything included
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            All the tools to{' '}
            <span style={{ backgroundImage: 'linear-gradient(135deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              run your property
            </span>
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            From Razorpay-powered rent collection to AI lease analysis — everything in one platform.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, desc, badge, badgeColor }) => (
            <div
              key={title}
              className="p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800">
                  <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                {badge && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: `${badgeColor}15`, color: badgeColor, border: `1px solid ${badgeColor}30` }}>
                    {badge}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: '01', title: 'Add your property', desc: 'Create properties, add room types in bulk (e.g., 10 Triple Sharing rooms) and configure Razorpay payment collection.', icon: Building2, color: '#4f46e5' },
    { n: '02', title: 'Onboard tenants', desc: 'Add tenants — RentFlow auto-creates their portal account and emails login credentials instantly.', icon: Users, color: '#10b981' },
    { n: '03', title: 'Tenants pay via Razorpay', desc: 'Tenants pay via UPI, cards, or netbanking. Every payment is recorded and verified automatically.', icon: Smartphone, color: '#3b82f6' },
    { n: '04', title: 'Receipt auto-generated', desc: 'PDF receipt generated and emailed to both parties. Full audit trail maintained automatically.', icon: FileCheck, color: '#8b5cf6' },
  ];

  return (
    <section id="how-it-works" className="py-28 px-4 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">How RentFlow works</h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Up and running in under 10 minutes</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 items-stretch">
          {steps.map(({ n, title, desc, icon: Icon, color }) => (
            <div
              key={n}
              className="relative p-7 rounded-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-full group bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-3xl font-black font-mono tracking-tight text-slate-300 dark:text-white/10 group-hover:text-indigo-600 dark:group-hover:text-white/20 transition-colors">
                    {n}
                  </span>
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                  >
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg leading-snug">{title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
const plans = [
  {
    key: 'LITE', name: 'Lite', monthlyPrice: '₹99', annualPrice: '₹990', limit: 'Up to 5 units', desc: 'Perfect for individual landlords',
    icon: '🏠', highlight: false, color: '#64748b', isCustom: false,
    features: ['Up to 5 rental units', 'Unlimited properties', 'UPI & Razorpay payments', 'Digital tenant KYC', 'PDF receipts', 'Payment tracking'],
    missing: ['Bulk configurator', 'Availability calendar', 'Priority support'],
    cta: 'Get Started',
  },
  {
    key: 'STARTER', name: 'Starter', monthlyPrice: '₹299', annualPrice: '₹2,990', limit: 'Up to 25 units', desc: 'For small landlords with multiple units',
    icon: '🚀', highlight: false, color: '#3b82f6', isCustom: false,
    features: ['Up to 25 rental units', 'Unlimited properties', 'Everything in Lite', 'Bulk room configurator', 'Tenant applications', 'RentPass™ checks', 'Vacancy tracker'],
    missing: ['Availability calendar', 'Priority support'],
    cta: 'Start with Starter',
  },
  {
    key: 'GROWTH', name: 'Growth', monthlyPrice: '₹699', annualPrice: '₹6,990', limit: 'Up to 75 units', desc: 'For PG owners & growing businesses',
    icon: '📈', highlight: true, color: '#6366f1', isCustom: false,
    features: ['Up to 75 rental units', 'Unlimited properties', 'Everything in Starter', 'Room availability calendar', 'Marketplace listing', 'Utility billing', 'Revenue analytics', 'Priority chat support'],
    missing: [],
    cta: 'Choose Growth',
  },
  {
    key: 'PROFESSIONAL', name: 'Professional', monthlyPrice: '₹1,499', annualPrice: '₹14,990', limit: 'Up to 200 units', desc: 'For large PGs & property managers',
    icon: '🏢', highlight: false, color: '#8b5cf6', isCustom: false,
    features: ['Up to 200 rental units', 'Unlimited properties', 'Everything in Growth', 'AI lease analyzer', 'Custom branding', 'Financial reports', 'Manager roles', '24/7 support'],
    missing: [],
    cta: 'Get Professional',
  },
  {
    key: 'BUSINESS', name: 'Business', monthlyPrice: '₹2,999', annualPrice: '₹29,990', limit: 'Up to 500 units', desc: 'For large property operators',
    icon: '👑', highlight: false, color: '#f59e0b', isCustom: false,
    features: ['Up to 500 rental units', 'Unlimited properties', 'Everything in Professional', 'Multi-property dashboard', 'Tenant onboarding flows', 'Dedicated account manager', 'Webhook integrations'],
    missing: [],
    cta: 'Choose Business',
  },
  {
    key: 'ENTERPRISE', name: 'Enterprise', monthlyPrice: 'Custom', annualPrice: 'Custom', limit: '500+ units', desc: 'For institutional portfolios',
    icon: '🌐', highlight: false, color: '#10b981', isCustom: true,
    features: ['500+ rental units', 'Unlimited properties', 'Custom onboarding', 'Custom contracts & SLA', 'Dedicated support', 'Custom integrations', 'Enterprise reporting'],
    missing: [],
    cta: "Let's Talk",
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-28 px-4 bg-slate-100/60 dark:bg-black/20 border-t border-slate-200/60 dark:border-white/5 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mb-4 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
            <Crown className="h-3.5 w-3.5" /> Unit-based pricing
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Simple pricing that scales with{' '}
            <span style={{ backgroundImage: 'linear-gradient(135deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              your rental business
            </span>
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Pay based on the rental units you manage — not the number of properties you own.</p>

          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
            <span>🎉</span> Annual plan saves ~2 months — pay for 10, get 12!
          </div>
        </div>

        {/* What is a Unit explainer */}
        <div className="mb-12 rounded-2xl p-6 text-center bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
          <p className="text-sm text-slate-700 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            <strong className="text-indigo-600 dark:text-indigo-400">What is a unit?</strong> A unit is an individual rentable space that can be independently occupied by a tenant.
            A PG with 50 rooms = 50 units. An apartment building with 300 apartments = 300 units.
            Properties and units are different — your plan is based on units, not properties.{' '}
            <Link href="/pricing" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">Learn more &amp; FAQs →</Link>
          </p>
        </div>

        {/* Razorpay badge */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-4 px-6 py-3.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
              <Lock className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Secured by Razorpay</p>
              <p className="text-xs text-slate-500">PCI-DSS certified · UPI · Cards · Netbanking · Wallets</p>
            </div>
            <div className="flex gap-2 ml-2">
              {['UPI', 'Visa', 'MC', 'RuPay'].map((m) => (
                <span key={m} className="text-xs font-bold px-2 py-1 rounded-lg text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10">{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* 6 Plans in one line on desktop */}
        <div className="grid gap-3.5 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 items-stretch">
          {plans.map(({ key, name, monthlyPrice, annualPrice, limit, desc, icon, highlight, color, isCustom, features: f, missing, cta }) => (
            <div
              key={key}
              className={`relative rounded-2xl overflow-hidden transition-all duration-300 flex flex-col h-full bg-white dark:bg-white/[0.03] ${
                highlight
                  ? 'border-2 border-indigo-500 shadow-xl'
                  : 'border border-slate-200 dark:border-white/10 hover:shadow-lg'
              }`}
            >
              {highlight && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
              )}
              {/* Header */}
              <div className={`p-4 ${highlight ? 'bg-indigo-50/60 dark:bg-indigo-950/40' : 'bg-slate-50/50 dark:bg-white/[0.02]'}`}>
                {highlight && (
                  <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-xs">
                    ⭐ Popular
                  </span>
                )}
                <div className="text-2xl mb-1.5">{icon}</div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{name}</h3>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{limit}</p>

                {/* Monthly price */}
                <div className="mt-3">
                  {isCustom ? (
                    <span className="text-2xl font-black" style={{ color }}>Custom</span>
                  ) : (
                    <>
                      <span className="text-2xl font-black text-slate-900 dark:text-white">{monthlyPrice}</span>
                      <span className="text-slate-500 text-xs">/mo</span>
                    </>
                  )}
                </div>

                {/* Annual price */}
                {!isCustom && (
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Annual:</span>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-white">{annualPrice}</span>
                    <span className="text-[10px] px-1 py-0.2 rounded font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">~2 mo free</span>
                  </div>
                )}
                {isCustom && (
                  <div className="mt-1">
                    <span className="text-[11px] text-slate-500">Annual: Custom</span>
                  </div>
                )}

                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">{desc}</p>
              </div>
              {/* Features */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <ul className="space-y-2 mb-4 flex-1">
                  {f.map((feat) => (
                    <li key={feat} className="flex items-start gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 leading-tight">
                      <div className="h-3.5 w-3.5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                        <Check className="h-2 w-2 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                  {missing.map((feat) => (
                    <li key={feat} className="flex items-start gap-1.5 text-[11px] text-slate-400 dark:text-slate-600 leading-tight">
                      <div className="h-3.5 w-3.5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-slate-100 dark:bg-white/5">
                        <X className="h-2 w-2 text-slate-400 dark:text-slate-600" />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={isCustom ? 'mailto:sales@rentflow.in' : `${LANDLORD_URL}/register`}
                  className={`block w-full text-center py-2 rounded-xl font-bold text-xs transition-all hover:scale-105 ${
                    highlight
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                      : isCustom
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/15'
                  }`}
                >
                  {cta}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="mt-16 rounded-2xl p-8 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 shadow-xs">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 text-center">Plan comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10">
                  <th className="text-left py-3 text-slate-500 font-medium">Feature</th>
                  {plans.map((p) => (
                    <th key={p.key} className="text-center py-3 font-bold text-slate-800 dark:text-slate-300">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Unit Limit', '5', '25', '75', '200', '500', '500+'],
                  ['Properties', 'Unlimited', 'Unlimited', 'Unlimited', 'Unlimited', 'Unlimited', 'Unlimited'],
                  ['Monthly', '₹99', '₹299', '₹699', '₹1,499', '₹2,999', 'Custom'],
                  ['Annual (~2 mo free)', '₹990', '₹2,990', '₹6,990', '₹14,990', '₹29,990', 'Custom'],
                  ['Razorpay Payments', '✅', '✅', '✅', '✅', '✅', '✅'],
                  ['Availability Calendar', '❌', '❌', '✅', '✅', '✅', '✅'],
                  ['AI Lease Analyzer', '❌', '❌', '❌', '✅', '✅', '✅'],
                  ['Priority Support', 'Email', 'Email', 'Chat', '24/7', '24/7', 'Dedicated'],
                  ['Dedicated Manager', '❌', '❌', '❌', '❌', '✅', '✅'],
                ].map(([label, ...vals]) => (
                  <tr key={label} className="border-b border-slate-100 dark:border-white/5">
                    <td className="py-3 text-slate-600 dark:text-slate-400 font-medium">{label}</td>
                    {vals.map((v, i) => (
                      <td key={i} className="text-center py-3 font-medium text-slate-700 dark:text-slate-400">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
const testimonials = [
  { name: 'Rahul Sharma', role: 'Landlord · Bengaluru', stars: 5, text: 'The Razorpay integration is a game changer. Tenants pay via UPI and I get instant confirmation — no more disputes over screenshots or cash.' },
  { name: 'Priya Patel', role: 'PG Owner · Pune', stars: 5, text: 'Managing 3 PGs with 80+ tenants used to be chaos. Bulk room creation and the advanced tenant filters save me hours every week.' },
  { name: 'Vikram Nair', role: 'Property Manager · Hyderabad', stars: 5, text: 'The AI lease analyzer caught a hidden auto-renewal clause that would have locked my tenant in for 3 years. Absolutely worth the subscription.' },
];

function Testimonials() {
  return (
    <section id="testimonials" className="py-28 px-4 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex justify-center gap-0.5 mb-4">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />)}
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">Loved by landlords</h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Thousands of property owners managing smarter with RentFlow</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map(({ name, role, stars, text }) => (
            <div
              key={name}
              className="p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 shadow-xs hover:shadow-md"
            >
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-7 text-sm">&#8220;{text}&#8221;</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-indigo-600 to-purple-600">
                  {name[0]}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{name}</p>
                  <p className="text-xs text-slate-500">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTA() {
  return (
    <section className="py-24 px-4 relative overflow-hidden transition-colors">
      <div className="max-w-5xl mx-auto rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden border border-slate-200 dark:border-white/10 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 dark:from-[#0f0c24] dark:via-[#161336] dark:to-[#0d0a20] shadow-xl">
        {/* Background glow */}
        <div className="absolute inset-0 bg-radial-gradient from-indigo-500/15 to-transparent pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold mb-8 bg-indigo-100/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-xs">
            <TrendingUp className="h-3.5 w-3.5" /> Join 5,000+ landlords already on RentFlow
          </div>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
            Ready to simplify your{' '}
            <span style={{ backgroundImage: 'linear-gradient(90deg,#6366f1,#a855f7,#f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              rental business?
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Start today with Lite for just ₹99/month. Manage up to 5 units with Razorpay rent collection &amp; digital KYC.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`${LANDLORD_URL}/register`}
              className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-2xl text-white text-base sm:text-lg font-black transition-all hover:scale-105 shadow-xl"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
            >
              Get Started for ₹99/mo <ArrowRight className="h-5 w-5" />
            </a>
            <a
              href={`${TENANT_URL}/login`}
              className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-2xl text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 transition-all hover:bg-slate-50 dark:hover:bg-white/15 shadow-xs"
            >
              Tenant Portal
            </a>
          </div>
          <p className="mt-6 text-slate-500 dark:text-slate-400 text-xs sm:text-sm">Starting at ₹99/mo · Unlimited properties · Cancel anytime</p>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="py-20 px-4 bg-white dark:bg-[#050508] border-t border-slate-200 dark:border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-10 md:grid-cols-4 mb-14">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white">RentFlow</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Modern property management for Indian landlords. Secure, simple, and built for scale.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs">
              <div className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center">
                <Lock className="h-3 w-3 text-white" />
              </div>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Secured by Razorpay</span>
            </div>
          </div>
          {[
            {
              title: 'Product', links: [
                { label: 'Features', href: '/#features' },
                { label: 'Pricing', href: '/pricing' },
                { label: 'How it works', href: '/#how-it-works' },
                { label: 'Reviews', href: '/#testimonials' },
              ]
            },
            {
              title: 'Portals', links: [
                { label: 'Landlord Login', href: `${LANDLORD_URL}/login` },
                { label: 'Tenant Login', href: `${TENANT_URL}/login` },
                { label: 'Register', href: `${LANDLORD_URL}/register` },
              ]
            },
            {
              title: 'Company', links: [
                { label: 'About', href: '/about' },
                { label: 'Blog', href: '/blog' },
                { label: 'Privacy Policy', href: '/privacy-policy' },
                { label: 'Terms of Service', href: '/terms-of-service' },
              ]
            },
          ].map(({ title, links }) => (
            <div key={title}>
              <h3 className="text-slate-900 dark:text-white font-bold mb-5 text-sm tracking-widest uppercase">{title}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-200 dark:border-white/10">
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} RentFlow Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Globe className="h-3.5 w-3.5 text-emerald-600" />
            <span>256-bit SSL · India-hosted · DPDP Act compliant · PCI-DSS via Razorpay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen transition-colors duration-200">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}
