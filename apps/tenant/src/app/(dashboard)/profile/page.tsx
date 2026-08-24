'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User, Lock, Bell, Shield, Camera, Loader2, CheckCircle,
  AlertTriangle, Eye, EyeOff, Phone, Mail, Save,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

// ─── Schemas ──────────────────────────────────────────────────────────────────
const profileSchema = z.object({
  firstName: z.string().min(2, 'Min 2 characters').max(50),
  lastName: z.string().min(2, 'Min 2 characters').max(50),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian phone number'),
  profile: z.object({
    bio: z.string().max(200).optional(),
    emergencyContact: z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      relation: z.string().optional(),
    }).optional(),
  }).optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter current password'),
    newPassword: z
      .string()
      .min(8, 'Minimum 8 characters')
      .regex(/[A-Z]/, 'Must include uppercase letter')
      .regex(/[0-9]/, 'Must include a number')
      .regex(/[^A-Za-z0-9]/, 'Must include a special character'),
    confirmPassword: z.string(),
  })
  .refine(d => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match', path: ['confirmPassword'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

// ─── Sub-components ───────────────────────────────────────────────────────────
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2.5 text-sm font-medium rounded-lg transition-all',
        active ? 'bg-card text-indigo-700 shadow-sm' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{message}</p>;
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────
function ProfileTab() {
  const { user, setAuth } = useAuthStore();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['user-me'],
    queryFn: () => apiClient.get('/api/v1/users/me').then(r => r.data.data),
  });

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: profile ? {
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      phone: profile.phone ?? '',
      profile: {
        bio: profile.profile?.bio ?? '',
        emergencyContact: {
          name: profile.profile?.emergencyContact?.name ?? '',
          phone: profile.profile?.emergencyContact?.phone ?? '',
          relation: profile.profile?.emergencyContact?.relation ?? '',
        },
      },
    } : undefined,
  });

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data: ProfileForm) => apiClient.put('/api/v1/users/me', data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['user-me'] });
      const u = res.data.data;
      if (user) setAuth({ ...user, firstName: u.firstName, lastName: u.lastName }, localStorage.getItem('rf_access_token') ?? '');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const handleAvatarUpload = async (file: File) => {
    setAvatarUploading(true);
    setAvatarPreview(URL.createObjectURL(file));
    const form = new FormData();
    form.append('file', file);
    form.append('category', 'avatars');
    try {
      const res = await apiClient.post('/api/v1/documents/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      await apiClient.patch('/api/v1/users/me/avatar', { avatarPath: res.data.data.filePath });
      qc.invalidateQueries({ queryKey: ['user-me'] });
    } catch { }
    setAvatarUploading(false);
  };

  return (
    <form onSubmit={handleSubmit(d => save(d))} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" />
              : profile?.profile?.avatar
                ? <img src={profile.profile.avatar} alt="avatar" className="h-full w-full object-cover" />
                : <span>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
            }
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={avatarUploading}
            className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md hover:bg-indigo-700 transition-colors"
          >
            {avatarUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])} />
        </div>
        <div>
          <p className="font-semibold text-foreground">{user?.firstName} {user?.lastName}</p>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
          <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-indigo-600 font-medium mt-1 hover:underline">
            Change photo
          </button>
        </div>
      </div>

      {/* Basic info */}
      <div className="bg-muted rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-foreground text-sm">Personal Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">First Name</label>
            <input {...register('firstName')} className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <FieldError message={errors.firstName?.message} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Last Name</label>
            <input {...register('lastName')} className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <FieldError message={errors.lastName?.message} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">Phone Number</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">+91</span>
            <input {...register('phone')} className="w-full h-10 pl-10 pr-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <FieldError message={errors.phone?.message} />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">Bio (optional)</label>
          <textarea
            {...register('profile.bio')}
            rows={2}
            placeholder="A short bio about yourself..."
            className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-muted rounded-xl p-5 space-y-4">
        <h3 className="font-semibold text-foreground text-sm">Emergency Contact</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Name</label>
            <input {...register('profile.emergencyContact.name')} placeholder="Full name" className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Phone</label>
            <input {...register('profile.emergencyContact.phone')} placeholder="Mobile number" className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Relation</label>
            <select {...register('profile.emergencyContact.relation')} className="w-full h-10 px-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="">Select</option>
              {['Parent', 'Spouse', 'Sibling', 'Friend', 'Relative', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending || !isDirty}
        className={cn(
          'flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all',
          saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
        )}
      >
        {isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</>
          : saved ? <><CheckCircle className="h-4 w-4" />Saved!</>
            : <><Save className="h-4 w-4" />Save Changes</>}
      </button>
    </form>
  );
}

// ─── Password Tab ─────────────────────────────────────────────────────────────
function PasswordTab() {
  const [show, setShow] = useState({ curr: false, new: false, conf: false });
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: (data: PasswordForm) =>
      apiClient.patch('/api/v1/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    onSuccess: () => {
      reset();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    },
  });

  const strength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  return (
    <form onSubmit={handleSubmit(d => mutate(d))} className="space-y-5 max-w-md">
      {success && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
          <CheckCircle className="h-5 w-5" /> Password changed successfully!
        </div>
      )}
      {isError && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertTriangle className="h-4 w-4" />
          {(error as any)?.response?.data?.message ?? 'Failed to change password'}
        </div>
      )}

      {/* Current password */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">Current Password</label>
        <div className="relative">
          <input
            {...register('currentPassword')}
            type={show.curr ? 'text' : 'password'}
            className="w-full h-10 pl-3 pr-10 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button type="button" onClick={() => setShow(s => ({ ...s, curr: !s.curr }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {show.curr ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <FieldError message={errors.currentPassword?.message} />
      </div>

      {/* New password with strength meter */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">New Password</label>
        <div className="relative">
          <input
            {...register('newPassword')}
            type={show.new ? 'text' : 'password'}
            className="w-full h-10 pl-3 pr-10 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button type="button" onClick={() => setShow(s => ({ ...s, new: !s.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {show.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <FieldError message={errors.newPassword?.message} />
        {/* Strength meter */}
        <div className="mt-2 space-y-1.5">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(i => {
              const s = strength('');
              return (
                <div key={i} className={cn('h-1 flex-1 rounded-full transition-colors', i <= strength('') ? 'bg-emerald-500' : 'bg-muted')} />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {([
              ['8+ characters', /^.{8,}/],
              ['Uppercase', /[A-Z]/],
              ['Number', /[0-9]/],
              ['Special char', /[^A-Za-z0-9]/],
            ] as [string, RegExp][]).map(([label]) => (
              <span key={label} className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />{label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Confirm password */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">Confirm New Password</label>
        <div className="relative">
          <input
            {...register('confirmPassword')}
            type={show.conf ? 'text' : 'password'}
            className="w-full h-10 pl-3 pr-10 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button type="button" onClick={() => setShow(s => ({ ...s, conf: !s.conf }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {show.conf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <FieldError message={errors.confirmPassword?.message} />
      </div>

      <button type="submit" disabled={isPending} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
        {isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Updating...</> : <><Lock className="h-4 w-4" />Update Password</>}
      </button>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'password', label: 'Password & Security', icon: Lock },
] as const;

type Tab = typeof TABS[number]['id'];

export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>('profile');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile, security, and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <TabButton key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
            <span className="flex items-center gap-1.5">
              <t.icon className="h-4 w-4" />{t.label}
            </span>
          </TabButton>
        ))}
      </div>

      {/* Content */}
      <div className="bg-card rounded-2xl border p-6 shadow-sm">
        {tab === 'profile' && <ProfileTab />}
        {tab === 'password' && <PasswordTab />}
      </div>
    </div>
  );
}
