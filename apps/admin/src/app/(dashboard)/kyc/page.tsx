'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield, CheckCircle, XCircle, Eye, Clock, User,
  Loader2, Search, AlertTriangle, FileText,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatDate, timeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';

const STATUS_BADGE: Record<string, string> = {
  PENDING_VERIFICATION: 'bg-yellow-50 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
  KYC_UNDER_REVIEW: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  KYC_VERIFIED: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
  KYC_REJECTED: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
  ACTIVE: 'bg-muted text-muted-foreground border border-border',
};

function RejectModal({ userId, name, onClose }: { userId: string; name: string; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const qc = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: () => apiClient.post(`/api/v1/admin/kyc/${userId}/reject`, { reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['kyc-pending'] }); onClose(); },
  });
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-foreground mb-1">Reject KYC — {name}</h2>
        <p className="text-sm text-muted-foreground mb-4">Provide a reason so the user can resubmit correctly.</p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Document image is blurry. Please reupload a clear photo of your Aadhaar."
          className="w-full bg-background border border-input rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-input text-muted-foreground hover:bg-accent text-sm font-medium">Cancel</button>
          <button
            onClick={() => reason && mutate()}
            disabled={isPending || !reason.trim()}
            className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Rejecting...</> : 'Reject KYC'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DocumentViewer({ url, onClose }: { url: string; onClose: () => void }) {
  const isPdf = url.endsWith('.pdf');
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-4 py-3 bg-card/90 backdrop-blur border-b border-border">
        <p className="text-sm text-foreground font-medium">Document Preview</p>
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs hover:bg-accent hover:text-foreground">Close</button>
      </div>
      <div className="flex-1 overflow-auto flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
        {isPdf
          ? <iframe src={url} className="w-full max-w-3xl h-[80vh] rounded-xl" />
          : <img src={url} alt="Document" className="max-h-[80vh] max-w-full rounded-xl object-contain" />
        }
      </div>
    </div>
  );
}

export default function KYCPage() {
  const [search, setSearch] = useState('');
  const [rejectId, setRejectId] = useState<{ id: string; name: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['kyc-pending', search],
    queryFn: () =>
      apiClient.get('/api/v1/admin/kyc/pending', { params: { search: search || undefined } }).then(r => r.data.data),
  });

  const { mutate: approve } = useMutation({
    mutationFn: (userId: string) => apiClient.post(`/api/v1/admin/kyc/${userId}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kyc-pending'] }),
  });

  const users = data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-indigo-500" /> KYC Verification
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {users.length} user{users.length !== 1 ? 's' : ''} pending review
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full h-9 pl-9 pr-3 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <CheckCircle className="h-12 w-12 text-emerald-500/50 mx-auto mb-3" />
          <p className="text-foreground font-semibold">No pending KYC submissions</p>
          <p className="text-muted-foreground text-sm mt-1">All users have been reviewed or no submissions yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user: any) => {
            const docs = user.kycDocuments ?? [];
            const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
            return (
              <div key={user._id} className="bg-card border border-border rounded-2xl p-5 shadow-xs">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-xs">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-foreground">{user.firstName} {user.lastName}</p>
                      <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-semibold', STATUS_BADGE[user.status] ?? STATUS_BADGE.ACTIVE)}>
                        {user.status?.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-full font-medium">{user.role}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{user.email} · {user.phone}</p>
                    <p className="text-xs text-muted-foreground mt-1">Submitted {timeAgo(user.updatedAt)}</p>

                    {/* KYC Fields */}
                    {user.kycData && (
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-muted/40 p-3 rounded-xl border border-border">
                        {user.kycData.aadhaarNumber && (
                          <div className="flex gap-1.5 text-foreground">
                            <span className="text-muted-foreground font-medium">Aadhaar:</span>
                            <span className="font-mono">XXXX-XXXX-{user.kycData.aadhaarNumber.slice(-4)}</span>
                          </div>
                        )}
                        {user.kycData.panNumber && (
                          <div className="flex gap-1.5 text-foreground">
                            <span className="text-muted-foreground font-medium">PAN:</span>
                            <span className="font-mono">{user.kycData.panNumber}</span>
                          </div>
                        )}
                        {user.kycData.dateOfBirth && (
                          <div className="flex gap-1.5 text-foreground">
                            <span className="text-muted-foreground font-medium">DOB:</span>
                            <span>{formatDate(user.kycData.dateOfBirth)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Documents */}
                    {docs.length > 0 && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {docs.map((doc: any, i: number) => {
                          const fileUrl = `${apiBase}/uploads/${doc.filePath?.split('/uploads/')[1]}`;
                          return (
                            <button
                              key={i}
                              onClick={() => setPreviewUrl(fileUrl)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background text-foreground text-xs hover:bg-muted transition-colors border border-border shadow-2xs"
                            >
                              <FileText className="h-3.5 w-3.5 text-indigo-500" />
                              {doc.category?.replace('_', ' ') ?? `Document ${i + 1}`}
                              <Eye className="h-3 w-3 text-muted-foreground" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {docs.length === 0 && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        No documents submitted yet
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => { if (confirm(`Approve KYC for ${user.firstName}?`)) approve(user._id); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
                    >
                      <CheckCircle className="h-4 w-4" /> Approve
                    </button>
                    <button
                      onClick={() => setRejectId({ id: user._id, name: `${user.firstName} ${user.lastName}` })}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-xs font-semibold hover:bg-red-100 transition-colors"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rejectId && <RejectModal userId={rejectId.id} name={rejectId.name} onClose={() => setRejectId(null)} />}
      {previewUrl && <DocumentViewer url={previewUrl} onClose={() => setPreviewUrl('')} />}
    </div>
  );
}
