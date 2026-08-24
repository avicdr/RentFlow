'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { useAdminStore } from '@/stores/admin.store';
import { AuthBackground } from '@/components/auth-background';
import { Shield, Loader2, AlertTriangle, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});
type Form = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router  = useRouter();
  const setAuth = useAdminStore(s => s.setAuth);
  const [error, setError]     = useState('');
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  const { mutate: login, isPending } = useMutation({
    mutationFn: (d: Form) => apiClient.post('/api/v1/auth/login', d),
    onSuccess: res => {
      const { user, accessToken } = res.data.data;
      if (user.role !== 'SUPER_ADMIN') {
        setError('Access denied. This portal is for super admins only.');
        return;
      }
      setAuth(user, accessToken);
      router.push('/');
    },
    onError: (e: any) => setError(e.response?.data?.message ?? 'Invalid credentials'),
  });

  return (
    <AuthBackground>
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-sm mx-auto">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', boxShadow: '0 0 40px rgba(99,102,241,0.2)' }}>
              <Shield className="h-7 w-7 text-indigo-400" />
            </div>
            {/* Portal badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-3"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
              <Shield className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Admin Panel</span>
            </div>
            <h1 className="text-2xl font-bold text-white">RentFlow Admin</h1>
            <p className="text-slate-400 text-sm mt-1">Super Admin Control Panel</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-7"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(20px)' }}>
            <form onSubmit={handleSubmit(d => { setError(''); login(d); })} method="POST" className="space-y-4" autoComplete="on">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    {...register('email')}
                    id="email" name="email" type="email" autoComplete="email"
                    placeholder="admin@rentflow.com"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-600 outline-none transition-colors"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)')}
                    onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    {...register('password')}
                    id="password" name="password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm text-white placeholder:text-slate-600 outline-none transition-colors"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)')}
                    onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)')}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-red-400 text-sm"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" /> {error}
                </div>
              )}

              <button
                type="submit" disabled={isPending}
                className="w-full py-2.5 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 8px 24px rgba(79,70,229,0.35)' }}
              >
                {isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Authenticating...</>
                  : <>Sign In <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>

            <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-xs text-slate-600">
                🔒 Restricted area — unauthorized access is logged
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthBackground>
  );
}
