'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import {
  Bookmark,
  BookmarkCheck,
  Search,
  ExternalLink,
  FileText,
  Trash2,
  Tag,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeftRight
} from 'lucide-react';
import { SavedDeveloperItem, RecruiterNoteItem } from '@/types/company';

export default function SavedTalentPage() {
  const [savedList, setSavedList] = useState<SavedDeveloperItem[]>([]);
  const [selectedDev, setSelectedDev] = useState<SavedDeveloperItem | null>(null);
  const [notes, setNotes] = useState<RecruiterNoteItem[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingNote, setAddingNote] = useState(false);

  async function loadSaved() {
    try {
      const res = await fetch('/api/company/saved').then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        setSavedList(res.data);
        if (res.data.length > 0 && !selectedDev) {
          setSelectedDev(res.data[0]);
          loadNotes(res.data[0].developerUserId);
        }
      }
    } catch (err) {
      console.error('Failed to load saved talent:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadNotes(developerUserId: string) {
    try {
      const res = await fetch(`/api/company/notes?developerUserId=${developerUserId}`).then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        setNotes(res.data);
      }
    } catch (err) {
      console.error('Failed to load recruiter notes:', err);
    }
  }

  useEffect(() => {
    loadSaved();
  }, []);

  const handleSelectDev = (item: SavedDeveloperItem) => {
    setSelectedDev(item);
    loadNotes(item.developerUserId);
  };

  const handleRemoveSaved = async (developerUserId: string) => {
    try {
      await fetch(`/api/company/saved?developerUserId=${developerUserId}`, { method: 'DELETE' });
      const updated = savedList.filter(s => s.developerUserId !== developerUserId);
      setSavedList(updated);
      if (selectedDev?.developerUserId === developerUserId) {
        setSelectedDev(updated[0] || null);
        if (updated[0]) loadNotes(updated[0].developerUserId);
      }
    } catch (err) {
      console.error('Failed to remove saved developer:', err);
    }
  };

  const handleAddNote = async () => {
    if (!selectedDev || !newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch('/api/company/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          developerUserId: selectedDev.developerUserId,
          content: newNote.trim(),
        }),
      }).then(r => r.json());

      if (res.success && res.note) {
        setNotes(prev => [res.note, ...prev]);
        setNewNote('');
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setAddingNote(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-6 max-w-[1400px] w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-[#7C3AED]" />
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Saved Talent & Shortlists
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#111722] text-[#94A3B8] border border-white/[0.06]">
                  {savedList.length} Candidates
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-1">
                Manage shortlisted engineering candidates and maintain private internal recruiter notes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/company/compare"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111722] hover:bg-[#1A2234] border border-white/[0.08] text-xs font-semibold text-white transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Compare Candidates</span>
              </Link>
              <Link
                href="/company/developers"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-xs font-semibold text-white transition-colors shadow-lg shadow-[#7C3AED]/20"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Find More</span>
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-xs text-[#64748B]">
              Loading shortlisted candidates...
            </div>
          ) : savedList.length === 0 ? (
            <div className="bg-[#0D121A] border border-white/[0.08] rounded-2xl p-12 text-center space-y-4">
              <Bookmark className="w-8 h-8 text-[#64748B] mx-auto" />
              <h3 className="text-sm font-bold text-white">No saved candidates yet</h3>
              <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                Explore verified developers and click &ldquo;Save&rdquo; to build your company candidate pipeline.
              </p>
              <Link
                href="/company/developers"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7C3AED] text-white text-xs font-semibold"
              >
                <span>Search Developers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Candidate List (5 cols) */}
              <div className="lg:col-span-5 space-y-3">
                {savedList.map((item) => {
                  const isSelected = selectedDev?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectDev(item)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                        isSelected
                          ? 'bg-[#111722] border-[#7C3AED]/50 shadow-md'
                          : 'bg-[#0D121A] border-white/[0.06] hover:border-white/[0.12]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.developer?.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4'}
                            alt={item.developer?.name || item.developer?.username}
                            className="w-11 h-11 rounded-full border border-white/[0.1] shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">
                              {item.developer?.name || item.developer?.username}
                            </h4>
                            <span className="text-[11px] text-[#38BDF8] font-mono block">
                              @{item.developer?.username}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#7C3AED]/20 text-[#C4B5FD] shrink-0">
                          {item.developer?.dccLevel || 'Expert'}
                        </span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {item.tags?.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#070A0F] text-[#94A3B8] border border-white/[0.04]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-[#64748B]">
                        <span>Saved {new Date(item.createdAt).toLocaleDateString()}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSaved(item.developerUserId);
                          }}
                          className="text-red-400 hover:text-red-300 p-1 transition-colors"
                          title="Remove from saved"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Selected Candidate Details & Recruiter Notes (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {selectedDev && (
                  <div className="bg-[#0D121A] border border-white/[0.08] rounded-2xl p-6 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedDev.developer?.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4'}
                          alt={selectedDev.developer?.name || selectedDev.developer?.username}
                          className="w-14 h-14 rounded-full border border-white/[0.1] shrink-0"
                        />
                        <div>
                          <h3 className="text-base font-bold text-white">
                            {selectedDev.developer?.name || selectedDev.developer?.username}
                          </h3>
                          <p className="text-xs text-[#94A3B8]">
                            Verified {selectedDev.developer?.dccLevel} Tier Developer
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/developer/${selectedDev.developer?.username}`}
                        target="_blank"
                        className="px-3.5 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                      >
                        <span>Open Full DCC</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {/* Verified Skills Summary */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-mono text-[#64748B] uppercase tracking-wider block">
                        Verified Skills
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedDev.developer?.topVerifiedSkills?.map((s, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#111722] text-[#E2E8F0] border border-white/[0.06]"
                          >
                            ✓ {s.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Private Recruiter Notes Section */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#7C3AED]" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Private Recruiter Notes ({notes.length})
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono text-[#10B981] px-2 py-0.5 rounded bg-[#10B981]/10 border border-[#10B981]/20">
                          Shielded from Developer
                        </span>
                      </div>

                      {/* Add Note Form */}
                      <div className="space-y-2">
                        <textarea
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Add private evaluation notes, interview impressions, or salary expectations..."
                          rows={3}
                          className="w-full bg-[#111722] border border-white/[0.08] rounded-xl p-3 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED]"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={handleAddNote}
                            disabled={addingNote || !newNote.trim()}
                            className="px-4 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white text-xs font-semibold transition-all"
                          >
                            {addingNote ? 'Saving...' : 'Add Note'}
                          </button>
                        </div>
                      </div>

                      {/* Notes History */}
                      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        {notes.map((n) => (
                          <div
                            key={n.id}
                            className="bg-[#111722] border border-white/[0.06] p-3.5 rounded-xl space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-white">{n.recruiterName || 'Recruiter'}</span>
                              <span className="text-[#64748B] font-mono text-[10px]">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-[#94A3B8] leading-relaxed">
                              {n.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
