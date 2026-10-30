'use client';

import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { useTheme } from '@/components/theme/useTheme';

export interface RadarDataPoint {
  dimension: string;
  score: number;
  fullMark?: number;
}

interface RadarChartComponentProps {
  data: RadarDataPoint[];
  color?: string;
  fillOpacity?: number;
  height?: number;
}

export default function RadarChartComponent({
  data,
  color = '#7C3AED',
  fillOpacity = 0.35,
  height = 240,
}: RadarChartComponentProps) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const gridStroke = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.09)';
  const tickFill = isDark ? '#94A3B8' : '#475569';
  const radiusTickFill = isDark ? '#64748B' : '#64748B';
  const radiusStroke = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.08)';

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke={gridStroke} strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: tickFill, fontSize: 10, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: radiusTickFill, fontSize: 9 }}
            stroke={radiusStroke}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={fillOpacity}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#0D121A' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.12)',
              borderRadius: '8px',
              color: isDark ? '#F8FAFC' : '#0F172A',
              fontSize: '11px',
              fontFamily: 'monospace',
              boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 4px 16px rgba(15,23,42,0.10)',
            }}
            itemStyle={{ color: '#6366F1' }}
            formatter={(value: any) => [`${value}/100`, 'Proficiency']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
