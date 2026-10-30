'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Send,
  ExternalLink,
  Code2,
  Layers,
  Info
} from 'lucide-react';
import { OpportunityItem } from '@/types/opportunity';

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [opportunity, setOpportunity] = useState<OpportunityItem | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  async function loadOpportunity() {
    try {
      const res = await fetch(`/api/jobs/${id}`).then(r => r.json());
      if (res.success && res.data) {
        setOpportunity(res.data);
      }
    } catch (err) {
      console.error('Failed to load opportunity:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadOpportunity();
  }, [id]);

  const handleApply = async () => {
    if (!opportunity) return;
    setApplying(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/jobs/${opportunity.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverLetter }),
      }).then(r => r.json());

      if (res.success) {
        setOpportunity(prev => prev ? { ...prev, hasApplied: true, userApplicationStatus: 'applied' } : null);
        setFeedback({ success: true, message: 'Application submitted with live DCC snapshot!' });
      } else {
        setFeedback({ success: false, message: res.error || 'Failed to submit application.' });
      }
    } catch (err: any) {
      setFeedback({ success: false, message: 'Network error submitting application.' });
    } finally {
      setApplying(false);
    }
  };

  const handleToggleSave = async () => {
    if (!opportunity) return;
    const isSaved = opportunity.isSaved;
    setOpportunity(prev => prev ? { ...prev, isSaved: !isSaved } : null);

    if (isSaved) {
      await fetch(`/api/jobs/${opportunity.id}/save`, { method: 'DELETE' });
    } else {
      await fetch(`/api/jobs/${opportunity.id}/save`, { method: 'POST' });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-canvas text-primary">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <div className="flex-1 flex items-center justify-center text-xs text-slate-500 dark:text-[#64748B]">
            Loading opportunity specifications...
          </div>
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="flex h-screen bg-canvas text-primary">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <div className="flex-1 flex flex-col items-center justify-center space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Opportunity Not Found</h3>
            <Link href="/jobs" className="text-xs text-sky-600 dark:text-[#38BDF8] underline">
              Return to Opportunities
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const match = opportunity.matchEvaluation;

  return (
    <div className="flex h-screen bg-canvas text-primary">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-6 max-w-[1300px] w-full mx-auto">
          {/* Back Button */}
          <div>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Opportunities</span>
            </Link>
          </div>

          {/* Opportunity Header Banner */}
          <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] p-6 sm:p-7 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
            <div className="flex items-start gap-4">
              <img
                src={opportunity.company.logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80'}
                alt={opportunity.company.name}
                className="w-16 h-16 rounded-2xl border border-slate-200 dark:border-white/[0.1] object-cover shrink-0"
              />
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {opportunity.title}
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#111722] text-sky-600 dark:text-[#38BDF8] border border-sky-500/20 dark:border-[#38BDF8]/20 uppercase">
                    {opportunity.type.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-[#111722] text-emerald-600 dark:text-[#10B981] border border-emerald-500/20 dark:border-[#10B981]/20">
                    {opportunity.workplaceType}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-[#94A3B8]">
                  <span className="font-semibold text-slate-900 dark:text-white">{opportunity.company.name}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {opportunity.location}
                  </span>
                  {opportunity.salaryRange && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-[#34D399] font-mono font-semibold">
                        {opportunity.salaryRange}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleToggleSave}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors"
                title={opportunity.isSaved ? 'Saved' : 'Save opportunity'}
              >
                {opportunity.isSaved ? (
                  <BookmarkCheck className="w-4 h-4 text-sky-600 dark:text-[#38BDF8]" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={handleApply}
                disabled={opportunity.hasApplied || applying}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 dark:bg-[#38BDF8] dark:hover:bg-[#0284C7] disabled:opacity-50 text-white dark:text-black text-xs font-bold transition-all shadow-lg shadow-sky-500/25"
              >
                {opportunity.hasApplied ? '✓ Applied' : applying ? 'Submitting...' : 'Apply with DCC'}
              </button>
            </div>
          </div>

          {feedback && (
            <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
              feedback.success
                ? 'bg-[#10B981]/10 border border-[#10B981]/25 text-[#10B981]'
                : 'bg-red-500/10 border border-red-500/25 text-red-400'
            }`}>
              {feedback.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Main Grid: Description vs DCC Proof Match */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Description & Specifications (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Role Overview */}
              <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Opportunity Specifications
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed whitespace-pre-line">
                  {opportunity.description}
                </p>
              </div>

              {/* Skills & Capability Requirements */}
              <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-6 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Engineering Requirements
                </h3>

                {/* Required Skills */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] uppercase tracking-wider block">
                    Required Skills (Must-Have)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {opportunity.requiredSkills.map(sk => {
                      const isVerified = match?.verifiedSkillsMatch.find(v => v.skill === sk)?.verified;
                      return (
                        <div
                          key={sk}
                          className="bg-slate-50 dark:bg-[#111722] border border-slate-200/60 dark:border-white/[0.04] p-3 rounded-xl flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="font-semibold text-slate-900 dark:text-white">{sk}</span>
                          {isVerified ? (
                            <span className="text-[10px] font-mono font-bold text-[#10B981] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              DCC Verified
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-500 dark:text-[#64748B]">
                              Missing on DCC
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Preferred Skills */}
                {opportunity.preferredSkills.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/[0.04]">
                    <span className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] uppercase tracking-wider block">
                      Preferred Skills (Nice-to-Have)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {opportunity.preferredSkills.map(sk => (
                        <span
                          key={sk}
                          className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-[#111722] text-slate-600 dark:text-[#94A3B8] border border-slate-200/60 dark:border-white/[0.06]"
                        >
                          + {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Capability Areas */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/[0.04]">
                  <span className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] uppercase tracking-wider block">
                    Core Capability Expectations
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {opportunity.requiredCapabilities.map(cap => (
                      <span
                        key={cap}
                        className="text-xs font-mono px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-[#7C3AED]/15 text-indigo-700 dark:text-[#C4B5FD] border border-indigo-200 dark:border-[#7C3AED]/25"
                      >
                        ⚡ {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: DCC Match Analysis & 1-Click Apply (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* DCC Live Match Breakdown */}
              {match && (
                <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-sky-600 dark:text-[#38BDF8]" />
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        DCC Match Analysis
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#10B981]">
                      {match.matchPercentage}%
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#111722] border border-slate-200/60 dark:border-white/[0.06] space-y-2">
                    <span className="text-[10px] font-mono text-slate-500 dark:text-[#64748B] uppercase block">
                      Match Classification
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{match.matchTier}</h4>
                    <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                      {match.whyExplanation}
                    </p>
                  </div>

                  {match.missingSkills.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-[#F59E0B]/10 border border-amber-200 dark:border-[#F59E0B]/20 text-[11px] text-amber-700 dark:text-[#F59E0B] space-y-1">
                      <strong className="block font-semibold">Missing Verified Skills:</strong>
                      <p className="text-[11px] text-amber-600 dark:text-[#FDE68A]">
                        {match.missingSkills.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Apply Submission Card */}
              <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Submit Application
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8]">
                  Your verified Developer Capability Card (DCC) and AST quality proof will be submitted directly to the hiring team.
                </p>

                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  disabled={opportunity.hasApplied}
                  placeholder="Optional brief note to recruiter..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:border-sky-500 dark:focus:border-[#38BDF8]"
                />

                <button
                  onClick={handleApply}
                  disabled={opportunity.hasApplied || applying}
                  className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 dark:bg-[#38BDF8] dark:hover:bg-[#0284C7] disabled:opacity-50 text-white dark:text-black text-xs font-bold transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{opportunity.hasApplied ? 'Application Already Submitted' : applying ? 'Submitting...' : 'Submit Application with DCC'}</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
