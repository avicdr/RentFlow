import Link from 'next/link';
import type { Metadata } from 'next';
import { Building2, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy — RentFlow',
  description: 'Read the RentFlow Privacy Policy to understand how we collect, use, and protect your personal data.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b">{title}</h2>
      <div className="text-gray-600 space-y-3 leading-relaxed text-sm">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2"><Building2 className="h-6 w-6 text-indigo-600" /><span className="font-bold">RentFlow</span></Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600"><ArrowLeft className="h-4 w-4" /> Back</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900">Privacy Policy</h1>
          <p className="text-gray-500 mt-2 text-sm">Last updated: 11 May 2025 · Effective: 11 May 2025</p>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-8 text-sm text-indigo-800">
          <strong>In plain English:</strong> We only collect the data we need to run the platform. We don't sell your data.
          We use industry-standard encryption to protect it. You can request deletion at any time.
        </div>

        <Section title="1. Information We Collect">
          <p><strong>Account Information:</strong> Name, email address, phone number, and encrypted password when you register.</p>
          <p><strong>Identity / KYC:</strong> Aadhaar number (encrypted and masked), PAN, date of birth — collected only for identity verification during tenant onboarding.</p>
          <p><strong>Property & Rental Data:</strong> Property addresses, room details, rental amounts, and lease terms.</p>
          <p><strong>Payment Proof:</strong> UTR numbers and screenshot uploads for manual payment verification. We do not store or process payment card data.</p>
          <p><strong>Device Data:</strong> IP address, browser type, and OS version for security event logging and session management.</p>
          <p><strong>Usage Data:</strong> Pages visited, features used, and timestamps — for analytics and product improvement.</p>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>• To operate and improve the RentFlow platform.</p>
          <p>• To verify your identity (Aadhaar/PAN) in compliance with applicable regulations.</p>
          <p>• To generate rent receipts, send payment reminders, and manage leases.</p>
          <p>• To send transactional notifications (OTPs, payment confirmations, complaint updates).</p>
          <p>• To detect and prevent fraud, abuse, and security threats.</p>
          <p>• To comply with legal obligations under Indian law (IT Act 2000, DPDP Act 2023).</p>
        </Section>

        <Section title="3. Data Security">
          <p>All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Aadhaar numbers are field-encrypted with a separate encryption key. Passwords are hashed using Argon2id with per-user salts.</p>
          <p>We maintain an immutable audit log of all sensitive data access. Our infrastructure is hosted on hardened Linux servers in India with automated backups.</p>
          <p>JWT tokens have short expiry (15 minutes) with secure refresh token rotation. Refresh tokens are invalidated on logout and stored as HMAC hashes.</p>
        </Section>

        <Section title="4. Data Sharing">
          <p>We do not sell your personal data. We may share data with:</p>
          <p>• <strong>Service Providers:</strong> Cloud hosting, email delivery (SMTP), and analytics providers — under strict data processing agreements.</p>
          <p>• <strong>Landlords/Tenants:</strong> Relevant rental information is shared between parties in an active tenancy relationship.</p>
          <p>• <strong>Law Enforcement:</strong> Only when required by a valid court order or legal obligation.</p>
        </Section>

        <Section title="5. Your Rights (DPDP Act 2023)">
          <p>Under the Digital Personal Data Protection Act 2023, you have the right to:</p>
          <p>• <strong>Access</strong> your personal data held by us.</p>
          <p>• <strong>Correct</strong> inaccurate data.</p>
          <p>• <strong>Erase</strong> your data (right to erasure), subject to legal hold obligations.</p>
          <p>• <strong>Withdraw consent</strong> for data processing (may result in service limitation).</p>
          <p>• <strong>Nominate a representative</strong> in case of death or incapacity.</p>
          <p>To exercise these rights, email <strong>privacy@rentflow.com</strong> or use the in-app Settings → Privacy page.</p>
        </Section>

        <Section title="6. Cookies & Tracking">
          <p>We use strictly necessary cookies for session management (httpOnly, Secure, SameSite=Strict). We do not use third-party advertising cookies. Analytics cookies require explicit consent and can be disabled in Settings.</p>
        </Section>

        <Section title="7. Data Retention">
          <p>• Active account data: Retained while account is active.</p>
          <p>• Payment records: Retained for 7 years (as per Indian accounting regulations).</p>
          <p>• Audit logs: Retained for 2 years.</p>
          <p>• Deleted accounts: Data purged within 30 days of deletion request.</p>
        </Section>

        <Section title="8. Children's Privacy">
          <p>RentFlow is not intended for users under 18 years of age. We do not knowingly collect personal data from minors. If we become aware of such data, it will be deleted immediately.</p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>We may update this Privacy Policy periodically. We will notify you via email and in-app notification at least 14 days before material changes take effect. Continued use of the platform after the effective date constitutes acceptance.</p>
        </Section>

        <Section title="10. Contact">
          <p>For privacy-related inquiries: <strong>privacy@rentflow.com</strong></p>
          <p>Grievance Officer: Aditya Sharma, RentFlow Technologies Pvt. Ltd., Bengaluru, Karnataka 560001</p>
          <p>We will respond to privacy requests within 30 days as required by law.</p>
        </Section>

        <div className="mt-10 pt-6 border-t text-center text-sm text-gray-400">
          <Link href="/terms" className="hover:text-indigo-600 mr-4">Terms & Conditions</Link>
          <Link href="/contact" className="hover:text-indigo-600">Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
