'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Loader2, AlertTriangle, CreditCard, MessageSquare, Info } from 'lucide-react';
import apiClient from '@/lib/api-client';

const ICON_MAP: Record<string, any> = {
  PAYMENT_REMINDER: CreditCard,
  PAYMENT_RECEIVED: CreditCard,
  COMPLAINT_UPDATE: MessageSquare,
  ANNOUNCEMENT: Info,
  ALERT: AlertTriangle,
};

const COLOR_MAP: Record<string, string> = {
  PAYMENT_REMINDER: 'bg-orange-100 text-orange-600',
  PAYMENT_RECEIVED: 'bg-emerald-100 text-emerald-600',
  COMPLAINT_UPDATE: 'bg-blue-100 text-blue-600',
  ANNOUNCEMENT: 'bg-indigo-100 text-indigo-600',
  ALERT: 'bg-red-100 text-red-600',
};

export default function TenantNotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get('/api/v1/notifications').then(r => r.data.data),
  });

  const { mutate: markRead } = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/api/v1/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const { mutate: markAllRead, isPending } = useMutation({
    mutationFn: () => apiClient.patch('/api/v1/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications: any[] = data ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">Updates and alerts for your tenancy</p>
        </div>
        <button
          onClick={() => markAllRead()}
          disabled={isPending || notifications.every(n => n.isRead)}
          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:hover:text-indigo-600 transition-colors"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Mark all as read
        </button>
      </div>

      <div className="bg-card rounded-xl border divide-y overflow-hidden">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 flex gap-4">
              <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted w-1/4 rounded animate-pulse" />
                <div className="h-3 bg-muted w-3/4 rounded animate-pulse" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">You have no new notifications.</p>
          </div>
        ) : (
          notifications.map((n: any) => {
            const Icon = ICON_MAP[n.type] ?? Bell;
            const colorClass = COLOR_MAP[n.type] ?? 'bg-muted text-muted-foreground';
            return (
              <div key={n._id} className={`p-4 flex gap-4 transition-colors hover:bg-muted ${!n.isRead ? 'bg-indigo-50/30' : ''}`}>
                <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <p className={`text-sm ${!n.isRead ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}>{n.title}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(n.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <p className={`text-sm mt-0.5 ${!n.isRead ? 'text-muted-foreground' : 'text-muted-foreground'}`}>{n.body || n.message}</p>
                </div>
                {!n.isRead && (
                  <button onClick={() => markRead(n._id)} className="h-8 w-8 rounded-full flex items-center justify-center text-indigo-600 hover:bg-indigo-100 transition-colors flex-shrink-0" title="Mark as read">
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
