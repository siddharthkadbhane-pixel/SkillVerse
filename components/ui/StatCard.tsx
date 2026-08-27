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
  iconColor = 'text-[#7C3AED]',
  className = '',
}: StatCardProps) {
  return (
    <div
      className={`bg-[#0D121A] border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-5 transition-all duration-200 shadow-sm flex flex-col justify-between group ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-medium text-[#94A3B8] tracking-wide uppercase">
          {label}
        </span>
        {Icon && (
          <div className="p-2 rounded-lg bg-[#111722] border border-white/[0.06] group-hover:border-white/[0.10] transition-colors">
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mt-1">
        <span className="font-mono text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
          {value}
        </span>
        {trend && (
          <span
            className={`font-mono text-xs font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
              trend.isPositive !== false
                ? 'text-[#10B981] bg-[#10B981]/10'
                : 'text-[#EF4444] bg-[#EF4444]/10'
            }`}
          >
            {trend.isPositive !== false ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      {(subtitle || trend?.label) && (
        <p className="text-xs text-[#64748B] mt-2 font-normal truncate">
          {trend?.label ? `${trend.label} • ` : ''}
          {subtitle}
        </p>
      )}
    </div>
  );
}
