import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  testId?: string;
  'data-testid'?: string;
}

export function Card({ children, className, testId, 'data-testid': dataTestId, ...props }: CardProps) {
  const finalTestId = testId || dataTestId;

  return (
    <div
      data-testid={finalTestId}
      {...props}
      className={twMerge(
        clsx(
          'rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm backdrop-blur-sm',
          className
        )
      )}
    >
      {children}
    </div>
  );
}
