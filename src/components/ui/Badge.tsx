import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'info' | 'neutral' | 'disabled';
  className?: string;
  testId?: string;
  'data-testid'?: string;
}

export function Badge({
  children,
  variant = 'default',
  className,
  testId,
  'data-testid': dataTestId,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-blue-950/70 text-blue-300 border-blue-800/60',
    success: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60',
    warning: 'bg-amber-950/70 text-amber-300 border-amber-800/60',
    info: 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
    disabled: 'bg-slate-900 text-slate-500 border-slate-800',
  };

  const finalTestId = testId || dataTestId;

  return (
    <span
      data-testid={finalTestId}
      {...props}
      className={twMerge(
        clsx(
          'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
          variantStyles[variant],
          className
        )
      )}
    >
      {children}
    </span>
  );
}
