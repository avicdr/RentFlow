'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Building2, Users, CreditCard, Loader2, Command } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface SearchResult {
  type: string; id: string; title: string; subtitle: string; meta?: string; href: string;
}

const TYPE_ICON: Record<string, any> = {
  property: Building2, user: Users, tenant: Users, payment: CreditCard,
};

const TYPE_LABEL: Record<string, string> = {
  property: 'Property', user: 'User', tenant: 'Tenant', payment: 'Payment',
};

const TYPE_COLOR: Record<string, string> = {
  property: 'text-indigo-600 bg-indigo-50',
  user: 'text-emerald-600 bg-emerald-50',
  tenant: 'text-emerald-600 bg-emerald-50',
  payment: 'text-blue-600 bg-blue-50',
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQuery(''); setSelected(0); }
  }, [open]);

  const { data, isFetching } = useQuery({
    queryKey: ['global-search', query],
    queryFn: () => apiClient.get(`/api/v1/search?q=${encodeURIComponent(query)}`).then(r => r.data.data as SearchResult[]),
    enabled: query.length >= 2,
    staleTime: 10000,
  });

  const results = data ?? [];

  const navigate = (result: SearchResult) => {
    setOpen(false);
    router.push(result.href);
  };

  // Arrow key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) navigate(results[selected]);
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted text-muted-foreground text-sm transition-colors w-48"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search...</span>
        <span className="hidden sm:flex items-center gap-0.5 text-xs bg-card border rounded px-1">
          <Command className="h-3 w-3" />K
        </span>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" onClick={() => setOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <div
            className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl overflow-hidden border border-border"
            onClick={e => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b">
              {isFetching
                ? <Loader2 className="h-5 w-5 text-muted-foreground animate-spin flex-shrink-0" />
                : <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              }
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setSelected(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search properties, tenants, payments..."
                className="flex-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd className="text-xs bg-muted border rounded px-1.5 py-0.5 text-muted-foreground">Esc</kbd>
            </div>

            {/* Results */}
            {query.length < 2 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            ) : results.length === 0 && !isFetching ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No results for "{query}"
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-border">
                {results.map((r, i) => {
                  const Icon = TYPE_ICON[r.type] ?? Search;
                  return (
                    <button
                      key={r.id}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors',
                        selected === i && 'bg-indigo-50'
                      )}
                      onClick={() => navigate(r)}
                      onMouseEnter={() => setSelected(i)}
                    >
                      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0', TYPE_COLOR[r.type] ?? 'text-muted-foreground bg-muted')}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                      </div>
                      {r.meta && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex-shrink-0">
                          {r.meta}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Footer hint */}
            <div className="px-4 py-2 border-t bg-muted flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><kbd className="bg-card border rounded px-1">↑↓</kbd> navigate</span>
              <span className="flex items-center gap-1"><kbd className="bg-card border rounded px-1">↵</kbd> open</span>
              <span className="flex items-center gap-1"><kbd className="bg-card border rounded px-1">Esc</kbd> close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
