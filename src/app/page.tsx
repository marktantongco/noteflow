'use client';

import { Inter } from 'next/font/google';
import { AppProvider, useApp } from '@/lib/context';
import { ToastProvider } from '@/components/shared';
import { Layout } from '@/components/shared';
import { NotesTab } from '@/components/notes/NotesTab';
import { JournalTab } from '@/components/journal/JournalTab';
import { TrackerTab } from '@/components/tracker/TrackerTab';
import { AnalyticsTab } from '@/components/analytics/AnalyticsTab';
import { BuddySystem } from '@/components/buddy/BuddySystem';
import { SettingsTab } from '@/components/settings/SettingsTab';
import { Button, Input, Card } from '@/components/shared';
import { Heart, LogIn, Loader2 } from 'lucide-react';
import type { TabId } from '@/types';

const inter = Inter({ subsets: ['latin'] });

function AuthScreen({ onLogin }: { onLogin: (name: string, email: string) => void }) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">NoteFlow Recovery</h1>
          <p className="text-foreground-muted mt-2">Your personal recovery companion</p>
        </div>
        <div className="space-y-4">
          <Input
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <Input
            placeholder="Email (optional)"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <Button
            className="w-full"
            onClick={() => onLogin(name || 'User', email || 'user@noteflow.app')}
            disabled={!name}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Get Started
          </Button>
        </div>
        <p className="text-xs text-center text-foreground-muted mt-4">
          Your data is stored locally and never shared.
        </p>
      </Card>
    </div>
  );
}

import React from 'react';

function AppContent() {
  const { state, setActiveTab, login, dbReady } = useApp();

  if (state.isLoading || !dbReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-foreground-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!state.user) {
    return <AuthScreen onLogin={login} />;
  }

  return (
    <Layout activeTab={state.activeTab} onTabChange={setActiveTab}>
      {state.activeTab === 'notes' && <NotesTab />}
      {state.activeTab === 'journal' && <JournalTab />}
      {state.activeTab === 'tracker' && <TrackerTab />}
      {state.activeTab === 'analytics' && <AnalyticsTab />}
      {state.activeTab === 'buddy' && <BuddySystem />}
      {state.activeTab === 'settings' && <SettingsTab />}
    </Layout>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <ToastProvider>
        <main className={inter.className}>
          <AppContent />
        </main>
      </ToastProvider>
    </AppProvider>
  );
}
