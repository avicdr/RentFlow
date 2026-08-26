'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthBackground } from '@/components/auth-background';
import { Building2, Loader2, CheckCircle2, Eye, EyeOff, ArrowRight, User, Mail, Phone, Lock } from 'lucide-react';

const schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName:  z.string().min(1, 'Last name is required'),
  email:     z.string().email('Enter a valid email address'),
  phone:     z.string().min(10, 'Enter a valid phone number').max(15),
  password:  z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof schema>;

const BENEFITS = [
  'Razorpay-powered rent collection',
  'AI lease agreement analyzer',
  'Bulk room & tenant management',
  'Document vault & KYC',
  'Revenue analytics dashboard',
];

function RegisterPageInner() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: RegisterForm) =>
      apiClient.post('/api/v1/auth/register', {
        firstName: data.firstName,
        lastName:  data.lastName,
        email:     data.email,
        phone:     data.phone,
        password:  data.password,
        role:      'LANDLORD',
      }),
    onSuccess: () => {
      setDone(true);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      const description = Array.isArray(msg) ? msg[0] : (msg || 'Something went wrong. Please try again.');
      toast({
        title: 'Registration failed',
        description,
        variant: 'destructive',
      });
    },
  });

  if (done) {
    return (
      <AuthBackground>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-full max-w-md text-center">
            <div className="h-20 w-20 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)' }}>
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Check your email!</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              We&apos;ve sent a verification link to your email address. Click the link to activate your account.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 8px 32px rgba(79,70,229,0.35)' }}
            >
              Go to Login <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </AuthBackground>
    );
  }

  return (
    <AuthBackground>
      <div className="flex min-h-screen">
        {/* Left panel — benefits */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg,#0d0b1e 0%,#130f2a 100%)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full opacity-20 blur-[80px]"
          style={{ background: 'radial-gradient(circle,#4f46e5,transparent)' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-16">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 4px 16px rgba(99,102,241,0.5)' }}>
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">RentFlow</span>
          </div>

          <h2 className="text-3xl font-black text-white leading-tight mb-4">
            India&apos;s smartest<br />
            <span style={{ backgroundImage: 'linear-gradient(90deg,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              property management
            </span>
          </h2>
          <p className="text-slate-400 text-sm mb-10 leading-relaxed">
            Join thousands of landlords and PG owners who collect rent, manage tenants, and grow their portfolio with RentFlow.
          </p>

          <ul className="space-y-4">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-3 text-sm text-slate-300">
                <div className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)' }}>
                  <CheckCircle2 className="h-3 w-3 text-indigo-400" />
                </div>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-slate-600">
          14-day free trial · No credit card required · Cancel anytime
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">RentFlow</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="text-slate-400 text-sm mt-1">Start your free 14-day trial — no credit card needed</p>
          </div>

          <form onSubmit={handleSubmit((d) => mutate(d))} method="POST" className="space-y-4" autoComplete="on">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-slate-300 text-sm">First name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="firstName"
                    autoComplete="given-name"
                    placeholder="Rahul"
                    {...register('firstName')}
                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20"
                  />
                </div>
                {errors.firstName && <p className="text-xs text-red-400">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-slate-300 text-sm">Last name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="lastName"
                    autoComplete="family-name"
                    placeholder="Sharma"
                    {...register('lastName')}
                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20"
                  />
                </div>
                {errors.lastName && <p className="text-xs text-red-400">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-300 text-sm">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="rahul@example.com"
                  {...register('email')}
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20"
                />
              </div>
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-slate-300 text-sm">Phone number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  {...register('phone')}
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20"
                />
              </div>
              {errors.phone && <p className="text-xs text-red-400">{errors.phone.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-300 text-sm">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  {...register('password')}
                  className="pl-9 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-slate-300 text-sm">Confirm password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  {...register('confirmPassword')}
                  className="pl-9 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 font-semibold text-white border-0 transition-all hover:scale-[1.02] hover:brightness-110"
              style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 8px 32px rgba(79,70,229,0.35)' }}
            >
              {isPending
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>
                : <>Create account <ArrowRight className="ml-2 h-4 w-4" /></>
              }
            </Button>

            <p className="text-center text-xs text-slate-600">
              By signing up you agree to our{' '}
              <Link href="http://localhost:3005/terms-of-service" className="text-indigo-400 hover:underline">Terms</Link>
              {' & '}
              <Link href="http://localhost:3005/privacy-policy" className="text-indigo-400 hover:underline">Privacy Policy</Link>
            </p>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      </div>
    </AuthBackground>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#080810' }}>
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    }>
      <RegisterPageInner />
    </Suspense>
  );
}
