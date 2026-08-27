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
      className={`bg-[#0D121A] border border-white/[0.08] border-dashed rounded-xl p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto ${className}`}
    >
      <div className="p-3.5 rounded-xl bg-[#111722] border border-white/[0.08] mb-4 text-[#A78BFA]">
        <Icon className="w-6 h-6" />
      </div>

      <h3 className="text-base font-semibold text-[#F8FAFC] mb-1.5">{title}</h3>
      <p className="text-xs text-[#94A3B8] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {action && (
        <div>
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center justify-center text-xs font-semibold px-4 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center justify-center text-xs font-semibold px-4 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
