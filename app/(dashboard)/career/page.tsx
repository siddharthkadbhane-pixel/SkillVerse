'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import {
  Compass,
  Target,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Layers,
  ShieldCheck,
  AlertCircle,
  Briefcase,
  Trophy,
  Code2,
  FolderGit2,
  Calendar,
  Lock,
  Globe,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sliders,
  Check,
} from 'lucide-react';
import {
  CareerOverviewData,
  CareerRoleId,
  RoleFitAnalysis,
  CareerGoal,
  SkillGapItem,
  RoadmapStage,
} from '@/types/career';
import { CAREER_ROLE_TAXONOMY, CareerTaxonomyService } from '@/services/career/taxonomy';
import { DUMMY_USERS } from '@/lib/dummyData';

export default function CareerIntelligencePage() {
  const [data, setData] = useState<CareerOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roadmap' | 'roles' | 'gaps' | 'settings'>('roadmap');
  const [selectedRoleDetail, setSelectedRoleDetail] = useState<RoleFitAnalysis | null>(null);
  const [savingGoal, setSavingGoal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State for Goal Settings
  const [selectedRole, setSelectedRole] = useState<CareerRoleId>('backend_developer');
  const [customGoal, setCustomGoal] = useState('');
  const [milestoneIntent, setMilestoneIntent] = useState<string>('Prepare for First Job');
  const [timeframe, setTimeframe] = useState<string>('3 Months');
  const [targetLevel, setTargetLevel] = useState<string>('Proficient');
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    fetchCareerData();
  }, []);

  const fetchCareerData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/career');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        if (json.data.goal) {
          setSelectedRole(json.data.goal.targetRoleId);
          setCustomGoal(json.data.goal.customGoalTitle || '');
          setMilestoneIntent(json.data.goal.milestoneIntent);
          setTimeframe(json.data.goal.targetTimeframe);
          setTargetLevel(json.data.goal.targetCapabilityLevel);
          setIsPublic(json.data.goal.isPublic);
        }
        if (json.data.activeRoleFit) {
          setSelectedRoleDetail(json.data.activeRoleFit);
        }
      }
    } catch (err) {
      console.error('Failed to fetch career intelligence', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    if (!data) return;
    const isCompleted = currentStatus === 'completed';
    const newStatus = isCompleted ? 'todo' : 'completed';

    // Optimistic UI update
    setData({
      ...data,
      tasks: data.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus as any } : t)),
      progress: {
        ...data.progress,
        completedTasksCount: data.progress.completedTasksCount + (isCompleted ? -1 : 1),
      },
    });

    try {
      await fetch(`/api/career/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !isCompleted }),
      });
    } catch (err) {
      console.error('Failed to toggle task completion', err);
    }
  };

  const handleSaveGoal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingGoal(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/career/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRoleId: selectedRole,
          customGoalTitle: customGoal.trim() || undefined,
          milestoneIntent,
          targetTimeframe: timeframe,
          targetCapabilityLevel: targetLevel,
          isPublic,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
        // Refresh full overview to sync roadmap and role fits
        await fetchCareerData();
        setActiveTab('roadmap');
      }
    } catch (err) {
      console.error('Failed to save career goal', err);
    } finally {
      setSavingGoal(false);
    }
  };

  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case 'Ready':
        return 'text-[#10B981] bg-[#10B981]/15 border-[#10B981]/30';
      case 'Developing':
        return 'text-[#8B5CF6] bg-[#8B5CF6]/15 border-[#8B5CF6]/30';
      case 'Emerging':
        return 'text-[#F59E0B] bg-[#F59E0B]/15 border-[#F59E0B]/30';
      default:
        return 'text-[#94A3B8] bg-[#94A3B8]/15 border-[#94A3B8]/30';
    }
  };

  const allRoles = CareerTaxonomyService.getAllRoles();
  const activeRoleFit = data?.activeRoleFit;
  const roadmap = data?.roadmap;
  const tasks = data?.tasks || [];
  const topGaps = data?.topGaps || [];
  const recommendations = data?.recommendations;
  const progress = data?.progress;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar user={DUMMY_USERS[0]} trustScore={{ overallScore: 940 }} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={DUMMY_USERS[0]} breadcrumb="Career & Learning Intelligence" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-[1600px] w-full mx-auto space-y-6">
          {/* TOP HERO BANNER */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#7C3AED]/20 via-[#0D121A] to-[#0D121A] border border-white/[0.08] p-5 sm:p-6">
            <div className="absolute -right-10 -top-10 w-60 h-60 bg-[#7C3AED]/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#7C3AED]/25 text-[#C4B5FD] border border-[#7C3AED]/40 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#A78BFA]" />
                    AI Career Intelligence
                  </span>
                  <span className="text-[10px] font-mono text-[#64748B]">• Evidence-grounded</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F8FAFC]">
                  Personalized Engineering Roadmap & Role Fit
                </h1>
                <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                  Understand your demonstrated capabilities, discover matching engineering roles, identify genuine skill
                  gaps, and follow actionable project paths to level up.
                </p>
              </div>

              {/* KPI Snapshot Pills */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="p-3 rounded-xl bg-[#111722]/80 border border-white/[0.06] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center">
                    <Target className="w-4 h-4 text-[#A78BFA]" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#64748B]">Active Goal</span>
                    <p className="text-xs font-bold text-[#F8FAFC]">{data?.goal?.targetRoleName || 'Backend Dev'}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#111722]/80 border border-white/[0.06] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-[#34D399]" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#64748B]">Readiness</span>
                    <p className="text-xs font-bold text-[#10B981]">
                      {activeRoleFit?.readinessTier || 'Developing'} ({activeRoleFit?.fitScore || 78}%)
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#111722]/80 border border-white/[0.06] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#64748B]">Plan Tasks</span>
                    <p className="text-xs font-bold text-[#F8FAFC]">
                      {progress?.completedTasksCount || 0}/{progress?.totalTasksCount || 5} Done
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* TAB NAVIGATION BAR */}
            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/[0.06] overflow-x-auto pb-1">
              {[
                { id: 'roadmap', label: 'Roadmap & Action Plan', icon: Compass },
                { id: 'roles', label: 'Role Fit Matrix', icon: Layers },
                { id: 'gaps', label: 'Capability Gaps & Recs', icon: AlertCircle },
                { id: 'settings', label: 'Career Goal Settings', icon: Sliders },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/20'
                        : 'bg-[#111722] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#151D2A] border border-white/[0.04]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: ROADMAP & ACTION PLAN */}
          {activeTab === 'roadmap' && (
            <div className="space-y-6">
              {/* Guidance Disclaimer Alert */}
              <div className="p-3.5 rounded-xl bg-[#111722] border border-[#7C3AED]/20 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-[#A78BFA] shrink-0 mt-0.5" />
                <div className="text-xs text-[#94A3B8] leading-relaxed">
                  <strong className="text-white">Authoritative Evidence Notice:</strong> Checking off learning tasks
                  records your personal progress and learning cadence. In accordance with SkillVerse core tenets,
                  verified DCC capability ratings and level badges only increase through genuine repository AST audits
                  and cryptographic proofs.
                </div>
              </div>

              {/* 2-Column Desktop Grid: Left = 4-Stage Roadmap, Right = Daily/Weekly/Monthly Tasks */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT COLUMN: 4-Stage Progression Plan */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-sm uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
                        <span>4-Stage Learning Roadmap</span>
                        <span className="text-xs font-normal text-[#94A3B8]">({roadmap?.title})</span>
                      </h2>
                      <p className="text-xs text-[#64748B] mt-0.5">{roadmap?.overviewSummary}</p>
                    </div>

                    <button
                      onClick={() => fetchCareerData()}
                      className="p-2 rounded-lg bg-[#111722] hover:bg-[#151D2A] border border-white/[0.06] text-[#94A3B8] hover:text-white transition-all text-xs flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(roadmap?.stages || []).map((stage, idx) => (
                      <div
                        key={stage.stageNumber}
                        className={`rounded-xl border p-4 sm:p-5 transition-all ${
                          stage.status === 'in_progress'
                            ? 'bg-[#0D121A] border-[#7C3AED]/40 shadow-lg shadow-[#7C3AED]/5'
                            : 'bg-[#0D121A] border-white/[0.06] opacity-90'
                        }`}
                      >
                        {/* Stage Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                                stage.status === 'in_progress'
                                  ? 'bg-[#7C3AED] text-white'
                                  : 'bg-white/[0.08] text-[#94A3B8]'
                              }`}
                            >
                              {stage.stageNumber}
                            </span>
                            <h3 className="font-bold text-sm text-[#F8FAFC]">{stage.stageTitle}</h3>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                                stage.status === 'in_progress'
                                  ? 'bg-[#7C3AED]/15 text-[#C4B5FD] border-[#7C3AED]/30'
                                  : stage.status === 'completed'
                                  ? 'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/30'
                                  : 'bg-white/[0.04] text-[#64748B] border-white/[0.06]'
                              }`}
                            >
                              {stage.status === 'in_progress' ? 'Current Focus' : stage.status}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-[#94A3B8] mt-3 leading-relaxed">{stage.objective}</p>

                        {/* Focus Capabilities & Target Skills */}
                        <div className="mt-3.5 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] uppercase font-mono text-[#64748B]">Focus Stack:</span>
                          {stage.targetSkills.map((skill, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#111722] text-[#E2E8F0] border border-white/[0.06]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>

                        {/* Suggested Activities */}
                        <div className="mt-3 space-y-1.5">
                          <span className="text-[10px] uppercase font-mono text-[#64748B]">Actionable Activities:</span>
                          <ul className="space-y-1">
                            {stage.suggestedActivities.map((act, i) => (
                              <li key={i} className="text-xs text-[#CBD5E1] flex items-start gap-2">
                                <span className="text-[#A78BFA] mt-0.5">•</span>
                                <span>{act}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Recommended Project Box */}
                        {stage.recommendedProject && (
                          <div className="mt-4 p-3.5 rounded-lg bg-[#111722] border border-white/[0.06] space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-[#F8FAFC]">
                                <FolderGit2 className="w-3.5 h-3.5 text-[#A78BFA]" />
                                <span>Suggested Project: {stage.recommendedProject.title}</span>
                              </div>
                              <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.2 rounded border border-[#10B981]/20">
                                Proof-of-Skill Build
                              </span>
                            </div>

                            <p className="text-[11px] text-[#94A3B8]">{stage.recommendedProject.description}</p>

                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-[10px] text-[#64748B]">Stack:</span>
                              {stage.recommendedProject.recommendedStack.map((st, i) => (
                                <span
                                  key={i}
                                  className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.05] text-[#CBD5E1]"
                                >
                                  {st}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* RIGHT COLUMN: Cadenced Tasks Tracker & AI Summary */}
                <div className="lg:col-span-4 space-y-5">
                  {/* Task Tracker Box */}
                  <div className="bg-[#0D121A] border border-white/[0.08] rounded-xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                      <div>
                        <h3 className="font-bold text-xs uppercase tracking-wider text-[#F8FAFC]">
                          Action Plan & Cadence
                        </h3>
                        <p className="text-[11px] text-[#64748B]">Daily, weekly, and monthly targets</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#A78BFA] bg-[#7C3AED]/15 px-2 py-0.5 rounded border border-[#7C3AED]/30">
                        {progress?.streakDays || 4}d Streak 🔥
                      </span>
                    </div>

                    {/* Cadence Tabs or Grouped Sections */}
                    {['daily', 'weekly', 'monthly'].map((cadence) => {
                      const groupTasks = tasks.filter((t) => t.cadence === cadence);
                      if (groupTasks.length === 0) return null;

                      return (
                        <div key={cadence} className="space-y-2">
                          <div className="flex items-center justify-between text-[10px] uppercase font-mono text-[#94A3B8]">
                            <span className="font-bold text-[#E2E8F0]">{cadence} Tasks</span>
                            <span>
                              {groupTasks.filter((t) => t.status === 'completed').length}/{groupTasks.length} Done
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {groupTasks.map((task) => (
                              <button
                                key={task.id}
                                onClick={() => handleToggleTask(task.id, task.status)}
                                className="w-full text-left p-2.5 rounded-lg bg-[#111722] hover:bg-[#151D2A] border border-white/[0.03] hover:border-white/[0.08] transition-all flex items-start gap-2.5 group"
                              >
                                {task.status === 'completed' ? (
                                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                                ) : (
                                  <Circle className="w-4 h-4 text-[#64748B] group-hover:text-[#A78BFA] shrink-0 mt-0.5" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <h4
                                    className={`text-xs leading-snug font-medium ${
                                      task.status === 'completed'
                                        ? 'text-[#64748B] line-through'
                                        : 'text-[#F1F5F9]'
                                    }`}
                                  >
                                    {task.title}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-[#64748B]">
                                    {task.targetCapability && <span>{task.targetCapability}</span>}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* AI Explainability Box */}
                  {recommendations?.aiGuidance && (
                    <div className="bg-gradient-to-br from-[#7C3AED]/15 via-[#0D121A] to-[#0D121A] border border-[#7C3AED]/30 rounded-xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-center gap-1.5 pb-2 border-b border-white/[0.06]">
                        <Sparkles className="w-4 h-4 text-[#A78BFA]" />
                        <h3 className="font-bold text-xs uppercase tracking-wider text-[#F8FAFC]">
                          AI Career Intelligence
                        </h3>
                      </div>
                      <p className="text-xs text-[#CBD5E1] leading-relaxed">
                        {recommendations.aiGuidance.careerDirectionExplanation}
                      </p>
                      <div className="p-2.5 rounded-lg bg-[#111722]/80 border border-white/[0.04] space-y-1">
                        <span className="text-[10px] uppercase font-mono text-[#A78BFA]">Recommended Strategy:</span>
                        <p className="text-xs text-[#94A3B8]">{recommendations.aiGuidance.growthStrategy}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ROLE FIT MATRIX */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-sm uppercase tracking-wider text-[#F8FAFC]">
                    Engineering Role Fit Matrix
                  </h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Deterministic comparison of your verified repository capability metrics against 10 core engineering roles.
                  </p>
                </div>
              </div>

              {/* 10 Roles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(data?.allRoleFits || []).map((roleFit) => {
                  const isCurrentGoal = roleFit.roleId === data?.goal?.targetRoleId;
                  return (
                    <div
                      key={roleFit.roleId}
                      className={`rounded-xl border p-4 sm:p-5 flex flex-col justify-between transition-all ${
                        isCurrentGoal
                          ? 'bg-[#0D121A] border-[#7C3AED]/50 shadow-md shadow-[#7C3AED]/10'
                          : 'bg-[#0D121A] border-white/[0.06] hover:border-white/[0.12]'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-sm text-[#F8FAFC]">{roleFit.roleName}</h3>
                              {isCurrentGoal && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#7C3AED]/20 text-[#C4B5FD] border border-[#7C3AED]/40">
                                  Current Goal
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-[#64748B]">{roleFit.category}</span>
                          </div>

                          <span
                            className={`text-xs font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${getTierBadge(
                              roleFit.readinessTier
                            )}`}
                          >
                            {roleFit.readinessTier} ({roleFit.fitScore}%)
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 rounded-full bg-[#111722] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              roleFit.fitScore >= 85
                                ? 'bg-[#10B981]'
                                : roleFit.fitScore >= 65
                                ? 'bg-[#8B5CF6]'
                                : 'bg-[#F59E0B]'
                            }`}
                            style={{ width: `${roleFit.fitScore}%` }}
                          />
                        </div>

                        {/* Summary statement */}
                        <p className="text-[11px] text-[#94A3B8] leading-relaxed line-clamp-2">{roleFit.summary}</p>

                        {/* Strengths & Gaps pill count */}
                        <div className="flex items-center gap-3 text-[10px] font-mono pt-1 border-t border-white/[0.04]">
                          <span className="text-[#34D399]">{roleFit.strengths.length} Strengths</span>
                          <span className="text-[#F87171]">{roleFit.gaps.length} Gaps</span>
                          <span className="text-[#94A3B8]">{roleFit.missingSkills.length} Missing</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-4 mt-3 border-t border-white/[0.04] flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedRoleDetail(roleFit)}
                          className="text-xs font-semibold text-[#A78BFA] hover:text-[#C4B5FD] flex items-center gap-1 transition-colors"
                        >
                          <span>Deep Dive Fit</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>

                        {!isCurrentGoal && (
                          <button
                            onClick={() => {
                              setSelectedRole(roleFit.roleId);
                              handleSaveGoal();
                            }}
                            className="text-[11px] font-medium px-2.5 py-1 rounded bg-[#111722] hover:bg-[#151D2A] text-[#CBD5E1] border border-white/[0.06] transition-all"
                          >
                            Set Goal
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Role Detail Modal / Panel */}
              {selectedRoleDetail && (
                <div className="p-5 rounded-2xl bg-[#0D121A] border border-[#7C3AED]/30 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-[#F8FAFC]">{selectedRoleDetail.roleName} Analysis</h3>
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${getTierBadge(
                            selectedRoleDetail.readinessTier
                          )}`}
                        >
                          {selectedRoleDetail.readinessTier} ({selectedRoleDetail.fitScore}%)
                        </span>
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{selectedRoleDetail.summary}</p>
                    </div>

                    <button
                      onClick={() => setSelectedRoleDetail(null)}
                      className="text-xs text-[#64748B] hover:text-white"
                    >
                      ✕ Close
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase font-mono text-[#34D399]">
                        Verified Strengths ({selectedRoleDetail.strengths.length})
                      </span>
                      <div className="space-y-2">
                        {selectedRoleDetail.strengths.map((str, i) => (
                          <div key={i} className="p-3 rounded-lg bg-[#111722] border border-white/[0.04] space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-white">{str.capabilityName}</span>
                              <span className="font-mono text-[10px] text-[#34D399]">{str.level}</span>
                            </div>
                            <p className="text-[11px] text-[#94A3B8]">{str.whyExplanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Gaps */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase font-mono text-[#F87171]">
                        Identified Gaps ({selectedRoleDetail.gaps.length})
                      </span>
                      <div className="space-y-2">
                        {selectedRoleDetail.gaps.map((gap, i) => (
                          <div key={i} className="p-3 rounded-lg bg-[#111722] border border-white/[0.04] space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-white">{gap.capabilityName}</span>
                              <span className="font-mono text-[10px] text-[#F87171]">
                                {gap.currentLevel} &rarr; {gap.targetLevel}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#94A3B8]">{gap.whyExplanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#111722] border border-white/[0.04] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-[#A78BFA]">Recommended Next Action:</span>
                      <p className="text-xs text-[#E2E8F0] mt-0.5">{selectedRoleDetail.recommendedNextStep}</p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedRole(selectedRoleDetail.roleId);
                        handleSaveGoal();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-xs font-semibold shrink-0"
                    >
                      Set As Active Goal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CAPABILITY GAPS & RECOMMENDATIONS */}
          {activeTab === 'gaps' && (
            <div className="space-y-6">
              {/* Top Gaps Breakdown */}
              <div className="space-y-3">
                <h2 className="font-bold text-sm uppercase tracking-wider text-[#F8FAFC]">
                  Evidence-Supported Capability Gaps ({data?.goal?.targetRoleName || 'Target Role'})
                </h2>
                <p className="text-xs text-[#64748B]">
                  Specific areas where demonstrated repository code depth is below the target role criteria.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topGaps.map((gap) => (
                    <div
                      key={gap.id}
                      className="p-4 rounded-xl bg-[#0D121A] border border-white/[0.08] hover:border-white/[0.12] space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-[#F8FAFC]">{gap.capabilityName}</h3>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                              gap.priority === 'Critical Gap'
                                ? 'bg-red-500/15 text-red-400 border-red-500/30'
                                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {gap.priority}
                          </span>
                        </div>

                        <span className="text-xs font-mono text-[#94A3B8]">
                          {gap.currentLevel} &rarr; <strong className="text-white">{gap.targetLevel}</strong>
                        </span>
                      </div>

                      <p className="text-xs text-[#94A3B8] leading-relaxed">{gap.whyExplanation}</p>

                      <div className="p-2.5 rounded-lg bg-[#111722] border border-white/[0.04] flex items-center justify-between text-xs">
                        <span className="text-[#64748B]">Action:</span>
                        <span className="text-[#E2E8F0] font-medium">{gap.recommendedAction}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Project Ideas */}
              {recommendations?.projects && (
                <div className="space-y-3 pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-sm uppercase tracking-wider text-[#F8FAFC] flex items-center gap-2">
                        <FolderGit2 className="w-4 h-4 text-[#A78BFA]" />
                        <span>Curated Project Recommendations</span>
                      </h2>
                      <p className="text-xs text-[#64748B]">
                        Tailored build specifications created to resolve your verified capability gaps.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recommendations.projects.map((proj) => (
                      <div
                        key={proj.id}
                        className="p-4 rounded-xl bg-[#0D121A] border border-white/[0.08] hover:border-[#7C3AED]/40 flex flex-col justify-between space-y-3 transition-all"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#7C3AED]/15 text-[#C4B5FD] border border-[#7C3AED]/30">
                              {proj.difficulty}
                            </span>
                            <span className="text-[10px] font-mono text-[#64748B]">~{proj.estimatedHours} hrs</span>
                          </div>

                          <h3 className="font-bold text-sm text-[#F8FAFC] leading-snug">{proj.title}</h3>
                          <p className="text-xs text-[#94A3B8] line-clamp-3">{proj.description}</p>

                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] uppercase font-mono text-[#64748B]">Key Highlights:</span>
                            {proj.architectureHighlights.slice(0, 2).map((h, i) => (
                              <div key={i} className="text-[11px] text-[#CBD5E1] flex items-center gap-1.5">
                                <span className="text-[#A78BFA]">•</span>
                                <span className="truncate">{h}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/[0.04]">
                          <div className="flex flex-wrap gap-1">
                            {proj.techStack.map((tech, i) => (
                              <span
                                key={i}
                                className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#111722] text-[#94A3B8]"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Linked Challenges & Opportunities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/[0.06]">
                {/* Matching Public Challenges */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-[#F8FAFC] flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>Matching Verification Challenges</span>
                    </h3>
                    <a href="/challenges" className="text-[11px] text-[#A78BFA] hover:underline font-semibold">
                      View All &rarr;
                    </a>
                  </div>

                  <div className="space-y-2">
                    {(recommendations?.challenges || []).map((ch, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-[#0D121A] border border-white/[0.06] hover:border-white/[0.12] flex items-center justify-between gap-3"
                      >
                        <div>
                          <h4 className="font-bold text-xs text-[#F8FAFC]">{ch.title}</h4>
                          <span className="text-[10px] font-mono text-[#64748B]">
                            {ch.organizer} • {ch.difficulty}
                          </span>
                        </div>
                        <a
                          href={`/challenges/${ch.id}`}
                          className="px-2.5 py-1 rounded bg-[#7C3AED]/20 hover:bg-[#7C3AED]/30 text-[#C4B5FD] border border-[#7C3AED]/40 text-xs font-semibold shrink-0"
                        >
                          Enter
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Matching Opportunities */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-[#F8FAFC] flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>Matched Opportunities</span>
                    </h3>
                    <a href="/jobs" className="text-[11px] text-[#A78BFA] hover:underline font-semibold">
                      View All &rarr;
                    </a>
                  </div>

                  <div className="space-y-2">
                    {(recommendations?.opportunities || []).map((opp, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-[#0D121A] border border-white/[0.06] hover:border-white/[0.12] flex items-center justify-between gap-3"
                      >
                        <div>
                          <h4 className="font-bold text-xs text-[#F8FAFC]">{opp.title}</h4>
                          <span className="text-[10px] font-mono text-[#64748B]">
                            {opp.company} • {opp.salaryRange}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/30 shrink-0">
                          {opp.matchScore}% Match
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CAREER GOAL SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-[#0D121A] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-5">
                <div>
                  <h2 className="font-bold text-base text-[#F8FAFC]">Career Goal & Focus Settings</h2>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Define your target engineering role, timeline, and privacy controls. SkillVerse dynamically adapts
                    your learning roadmap and project recommendations accordingly.
                  </p>
                </div>

                <form onSubmit={handleSaveGoal} className="space-y-4">
                  {/* Target Role Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#E2E8F0]">Target Engineering Role</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as CareerRoleId)}
                      className="w-full px-3 py-2.5 rounded-lg bg-[#111722] border border-white/[0.08] text-white text-xs font-medium focus:outline-none focus:border-[#7C3AED]"
                    >
                      {allRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name} ({role.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Milestone Intent */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#E2E8F0]">Milestone Intent</label>
                      <select
                        value={milestoneIntent}
                        onChange={(e) => setMilestoneIntent(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-[#111722] border border-white/[0.08] text-white text-xs font-medium focus:outline-none focus:border-[#7C3AED]"
                      >
                        <option value="Prepare for First Job">Prepare for First Job</option>
                        <option value="Prepare for Internship">Prepare for Internship</option>
                        <option value="Become a Specialist">Become a Specialist</option>
                        <option value="Promote to Senior Engineer">Promote to Senior Engineer</option>
                        <option value="Improve System Design">Improve System Design</option>
                        <option value="Become an Open Source Contributor">Become an Open Source Contributor</option>
                        <option value="Custom Milestone">Custom Milestone</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#E2E8F0]">Target Timeframe</label>
                      <select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg bg-[#111722] border border-white/[0.08] text-white text-xs font-medium focus:outline-none focus:border-[#7C3AED]"
                      >
                        <option value="1 Month">1 Month (Sprint)</option>
                        <option value="3 Months">3 Months (Quarterly)</option>
                        <option value="6 Months">6 Months (Semester)</option>
                        <option value="1 Year">1 Year (Annual)</option>
                      </select>
                    </div>
                  </div>

                  {/* Custom Goal Optional */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#E2E8F0]">Custom Goal Notes (Optional)</label>
                    <input
                      type="text"
                      value={customGoal}
                      onChange={(e) => setCustomGoal(e.target.value)}
                      placeholder="e.g. Master distributed caching and land a backend role"
                      className="w-full px-3 py-2.5 rounded-lg bg-[#111722] border border-white/[0.08] text-white text-xs placeholder:text-[#64748B] focus:outline-none focus:border-[#7C3AED]"
                    />
                  </div>

                  {/* Privacy Toggle */}
                  <div className="p-3.5 rounded-xl bg-[#111722] border border-white/[0.06] flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        {isPublic ? (
                          <Globe className="w-3.5 h-3.5 text-[#10B981]" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-[#94A3B8]" />
                        )}
                        <span>Display Career Direction on Public DCC</span>
                      </div>
                      <p className="text-[11px] text-[#64748B]">
                        {isPublic
                          ? 'Visible to recruiters and visitors on your public capability card.'
                          : 'Private to your account only (Default).'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsPublic(!isPublic)}
                      className={`w-11 h-6 rounded-full p-1 transition-colors ${
                        isPublic ? 'bg-[#7C3AED]' : 'bg-white/[0.10]'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          isPublic ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Submit Action */}
                  <div className="pt-3 flex items-center justify-between">
                    {saveSuccess ? (
                      <span className="text-xs text-[#10B981] font-semibold flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        <span>Career goal updated and roadmap regenerated!</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#64748B]">Roadmap updates automatically on save.</span>
                    )}

                    <button
                      type="submit"
                      disabled={savingGoal}
                      className="px-5 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-xs font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {savingGoal ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Save & Update Roadmap</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
