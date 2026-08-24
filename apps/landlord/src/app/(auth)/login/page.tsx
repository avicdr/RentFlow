'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/components/ui/use-toast';
import { AuthBackground } from '@/components/auth-background';
import { Building2, Loader2, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

function LoginPageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get('next') ?? searchParams.get('redirect') ?? '/';
  const setAuth      = useAuthStore(s => s.setAuth);
  const { toast }    = useToast();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const { mutate: login, isPending } = useMutation({
    mutationFn: (data: LoginForm) => apiClient.post('/api/v1/auth/login', data),
    onSuccess: (res) => {
      const { accessToken, user } = res.data.data;
      if (!['LANDLORD', 'PROPERTY_MANAGER'].includes(user.role)) {
        toast({ title: 'Access Denied', description: 'This portal is for landlords only.', variant: 'destructive' });
        return;
      }
      setAuth(user, accessToken);
      router.push(redirect);
    },
    onError: (error: any) => {
      toast({
        title: 'Login Failed',
        description: error.response?.data?.message ?? 'Invalid email or password.',
        variant: 'destructive',
      });
    },
  });

  return (
    <AuthBackground>
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-sm mx-auto">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">RentFlow</span>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-7"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
            <div className="mb-6">
              {/* Portal badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-4"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Landlord Portal</span>
              </div>
              <h1 className="text-xl font-bold text-white">Welcome back</h1>
              <p className="text-sm text-slate-400 mt-1">Sign in to your landlord dashboard</p>
            </div>

            <form onSubmit={handleSubmit(d => login(d))} method="POST" className="space-y-4" autoComplete="on">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    id="email" type="email" autoComplete="email"
                    placeholder="you@example.com"
                    {...register('email')}
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
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    id="password" type={showPass ? 'text' : 'password'}
                    autoComplete="current-password" placeholder="••••••••"
                    {...register('password')}
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
                {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
              </div>

              <button
                type="submit" disabled={isPending}
                className="w-full py-2.5 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 8px 24px rgba(79,70,229,0.35)' }}
              >
                {isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
                  : <>Sign In <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              New to RentFlow?{' '}
              <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthBackground>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080f' }}>
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  );
}
