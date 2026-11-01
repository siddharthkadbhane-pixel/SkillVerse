'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import {
  Users,
  ArrowLeft,
  Plus,
  CheckCircle2,
  Clock,
  Github,
  FolderGit2,
  Trophy,
  ShieldCheck,
  Code2,
  Layers,
  Activity,
  UserPlus,
  Lock,
  Globe,
  ExternalLink
} from 'lucide-react';
import { TeamItem, TeamTaskItem, TaskStatus } from '@/types/team';

export default function TeamWorkspacePage() {
  const params = useParams();
  const id = params?.id as string;

  const [team, setTeam] = useState<TeamItem | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'projects' | 'contributions'>('overview');
  const [loading, setLoading] = useState(true);

  // New Task State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  // Invite Member State
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviting, setInviting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function loadTeam() {
    try {
      const res = await fetch(`/api/teams/${id}`).then(r => r.json());
      if (res.success && res.data) {
        setTeam(res.data);
      }
    } catch (err) {
      console.error('Failed to load team workspace:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadTeam();
  }, [id]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !newTaskTitle.trim()) return;
    setAddingTask(true);
    try {
      const res = await fetch(`/api/teams/${team.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle }),
      }).then(r => r.json());

      if (res.success && res.task) {
        setTeam(prev => prev ? { ...prev, tasks: [res.task, ...(prev.tasks || [])] } : null);
        setNewTaskTitle('');
      }
    } catch (err) {
      console.error('Failed to add task:', err);
    } finally {
      setAddingTask(false);
    }
  };

  const handleToggleTaskStatus = async (task: TeamTaskItem) => {
    if (!team) return;
    const nextStatus: TaskStatus = task.status === 'completed' ? 'todo' : 'completed';
    setTeam(prev => prev ? {
      ...prev,
      tasks: (prev.tasks || []).map(t => t.id === task.id ? { ...t, status: nextStatus } : t),
    } : null);

    try {
      await fetch(`/api/teams/${team.id}/tasks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, status: nextStatus }),
      });
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !inviteUserId) return;
    setInviting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/teams/${team.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteeUserId: inviteUserId }),
      }).then(r => r.json());

      if (res.success) {
        setFeedback('Teammate added to the workspace!');
        loadTeam();
      } else {
        setFeedback(res.error || 'Failed to invite user.');
      }
    } catch (err) {
      setFeedback('Error inviting user.');
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-canvas text-primary">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-xs text-slate-500 dark:text-[#64748B]">
          Loading team workspace...
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex h-screen bg-canvas text-primary">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Team Workspace Not Found</h3>
          <Link href="/teams" className="text-xs text-sky-600 dark:text-[#38BDF8] underline">
            Return to Teams
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-canvas text-primary">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-6 max-w-[1400px] w-full mx-auto">
          <div>
            <Link
              href="/teams"
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Teams</span>
            </Link>
          </div>

          {/* Team Banner Header */}
          <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] p-6 sm:p-7 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
            <div className="flex items-start gap-4">
              <img
                src={team.avatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80'}
                alt={team.name}
                className="w-16 h-16 rounded-2xl border border-slate-200 dark:border-white/[0.1] object-cover shrink-0"
              />
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {team.name}
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-50 dark:bg-[#111722] text-sky-600 dark:text-[#38BDF8] border border-sky-500/20 dark:border-[#38BDF8]/20 flex items-center gap-1">
                    {team.visibility === 'public' ? <Globe className="w-3 h-3 text-[#10B981]" /> : <Lock className="w-3 h-3 text-[#F59E0B]" />}
                    <span className="capitalize">{team.visibility}</span>
                  </span>
                  {team.isMember && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/25">
                      ✓ Joined ({team.userRole})
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-[#94A3B8] max-w-2xl">
                  {team.description}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {team.skills.map(sk => (
                    <span
                      key={sk}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#070A0F] border border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-[#E2E8F0]"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-4 shrink-0 text-right">
              <div>
                <span className="text-lg font-bold font-mono text-slate-900 dark:text-white block">
                  {team.membersCount}
                </span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-[#64748B]">
                  Active Members
                </span>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-white/[0.08]" />
              <div>
                <span className="text-lg font-bold font-mono text-sky-600 dark:text-[#38BDF8] block">
                  {team.projectsCount}
                </span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-[#64748B]">
                  Linked Repos
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/[0.08] pb-1 text-xs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-t-xl font-mono transition-colors ${
                activeTab === 'overview'
                  ? 'bg-slate-100 dark:bg-[#111722] text-sky-600 dark:text-[#38BDF8] border-b-2 border-sky-600 dark:border-[#38BDF8] font-bold'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Overview & Members
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 rounded-t-xl font-mono transition-colors ${
                activeTab === 'tasks'
                  ? 'bg-slate-100 dark:bg-[#111722] text-sky-600 dark:text-[#38BDF8] border-b-2 border-sky-600 dark:border-[#38BDF8] font-bold'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tasks & Milestones ({team.tasks?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-4 py-2 rounded-t-xl font-mono transition-colors ${
                activeTab === 'projects'
                  ? 'bg-slate-100 dark:bg-[#111722] text-sky-600 dark:text-[#38BDF8] border-b-2 border-sky-600 dark:border-[#38BDF8] font-bold'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Projects & Challenges ({team.projects?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('contributions')}
              className={`px-4 py-2 rounded-t-xl font-mono transition-colors ${
                activeTab === 'contributions'
                  ? 'bg-slate-100 dark:bg-[#111722] text-sky-600 dark:text-[#38BDF8] border-b-2 border-sky-600 dark:border-[#38BDF8] font-bold'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Granular Contributions (DCC Attributed)
            </button>
          </div>

          {/* TAB 1: Overview & Members */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Team Members (8 cols) */}
              <div className="lg:col-span-8 bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Roster & Verified Capabilities ({team.members?.length || 0})
                </h3>

                <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {team.members?.map((m) => (
                    <div key={m.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={m.developer.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4'}
                          alt={m.developer.name || m.developer.username}
                          className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/[0.1]"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              {m.developer.name || m.developer.username}
                            </h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/[0.04] text-indigo-600 dark:text-[#A78BFA] capitalize">
                              {m.role}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-[#64748B]">
                            @{m.developer.username} • Verified {m.developer.dccLevel} ({m.developer.overallScore}/1000)
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/developer/${m.developer.username}`}
                        target="_blank"
                        className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-xs font-semibold text-sky-600 dark:text-[#38BDF8] border border-slate-200 dark:border-white/[0.06] flex items-center gap-1 transition-colors"
                      >
                        <span>View DCC</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Invite Member Drawer (4 cols) */}
              <div className="lg:col-span-4 bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-sky-600 dark:text-[#38BDF8]" />
                  <span>Invite Teammate</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8]">
                  Add verified developers with complementary skill sets to collaborate on challenges.
                </p>

                <form onSubmit={handleInvite} className="space-y-3 text-xs">
                  <input
                    type="text"
                    value={inviteUserId}
                    onChange={(e) => setInviteUserId(e.target.value)}
                    placeholder="Enter developer username or ID..."
                    className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 dark:focus:border-[#38BDF8]"
                  />
                  <button
                    type="submit"
                    disabled={inviting}
                    className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 dark:bg-[#38BDF8] dark:hover:bg-[#0284C7] disabled:opacity-50 text-white dark:text-black text-xs font-bold transition-all shadow-md shadow-sky-500/20"
                  >
                    {inviting ? 'Inviting...' : 'Send Invitation'}
                  </button>
                </form>

                {feedback && (
                  <div className="p-3 rounded-xl bg-[#10B981]/10 border border-[#10B981]/25 text-[11px] text-[#10B981]">
                    {feedback}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Tasks & Milestones */}
          {activeTab === 'tasks' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Tasks List (8 cols) */}
              <div className="lg:col-span-8 bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Task Pipeline ({team.tasks?.length || 0})
                  </h3>
                </div>

                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Add a new engineering task or deliverable..."
                    className="flex-1 bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:border-sky-500 dark:focus:border-[#38BDF8]"
                  />
                  <button
                    type="submit"
                    disabled={addingTask}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 dark:bg-[#38BDF8] dark:hover:bg-[#0284C7] disabled:opacity-50 text-white dark:text-black text-xs font-bold transition-all"
                  >
                    Add Task
                  </button>
                </form>

                <div className="divide-y divide-slate-100 dark:divide-white/[0.04] pt-2">
                  {team.tasks?.map((tsk) => (
                    <div key={tsk.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={tsk.status === 'completed'}
                          onChange={() => handleToggleTaskStatus(tsk)}
                          className="w-4 h-4 rounded bg-slate-100 dark:bg-[#111722] border-slate-300 dark:border-white/[0.2] accent-sky-500 dark:accent-[#38BDF8] cursor-pointer"
                        />
                        <span className={`text-xs ${tsk.status === 'completed' ? 'line-through text-slate-400 dark:text-[#64748B]' : 'text-slate-900 dark:text-white font-medium'}`}>
                          {tsk.title}
                        </span>
                      </div>

                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded capitalize ${
                        tsk.status === 'completed' ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                      }`}>
                        {tsk.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestones (4 cols) */}
              <div className="lg:col-span-4 bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Target Milestones
                </h3>

                <div className="space-y-3">
                  {team.milestones?.map((ms) => (
                    <div key={ms.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111722] border border-slate-200/60 dark:border-white/[0.04] space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{ms.title}</h4>
                        <span className="text-[10px] font-mono text-sky-600 dark:text-[#38BDF8]">
                          {new Date(ms.targetDate).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-[#64748B] block">
                        Status: In Progress
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Projects & Challenges */}
          {activeTab === 'projects' && (
            <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Linked Repositories & Challenges
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {team.projects?.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl bg-slate-50 dark:bg-[#111722] border border-slate-200/60 dark:border-white/[0.04] space-y-2">
                    <div className="flex items-center gap-2">
                      <FolderGit2 className="w-4 h-4 text-sky-600 dark:text-[#38BDF8]" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{p.name}</h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-[#94A3B8]">{p.description}</p>
                    <a
                      href={p.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-sky-600 dark:text-[#38BDF8] hover:underline"
                    >
                      <span>{p.repositoryUrl}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Granular Contributions (DCC Attributed) */}
          {activeTab === 'contributions' && (
            <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-sm">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Individual Contribution Tracking & Attribution
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-1">
                  Team work is attributed individually based on verified AST modules, PRs, and commits. Team reputation does not artificially inflate individual DCC scores.
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {team.contributions?.map((c) => (
                  <div key={c.userId} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={c.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4'}
                        alt={c.developerName}
                        className="w-11 h-11 rounded-full border border-slate-200 dark:border-white/[0.1]"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{c.developerName}</h4>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-[#64748B]">
                          @{c.username}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {c.contributedSkillAreas.map(sk => (
                            <span key={sk} className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/[0.04] text-indigo-600 dark:text-[#A78BFA]">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-right font-mono text-xs">
                      <div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white block">{c.commitsCount}</span>
                        <span className="text-[10px] text-slate-500 dark:text-[#64748B]">Commits</span>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-sky-600 dark:text-[#38BDF8] block">{c.pullRequestsCount}</span>
                        <span className="text-[10px] text-slate-500 dark:text-[#64748B]">PRs Audited</span>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-[#10B981] block">{c.astReviewedModulesCount}</span>
                        <span className="text-[10px] text-slate-500 dark:text-[#64748B]">AST Modules</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
