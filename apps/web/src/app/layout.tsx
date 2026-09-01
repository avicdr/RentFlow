import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RentFlow — The Control Center Your Properties Never Had',
  description:
    'Replace the spreadsheets, notebooks, whatsapp and chaos with one place that actually keeps up. Collect rent via Razorpay, manage properties and tenants, and track payments.',
  keywords: [
    'rental management India', 'property management software', 'rent collection app',
    'PG management', 'Razorpay rent', 'landlord software India', 'tenant management',
  ],
  openGraph: {
    title: 'RentFlow — The Control Center Your Properties Never Had',
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
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-slate-50 dark:bg-[#080810] text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
