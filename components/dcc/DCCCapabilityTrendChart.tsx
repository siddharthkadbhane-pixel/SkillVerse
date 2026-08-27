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
import { GrowthChartPoint } from '@/types/dcc';
import { TrendingUp } from 'lucide-react';

interface DCCCapabilityTrendChartProps {
  data: GrowthChartPoint[];
  height?: number;
}

export default function DCCCapabilityTrendChart({
  data = [],
  height = 200,
}: DCCCapabilityTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div 
        style={{ height }} 
        className="flex flex-col items-center justify-center p-4 rounded-lg bg-zinc-900/30 border border-white/[0.04] text-center"
      >
        <TrendingUp className="w-5 h-5 text-zinc-600 mb-1.5" />
        <p className="text-xs text-zinc-400 font-medium">No Capability Progression Logged</p>
        <p className="text-[11px] text-zinc-500 mt-0.5 max-w-xs">
          Analyze repositories to begin mapping verified capability growth over time.
        </p>
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map((d) => ({
    date: d.date,
    Score: d.score,
    'Skills Verified': d.verifiedSkills,
    milestone: d.milestone,
  }));

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="skillsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />

          <XAxis
            dataKey="date"
            stroke="#64748B"
            tick={{ fill: '#71717A', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
            tickLine={false}
          />
          <YAxis
            stroke="#64748B"
            tick={{ fill: '#71717A', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            domain={['auto', 'auto']}
          />

          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const milestone = payload[0]?.payload?.milestone;
                return (
                  <div className="p-2.5 rounded-lg bg-[#0D121A] border border-white/10 shadow-xl text-xs font-mono">
                    <p className="font-semibold text-zinc-300 pb-1 border-b border-white/[0.06] mb-1.5">{label}</p>
                    {payload.map((p, i) => (
                      <p key={i} style={{ color: p.color }} className="flex items-center justify-between gap-4 py-0.5">
                        <span>{p.name}:</span>
                        <strong className="font-bold">{p.value}</strong>
                      </p>
                    ))}
                    {milestone && (
                      <p className="mt-1.5 pt-1 border-t border-white/[0.06] text-[10px] text-zinc-400 font-sans italic">
                        {milestone}
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />

          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{ paddingBottom: '6px', fontSize: '11px' }}
          />

          <Area
            type="monotone"
            dataKey="Score"
            stroke="#6366F1"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#scoreGrad)"
            dot={{ r: 3, fill: '#6366F1', strokeWidth: 1 }}
            activeDot={{ r: 5, stroke: '#FFFFFF', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
