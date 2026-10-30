import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  badge?: {
    text: string;
    variant?: 'primary' | 'success' | 'cyan' | 'amber' | 'neutral';
  };
  children?: React.ReactNode;
}

export default function PageHeader({
  title,
  description,
  breadcrumbs,
  badge,
  children,
}: PageHeaderProps) {
  const badgeStyles: Record<string, string> = {
    primary: 'bg-[#6366F1]/10 text-[#6366F1] dark:text-[#C4B5FD]',
    success: 'bg-[#14B8A6]/10 text-[#14B8A6] dark:text-[#5EEAD4]',
    cyan:    'bg-[#3B82F6]/10 text-[#3B82F6] dark:text-[#93C5FD]',
    amber:   'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    neutral: 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-[#94A3B8]',
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-200 dark:border-white/[0.07] transition-colors">
      <div className="space-y-1 min-w-0">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-[11.5px] text-slate-400 dark:text-[#475569] mb-2">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="w-3 h-3 text-slate-300 dark:text-[#364154]" />}
                {b.href ? (
                  <Link href={b.href} className="hover:text-slate-900 dark:hover:text-[#94A3B8] transition-colors">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-slate-600 dark:text-[#64748B]">{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title + badge */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-[18px] font-semibold tracking-[-0.025em] text-slate-900 dark:text-[#F1F5F9] leading-tight">
            {title}
          </h1>
          {badge && (
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                badgeStyles[badge.variant || 'primary']
              }`}
            >
              {badge.text}
            </span>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-[12.5px] text-slate-500 dark:text-[#64748B] max-w-2xl leading-relaxed mt-0.5">
            {description}
          </p>
        )}
      </div>

      {/* Actions */}
      {children && (
        <div className="flex items-center gap-2 shrink-0">{children}</div>
      )}
    </div>
  );
}
