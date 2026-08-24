import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { PageNav } from '@/components/page-nav';

export const metadata: Metadata = {
  title: 'Blog — RentFlow | Property Management Insights for Indian Landlords',
  description: 'Tips, guides and insights on property management, rent collection, and tenant management in India.',
};

const POSTS = [
  {
    slug: 'razorpay-rent-collection',
    tag: 'Payments',
    tagColor: '#4ade80',
    title: 'How to collect rent digitally with Razorpay in 2025',
    excerpt: 'A complete guide to setting up UPI, QR codes, and bank transfers for rent collection — with zero transaction fees for amounts under ₹2,000.',
    date: 'May 18, 2025',
    readTime: '5 min read',
  },
  {
    slug: 'pg-management-tips',
    tag: 'PG Owners',
    tagColor: '#818cf8',
    title: '10 things every PG owner should automate in 2025',
    excerpt: 'From bed allocation to monthly rent reminders — discover what tasks are eating your time and how RentFlow eliminates them.',
    date: 'May 12, 2025',
    readTime: '7 min read',
  },
  {
    slug: 'tenant-verification-india',
    tag: 'Legal',
    tagColor: '#fb923c',
    title: 'Tenant verification in India: what documents to collect',
    excerpt: 'Aadhaar, PAN, police verification — a clear breakdown of what you legally need and how to store it securely.',
    date: 'May 5, 2025',
    readTime: '6 min read',
  },
  {
    slug: 'ai-lease-analysis',
    tag: 'AI Features',
    tagColor: '#c084fc',
    title: 'How AI lease analysis saves landlords from bad clauses',
    excerpt: 'RentFlow\'s built-in AI can flag unusual clauses, missing deposits, and unfair terms before you sign anything.',
    date: 'Apr 28, 2025',
    readTime: '4 min read',
  },
  {
    slug: 'rental-yield-calculator',
    tag: 'Finance',
    tagColor: '#34d399',
    title: 'What rental yield should you expect in Bengaluru, Mumbai & Delhi?',
    excerpt: 'A data-backed breakdown of average yields across tier-1 Indian cities — and how to benchmark your own portfolio.',
    date: 'Apr 20, 2025',
    readTime: '8 min read',
  },
  {
    slug: 'maintenance-request-system',
    tag: 'Features',
    tagColor: '#60a5fa',
    title: 'Setting up a maintenance request system tenants actually use',
    excerpt: 'Complaints that disappear into WhatsApp groups hurt everyone. Here\'s how structured complaint tracking changes the game.',
    date: 'Apr 14, 2025',
    readTime: '5 min read',
  },
];

export default function BlogPage() {
  return (
    <div style={{ background: '#080810', minHeight: '100vh', color: '#e2e8f0' }}>
      <PageNav />

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-12">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-6"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
          Insights &amp; Guides
        </span>
        <h1 className="text-4xl font-black text-white mb-4">RentFlow Blog</h1>
        <p className="text-slate-400 text-lg">
          Property management tips, payment guides, and landlord stories — curated for the Indian market.
        </p>
      </section>

      {/* Featured post */}
      <section className="max-w-4xl mx-auto px-6 pb-8">
        <div className="p-8 sm:p-10 rounded-3xl relative overflow-hidden cursor-pointer group"
          style={{ background: 'linear-gradient(135deg,rgba(79,70,229,0.15),rgba(124,58,237,0.08))', border: '1px solid rgba(99,102,241,0.25)' }}>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(135deg,rgba(79,70,229,0.08),transparent)' }} />
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-4"
            style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>
            ⭐ Featured
          </span>
          <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors">
            {POSTS[0].title}
          </h2>
          <p className="text-slate-400 mb-6 leading-relaxed">{POSTS[0].excerpt}</p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{POSTS[0].date}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{POSTS[0].readTime}</span>
            <span className="ml-auto flex items-center gap-1 text-indigo-400 font-medium">
              Read article <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-2 gap-5">
          {POSTS.slice(1).map(({ tag, tagColor, title, excerpt, date, readTime }) => (
            <article key={title} className="p-6 rounded-2xl group cursor-pointer transition-all hover:-translate-y-0.5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-4"
                style={{ background: `${tagColor}18`, color: tagColor, border: `1px solid ${tagColor}30` }}>
                {tag}
              </span>
              <h3 className="font-bold text-white mb-2 leading-snug group-hover:text-indigo-300 transition-colors">
                {title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">{excerpt}</p>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{date}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{readTime}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="text-center pb-12 text-slate-700 text-sm">
        <div className="flex items-center justify-center gap-6">
          <Link href="/about" className="hover:text-slate-500 transition-colors">About</Link>
          <Link href="/privacy-policy" className="hover:text-slate-500 transition-colors">Privacy</Link>
          <Link href="/terms-of-service" className="hover:text-slate-500 transition-colors">Terms</Link>
          <Link href="/" className="hover:text-slate-500 transition-colors">Home</Link>
        </div>
      </footer>
    </div>
  );
}
