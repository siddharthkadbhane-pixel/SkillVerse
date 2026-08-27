import React from 'react';

interface ScoreProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export default function Score({
  value,
  max = 100,
  size = 'md',
  showLabel = false,
  label = 'Skill Score',
  className = '',
}: ScoreProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const getColor = (pct: number) => {
    if (pct >= 85) return 'text-[#10B981] border-[#10B981]/30 bg-[#10B981]/10';
    if (pct >= 70) return 'text-[#38BDF8] border-[#38BDF8]/30 bg-[#38BDF8]/10';
    if (pct >= 50) return 'text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/10';
    return 'text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/10';
  };

  const getTier = (pct: number) => {
    if (pct >= 90) return 'Elite';
    if (pct >= 75) return 'Advanced';
    if (pct >= 60) return 'Proficient';
    if (pct >= 40) return 'Developing';
    return 'Novice';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 border',
    md: 'text-sm px-2.5 py-1 border',
    lg: 'text-base px-3 py-1.5 border font-bold',
    xl: 'text-xl px-4 py-2 border font-bold',
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`font-mono font-bold rounded-lg tracking-tight ${getColor(
          percentage
        )} ${sizeClasses[size]}`}
      >
        {value}
        {max !== 100 && (
          <span className="text-[10px] opacity-70 font-normal">/{max}</span>
        )}
      </span>
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-wider text-[#64748B] font-medium">
            {label}
          </span>
          <span className="text-xs text-[#94A3B8] font-medium">
            {getTier(percentage)}
          </span>
        </div>
      )}
    </div>
  );
}
