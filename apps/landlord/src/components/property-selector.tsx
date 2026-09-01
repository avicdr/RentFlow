'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, ChevronDown, Check, Store } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface PropertySelectorProps {
  selectedPropertyId?: string;
  onSelect: (propertyId: string | undefined) => void;
  className?: string;
  showAllOption?: boolean;
}

export function PropertySelector({
  selectedPropertyId,
  onSelect,
  className,
  showAllOption = true,
}: PropertySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: propertiesRes, isLoading } = useQuery({
    queryKey: ['properties-list-selector'],
    queryFn: () => apiClient.get('/api/v1/properties', { params: { limit: 100 } }).then(r => r.data.data),
  });

  const properties: any[] = propertiesRes || [];
  const selectedProperty = properties.find((p) => p._id === selectedPropertyId);

  return (
    <div className={cn('relative inline-block text-left', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center justify-between gap-2.5 px-3.5 py-2 rounded-xl border border-border bg-card text-foreground text-xs font-semibold shadow-xs hover:border-primary/50 transition-colors min-w-[200px]',
          isOpen && 'border-primary ring-2 ring-primary/10',
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          <span className="truncate">
            {selectedProperty ? selectedProperty.name : showAllOption ? 'All Properties' : 'Select Property'}
          </span>
        </div>
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-1.5 w-64 rounded-2xl bg-card border border-border shadow-xl z-40 py-1.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-1.5 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Filter by Property
            </div>

            <div className="max-h-60 overflow-y-auto py-1 space-y-0.5 px-1">
              {showAllOption && (
                <button
                  type="button"
                  onClick={() => {
                    onSelect(undefined);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors',
                    !selectedPropertyId
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'text-foreground hover:bg-muted',
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Store className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <span>All Properties ({properties.length})</span>
                  </div>
                  {!selectedPropertyId && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                </button>
              )}

              {properties.map((p) => {
                const isSelected = p._id === selectedPropertyId;
                return (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => {
                      onSelect(p._id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors',
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'text-foreground hover:bg-muted',
                    )}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate font-semibold">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {p.address?.city || 'City'} · {p.totalRooms || 0} rooms
                      </p>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 flex-shrink-0" />}
                  </button>
                );
              })}

              {properties.length === 0 && (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  No properties found.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
