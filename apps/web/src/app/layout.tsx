import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RentFlow — Razorpay-Powered Rental Management for India',
  description:
    'Collect rent via Razorpay, manage properties and tenants, analyze leases with AI, and track payments — all in one platform built for Indian landlords and PG owners.',
  keywords: [
    'rental management India', 'property management software', 'rent collection app',
    'PG management', 'Razorpay rent', 'landlord software India', 'tenant management',
  ],
  openGraph: {
    title: 'RentFlow — India\'s Smartest Property Management Platform',
    description:
      'Razorpay-powered rent collection, AI lease analysis, and full tenant management. Built for Indian landlords.',
    type: 'website',
    url: 'https://rentflow.com',
    siteName: 'RentFlow',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RentFlow — Rental Management for India',
    description: 'Collect rent via Razorpay. Manage tenants. Analyze leases with AI.',
  },
  metadataBase: new URL('https://rentflow.com'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} dark`} style={{ colorScheme: 'dark' }}>
      <body className="font-sans antialiased" style={{ background: '#080810', color: '#e2e8f0' }}>
        {children}
      </body>
    </html>
  );
}
