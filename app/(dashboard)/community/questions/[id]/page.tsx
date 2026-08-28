'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import {
  HelpCircle,
  ArrowLeft,
  CheckCircle2,
  ThumbsUp,
  Send,
  Code2,
  Sparkles,
  Award
} from 'lucide-react';
import { CommunityQuestionItem } from '@/types/community';

export default function QuestionDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [question, setQuestion] = useState<CommunityQuestionItem | null>(null);
  const [answerContent, setAnswerContent] = useState('');
  const [answerSnippet, setAnswerSnippet] = useState('');
  const [submittingAns, setSubmittingAns] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function loadQuestion() {
    try {
      const res = await fetch(`/api/community/questions/${id}`).then(r => r.json());
      if (res.success && res.data) {
        setQuestion(res.data);
      }
    } catch (err) {
      console.error('Failed to load question:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadQuestion();
  }, [id]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !answerContent.trim()) return;
    setSubmittingAns(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/community/questions/${question.id}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: answerContent,
          codeSnippet: answerSnippet || undefined,
        }),
      }).then(r => r.json());

      if (res.success && res.answer) {
        setQuestion(prev => prev ? {
          ...prev,
          answersCount: prev.answersCount + 1,
          answers: [...(prev.answers || []), res.answer],
        } : null);
        setAnswerContent('');
        setAnswerSnippet('');
        setFeedback('Your answer has been posted!');
      }
    } catch (err) {
      setFeedback('Failed to post answer.');
    } finally {
      setSubmittingAns(false);
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    if (!question) return;
    try {
      const res = await fetch(`/api/community/questions/${question.id}/answers/${answerId}/accept`, {
        method: 'PATCH',
      }).then(r => r.json());

      if (res.success) {
        setQuestion(prev => prev ? {
          ...prev,
          status: 'answered',
          acceptedAnswerId: answerId,
          answers: (prev.answers || []).map(a => a.id === answerId ? { ...a, isAccepted: true } : a),
        } : null);
        setFeedback('Answer marked as accepted! Community reputation points awarded to author.');
      }
    } catch (err) {
      setFeedback('Error accepting answer.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#070A0F] text-[#F8FAFC]">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-xs text-[#64748B]">
          Loading question discussion...
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex h-screen bg-[#070A0F] text-[#F8FAFC]">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-3">
          <h3 className="text-sm font-bold text-white">Question Not Found</h3>
          <Link href="/community" className="text-xs text-[#8B5CF6] underline">
            Return to Community
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-6 max-w-[1100px] w-full mx-auto">
          <div>
            <Link
              href="/community"
              className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Community Hub</span>
            </Link>
          </div>

          {/* Question Banner */}
          <div className="bg-[#0D121A] border border-white/[0.08] p-6 sm:p-7 rounded-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={question.author.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4'}
                  alt={question.author.name}
                  className="w-11 h-11 rounded-full border border-white/[0.1]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{question.author.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.04] text-[#A78BFA]">
                      @{question.author.username}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#64748B]">
                    Asked on {new Date(question.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                question.status === 'answered'
                  ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/25'
                  : 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/25'
              }`}>
                {question.status === 'answered' ? '✓ Solved' : 'Open Question'}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-lg sm:text-xl font-bold text-white">{question.title}</h1>
              <p className="text-xs text-[#94A3B8] leading-relaxed whitespace-pre-line">{question.content}</p>
            </div>

            {question.codeSnippet && (
              <div className="p-3.5 rounded-xl bg-[#070A0F] border border-white/[0.06] overflow-x-auto">
                <pre className="font-mono text-xs text-[#38BDF8] leading-relaxed">
                  <code>{question.codeSnippet}</code>
                </pre>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              {question.tags.map(t => (
                <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#111722] text-[#E2E8F0]">
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {feedback && (
            <div className="p-3.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/25 text-xs text-[#10B981] flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Answers List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Answers & Technical Solutions ({question.answers?.length || 0})
            </h3>

            {question.answers?.map((ans) => (
              <div
                key={ans.id}
                className={`bg-[#0D121A] border rounded-2xl p-6 space-y-3 transition-all ${
                  ans.isAccepted ? 'border-[#10B981]/40 shadow-lg shadow-[#10B981]/5' : 'border-white/[0.08]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={ans.author.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4'}
                      alt={ans.author.name}
                      className="w-9 h-9 rounded-full border border-white/[0.1]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{ans.author.name}</span>
                        <span className="text-[10px] font-mono text-[#64748B]">@{ans.author.username}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#64748B]">
                        {new Date(ans.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {ans.isAccepted ? (
                    <span className="text-xs font-mono font-bold text-[#10B981] px-2.5 py-1 rounded-lg bg-[#10B981]/10 border border-[#10B981]/25 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Accepted Solution (+25 Rep)
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcceptAnswer(ans.id)}
                      className="text-[11px] font-mono px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-[#10B981]/20 text-[#10B981] border border-white/[0.06] transition-colors"
                    >
                      Accept Answer
                    </button>
                  )}
                </div>

                <p className="text-xs text-[#E2E8F0] leading-relaxed whitespace-pre-line">{ans.content}</p>

                {ans.codeSnippet && (
                  <div className="p-3.5 rounded-xl bg-[#070A0F] border border-white/[0.06] overflow-x-auto">
                    <pre className="font-mono text-xs text-[#38BDF8]">
                      <code>{ans.codeSnippet}</code>
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Submit Answer Form */}
          <div className="bg-[#0D121A] border border-white/[0.08] rounded-2xl p-6 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Submit Your Solution
            </h3>
            <form onSubmit={handleSubmitAnswer} className="space-y-3 text-xs">
              <textarea
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                rows={4}
                placeholder="Explain the solution, root cause, or best practice..."
                required
                className="w-full bg-[#111722] border border-white/[0.08] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
              />
              <textarea
                value={answerSnippet}
                onChange={(e) => setAnswerSnippet(e.target.value)}
                rows={3}
                placeholder="// Optional code snippet..."
                className="w-full bg-[#111722] border border-white/[0.08] rounded-xl p-3 text-xs text-[#38BDF8] font-mono focus:outline-none"
              />
              <button
                type="submit"
                disabled={submittingAns}
                className="px-5 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-[#8B5CF6]/20 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submittingAns ? 'Submitting...' : 'Post Answer'}</span>
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
