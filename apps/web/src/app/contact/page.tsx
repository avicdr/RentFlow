import Link from 'next/link';
import type { Metadata } from 'next';
import { Building2, ArrowLeft, Mail, Phone, MapPin, MessageSquare, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact RentFlow — Get in Touch',
  description: 'Contact the RentFlow team for support, sales, or partnership inquiries.',
};

const LANDLORD_URL = process.env.NEXT_PUBLIC_LANDLORD_URL ?? 'http://localhost:3002';

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2"><Building2 className="h-7 w-7 text-indigo-600" /><span className="text-xl font-bold">RentFlow</span></Link>
        <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600"><ArrowLeft className="h-4 w-4" /> Back</Link>
      </div>
    </nav>
  );
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-28 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h1 className="text-4xl font-extrabold text-gray-900">Get in Touch</h1>
            <p className="text-xl text-gray-500 mt-3 max-w-xl mx-auto">
              Questions, feedback, or partnership inquiries — we'd love to hear from you.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-2">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Send us a message</h2>
              <form className="space-y-4" action="mailto:support@rentflow.com">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">First Name</label>
                    <input name="firstName" type="text" className="w-full h-10 px-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Last Name</label>
                    <input name="lastName" type="text" className="w-full h-10 px-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
                  <input name="email" type="email" className="w-full h-10 px-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Inquiry Type</label>
                  <select className="w-full h-10 px-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option>General Support</option>
                    <option>Sales / Pricing</option>
                    <option>Partnership</option>
                    <option>Bug Report</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Message</label>
                  <textarea rows={5} name="message" className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" placeholder="Tell us how we can help..." />
                </div>
                <button type="submit" className="w-full h-12 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100">
                  Send Message
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              {[
                { icon: Mail, title: 'Email Support', content: 'support@rentflow.com', sub: 'We reply within 24 hours', color: 'bg-indigo-50 text-indigo-600' },
                { icon: Phone, title: 'Phone Support', content: '+91 1800-RENTFLOW', sub: 'Mon–Sat, 9AM–7PM IST', color: 'bg-emerald-50 text-emerald-600' },
                { icon: MapPin, title: 'Office', content: 'Bengaluru, Karnataka', sub: 'India 560103', color: 'bg-orange-50 text-orange-600' },
                { icon: Clock, title: 'Response Time', content: '< 4 hours', sub: 'For critical issues', color: 'bg-purple-50 text-purple-600' },
              ].map(({ icon: Icon, title, content, sub, color }) => (
                <div key={title} className="flex items-start gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{title}</p>
                    <p className="text-gray-700 mt-0.5">{content}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}

              <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                <h3 className="font-semibold text-indigo-900 flex items-center gap-2"><MessageSquare className="h-4 w-4" /> For Landlords</h3>
                <p className="text-sm text-indigo-700 mt-1">Already using RentFlow? Use the in-app support chat for faster responses.</p>
                <Link href={`${LANDLORD_URL}/login`} className="inline-block mt-3 text-sm text-indigo-600 font-semibold hover:underline">
                  Go to Landlord Portal →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="border-t py-8 px-4 text-center text-sm text-gray-400">
        <p>© 2025 RentFlow · <Link href="/privacy" className="hover:text-indigo-600">Privacy</Link> · <Link href="/terms" className="hover:text-indigo-600">Terms</Link></p>
      </footer>
    </div>
  );
}
