'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList, ArrowLeft, CheckCircle, XCircle, Shield,
  User, Building2, BedDouble, Phone, Mail, Briefcase, IndianRupee,
  Sparkles, Calendar, Clock, FileText, Check, AlertCircle, ArrowRight,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatDate, formatDateShort, timeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function LandlordApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  const { data: appData, isLoading } = useQuery({
    queryKey: ['landlord-application-detail', id],
    queryFn: () => apiClient.get(`/api/v1/applications/landlord/${id}`).then(r => r.data.data),
  });

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: (payload: { status: string; rejectionReason?: string }) =>
      apiClient.patch(`/api/v1/applications/landlord/${id}/status`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord-application-detail', id] });
      qc.invalidateQueries({ queryKey: ['landlord-applications'] });
      setShowRejectBox(false);
    },
  });

  const app = appData;
  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="text-center py-16 space-y-4">
        <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto opacity-30" />
        <h2 className="text-xl font-bold text-foreground">Application Not Found</h2>
        <Link href="/applications" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold">
          <ArrowLeft className="h-4 w-4" /> Back to Applications
        </Link>
      </div>
    );
  }

  const profile = app.applicantProfile || {};
  const emp = app.employmentInfo || {};
  const prop = app.propertyId || {};
  const room = app.roomId || {};
  const rentPass = app.rentPassSnapshot;
  const references: any[] = app.references || [];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link href="/applications" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Applications
        </Link>
        <span className="text-xs text-muted-foreground">
          Submitted {timeAgo(app.submittedAt || app.createdAt)}
        </span>
      </div>

      {/* Hero Card */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-md">
            {profile.firstName?.[0]}{profile.lastName?.[0]}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{profile.firstName} {profile.lastName}</h1>
              <span className={cn(
                'text-xs px-2.5 py-0.5 rounded-full font-bold',
                app.status === 'APPROVED' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                app.status === 'REJECTED' ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800' :
                'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
              )}>
                {app.status?.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
              {profile.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{profile.email}</span>}
              {profile.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{profile.phone}</span>}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {app.status !== 'APPROVED' && app.status !== 'REJECTED' && (
            <>
              {app.status !== 'SHORTLISTED' && (
                <button
                  onClick={() => updateStatus({ status: 'SHORTLISTED' })}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 text-xs font-semibold hover:bg-purple-100 transition-colors"
                >
                  Shortlist
                </button>
              )}
              <button
                onClick={() => updateStatus({ status: 'APPROVED' })}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <CheckCircle className="h-4 w-4" /> Approve Application
              </button>
              <button
                onClick={() => setShowRejectBox(true)}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-xs font-semibold hover:bg-red-100 transition-colors"
              >
                <XCircle className="h-4 w-4" /> Reject
              </button>
            </>
          )}

          {app.status === 'APPROVED' && (
            <Link
              href="/tenants"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2"
            >
              Continue to Create Rental Agreement <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Reject Box */}
      {showRejectBox && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-red-700 dark:text-red-400">Rejection Reason</h3>
          <textarea
            rows={2}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Provide optional feedback for the tenant..."
            className="w-full bg-background border border-input rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <div className="flex gap-2">
            <button onClick={() => setShowRejectBox(false)} className="px-3 py-1.5 rounded-lg border border-input text-xs font-medium bg-card">Cancel</button>
            <button
              onClick={() => updateStatus({ status: 'REJECTED', rejectionReason: rejectReason })}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      )}

      {/* 2-Column Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verification & RentPass */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-500" />
            <h2 className="text-base font-bold text-foreground">Identity & Verification</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border">
              <span className="text-muted-foreground font-medium">KYC Verification:</span>
              <span className={cn(
                'px-2.5 py-0.5 rounded-full font-bold',
                app.kycStatus === 'VERIFIED' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
              )}>
                {app.kycStatus === 'VERIFIED' ? '✓ Verified (Aadhaar/Govt ID)' : 'Pending Verification'}
              </span>
            </div>

            {rentPass ? (
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" /> RentPass™ Reliability Score
                  </span>
                  <span className="text-lg font-black text-foreground">{rentPass.score} / 100</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-200/50 dark:border-indigo-800/50">
                  <div><span className="text-muted-foreground">On-time Payments:</span> <span className="font-semibold text-foreground">{rentPass.onTimePaymentsCount}/{rentPass.totalPaymentsCount}</span></div>
                  <div><span className="text-muted-foreground">Rental History:</span> <span className="font-semibold text-foreground">{rentPass.tenancyHistoryMonths} months</span></div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-muted/30 text-muted-foreground text-center">
                RentPass profile not attached
              </div>
            )}
          </div>
        </div>

        {/* Employment & Income */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-indigo-500" />
            <h2 className="text-base font-bold text-foreground">Employment & Income</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Employment Type:</span>
              <span className="font-semibold text-foreground">{emp.type?.replace('_', ' ') || 'Salaried'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Organization:</span>
              <span className="font-semibold text-foreground">{emp.organization || '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Designation:</span>
              <span className="font-semibold text-foreground">{emp.designation || '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Monthly Income:</span>
              <span className="font-bold text-foreground text-sm">
                {emp.monthlyIncome > 0 ? `₹${emp.monthlyIncome.toLocaleString('en-IN')}` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Requested Room & Property */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-500" />
            <h2 className="text-base font-bold text-foreground">Requested Accommodation</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Property:</span>
              <span className="font-semibold text-foreground">{prop.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Room Number:</span>
              <span className="font-semibold text-foreground">Room {room.roomNumber} ({room.type})</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Monthly Rent:</span>
              <span className="font-bold text-foreground">₹{room.monthlyRent || room.rentPerBed} / mo</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Security Deposit:</span>
              <span className="font-semibold text-foreground">₹{room.deposit || 0}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Preferred Move-in Date:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {formatDate(app.preferredMoveInDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Rental References */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-500" />
            <h2 className="text-base font-bold text-foreground">Rental References</h2>
          </div>

          {references.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No references provided</p>
          ) : (
            <div className="space-y-3">
              {references.map((ref, i) => (
                <div key={i} className="p-3 rounded-xl bg-muted/40 border border-border text-xs space-y-1">
                  <p className="font-bold text-foreground">{ref.name} <span className="font-normal text-muted-foreground">({ref.relation})</span></p>
                  <p className="text-muted-foreground">Phone: {ref.phone}</p>
                </div>
              ))}
            </div>
          )}

          {app.additionalNotes && (
            <div className="pt-3 border-t border-border space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Applicant Notes:</p>
              <p className="text-xs text-foreground bg-muted/30 p-2.5 rounded-xl">{app.additionalNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
