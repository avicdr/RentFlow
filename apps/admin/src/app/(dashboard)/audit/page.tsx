'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, RefreshCw, ChevronRight, Activity } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatDate, timeAgo } from '@/lib/utils';

const ACTION_COLORS: Record<string, string> = {
  PAYMENT_APPROVED:        'bg-emerald-500/20 text-emerald-400 border-emerald-700/40',
  PAYMENT_REJECTED:        'bg-red-500/20 text-red-400 border-red-700/40',
  PAYMENT_SUBMITTED:       'bg-blue-500/20 text-blue-400 border-blue-700/40',
  TENANT_ONBOARDED:        'bg-indigo-500/20 text-indigo-400 border-indigo-700/40',
  PROPERTY_CREATED:        'bg-purple-500/20 text-purple-400 border-purple-700/40',
  PROPERTY_UPDATED:        'bg-purple-500/20 text-purple-400 border-purple-700/40',
  PROPERTY_DELETED:        'bg-red-500/20 text-red-400 border-red-700/40',
  COMPLAINT_CREATED:       'bg-orange-500/20 text-orange-400 border-orange-700/40',
  COMPLAINT_STATUS_UPDATED:'bg-yellow-500/20 text-yellow-400 border-yellow-700/40',
  USER_DELETED:            'bg-red-900/40 text-red-300 border-red-700/40',
  PROFILE_UPDATED:         'bg-gray-700/40 text-gray-400 border-gray-600/40',
  LOGIN:                   'bg-gray-700/20 text-gray-500 border-gray-700/20',
};

const SEVERITY_DOT: Record<string, string> = {
  INFO:     'bg-gray-600',
  WARNING:  'bg-yellow-500',
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
      apiClient.get('/api/v1/audit-logs', {          // ← correct path
        params: {
          resource:    resource === 'ALL' ? undefined : resource,
          action:      search   || undefined,          // search by action text
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
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-indigo-400" /> Audit Logs
          </h1>
          <p className="text-gray-400 text-sm mt-0.5 flex items-center gap-2">
            Immutable activity log · {meta?.total ?? 0} entries
            {isFetching && <RefreshCw className="h-3 w-3 animate-spin text-indigo-400" />}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live — refreshes every 15s
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by action (e.g. COMPLAINT_CREATED)..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-9 pl-9 pr-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <select
          value={resource}
          onChange={e => { setResource(e.target.value); setPage(1); }}
          className="h-9 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 outline-none"
        >
          {RESOURCE_TYPES.map(t => <option key={t} value={t}>{t === 'ALL' ? 'All Resources' : t}</option>)}
        </select>
        <select
          value={severity}
          onChange={e => { setSeverity(e.target.value); setPage(1); }}
          className="h-9 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 outline-none"
        >
          {SEVERITIES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Severity' : s}</option>)}
        </select>
      </div>

      {/* Log feed */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="divide-y divide-gray-800/50">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="px-5 py-3 flex gap-4">
                <div className="h-4 w-24 bg-gray-800 rounded animate-pulse" />
                <div className="h-4 flex-1 bg-gray-800 rounded animate-pulse" />
              </div>
            ))
          ) : logs.length === 0 ? (
            <div className="text-center py-20 text-gray-600 text-sm">
              <Activity className="h-10 w-10 mx-auto mb-3 opacity-20" />
              No audit logs found
            </div>
          ) : logs.map((log: any) => (
            <div key={log._id}>
              <button
                className="w-full text-left px-5 py-3 hover:bg-gray-800/40 transition-colors"
                onClick={() => setExpanded(expanded === log._id ? null : log._id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Severity dot */}
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${SEVERITY_DOT[log.severity] ?? 'bg-gray-600'}`} />

                  {/* Action badge */}
                  <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded border flex-shrink-0 ${ACTION_COLORS[log.action] ?? 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                    {log.action}
                  </span>

                  {/* Resource */}
                  <span className="text-xs text-gray-500 hidden sm:inline flex-shrink-0">
                    {log.resource}
                    {log.resourceId && (
                      <span className="font-mono text-gray-600 ml-1">
                        #{String(log.resourceId).slice(-8)}
                      </span>
                    )}
                  </span>

                  {/* Performer */}
                  {log.performedBy && (
                    <span className="hidden md:inline text-xs text-gray-600 truncate">
                      by <span className="text-gray-500">
                        {log.performedBy?.firstName
                          ? `${log.performedBy.firstName} ${log.performedBy.lastName}`
                          : log.performedBy?.email ?? String(log.performedBy).slice(-8)}
                      </span>
                    </span>
                  )}

                  <span className="ml-auto text-xs text-gray-600 flex-shrink-0 pl-3">
                    {timeAgo(log.createdAt)}
                  </span>
                  <ChevronRight className={`h-3.5 w-3.5 text-gray-600 transition-transform flex-shrink-0 ${expanded === log._id ? 'rotate-90' : ''}`} />
                </div>
              </button>

              {/* Expanded detail */}
              {expanded === log._id && (
                <div className="px-5 pb-4 bg-gray-950/60 border-t border-gray-800/50">
                  <div className="mt-3 grid gap-4 sm:grid-cols-2 text-xs">
                    <div>
                      <p className="text-gray-500 mb-2 font-semibold tracking-wider uppercase text-[10px]">Metadata</p>
                      <div className="space-y-1.5">
                        <div className="flex gap-2">
                          <span className="text-gray-600 w-24">Timestamp</span>
                          <span className="text-gray-300">{formatDate(log.createdAt)}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-gray-600 w-24">Severity</span>
                          <span className={`font-semibold ${
                            log.severity === 'CRITICAL' ? 'text-red-400' :
                            log.severity === 'WARNING'  ? 'text-yellow-400' : 'text-gray-400'
                          }`}>{log.severity}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-gray-600 w-24">Resource</span>
                          <span className="text-gray-300">{log.resource}</span>
                        </div>
                        {log.resourceId && (
                          <div className="flex gap-2">
                            <span className="text-gray-600 w-24">Resource ID</span>
                            <span className="text-gray-300 font-mono break-all">{String(log.resourceId)}</span>
                          </div>
                        )}
                        {log.metadata?.ipAddress && (
                          <div className="flex gap-2">
                            <span className="text-gray-600 w-24">IP</span>
                            <span className="text-gray-300 font-mono">{log.metadata.ipAddress}</span>
                          </div>
                        )}
                        {log.performedBy && (
                          <div className="flex gap-2">
                            <span className="text-gray-600 w-24">Performed by</span>
                            <span className="text-gray-300">
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
                        <p className="text-gray-500 mb-2 font-semibold tracking-wider uppercase text-[10px]">Changes</p>
                        <div className="space-y-2">
                          {log.before && Object.keys(log.before).length > 0 && (
                            <div>
                              <p className="text-red-500 text-[10px] mb-1 font-semibold">BEFORE</p>
                              <pre className="text-xs text-gray-400 bg-gray-900 rounded p-2 overflow-x-auto max-h-32">
                                {JSON.stringify(log.before, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.after && Object.keys(log.after).length > 0 && (
                            <div>
                              <p className="text-emerald-500 text-[10px] mb-1 font-semibold">AFTER</p>
                              <pre className="text-xs text-gray-400 bg-gray-900 rounded p-2 overflow-x-auto max-h-32">
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
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-800">
            <p className="text-xs text-gray-500">
              {((page - 1) * 30) + 1}–{Math.min(page * 30, meta.total)} of {meta.total} logs
            </p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs rounded bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-40">
                Previous
              </button>
              <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs rounded bg-gray-800 text-gray-400 hover:bg-gray-700 disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
