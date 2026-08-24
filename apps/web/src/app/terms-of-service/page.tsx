import type { Metadata } from 'next';
import Link from 'next/link';
import { PageNav } from '@/components/page-nav';

export const metadata: Metadata = {
  title: 'Terms of Service — RentFlow',
  description: 'Read the Terms of Service governing your use of the RentFlow property management platform.',
};

const sections = [
  {
    title: '1. Acceptance of terms',
    body: [
      'By creating an account or using RentFlow, you agree to these Terms of Service and our Privacy Policy.',
      'If you are using RentFlow on behalf of a company or organization, you represent that you have authority to bind that entity.',
      'We reserve the right to update these terms. Continued use after 30 days\' notice constitutes acceptance.',
    ],
  },
  {
    title: '2. Eligibility',
    body: [
      'You must be at least 18 years old to use RentFlow.',
      'RentFlow is intended for use within India. Users outside India may face service limitations.',
      'You may not use RentFlow if your account has been suspended or terminated for policy violations.',
    ],
  },
  {
    title: '3. Account responsibilities',
    body: [
      'You are responsible for maintaining the confidentiality of your login credentials.',
      'You must notify us immediately at support@rentflow.com if you suspect unauthorized access.',
      'You are responsible for all activity that occurs under your account.',
      'Do not share your account with others. Each user should maintain their own account.',
    ],
  },
  {
    title: '4. Permitted use',
    body: [
      'RentFlow is a legitimate property management tool for landlords, PG owners, and tenants.',
      'You may use RentFlow to manage properties, collect rent, track payments, and communicate with tenants.',
      'You may not use RentFlow for any illegal purpose, including money laundering or tax evasion.',
      'You may not attempt to reverse-engineer, scrape, or abuse our APIs.',
    ],
  },
  {
    title: '5. Payments and subscriptions',
    body: [
      'Subscription fees are billed monthly or annually as chosen at signup.',
      'Rent collection through RentFlow uses Razorpay, subject to their fees and policies.',
      'All prices are in INR and inclusive of applicable GST.',
      'Refunds for subscription fees are considered case-by-case within 7 days of billing — contact billing@rentflow.com.',
      'We reserve the right to change pricing with 30 days\' notice.',
    ],
  },
  {
    title: '6. Data and content',
    body: [
      'You retain ownership of all tenant data, documents, and property information you upload.',
      'You grant RentFlow a limited license to store and process this data to provide the service.',
      'You represent that any documents you upload do not infringe third-party intellectual property rights.',
      'You must not upload illegal content, malware, or content that violates others\' privacy.',
    ],
  },
  {
    title: '7. Limitation of liability',
    body: [
      'RentFlow is provided "as is." We do not guarantee 100% uptime or error-free operation.',
      'We are not liable for indirect, incidental, or consequential damages arising from your use of RentFlow.',
      'Our total liability to you in any month shall not exceed the subscription fees you paid that month.',
      'We are not a party to any rental agreement between landlords and tenants — disputes are between the parties.',
    ],
  },
  {
    title: '8. Termination',
    body: [
      'You may cancel your account at any time from Account Settings.',
      'We may suspend or terminate accounts that violate these terms, with or without notice depending on severity.',
      'On termination, you may export your data for 30 days before it is permanently deleted.',
    ],
  },
  {
    title: '9. Governing law',
    body: [
      'These terms are governed by the laws of India.',
      'Any disputes shall be subject to the exclusive jurisdiction of courts in Bengaluru, Karnataka.',
      'For informal resolution, contact legal@rentflow.com before initiating any legal proceedings.',
    ],
  },
];

export default function TermsOfServicePage() {
  return (
    <div style={{ background: '#080810', minHeight: '100vh', color: '#e2e8f0' }}>
      <PageNav />

      <article className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-12">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
            Legal
          </span>
          <h1 className="text-4xl font-black text-white mb-4">Terms of Service</h1>
          <p className="text-slate-400">Last updated: <strong className="text-slate-300">18 May 2025</strong></p>
          <p className="text-slate-400 mt-4 leading-relaxed">
            These Terms of Service govern your use of the RentFlow platform operated by RentFlow Technologies Private Limited. Please read them carefully before creating an account.
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
                      style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                      §
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-16 p-6 rounded-2xl"
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
          <p className="text-slate-400 text-sm text-center">
            Questions about these terms?{' '}
            <a href="mailto:legal@rentflow.com" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              legal@rentflow.com
            </a>
          </p>
        </div>
      </article>

      <footer className="text-center pb-12 text-slate-700 text-sm border-t border-white/5 pt-8">
        <div className="flex items-center justify-center gap-6">
          <Link href="/about" className="hover:text-slate-500 transition-colors">About</Link>
          <Link href="/privacy-policy" className="hover:text-slate-500 transition-colors">Privacy</Link>
          <Link href="/" className="hover:text-slate-500 transition-colors">Home</Link>
        </div>
      </footer>
    </div>
  );
}
