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
  OPEN: { label: 'Open', color: 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800', dot: 'bg-red-500 animate-pulse' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
  RESOLVED: { label: 'Resolved', color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
  CLOSED: { label: 'Closed', color: 'bg-muted text-muted-foreground border border-border', dot: 'bg-muted-foreground' },
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW: 'text-muted-foreground',
  MEDIUM: 'text-amber-500 font-medium',
  HIGH: 'text-orange-500 font-semibold',
  CRITICAL: 'text-red-500 font-bold',
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

  const criticalCount = complaints.filter((c: any) => c.priority === 'CRITICAL' && c.status !== 'CLOSED').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-indigo-500" /> Complaints
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-2">
            Platform-wide view · {meta?.total ?? 0} total
            {isFetching && <RefreshCw className="h-3 w-3 animate-spin text-indigo-500" />}
          </p>
        </div>
        {criticalCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs font-bold">
            <AlertTriangle className="h-4 w-4" /> {criticalCount} Critical
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search complaints..."
            className="w-full h-9 pl-9 pr-3 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="h-9 px-3 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {FILTERS.status.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Status' : STATUS_CONFIG[s]?.label ?? s}</option>)}
        </select>
        <select
          value={priority}
          onChange={e => { setPriority(e.target.value); setPage(1); }}
          className="h-9 px-3 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {FILTERS.priority.map(p => <option key={p} value={p}>{p === 'ALL' ? 'All Priority' : p}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Complaint</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Tenant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Property</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Raised</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Quick Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>)}</tr>
                ))
              ) : complaints.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No complaints found</td></tr>
              ) : complaints.map((c: any) => {
                const cfg = STATUS_CONFIG[c.status];
                return (
                  <tr key={c._id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{CATEGORY_EMOJI[c.category] ?? '📋'}</span>
                        <div className="min-w-0">
                          <p className="text-foreground font-medium truncate max-w-[180px]">{c.title}</p>
                          <p className="text-xs text-muted-foreground">{c.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-semibold', cfg?.color)}>
                        <div className={cn('h-1.5 w-1.5 rounded-full', cfg?.dot)} />
                        {cfg?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-semibold', PRIORITY_COLOR[c.priority])}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground font-medium">
                      {c.raisedBy?.firstName} {c.raisedBy?.lastName}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {c.propertyId?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{timeAgo(c.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {c.status !== 'CLOSED' && (
                        <select
                          value={c.status}
                          disabled={updating === c._id}
                          onChange={e => {
                            setUpdating(c._id);
                            updateStatus({ id: c._id, newStatus: e.target.value });
                          }}
                          className="h-8 px-2 bg-background border border-input rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">{((page - 1) * 20) + 1}–{Math.min(page * 20, meta.total)} of {meta.total}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-xs rounded-lg bg-background border border-input text-foreground hover:bg-muted disabled:opacity-40">Previous</button>
              <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-xs rounded-lg bg-background border border-input text-foreground hover:bg-muted disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
