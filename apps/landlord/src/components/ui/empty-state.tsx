import { LucideIcon, PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      compact ? 'py-8 px-4' : 'py-16 px-8',
      className,
    )}>
      <div className={cn(
        'rounded-2xl flex items-center justify-center mb-4',
        compact ? 'h-12 w-12 bg-muted' : 'h-16 w-16 bg-muted'
      )}>
        <Icon className={cn('text-muted-foreground', compact ? 'h-6 w-6' : 'h-8 w-8')} />
      </div>
      <p className={cn('font-semibold text-muted-foreground', compact ? 'text-sm' : 'text-base')}>{title}</p>
      {description && (
        <p className={cn('text-muted-foreground mt-1 max-w-xs', compact ? 'text-xs' : 'text-sm')}>{description}</p>
      )}
      {action && (
        action.href ? (
          <a
            href={action.href}
            className={cn(
              'mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100',
              compact ? 'text-xs py-2 px-3' : 'text-sm'
            )}
          >
            {action.label}
          </a>
        ) : (
          <button
            onClick={action.onClick}
            className={cn(
              'mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100',
              compact ? 'text-xs py-2 px-3' : 'text-sm'
            )}
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
