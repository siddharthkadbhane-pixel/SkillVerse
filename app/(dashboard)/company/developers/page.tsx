'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import {
  Search,
  Filter,
  Bookmark,
  BookmarkCheck,
  ShieldCheck,
  ExternalLink,
  Code2,
  FileText,
  Sparkles,
  ArrowRight,
  Layers,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { DeveloperSearchResultItem } from '@/types/discovery';

function RecruiterFindDevelopersContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedCapability, setSelectedCapability] = useState('');
  const [developers, setDevelopers] = useState<DeveloperSearchResultItem[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeNoteDev, setActiveNoteDev] = useState<DeveloperSearchResultItem | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const capabilityCategories = [
    'All Capabilities',
    'Frontend Engineering',
    'Backend Engineering',
    'Full-Stack Development',
    'Database Engineering',
    'DevOps & Infrastructure',
    'Software Architecture',
    'API Development',
  ];

  const quickSkills = ['All Skills', 'TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Docker', 'Python', 'Rust'];

  async function fetchDevelopers() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (selectedSkill && selectedSkill !== 'All Skills') params.set('skills', selectedSkill);

      const [searchRes, savedRes] = await Promise.all([
        fetch(`/api/developers?${params.toString()}`).then(r => r.json()),
        fetch('/api/company/saved').then(r => r.json()),
      ]);

      if (searchRes.success && Array.isArray(searchRes.data?.developers)) {
        setDevelopers(searchRes.data.developers);
      }
      if (savedRes.success && Array.isArray(savedRes.data)) {
        setSavedIds(new Set(savedRes.data.map((s: any) => s.developerUserId)));
      }
    } catch (err) {
      console.error('Failed to search developers:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDevelopers();
  }, [selectedSkill, selectedCapability]);

  const handleToggleSave = async (dev: DeveloperSearchResultItem) => {
    const isSaved = savedIds.has(dev.id);
    if (isSaved) {
      setSavedIds(prev => {
        const next = new Set(prev);
        next.delete(dev.id);
        return next;
      });
      await fetch(`/api/company/saved?developerUserId=${dev.id}`, { method: 'DELETE' });
    } else {
      setSavedIds(prev => new Set(prev).add(dev.id));
      await fetch('/api/company/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          developerUserId: dev.id,
          tags: ['Candidate Pool', dev.dccLevel],
          notes: `Discovered with ${dev.topVerifiedSkills.length} verified skills and level ${dev.dccLevel}.`,
        }),
      });
    }
  };

  const handleSaveNote = async () => {
    if (!activeNoteDev || !noteContent.trim()) return;
    setSavingNote(true);
    try {
      await fetch('/api/company/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          developerUserId: activeNoteDev.id,
          content: noteContent.trim(),
        }),
      });
      setActiveNoteDev(null);
      setNoteContent('');
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#070A0F] text-slate-900 dark:text-[#F8FAFC] transition-colors">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-6 max-w-[1400px] w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Discover Verified Developers
                </h1>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#6366F1]/10 text-[#6366F1] dark:text-[#C4B5FD] border border-[#6366F1]/20">
                  Recruiter Workspace
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
                Evaluate candidates directly through verified AST codebase proofs, capability mapping, and real Git contributions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/company/saved"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#111722] hover:bg-slate-100 dark:hover:bg-[#1A2234] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors shadow-sm"
              >
                <Bookmark className="w-3.5 h-3.5 text-[#6366F1]" />
                <span>Saved Shortlist ({savedIds.size})</span>
              </Link>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] p-4 rounded-2xl space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#64748B]" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') fetchDevelopers();
                  }}
                  placeholder="Search by skill, capability, or developer username..."
                  className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:border-[#6366F1] transition-colors"
                />
              </div>

              <button
                onClick={fetchDevelopers}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-semibold shadow-md shadow-[#6366F1]/20 transition-all"
              >
                Search
              </button>
            </div>

            {/* Quick Skill Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] shrink-0">Filter Skill:</span>
              {quickSkills.map((sk) => {
                const active = (selectedSkill === '' && sk === 'All Skills') || selectedSkill === sk;
                return (
                  <button
                    key={sk}
                    onClick={() => setSelectedSkill(sk === 'All Skills' ? '' : sk)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors shrink-0 ${
                      active
                        ? 'bg-[#6366F1] text-white font-bold'
                        : 'bg-slate-100 dark:bg-[#111722] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06]'
                    }`}
                  >
                    {sk}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Developer Results Grid */}
          {loading ? (
            <div className="text-center py-16 text-xs text-[#64748B]">
              Scanning verified developer capability cards...
            </div>
          ) : developers.length === 0 ? (
            <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-12 text-center space-y-3 shadow-sm">
              <Search className="w-8 h-8 text-slate-400 dark:text-[#64748B] mx-auto" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No developers matched your query</h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] max-w-sm mx-auto">
                Try searching for broader skills like TypeScript, React, Next.js, or PostgreSQL.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {developers.map((dev) => {
                const isSaved = savedIds.has(dev.id);
                return (
                  <div
                    key={dev.id}
                    className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16] rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all shadow-sm"
                  >
                    <div className="space-y-3">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={dev.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4'}
                            alt={dev.name || dev.username}
                            className="w-12 h-12 rounded-full border border-slate-200 dark:border-white/[0.1] shrink-0 object-cover"
                          />
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                              {dev.name || dev.username}
                            </h3>
                            <span className="text-xs text-[#6366F1] dark:text-[#38BDF8] font-mono">@{dev.username}</span>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#6366F1]/10 text-[#6366F1] dark:text-[#C4B5FD] border border-[#6366F1]/30 shrink-0">
                          {dev.dccLevel}
                        </span>
                      </div>

                      {/* Bio */}
                      {dev.bio && (
                        <p className="text-xs text-slate-600 dark:text-[#94A3B8] line-clamp-2 leading-relaxed">
                          {dev.bio}
                        </p>
                      )}

                      {/* Verified Skills */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-mono text-slate-400 dark:text-[#64748B] uppercase tracking-wider block">
                          Verified Skills ({dev.topVerifiedSkills.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {dev.topVerifiedSkills.slice(0, 5).map((skill, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.06] text-slate-800 dark:text-[#E2E8F0] inline-flex items-center gap-1"
                            >
                              <span className="text-[#14B8A6] font-bold">✓</span> {skill.name}
                            </span>
                          ))}
                          {dev.topVerifiedSkills.length > 5 && (
                            <span className="text-[10px] font-mono text-slate-400 dark:text-[#64748B] self-center">
                              +{dev.topVerifiedSkills.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleSave(dev)}
                          className={`p-2 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                            isSaved
                              ? 'bg-[#6366F1]/15 border-[#6366F1]/40 text-[#6366F1] dark:text-[#C4B5FD]'
                              : 'bg-slate-100 dark:bg-[#111722] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
                          }`}
                          title={isSaved ? 'Remove from Shortlist' : 'Save to Shortlist'}
                        >
                          {isSaved ? (
                            <BookmarkCheck className="w-3.5 h-3.5 text-[#6366F1]" />
                          ) : (
                            <Bookmark className="w-3.5 h-3.5" />
                          )}
                          <span className="text-[11px]">{isSaved ? 'Saved' : 'Save'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveNoteDev(dev);
                            setNoteContent('');
                          }}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white text-xs transition-colors flex items-center gap-1.5"
                          title="Add Private Recruiter Note"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Note</span>
                        </button>
                      </div>

                      <Link
                        href={dev.dccUrl || `/developer/${dev.username}`}
                        target="_blank"
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-xs font-semibold text-[#6366F1] dark:text-[#38BDF8] border border-slate-200 dark:border-white/[0.08] flex items-center gap-1.5 transition-colors shrink-0"
                      >
                        <span>View DCC</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Private Recruiter Note Modal */}
          {activeNoteDev && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.1] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#6366F1]" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Private Recruiter Note</h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-[#111722] text-[#14B8A6] border border-[#14B8A6]/20">
                    Shielded from Candidate
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-[#94A3B8]">
                  Add internal notes regarding <strong className="text-slate-900 dark:text-white">@{activeNoteDev.username}</strong>. Only authorized members of your company workspace can read this note.
                </p>

                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="e.g. Strong AST modularity, recommended for senior backend role. Interview scheduled next week..."
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:border-[#6366F1]"
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setActiveNoteDev(null)}
                    className="px-3.5 py-2 rounded-xl bg-transparent hover:bg-slate-100 dark:hover:bg-white/[0.04] text-xs text-slate-600 dark:text-[#94A3B8] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNote}
                    disabled={savingNote || !noteContent.trim()}
                    className="px-4 py-2 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-md shadow-[#6366F1]/20"
                  >
                    {savingNote ? 'Saving...' : 'Save Note'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function RecruiterFindDevelopersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-[#08090D] text-slate-900 dark:text-white flex items-center justify-center">
          <div className="text-xs text-slate-500 dark:text-[#94A3B8] font-mono animate-pulse">
            Loading Talent Discovery Engine...
          </div>
        </div>
      }
    >
      <RecruiterFindDevelopersContent />
    </Suspense>
  );
}
