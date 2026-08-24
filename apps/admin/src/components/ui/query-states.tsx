'use client';

import { LucideIcon, PackageOpen, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── QuerySkeleton ────────────────────────────────────────────────────────────
interface QuerySkeletonProps {
  rows?: number;
  cols?: number;
  className?: string;
}

/**
 * Animated skeleton for table loading states.
 * Uses semantic tokens so it works correctly in both light and dark mode.
 */
export function QuerySkeleton({ rows = 6, cols = 5, className }: QuerySkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className={cn('border-b border-border', className)}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div
                className="h-4 rounded-md bg-muted animate-pulse"
                style={{ width: `${60 + ((i * 3 + j * 7) % 35)}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── QueryEmpty ───────────────────────────────────────────────────────────────
interface QueryEmptyProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  colSpan?: number;
  className?: string;
}

/**
 * Empty-state row for tables and list views.
 * Uses semantic color tokens — works in light and dark mode.
 */
export function QueryEmpty({
  icon: Icon = PackageOpen,
  title,
  description,
  colSpan = 8,
  className,
}: QueryEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className={cn('flex flex-col items-center justify-center py-16 px-8 text-center', className)}>
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Icon className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="font-semibold text-foreground text-sm">{title}</p>
          {description && (
            <p className="text-muted-foreground text-xs mt-1 max-w-xs">{description}</p>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── QueryError ───────────────────────────────────────────────────────────────
interface QueryErrorProps {
  message?: string;
  onRetry?: () => void;
  colSpan?: number;
  className?: string;
}

/**
 * Error state row for tables. Shows a retry button when onRetry is provided.
 */
export function QueryError({
  message = 'Something went wrong. Please try again.',
  onRetry,
  colSpan = 8,
  className,
}: QueryErrorProps) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className={cn('flex flex-col items-center justify-center py-16 px-8 text-center', className)}>
          <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7 text-destructive/60" />
          </div>
          <p className="font-semibold text-foreground text-sm">Error loading data</p>
          <p className="text-muted-foreground text-xs mt-1 max-w-xs">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Card variants (non-table use) ────────────────────────────────────────────
export function QueryEmptyCard({
  icon: Icon = PackageOpen,
  title,
  description,
  className,
}: Omit<QueryEmptyProps, 'colSpan'>) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-8 text-center rounded-xl border border-border bg-card', className)}>
      <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-muted-foreground/50" />
      </div>
      <p className="font-semibold text-foreground text-sm">{title}</p>
      {description && (
        <p className="text-muted-foreground text-xs mt-1 max-w-xs">{description}</p>
      )}
    </div>
  );
}
