'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar, Clock, Wrench, Shield, CheckCircle, XCircle, AlertTriangle,
  ArrowLeft, Plus, Users, BedDouble, History, Filter, Sparkles, Building2,
  CalendarCheck, MoreVertical, X,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatDate, formatDateShort, timeAgo } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  AVAILABLE: { label: 'Available', bg: 'bg-emerald-50 dark:bg-emerald-950/60', color: 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  PARTIALLY_OCCUPIED: { label: 'Partially Occupied', bg: 'bg-teal-50 dark:bg-teal-950/60', color: 'text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800' },
  OCCUPIED: { label: 'Occupied', bg: 'bg-blue-50 dark:bg-blue-950/60', color: 'text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  FULLY_OCCUPIED: { label: 'Fully Occupied', bg: 'bg-blue-50 dark:bg-blue-950/60', color: 'text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  NOTICE_PERIOD: { label: 'Notice Period', bg: 'bg-amber-50 dark:bg-amber-950/60', color: 'text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  MAINTENANCE: { label: 'Under Maintenance', bg: 'bg-purple-50 dark:bg-purple-950/60', color: 'text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800' },
  RESERVED: { label: 'Reserved (Pending Move-in)', bg: 'bg-indigo-50 dark:bg-indigo-950/60', color: 'text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' },
  UNAVAILABLE: { label: 'Unavailable / Off-market', bg: 'bg-muted', color: 'text-muted-foreground border-border' },
};

function ManageRoomModal({ room, onClose }: { room: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'notice' | 'maintenance' | 'status'>('notice');

  // Notice form
  const [moveOutDate, setMoveOutDate] = useState(
    room.noticeDetails?.moveOutDate ? new Date(room.noticeDetails.moveOutDate).toISOString().split('T')[0] : ''
  );
  const [noticeReason, setNoticeReason] = useState(room.noticeDetails?.reason || '');

  // Maintenance form
  const [maintReason, setMaintReason] = useState(room.maintenanceDetails?.reason || '');
  const [expectedEndDate, setExpectedEndDate] = useState(
    room.maintenanceDetails?.expectedEndDate ? new Date(room.maintenanceDetails.expectedEndDate).toISOString().split('T')[0] : ''
  );
  const [maintNotes, setMaintNotes] = useState(room.maintenanceDetails?.notes || '');

  // Status form
  const [customStatus, setCustomStatus] = useState(room.status);

  const { mutate: recordNotice, isPending: pendingNotice } = useMutation({
    mutationFn: () => apiClient.post(`/api/v1/rooms/${room._id}/notice`, { moveOutDate, reason: noticeReason }),
    onSuccess: () => { qc.invalidateQueries(); onClose(); },
  });

  const { mutate: cancelNotice, isPending: pendingCancelNotice } = useMutation({
    mutationFn: () => apiClient.delete(`/api/v1/rooms/${room._id}/notice`),
    onSuccess: () => { qc.invalidateQueries(); onClose(); },
  });

  const { mutate: startMaintenance, isPending: pendingMaint } = useMutation({
    mutationFn: () => apiClient.post(`/api/v1/rooms/${room._id}/maintenance/start`, {
      reason: maintReason,
      expectedEndDate: expectedEndDate || undefined,
      notes: maintNotes,
    }),
    onSuccess: () => { qc.invalidateQueries(); onClose(); },
  });

  const { mutate: endMaintenance, isPending: pendingEndMaint } = useMutation({
    mutationFn: () => apiClient.post(`/api/v1/rooms/${room._id}/maintenance/end`),
    onSuccess: () => { qc.invalidateQueries(); onClose(); },
  });

  const { mutate: setStatus, isPending: pendingStatus } = useMutation({
    mutationFn: () => apiClient.patch(`/api/v1/rooms/${room._id}/availability`, { status: customStatus }),
    onSuccess: () => { qc.invalidateQueries(); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Room {room.roomNumber} Availability</h2>
            <p className="text-xs text-muted-foreground">{room.type} · Floor {room.floor || 'G'} · Current: {room.status}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>

        {/* Tab selector */}
        <div className="flex gap-2 p-1 rounded-xl bg-muted/60 border border-border">
          <button
            onClick={() => setTab('notice')}
            className={cn('flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all', tab === 'notice' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground')}
          >
            Notice Period
          </button>
          <button
            onClick={() => setTab('maintenance')}
            className={cn('flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all', tab === 'maintenance' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground')}
          >
            Maintenance
          </button>
          <button
            onClick={() => setTab('status')}
            className={cn('flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all', tab === 'status' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground')}
          >
            Manual Status
          </button>
        </div>

        {tab === 'notice' && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Recording a notice period allows the room to remain occupied while publishing future availability on your public listing.
            </p>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Tenant Move-Out Date *</label>
              <input
                type="date"
                value={moveOutDate}
                onChange={e => setMoveOutDate(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Reason / Notes</label>
              <input
                placeholder="e.g. Relocating for work / End of tenancy"
                value={noticeReason}
                onChange={e => setNoticeReason(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="flex gap-3 pt-2">
              {room.status === 'NOTICE_PERIOD' && (
                <button
                  onClick={() => cancelNotice()}
                  disabled={pendingCancelNotice}
                  className="px-4 h-10 rounded-xl bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100"
                >
                  Cancel Notice
                </button>
              )}
              <button
                onClick={() => moveOutDate && recordNotice()}
                disabled={!moveOutDate || pendingNotice}
                className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {pendingNotice ? 'Saving...' : 'Record Move-Out Notice'}
              </button>
            </div>
          </div>
        )}

        {tab === 'maintenance' && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Mark this room unavailable for bookings while repairs or renovations are taking place.
            </p>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Maintenance Reason *</label>
              <input
                placeholder="e.g. AC replacement, Painting, Deep cleaning, Plumbing"
                value={maintReason}
                onChange={e => setMaintReason(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Expected Completion Date</label>
              <input
                type="date"
                value={expectedEndDate}
                onChange={e => setExpectedEndDate(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Internal Notes</label>
              <textarea
                rows={2}
                placeholder="Vendor details, cost estimate, parts..."
                value={maintNotes}
                onChange={e => setMaintNotes(e.target.value)}
                className="w-full p-2.5 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              {room.status === 'MAINTENANCE' && (
                <button
                  onClick={() => endMaintenance()}
                  disabled={pendingEndMaint}
                  className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  {pendingEndMaint ? 'Completing...' : '✓ Complete Maintenance'}
                </button>
              )}
              {room.status !== 'MAINTENANCE' && (
                <button
                  onClick={() => maintReason && startMaintenance()}
                  disabled={!maintReason || pendingMaint}
                  className="flex-1 h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {pendingMaint ? 'Saving...' : 'Start Maintenance'}
                </button>
              )}
            </div>
          </div>
        )}

        {tab === 'status' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Set Room Status</label>
              <select
                value={customStatus}
                onChange={e => setCustomStatus(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-input rounded-xl text-sm text-foreground focus:outline-none"
              >
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="UNAVAILABLE">Unavailable / Off-Market</option>
                <option value="RESERVED">Reserved</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-input text-xs font-medium">Cancel</button>
              <button
                onClick={() => setStatus()}
                disabled={pendingStatus}
                className="flex-1 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
              >
                {pendingStatus ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PropertyAvailabilityPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  const { data: timelineData, isLoading } = useQuery({
    queryKey: ['property-timeline', id],
    queryFn: () => apiClient.get(`/api/v1/rooms/timeline/${id}`).then(r => r.data.data),
  });

  const { data: propertyData } = useQuery({
    queryKey: ['property-detail', id],
    queryFn: () => apiClient.get(`/api/v1/properties/${id}`).then(r => r.data.data),
  });

  const rooms: any[] = timelineData?.rooms || [];
  const events: any[] = timelineData?.recentEvents || [];
  const property = propertyData;

  // Group rooms by floor
  const floors = Array.from(new Set(rooms.map(r => r.floor || 0))).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href={`/properties/${id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to {property?.name || 'Property'}
          </Link>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-500" /> Availability & Occupancy Calendar
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage notice periods, maintenance schedules, and unit availability across {property?.name}
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <p className="text-xs text-muted-foreground font-medium">Available Rooms</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {rooms.filter(r => r.status === 'AVAILABLE' || r.status === 'PARTIALLY_OCCUPIED').length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <p className="text-xs text-muted-foreground font-medium">Occupied Rooms</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {rooms.filter(r => r.status === 'OCCUPIED' || r.status === 'FULLY_OCCUPIED').length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border rounded-2xl shadow-xs">
          <p className="text-xs text-muted-foreground font-medium">In Notice Period</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {rooms.filter(r => r.status === 'NOTICE_PERIOD').length}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <p className="text-xs text-muted-foreground font-medium">Under Maintenance</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {rooms.filter(r => r.status === 'MAINTENANCE').length}
          </p>
        </div>
      </div>

      {/* Visual Floor Grid */}
      <div className="space-y-6">
        {floors.map(floorNum => {
          const floorRooms = rooms.filter(r => (r.floor || 0) === floorNum);
          return (
            <div key={floorNum} className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-500" /> Floor {floorNum === 0 ? 'Ground Floor (0)' : `Floor ${floorNum}`}
                </h3>
                <span className="text-xs text-muted-foreground">{floorRooms.length} room{floorRooms.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {floorRooms.map(room => {
                  const cfg = STATUS_CONFIG[room.status] || STATUS_CONFIG.AVAILABLE;
                  return (
                    <div
                      key={room._id}
                      className="p-4 rounded-xl border border-border bg-muted/20 hover:border-primary/40 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-foreground text-base">Room {room.roomNumber}</h4>
                            <p className="text-xs text-muted-foreground">{room.type} · ₹{room.monthlyRent || room.rentPerBed}/mo</p>
                          </div>
                          <span className={cn('text-[11px] px-2.5 py-1 rounded-full font-bold border', cfg.color)}>
                            {cfg.label}
                          </span>
                        </div>

                        {room.status === 'NOTICE_PERIOD' && room.noticeDetails?.moveOutDate && (
                          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                            <p className="font-semibold flex items-center gap-1"><Clock className="h-3 w-3" /> Vacating on {formatDateShort(room.noticeDetails.moveOutDate)}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Next available: {room.availableFrom ? formatDateShort(room.availableFrom) : 'TBD'}</p>
                          </div>
                        )}

                        {room.status === 'MAINTENANCE' && room.maintenanceDetails && (
                          <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-800 dark:text-purple-300">
                            <p className="font-semibold flex items-center gap-1"><Wrench className="h-3 w-3" /> {room.maintenanceDetails.reason}</p>
                            {room.maintenanceDetails.expectedEndDate && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">Expected completion: {formatDateShort(room.maintenanceDetails.expectedEndDate)}</p>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedRoom(room)}
                        className="w-full h-8 rounded-lg bg-background border border-input text-xs font-semibold text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1 shadow-2xs"
                      >
                        Manage Availability
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity / Availability Events Log */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
          <History className="h-4 w-4 text-indigo-500" /> Availability & Maintenance Log
        </h3>

        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No recorded status events yet</p>
        ) : (
          <div className="divide-y divide-border text-xs">
            {events.map(ev => (
              <div key={ev._id} className="py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold px-2 py-0.5 bg-muted rounded text-[11px] text-foreground">
                    {ev.eventType}
                  </span>
                  <span className="text-muted-foreground">
                    {ev.fromStatus} → <span className="font-semibold text-foreground">{ev.toStatus}</span>
                  </span>
                  {ev.reason && <span className="text-muted-foreground truncate max-w-xs">({ev.reason})</span>}
                </div>
                <span className="text-muted-foreground flex-shrink-0">{timeAgo(ev.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedRoom && <ManageRoomModal room={selectedRoom} onClose={() => setSelectedRoom(null)} />}
    </div>
  );
}
