'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Sun,
  Moon,
  Monitor,
  Bell,
  Download,
  Upload,
  Trash2,
  Info,
  HelpCircle,
  Shield,
  Clock,
} from 'lucide-react';
import { db, exportUserData, importUserData, clearUserData } from '@/lib/db';
import { Button, Input, Card, useToast, Dialog } from '@/components/shared';
import { useTheme, useUser } from '@/lib/context';
import { APP_VERSION } from '@/lib/constants';
import type { Theme } from '@/types';

export function SettingsTab() {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [journalReminder, setJournalReminder] = useState(true);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [quietHours, setQuietHours] = useState({ start: '22:00', end: '07:00' });
  const [pushEnabled, setPushEnabled] = useState(true);

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <Sun className="w-5 h-5" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="w-5 h-5" /> },
    { value: 'system', label: 'System', icon: <Monitor className="w-5 h-5" /> },
  ];

  const handleExport = async () => {
    if (!user) return;
    try {
      const data = await exportUserData(user.id);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `noteflow-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Data exported successfully', 'success');
    } catch (error) {
      showToast('Failed to export data', 'error');
    }
  };

  const handleImport = async () => {
    if (!user) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        await importUserData(user.id, text);
        showToast('Data imported successfully', 'success');
        window.location.reload();
      } catch (error) {
        showToast('Failed to import data', 'error');
      }
    };
    input.click();
  };

  const handleClearData = async () => {
    if (!user) return;
    try {
      await clearUserData(user.id);
      showToast('All data cleared', 'success');
      setShowClearConfirm(false);
      window.location.reload();
    } catch (error) {
      showToast('Failed to clear data', 'error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold">Settings</h2>

      <Card>
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Sun className="w-5 h-5" />
          Appearance
        </h3>
        <div className="flex gap-2">
          {themeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                theme === option.value
                  ? 'bg-primary text-white'
                  : 'glass border border-glass-border hover:border-primary'
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Daily Journal Reminder</p>
              <p className="text-sm text-foreground-muted">Get reminded to log your daily check-in</p>
            </div>
            <button
              onClick={() => setJournalReminder(!journalReminder)}
              className={`w-12 h-6 rounded-full transition-colors ${
                journalReminder ? 'bg-primary' : 'bg-glass-border'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  journalReminder ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {journalReminder && (
            <div className="flex items-center gap-4">
              <Clock className="w-5 h-5 text-foreground-muted" />
              <Input
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                className="w-32"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-foreground-muted">Receive push notifications on this device</p>
            </div>
            <button
              onClick={() => setPushEnabled(!pushEnabled)}
              className={`w-12 h-6 rounded-full transition-colors ${
                pushEnabled ? 'bg-primary' : 'bg-glass-border'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  pushEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="pt-4 border-t border-glass-border">
            <p className="text-sm font-medium mb-2">Quiet Hours</p>
            <div className="flex items-center gap-4">
              <Input
                type="time"
                value={quietHours.start}
                onChange={e => setQuietHours(prev => ({ ...prev, start: e.target.value }))}
                className="w-32"
              />
              <span className="text-foreground-muted">to</span>
              <Input
                type="time"
                value={quietHours.end}
                onChange={e => setQuietHours(prev => ({ ...prev, end: e.target.value }))}
                className="w-32"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Data Management
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 glass rounded-lg">
            <div>
              <p className="font-medium">Export Data</p>
              <p className="text-sm text-foreground-muted">Download all your data as JSON</p>
            </div>
            <Button variant="secondary" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 glass rounded-lg">
            <div>
              <p className="font-medium">Import Data</p>
              <p className="text-sm text-foreground-muted">Restore from a backup file</p>
            </div>
            <Button variant="secondary" onClick={handleImport}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 glass rounded-lg border border-destructive/30">
            <div>
              <p className="font-medium text-destructive">Clear All Data</p>
              <p className="text-sm text-foreground-muted">Permanently delete all your data</p>
            </div>
            <Button variant="destructive" onClick={() => setShowClearConfirm(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <Info className="w-5 h-5" />
          About
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-foreground-muted">Version</span>
            <span>{APP_VERSION}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground-muted">Build</span>
            <span>Production</span>
          </div>
          <div className="pt-3 border-t border-glass-border">
            <p className="text-sm text-foreground-muted mb-2">
              NoteFlow Recovery is a recovery companion app designed to help individuals track their recovery journey.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <HelpCircle className="w-4 h-4 mr-2" />
                Help
              </Button>
              <Button variant="ghost" size="sm">
                <Shield className="w-4 h-4 mr-2" />
                Privacy
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={showClearConfirm} onClose={() => setShowClearConfirm(false)} title="Clear All Data?">
        <div className="space-y-4">
          <p className="text-foreground-muted">
            This action cannot be undone. All your notes, journal entries, tracker logs, and buddy connections will be permanently deleted.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowClearConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearData}>
              Yes, Clear Everything
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
