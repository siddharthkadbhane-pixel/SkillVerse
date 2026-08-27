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
  const badgeColors = {
    primary: 'bg-[#7C3AED]/15 text-[#A78BFA] border-[#7C3AED]/30',
    success: 'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/30',
    cyan: 'bg-[#06B6D4]/15 text-[#67E8F9] border-[#06B6D4]/30',
    amber: 'bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/30',
    neutral: 'bg-white/[0.06] text-[#94A3B8] border-white/[0.10]',
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-white/[0.08]">
      <div className="space-y-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-[#64748B] mb-2 font-medium">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#475569]" />}
                {b.href ? (
                  <Link
                    href={b.href}
                    className="hover:text-[#F8FAFC] transition-colors"
                  >
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-[#94A3B8]">{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F8FAFC]">
            {title}
          </h1>
          {badge && (
            <span
              className={`text-xs font-mono font-medium px-2.5 py-0.5 rounded-full border ${
                badgeColors[badge.variant || 'primary']
              }`}
            >
              {badge.text}
            </span>
          )}
        </div>

        {description && (
          <p className="text-xs sm:text-sm text-[#94A3B8] max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {children && (
        <div className="flex items-center gap-2.5 shrink-0">{children}</div>
      )}
    </div>
  );
}
