'use client';

import React from 'react';
import { Compass, Target, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { CareerGoal, RoleFitAnalysis } from '@/types/career';

interface DCCCareerDirectionProps {
  goal?: CareerGoal | null;
  roleFit?: RoleFitAnalysis | null;
  isOwner?: boolean;
}

export default function DCCCareerDirection({ goal, roleFit, isOwner = false }: DCCCareerDirectionProps) {
  // If not public and not owner, keep private
  if (!goal?.isPublic && !isOwner) {
    return null;
  }

  const targetRole = goal?.targetRoleName || 'Backend Developer';
  const milestoneIntent = goal?.milestoneIntent || 'Prepare for First Job';
  const focusSkills = goal?.focusSkills || ['Node.js', 'PostgreSQL', 'Docker'];
  const readinessTier = roleFit?.readinessTier || 'Developing';

  return (
    <div className="p-4 rounded-xl bg-[#0D121A] border border-white/[0.08] relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-[#7C3AED]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center">
            <Compass className="w-4 h-4 text-[#A78BFA]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#F8FAFC]">
                Career Direction & Focus
              </h3>
              {!goal?.isPublic && isOwner && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Private (Owner Only)
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#64748B]">
              Aspirational target • Separate from verified capability evidence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#7C3AED]/15 text-[#C4B5FD] border border-[#7C3AED]/30 font-semibold">
            {targetRole}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-[#94A3B8] border border-white/[0.08]">
            {readinessTier}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
        <div className="p-2.5 rounded-lg bg-[#111722] border border-white/[0.03]">
          <span className="text-[10px] uppercase font-mono text-[#64748B]">Target Milestone</span>
          <p className="text-xs font-semibold text-[#E2E8F0] mt-0.5">{milestoneIntent}</p>
        </div>

        <div className="p-2.5 rounded-lg bg-[#111722] border border-white/[0.03]">
          <span className="text-[10px] uppercase font-mono text-[#64748B]">Active Learning Focus</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {focusSkills.slice(0, 3).map((skill, i) => (
              <span
                key={i}
                className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#7C3AED]/10 text-[#C4B5FD] border border-[#7C3AED]/20"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#111722] border border-white/[0.03]">
          <span className="text-[10px] uppercase font-mono text-[#64748B]">Target Timeframe</span>
          <p className="text-xs font-semibold text-[#E2E8F0] mt-0.5">{goal?.targetTimeframe || '3 Months'}</p>
        </div>
      </div>
    </div>
  );
}
