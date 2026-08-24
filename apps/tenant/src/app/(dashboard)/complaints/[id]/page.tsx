'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Clock, CheckCircle, AlertTriangle, XCircle,
  User, Calendar, Tag, MessageSquare, Image as ImageIcon,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  OPEN: { label: 'Open', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  IN_PROGRESS: { label: 'In Progress', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  RESOLVED: { label: 'Resolved', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  CLOSED: { label: 'Closed', icon: XCircle, color: 'text-muted-foreground', bg: 'bg-muted border-border' },
};

const TIMELINE_COLORS: Record<string, string> = {
  OPENED: 'bg-red-100 text-red-700 border-red-200',
  STATUS_CHANGED_TO_IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
  STATUS_CHANGED_TO_RESOLVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  STATUS_CHANGED_TO_CLOSED: 'bg-muted text-foreground border-border',
  NOTE_ADDED: 'bg-purple-100 text-purple-700 border-purple-200',
  ASSIGNED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

const TIMELINE_ICONS: Record<string, any> = {
  OPENED: AlertTriangle,
  STATUS_CHANGED_TO_IN_PROGRESS: Clock,
  STATUS_CHANGED_TO_RESOLVED: CheckCircle,
  STATUS_CHANGED_TO_CLOSED: XCircle,
  NOTE_ADDED: MessageSquare,
  DEFAULT: Tag,
};

function timelineLabel(action: string) {
  return action
    .replace('STATUS_CHANGED_TO_', 'Status → ')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^./, s => s.toUpperCase());
}

const PRIORITY_BADGE: Record<string, string> = {
  LOW: 'bg-muted text-muted-foreground',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

const CATEGORY_ICONS: Record<string, string> = {
  PLUMBING: '🔧', ELECTRICAL: '⚡', CLEANING: '🧹', SECURITY: '🔒',
  NOISE: '🔊', PEST: '🐛', MAINTENANCE: '🛠️', WIFI: '📶', OTHER: '📋',
};

export default function ComplaintDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: complaint, isLoading } = useQuery({
    queryKey: ['complaint', id],
    queryFn: () => apiClient.get(`/api/v1/complaints/${id}`).then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded-lg w-48" />
        <div className="h-40 bg-muted rounded-xl" />
        <div className="h-60 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!complaint) {
    return <div className="text-center py-16 text-muted-foreground">Complaint not found</div>;
  }

  const cfg = STATUS_CONFIG[complaint.status];
  const StatusIcon = cfg?.icon ?? Clock;
  const timeline = complaint.timeline ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-8">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Link href="/complaints">
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
        </Link>
        <h1 className="text-lg font-bold text-foreground truncate">{complaint.title}</h1>
      </div>

      {/* Status Banner */}
      <div className={cn('rounded-xl border p-4 flex items-center gap-3', cfg?.bg)}>
        <StatusIcon className={cn('h-5 w-5 flex-shrink-0', cfg?.color)} />
        <div>
          <p className={cn('font-semibold', cfg?.color)}>Status: {cfg?.label}</p>
          {complaint.resolvedAt && (
            <p className="text-xs text-muted-foreground mt-0.5">Resolved on {formatDate(complaint.resolvedAt)}</p>
          )}
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-card rounded-xl border p-5 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{CATEGORY_ICONS[complaint.category] ?? '📋'}</span>
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                {complaint.category?.replace('_', ' ')}
              </span>
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', PRIORITY_BADGE[complaint.priority])}>
                {complaint.priority} Priority
              </span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{complaint.description}</p>
          </div>
        </div>

        <div className="pt-4 border-t grid grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Raised {formatDate(complaint.createdAt)}
          </div>
          {complaint.propertyId && (
            <div className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              {complaint.propertyId?.name}
            </div>
          )}
          {complaint.assignedTo && (
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              Assigned to {complaint.assignedTo?.firstName}
            </div>
          )}
        </div>

        {/* Resolution Note */}
        {complaint.resolutionNote && (
          <div className="pt-4 border-t">
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">RESOLUTION NOTE</p>
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
              <p className="text-sm text-emerald-800">{complaint.resolutionNote}</p>
            </div>
          </div>
        )}
      </div>

      {/* Attached Photos */}
      {complaint.attachments?.length > 0 && (
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" /> Attached Photos ({complaint.attachments.length})
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {complaint.attachments.map((path: string, i: number) => (
              <a
                key={i}
                href={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${path.split('/uploads/')[1]}`}
                target="_blank"
                rel="noreferrer"
                className="aspect-square rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity bg-muted block"
              >
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${path.split('/uploads/')[1]}`}
                  alt={`Attachment ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-card rounded-xl border p-5">
        <h2 className="font-semibold text-sm text-foreground mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" /> Activity Timeline
        </h2>

        {timeline.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No activity recorded yet</p>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-muted" />

            <div className="space-y-5">
              {timeline.map((entry: any, i: number) => {
                const Icon = TIMELINE_ICONS[entry.action] ?? TIMELINE_ICONS.DEFAULT;
                const colorClass = TIMELINE_COLORS[entry.action] ?? 'bg-muted text-muted-foreground border-border';
                const isLast = i === timeline.length - 1;

                return (
                  <div key={i} className="flex items-start gap-4 relative">
                    {/* Icon */}
                    <div className={cn(
                      'h-8 w-8 rounded-full border flex items-center justify-center flex-shrink-0 z-10 bg-card',
                      colorClass,
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{timelineLabel(entry.action)}</p>
                          {entry.note && (
                            <p className="text-xs text-muted-foreground mt-1 bg-muted rounded-lg px-3 py-2 border border-border">
                              "{entry.note}"
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                          {formatDate(entry.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
