'use client';

import { Settings, Shield, Bell, Database, Globe } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Configure platform-wide settings</p>
      </div>

      <div className="space-y-4">
        {[
          {
            icon: Shield,
            title: 'Security',
            items: [
              { label: 'Two-Factor Authentication', desc: 'Require 2FA for all admin accounts', checked: true },
              { label: 'Session Timeout', desc: 'Auto-logout after 30 minutes of inactivity', checked: true },
              { label: 'IP Allowlisting', desc: 'Restrict admin access to specific IPs', checked: false },
            ],
          },
          {
            icon: Bell,
            title: 'Notifications',
            items: [
              { label: 'Email Alerts', desc: 'Send email on critical events', checked: true },
              { label: 'Audit Notifications', desc: 'Alert on suspicious admin actions', checked: true },
              { label: 'System Reports', desc: 'Weekly platform summary reports', checked: false },
            ],
          },
          {
            icon: Globe,
            title: 'Platform',
            items: [
              { label: 'Maintenance Mode', desc: 'Put platform into maintenance mode', checked: false },
              { label: 'New Registrations', desc: 'Allow new user registrations', checked: true },
              { label: 'Broker Marketplace', desc: 'Enable the broker marketplace', checked: true },
            ],
          },
        ].map(({ icon: Icon, title, items }) => (
          <div key={title} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <Icon className="h-4 w-4 text-indigo-400" /> {title}
            </h2>
            <div className="space-y-1">
              {items.map(({ label, desc, checked }) => (
                <div key={label} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-200">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                    <input type="checkbox" defaultChecked={checked} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-700 peer-checked:bg-indigo-600 rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
