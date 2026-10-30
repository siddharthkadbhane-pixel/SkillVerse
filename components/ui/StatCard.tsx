import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  icon?: LucideIcon;
  iconColor?: string;
  className?: string;
}

export default function StatCard({
  label,
  value,
  subtitle,
  trend,
  icon: Icon,
  iconColor = 'text-[#6366F1]',
  className = '',
}: StatCardProps) {
  return (
    <div
      className={`bg-white dark:bg-[#0E1117] border border-slate-200 dark:border-white/[0.07] rounded-xl p-4 flex flex-col gap-2 shadow-sm transition-colors ${className}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11.5px] font-medium text-slate-500 dark:text-[#64748B]">{label}</span>
        {Icon && (
          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#131720] border border-slate-200 dark:border-white/[0.06]">
            <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
          </div>
        )}
      </div>

      {/* Value row */}
      <div className="flex items-baseline gap-2">
        <span className="text-[22px] font-semibold tracking-tight text-slate-900 dark:text-[#F1F5F9] leading-none">
          {value}
        </span>
        {trend && (
          <span
            className={[
              'text-[11px] font-medium px-1.5 py-0.5 rounded',
              trend.isPositive !== false
                ? 'text-[#14B8A6] bg-[#14B8A6]/10'
                : 'text-[#EF4444] bg-[rgba(239,68,68,0.10)]',
            ].join(' ')}
          >
            {trend.isPositive !== false ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      {/* Subtitle */}
      {(subtitle || trend?.label) && (
        <p className="text-[11.5px] text-slate-400 dark:text-[#475569] truncate leading-snug">
          {trend?.label ? `${trend.label} · ` : ''}
          {subtitle}
        </p>
      )}
    </div>
  );
}
