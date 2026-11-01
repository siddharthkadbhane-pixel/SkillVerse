'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  ShieldCheck,
  Code2,
  FolderGit2,
  Lock,
  Globe,
  Sparkles
} from 'lucide-react';
import { TeamItem } from '@/types/team';

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Modal Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [skillsStr, setSkillsStr] = useState('TypeScript, Next.js, PostgreSQL');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  async function loadTeams() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (skillFilter !== 'all') params.set('skill', skillFilter);

      const res = await fetch(`/api/teams?${params.toString()}`).then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        setTeams(res.data);
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeams();
  }, [skillFilter]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const skills = skillsStr.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, skills, visibility }),
      }).then(r => r.json());

      if (res.success && res.team) {
        setTeams(prev => [res.team, ...prev]);
        setIsModalOpen(false);
        setName('');
        setDescription('');
      }
    } catch (err) {
      console.error('Failed to create team:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#070A0F] text-slate-900 dark:text-[#F8FAFC]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-6 max-w-[1400px] w-full mx-auto">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#38BDF8]" />
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Team Formation & Collaboration
                </h1>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#38BDF8]/10 text-cyan-700 dark:text-[#38BDF8] border border-[#38BDF8]/25">
                  Granular Attribution
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-1">
                Form high-caliber engineering teams, tackle challenges together, and maintain distinct verified contribution evidence on your DCC.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#38BDF8] hover:bg-[#0284C7] text-slate-950 text-xs font-bold shadow-lg shadow-[#38BDF8]/25 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Team</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-3 shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#64748B]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') loadTeams(); }}
                placeholder="Search teams by name, description, or complementary skill stack..."
                className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            <button
              onClick={loadTeams}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-white text-xs font-semibold border border-slate-200 dark:border-white/[0.08] transition-colors"
            >
              Search Teams
            </button>
          </div>

          {/* Teams Grid */}
          {loading ? (
            <div className="text-center py-20 text-xs text-slate-500 dark:text-[#64748B]">
              Loading verified teams...
            </div>
          ) : teams.length === 0 ? (
            <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-12 text-center space-y-3 shadow-sm">
              <Users className="w-8 h-8 text-slate-400 dark:text-[#64748B] mx-auto" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No teams found</h3>
              <p className="text-xs text-slate-600 dark:text-[#94A3B8]">
                Build your first team by inviting developers with complementary verified skills.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((t) => (
                <div
                  key={t.id}
                  className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16] rounded-2xl p-6 transition-all flex flex-col justify-between space-y-5 shadow-sm"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={t.avatarUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80'}
                          alt={t.name}
                          className="w-12 h-12 rounded-xl border border-slate-200 dark:border-white/[0.1] object-cover"
                        />
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{t.name}</h3>
                          <span className="text-[11px] font-mono text-cyan-600 dark:text-[#38BDF8]">
                            Lead: {t.ownerName}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#111722] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-white/[0.06] flex items-center gap-1">
                        {t.visibility === 'public' ? <Globe className="w-3 h-3 text-emerald-600 dark:text-[#10B981]" /> : <Lock className="w-3 h-3 text-amber-600 dark:text-[#F59E0B]" />}
                        <span className="capitalize">{t.visibility}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed line-clamp-3">
                      {t.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {t.skills.map(sk => (
                        <span
                          key={sk}
                          className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#070A0F] border border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-[#E2E8F0]"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 dark:text-[#64748B]">
                      <span>{t.membersCount} Members</span>
                      <span>•</span>
                      <span>{t.projectsCount} Projects</span>
                    </div>

                    <Link
                      href={`/teams/${t.slug}`}
                      className="px-3.5 py-1.5 rounded-lg bg-[#38BDF8] hover:bg-[#0284C7] text-slate-950 text-xs font-bold transition-all flex items-center gap-1 shadow-md shadow-[#38BDF8]/20"
                    >
                      <span>Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Team Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.1] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-600 dark:text-[#38BDF8]" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Engineering Team</h3>
                  </div>
                </div>

                <form onSubmit={handleCreateTeam} className="space-y-4 text-xs">
                  <div>
                    <label className="text-[11px] font-mono text-slate-600 dark:text-[#64748B] block mb-1">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Distributed Core Guild"
                      required
                      className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#38BDF8]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-600 dark:text-[#64748B] block mb-1">
                      Team Purpose & Technical Focus *
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Describe what your team builds and the technical stack you specialize in..."
                      required
                      className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#38BDF8]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-600 dark:text-[#64748B] block mb-1">
                      Core Technology Stack (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={skillsStr}
                      onChange={(e) => setSkillsStr(e.target.value)}
                      placeholder="e.g. TypeScript, Next.js, PostgreSQL, Docker"
                      required
                      className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-600 dark:text-[#64748B] block mb-1">
                      Visibility
                    </label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
                      className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="public">Public (Discoverable by other engineers)</option>
                      <option value="private">Private (Invite only)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-5 py-2 rounded-xl bg-[#38BDF8] hover:bg-[#0284C7] disabled:opacity-50 text-slate-950 text-xs font-bold shadow-lg shadow-[#38BDF8]/25"
                    >
                      {creating ? 'Creating...' : 'Create Team'}
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
