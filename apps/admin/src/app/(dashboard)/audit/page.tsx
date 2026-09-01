'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, RefreshCw, ChevronRight, Activity } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatDate, timeAgo } from '@/lib/utils';

const ACTION_COLORS: Record<string, string> = {
  PAYMENT_APPROVED:        'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
  PAYMENT_REJECTED:        'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800',
  PAYMENT_SUBMITTED:       'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  TENANT_ONBOARDED:        'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800',
  PROPERTY_CREATED:        'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
  PROPERTY_UPDATED:        'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
  PROPERTY_DELETED:        'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800',
  COMPLAINT_CREATED:       'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800',
  COMPLAINT_STATUS_UPDATED:'bg-yellow-50 dark:bg-yellow-950/60 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
  USER_DELETED:            'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800',
  PROFILE_UPDATED:         'bg-muted text-muted-foreground border border-border',
  LOGIN:                   'bg-muted text-muted-foreground border border-border',
};

const SEVERITY_DOT: Record<string, string> = {
  INFO:     'bg-muted-foreground',
  WARNING:  'bg-amber-500',
  CRITICAL: 'bg-red-500 animate-pulse',
};

const RESOURCE_TYPES = ['ALL', 'User', 'Property', 'Tenant', 'Payment', 'Complaint'];
const SEVERITIES     = ['ALL', 'INFO', 'WARNING', 'CRITICAL'];

export default function AdminAuditPage() {
  const [search,   setSearch]   = useState('');
  const [resource, setResource] = useState('ALL');
  const [severity, setSeverity] = useState('ALL');
  const [page,     setPage]     = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-audit', { search, resource, severity, page }],
    queryFn: () =>
      apiClient.get('/api/v1/audit-logs', {
        params: {
          resource:    resource === 'ALL' ? undefined : resource,
          action:      search   || undefined,
          severity:    severity === 'ALL' ? undefined : severity,
          page,
          limit: 30,
        },
      }).then(r => r.data),
    refetchInterval: 15000,
  });

  const logs = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-6 w-6 text-indigo-500" /> Audit Logs
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-2">
            Immutable activity log · {meta?.total ?? 0} entries
            {isFetching && <RefreshCw className="h-3 w-3 animate-spin text-indigo-500" />}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Live — refreshes every 15s
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by action (e.g. COMPLAINT_CREATED)..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-9 pl-9 pr-3 bg-background border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <select
          value={resource}
          onChange={e => { setResource(e.target.value); setPage(1); }}
          className="h-9 px-3 bg-background border border-input rounded-xl text-sm text-foreground outline-none"
        >
          {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t === 'ALL' ? 'All Resources' : t}</option>)}
        </select>
        <select
          value={severity}
          onChange={e => { setSeverity(e.target.value); setPage(1); }}
          className="h-9 px-3 bg-background border border-input rounded-xl text-sm text-foreground outline-none"
        >
          {SEVERITIES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Severity' : s}</option>)}
        </select>
      </div>

      {/* Log feed */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
        <div className="divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex gap-4">
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-4 flex-1 bg-muted rounded animate-pulse" />
              </div>
            ))
          ) : logs.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground text-sm">
              <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
              No audit logs found
            </div>
          ) : logs.map((log: any) => (
            <div key={log._id}>
              <button
                className="w-full text-left px-5 py-3.5 hover:bg-muted/40 transition-colors"
                onClick={() => setExpanded(expanded === log._id ? null : log._id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Severity dot */}
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${SEVERITY_DOT[log.severity] ?? 'bg-muted-foreground'}`} />

                  {/* Action badge */}
                  <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-md border flex-shrink-0 ${ACTION_COLORS[log.action] ?? 'bg-muted text-muted-foreground border-border'}`}>
                    {log.action}
                  </span>

                  {/* Resource */}
                  <span className="text-xs text-muted-foreground hidden sm:inline flex-shrink-0 font-medium">
                    {log.resource}
                    {log.resourceId && (
                      <span className="font-mono text-muted-foreground/80 ml-1">
                        #{String(log.resourceId).slice(-8)}
                      </span>
                    )}
                  </span>

                  {/* Performer */}
                  {log.performedBy && (
                    <span className="hidden md:inline text-xs text-muted-foreground truncate">
                      by <span className="font-medium text-foreground">
                        {log.performedBy?.firstName
                          ? `${log.performedBy.firstName} ${log.performedBy.lastName}`
                          : log.performedBy?.email ?? String(log.performedBy).slice(-8)}
                      </span>
                    </span>
                  )}

                  <span className="ml-auto text-xs text-muted-foreground flex-shrink-0 pl-3">
                    {timeAgo(log.createdAt)}
                  </span>
                  <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform flex-shrink-0 ${expanded === log._id ? 'rotate-90' : ''}`} />
                </div>
              </button>

              {/* Expanded detail */}
              {expanded === log._id && (
                <div className="px-5 py-4 bg-muted/30 border-t border-border">
                  <div className="grid gap-4 sm:grid-cols-2 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-2 font-semibold tracking-wider uppercase text-[10px]">Metadata</p>
                      <div className="space-y-1.5">
                        <div className="flex gap-2">
                          <span className="text-muted-foreground w-24">Timestamp</span>
                          <span className="text-foreground font-medium">{formatDate(log.createdAt)}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-muted-foreground w-24">Severity</span>
                          <span className={`font-semibold ${
                            log.severity === 'CRITICAL' ? 'text-red-500' :
                            log.severity === 'WARNING'  ? 'text-amber-500' : 'text-muted-foreground'
                          }`}>{log.severity}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-muted-foreground w-24">Resource</span>
                          <span className="text-foreground font-medium">{log.resource}</span>
                        </div>
                        {log.resourceId && (
                          <div className="flex gap-2">
                            <span className="text-muted-foreground w-24">Resource ID</span>
                            <span className="text-foreground font-mono break-all">{String(log.resourceId)}</span>
                          </div>
                        )}
                        {log.metadata?.ipAddress && (
                          <div className="flex gap-2">
                            <span className="text-muted-foreground w-24">IP</span>
                            <span className="text-foreground font-mono">{log.metadata.ipAddress}</span>
                          </div>
                        )}
                        {log.performedBy && (
                          <div className="flex gap-2">
                            <span className="text-muted-foreground w-24">Performed by</span>
                            <span className="text-foreground font-medium">
                              {log.performedBy?.firstName
                                ? `${log.performedBy.firstName} ${log.performedBy.lastName} (${log.performedBy.email})`
                                : log.performedBy?.email ?? String(log.performedBy)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {(log.before || log.after) && (
                      <div>
                        <p className="text-muted-foreground mb-2 font-semibold tracking-wider uppercase text-[10px]">Changes</p>
                        <div className="space-y-2">
                          {log.before && Object.keys(log.before).length > 0 && (
                            <div>
                              <p className="text-red-500 text-[10px] mb-1 font-semibold">BEFORE</p>
                              <pre className="text-xs text-foreground bg-background border border-border rounded-xl p-2.5 overflow-x-auto max-h-32 font-mono">
                                {JSON.stringify(log.before, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.after && Object.keys(log.after).length > 0 && (
                            <div>
                              <p className="text-emerald-500 text-[10px] mb-1 font-semibold">AFTER</p>
                              <pre className="text-xs text-foreground bg-background border border-border rounded-xl p-2.5 overflow-x-auto max-h-32 font-mono">
                                {JSON.stringify(log.after, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {((page - 1) * 30) + 1}–{Math.min(page * 30, meta.total)} of {meta.total} logs
            </p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs rounded-xl bg-background border border-input text-foreground hover:bg-muted disabled:opacity-40 font-medium">
                Previous
              </button>
              <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs rounded-xl bg-background border border-input text-foreground hover:bg-muted disabled:opacity-40 font-medium">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
