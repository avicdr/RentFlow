'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, CreditCard, MessageSquare, FileText, Bell,
  LogOut, Menu, X, Building2, Store, Settings, Scale,
  ChevronRight, Sun, Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import apiClient from '@/lib/api-client';
import { useTheme } from '@/components/theme-provider';

const nav = [
  { name: 'Home',          href: '/',              icon: Home },
  { name: 'My Rent',       href: '/payments',      icon: CreditCard },
  { name: 'Complaints',    href: '/complaints',    icon: MessageSquare },
  { name: 'Documents',     href: '/documents',     icon: FileText },
  { name: 'Lease Analyzer',href: '/lease-analysis',icon: Scale },
  { name: 'Browse PGs',    href: '/marketplace',   icon: Store },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Profile',       href: '/profile',       icon: Settings },
];

const bottomNav = [
  { name: 'Home',    href: '/',              icon: Home },
  { name: 'Rent',    href: '/payments',      icon: CreditCard },
  { name: 'AI Lease',href: '/lease-analysis',icon: Scale },
  { name: 'Docs',    href: '/documents',     icon: FileText },
  { name: 'Browse',  href: '/marketplace',   icon: Store },
];

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try { await apiClient.post('/api/v1/auth/logout'); } catch { }
    clearAuth();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-foreground">RentFlow</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link href="/profile" className="p-1.5 rounded-full hover:bg-accent transition-colors">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </Link>
          <button onClick={() => setOpen(true)} className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar overlay */}
        {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

        <aside className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r transition-transform duration-300',
          'bg-card border-border',
          'lg:translate-x-0 lg:static lg:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full',
        )}>
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex flex-col gap-2">
              {/* Portal badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <Home className="h-3.5 w-3.5 text-indigo-400" />
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Tenant Portal</span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground">Tenant</p>
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="lg:hidden p-1 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {nav.map(item => {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    active
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {active && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 text-sm text-muted-foreground hover:text-red-500 w-full px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-auto pb-20 lg:pb-0">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-30">
        {bottomNav.map(item => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center py-2 text-xs gap-1 transition-colors',
                active ? 'text-indigo-500' : 'text-muted-foreground',
              )}
            >
              <item.icon className={cn('h-5 w-5', active && 'text-indigo-500')} />
              <span className={cn('font-medium', active && 'text-indigo-500')}>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
