'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dna, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

interface TechNode {
  name: string;
  level: number;
  angle: number; // in degrees
  distance: number; // distance from dimension hub
}

interface DimensionHub {
  name: string;
  score: number;
  color: string;
  angle: number; // angle from center in degrees (0, 60, 120, 180, 240, 300)
  radius: number; // distance from central core
  techs: TechNode[];
}

export default function SkillDnaMap() {
  const [hoveredNode, setHoveredNode] = useState<{ name: string; score: number; category: string } | null>(null);

  const centerX = 360;
  const centerY = 280;

  // 6 Primary Dimensions with their surrounding technology nodes
  const dimensions: DimensionHub[] = [
    {
      name: 'Frontend',
      score: 96,
      color: '#7C3AED',
      angle: 270, // Top
      radius: 115,
      techs: [
        { name: 'React', level: 96, angle: 250, distance: 75 },
        { name: 'TypeScript', level: 98, angle: 270, distance: 85 },
        { name: 'Tailwind CSS', level: 94, angle: 290, distance: 75 },
        { name: 'HTML/CSS', level: 95, angle: 305, distance: 65 },
      ],
    },
    {
      name: 'Backend',
      score: 94,
      color: '#38BDF8',
      angle: 330, // Top Right
      radius: 115,
      techs: [
        { name: 'Node.js', level: 95, angle: 320, distance: 75 },
        { name: 'Express.js', level: 90, angle: 340, distance: 78 },
        { name: 'REST APIs', level: 96, angle: 360, distance: 75 },
        { name: 'GraphQL', level: 88, angle: 380, distance: 65 },
      ],
    },
    {
      name: 'Database',
      score: 92,
      color: '#10B981',
      angle: 30, // Bottom Right
      radius: 115,
      techs: [
        { name: 'PostgreSQL', level: 94, angle: 15, distance: 75 },
        { name: 'MongoDB', level: 88, angle: 35, distance: 78 },
        { name: 'Prisma', level: 91, angle: 55, distance: 70 },
      ],
    },
    {
      name: 'Tools & DevOps',
      score: 88,
      color: '#F59E0B',
      angle: 90, // Bottom
      radius: 115,
      techs: [
        { name: 'Git', level: 96, angle: 75, distance: 70 },
        { name: 'Docker', level: 89, angle: 90, distance: 82 },
        { name: 'CI/CD', level: 87, angle: 105, distance: 70 },
        { name: 'Linux', level: 90, angle: 120, distance: 65 },
      ],
    },
    {
      name: 'CS Fundamentals',
      score: 95,
      color: '#06B6D4',
      angle: 150, // Bottom Left
      radius: 115,
      techs: [
        { name: 'Algorithms', level: 95, angle: 135, distance: 75 },
        { name: 'Data Structures', level: 96, angle: 150, distance: 80 },
        { name: 'System Design', level: 94, angle: 165, distance: 75 },
        { name: 'OOP', level: 92, angle: 180, distance: 65 },
      ],
    },
    {
      name: 'Others',
      score: 89,
      color: '#A78BFA',
      angle: 210, // Top Left
      radius: 115,
      techs: [
        { name: 'UI/UX', level: 88, angle: 195, distance: 70 },
        { name: 'Testing', level: 86, angle: 210, distance: 80 },
        { name: 'AI/ML Basics', level: 90, angle: 225, distance: 72 },
      ],
    },
  ];

  // Helper to convert polar to cartesian
  const getCoordinates = (originX: number, originY: number, angleDeg: number, distance: number) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      x: originX + distance * Math.cos(angleRad),
      y: originY + distance * Math.sin(angleRad),
    };
  };

  // Polygon points for radar boundary connecting the 6 dimensions
  const polygonPoints = dimensions
    .map((dim) => {
      const scaledRadius = 45 + (dim.score / 100) * 70;
      const coords = getCoordinates(centerX, centerY, dim.angle, scaledRadius);
      return `${coords.x},${coords.y}`;
    })
    .join(' ');

  return (
    <div className="relative w-full h-[460px] bg-[#070A0F] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center p-4">
      {/* Background Radial Rings */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 720 560">
        {/* Concentric Grid Rings */}
        {[60, 115, 175, 230].map((r, i) => (
          <circle
            key={i}
            cx={centerX}
            cy={centerY}
            r={r}
            fill="none"
            stroke="rgba(255, 255, 255, 0.04)"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        ))}

        {/* Axis Spokes from Center to Outer Edge */}
        {dimensions.map((dim, i) => {
          const outer = getCoordinates(centerX, centerY, dim.angle, 230);
          return (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={outer.x}
              y2={outer.y}
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth={1}
            />
          );
        })}

        {/* Radar Polygon Shape */}
        <polygon
          points={polygonPoints}
          fill="url(#radarGradient)"
          fillOpacity={0.25}
          stroke="#7C3AED"
          strokeWidth={1.8}
          strokeLinejoin="round"
        />

        {/* Gradient Defs */}
        <defs>
          <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.7} />
            <stop offset="60%" stopColor="#06B6D4" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
          </radialGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Dimension Connecting Vector Lines */}
        {dimensions.map((dim) => {
          const dimCoords = getCoordinates(centerX, centerY, dim.angle, dim.radius);
          return (
            <g key={dim.name}>
              {/* Line from center to dim hub */}
              <line
                x1={centerX}
                y1={centerY}
                x2={dimCoords.x}
                y2={dimCoords.y}
                stroke={dim.color}
                strokeWidth={1.2}
                strokeOpacity={0.4}
              />

              {/* Vector Lines from Dimension Hub to its individual Tech Nodes */}
              {dim.techs.map((tech) => {
                const techCoords = getCoordinates(dimCoords.x, dimCoords.y, tech.angle, tech.distance);
                return (
                  <line
                    key={tech.name}
                    x1={dimCoords.x}
                    y1={dimCoords.y}
                    x2={techCoords.x}
                    y2={techCoords.y}
                    stroke={dim.color}
                    strokeWidth={0.8}
                    strokeDasharray="2 2"
                    strokeOpacity={0.45}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>

      {/* Interactive HTML Node Layers */}
      <div className="absolute inset-0 w-full h-full pointer-events-auto">
        <svg className="w-full h-full" viewBox="0 0 720 560">
          {/* 1. Central Core Node */}
          <g
            className="cursor-pointer group"
            onMouseEnter={() =>
              setHoveredNode({ name: 'Skill DNA Core', score: 94, category: 'Composite Developer Score' })
            }
            onMouseLeave={() => setHoveredNode(null)}
          >
            <circle
              cx={centerX}
              cy={centerY}
              r={26}
              fill="#0D121A"
              stroke="#7C3AED"
              strokeWidth={2.5}
              filter="url(#glow)"
            />
            <circle cx={centerX} cy={centerY} r={18} fill="#7C3AED" fillOpacity={0.2} />
            <text
              x={centerX}
              y={centerY - 2}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="9"
              fontWeight="bold"
              fontFamily="monospace"
            >
              SKILL
            </text>
            <text
              x={centerX}
              y={centerY + 9}
              textAnchor="middle"
              fill="#A78BFA"
              fontSize="8"
              fontWeight="bold"
              fontFamily="monospace"
            >
              DNA
            </text>
          </g>

          {/* 2. Dimension Hub Nodes */}
          {dimensions.map((dim) => {
            const coords = getCoordinates(centerX, centerY, dim.angle, dim.radius);
            return (
              <g
                key={dim.name}
                className="cursor-pointer group"
                onMouseEnter={() =>
                  setHoveredNode({ name: dim.name, score: dim.score, category: 'Primary Dimension' })
                }
                onMouseLeave={() => setHoveredNode(null)}
              >
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r={16}
                  fill="#0D121A"
                  stroke={dim.color}
                  strokeWidth={2}
                />
                <circle cx={coords.x} cy={coords.y} r={10} fill={dim.color} fillOpacity={0.25} />
                <text
                  x={coords.x}
                  y={coords.y + 3}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="8"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {dim.score}
                </text>

                {/* Dimension Label */}
                <text
                  x={coords.x}
                  y={coords.y + (dim.angle > 0 && dim.angle < 180 ? 25 : -20)}
                  textAnchor="middle"
                  fill="#F8FAFC"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {dim.name}
                </text>
              </g>
            );
          })}

          {/* 3. Individual Technology Satellite Nodes */}
          {dimensions.map((dim) => {
            const dimCoords = getCoordinates(centerX, centerY, dim.angle, dim.radius);
            return dim.techs.map((tech) => {
              const coords = getCoordinates(dimCoords.x, dimCoords.y, tech.angle, tech.distance);
              return (
                <g
                  key={tech.name}
                  className="cursor-pointer group"
                  onMouseEnter={() =>
                    setHoveredNode({ name: tech.name, score: tech.level, category: dim.name })
                  }
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={6}
                    fill="#111722"
                    stroke={dim.color}
                    strokeWidth={1.5}
                  />
                  <circle cx={coords.x} cy={coords.y} r={3} fill={dim.color} />

                  {/* Satellite Label */}
                  <text
                    x={coords.x}
                    y={coords.y + 13}
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="8.5"
                    fontFamily="monospace"
                    className="group-hover:fill-white transition-colors"
                  >
                    {tech.name}
                  </text>
                </g>
              );
            });
          })}
        </svg>
      </div>

      {/* Dynamic Hover Tooltip Badge */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-lg bg-[#0D121A]/95 border border-white/[0.12] shadow-xl backdrop-blur-md text-xs space-y-1 min-w-[140px]"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#F8FAFC]">{hoveredNode.name}</span>
              <span className="font-mono text-[#10B981] font-bold">{hoveredNode.score}/100</span>
            </div>
            <span className="text-[10px] text-[#64748B] block">{hoveredNode.category}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
