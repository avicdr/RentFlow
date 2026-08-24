import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Shield, Zap, Users, BarChart3, Heart } from 'lucide-react';
import { PageNav } from '@/components/page-nav';

export const metadata: Metadata = {
  title: 'About RentFlow — India\'s #1 Property Management Platform',
  description: 'Learn about RentFlow — our mission to simplify rent collection and property management for Indian landlords and PG owners.',
};

const STATS = [
  { val: '10,000+', label: 'Properties managed' },
  { val: '₹50Cr+',  label: 'Rent collected' },
  { val: '99.9%',   label: 'Uptime SLA' },
  { val: '4.9/5',   label: 'Avg rating' },
];

const VALUES = [
  { icon: Shield,    title: 'Security first',    desc: 'Bank-grade encryption, Razorpay-certified payment security, and ISO-compliant data handling.' },
  { icon: Zap,       title: 'Speed & simplicity', desc: 'From onboarding to first rent collection in under 10 minutes — no training required.' },
  { icon: Users,     title: 'Built for India',    desc: 'UPI, QR codes, bank transfers, Hindi-friendly support — designed for the Indian rental market.' },
  { icon: BarChart3, title: 'Data-driven',        desc: 'Real-time dashboards, payment analytics, and AI-powered lease insights.' },
];

export default function AboutPage() {
  return (
    <div style={{ background: '#080810', minHeight: '100vh', color: '#e2e8f0' }}>
      <PageNav />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-6"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
          Our Story
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-6">
          Simplifying rent for<br />
          <span style={{ backgroundImage: 'linear-gradient(90deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            every Indian landlord
          </span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          RentFlow was built because managing properties in India was needlessly hard — WhatsApp reminders, cash hand-offs, paper receipts. We built the platform we wished existed.
        </p>
      </section>

      {/* Stats */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map(({ val, label }) => (
            <div key={label} className="p-6 rounded-2xl text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-3xl font-black text-white mb-1">{val}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="p-8 sm:p-12 rounded-3xl"
          style={{ background: 'linear-gradient(135deg,rgba(79,70,229,0.12),rgba(124,58,237,0.08))', border: '1px solid rgba(99,102,241,0.2)' }}>
          <h2 className="text-2xl font-bold text-white mb-4">Our mission</h2>
          <p className="text-slate-300 leading-relaxed text-lg">
            To make professional property management accessible to every landlord in India — from the single PG owner in Bengaluru to the portfolio investor managing 50 properties across Mumbai.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-4xl mx-auto px-6 pb-24" id="security">
        <h2 className="text-2xl font-bold text-white mb-8">What we stand for</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {VALUES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <Icon className="h-5 w-5 text-indigo-400" />
              </div>
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center pb-12 text-slate-700 text-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Heart className="h-3.5 w-3.5 text-red-500" />
          <span>Made with love in India</span>
        </div>
        <div className="flex items-center justify-center gap-6">
          <Link href="/privacy-policy" className="hover:text-slate-500 transition-colors">Privacy</Link>
          <Link href="/terms-of-service" className="hover:text-slate-500 transition-colors">Terms</Link>
          <Link href="/" className="hover:text-slate-500 transition-colors">Home</Link>
        </div>
      </footer>
    </div>
  );
}
