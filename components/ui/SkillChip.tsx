import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface SkillChipProps {
  name: string;
  level?: number;
  growth?: number | string;
  verified?: boolean;
  category?: string;
  size?: 'sm' | 'md';
  onClick?: () => void;
  className?: string;
}

export default function SkillChip({
  name,
  level,
  growth,
  verified = true,
  category,
  size = 'md',
  onClick,
  className = '',
}: SkillChipProps) {
  const isSmall = size === 'sm';

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#111722] dark:hover:bg-[#151B26] border border-slate-200 hover:border-slate-300 dark:border-white/[0.08] dark:hover:border-white/[0.14] rounded-lg transition-all ${
        isSmall ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <span className="font-medium text-slate-800 dark:text-[#F8FAFC]">{name}</span>

      {level !== undefined && (
        <span className="font-mono text-[11px] font-semibold text-[#6366F1] dark:text-[#C4B5FD] bg-[#6366F1]/10 px-1.5 py-0.5 rounded">
          {level}
        </span>
      )}

      {growth !== undefined && (
        <span className="font-mono text-[10px] text-[#14B8A6] font-medium">
          ↑{growth}%
        </span>
      )}

      {verified && (
        <CheckCircle2 className="w-3.5 h-3.5 text-[#14B8A6] shrink-0" />
      )}
    </div>
  );
}
