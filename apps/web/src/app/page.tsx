import Link from 'next/link';
import {
  Building2, CheckCircle, Shield, Zap, Users, CreditCard,
  MessageSquare, BarChart3, ChevronRight, Star, ArrowRight,
  Bell, FileCheck, Lock, Check, X, Crown,
  Smartphone, Scale, TrendingUp, Globe,
} from 'lucide-react';

const LANDLORD_URL = process.env.NEXT_PUBLIC_LANDLORD_URL ?? 'http://localhost:3002';
const TENANT_URL   = process.env.NEXT_PUBLIC_TENANT_URL   ?? 'http://localhost:3004';

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        backdropFilter: 'blur(24px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
        backgroundColor: 'rgba(8,8,16,0.80)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 4px 14px rgba(99,102,241,0.5)' }}
          >
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-extrabold text-white tracking-tight">RentFlow</span>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
          {[
            { label: 'Features',    href: '#features' },
            { label: 'How it works',href: '#how-it-works' },
            { label: 'Pricing',     href: '#pricing' },
            { label: 'Reviews',     href: '#testimonials' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="hover:text-white transition-colors duration-200"
            >
              {label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <a
            href={`${LANDLORD_URL}/login`}
            className="hidden sm:block text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Sign In
          </a>
          <a
            href={`${LANDLORD_URL}/register`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:scale-105 hover:brightness-110"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}
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
    <section
      className="relative min-h-screen flex items-center pt-32 pb-24 px-4 overflow-hidden"
    >
      {/* Layered background */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg,#050508 0%,#0d0b1e 45%,#100a20 100%)' }} />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
        style={{ background: 'radial-gradient(circle,#4f46e5,transparent 70%)' }} />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full opacity-10 blur-[100px]"
        style={{ background: 'radial-gradient(circle,#7c3aed,transparent 70%)' }} />

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.035]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          <h1 className="text-5xl sm:text-6xl lg:text-[5.5rem] font-black leading-[1.04] tracking-tight text-white">
            Collect rent.{' '}
            <br className="hidden sm:block" />
            <span style={{ backgroundImage: 'linear-gradient(90deg,#818cf8 0%,#c084fc 50%,#fb7185 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Stay in control.
            </span>
          </h1>

          <p className="mt-8 text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Razorpay-powered rent collection, AI lease analysis, tenant management,
            and property analytics — built for Indian landlords &amp; PG owners.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={`${LANDLORD_URL}/register`}
              className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-white text-base font-bold transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 20px 60px rgba(79,70,229,0.4)' }}
            >
              Start free — 14 days <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href={`${TENANT_URL}/login`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-semibold text-slate-300 hover:text-white transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}
            >
              Tenant Portal <ChevronRight className="h-5 w-5" />
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            {['14-day free trial', 'No credit card required', 'Cancel anytime'].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" /> {t}
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="mt-24 relative max-w-5xl mx-auto">
          {/* Glow behind mockup */}
          <div className="absolute -inset-8 rounded-full blur-3xl opacity-20"
            style={{ background: 'radial-gradient(ellipse,#4f46e5,transparent 70%)' }} />

          <div className="relative rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)' }}>
            {/* Browser chrome */}
            <div className="px-4 py-3 flex items-center gap-3" style={{ background: '#0f0f1a', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="flex-1 rounded-md h-6 flex items-center justify-center max-w-[220px] mx-auto"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <span className="text-xs text-slate-600">landlord.rentflow.com</span>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-5" style={{ background: '#070712' }}>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Properties', value: '12', color: '#818cf8', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)' },
                  { label: 'Tenants',    value: '47', color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)' },
                  { label: 'Collected', value: '₹2.4L', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)' },
                  { label: 'Pending',   value: '3',    color: '#fb923c', bg: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.2)' },
                ].map(({ label, value, color, bg, border }) => (
                  <div key={label} className="rounded-xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
                    <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
                    <p className="text-2xl font-black" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-xs text-slate-600 mb-3">Revenue — Last 6 Months</p>
                  <div className="flex items-end gap-2 h-24">
                    {[45, 68, 52, 83, 61, 96].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-lg relative" style={{ background: 'rgba(99,102,241,0.15)', height: '100%' }}>
                        <div className="absolute bottom-0 left-0 right-0 rounded-t-lg transition-all"
                          style={{ height: `${h}%`, background: 'linear-gradient(180deg,#818cf8,#4f46e5)' }} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-xs text-slate-600 mb-3">Pending Review</p>
                  {['Ravi Kumar', 'Priya Singh', 'Ahmed K.'].map((n) => (
                    <div key={n} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <p className="text-xs font-medium text-slate-400">{n}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(251,146,60,0.15)', color: '#fb923c' }}>Review</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cities */}
        <div className="mt-16 text-center">
          <p className="text-sm text-slate-600 mb-5">Trusted by landlords across India</p>
          <div className="flex flex-wrap justify-center gap-6">
            {['Bengaluru', 'Pune', 'Hyderabad', 'Mumbai', 'Chennai', 'Delhi NCR', 'Ahmedabad'].map((c) => (
              <span key={c} className="flex items-center gap-1.5 text-slate-500 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" /> {c}
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
  { icon: CreditCard,   title: 'Razorpay Payments',        badge: 'New',        badgeColor: '#10b981', desc: 'Tenants pay via UPI, cards, or netbanking. Instant payment confirmation and PDF receipts auto-sent.' },
  { icon: Building2,    title: 'Multi-Property & Rooms',   badge: 'Popular',    badgeColor: '#6366f1', desc: 'Bulk room creation by type — 10 Triple Sharing in one click. Full occupancy tracking across all properties.' },
  { icon: Scale,        title: 'AI Lease Analyzer',        badge: 'AI',         badgeColor: '#8b5cf6', desc: 'Upload your lease PDF. Gemini AI spots risky clauses, explains them in plain English, and suggests fairer alternatives.' },
  { icon: Bell,         title: 'Smart Notifications',      badge: null,         badgeColor: '',        desc: 'Automated rent reminders, payment alerts, and complaint notifications. Never chase rent manually again.' },
  { icon: MessageSquare,title: 'Complaint Management',     badge: null,         badgeColor: '',        desc: 'Tenants raise complaints with photos. Track resolution with a full timeline and priority labels.' },
  { icon: FileCheck,    title: 'Document Vault',           badge: 'Compliance', badgeColor: '#3b82f6', desc: 'Upload and view lease agreements, Aadhaar, ID proofs. Full bidirectional document vault per tenant.' },
  { icon: BarChart3,    title: 'Revenue Analytics',        badge: null,         badgeColor: '',        desc: '6-month revenue charts, occupancy rates, and payment health dashboards — all in real time.' },
  { icon: Shield,       title: 'Audit Trail',              badge: 'Security',   badgeColor: '#64748b', desc: 'Every action logged with timestamp. Immutable audit log for compliance and dispute resolution.' },
];

function Features() {
  return (
    <section id="features" className="py-28 px-4" style={{ background: 'linear-gradient(180deg,#080810 0%,#0c0c1a 100%)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full mb-5"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8' }}>
            <Zap className="h-3.5 w-3.5" /> Everything included
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            All the tools to{' '}
            <span style={{ backgroundImage: 'linear-gradient(135deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              run your property
            </span>
          </h2>
          <p className="mt-5 text-lg text-slate-400 max-w-2xl mx-auto">
            From Razorpay-powered rent collection to AI lease analysis — everything in one platform.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, desc, badge, badgeColor }) => (
            <div
              key={title}
              className="card-dark group p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <Icon className="h-5 w-5 text-indigo-400" />
                </div>
                {badge && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: `${badgeColor}20`, color: badgeColor, border: `1px solid ${badgeColor}40` }}>
                    {badge}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
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
    <section id="how-it-works" className="py-28 px-4" style={{ background: 'linear-gradient(180deg,#0c0c1a 0%,#0a0a18 100%)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">How RentFlow works</h2>
          <p className="mt-5 text-lg text-slate-400">Up and running in under 10 minutes</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ n, title, desc, icon: Icon, color }, i) => (
            <div key={n} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full h-px -translate-y-1/2 z-0"
                  style={{ background: 'linear-gradient(90deg,rgba(99,102,241,0.4),transparent)' }} />
              )}
              <div className="relative p-7 rounded-2xl transition-all duration-300 hover:-translate-y-1"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl font-black font-mono" style={{ color: 'rgba(255,255,255,0.08)' }}>{n}</span>
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center"
                    style={{ background: `${color}25`, border: `1px solid ${color}40` }}>
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                </div>
                <h3 className="font-bold text-white mb-2 text-base">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
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
    key: 'STARTER', name: 'Starter', monthlyPrice: '₹499', annualPrice: '₹4,990', limit: '1 Property', desc: 'Perfect for individual landlords',
    icon: '🏠', highlight: false, color: '#64748b', isCustom: false,
    features: ['1 property', 'Unlimited tenants', 'Razorpay payments', 'Payment tracking', 'PDF receipts'],
    missing: ['Advanced analytics', 'Priority support', 'API access'],
    cta: 'Get Started',
  },
  {
    key: 'GROWTH', name: 'Growth', monthlyPrice: '₹999', annualPrice: '₹9,990', limit: '2-4 Properties', desc: 'For growing portfolios',
    icon: '📈', highlight: true, color: '#6366f1', isCustom: false,
    features: ['Up to 5 properties', 'Unlimited tenants', 'Razorpay payments', 'Advanced analytics', 'PDF receipts', 'Priority support', 'Document vault'],
    missing: ['API access', 'Dedicated manager'],
    cta: 'Start free trial',
  },
  {
    key: 'PROFESSIONAL', name: 'Professional', monthlyPrice: '₹2,499', annualPrice: '₹24,990', limit: '5-8 Properties', desc: 'For serious property managers',
    icon: '🚀', highlight: false, color: '#8b5cf6', isCustom: false,
    features: ['Up to 10 properties', 'Unlimited tenants', 'All analytics', 'API access', 'Priority support', 'Document vault'],
    missing: ['Dedicated manager'],
    cta: 'Get Professional',
  },
  {
    key: 'BUSINESS', name: 'Business', monthlyPrice: '₹4,999', annualPrice: '₹49,990', limit: '9-15 Properties', desc: 'For large-scale operations',
    icon: '🏢', highlight: false, color: '#f59e0b', isCustom: false,
    features: ['Up to 25 properties', 'Unlimited tenants', 'Full analytics suite', 'API access', '24/7 support', 'Dedicated manager'],
    missing: [],
    cta: 'Get Business',
  },
  {
    key: 'ENTERPRISE', name: 'Enterprise', monthlyPrice: 'Custom', annualPrice: 'Custom', limit: '15+ Properties', desc: 'Tailored for large enterprises',
    icon: '👑', highlight: false, color: '#e879f9', isCustom: true,
    features: ['Unlimited properties', 'Unlimited tenants', 'Custom analytics', 'Full API access', 'Dedicated account manager', 'SLA guarantee', 'Custom integrations'],
    missing: [],
    cta: 'Contact Sales',
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-28 px-4" style={{ background: 'linear-gradient(180deg,#0a0a18 0%,#080810 100%)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full mb-5"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#818cf8' }}>
            <Crown className="h-3.5 w-3.5" /> Property-based pricing
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Grows with{' '}
            <span style={{ backgroundImage: 'linear-gradient(135deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              your portfolio
            </span>
          </h2>
          <p className="mt-5 text-lg text-slate-400">All plans include Razorpay payments, PDF receipts &amp; tenant portal.</p>

          {/* Annual saves 2 months badge */}
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }}>
            <span>🎉</span> Annual plan saves 2 months — pay for 10, get 12!
          </div>
        </div>

        {/* Razorpay badge */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-4 px-6 py-3.5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center"
              style={{ boxShadow: '0 4px 14px rgba(59,130,246,0.4)' }}>
              <Lock className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Secured by Razorpay</p>
              <p className="text-xs text-slate-500">PCI-DSS certified · UPI · Cards · Netbanking · Wallets</p>
            </div>
            <div className="flex gap-2 ml-2">
              {['UPI', 'Visa', 'MC', 'RuPay'].map((m) => (
                <span key={m} className="text-xs font-bold px-2 py-1 rounded-lg text-slate-400"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 items-start">
          {plans.map(({ key, name, monthlyPrice, annualPrice, limit, desc, icon, highlight, color, isCustom, features: f, missing, cta }) => (
            <div
              key={key}
              className="relative rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                border: highlight ? `1px solid ${color}60` : '1px solid rgba(255,255,255,0.08)',
                boxShadow: highlight ? `0 0 60px ${color}20, 0 20px 60px rgba(0,0,0,0.4)` : '0 8px 32px rgba(0,0,0,0.3)',
                transform: highlight ? 'scale(1.02)' : undefined,
              }}
            >
              {highlight && (
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${color},transparent)` }} />
              )}
              {/* Header */}
              <div className="p-5" style={{ background: highlight ? `${color}18` : 'rgba(255,255,255,0.03)' }}>
                {highlight && (
                  <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: `${color}30`, border: `1px solid ${color}60`, color }}>
                    ⭐ Popular
                  </span>
                )}
                <div className="text-2xl mb-2">{icon}</div>
                <h3 className="text-lg font-extrabold text-white">{name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{limit}</p>

                {/* Monthly price */}
                <div className="mt-4">
                  {isCustom ? (
                    <span className="text-3xl font-black" style={{ color }}>Custom</span>
                  ) : (
                    <>
                      <span className="text-3xl font-black text-white">{monthlyPrice}</span>
                      <span className="text-slate-500 text-xs">/mo</span>
                    </>
                  )}
                </div>

                {/* Annual price */}
                {!isCustom && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-xs font-semibold" style={{ color: '#34d399' }}>Annual:</span>
                    <span className="text-xs font-bold text-white">{annualPrice}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold"
                      style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>2 mo free</span>
                  </div>
                )}
                {isCustom && (
                  <div className="mt-1.5">
                    <span className="text-xs text-slate-500">Annual: Custom</span>
                  </div>
                )}

                <p className="text-xs text-slate-500 mt-2">{desc}</p>
              </div>
              {/* Features */}
              <div className="p-5" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <ul className="space-y-2.5 mb-5">
                  {f.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-xs text-slate-300">
                      <div className="h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                        <Check className="h-2.5 w-2.5 text-emerald-400" />
                      </div>
                      {feat}
                    </li>
                  ))}
                  {missing.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <X className="h-2.5 w-2.5 text-slate-600" />
                      </div>
                      {feat}
                    </li>
                  ))}
                </ul>
                <a
                  href={isCustom ? 'mailto:sales@rentflow.in' : `${LANDLORD_URL}/register`}
                  className="block w-full text-center py-2.5 rounded-xl font-bold text-xs transition-all hover:scale-105"
                  style={highlight
                    ? { background: `linear-gradient(135deg,${color},#7c3aed)`, color: '#fff', boxShadow: `0 8px 24px ${color}40` }
                    : isCustom
                      ? { background: `linear-gradient(135deg,${color}30,${color}15)`, color, border: `1px solid ${color}50` }
                      : { background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {cta}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="mt-16 rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 className="text-lg font-bold text-white mb-6 text-center">Plan comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th className="text-left py-3 text-slate-500 font-medium">Feature</th>
                  {plans.map((p) => (
                    <th key={p.key} className="text-center py-3 font-bold" style={{ color: p.highlight ? p.color : '#94a3b8' }}>{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Properties',        '1',   '2–5', '6–10', '11–25', '25+'],
                  ['Monthly',           '₹299','₹999','₹2,499','₹4,999','Custom'],
                  ['Annual (2 mo free)','₹2,990','₹9,990','₹24,990','₹49,990','Custom'],
                  ['Razorpay Payments', '✅', '✅', '✅', '✅', '✅'],
                  ['Advanced Analytics','❌', '✅', '✅', '✅', '✅'],
                  ['Priority Support',  '❌', '✅', '✅', '24/7', '24/7'],
                  ['API Access',        '❌', '❌', '✅', '✅', '✅'],
                  ['Dedicated Manager', '❌', '❌', '❌', '✅', '✅'],
                ].map(([label, ...vals]) => (
                  <tr key={label} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td className="py-3 text-slate-400 font-medium">{label}</td>
                    {vals.map((v, i) => (
                      <td key={i} className="text-center py-3 font-medium" style={{ color: plans[i].highlight ? plans[i].color : '#64748b' }}>{v}</td>
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
  { name: 'Rahul Sharma',  role: 'Landlord · Bengaluru',     stars: 5, text: 'The Razorpay integration is a game changer. Tenants pay via UPI and I get instant confirmation — no more disputes over screenshots or cash.' },
  { name: 'Priya Patel',   role: 'PG Owner · Pune',          stars: 5, text: 'Managing 3 PGs with 80+ tenants used to be chaos. Bulk room creation and the advanced tenant filters save me hours every week.' },
  { name: 'Vikram Nair',   role: 'Property Manager · Hyderabad', stars: 5, text: 'The AI lease analyzer caught a hidden auto-renewal clause that would have locked my tenant in for 3 years. Absolutely worth the subscription.' },
];

function Testimonials() {
  return (
    <section id="testimonials" className="py-28 px-4" style={{ background: 'linear-gradient(180deg,#080810 0%,#0a0a18 100%)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex justify-center gap-0.5 mb-5">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />)}
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">Loved by landlords</h2>
          <p className="mt-5 text-lg text-slate-400">Thousands of property owners managing smarter with RentFlow</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map(({ name, role, stars, text }) => (
            <div
              key={name}
              className="p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-400 leading-relaxed mb-7 text-sm">&#8220;{text}&#8221;</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                  {name[0]}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{name}</p>
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
    <section className="py-28 px-4 relative overflow-hidden" style={{ background: '#080810' }}>
      {/* Background glow */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%,rgba(79,70,229,0.15) 0%,transparent 70%)' }} />
      <div className="absolute inset-0" style={{ border: 'none', background: 'linear-gradient(0deg,rgba(99,102,241,0.05) 0%,transparent 100%)' }} />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8"
          style={{ border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.08)', color: '#a5b4fc' }}>
          <TrendingUp className="h-3.5 w-3.5" /> Join 5,000+ landlords already on RentFlow
        </div>
        <h2 className="text-4xl sm:text-6xl font-extrabold text-white mb-6 tracking-tight">
          Ready to simplify your{' '}
          <span style={{ backgroundImage: 'linear-gradient(90deg,#818cf8,#c084fc,#fb7185)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            rental business?
          </span>
        </h2>
        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
          Start your free 14-day trial — no credit card required. Set up in under 10 minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={`${LANDLORD_URL}/register`}
            className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-2xl text-white text-lg font-black transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 20px 60px rgba(79,70,229,0.4)' }}
          >
            Start for free <ArrowRight className="h-5 w-5" />
          </a>
          <a
            href={`${TENANT_URL}/login`}
            className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-2xl text-lg font-semibold text-slate-300 hover:text-white transition-all"
            style={{ border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}
          >
            Tenant Portal
          </a>
        </div>
        <p className="mt-6 text-slate-600 text-sm">14-day trial · No credit card · Cancel anytime</p>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="py-20 px-4" style={{ background: '#050508', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-10 md:grid-cols-4 mb-14">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <span className="text-white font-extrabold text-lg">RentFlow</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              Modern property management for Indian landlords. Secure, simple, and built for scale.
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs">
              <div className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center">
                <Lock className="h-3 w-3 text-white" />
              </div>
              <span className="text-emerald-500 font-semibold">Secured by Razorpay</span>
            </div>
          </div>
          {[
            { title: 'Product',  links: [
              { label: 'Features',      href: '/#features' },
              { label: 'Pricing',       href: '/#pricing' },
              { label: 'How it works',  href: '/#how-it-works' },
              { label: 'Reviews',       href: '/#testimonials' },
            ]},
            { title: 'Portals',  links: [
              { label: 'Landlord Login', href: `${LANDLORD_URL}/login` },
              { label: 'Tenant Login',   href: `${TENANT_URL}/login` },
              { label: 'Register',       href: `${LANDLORD_URL}/register` },
            ]},
            { title: 'Company',  links: [
              { label: 'About',            href: '/about' },
              { label: 'Blog',             href: '/blog' },
              { label: 'Privacy Policy',   href: '/privacy-policy' },
              { label: 'Terms of Service', href: '/terms-of-service' },
            ]},
          ].map(({ title, links }) => (
            <div key={title}>
              <h3 className="text-white font-bold mb-5 text-sm tracking-widest uppercase">{title}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-slate-600 hover:text-indigo-400 transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-sm text-slate-700">© 2025 RentFlow Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-2 text-xs text-slate-700">
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
    <div className="min-h-screen" style={{ background: '#080810' }}>
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
