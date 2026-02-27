'use client';

import { useState, useEffect } from 'react';
import { cn, getMoodEmoji } from '@/lib/utils';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export function Slider({
  value,
  onChange,
  min = 1,
  max = 10,
  label,
  showValue = true,
  className,
}: SliderProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    setLocalValue(newValue);
    onChange(newValue);
  };

  const percentage = ((localValue - min) / (max - min)) * 100;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-foreground-muted">{label}</label>
          {showValue && (
            <span className="text-2xl">{getMoodEmoji(localValue)}</span>
          )}
        </div>
      )}
      <div className="relative">
        <div className="h-2 bg-glass-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-secondary via-primary to-accent-purple transition-all duration-150"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={localValue}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-2 border-primary transition-all duration-150 hover:scale-110"
          style={{ left: `calc(${percentage}% - 12px)` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-foreground-muted">
        <span>{min}</span>
        <span className="font-medium text-primary">{localValue}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
