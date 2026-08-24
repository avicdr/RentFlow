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
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${
      ok ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-400' : 'bg-red-900/30 border-red-700/50 text-red-400'
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
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Server className="h-6 w-6 text-indigo-400" /> System Health
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {dataUpdatedAt ? `Last checked ${new Date(dataUpdatedAt).toLocaleTimeString()}` : 'Checking...'}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin text-indigo-400' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Overall Status */}
      <div className={`rounded-xl border p-6 ${
        health?.data?.status === 'ok'
          ? 'bg-emerald-900/10 border-emerald-700/30'
          : 'bg-red-900/10 border-red-700/30'
      }`}>
        <div className="flex items-center gap-4">
          {health?.data?.status === 'ok'
            ? <CheckCircle className="h-10 w-10 text-emerald-400" />
            : <XCircle className="h-10 w-10 text-red-400" />
          }
          <div>
            <h2 className={`text-xl font-bold ${health?.data?.status === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
              {isLoading ? 'Checking...' : health?.data?.status === 'ok' ? 'All Systems Operational' : 'System Degraded'}
            </h2>
            <p className="text-gray-400 text-sm mt-0.5">
              Uptime: <span className="text-white font-medium">{uptimeStr}</span> ·
              Environment: <span className="text-white font-medium">{health?.data?.environment ?? 'production'}</span>
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
            <div key={key} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-gray-400" />
                  <span className="font-medium text-gray-200">{label}</span>
                </div>
                <div className={`h-2 w-2 rounded-full ${ok ? 'bg-emerald-400' : 'bg-red-500 animate-pulse'}`} />
              </div>
              <StatusBadge ok={ok} label={ok ? 'Operational' : 'Down'} />
              {check && typeof check === 'object' && check.responseMs && (
                <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {check.responseMs}ms
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Environment Variables Status */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-400" /> Environment Config
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-xs">
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
              <div key={key} className="flex items-center justify-between p-2.5 bg-gray-800/60 rounded-lg">
                <span className="text-gray-400">{label}</span>
                <span className={`font-medium ${set ? 'text-emerald-400' : 'text-red-400'}`}>
                  {set ? '✓ SET' : '✗ MISSING'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* PM2 Processes would be shown if we have a /health/processes endpoint */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-200 mb-1">Process Info</h2>
        <p className="text-xs text-gray-500 mb-4">Node.js runtime details for the API process</p>
        <div className="grid gap-2 sm:grid-cols-3 text-xs">
          {[
            { label: 'Node Version', value: health?.data?.nodeVersion },
            { label: 'Memory (RSS)', value: health?.data?.memory?.rss ? `${Math.round(health.data.memory.rss / 1024 / 1024)} MB` : null },
            { label: 'Heap Used', value: health?.data?.memory?.heapUsed ? `${Math.round(health.data.memory.heapUsed / 1024 / 1024)} MB` : null },
            { label: 'Heap Total', value: health?.data?.memory?.heapTotal ? `${Math.round(health.data.memory.heapTotal / 1024 / 1024)} MB` : null },
            { label: 'Platform', value: health?.data?.platform },
            { label: 'Started At', value: health?.data?.startedAt ? formatDate(health.data.startedAt) : null },
          ].map(({ label, value }) => (
            <div key={label} className="p-2.5 bg-gray-800/60 rounded-lg">
              <p className="text-gray-500">{label}</p>
              <p className="text-gray-200 font-medium mt-0.5">{value ?? '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
