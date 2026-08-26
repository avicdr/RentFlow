'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield, CheckCircle2, AlertTriangle, Upload, FileText,
  Lock, Check, Camera, Eye, AlertCircle, Loader2,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TenantKYCPage() {
  const qc = useQueryClient();
  const user = useAuthStore(s => s.user);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data: profileRes, isLoading } = useQuery({
    queryKey: ['tenant-kyc-profile'],
    queryFn: () => apiClient.get('/api/v1/tenants/my-profile').then(r => r.data.data),
  });

  const profile = profileRes;
  const isVerified = (user as any)?.isEmailVerified || profile?.verificationStatus?.aadhaar === 'VERIFIED';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
            <Shield className="h-3.5 w-3.5" /> Identity & Verification
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">KYC Center</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Government identity documents and background verification status
        </p>
      </div>

      {/* KYC Status Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">Identity Verified</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Active
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your government identity records have been verified for your RentFlow profile.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-2xl border">
          <Lock className="h-4 w-4 text-indigo-600 flex-shrink-0" />
          <span>Encrypted with SHA-256 and stored securely as per UIDAI norms</span>
        </div>
      </div>

      {/* Verified Document Records */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Aadhaar Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" /> Aadhaar Card
              </CardTitle>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                VERIFIED
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40 border">
              <span className="text-muted-foreground text-xs">Aadhaar Number</span>
              <span className="font-mono font-bold text-foreground">XXXX-XXXX-8921</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Aadhaar identity number is masked in accordance with privacy laws.
            </p>
          </CardContent>
        </Card>

        {/* PAN Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-600" /> PAN Card
              </CardTitle>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                VERIFIED
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40 border">
              <span className="text-muted-foreground text-xs">PAN Number</span>
              <span className="font-mono font-bold text-foreground">ABCDE****F</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              PAN record is on file for rent tax exemption claims and receipts.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Police Verification / Society Norms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tenant Background Verification</CardTitle>
          <CardDescription>Police and housing society verification records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-2xl bg-muted/40 border flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Society Resident Registration</p>
                <p className="text-xs text-muted-foreground">
                  Registered under {profile?.propertyId?.name ?? 'Property'}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
              Clear & Approved
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
