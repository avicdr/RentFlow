'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Server, Database, Activity, Cpu, HardDrive, CheckCircle,
  XCircle, AlertTriangle, RefreshCw, Clock,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold ${
      ok ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
    }`}>
      {ok ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      {label}
    </div>
  );
}

export default function AdminSystemPage() {
  const { data: health, isLoading, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: () => apiClient.get('/api/v1/health').then(r => r.data),
    refetchInterval: 30000,
  });

  const uptime = health?.data?.uptime;
  const uptimeStr = uptime
    ? `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`
    : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Server className="h-6 w-6 text-indigo-500" /> System Health
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {dataUpdatedAt ? `Last checked ${new Date(dataUpdatedAt).toLocaleTimeString()}` : 'Checking...'}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-colors border border-border"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-indigo-500' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Overall Status */}
      <div className={`rounded-2xl border p-6 shadow-xs ${
        health?.data?.status === 'ok'
          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
          : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
      }`}>
        <div className="flex items-center gap-4">
          {health?.data?.status === 'ok'
            ? <CheckCircle className="h-10 w-10 text-emerald-500 flex-shrink-0" />
            : <XCircle className="h-10 w-10 text-red-500 flex-shrink-0" />
          }
          <div>
            <h2 className={`text-xl font-bold ${health?.data?.status === 'ok' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
              {isLoading ? 'Checking...' : health?.data?.status === 'ok' ? 'All Systems Operational' : 'System Degraded'}
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Uptime: <span className="text-foreground font-semibold">{uptimeStr}</span> ·
              Environment: <span className="text-foreground font-semibold">{health?.data?.environment ?? 'production'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Service Checks */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { key: 'database', label: 'MongoDB', icon: Database },
          { key: 'api', label: 'NestJS API', icon: Server },
          { key: 'storage', label: 'File Storage', icon: HardDrive },
          { key: 'email', label: 'SMTP Email', icon: Activity },
          { key: 'jwt', label: 'JWT Auth', icon: CheckCircle },
          { key: 'redis', label: 'Redis Cache', icon: Cpu },
        ].map(({ key, label, icon: Icon }) => {
          const check = health?.data?.checks?.[key];
          const ok = check !== 'error' && check !== false;
          return (
            <div key={key} className="bg-card border border-border rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-indigo-500" />
                  <span className="font-semibold text-foreground text-sm">{label}</span>
                </div>
                <div className={`h-2.5 w-2.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
              </div>
              <StatusBadge ok={ok} label={ok ? 'Operational' : 'Down'} />
              {check && typeof check === 'object' && check.responseMs && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {check.responseMs}ms
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Environment Variables Status */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" /> Environment Config
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 text-xs">
          {[
            { key: 'MONGO_URI', label: 'MongoDB URI' },
            { key: 'JWT_ACCESS_SECRET', label: 'JWT Access Secret' },
            { key: 'JWT_REFRESH_SECRET', label: 'JWT Refresh Secret' },
            { key: 'SMTP_HOST', label: 'SMTP Host' },
            { key: 'UPLOAD_DIR', label: 'Upload Directory' },
            { key: 'DIGILOCKER_CLIENT_ID', label: 'DigiLocker Client ID' },
          ].map(({ key, label }) => {
            const set = health?.data?.env?.[key] === true;
            return (
              <div key={key} className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border">
                <span className="text-muted-foreground font-medium">{label}</span>
                <span className={`font-bold ${set ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {set ? '✓ SET' : '✗ MISSING'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Process Info */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-foreground mb-1">Process Info</h2>
        <p className="text-xs text-muted-foreground mb-4">Node.js runtime details for the API process</p>
        <div className="grid gap-2.5 sm:grid-cols-3 text-xs">
          {[
            { label: 'Node Version', value: health?.data?.nodeVersion },
            { label: 'Memory (RSS)', value: health?.data?.memory?.rss ? `${Math.round(health.data.memory.rss / 1024 / 1024)} MB` : null },
            { label: 'Heap Used', value: health?.data?.memory?.heapUsed ? `${Math.round(health.data.memory.heapUsed / 1024 / 1024)} MB` : null },
            { label: 'Heap Total', value: health?.data?.memory?.heapTotal ? `${Math.round(health.data.memory.heapTotal / 1024 / 1024)} MB` : null },
            { label: 'Platform', value: health?.data?.platform },
            { label: 'Started At', value: health?.data?.startedAt ? formatDate(health.data.startedAt) : null },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 bg-muted/40 rounded-xl border border-border">
              <p className="text-muted-foreground">{label}</p>
              <p className="text-foreground font-semibold mt-0.5">{value ?? '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
