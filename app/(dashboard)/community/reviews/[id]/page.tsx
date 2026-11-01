'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import {
  Code2,
  ArrowLeft,
  Github,
  CheckCircle2,
  Send,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { PeerReviewRequestItem } from '@/types/community';

export default function PeerReviewDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [request, setRequest] = useState<PeerReviewRequestItem | null>(null);
  const [archScore, setArchScore] = useState(90);
  const [codeScore, setCodeScore] = useState(90);
  const [secScore, setSecScore] = useState(85);
  const [testScore, setTestScore] = useState(85);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function loadRequest() {
    try {
      const res = await fetch('/api/community/reviews').then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        const item = res.data.find((r: any) => r.id === id) || res.data[0];
        setRequest(item);
      }
    } catch (err) {
      console.error('Failed to load peer review request:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadRequest();
  }, [id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request || !feedbackNotes.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/community/reviews/${request.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          architectureScore: archScore,
          codeQualityScore: codeScore,
          securityScore: secScore,
          testingScore: testScore,
          feedbackNotes,
        }),
      }).then(r => r.json());

      if (res.success && res.response) {
        setRequest(prev => prev ? {
          ...prev,
          status: 'completed',
          responsesCount: prev.responsesCount + 1,
          responses: [...(prev.responses || []), res.response],
        } : null);
        setFeedback('Peer review submitted! Community reputation points awarded to your profile.');
        setFeedbackNotes('');
      }
    } catch (err) {
      setFeedback('Failed to submit peer review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-[#08090D] text-slate-900 dark:text-[#F1F5F9] transition-colors">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-xs text-slate-500 dark:text-[#64748B]">
          Loading peer review request...
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-[#08090D] text-slate-900 dark:text-[#F1F5F9] transition-colors">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Peer Review Request Not Found</h3>
          <Link href="/community" className="text-xs text-[#6366F1] underline">
            Return to Community
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#08090D] text-slate-900 dark:text-[#F1F5F9] transition-colors">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-6 max-w-[1200px] w-full mx-auto">
          <div>
            <Link
              href="/community"
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Community Hub</span>
            </Link>
          </div>

          {/* Request Header Banner */}
          <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] p-6 sm:p-7 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={request.requester.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4'}
                  alt={request.requester.name}
                  className="w-12 h-12 rounded-full border border-slate-200 dark:border-white/[0.1]"
                />
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{request.title}</h1>
                  <span className="text-xs text-slate-600 dark:text-[#94A3B8]">
                    Requested by <strong className="text-slate-900 dark:text-white">{request.requester.name}</strong> (@{request.requester.username})
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-sky-500/10 text-sky-600 dark:text-[#38BDF8] border border-sky-500/20 uppercase font-bold">
                {request.status}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed whitespace-pre-line">
              {request.description}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-100 dark:border-white/[0.06]">
              <a
                href={request.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-sky-600 dark:text-[#38BDF8] hover:underline"
              >
                <Github className="w-4 h-4" />
                <span>{request.repositoryUrl}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-[#64748B]">Focus:</span>
                {request.focusAreas.map(f => (
                  <span key={f} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#111722] text-[#6366F1] dark:text-[#A78BFA]">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {feedback && (
            <div className="p-3.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/25 text-xs text-[#10B981] flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Grid Layout: Existing Reviews vs Review Submission Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Previous Reviews (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recorded Peer Reviews ({request.responses?.length || 0})
              </h3>

              {request.responses?.map((res) => (
                <div key={res.id} className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/[0.04]">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={res.reviewer.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4'}
                        alt={res.reviewer.name}
                        className="w-8 h-8 rounded-full border border-slate-200 dark:border-white/[0.1]"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">{res.reviewer.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-[#64748B]">@{res.reviewer.username}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#10B981]">
                      Quality: {res.codeQualityScore}/100
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono">
                    <div className="p-2 rounded bg-slate-50 dark:bg-[#111722]">
                      <span className="text-slate-500 dark:text-[#64748B] block">Arch</span>
                      <strong className="text-slate-900 dark:text-white">{res.architectureScore}</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-50 dark:bg-[#111722]">
                      <span className="text-slate-500 dark:text-[#64748B] block">Code</span>
                      <strong className="text-slate-900 dark:text-white">{res.codeQualityScore}</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-50 dark:bg-[#111722]">
                      <span className="text-slate-500 dark:text-[#64748B] block">Sec</span>
                      <strong className="text-slate-900 dark:text-white">{res.securityScore}</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-50 dark:bg-[#111722]">
                      <span className="text-slate-500 dark:text-[#64748B] block">Test</span>
                      <strong className="text-slate-900 dark:text-white">{res.testingScore}</strong>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">{res.feedbackNotes}</p>
                </div>
              ))}
            </div>

            {/* Right: Rubric Submission Form (6 cols) */}
            <div className="lg:col-span-6 bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Submit Structured Code Audit Rubric
              </h3>

              <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] block mb-1">Architecture Score: {archScore}/100</label>
                    <input
                      type="range"
                      min={50}
                      max={100}
                      value={archScore}
                      onChange={(e) => setArchScore(Number(e.target.value))}
                      className="w-full accent-[#6366F1]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] block mb-1">Code Quality Score: {codeScore}/100</label>
                    <input
                      type="range"
                      min={50}
                      max={100}
                      value={codeScore}
                      onChange={(e) => setCodeScore(Number(e.target.value))}
                      className="w-full accent-[#6366F1]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] block mb-1">Security Score: {secScore}/100</label>
                    <input
                      type="range"
                      min={50}
                      max={100}
                      value={secScore}
                      onChange={(e) => setSecScore(Number(e.target.value))}
                      className="w-full accent-[#6366F1]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] block mb-1">Testing Score: {testScore}/100</label>
                    <input
                      type="range"
                      min={50}
                      max={100}
                      value={testScore}
                      onChange={(e) => setTestScore(Number(e.target.value))}
                      className="w-full accent-[#6366F1]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] block mb-1">Audit Feedback & Recommendations *</label>
                  <textarea
                    value={feedbackNotes}
                    onChange={(e) => setFeedbackNotes(e.target.value)}
                    rows={4}
                    placeholder="Provide constructive engineering feedback, identify anti-patterns, or suggest performance improvements..."
                    required
                    className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:border-[#6366F1]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-[#6366F1]/20 flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting Audit...' : 'Submit Peer Review (+20 Rep)'}</span>
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
