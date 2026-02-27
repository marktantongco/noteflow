'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={cn('w-full', className)}>
      {children}
    </div>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex gap-1 p-1 glass rounded-lg', className)}>
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function TabsTrigger({ value, children, active, onClick, className }: TabsTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
        active
          ? 'bg-primary text-white shadow-lg shadow-primary/25'
          : 'text-foreground-muted hover:text-foreground hover:bg-glass-highlight',
        className
      )}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  activeValue: string;
  children: ReactNode;
  className?: string;
}

export function TabsContent({ value, activeValue, children, className }: TabsContentProps) {
  if (value !== activeValue) return null;

  return (
    <div className={cn('mt-4 animate-fade-in', className)}>
      {children}
    </div>
  );
}
