'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Layers, ArrowLeft, Loader2, Minus, Plus, CheckCircle2, AlertCircle, ArrowUpRight, Crown } from 'lucide-react';
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

  // Subscription capacity query
  const { data: sub } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => apiClient.get('/api/v1/subscriptions').then((r) => r.data.data),
  });

  const managedUnits = sub?.managedUnits ?? 0;
  const unitLimit = sub?.unitLimit ?? 5;
  const planLabel = sub?.planInfo?.label ?? sub?.tier ?? 'Lite';
  const isEnterprise = sub?.tier === 'ENTERPRISE' || unitLimit >= 999999;
  const remaining = isEnterprise ? 999999 : Math.max(0, unitLimit - managedUnits);
  const exceedsLimit = !isEnterprise && (managedUnits + count > unitLimit);

  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => apiClient.post(`/api/v1/rooms`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms', id] });
      qc.invalidateQueries({ queryKey: ['property', id] });
      qc.invalidateQueries({ queryKey: ['subscription'] });
      router.push(`/properties/${id}/rooms`);
    },
    onError: (err: any) => setError(err.response?.data?.message ?? 'Failed to create rooms'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (exceedsLimit) {
      setError(`Your ${planLabel} plan limit is ${unitLimit} units. You currently manage ${managedUnits} units. Please upgrade your plan to add ${count} more unit${count > 1 ? 's' : ''}.`);
      return;
    }
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
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href={`/properties/${id}/rooms`} className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Rooms</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure room type and add rentable units</p>
        </div>
      </div>

      {/* Subscription Capacity Badge */}
      {!isEnterprise && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
          exceedsLimit
            ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-300'
            : 'bg-card border-border text-foreground'
        }`}>
          <div className="flex items-center gap-3">
            <Crown className={`h-5 w-5 ${exceedsLimit ? 'text-red-500' : 'text-indigo-500'}`} />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Plan Usage ({planLabel})
              </p>
              <p className="text-sm font-semibold mt-0.5">
                {managedUnits} / {unitLimit} units managed · {remaining} unit{remaining !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
          {exceedsLimit && (
            <Link
              href="/settings/subscription"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs flex-shrink-0"
            >
              Upgrade Plan <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}

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
        <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
          <Layers className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-indigo-900 dark:text-indigo-200">
              Creating <span className="text-indigo-600 dark:text-indigo-400">{count}</span> {typeLabel} room{count > 1 ? 's' : ''} ({totalBeds} bed{totalBeds > 1 ? 's' : ''} total)
            </p>
            <p className="text-indigo-600 dark:text-indigo-400 text-xs mt-0.5">
              Each room counts as 1 rental unit toward your plan limit ({managedUnits + count}/{isEnterprise ? '∞' : unitLimit} total).
            </p>
          </div>
        </div>

        {/* Exceeds limit warning */}
        {exceedsLimit && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                Unit Limit Exceeded
              </p>
              <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">
                Adding {count} unit{count > 1 ? 's' : ''} would bring your total to {managedUnits + count} units, exceeding your {planLabel} limit of {unitLimit} units.
                Please upgrade your plan before adding more units.
              </p>
              <Link
                href="/settings/subscription"
                className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View Upgrade Options →
              </Link>
            </div>
          </div>
        )}

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
            disabled={isPending || exceedsLimit}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {isPending ? 'Creating...' : `Create ${count > 1 ? count + ' ' : ''}Room${count > 1 ? 's' : ''}`}
          </button>
        </div>
      </form>
    </div>
  );
}
