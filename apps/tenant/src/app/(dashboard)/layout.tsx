'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Home, CreditCard, MessageSquare, FileText, Bell,
  LogOut, Menu, X, Building2, Store, Settings, Scale,
  ChevronRight, Sun, Moon, Shield, Zap, KeyRound, MessageCircle, CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import apiClient from '@/lib/api-client';
import { useTheme } from '@/components/theme-provider';

const nav = [
  { name: 'Home',          href: '/',              icon: Home },
  { name: 'RentPass™',     href: '/rentpass',      icon: Shield },
  { name: 'Applications', href: '/applications',  icon: FileText },
  { name: 'My Rent',       href: '/payments',      icon: CreditCard },
  { name: 'Receipts',      href: '/receipts',      icon: FileText },
  { name: 'Utilities',     href: '/utilities',     icon: Zap },
  { name: 'Deposit',       href: '/deposit',       icon: KeyRound },
  { name: 'Messages',      href: '/messages',      icon: MessageCircle },
  { name: 'Complaints',    href: '/complaints',    icon: MessageSquare },
  { name: 'KYC Center',    href: '/kyc',           icon: CheckCircle },
  { name: 'AI Lease',      href: '/lease-analysis',icon: Scale },
  { name: 'Browse PGs',    href: '/marketplace',   icon: Store },
  { name: 'Profile',       href: '/profile',       icon: Settings },
];

const bottomNav = [
  { name: 'Home',     href: '/',          icon: Home },
  { name: 'RentPass', href: '/rentpass',  icon: Shield },
  { name: 'Rent',     href: '/payments',  icon: CreditCard },
  { name: 'Chat',     href: '/messages',  icon: MessageCircle },
  { name: 'Profile',  href: '/profile',   icon: Settings },
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

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const { data: unreadMsgCount } = useQuery({
    queryKey: ['messages', 'unread-count'],
    queryFn: () => apiClient.get('/api/v1/messages/unread-count').then(r => r.data.data.count).catch(() => 0),
    refetchInterval: 10000,
  });

  const handleLogout = async () => {
    try { await apiClient.post('/api/v1/auth/logout'); } catch { }
    clearAuth();
    router.push('/login');
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onClose} />}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r transition-transform duration-300',
        'bg-card border-border',
        'lg:translate-x-0 lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Brand Logo & Name */}
        <div className="flex h-16 items-center gap-3 px-5 border-b border-border">
          <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-foreground">RentFlow</span>
          <button onClick={onClose} className="ml-auto lg:hidden p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tenant Portal Badge & Profile Info */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full w-fit bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 shadow-xs">
            <Home className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 tracking-wide">Tenant Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map(item => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{item.name}</span>
                {item.href === '/messages' && (unreadMsgCount ?? 0) > 0 && (
                  <span className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full',
                    active ? 'bg-white text-indigo-700' : 'bg-indigo-600 text-white shadow-sm',
                  )}>
                    {unreadMsgCount}
                  </span>
                )}
                {active && item.href !== '/messages' && <ChevronRight className="h-3.5 w-3.5 opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-red-500 w-full px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-colors"
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
  const { user } = useAuthStore();

  const { data: notifCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => apiClient.get('/api/v1/notifications/unread-count').then(r => r.data.data.count).catch(() => 0),
    refetchInterval: 30000,
  });

  const pageName = nav.find(n =>
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
        <Link href="/profile" className="p-1.5 rounded-full hover:bg-accent transition-colors">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
        </Link>
      </div>
    </header>
  );
}

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar on the Left */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area on the Right */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-30">
        {bottomNav.map(item => {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center py-2 text-xs gap-1 transition-colors text-muted-foreground hover:text-foreground',
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px]">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
