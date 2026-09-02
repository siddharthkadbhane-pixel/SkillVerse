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
    primary: 'bg-[rgba(124,58,237,0.10)] text-[#A78BFA]',
    success: 'bg-[rgba(16,185,129,0.10)] text-[#10B981]',
    cyan:    'bg-[rgba(6,182,212,0.10)] text-[#06B6D4]',
    amber:   'bg-[rgba(245,158,11,0.10)] text-[#F59E0B]',
    neutral: 'bg-white/[0.06] text-[#94A3B8]',
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-white/[0.07]">
      <div className="space-y-1 min-w-0">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-[11.5px] text-[#475569] mb-2">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="w-3 h-3 text-[#364154]" />}
                {b.href ? (
                  <Link href={b.href} className="hover:text-[#94A3B8] transition-colors">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-[#64748B]">{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title + badge */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-[18px] font-semibold tracking-[-0.025em] text-[#F1F5F9] leading-tight">
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
          <p className="text-[12.5px] text-[#64748B] max-w-2xl leading-relaxed mt-0.5">
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
