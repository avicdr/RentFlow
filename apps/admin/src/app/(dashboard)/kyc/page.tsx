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
  PENDING_VERIFICATION: 'bg-yellow-900/30 text-yellow-300 border-yellow-700/40',
  KYC_UNDER_REVIEW: 'bg-blue-900/30 text-blue-300 border-blue-700/40',
  KYC_VERIFIED: 'bg-emerald-900/30 text-emerald-300 border-emerald-700/40',
  KYC_REJECTED: 'bg-red-900/30 text-red-300 border-red-700/40',
  ACTIVE: 'bg-gray-800 text-gray-400 border-gray-700',
};

function RejectModal({ userId, name, onClose }: { userId: string; name: string; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const qc = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: () => apiClient.post(`/api/v1/admin/kyc/${userId}/reject`, { reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['kyc-pending'] }); onClose(); },
  });
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-white mb-1">Reject KYC — {name}</h2>
        <p className="text-sm text-gray-400 mb-4">Provide a reason so the user can resubmit correctly.</p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Document image is blurry. Please reupload a clear photo of your Aadhaar."
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800">Cancel</button>
          <button
            onClick={() => reason && mutate()}
            disabled={isPending || !reason.trim()}
            className="flex-1 h-10 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
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
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900/80 backdrop-blur border-b border-gray-800">
        <p className="text-sm text-gray-300 font-medium">Document Preview</p>
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 text-xs hover:bg-gray-700">Close</button>
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
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-indigo-400" /> KYC Verification
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {users.length} user{users.length !== 1 ? 's' : ''} pending review
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full h-9 pl-9 pr-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 rounded-xl border border-gray-800">
          <CheckCircle className="h-12 w-12 text-emerald-500/50 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No pending KYC submissions</p>
          <p className="text-gray-600 text-sm mt-1">All users have been reviewed or no submissions yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user: any) => {
            const docs = user.kycDocuments ?? [];
            const apiBase = process.env.NEXT_PUBLIC_API_URL ?? '';
            return (
              <div key={user._id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600/40 to-purple-600/40 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-100">{user.firstName} {user.lastName}</p>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full border', STATUS_BADGE[user.status] ?? STATUS_BADGE.ACTIVE)}>
                        {user.status?.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded-full">{user.role}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">{user.email} · {user.phone}</p>
                    <p className="text-xs text-gray-600 mt-1">Submitted {timeAgo(user.updatedAt)}</p>

                    {/* KYC Fields */}
                    {user.kycData && (
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        {user.kycData.aadhaarNumber && (
                          <div className="flex gap-1.5 text-gray-400">
                            <span className="text-gray-600">Aadhaar:</span>
                            <span className="font-mono">XXXX-XXXX-{user.kycData.aadhaarNumber.slice(-4)}</span>
                          </div>
                        )}
                        {user.kycData.panNumber && (
                          <div className="flex gap-1.5 text-gray-400">
                            <span className="text-gray-600">PAN:</span>
                            <span className="font-mono">{user.kycData.panNumber}</span>
                          </div>
                        )}
                        {user.kycData.dateOfBirth && (
                          <div className="flex gap-1.5 text-gray-400">
                            <span className="text-gray-600">DOB:</span>
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
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-xs hover:bg-gray-700 transition-colors border border-gray-700"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {doc.category?.replace('_', ' ') ?? `Document ${i + 1}`}
                              <Eye className="h-3 w-3 text-gray-500" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {docs.length === 0 && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-yellow-500">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        No documents submitted yet
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => { if (confirm(`Approve KYC for ${user.firstName}?`)) approve(user._id); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" /> Approve
                    </button>
                    <button
                      onClick={() => setRejectId({ id: user._id, name: `${user.firstName} ${user.lastName}` })}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-900/40 text-red-300 border border-red-700/40 text-xs font-semibold hover:bg-red-900/60 transition-colors"
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
