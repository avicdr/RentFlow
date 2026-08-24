'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Building2, CreditCard, MessageSquare,
  FileText, BarChart3, Shield, Settings, LogOut, ChevronRight,
  Menu, X, Activity, ShieldCheck, Megaphone, Sun, Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminStore } from '@/stores/admin.store';
import apiClient from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/components/theme-provider';

const navigation = [
  { name: 'Overview',      href: '/',             icon: LayoutDashboard },
  { name: 'Users',         href: '/users',        icon: Users },
  { name: 'Properties',    href: '/properties',   icon: Building2 },
  { name: 'Payments',      href: '/payments',     icon: CreditCard },
  { name: 'Complaints',    href: '/complaints',   icon: MessageSquare },
  { name: 'KYC',           href: '/kyc',          icon: ShieldCheck },
  { name: 'Announcements', href: '/announcements',icon: Megaphone },
  { name: 'Audit Logs',    href: '/audit',        icon: FileText },
  { name: 'Analytics',     href: '/analytics',    icon: BarChart3 },
  { name: 'System',        href: '/system',       icon: Activity },
  { name: 'Settings',      href: '/settings',     icon: Settings },
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
  const router   = useRouter();
  const { user, clearAuth } = useAdminStore();

  const handleLogout = async () => {
    try { await apiClient.post('/api/v1/auth/logout'); } catch { }
    clearAuth();
    router.push('/login');
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={onClose} />}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r transition-transform duration-300',
        'bg-card border-border',
        'lg:translate-x-0 lg:static',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-border">
          <div className="h-8 w-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Shield className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <p className="text-foreground font-semibold text-sm">RentFlow</p>
            <p className="text-indigo-400 text-xs">Admin Panel</p>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Admin user */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-indigo-400">Super Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navigation.map(item => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <item.icon className={cn('h-4 w-4 flex-shrink-0', active && 'text-indigo-400')} />
                <span>{item.name}</span>
                {active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-indigo-400" />}
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
  const { data: stats } = useQuery({
    queryKey: ['admin-quick-stats'],
    queryFn: () => apiClient.get('/api/v1/admin/stats').then(r => r.data.data),
    refetchInterval: 60000,
  });

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-card/95 backdrop-blur px-4">
      <button onClick={onMenuClick} className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-accent">
        <Menu className="h-5 w-5" />
      </button>

      <div className="ml-auto flex items-center gap-3">
        {stats && (
          <div className="hidden md:flex items-center gap-3 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              <span className="text-foreground font-semibold">{stats.totalUsers}</span> users
            </span>
            <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              <span className="text-indigo-400 font-semibold">{stats.totalLandlords}</span> landlords
            </span>
            <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              <span className="text-emerald-500 font-semibold">{stats.totalTenants}</span> tenants
            </span>
          </div>
        )}
        <ThemeToggle />
        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" title="System Online" />
      </div>
    </header>
  );
}

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
