'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Plus, BedDouble, Users, Trash2,
  ChevronDown, ChevronRight, Edit3, Check, X, Loader2,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton';

import { RoomConfigurator, defaultRoomConfig, type RoomConfig } from '@/components/ui/room-configurator';

const BED_TYPES = ['SINGLE', 'DOUBLE', 'BUNK_LOWER', 'BUNK_UPPER', 'QUEEN'];

function AddRoomModal({ propertyId, onClose }: { propertyId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [config, setConfig] = useState<RoomConfig>(defaultRoomConfig());

  const { mutate, isPending } = useMutation({
    mutationFn: () => apiClient.post('/api/v1/rooms', {
      floor: config.floor,
      type: config.type,
      capacity: config.capacity,
      monthlyRent: config.monthlyRent,
      rentPerBed: config.rentPerBed,
      description: config.description,
      count: 1,
      propertyId,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms', propertyId] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-xl p-6 my-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">Add Room</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <RoomConfigurator value={config} onChange={setConfig} />
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border text-muted-foreground text-sm font-medium hover:bg-muted">Cancel</button>
          <button
            onClick={() => mutate()}
            disabled={isPending}
            className="flex-1 h-10 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Adding...</> : 'Add Room'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddBedModal({ roomId, propertyId, onClose }: { roomId: string; propertyId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ bedNumber: '', type: 'SINGLE' });
  const { mutate, isPending } = useMutation({
    mutationFn: () => apiClient.post('/api/v1/beds', { ...form, roomId, propertyId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rooms', propertyId] }); onClose(); },
  });
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">Add Bed</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Bed Number/Label *</label>
            <input value={form.bedNumber} onChange={e => setForm(f => ({ ...f, bedNumber: e.target.value }))} placeholder="e.g. A, B, 1" className="w-full h-9 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">Bed Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full h-9 px-2 rounded-lg border text-sm focus:outline-none">
              {BED_TYPES.map(t => <option key={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border text-muted-foreground text-sm font-medium">Cancel</button>
          <button onClick={() => mutate()} disabled={isPending || !form.bedNumber} className="flex-1 h-10 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
            {isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Adding...</> : 'Add Bed'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoomCard({ room, propertyId }: { room: any; propertyId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [addBed, setAddBed] = useState(false);
  const qc = useQueryClient();
  const occupiedBeds = room.beds?.filter((b: any) => b.status === 'OCCUPIED').length ?? 0;
  const totalBeds = room.beds?.length ?? room.capacity ?? 0;
  const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const { mutate: deleteRoom } = useMutation({
    mutationFn: () => apiClient.delete(`/api/v1/rooms/${room._id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms', propertyId] }),
  });

  return (
    <>
      <div className="bg-card rounded-xl border hover:border-indigo-200 transition-colors overflow-hidden">
        {/* Room header */}
        <button className="w-full flex items-center gap-4 p-4 text-left" onClick={() => setExpanded(!expanded)}>
          <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <BedDouble className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground">Room {room.roomNumber}</p>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{room.type}</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-muted-foreground">{occupiedBeds}/{totalBeds} beds occupied</span>
              {room.monthlyRent > 0 && (
                <span className="text-xs text-indigo-600 font-medium">₹{room.monthlyRent.toLocaleString('en-IN')}/mo</span>
              )}
            </div>
          </div>
          {/* Occupancy bar */}
          <div className="hidden sm:block w-20">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', occupancyPct >= 100 ? 'bg-red-500' : occupancyPct >= 70 ? 'bg-orange-500' : 'bg-emerald-500')}
                style={{ width: `${occupancyPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right mt-0.5">{occupancyPct}%</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={e => { e.stopPropagation(); if (confirm('Delete this room?')) deleteRoom(); }}
              className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>

        {/* Beds expanded */}
        {expanded && (
          <div className="border-t px-4 py-3 space-y-2 bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground">BEDS</p>
              <button
                onClick={() => setAddBed(true)}
                className="flex items-center gap-1 text-xs text-indigo-600 font-medium hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add Bed
              </button>
            </div>
            {(!room.beds || room.beds.length === 0) ? (
              <p className="text-xs text-muted-foreground text-center py-4">No beds added yet</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {room.beds.map((bed: any) => (
                  <div
                    key={bed._id}
                    className={cn(
                      'flex items-center gap-2 p-2.5 rounded-lg border text-xs',
                      bed.status === 'OCCUPIED'
                        ? 'bg-orange-50 border-orange-200'
                        : bed.status === 'MAINTENANCE'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-card border-border'
                    )}
                  >
                    <div className={cn(
                      'h-2 w-2 rounded-full flex-shrink-0',
                      bed.status === 'OCCUPIED' ? 'bg-orange-500' :
                      bed.status === 'MAINTENANCE' ? 'bg-yellow-500' : 'bg-emerald-500'
                    )} />
                    <div>
                      <p className="font-medium text-foreground">Bed {bed.bedNumber}</p>
                      <p className="text-muted-foreground">{bed.type?.replace('_', ' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {addBed && <AddBedModal roomId={room._id} propertyId={propertyId} onClose={() => setAddBed(false)} />}
    </>
  );
}

export default function RoomsPage() {
  const { id: propertyId } = useParams<{ id: string }>();
  const [addRoom, setAddRoom] = useState(false);

  const { data: property } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => apiClient.get(`/api/v1/properties/${propertyId}`).then(r => r.data.data),
  });

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['rooms', propertyId],
    queryFn: () => apiClient.get(`/api/v1/rooms?propertyId=${propertyId}`).then(r => r.data.data),
  });

  const totalBeds = rooms?.reduce((a: number, r: any) => a + (r.beds?.length ?? r.capacity ?? 0), 0) ?? 0;
  const occupiedBeds = rooms?.reduce((a: number, r: any) => a + (r.beds?.filter((b: any) => b.status === 'OCCUPIED').length ?? 0), 0) ?? 0;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/properties/${propertyId}`}>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Room Management</h1>
          <p className="text-sm text-muted-foreground">{property?.name}</p>
        </div>
        <button
          onClick={() => setAddRoom(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Room
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Rooms', value: rooms?.length ?? 0 },
          { label: 'Total Beds', value: totalBeds },
          { label: 'Occupied', value: `${occupiedBeds}/${totalBeds}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card rounded-xl border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Room list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !rooms?.length ? (
        <div className="bg-card rounded-2xl border">
          <EmptyState
            icon={BedDouble}
            title="No rooms yet"
            description="Add rooms to track occupancy, assign beds, and manage tenants per room."
            action={{ label: '+ Add First Room', onClick: () => setAddRoom(true) }}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map((room: any) => <RoomCard key={room._id} room={room} propertyId={propertyId} />)}
        </div>
      )}

      {addRoom && <AddRoomModal propertyId={propertyId} onClose={() => setAddRoom(false)} />}
    </div>
  );
}
