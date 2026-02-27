'use client';

import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover = true, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'glass-card p-6',
        hover && 'hover:border-primary/50 hover:shadow-primary/10',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
