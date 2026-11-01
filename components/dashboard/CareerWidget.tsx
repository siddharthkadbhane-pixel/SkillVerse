'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  Target,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Circle,
  AlertCircle,
  TrendingUp,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { CareerOverviewData } from '@/types/career';

interface CareerWidgetProps {
  initialData?: CareerOverviewData | null;
}

export default function CareerWidget({ initialData }: CareerWidgetProps) {
  const [overview, setOverview] = useState<CareerOverviewData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    let isSubscribed = true;
    if (!initialData) {
      fetch('/api/career')
        .then((res) => res.json())
        .then((json) => {
          if (isSubscribed && json.success && json.data) {
            setOverview(json.data);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isSubscribed) setLoading(false);
        });
    }
    return () => {
      isSubscribed = false;
    };
  }, [initialData]);

  const toggleTask = async (taskId: string, currentStatus: string) => {
    if (!overview) return;
    const isCompleted = currentStatus === 'completed';
    const newStatus = isCompleted ? 'todo' : 'completed';

    // Optimistic update
    setOverview({
      ...overview,
      tasks: overview.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus as any } : t)),
      progress: {
        ...overview.progress,
        completedTasksCount: overview.progress.completedTasksCount + (isCompleted ? -1 : 1),
      },
    });

    try {
      await fetch(`/api/career/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !isCompleted }),
      });
    } catch {}
  };

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'Ready':
        return 'text-[#14B8A6] bg-[#14B8A6]/10 border-[#14B8A6]/30';
      case 'Developing':
        return 'text-[#6366F1] bg-[#6366F1]/10 border-[#6366F1]/30';
      case 'Emerging':
        return 'text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/30';
      default:
        return 'text-slate-500 dark:text-[#94A3B8] bg-slate-100 dark:bg-[#94A3B8]/15 border-slate-200 dark:border-[#94A3B8]/30';
    }
  };

  const activeRoleFit = overview?.activeRoleFit;
  const targetRoleName = overview?.goal?.targetRoleName || 'Backend Developer';
  const readinessTier = activeRoleFit?.readinessTier || 'Developing';
  const fitScore = activeRoleFit?.fitScore || 78;
  const topGaps = overview?.topGaps || [];
  const dailyTasks = (overview?.tasks || []).filter((t) => t.cadence === 'daily').slice(0, 2);

  return (
    <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.12] rounded-xl p-4 sm:p-5 shadow-sm transition-all flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center">
              <Compass className="w-3.5 h-3.5 text-[#6366F1]" />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
                Career & Learning Intelligence
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-[#64748B]">Evidence-guided progression</p>
            </div>
          </div>

          <Link
            href="/career"
            className="flex items-center gap-1 text-[11px] font-semibold text-[#6366F1] dark:text-[#93C5FD] hover:underline transition-colors"
          >
            <span>Full Hub</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Target Goal & Readiness Badge */}
        <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.04] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono text-slate-500 dark:text-[#94A3B8]">
              <Target className="w-3.5 h-3.5 text-[#6366F1]" />
              <span>Target Role</span>
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC] truncate mt-0.5">{targetRoleName}</h4>
          </div>

          <div className="text-right shrink-0">
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border inline-block ${getTierColor(
                readinessTier
              )}`}
            >
              {readinessTier} ({fitScore}%)
            </span>
            <p className="text-[9px] text-slate-400 dark:text-[#64748B] mt-0.5">Based on repo AST</p>
          </div>
        </div>

        {/* Priority Skill Gap */}
        {topGaps.length > 0 && (
          <div className="mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-[#111722]/60 border border-slate-200 dark:border-white/[0.04] space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-[#94A3B8] font-medium">Priority Growth Area:</span>
              <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">{topGaps[0].capabilityName}</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-[#64748B] line-clamp-1">{topGaps[0].whyExplanation}</p>
          </div>
        )}

        {/* Daily Action Plan */}
        {dailyTasks.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] uppercase font-mono text-slate-400 dark:text-[#64748B]">
              <span>Today&apos;s Focus</span>
              <span>
                {dailyTasks.filter((t) => t.status === 'completed').length}/{dailyTasks.length} Done
              </span>
            </div>
            <div className="space-y-1">
              {dailyTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id, task.status)}
                  className="w-full text-left p-2 rounded bg-slate-50 dark:bg-[#111722] hover:bg-slate-100 dark:hover:bg-[#151D2A] border border-slate-200 dark:border-white/[0.03] hover:border-slate-300 dark:hover:border-white/[0.08] transition-all flex items-start gap-2 group"
                >
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#14B8A6] shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-400 dark:text-[#64748B] group-hover:text-[#6366F1] shrink-0 mt-0.5" />
                  )}
                  <span
                    className={`text-[11px] leading-tight truncate flex-1 ${
                      task.status === 'completed' ? 'text-slate-400 dark:text-[#64748B] line-through' : 'text-slate-800 dark:text-[#E2E8F0]'
                    }`}
                  >
                    {task.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Link */}
      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/[0.04]">
        <Link
          href="/career"
          className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg bg-[#6366F1]/10 hover:bg-[#6366F1]/20 text-[#6366F1] dark:text-[#C4B5FD] border border-[#6366F1]/30 hover:border-[#6366F1]/50 transition-all"
        >
          <span>View 4-Stage Roadmap & Recommendations</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
