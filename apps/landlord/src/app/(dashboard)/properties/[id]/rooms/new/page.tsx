'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, ArrowLeft, Loader2, Minus, Plus, CheckCircle2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import Link from 'next/link';
import { use } from 'react';
import { RoomConfigurator, defaultRoomConfig, type RoomConfig } from '@/components/ui/room-configurator';

const ROOM_TYPE_LABELS: Record<string, string> = {
  SINGLE: 'Solo',
  DOUBLE: 'Double Sharing',
  TRIPLE: 'Triple Sharing',
  QUAD: 'Quad Sharing',
  DORMITORY: 'Dormitory',
  STUDIO: 'Studio',
};

export default function AddRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const qc = useQueryClient();
  const [config, setConfig] = useState<RoomConfig>(defaultRoomConfig());
  const [count, setCount] = useState(1);
  const [error, setError] = useState('');

  const totalBeds = config.capacity * count;
  const typeLabel = ROOM_TYPE_LABELS[config.type] ?? config.type;

  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => apiClient.post(`/api/v1/rooms`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms', id] });
      qc.invalidateQueries({ queryKey: ['property', id] });
      router.push(`/properties/${id}/rooms`);
    },
    onError: (err: any) => setError(err.response?.data?.message ?? 'Failed to create rooms'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    mutate({
      floor: config.floor,
      type: config.type,
      capacity: config.capacity,
      monthlyRent: config.monthlyRent,
      rentPerBed: config.rentPerBed,
      description: config.description,
      propertyId: id,
      count,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/properties/${id}/rooms`} className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Rooms</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure room type and add multiple rooms at once</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Room Count */}
        <div className="bg-card rounded-xl border p-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Number of Rooms</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setCount(c => Math.max(1, c - 1))}
              className="h-10 w-10 rounded-xl border-2 border-border flex items-center justify-center hover:border-indigo-300 hover:bg-indigo-50 transition-all text-muted-foreground"
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="text-center">
              <span className="text-4xl font-extrabold text-indigo-600 tabular-nums">{count}</span>
              <p className="text-xs text-muted-foreground mt-0.5">rooms</p>
            </div>
            <button
              type="button"
              onClick={() => setCount(c => Math.min(50, c + 1))}
              className="h-10 w-10 rounded-xl border-2 border-border flex items-center justify-center hover:border-indigo-300 hover:bg-indigo-50 transition-all text-muted-foreground"
            >
              <Plus className="h-4 w-4" />
            </button>
            <input
              type="range"
              min={1}
              max={50}
              value={count}
              onChange={e => setCount(+e.target.value)}
              className="flex-1 accent-indigo-600"
            />
          </div>
        </div>

        {/* Preview banner */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 border border-indigo-200">
          <Layers className="h-5 w-5 text-indigo-600 flex-shrink-0" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-indigo-900">
              Creating <span className="text-indigo-600">{count}</span> {typeLabel} room{count > 1 ? 's' : ''} ({totalBeds} bed{totalBeds > 1 ? 's' : ''} total)
            </p>
            <p className="text-indigo-600 text-xs mt-0.5">
              Rooms will be numbered automatically. You can rename them when adding tenants.
            </p>
          </div>
        </div>

        {/* Room configurator */}
        <div className="bg-card rounded-xl border p-6">
          <RoomConfigurator value={config} onChange={setConfig} />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <Link
            href={`/properties/${id}/rooms`}
            className="px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {isPending ? 'Creating...' : `Create ${count > 1 ? count + ' ' : ''}Room${count > 1 ? 's' : ''}`}
          </button>
        </div>
      </form>
    </div>
  );
}
