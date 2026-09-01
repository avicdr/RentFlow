'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList, Search, Filter, CheckCircle, XCircle, Clock,
  Shield, User, Building2, BedDouble, ArrowRight, Eye, Sparkles,
  Phone, Mail, Briefcase, IndianRupee, AlertTriangle, ChevronRight,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatDateShort, timeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: 'New Application', color: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  UNDER_REVIEW: { label: 'Under Review', color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  SHORTLISTED: { label: 'Shortlisted', color: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
  APPROVED: { label: 'Approved', color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  REJECTED: { label: 'Rejected', color: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' },
  WITHDRAWN: { label: 'Withdrawn', color: 'bg-muted text-muted-foreground border-border' },
};

function RejectDialog({ appId, applicantName, onClose }: { appId: string; applicantName: string; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const qc = useQueryClient();

  const { mutate: reject, isPending } = useMutation({
    mutationFn: () => apiClient.patch(`/api/v1/applications/landlord/${appId}/status`, {
      status: 'REJECTED',
      rejectionReason: reason,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord-applications'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <h3 className="text-lg font-bold text-foreground">Reject Application — {applicantName}</h3>
        <p className="text-sm text-muted-foreground">Provide feedback or a reason for the applicant.</p>
        <textarea
          rows={3}
          placeholder="e.g. Room has already been allocated / income requirement not met..."
          value={reason}
          onChange={e => setReason(e.target.value)}
          className="w-full px-3 py-2 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
        />
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-input text-sm font-medium hover:bg-muted">Cancel</button>
          <button
            onClick={() => reject()}
            disabled={isPending}
            className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            {isPending ? 'Rejecting...' : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LandlordApplicationsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [kycFilter, setKycFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);

  const { data: appsData, isLoading } = useQuery({
    queryKey: ['landlord-applications', { status: statusFilter, kycStatus: kycFilter, search }],
    queryFn: () => apiClient.get('/api/v1/applications/landlord', {
      params: {
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        kycStatus: kycFilter === 'ALL' ? undefined : kycFilter,
        search: search || undefined,
      },
    }).then(r => r.data),
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/api/v1/applications/landlord/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['landlord-applications'] }),
  });

  const applications: any[] = appsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-indigo-500" /> Tenant Applications
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review incoming verified applications from prospective tenants
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search by applicant name, company, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-10 px-3 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="ALL">All Application Statuses</option>
          <option value="SUBMITTED">New / Submitted</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="SHORTLISTED">Shortlisted</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <select
          value={kycFilter}
          onChange={e => setKycFilter(e.target.value)}
          className="h-10 px-3 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="ALL">All KYC States</option>
          <option value="VERIFIED">KYC Verified Only</option>
          <option value="PENDING">KYC Pending</option>
        </select>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-foreground font-semibold">No applications found</p>
          <p className="text-sm text-muted-foreground mt-1">
            When prospective tenants apply for your published rooms, their verified profiles will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const badge = STATUS_BADGE[app.status] || STATUS_BADGE.SUBMITTED;
            const profile = app.applicantProfile || {};
            const emp = app.employmentInfo || {};
            const room = app.roomId || {};
            const prop = app.propertyId || {};
            const rentPass = app.rentPassSnapshot;

            return (
              <div key={app._id} className="bg-card border border-border rounded-2xl p-5 shadow-xs hover:border-primary/40 transition-all space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Applicant info */}
                  <div className="flex items-start gap-3.5">
                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-xs">
                      {profile.firstName?.[0]}{profile.lastName?.[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-foreground text-base">{profile.firstName} {profile.lastName}</h3>
                        <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-bold border', badge.color)}>
                          {badge.label}
                        </span>
                        {app.kycStatus === 'VERIFIED' && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-semibold flex items-center gap-1">
                            <Shield className="h-3 w-3" /> KYC Verified
                          </span>
                        )}
                        {rentPass && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-bold flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> RentPass {rentPass.score}/100
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                        {profile.email && <span>{profile.email}</span>}
                        {profile.phone && <span>· {profile.phone}</span>}
                        {emp.organization && <span>· {emp.designation ? `${emp.designation} at ` : ''}{emp.organization}</span>}
                        {emp.monthlyIncome > 0 && <span className="font-semibold text-foreground">· ₹{emp.monthlyIncome.toLocaleString('en-IN')}/mo</span>}
                      </p>
                    </div>
                  </div>

                  {/* Right: Property & Room Target */}
                  <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-xl border border-border md:w-80 flex-shrink-0 justify-between">
                    <div>
                      <p className="text-xs font-semibold text-foreground truncate">{prop.name}</p>
                      <p className="text-xs text-muted-foreground">Room {room.roomNumber} ({room.type}) · ₹{room.monthlyRent || room.rentPerBed}/mo</p>
                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                        Move-in: {formatDateShort(app.preferredMoveInDate)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="pt-3 border-t border-border flex items-center justify-between flex-wrap gap-3">
                  <span className="text-xs text-muted-foreground">
                    Applied {timeAgo(app.submittedAt || app.createdAt)}
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/applications/${app._id}`}
                      className="px-3 py-1.5 rounded-xl border border-input bg-background hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" /> Full Review
                    </Link>

                    {app.status !== 'APPROVED' && app.status !== 'REJECTED' && (
                      <>
                        {app.status !== 'SHORTLISTED' && (
                          <button
                            onClick={() => updateStatus({ id: app._id, status: 'SHORTLISTED' })}
                            className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 text-xs font-semibold hover:bg-purple-100 transition-colors"
                          >
                            Shortlist
                          </button>
                        )}
                        <button
                          onClick={() => updateStatus({ id: app._id, status: 'APPROVED' })}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => setRejectModal({ id: app._id, name: `${profile.firstName} ${profile.lastName}` })}
                          className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-xs font-semibold hover:bg-red-100 transition-colors"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      </>
                    )}

                    {app.status === 'APPROVED' && (
                      <Link
                        href={`/tenants`}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1"
                      >
                        Create Agreement <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rejectModal && (
        <RejectDialog
          appId={rejectModal.id}
          applicantName={rejectModal.name}
          onClose={() => setRejectModal(null)}
        />
      )}
    </div>
  );
}
