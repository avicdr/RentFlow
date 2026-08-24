'use client';

import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn('fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]', className)}
    {...props}
  />
));
ToastViewport.displayName = 'ToastViewport';

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & { variant?: 'default' | 'destructive' | 'success' }
>(({ className, variant = 'default', ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={cn(
      'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-6 shadow-lg transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-top-full',
      variant === 'destructive' && 'border-red-800/50 bg-red-950 text-red-200',
      variant === 'success' && 'border-emerald-800/50 bg-emerald-950 text-emerald-200',
      variant === 'default' && 'border-gray-700 bg-gray-800 text-gray-200',
      className,
    )}
    {...props}
  />
));
Toast.displayName = 'Toast';

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn('absolute right-2 top-2 rounded p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-200', className)}
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = 'ToastClose';

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title ref={ref} className={cn('text-sm font-semibold', className)} {...props} />
));

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description ref={ref} className={cn('text-sm opacity-90', className)} {...props} />
));

type ToasterToast = {
  id: string; title?: string; description?: string; variant?: 'default' | 'destructive' | 'success'; open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

let count = 0;
const listeners: Array<(state: ToasterToast[]) => void> = [];
let toasts: ToasterToast[] = [];

function dispatch(t: ToasterToast[]) {
  toasts = t;
  listeners.forEach(l => l(toasts));
}

export function toast(props: Omit<ToasterToast, 'id'>) {
  const id = `toast-${++count}`;
  const newToast = { ...props, id, open: true, onOpenChange: (open: boolean) => { if (!open) dispatch(toasts.filter(t => t.id !== id)); } };
  dispatch([newToast, ...toasts].slice(0, 5));
  setTimeout(() => dispatch(toasts.filter(t => t.id !== id)), 5000);
}

function useToast() {
  const [state, setState] = React.useState<ToasterToast[]>(toasts);
  React.useEffect(() => {
    listeners.push(setState);
    return () => { const i = listeners.indexOf(setState); if (i > -1) listeners.splice(i, 1); };
  }, []);
  return state;
}

export function Toaster() {
  const toastList = useToast();
  return (
    <ToastProvider>
      {toastList.map(({ id, title, description, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-0.5">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
