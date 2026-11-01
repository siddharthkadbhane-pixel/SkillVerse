import React from 'react';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}
    >
      {/* Icon */}
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-[#111722] text-slate-500 dark:text-slate-400 mb-4 shadow-sm">
        <Icon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
      </div>

      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200 mb-1.5">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[320px] leading-relaxed mb-6">
        {description}
      </p>

      {action && (
        <>
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center justify-center text-xs font-semibold px-4.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white transition-all shadow-md shadow-indigo-600/20 active:scale-95"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center justify-center text-xs font-semibold px-4.5 py-2 rounded-xl bg-slate-100 dark:bg-[#111722] hover:bg-slate-200 dark:hover:bg-[#151B26] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 transition-colors"
            >
              {action.label}
            </button>
          )}
        </>
      )}
    </div>
  );
}
