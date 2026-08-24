'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare, AlertTriangle, Clock, CheckCircle, XCircle,
  Search, RefreshCw, Filter, ChevronRight, ArrowUpRight,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatDate, timeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  OPEN: { label: 'Open', color: 'bg-red-900/30 text-red-300 border-red-700/40', dot: 'bg-red-500 animate-pulse' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-900/30 text-blue-300 border-blue-700/40', dot: 'bg-blue-500' },
  RESOLVED: { label: 'Resolved', color: 'bg-emerald-900/30 text-emerald-300 border-emerald-700/40', dot: 'bg-emerald-500' },
  CLOSED: { label: 'Closed', color: 'bg-gray-800 text-gray-400 border-gray-700', dot: 'bg-gray-500' },
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW: 'text-gray-500', MEDIUM: 'text-yellow-400', HIGH: 'text-orange-400', CRITICAL: 'text-red-400 font-bold',
};

const CATEGORY_EMOJI: Record<string, string> = {
  PLUMBING: '🔧', ELECTRICAL: '⚡', CLEANING: '🧹', SECURITY: '🔒',
  NOISE: '🔊', PEST: '🐛', MAINTENANCE: '🛠️', WIFI: '📶', OTHER: '📋',
};

const FILTERS = { status: ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], priority: ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] };

export default function AdminComplaintsPage() {
  const [status, setStatus] = useState('ALL');
  const [priority, setPriority] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-complaints', { status, priority, search, page }],
    queryFn: () =>
      apiClient.get('/api/v1/complaints', {
        params: {
          status: status === 'ALL' ? undefined : status,
          priority: priority === 'ALL' ? undefined : priority,
          search: search || undefined,
          page, limit: 20,
        },
      }).then(r => r.data),
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: string }) =>
      apiClient.patch(`/api/v1/complaints/${id}/status`, { status: newStatus, note: 'Updated by admin' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-complaints'] }),
    onSettled: () => setUpdating(null),
  });

  const complaints = data?.data ?? [];
  const meta = data?.meta;

  // Summary stats
  const openCount = complaints.filter((c: any) => c.status === 'OPEN').length;
  const criticalCount = complaints.filter((c: any) => c.priority === 'CRITICAL' && c.status !== 'CLOSED').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-indigo-400" /> Complaints
          </h1>
          <p className="text-gray-400 text-sm mt-0.5 flex items-center gap-2">
            Platform-wide view · {meta?.total ?? 0} total
            {isFetching && <RefreshCw className="h-3 w-3 animate-spin text-indigo-400" />}
          </p>
        </div>
        {criticalCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-900/30 border border-red-700/40 rounded-xl text-red-400 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" /> {criticalCount} Critical
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search complaints..."
            className="w-full h-9 pl-9 pr-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="h-9 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300">
          {FILTERS.status.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Status' : STATUS_CONFIG[s]?.label ?? s}</option>)}
        </select>
        <select value={priority} onChange={e => { setPriority(e.target.value); setPage(1); }} className="h-9 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300">
          {FILTERS.priority.map(p => <option key={p} value={p}>{p === 'ALL' ? 'All Priority' : p}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/80">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Complaint</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Tenant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Property</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Raised</th>
                <th className="px-4 py-3">Quick Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-800 rounded animate-pulse" /></td>)}</tr>
                ))
              ) : complaints.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-500">No complaints found</td></tr>
              ) : complaints.map((c: any) => {
                const cfg = STATUS_CONFIG[c.status];
                return (
                  <tr key={c._id} className="hover:bg-gray-800/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{CATEGORY_EMOJI[c.category] ?? '📋'}</span>
                        <div className="min-w-0">
                          <p className="text-gray-200 font-medium truncate max-w-[180px]">{c.title}</p>
                          <p className="text-xs text-gray-500">{c.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border', cfg?.color)}>
                        <div className={cn('h-1.5 w-1.5 rounded-full', cfg?.dot)} />
                        {cfg?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-medium', PRIORITY_COLOR[c.priority])}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {c.raisedBy?.firstName} {c.raisedBy?.lastName}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {c.propertyId?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{timeAgo(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      {c.status !== 'CLOSED' && (
                        <select
                          value={c.status}
                          disabled={updating === c._id}
                          onChange={e => {
                            setUpdating(c._id);
                            updateStatus({ id: c._id, newStatus: e.target.value });
                          }}
                          className="h-7 px-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(s => (
                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <p className="text-xs text-gray-500">{((page - 1) * 20) + 1}–{Math.min(page * 20, meta.total)} of {meta.total}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-xs rounded bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-40">Previous</button>
              <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-xs rounded bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
