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
      className={`inline-flex items-center gap-1.5 bg-[#111722] hover:bg-[#151B26] border border-white/[0.08] hover:border-white/[0.14] rounded-lg transition-all ${
        isSmall ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <span className="font-medium text-[#F8FAFC]">{name}</span>

      {level !== undefined && (
        <span className="font-mono text-[11px] font-semibold text-[#A78BFA] bg-[#7C3AED]/15 px-1.5 py-0.2 rounded">
          {level}
        </span>
      )}

      {growth !== undefined && (
        <span className="font-mono text-[10px] text-[#10B981] font-medium">
          ↑{growth}%
        </span>
      )}

      {verified && (
        <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
      )}
    </div>
  );
}
