'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Search, AlertCircle, Clock, CheckCircle, XCircle, Filter } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; dot: string; text: string }> = {
  OPEN:        { label: 'Open',        dot: 'bg-red-500',    text: 'text-red-400' },
  IN_PROGRESS: { label: 'In Progress', dot: 'bg-yellow-400', text: 'text-yellow-400' },
  RESOLVED:    { label: 'Resolved',    dot: 'bg-emerald-500',text: 'text-emerald-400' },
  CLOSED:      { label: 'Closed',      dot: 'bg-slate-500',  text: 'text-slate-400' },
  ESCALATED:   { label: 'Escalated',   dot: 'bg-orange-500', text: 'text-orange-400' },
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW:      'text-slate-400',
  MEDIUM:   'text-blue-400',
  HIGH:     'text-orange-400',
  CRITICAL: 'text-red-400',
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return `${m}m ago`;
}

export default function LandlordComplaintsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['complaints'],
    queryFn: () => apiClient.get('/api/v1/complaints').then(r => r.data.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/api/v1/complaints/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['complaints'] }),
  });

  const complaints: any[] = data ?? [];
  const filtered = complaints.filter(c => {
    const matchesSearch = `${c.title} ${c.description}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'ALL' || c.status === filter;
    return matchesSearch && matchesFilter;
  });

  const counts = {
    ALL:        complaints.length,
    OPEN:       complaints.filter(c => c.status === 'OPEN').length,
    IN_PROGRESS:complaints.filter(c => c.status === 'IN_PROGRESS').length,
    RESOLVED:   complaints.filter(c => c.status === 'RESOLVED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Complaints</h1>
          <p className="text-muted-foreground text-sm mt-1">Review and resolve tenant complaints</p>
        </div>
        {/* Quick stat pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: 'OPEN',        label: 'Open',        color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
            { key: 'IN_PROGRESS', label: 'In Progress', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
            { key: 'RESOLVED',    label: 'Resolved',    color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/20' },
          ].map(({ key, label, color, bg }) => (
            <span key={key} className={cn('px-3 py-1 rounded-full text-xs font-semibold border', bg, color)}>
              {counts[key as keyof typeof counts]} {label}
            </span>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search complaints..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none bg-card border border-border text-foreground placeholder:text-muted-foreground focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="pl-8 pr-4 py-2 rounded-lg text-sm bg-card border border-border text-foreground outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer"
          >
            <option value="ALL">All Status ({counts.ALL})</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1.5fr] gap-4 px-4 py-3 border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:grid">
          <span>Complaint</span>
          <span>Status</span>
          <span>Priority</span>
          <span>Tenant</span>
          <span>Property</span>
          <span>Raised</span>
          <span className="text-right">Quick Update</span>
        </div>

        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 border-b border-border last:border-0 animate-pulse bg-muted/20" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No complaints found</p>
          </div>
        ) : (
          filtered.map((c: any) => {
            const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.OPEN;
            const tenantName = c.raisedBy
              ? `${c.raisedBy.firstName ?? ''} ${c.raisedBy.lastName ?? ''}`.trim()
              : '—';
            return (
              <div
                key={c._id}
                className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1.5fr] gap-3 lg:gap-4 items-center px-4 py-4 border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
              >
                {/* Complaint title */}
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wide">
                    {c.category ?? 'OTHER'}
                  </p>
                </div>

                {/* Status */}
                <div className="flex items-center gap-1.5">
                  <span className={cn('h-2 w-2 rounded-full flex-shrink-0', cfg.dot)} />
                  <span className={cn('text-xs font-medium', cfg.text)}>{cfg.label}</span>
                </div>

                {/* Priority */}
                <div>
                  <span className={cn('text-xs font-semibold', PRIORITY_COLOR[c.priority] ?? 'text-muted-foreground')}>
                    {c.priority ?? 'MEDIUM'}
                  </span>
                </div>

                {/* Tenant name */}
                <div>
                  <span className="text-sm text-foreground">
                    {tenantName || '—'}
                  </span>
                </div>

                {/* Property */}
                <div>
                  <span className="text-sm text-foreground truncate block">
                    {c.propertyId?.name ?? '—'}
                  </span>
                </div>

                {/* Raised */}
                <div>
                  <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                </div>

                {/* Quick update dropdown */}
                <div className="flex lg:justify-end">
                  <select
                    value={c.status}
                    onChange={e => updateStatus.mutate({ id: c._id, status: e.target.value })}
                    disabled={updateStatus.isPending}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold border outline-none cursor-pointer transition-colors appearance-none',
                      c.status === 'RESOLVED'    && 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
                      c.status === 'IN_PROGRESS' && 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
                      c.status === 'OPEN'        && 'bg-red-500/10 border-red-500/30 text-red-400',
                      c.status === 'CLOSED'      && 'bg-slate-500/10 border-slate-500/30 text-slate-400',
                      c.status === 'ESCALATED'   && 'bg-orange-500/10 border-orange-500/30 text-orange-400',
                      'bg-card border-border text-foreground',
                    )}
                    style={{ minWidth: '130px' }}
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
