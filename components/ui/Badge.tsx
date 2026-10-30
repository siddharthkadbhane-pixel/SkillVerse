'use client';

import React from 'react';
import { CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'verified' | 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  icon?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className = '',
  variant = 'neutral',
  size = 'md',
  icon = true,
  children,
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  }[size];

  const variantStyles = {
    verified:
      'bg-teal-500/10 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30 font-semibold shadow-sm shadow-teal-500/10',
    primary:
      'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 font-semibold',
    secondary:
      'bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-medium',
    neutral:
      'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 font-medium',
    success:
      'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-medium',
    warning:
      'bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-medium',
    danger:
      'bg-red-500/10 dark:bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 font-medium',
  }[variant];

  return (
    <span
      className={`inline-flex items-center rounded-full leading-none whitespace-nowrap transition-colors ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {icon && variant === 'verified' && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-teal-500 dark:text-teal-400" />}
      {icon && variant === 'primary' && <Sparkles className="w-3 h-3 shrink-0" />}
      {children}
    </span>
  );
};

export default Badge;
