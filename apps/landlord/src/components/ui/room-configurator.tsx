'use client';

/**
 * RoomConfigurator — reusable room-type picker that:
 *  - Presents sharing presets (Solo / Double / Triple / Quad / Dormitory / Studio)
 *  - Auto-fills bed capacity based on sharing type
 *  - Accepts a monthly rent per bed and computes total rent for the room
 *  - Exposes a plain `RoomConfig` object that can be POSTed directly to /api/v1/rooms
 */

import { useState, useEffect } from 'react';
import { Bed, Users, IndianRupee, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RoomConfig {
  floor: number;
  type: string;
  capacity: number;
  monthlyRent: number;    // total room rent = rentPerBed × capacity
  rentPerBed: number;
  description?: string;
}

const SHARING_PRESETS = [
  { type: 'SINGLE',     label: 'Solo',           desc: '1-bed private room',   beds: 1, icon: '🛏️' },
  { type: 'DOUBLE',     label: 'Double Sharing', desc: '2 beds, shared room',  beds: 2, icon: '🛏️🛏️' },
  { type: 'TRIPLE',     label: 'Triple Sharing', desc: '3 beds, shared room',  beds: 3, icon: '🛏️🛏️🛏️' },
  { type: 'QUAD',       label: 'Quad Sharing',   desc: '4 beds, shared room',  beds: 4, icon: '🏠' },
  { type: 'DORMITORY',  label: 'Dormitory',      desc: 'Custom bed count',     beds: 6, icon: '🏢' },
  { type: 'STUDIO',     label: 'Studio',         desc: 'Studio flat',          beds: 1, icon: '🏠' },
] as const;

interface Props {
  value: RoomConfig;
  onChange: (v: RoomConfig) => void;
  className?: string;
}

export function RoomConfigurator({ value, onChange, className }: Props) {
  const preset = SHARING_PRESETS.find(p => p.type === value.type) ?? SHARING_PRESETS[0];
  const isDormitory = value.type === 'DORMITORY';

  // When sharing type changes, auto-update capacity (unless dormitory)
  const handleTypeChange = (type: string) => {
    const p = SHARING_PRESETS.find(x => x.type === type)!;
    const capacity = type === 'DORMITORY' ? value.capacity : p.beds;
    onChange({ ...value, type, capacity, monthlyRent: value.rentPerBed * capacity });
  };

  const handleCapacityChange = (capacity: number) => {
    onChange({ ...value, capacity, monthlyRent: value.rentPerBed * capacity });
  };

  const handleRentPerBedChange = (rentPerBed: number) => {
    onChange({ ...value, rentPerBed, monthlyRent: rentPerBed * value.capacity });
  };

  const totalRent = value.rentPerBed * value.capacity;

  return (
    <div className={cn('space-y-5', className)}>
      {/* Sharing type grid */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Room / Sharing Type</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {SHARING_PRESETS.map(p => (
            <button
              key={p.type}
              type="button"
              onClick={() => handleTypeChange(p.type)}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all text-center',
                value.type === p.type
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'border-border text-muted-foreground hover:border-indigo-200 hover:bg-indigo-50/50',
              )}
            >
              <span className="text-lg leading-none">{p.icon}</span>
              <span className="leading-tight">{p.label}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{p.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bed count — editable only for dormitory */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1.5 flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> Number of Beds
          </label>
          {isDormitory ? (
            <input
              type="number"
              min={1}
              max={50}
              value={value.capacity}
              onChange={e => handleCapacityChange(+e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          ) : (
            <div className="h-10 px-3 rounded-lg border border-border bg-muted text-sm flex items-center text-foreground font-medium select-none">
              {value.capacity} {value.capacity === 1 ? 'bed' : 'beds'} <span className="text-muted-foreground ml-1 text-xs">(auto)</span>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1.5 flex items-center gap-1">
            <IndianRupee className="h-3.5 w-3.5" /> Rent per Bed (₹/month)
          </label>
          <input
            type="number"
            min={0}
            step={500}
            value={value.rentPerBed || ''}
            onChange={e => handleRentPerBedChange(+e.target.value)}
            placeholder="e.g. 8000"
            className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      {/* Auto-calculated total */}
      {value.rentPerBed > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-sm">
          <Info className="h-4 w-4 text-indigo-500 flex-shrink-0" />
          <span className="text-indigo-700">
            <strong>{value.capacity} beds × ₹{value.rentPerBed.toLocaleString('en-IN')}</strong>
            {' = '}
            <strong>₹{totalRent.toLocaleString('en-IN')}/month</strong> total room rent
          </span>
        </div>
      )}

      {/* Floor only */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Floor</label>
          <input
            type="number"
            min={0}
            value={value.floor}
            onChange={e => onChange({ ...value, floor: +e.target.value })}
            className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Description (optional)</label>
        <input
          type="text"
          value={value.description ?? ''}
          onChange={e => onChange({ ...value, description: e.target.value })}
          placeholder="e.g. Ground floor corner room with attached bathroom"
          className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
    </div>
  );
}

export const defaultRoomConfig = (): RoomConfig => ({
  floor: 1,
  type: 'SINGLE',
  capacity: 1,
  monthlyRent: 0,
  rentPerBed: 0,
  description: '',
});
