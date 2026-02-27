'use client';

import { ReactNode } from 'react';
import {
  BookOpen,
  PenLine,
  FlaskConical,
  BarChart3,
  Users,
  Settings,
  Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/context';
import { ThemeToggle } from './ThemeToggle';
import type { TabId } from '@/types';

interface LayoutProps {
  children: ReactNode;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'notes', label: 'Notes', icon: <BookOpen className="w-5 h-5" /> },
  { id: 'journal', label: 'Journal', icon: <PenLine className="w-5 h-5" /> },
  { id: 'tracker', label: 'Tracker', icon: <FlaskConical className="w-5 h-5" /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'buddy', label: 'Buddy', icon: <Users className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const { state } = useApp();

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 h-16 glass border-b border-glass-border z-40">
        <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold gradient-text hidden sm:block">
              NoteFlow
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'text-foreground-muted hover:text-foreground hover:bg-glass-highlight'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {state.isOffline && (
              <span className="text-xs px-2 py-1 rounded bg-warning/20 text-warning">
                Offline
              </span>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="pt-16 pb-20 lg:pb-4">
        <div className="max-w-7xl mx-auto p-4">
          {children}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-glass-border lg:hidden z-40">
        <div className="flex justify-around py-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all min-w-[60px]',
                activeTab === tab.id
                  ? 'text-primary bg-primary/10'
                  : 'text-foreground-muted'
              )}
            >
              {tab.icon}
              <span className="text-[10px]">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
