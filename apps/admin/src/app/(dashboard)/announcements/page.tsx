'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  Megaphone, Plus, X, Trash2, Loader2, Clock, CheckCircle,
  AlertTriangle, Users, Bell,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatDate, timeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';

const TARGET_ROLES = [
  { value: 'ALL', label: 'All Users' },
  { value: 'LANDLORD', label: 'Landlords Only' },
  { value: 'TENANT', label: 'Tenants Only' },
  { value: 'BROKER', label: 'Brokers Only' },
];

const TYPE_CONFIG: Record<string, { color: string; icon: any }> = {
  INFO: { color: 'bg-blue-900/30 border-blue-700/40 text-blue-300', icon: Bell },
  WARNING: { color: 'bg-yellow-900/30 border-yellow-700/40 text-yellow-300', icon: AlertTriangle },
  MAINTENANCE: { color: 'bg-orange-900/30 border-orange-700/40 text-orange-300', icon: Clock },
  FEATURE: { color: 'bg-indigo-900/30 border-indigo-700/40 text-indigo-300', icon: CheckCircle },
};

function CreateAnnouncementModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: '', body: '', targetRole: 'ALL', type: 'INFO', expiresInDays: 7, pinned: false,
  });
  const { mutate, isPending, isError } = useMutation({
    mutationFn: () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + form.expiresInDays);
      return apiClient.post('/api/v1/announcements', { ...form, expiresAt });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['announcements'] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-indigo-400" /> New Announcement
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-800 text-gray-400"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1.5">Title *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Scheduled maintenance tonight"
              className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1.5">Message *</label>
            <textarea
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              rows={4}
              placeholder="Announcement details..."
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1.5">Target Audience</label>
              <select value={form.targetRole} onChange={e => setForm(f => ({ ...f, targetRole: e.target.value }))} className="w-full h-9 px-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none">
                {TARGET_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full h-9 px-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none">
                {['INFO', 'WARNING', 'MAINTENANCE', 'FEATURE'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-400 block mb-1.5">Expires In (days)</label>
              <input
                type="number" min={1} max={90}
                value={form.expiresInDays}
                onChange={e => setForm(f => ({ ...f, expiresInDays: +e.target.value }))}
                className="w-full h-9 px-3 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-4">
              <input type="checkbox" checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))} className="rounded" />
              <span className="text-sm text-gray-400">Pin to top</span>
            </label>
          </div>
        </div>

        {isError && (
          <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-900/30 border border-red-700/40 rounded-lg px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5" /> Failed to create announcement
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800">Cancel</button>
          <button
            onClick={() => form.title && form.body && mutate()}
            disabled={isPending || !form.title || !form.body}
            className="flex-1 h-10 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Broadcasting...</> : <><Megaphone className="h-4 w-4" />Broadcast</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => apiClient.get('/api/v1/announcements').then(r => r.data.data),
  });

  const { mutate: deleteAnnouncement } = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/announcements/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });

  const announcements = data ?? [];
  const active = announcements.filter((a: any) => new Date(a.expiresAt) > new Date()).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-indigo-400" /> Announcements
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">{active} active broadcast{active !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> New Announcement
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-gray-800 rounded-xl animate-pulse" />)}</div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 rounded-xl border border-gray-800">
          <Megaphone className="h-12 w-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No announcements yet</p>
          <p className="text-gray-600 text-sm mt-1">Broadcast updates to all users or specific roles.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann: any) => {
            const cfg = TYPE_CONFIG[ann.type] ?? TYPE_CONFIG.INFO;
            const Icon = cfg.icon;
            const expired = new Date(ann.expiresAt) < new Date();
            return (
              <div key={ann._id} className={cn('bg-gray-900 border rounded-xl p-5', expired ? 'border-gray-800 opacity-60' : 'border-gray-800')}>
                <div className="flex items-start gap-4">
                  <div className={cn('h-10 w-10 rounded-xl border flex items-center justify-center flex-shrink-0', cfg.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-100">{ann.title}</p>
                      {ann.pinned && <span className="text-xs bg-indigo-900/50 text-indigo-300 border border-indigo-700/40 px-2 py-0.5 rounded-full">📌 Pinned</span>}
                      <span className={cn('text-xs px-2 py-0.5 rounded-full border', cfg.color)}>{ann.type}</span>
                      {expired && <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">Expired</span>}
                    </div>
                    <p className="text-sm text-gray-400 mt-1 leading-relaxed">{ann.body}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{ann.targetRole === 'ALL' ? 'All Users' : ann.targetRole}</span>
                      <span>Created {timeAgo(ann.createdAt)}</span>
                      <span>Expires {formatDate(ann.expiresAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { if (confirm('Delete this announcement?')) deleteAnnouncement(ann._id); }}
                    className="p-2 rounded-lg hover:bg-gray-800 text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {createOpen && <CreateAnnouncementModal onClose={() => setCreateOpen(false)} />}
    </div>
  );
}
