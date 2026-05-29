'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Save, Loader2, CheckCircle, AlertCircle,
  User, Mail, Bell, Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getSettings, updateSettings } from '@/lib/api';

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
        checked ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );
}

function SettingRow({ icon: Icon, label, desc, children }: {
  icon: any; label: string; desc: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3 flex-1">
        <div className="mt-0.5 rounded-lg bg-gray-100 border border-gray-200 p-2">
          <Icon className="h-4 w-4 text-gray-500" />
        </div>
        <div>
          <p className="text-gray-900 font-medium text-sm">{label}</p>
          <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    profileName: 'Admin',
    email: 'admin@medguard.ai',
    emailAlerts: true,
    pushNotifications: true,
    darkMode: false,
    alertThreshold: 3,
  });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    getSettings()
      .then(res => { if (res.settings) setSettings(s => ({ ...s, ...res.settings })); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      await updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-64px)]">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 space-y-6">

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-gray-500" />
            Settings
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your MedGuard AI preferences</p>
        </motion.div>

        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage administrator identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                  <User className="h-3.5 w-3.5 text-gray-400" /> Profile Name
                </label>
                <input
                  value={settings.profileName}
                  onChange={e => setSettings(s => ({ ...s, profileName: e.target.value }))}
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60 transition-colors"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-1.5">
                  <Mail className="h-3.5 w-3.5 text-gray-400" /> Email Address
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={e => setSettings(s => ({ ...s, email: e.target.value }))}
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60 transition-colors"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <SettingRow icon={Bell} label="Email Alerts" desc="Receive emails for counterfeit detections">
                <Toggle checked={settings.emailAlerts} onChange={v => setSettings(s => ({ ...s, emailAlerts: v }))} disabled={loading} />
              </SettingRow>
              <SettingRow icon={Bell} label="Push Notifications" desc="Browser notifications for critical alerts">
                <Toggle checked={settings.pushNotifications} onChange={v => setSettings(s => ({ ...s, pushNotifications: v }))} disabled={loading} />
              </SettingRow>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
          <Card>
            <CardHeader>
              <CardTitle>Security Thresholds</CardTitle>
            </CardHeader>
            <CardContent>
              <SettingRow icon={Shield} label="Alert Threshold" desc="Trigger batch pattern alert after N suspicious hits">
                <input
                  type="number" min={1} max={20}
                  value={settings.alertThreshold}
                  onChange={e => setSettings(s => ({ ...s, alertThreshold: parseInt(e.target.value) || 3 }))}
                  className="w-16 rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 text-center focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </SettingRow>
            </CardContent>
          </Card>
        </motion.div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            <CheckCircle className="h-4 w-4 shrink-0" />
            Settings saved successfully.
          </motion.div>
        )}

        <Button onClick={handleSave} disabled={saving || loading} size="lg" className="w-full">
          {saving
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            : <><Save className="h-4 w-4" /> Save Settings</>}
        </Button>

      </div>
    </div>
  );
}
