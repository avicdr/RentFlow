'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList, Building2, BedDouble, Calendar, Clock,
  Shield, Sparkles, CheckCircle, XCircle, ArrowRight, Eye,
  AlertCircle, Store,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatDate, formatDateShort, timeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  SUBMITTED: { label: 'Application Submitted', bg: 'bg-blue-50 dark:bg-blue-950/60', color: 'text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  UNDER_REVIEW: { label: 'Under Review by Landlord', bg: 'bg-amber-50 dark:bg-amber-950/60', color: 'text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  SHORTLISTED: { label: 'Shortlisted 🎉', bg: 'bg-purple-50 dark:bg-purple-950/60', color: 'text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
  APPROVED: { label: 'Approved! 🎉', bg: 'bg-emerald-50 dark:bg-emerald-950/60', color: 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  REJECTED: { label: 'Not Approved', bg: 'bg-red-50 dark:bg-red-950/60', color: 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' },
  WITHDRAWN: { label: 'Withdrawn', bg: 'bg-muted', color: 'text-muted-foreground border-border' },
};

export default function TenantApplicationsPage() {
  const qc = useQueryClient();

  const { data: appsData, isLoading } = useQuery({
    queryKey: ['my-rental-applications'],
    queryFn: () => apiClient.get('/api/v1/applications/my').then(r => r.data.data),
  });

  const { mutate: withdrawApp, isPending: isWithdrawing } = useMutation({
    mutationFn: (id: string) => apiClient.post(`/api/v1/applications/my/${id}/withdraw`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-rental-applications'] });
    },
  });

  const applications: any[] = appsData || [];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-indigo-500" /> My Rental Applications
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track status, review details, and manage your accommodation applications
          </p>
        </div>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Store className="h-4 w-4" /> Browse More PGs & Rooms
        </Link>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border space-y-4">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto opacity-30" />
          <div>
            <h2 className="text-lg font-bold text-foreground">No applications submitted yet</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Discover verified properties on the RentFlow marketplace and apply online with your verified profile.
            </p>
          </div>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-xs"
          >
            Explore PGs & Properties
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const badge = STATUS_BADGE[app.status] || STATUS_BADGE.SUBMITTED;
            const prop = app.propertyId || {};
            const room = app.roomId || {};
            const landlord = app.landlordId || {};
            const isCanWithdraw = ['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED'].includes(app.status);

            return (
              <div
                key={app._id}
                className="bg-card border border-border rounded-2xl p-5 shadow-xs hover:border-primary/40 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-foreground text-lg">{prop.name || 'Property'}</h3>
                        <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-bold border', badge.color)}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Room {room.roomNumber} ({room.type}) · {prop.address?.city}
                      </p>
                    </div>
                  </div>

                  <div className="text-right sm:self-start">
                    <p className="text-xl font-bold text-foreground">₹{(room.monthlyRent || room.rentPerBed)?.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-muted-foreground">per month</p>
                  </div>
                </div>

                {/* Progress details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/40 p-3 rounded-xl border border-border text-xs">
                  <div>
                    <span className="text-muted-foreground">Move-in Date:</span>
                    <p className="font-semibold text-foreground mt-0.5">{formatDateShort(app.preferredMoveInDate)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">KYC Status:</span>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                      <Shield className="h-3 w-3" /> {app.kycStatus}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Applied:</span>
                    <p className="font-semibold text-foreground mt-0.5">{timeAgo(app.submittedAt || app.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Landlord:</span>
                    <p className="font-semibold text-foreground mt-0.5 truncate">{landlord.firstName ? `${landlord.firstName} ${landlord.lastName || ''}` : 'Verified Landlord'}</p>
                  </div>
                </div>

                {app.rejectionReason && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                    <p className="font-semibold">Landlord Feedback:</p>
                    <p className="mt-0.5">{app.rejectionReason}</p>
                  </div>
                )}

                {/* Footer Toolbar */}
                <div className="pt-2 border-t border-border flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs text-muted-foreground">
                    {app.status === 'APPROVED' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        ✓ Approved! Your lease agreement will be generated shortly.
                      </span>
                    ) : app.status === 'SHORTLISTED' ? (
                      <span className="text-purple-600 dark:text-purple-400 font-semibold">
                        You have been shortlisted by the landlord.
                      </span>
                    ) : (
                      <span>Application Reference #{app._id?.slice(-6)}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {prop.slug && (
                      <Link
                        href={`/property/${prop.slug}`}
                        className="px-3 py-1.5 rounded-lg border border-input text-xs font-semibold hover:bg-muted text-foreground"
                      >
                        View Property
                      </Link>
                    )}

                    {isCanWithdraw && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to withdraw this application?')) {
                            withdrawApp(app._id);
                          }
                        }}
                        disabled={isWithdrawing}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-red-600 transition-colors"
                      >
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
