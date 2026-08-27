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
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: '#64748B', fontSize: 9 }}
            stroke="rgba(255, 255, 255, 0.05)"
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
              backgroundColor: '#0D121A',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#F8FAFC',
              fontSize: '11px',
              fontFamily: 'monospace',
            }}
            itemStyle={{ color: '#A78BFA' }}
            formatter={(value: any) => [`${value}/100`, 'Proficiency']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
