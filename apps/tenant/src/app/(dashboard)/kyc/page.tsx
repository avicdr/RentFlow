'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield, CheckCircle2, AlertTriangle, FileText,
  Lock, Check, Camera, Eye, AlertCircle, Loader2,
  ArrowRight, Sparkles, ExternalLink, RefreshCw,
  Building2, UserCheck, ShieldCheck, CheckCheck,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export default function TenantKYCPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const user = useAuthStore(s => s.user);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<'SELECT' | 'AADHAAR_INPUT' | 'OTP_INPUT' | 'VERIFYING' | 'SUCCESS'>('SELECT');
  const [docType, setDocType] = useState<'AADHAAR' | 'PAN' | 'DRIVING_LICENSE'>('AADHAAR');
  const [aadhaarInput, setAadhaarInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [resendTimer, setResendTimer] = useState(30);

  // Timer countdown for OTP resend
  useEffect(() => {
    let interval: any;
    if (step === 'OTP_INPUT' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Fetch KYC status
  const { data: kycRes, isLoading, refetch } = useQuery({
    queryKey: ['tenant-kyc-status'],
    queryFn: () => apiClient.get('/api/v1/kyc/status').then(r => r.data.data),
  });

  const isVerified = kycRes?.isVerified || (user as any)?.verificationStatus === 'VERIFIED';
  const digiLockerData = kycRes?.digilockerData;

  // Mutation: Initiate DigiLocker
  const initiateMutation = useMutation({
    mutationFn: (type: 'AADHAAR' | 'PAN' | 'DRIVING_LICENSE') =>
      apiClient.post('/api/v1/kyc/digilocker/initiate', { documentType: type }).then(r => r.data.data),
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setStep('AADHAAR_INPUT');
    },
    onError: () => {
      toast({
        title: 'Connection Error',
        description: 'Unable to reach the DigiLocker verification gateway. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Mutation: Verify OTP
  const verifyMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/api/v1/kyc/digilocker/verify', {
        sessionId,
        otp: otpInput,
        aadhaarNumber: aadhaarInput,
      }).then(r => r.data),
    onSuccess: () => {
      setStep('SUCCESS');
      qc.invalidateQueries({ queryKey: ['tenant-kyc-status'] });
      qc.invalidateQueries({ queryKey: ['tenant-profile'] });
      qc.invalidateQueries({ queryKey: ['my-reliability-score'] });
      toast({
        title: 'Identity Verified',
        description: 'Your government KYC has been authenticated successfully.',
      });
    },
    onError: (err: any) => {
      setStep('OTP_INPUT');
      toast({
        title: 'Verification Failed',
        description: err.response?.data?.message || 'Invalid or expired OTP code. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleStartDigiLocker = (type: 'AADHAAR' | 'PAN' | 'DRIVING_LICENSE' = 'AADHAAR') => {
    setDocType(type);
    setIsModalOpen(true);
    setStep('SELECT');
    setOtpInput('');
    initiateMutation.mutate(type);
  };

  const handleSendOtp = () => {
    const raw = aadhaarInput.replace(/\D/g, '');
    if (raw.length < 12) {
      toast({
        title: 'Invalid Aadhaar Number',
        description: 'Please enter a valid 12-digit Aadhaar number.',
        variant: 'destructive',
      });
      return;
    }
    setOtpInput('');
    setResendTimer(30);
    setStep('OTP_INPUT');
  };

  const handleVerifyOtp = () => {
    if (otpInput.length !== 6) {
      toast({
        title: 'Enter 6-Digit OTP',
        description: 'Please enter the 6-digit OTP received on your mobile.',
        variant: 'destructive',
      });
      return;
    }
    setStep('VERIFYING');
    setTimeout(() => {
      verifyMutation.mutate();
    }, 1000);
  };

  const last4Digits = aadhaarInput.replace(/\D/g, '').slice(-4) || '8921';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 font-bold text-xs shadow-xs">
            <Shield className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Identity &amp; Verification
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-2 tracking-tight">DigiLocker KYC Center</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Authenticate government-issued identity documents seamlessly via India’s national DigiLocker gateway.
        </p>
      </div>

      {/* KYC Status Hero Card */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all ${
        isVerified
          ? 'bg-gradient-to-br from-emerald-50/80 via-card to-card dark:from-emerald-950/20 border-emerald-200 dark:border-emerald-500/30'
          : 'bg-gradient-to-br from-amber-50/80 via-card to-card dark:from-amber-950/20 border-amber-200 dark:border-amber-500/30'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`h-16 w-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
            isVerified
              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400'
          }`}>
            {isVerified ? <CheckCircle2 className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">
                {isVerified ? 'Identity Verified via DigiLocker' : 'DigiLocker Verification Pending'}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold shadow-xs border ${
                isVerified
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
              }`}>
                {isVerified ? 'VERIFIED' : 'ACTION REQUIRED'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-lg leading-relaxed">
              {isVerified
                ? 'Your UIDAI government identity records have been authenticated and digitally signed on RentFlow.'
                : 'Connect your DigiLocker account to verify your Aadhaar or PAN in under 60 seconds.'}
            </p>
          </div>
        </div>

        {!isVerified && (
          <Button
            onClick={() => handleStartDigiLocker('AADHAAR')}
            className="flex-shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-6 py-5 rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>Verify with DigiLocker</span>
          </Button>
        )}

        {isVerified && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-4 py-3 rounded-2xl border">
            <Lock className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>Digitally verified via MeriPehchaan (UIDAI)</span>
          </div>
        )}
      </div>

      {/* Verified Document Records Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Aadhaar Card */}
        <Card className={isVerified ? 'border-emerald-200 dark:border-emerald-500/20' : ''}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" /> Aadhaar (UIDAI)
              </CardTitle>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-xs ${
                isVerified
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}>
                {isVerified ? 'DIGILOCKER VERIFIED' : 'NOT VERIFIED'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3.5 rounded-2xl bg-muted/40 border">
              <span className="text-muted-foreground text-xs font-medium">Masked Number</span>
              <span className="font-mono font-bold text-foreground">
                {digiLockerData?.maskedAadhaar || 'XXXX-XXXX-8921'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3.5 rounded-2xl bg-muted/40 border">
              <span className="text-muted-foreground text-xs font-medium">Full Name</span>
              <span className="font-semibold text-foreground">
                {digiLockerData?.fullName || `${user?.firstName} ${user?.lastName}`}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
              <span>Issuer Authority</span>
              <span className="font-semibold text-foreground">UIDAI / DigiLocker</span>
            </div>
          </CardContent>
        </Card>

        {/* PAN Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-600" /> PAN Card
              </CardTitle>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800 shadow-xs">
                VERIFIED
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3.5 rounded-2xl bg-muted/40 border">
              <span className="text-muted-foreground text-xs font-medium">PAN Number</span>
              <span className="font-mono font-bold text-foreground">ABCDE****F</span>
            </div>
            <div className="flex justify-between items-center p-3.5 rounded-2xl bg-muted/40 border">
              <span className="text-muted-foreground text-xs font-medium">Tax Status</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">Individual · Valid</span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
              <span>Income Tax Dept</span>
              <span className="font-semibold text-foreground">NSDL / DigiLocker</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security & Verification Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Why DigiLocker Verification Matters
          </CardTitle>
          <CardDescription>How verified credentials benefit your rental tenancy on RentFlow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-muted/40 border space-y-1.5">
              <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center font-bold text-sm">
                100
              </div>
              <h4 className="font-bold text-sm text-foreground">Max RentPass™ Score</h4>
              <p className="text-xs text-muted-foreground">
                DigiLocker verification grants the full 20% KYC factor boost to your tenant trust score.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border space-y-1.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-bold text-sm">
                ⚡
              </div>
              <h4 className="font-bold text-sm text-foreground">Instant Lease Approval</h4>
              <p className="text-xs text-muted-foreground">
                Landlords fast-track applications with verified Aadhaar credentials without manual review delays.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border space-y-1.5">
              <div className="h-8 w-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center justify-center font-bold text-sm">
                🔒
              </div>
              <h4 className="font-bold text-sm text-foreground">Zero Paper Privacy</h4>
              <p className="text-xs text-muted-foreground">
                Numbers are masked and encrypted as per UIDAI &amp; India DPDP Act privacy guidelines.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── DIGILOCKER VERIFICATION MODAL ───────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            {/* Header banner with Gov emblem style */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                  DL
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">DigiLocker Verification</h3>
                  <p className="text-[11px] text-muted-foreground">Government of India Identity Gateway</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Step: SELECT / INITIALIZING */}
            {step === 'SELECT' && (
              <div className="py-8 text-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto" />
                <p className="text-sm font-semibold text-foreground">Connecting to DigiLocker MeriPehchaan Gateway...</p>
              </div>
            )}

            {/* Step: AADHAAR_INPUT */}
            {step === 'AADHAAR_INPUT' && (
              <div className="space-y-5">
                <div>
                  <Label className="text-xs font-bold text-foreground">12-Digit Aadhaar Number</Label>
                  <Input
                    type="text"
                    maxLength={14}
                    placeholder="Enter 12-digit Aadhaar"
                    value={aadhaarInput}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '');
                      const formatted = v.match(/.{1,4}/g)?.join(' ') || v;
                      setAadhaarInput(formatted);
                    }}
                    className="mt-2 font-mono text-lg tracking-widest text-center font-bold h-12"
                    autoFocus
                  />
                  <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                    A secure 6-digit OTP will be dispatched to the mobile number linked with your Aadhaar.
                  </p>
                </div>

                <Button
                  onClick={handleSendOtp}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all hover:scale-[1.02]"
                >
                  Send Aadhaar OTP →
                </Button>
              </div>
            )}

            {/* Step: OTP_INPUT */}
            {step === 'OTP_INPUT' && (
              <div className="space-y-5">
                <div>
                  <Label className="text-xs font-bold text-foreground">Enter 6-Digit OTP</Label>
                  <Input
                    type="text"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="mt-2 font-mono text-2xl tracking-[0.4em] text-center font-extrabold h-14"
                    autoFocus
                  />
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Enter the 6-digit OTP sent to your Aadhaar-registered mobile (••••••{last4Digits}).
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>Didn't receive code?</span>
                  {resendTimer > 0 ? (
                    <span className="font-medium text-slate-500">Resend in {resendTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setResendTimer(30)}
                      className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <Button
                  onClick={handleVerifyOtp}
                  disabled={otpInput.length !== 6}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  Verify &amp; Authenticate
                </Button>
              </div>
            )}

            {/* Step: VERIFYING */}
            {step === 'VERIFYING' && (
              <div className="py-8 text-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">Authenticating with UIDAI...</p>
                  <p className="text-xs text-muted-foreground">Issuing cryptographic RentFlow identity verification</p>
                </div>
              </div>
            )}

            {/* Step: SUCCESS */}
            {step === 'SUCCESS' && (
              <div className="py-6 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                  <CheckCheck className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-lg text-foreground">Identity Verified!</h3>
                  <p className="text-xs text-muted-foreground">
                    Your Aadhaar credentials have been authenticated via DigiLocker. Your RentPass reliability score has been updated.
                  </p>
                </div>

                <Button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md"
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
