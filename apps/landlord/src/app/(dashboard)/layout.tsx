'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Building2, Users, CreditCard, MessageSquare,
  BarChart3, ListChecks, Settings, LogOut, Bell, Menu, X,
  ChevronRight, Home, Crown, Sun, Moon, DollarSign, MessageCircle, ClipboardList,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import apiClient from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/components/theme-provider';

function getNavigation(role?: string) {
  if (role === 'PROPERTY_MANAGER') {
    return [
      { name: 'Dashboard',    href: '/',                    icon: LayoutDashboard },
      { name: 'My Properties',href: '/properties',          icon: Building2 },
      { name: 'Applications',href: '/applications',         icon: ClipboardList },
      { name: 'Tenants',     href: '/tenants',              icon: Users },
      { name: 'Payments',    href: '/payments',             icon: CreditCard },
      { name: 'Messages',    href: '/messages',             icon: MessageCircle },
      { name: 'Complaints',  href: '/complaints',           icon: MessageSquare },
    ];
  }

  return [
    { name: 'Dashboard',         href: '/',                    icon: LayoutDashboard },
    { name: 'Properties',       href: '/properties',           icon: Building2 },
    { name: 'Applications',     href: '/applications',         icon: ClipboardList },
    { name: 'Tenants',          href: '/tenants',              icon: Users },
    { name: 'Property Managers', href: '/property-managers',   icon: ShieldCheck },
    { name: 'Finances',         href: '/finances',             icon: DollarSign },
    { name: 'Payments',         href: '/payments',             icon: CreditCard },
    { name: 'Messages',         href: '/messages',             icon: MessageCircle },
    { name: 'Complaints',       href: '/complaints',           icon: MessageSquare },
    { name: 'Analytics',        href: '/analytics',            icon: BarChart3 },
    { name: 'Listings',         href: '/listings',             icon: ListChecks },
    { name: 'Settings',         href: '/settings',             icon: Settings },
    { name: 'Plan',             href: '/settings/subscription',icon: Crown },
  ];
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark'
        ? <Sun className="h-4 w-4" />
        : <Moon className="h-4 w-4" />}
    </button>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, clearAuth } = useAuthStore();
  const navItems = getNavigation(user?.role);

  const handleLogout = async () => {
    try { await apiClient.post('/api/v1/auth/logout'); } catch { }
    clearAuth();
    router.push('/login');
  };

  const { data: unreadMsgCount } = useQuery({
    queryKey: ['messages', 'unread-count'],
    queryFn: () => apiClient.get('/api/v1/messages/unread-count').then(r => r.data.data.count).catch(() => 0),
    refetchInterval: 10000,
  });

  const { data: pendingAppCount } = useQuery({
    queryKey: ['landlord-pending-apps-count'],
    queryFn: () => apiClient.get('/api/v1/applications/landlord?status=SUBMITTED').then(r => r.data.meta?.total || 0).catch(() => 0),
    refetchInterval: 20000,
  });

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={onClose} />}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r transition-transform duration-300',
        'bg-card border-border',
        'lg:translate-x-0 lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-border">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/30">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-base text-foreground tracking-tight">RentFlow</span>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              {user?.role === 'PROPERTY_MANAGER' ? 'Manager Portal' : 'Owner Portal'}
            </p>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 flex-shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">{user?.firstName} {user?.lastName}</p>
              <span className={cn(
                'inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5',
                user?.role === 'PROPERTY_MANAGER'
                  ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
              )}>
                {user?.role === 'PROPERTY_MANAGER' ? 'Property Manager' : 'Owner'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.name}</span>
                {item.href === '/messages' && (unreadMsgCount ?? 0) > 0 && (
                  <span className={cn(
                    'ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full',
                    active ? 'bg-white text-indigo-700' : 'bg-indigo-600 text-white shadow-sm',
                  )}>
                    {unreadMsgCount}
                  </span>
                )}
                {item.href === '/applications' && (pendingAppCount ?? 0) > 0 && (
                  <span className={cn(
                    'ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full',
                    active ? 'bg-white text-indigo-700' : 'bg-amber-500 text-white shadow-sm',
                  )}>
                    {pendingAppCount}
                  </span>
                )}
                {active && item.href !== '/messages' && item.href !== '/applications' && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const { data: notifCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => apiClient.get('/api/v1/notifications/unread-count').then(r => r.data.data.count),
    refetchInterval: 30000,
  });

  const navItems = getNavigation(user?.role);
  const pageName = navItems.find(n =>
    n.href === '/' ? pathname === '/' : pathname.startsWith(n.href)
  )?.name ?? 'Dashboard';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 backdrop-blur px-4 sm:px-6">
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Home className="h-3.5 w-3.5" />
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-foreground">{pageName}</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <Link href="/notifications" className="relative p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
          {(notifCount ?? 0) > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
