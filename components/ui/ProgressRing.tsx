'use client';

import React from 'react';

interface ProgressRingProps {
  value: number;       // 0–100
  size?: number;       // SVG size in px
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
  glowColor?: string;
}

export default function ProgressRing({
  value,
  size = 100,
  strokeWidth = 4,
  color = '#8B5CF6',
  label,
  sublabel,
  glowColor,
}: ProgressRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  const glow = glowColor || color;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Glow aura */}
      <div
        className="absolute inset-0 rounded-full animate-pulse-glow"
        style={{
          background: `radial-gradient(circle, ${glow}15 0%, transparent 70%)`,
          filter: 'blur(8px)',
        }}
      />
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          className="progress-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="progress-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 6px ${glow}50)`,
          }}
        />
      </svg>
      {(label || sublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {label && (
            <span className="font-bold tabular-nums" style={{ fontSize: size * 0.22, color }}>
              {label}
            </span>
          )}
          {sublabel && (
            <span className="text-dim font-medium" style={{ fontSize: size * 0.11 }}>
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
