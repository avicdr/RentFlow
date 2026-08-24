import type { Metadata } from 'next';
import Link from 'next/link';
import { PageNav } from '@/components/page-nav';

export const metadata: Metadata = {
  title: 'Privacy Policy — RentFlow',
  description: 'Read RentFlow\'s privacy policy to understand how we collect, use, and protect your personal data.',
};

const sections = [
  {
    title: '1. Information we collect',
    body: [
      'Account information: name, email address, phone number, and password (stored as a secure hash).',
      'Property data: property addresses, room details, rental amounts, and tenant records you create.',
      'Payment data: transaction IDs, amounts, and status — processed securely through Razorpay. We do not store full card numbers or UPI PINs.',
      'Usage data: pages visited, features used, IP addresses, and browser/device type for security and analytics.',
      'Documents: Aadhaar/PAN copies, lease agreements, and other files you upload to the Document Vault.',
    ],
  },
  {
    title: '2. How we use your information',
    body: [
      'To provide and improve our rental management services.',
      'To process rent payments securely via Razorpay.',
      'To send transactional notifications (payment confirmations, rent reminders, complaint updates).',
      'To detect and prevent fraud, unauthorized access, and abuse.',
      'To comply with applicable Indian laws, including the IT Act 2000 and PDPB guidelines.',
    ],
  },
  {
    title: '3. Data sharing',
    body: [
      'We do not sell your personal data to third parties.',
      'Payment data is shared with Razorpay under their privacy policy for payment processing.',
      'We may share data with law enforcement when required by a valid legal order.',
      'Aggregate, anonymized analytics may be used for product improvement — never linked to individuals.',
    ],
  },
  {
    title: '4. Data storage and security',
    body: [
      'All data is stored on servers located in India (Mumbai data centers).',
      'Data is encrypted at rest (AES-256) and in transit (TLS 1.3).',
      'Passwords are hashed using Argon2id — we cannot recover your password.',
      'Access to production databases is limited to authorized engineers and audited.',
    ],
  },
  {
    title: '5. Your rights',
    body: [
      'Access: you may request a copy of all data we hold about you.',
      'Correction: you may update your account information at any time from your profile.',
      'Deletion: you may request account deletion — we will remove personal data within 30 days, retaining only what is required by law.',
      'Portability: you may export your tenant and payment data as CSV from your dashboard.',
    ],
  },
  {
    title: '6. Cookies',
    body: [
      'We use session cookies for authentication only — no advertising or tracking cookies.',
      'You can disable cookies in your browser, but this will prevent you from logging in.',
    ],
  },
  {
    title: '7. Changes to this policy',
    body: [
      'We will notify you via email and in-app banner before any material changes take effect.',
      'Continued use of RentFlow after a policy change constitutes acceptance.',
    ],
  },
  {
    title: '8. Contact us',
    body: [
      'For privacy-related requests, contact: privacy@rentflow.com',
      'RentFlow Technologies Private Limited, Bengaluru, Karnataka — 560001, India.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div style={{ background: '#080810', minHeight: '100vh', color: '#e2e8f0' }}>
      <PageNav />

      <article className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-12">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
            Legal
          </span>
          <h1 className="text-4xl font-black text-white mb-4">Privacy Policy</h1>
          <p className="text-slate-400">Last updated: <strong className="text-slate-300">18 May 2025</strong></p>
          <p className="text-slate-400 mt-4 leading-relaxed">
            This Privacy Policy explains how RentFlow Technologies Private Limited (&ldquo;RentFlow&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, uses, and protects information when you use our property management platform.
          </p>
        </div>

        <div className="space-y-10">
          {sections.map(({ title, body }) => (
            <section key={title}>
              <h2 className="text-lg font-bold text-white mb-4">{title}</h2>
              <ul className="space-y-3">
                {body.map((item, i) => (
                  <li key={i} className="flex gap-3 text-slate-400 text-sm leading-relaxed">
                    <span className="flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center mt-0.5 text-xs font-bold"
                      style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </article>

      <footer className="text-center pb-12 text-slate-700 text-sm border-t border-white/5 pt-8">
        <div className="flex items-center justify-center gap-6">
          <Link href="/about" className="hover:text-slate-500 transition-colors">About</Link>
          <Link href="/terms-of-service" className="hover:text-slate-500 transition-colors">Terms</Link>
          <Link href="/" className="hover:text-slate-500 transition-colors">Home</Link>
        </div>
      </footer>
    </div>
  );
}
