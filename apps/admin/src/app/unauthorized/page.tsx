import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'Access Denied — RentFlow Admin',
};

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#08080f' }}>
      <div className="w-full max-w-md text-center rounded-2xl p-8"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="mx-auto mb-5 h-14 w-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <ShieldAlert className="h-7 w-7 text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-white">Access Denied</h1>
        <p className="mt-2 text-sm text-slate-400">
          This portal is restricted to platform administrators. Your account does not have permission to view it.
        </p>
        <Link
          href="/login"
          className="inline-block mt-6 px-5 py-2.5 rounded-xl font-semibold text-white text-sm"
          style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}
