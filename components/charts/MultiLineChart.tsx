'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { useTheme } from '@/components/theme/useTheme';

export interface LineDataPoint {
  date: string;
  commits?: number;
  contributions?: number;
  prs?: number;
  score?: number;
  [key: string]: any;
}

interface MultiLineChartProps {
  data: LineDataPoint[];
  height?: number;
  series?: {
    key: string;
    label: string;
    color: string;
    fillColor?: string;
  }[];
  showLegend?: boolean;
}

export default function MultiLineChart({
  data,
  height = 240,
  series = [
    { key: 'commits', label: 'Commits', color: '#7C3AED', fillColor: '#7C3AED' },
    { key: 'contributions', label: 'Contributions', color: '#38BDF8', fillColor: '#38BDF8' },
    { key: 'prs', label: 'PRs Merged', color: '#10B981', fillColor: '#10B981' },
  ],
  showLegend = true,
}: MultiLineChartProps) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';

  const gridStroke = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.08)';
  const axisLineStroke = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.12)';
  const tickFill = isDark ? '#94A3B8' : '#64748B';

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad_${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0.0} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />

          <XAxis
            dataKey="date"
            stroke={tickFill}
            tick={{ fill: tickFill, fontSize: 10, fontFamily: 'monospace' }}
            axisLine={{ stroke: axisLineStroke }}
            tickLine={false}
          />
          <YAxis
            stroke={tickFill}
            tick={{ fill: tickFill, fontSize: 10, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
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
          />

          {showLegend && (
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
            />
          )}

          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#grad_${s.key})`}
              dot={{ r: 2.5, fill: s.color, strokeWidth: 1 }}
              activeDot={{ r: 4, stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
