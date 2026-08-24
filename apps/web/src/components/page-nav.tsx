import Link from 'next/link';
import { Building2 } from 'lucide-react';

const LANDLORD_URL = process.env.NEXT_PUBLIC_LANDLORD_URL ?? 'http://localhost:3002';

export function PageNav() {
  return (
    <nav className="sticky top-0 z-50 flex h-16 items-center px-6 sm:px-12"
      style={{ background: 'rgba(8,8,16,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="h-8 w-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
          style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
          <Building2 className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-extrabold text-white tracking-tight">RentFlow</span>
      </Link>
      <div className="ml-auto flex items-center gap-6 text-sm text-slate-400">
        <Link href="/about" className="hover:text-white transition-colors">About</Link>
        <Link href="/blog"  className="hover:text-white transition-colors">Blog</Link>
        <Link href={`${LANDLORD_URL}/login`}
          className="px-4 py-1.5 rounded-lg font-semibold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
          Login
        </Link>
      </div>
    </nav>
  );
}
