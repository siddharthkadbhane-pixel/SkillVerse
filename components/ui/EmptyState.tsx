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
      {/* Icon — simple bordered box, no colored background */}
      <div className="flex items-center justify-center w-10 h-10 rounded-xl border border-white/[0.08] bg-[#131720] text-[#64748B] mb-4">
        <Icon className="w-5 h-5" />
      </div>

      <h3 className="text-[13.5px] font-medium text-[#94A3B8] mb-1.5">{title}</h3>
      <p className="text-[12px] text-[#475569] max-w-[280px] leading-relaxed mb-6">
        {description}
      </p>

      {action && (
        <>
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center justify-center text-[12.5px] font-medium px-4 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center justify-center text-[12.5px] font-medium px-4 py-2 rounded-lg bg-[#131720] hover:bg-[#181F2C] border border-white/[0.08] text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
            >
              {action.label}
            </button>
          )}
        </>
      )}
    </div>
  );
}
