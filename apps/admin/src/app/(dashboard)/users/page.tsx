'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, UserCheck, UserX,
  MoreVertical, Eye, Trash2, RefreshCw, Download,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatDateShort, timeAgo } from '@/lib/utils';
import { QuerySkeleton, QueryEmpty, QueryError } from '@/components/ui/query-states';

const ROLES = ['ALL', 'LANDLORD', 'TENANT', 'BROKER', 'PROPERTY_MANAGER', 'SUPER_ADMIN'];
const STATUSES = ['ALL', 'ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'];

const ROLE_BADGE: Record<string, string> = {
  LANDLORD:         'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/60 dark:text-indigo-300 dark:border-indigo-700/50',
  TENANT:           'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-700/50',
  BROKER:           'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/60 dark:text-amber-300 dark:border-amber-700/50',
  PROPERTY_MANAGER: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/60 dark:text-blue-300 dark:border-blue-700/50',
  SUPER_ADMIN:      'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/60 dark:text-red-300 dark:border-red-700/50',
};

const STATUS_DOT: Record<string, string> = {
  ACTIVE:               'bg-emerald-500',
  SUSPENDED:            'bg-red-500',
  PENDING_VERIFICATION: 'bg-yellow-500',
};

export default function AdminUsersPage() {
  const [search, setSearch]   = useState('');
  const [role, setRole]       = useState('ALL');
  const [status, setStatus]   = useState('ALL');
  const [page, setPage]       = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const qc = useQueryClient();

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['admin-users', { search, role, status, page }],
    queryFn: () =>
      apiClient.get('/api/v1/admin/users', {
        params: {
          search: search || undefined,
          role:   role   === 'ALL' ? undefined : role,
          status: status === 'ALL' ? undefined : status,
          page, limit: 25,
        },
      }).then(r => r.data),
  });

  const { mutate: suspendUser } = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/api/v1/admin/users/${id}/suspend`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const { mutate: activateUser } = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/api/v1/admin/users/${id}/activate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const { mutate: deleteUser } = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const users = data?.data ?? [];
  const meta  = data?.meta;

  const toggleSelect = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {meta?.total ?? '—'} total accounts across all roles
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors border border-border">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-9 pl-9 pr-3 bg-background border border-input rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <select
          value={role}
          onChange={e => { setRole(e.target.value); setPage(1); }}
          className="h-9 px-3 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {ROLES.map(r => <option key={r} value={r}>{r === 'ALL' ? 'All Roles' : r.replace('_', ' ')}</option>)}
        </select>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="h-9 px-3 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {STATUSES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Status' : s.replace('_', ' ')}</option>)}
        </select>
        {isFetching && (
          <div className="h-9 flex items-center px-3">
            <RefreshCw className="h-4 w-4 text-primary animate-spin" />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-input bg-background"
                    onChange={e => setSelected(e.target.checked ? users.map((u: any) => u._id) : [])}
                    checked={selected.length === users.length && users.length > 0}
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Verified</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Last Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <QuerySkeleton rows={8} cols={8} />
              ) : isError ? (
                <QueryError colSpan={8} onRetry={() => refetch()} />
              ) : users.length === 0 ? (
                <QueryEmpty
                  colSpan={8}
                  title="No users found"
                  description="Try adjusting your search or filter criteria."
                />
              ) : users.map((u: any) => (
                <tr
                  key={u._id}
                  className={`hover:bg-muted/30 transition-colors ${selected.includes(u._id) ? 'bg-primary/5' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(u._id)}
                      onChange={() => toggleSelect(u._id)}
                      className="rounded border-input bg-background"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/users/${u._id}`} className="flex items-center gap-3 group">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 group-hover:scale-105 transition-transform">
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${ROLE_BADGE[u.role] ?? 'bg-muted text-muted-foreground border-border'}`}>
                      {u.role?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[u.status] ?? 'bg-muted-foreground'}`} />
                      <span className="text-xs text-muted-foreground">{u.status?.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {u.isEmailVerified && (
                        <span title="Email verified" className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">✉️</span>
                      )}
                      {u.isPhoneVerified && (
                        <span title="Phone verified" className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">📱</span>
                      )}
                      {u.isKycVerified && (
                        <span title="KYC verified" className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded">🆔</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateShort(u.createdAt)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{u.lastLoginAt ? timeAgo(u.lastLoginAt) : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/users/${u._id}`}
                        title="View Profile & Stays"
                        className="p-1.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      {u.status === 'ACTIVE' ? (
                        <button
                          onClick={() => { if (confirm(`Suspend ${u.firstName}?`)) suspendUser(u._id); }}
                          title="Suspend"
                          className="p-1.5 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 transition-colors"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => activateUser(u._id)}
                          title="Activate"
                          className="p-1.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 transition-colors"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => { if (confirm(`Permanently delete ${u.firstName}? This cannot be undone.`)) deleteUser(u._id); }}
                        title="Delete"
                        className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {((page - 1) * 25) + 1}–{Math.min(page * 25, meta.total)} of {meta.total}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed border border-border"
              >
                Previous
              </button>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed border border-border"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
