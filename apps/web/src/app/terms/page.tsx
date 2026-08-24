import Link from 'next/link';
import type { Metadata } from 'next';
import { Building2, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms & Conditions — RentFlow',
  description: 'Read the RentFlow Terms and Conditions governing use of the platform.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b">{title}</h2>
      <div className="text-gray-600 space-y-3 leading-relaxed text-sm">{children}</div>
    </section>
  );
}

export default function TermsPage() {
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
          <h1 className="text-4xl font-extrabold text-gray-900">Terms & Conditions</h1>
          <p className="text-gray-500 mt-2 text-sm">Last updated: 11 May 2025 · Effective: 11 May 2025</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8 text-sm text-yellow-800">
          <strong>Important:</strong> By using RentFlow, you agree to these terms. Please read carefully.
          These terms form a legally binding agreement between you and RentFlow Technologies Pvt. Ltd.
        </div>

        <Section title="1. Definitions">
          <p><strong>"Platform"</strong> refers to the RentFlow web application, APIs, and associated services.</p>
          <p><strong>"User"</strong> refers to any registered individual — Landlord, Tenant, Broker, or Property Manager.</p>
          <p><strong>"Landlord"</strong> means a property owner or authorised representative who lists and manages properties on the Platform.</p>
          <p><strong>"Tenant"</strong> means a user who occupies or intends to occupy a listed rental property.</p>
          <p><strong>"RentFlow" / "We" / "Company"</strong> refers to RentFlow Technologies Pvt. Ltd.</p>
        </Section>

        <Section title="2. Account Registration & Eligibility">
          <p>• You must be at least 18 years of age to use this Platform.</p>
          <p>• You must provide accurate, complete, and current information during registration.</p>
          <p>• You are responsible for maintaining the confidentiality of your login credentials.</p>
          <p>• You may not create accounts for others without their explicit consent.</p>
          <p>• One person may hold only one account per role. Multiple accounts for the same role are prohibited.</p>
          <p>• We reserve the right to suspend or terminate accounts that violate these Terms.</p>
        </Section>

        <Section title="3. Platform Use — Landlords">
          <p>• Landlords warrant that they are the legal owner or authorised representative of any listed property.</p>
          <p>• Listing a property constitutes a representation that all information provided is truthful and accurate.</p>
          <p>• Landlords must process payment verifications within 72 hours of receipt.</p>
          <p>• Landlords are solely responsible for the terms of their rental agreements with tenants.</p>
          <p>• RentFlow acts as a technology facilitator, not a party to any rental agreement.</p>
        </Section>

        <Section title="4. Platform Use — Tenants">
          <p>• Tenants are responsible for providing accurate identity and payment proof documents.</p>
          <p>• Submission of fraudulent payment proofs or UTR numbers is strictly prohibited and may result in legal action.</p>
          <p>• Tenants must keep their contact information current for rent reminder delivery.</p>
          <p>• Complaints must be genuine and not used to harass landlords or property managers.</p>
        </Section>

        <Section title="5. Payments">
          <p>• RentFlow facilitates payment tracking and receipt generation but does not process payments directly.</p>
          <p>• All payments occur directly between Tenants and Landlords via UPI, bank transfer, or other agreed methods.</p>
          <p>• Digitally generated receipts from RentFlow are supplementary records; they do not replace formal legal rent receipts.</p>
          <p>• RentFlow is not responsible for failed payments, disputes between tenants and landlords, or unauthorised payment instructions.</p>
          <p>• Subscription fees for the Platform (Landlord SaaS plans) are non-refundable after 7 days of billing.</p>
        </Section>

        <Section title="6. Prohibited Conduct">
          <p>Users may NOT:</p>
          <p>• Upload fraudulent, misleading, or offensive content.</p>
          <p>• Attempt to reverse-engineer, scrape, or copy the Platform.</p>
          <p>• Use the Platform for money laundering, fraud, or illegal activity.</p>
          <p>• Harass, threaten, or abuse other users through the Platform.</p>
          <p>• Circumvent security features or attempt unauthorised access.</p>
          <p>• Submit fake complaints or false KYC documents.</p>
        </Section>

        <Section title="7. Intellectual Property">
          <p>The Platform, including its code, design, logos, and branding, is owned by RentFlow Technologies Pvt. Ltd. and protected by Indian and international intellectual property laws.</p>
          <p>Users retain ownership of content they upload (documents, photos) but grant RentFlow a limited licence to process and store this content for platform operation.</p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>To the maximum extent permitted by law:</p>
          <p>• RentFlow is not liable for any rental disputes between landlords and tenants.</p>
          <p>• RentFlow is not liable for indirect, incidental, or consequential damages arising from Platform use.</p>
          <p>• Our total liability to any user for any claim is limited to the amount paid by that user in the preceding 3 months.</p>
          <p>• We do not guarantee uninterrupted availability of the Platform; planned maintenance windows will be communicated in advance.</p>
        </Section>

        <Section title="9. Termination">
          <p>• You may terminate your account at any time from Settings → Delete Account.</p>
          <p>• We may terminate or suspend your account with 14 days' written notice for material violations, or immediately for fraud, security breaches, or illegal activity.</p>
          <p>• Upon termination, your access to the Platform will be revoked and your data will be handled per the Privacy Policy retention schedule.</p>
        </Section>

        <Section title="10. Dispute Resolution">
          <p>• Any disputes arising from these Terms shall be first attempted through mediation.</p>
          <p>• If mediation fails, disputes shall be subject to arbitration under the Arbitration and Conciliation Act, 1996 (India).</p>
          <p>• The seat of arbitration shall be Bengaluru, Karnataka, India.</p>
          <p>• These Terms are governed by the laws of India.</p>
        </Section>

        <Section title="11. Amendments">
          <p>We may amend these Terms at any time. We will provide 14 days' advance notice via email and in-app notification. Continued use after the effective date constitutes acceptance of the amended Terms.</p>
        </Section>

        <Section title="12. Contact">
          <p>For Terms-related queries: <strong>legal@rentflow.com</strong></p>
          <p>RentFlow Technologies Pvt. Ltd., Bengaluru, Karnataka 560001, India</p>
        </Section>

        <div className="mt-10 pt-6 border-t text-center text-sm text-gray-400">
          <Link href="/privacy" className="hover:text-indigo-600 mr-4">Privacy Policy</Link>
          <Link href="/contact" className="hover:text-indigo-600">Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
