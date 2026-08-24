'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  MessageSquare, Plus, Clock, CheckCircle, AlertTriangle,
  XCircle, ChevronRight, Filter,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; dot: string }> = {
  OPEN: { label: 'Open', icon: AlertTriangle, color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  IN_PROGRESS: { label: 'In Progress', icon: Clock, color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500 animate-pulse' },
  RESOLVED: { label: 'Resolved', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  CLOSED: { label: 'Closed', icon: XCircle, color: 'bg-muted text-muted-foreground border-border', dot: 'bg-gray-400' },
};

const PRIORITY_BADGE: Record<string, string> = {
  LOW: 'bg-muted text-muted-foreground',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700 font-semibold',
};

const CATEGORY_ICONS: Record<string, string> = {
  PLUMBING: '🔧', ELECTRICAL: '⚡', CLEANING: '🧹', SECURITY: '🔒',
  NOISE: '🔊', PEST: '🐛', MAINTENANCE: '🛠️', WIFI: '📶', OTHER: '📋',
};

const FILTER_TABS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export default function ComplaintsPage() {
  const [status, setStatus] = useState('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['my-complaints', status],
    queryFn: () =>
      apiClient.get('/api/v1/complaints', {
        params: { status: status === 'ALL' ? undefined : status, limit: 50 },
      }).then(r => r.data),
  });

  const complaints = data?.data ?? [];

  const openCount = complaints.filter((c: any) => ['OPEN', 'IN_PROGRESS'].includes(c.status)).length;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Complaints</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {openCount > 0 ? `${openCount} open complaint${openCount > 1 ? 's' : ''}` : 'All resolved ✅'}
          </p>
        </div>
        <Link
          href="/complaints/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
        >
          <Plus className="h-4 w-4" /> New Complaint
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {FILTER_TABS.map(f => (
          <button
            key={f}
            onClick={() => setStatus(f)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all',
              status === f
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-card text-muted-foreground border-border hover:border-indigo-300'
            )}
          >
            {f === 'ALL' ? 'All' : STATUS_CONFIG[f]?.label ?? f}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No complaints {status !== 'ALL' ? `with status "${STATUS_CONFIG[status]?.label}"` : 'yet'}</p>
          <p className="text-sm text-muted-foreground mt-1">Issues with your accommodation? Raise one now.</p>
          <Link href="/complaints/new" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold">
            <Plus className="h-4 w-4" /> Raise a Complaint
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c: any) => {
            const cfg = STATUS_CONFIG[c.status];
            const Icon = cfg?.icon ?? Clock;
            return (
              <Link
                key={c._id}
                href={`/complaints/${c._id}`}
                className="block bg-card rounded-xl border hover:border-indigo-200 hover:shadow-sm transition-all p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0 mt-0.5">
                    {CATEGORY_ICONS[c.category] ?? '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground text-sm truncate">{c.title}</h3>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full', PRIORITY_BADGE[c.priority])}>
                        {c.priority}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border', cfg?.color)}>
                        <div className={cn('h-1.5 w-1.5 rounded-full', cfg?.dot)} />
                        {cfg?.label ?? c.status}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
                {/* Progress bar for timeline */}
                {c.status !== 'CLOSED' && (
                  <div className="mt-3 flex items-center gap-1">
                    {['OPEN', 'IN_PROGRESS', 'RESOLVED'].map((s, i) => {
                      const idx = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].indexOf(c.status);
                      return (
                        <div key={s} className={cn('h-1 flex-1 rounded-full', i <= idx ? 'bg-indigo-500' : 'bg-muted')} />
                      );
                    })}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
