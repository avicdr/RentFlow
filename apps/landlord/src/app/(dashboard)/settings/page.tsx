'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, User, Bell, Shield, Save, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';

export default function LandlordSettingsPage() {
  const user = useAuthStore(s => s.user);
  const qc = useQueryClient();
  const [tab, setTab] = useState<'profile' | 'password' | 'notifications'>('profile');
  const [saved, setSaved] = useState(false);

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const updateProfile = useMutation({
    mutationFn: (data: any) => apiClient.put('/api/v1/users/me', data),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); },
  });

  const updatePassword = useMutation({
    mutationFn: (data: any) => apiClient.put('/api/v1/auth/change-password', data),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'password', label: 'Password', icon: Shield },
          { id: 'notifications', label: 'Notifications', icon: Bell },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-xl border p-6">
        {tab === 'profile' && (
          <form onSubmit={e => { e.preventDefault(); updateProfile.mutate(profileForm); }} className="space-y-4">
            <h2 className="font-semibold text-foreground">Profile Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">First Name</label>
                <input
                  value={profileForm.firstName}
                  onChange={e => setProfileForm(p => ({ ...p, firstName: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Last Name</label>
                <input
                  value={profileForm.lastName}
                  onChange={e => setProfileForm(p => ({ ...p, lastName: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Email</label>
              <input value={user?.email ?? ''} disabled className="w-full border rounded-lg px-3 py-2 text-sm bg-muted text-muted-foreground" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Phone</label>
              <input
                value={profileForm.phone}
                onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="+91 9999999999"
              />
            </div>
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </form>
        )}

        {tab === 'password' && (
          <form onSubmit={e => { e.preventDefault(); updatePassword.mutate(passwordForm); }} className="space-y-4">
            <h2 className="font-semibold text-foreground">Change Password</h2>
            {['currentPassword', 'newPassword', 'confirmPassword'].map(field => (
              <div key={field}>
                <label className="text-sm font-medium text-foreground block mb-1">
                  {field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
                </label>
                <input
                  type="password"
                  value={(passwordForm as any)[field]}
                  onChange={e => setPasswordForm(p => ({ ...p, [field]: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={updatePassword.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {updatePassword.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              Update Password
            </button>
          </form>
        )}

        {tab === 'notifications' && (
          <div className="space-y-4">
            <h2 className="font-semibold text-foreground">Notification Preferences</h2>
            {[
              { label: 'Payment received', desc: 'Get notified when a tenant submits a payment' },
              { label: 'New complaint', desc: 'Alert when a tenant raises a complaint' },
              { label: 'Rent due reminders', desc: 'Reminders before rent is due' },
              { label: 'System announcements', desc: 'Platform updates and news' },
            ].map(({ label, desc }) => (
              <div key={label} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-9 h-5 bg-muted peer-checked:bg-indigo-600 rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-card after:rounded-full after:h-4 after:w-4 after:transition-transform" />
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
