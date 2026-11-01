'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import {
  MessageSquare,
  Search,
  Plus,
  ArrowRight,
  Code2,
  CheckCircle2,
  Sparkles,
  Github,
  Send,
  ThumbsUp,
  Share2,
  Bookmark,
  Layers,
  HelpCircle,
  FolderGit2,
  Award,
  Users,
  Eye,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import {
  CommunityPostItem,
  CommunityQuestionItem,
  PeerReviewRequestItem,
  OpenSourceOpportunityItem,
  CommunityContentType,
  CommunityReputationItem
} from '@/types/community';

export default function CommunityHubPage() {
  const [activeTab, setActiveTab] = useState<'feed' | 'qa' | 'reviews' | 'opensource' | 'reputation'>('feed');
  const [posts, setPosts] = useState<CommunityPostItem[]>([]);
  const [questions, setQuestions] = useState<CommunityQuestionItem[]>([]);
  const [peerReviews, setPeerReviews] = useState<PeerReviewRequestItem[]>([]);
  const [openSource, setOpenSource] = useState<OpenSourceOpportunityItem[]>([]);
  const [reputation, setReputation] = useState<CommunityReputationItem | null>(null);

  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // New Post Modal State
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState<CommunityContentType>('technical_discussion');
  const [newPostTags, setNewPostTags] = useState('TypeScript, Architecture');
  const [newPostSnippet, setNewPostSnippet] = useState('');
  const [newPostRepoUrl, setNewPostRepoUrl] = useState('');
  const [newPostDemoUrl, setNewPostDemoUrl] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);

  // New Question Modal State
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [newQTitle, setNewQTitle] = useState('');
  const [newQContent, setNewQContent] = useState('');
  const [newQTags, setNewQTags] = useState('TypeScript, PostgreSQL');
  const [newQSnippet, setNewQSnippet] = useState('');
  const [submittingQ, setSubmittingQ] = useState(false);

  // New Peer Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewDesc, setReviewDesc] = useState('');
  const [reviewRepoUrl, setReviewRepoUrl] = useState('');
  const [reviewFocus, setReviewFocus] = useState('Architecture, Concurrency');
  const [submittingReview, setSubmittingReview] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (selectedTag !== 'All') params.set('tag', selectedTag);
      if (contentTypeFilter !== 'all') params.set('contentType', contentTypeFilter);

      const [postsRes, qRes, reviewsRes] = await Promise.all([
        fetch(`/api/community/posts?${params.toString()}`).then(r => r.json()),
        fetch(`/api/community/questions?${params.toString()}`).then(r => r.json()),
        fetch(`/api/community/reviews?${params.toString()}`).then(r => r.json()),
      ]);

      if (postsRes.success && Array.isArray(postsRes.data)) setPosts(postsRes.data);
      if (qRes.success && Array.isArray(qRes.data)) setQuestions(qRes.data);
      if (reviewsRes.success && Array.isArray(reviewsRes.data)) setPeerReviews(reviewsRes.data);

      setReputation({
        userId: '00000000-0000-0000-0000-000000000000',
        totalReputationPoints: 420,
        acceptedAnswersCount: 8,
        helpfulReviewsCount: 5,
        technicalWriteupsCount: 6,
        verifiedContributionsCount: 12,
        badgeLevel: 'Architect',
      });
    } catch (err) {
      console.error('Failed to load community data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedTag, contentTypeFilter]);

  const handleVotePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/community/posts/${postId}/vote`, { method: 'POST' }).then(r => r.json());
      if (res.success) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, upvotesCount: res.upvotesCount, hasUpvoted: res.hasUpvoted } : p));
      }
    } catch {}
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPost(true);
    try {
      const tags = newPostTags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newPostTitle,
          content: newPostContent,
          contentType: newPostType,
          tags,
          codeSnippet: newPostSnippet || undefined,
          repositoryUrl: newPostRepoUrl || undefined,
          liveDemoUrl: newPostDemoUrl || undefined,
        }),
      }).then(r => r.json());

      if (res.success && res.post) {
        setPosts(prev => [res.post, ...prev]);
        setIsPostModalOpen(false);
        setNewPostTitle('');
        setNewPostContent('');
        setNewPostSnippet('');
        setNewPostRepoUrl('');
        setNewPostDemoUrl('');
      }
    } catch (err) {
      console.error('Failed to publish post:', err);
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingQ(true);
    try {
      const tags = newQTags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await fetch('/api/community/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newQTitle,
          content: newQContent,
          tags,
          codeSnippet: newQSnippet || undefined,
        }),
      }).then(r => r.json());

      if (res.success && res.question) {
        setQuestions(prev => [res.question, ...prev]);
        setIsQuestionModalOpen(false);
        setNewQTitle('');
        setNewQContent('');
        setNewQSnippet('');
      }
    } catch (err) {
      console.error('Failed to post question:', err);
    } finally {
      setSubmittingQ(false);
    }
  };

  const handleCreateReviewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const focusAreas = reviewFocus.split(',').map(f => f.trim()).filter(Boolean);
      const res = await fetch('/api/community/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reviewTitle,
          description: reviewDesc,
          repositoryUrl: reviewRepoUrl,
          focusAreas,
        }),
      }).then(r => r.json());

      if (res.success && res.request) {
        setPeerReviews(prev => [res.request, ...prev]);
        setIsReviewModalOpen(false);
        setReviewTitle('');
        setReviewDesc('');
        setReviewRepoUrl('');
      }
    } catch (err) {
      console.error('Failed to request peer review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const tags = ['All', 'TypeScript', 'React', 'Next.js 15', 'Rust', 'PostgreSQL', 'Performance', 'Architecture', 'Systems', 'DevOps'];

  const contentTypes = [
    { label: 'All Content', value: 'all' },
    { label: 'Showcase', value: 'project_showcase' },
    { label: 'Technical', value: 'technical_discussion' },
    { label: 'Code Help', value: 'code_help' },
    { label: 'Tutorials', value: 'tutorial' },
    { label: 'Progress', value: 'progress_update' },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#08090D] text-slate-900 dark:text-[#F1F5F9] transition-colors">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-6 max-w-[1400px] w-full mx-auto">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/[0.08]">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#6366F1]" />
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Developer Community & Knowledge Network
                </h1>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-[#6366F1]/10 text-indigo-700 dark:text-[#A78BFA] border border-indigo-200 dark:border-[#6366F1]/25">
                  High Signal
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-1">
                Share verified projects, ask technical questions, request peer code reviews, and build auditable community reputation without vanity noise.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {activeTab === 'feed' && (
                <button
                  onClick={() => setIsPostModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6366F1] hover:bg-indigo-600 text-white text-xs font-bold shadow-md shadow-[#6366F1]/25 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Technical Writeup</span>
                </button>
              )}
              {activeTab === 'qa' && (
                <button
                  onClick={() => setIsQuestionModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6366F1] hover:bg-indigo-600 text-white text-xs font-bold shadow-md shadow-[#6366F1]/25 transition-all"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Ask Question</span>
                </button>
              )}
              {activeTab === 'reviews' && (
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6366F1] hover:bg-indigo-600 text-white text-xs font-bold shadow-md shadow-[#6366F1]/25 transition-all"
                >
                  <Code2 className="w-4 h-4" />
                  <span>Request Peer Review</span>
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/[0.08] pb-1 text-xs">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-4 py-2 rounded-t-xl font-mono transition-colors ${
                activeTab === 'feed'
                  ? 'bg-white dark:bg-[#111722] text-[#6366F1] dark:text-[#A78BFA] border-b-2 border-[#6366F1] font-bold shadow-xs'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Engineering Feed ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab('qa')}
              className={`px-4 py-2 rounded-t-xl font-mono transition-colors ${
                activeTab === 'qa'
                  ? 'bg-white dark:bg-[#111722] text-[#6366F1] dark:text-[#A78BFA] border-b-2 border-[#6366F1] font-bold shadow-xs'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Technical Q&A ({questions.length})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2 rounded-t-xl font-mono transition-colors ${
                activeTab === 'reviews'
                  ? 'bg-white dark:bg-[#111722] text-[#6366F1] dark:text-[#A78BFA] border-b-2 border-[#6366F1] font-bold shadow-xs'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Peer Code Reviews ({peerReviews.length})
            </button>
            <button
              onClick={() => setActiveTab('reputation')}
              className={`px-4 py-2 rounded-t-xl font-mono transition-colors ${
                activeTab === 'reputation'
                  ? 'bg-white dark:bg-[#111722] text-[#6366F1] dark:text-[#A78BFA] border-b-2 border-[#6366F1] font-bold shadow-xs'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              My Community Reputation
            </button>
          </div>

          {/* Search & Topic Filters */}
          <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] p-5 rounded-2xl space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-[#64748B]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') loadData(); }}
                  placeholder="Search technical discussions, code help, repositories, or topics..."
                  className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:border-[#6366F1] transition-colors"
                />
              </div>

              <button
                onClick={loadData}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#6366F1] hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-md shadow-[#6366F1]/20"
              >
                Search Knowledge
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {tags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTag(t)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-mono transition-colors shrink-0 ${
                      selectedTag === t
                        ? 'bg-[#6366F1] text-white font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-[#111722] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {activeTab === 'feed' && (
                <div className="flex items-center gap-1.5">
                  {contentTypes.map((ct) => (
                    <button
                      key={ct.value}
                      onClick={() => setContentTypeFilter(ct.value)}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${
                        contentTypeFilter === ct.value
                          ? 'bg-slate-200 dark:bg-white/[0.1] text-slate-900 dark:text-white font-semibold'
                          : 'text-slate-500 dark:text-[#64748B] hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {ct.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* TAB 1: ENGINEERING FEED */}
          {activeTab === 'feed' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-20 text-xs text-slate-500 dark:text-[#64748B]">Loading community feed...</div>
              ) : posts.length === 0 ? (
                <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-12 text-center space-y-3 shadow-sm">
                  <MessageSquare className="w-8 h-8 text-slate-400 dark:text-[#64748B] mx-auto" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">No discussions found</h3>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8]">Be the first to publish a project showcase or technical breakdown.</p>
                </div>
              ) : (
                posts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16] rounded-2xl p-6 transition-all space-y-4 shadow-sm"
                  >
                    {/* Top Author & Category Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={post.author.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4'}
                          alt={post.author.name}
                          className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/[0.1] object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{post.author.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/[0.04] text-[#6366F1] dark:text-[#A78BFA] border border-slate-200 dark:border-white/[0.06]">
                              {post.author.dccLevel || 'Elite'} ({post.author.overallScore || 840})
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-[#64748B]">
                            @{post.author.username} • {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-[#8B5CF6]/15 text-indigo-700 dark:text-[#A78BFA] border border-indigo-200 dark:border-[#8B5CF6]/25 uppercase">
                        {post.contentType.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Title & Body */}
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{post.title}</h3>
                      <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed whitespace-pre-line">
                        {post.content}
                      </p>
                    </div>

                    {/* Code Snippet if present */}
                    {post.codeSnippet && (
                      <div className="p-3.5 rounded-xl bg-[#070A0F] border border-white/[0.06] overflow-x-auto">
                        <pre className="font-mono text-xs text-[#38BDF8] leading-relaxed">
                          <code>{post.codeSnippet}</code>
                        </pre>
                      </div>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {post.tags.map((t) => (
                        <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#111722] text-[#E2E8F0] border border-white/[0.04]">
                          #{t}
                        </span>
                      ))}
                    </div>

                    {/* Interactions Footer */}
                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3 text-xs text-[#94A3B8]">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleVotePost(post.id)}
                          className={`flex items-center gap-1.5 transition-colors ${
                            post.hasUpvoted ? 'text-[#8B5CF6] font-bold' : 'hover:text-white'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span className="font-mono">{post.upvotesCount}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="font-mono">{post.commentsCount} comments</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {post.repositoryUrl && (
                          <a
                            href={post.repositoryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] font-mono text-[#A78BFA] hover:underline"
                          >
                            <Github className="w-3.5 h-3.5" />
                            <span>Repository</span>
                          </a>
                        )}
                        {post.liveDemoUrl && (
                          <a
                            href={post.liveDemoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] font-mono text-[#10B981] hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Live Demo</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: TECHNICAL Q&A */}
          {activeTab === 'qa' && (
            <div className="space-y-4">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="bg-[#0D121A] border border-white/[0.08] hover:border-white/[0.16] rounded-2xl p-6 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={q.author.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4'}
                        alt={q.author.name}
                        className="w-10 h-10 rounded-full border border-white/[0.1]"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{q.author.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.04] text-[#A78BFA]">
                            @{q.author.username}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#64748B]">
                          {new Date(q.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                      q.status === 'answered'
                        ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/25'
                        : 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/25'
                    }`}>
                      {q.status === 'answered' ? '✓ Solved' : 'Open Question'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-white">{q.title}</h3>
                    <p className="text-xs text-[#94A3B8] leading-relaxed whitespace-pre-line">{q.content}</p>
                  </div>

                  {q.codeSnippet && (
                    <div className="p-3.5 rounded-xl bg-[#070A0F] border border-white/[0.06] overflow-x-auto">
                      <pre className="font-mono text-xs text-[#38BDF8] leading-relaxed">
                        <code>{q.codeSnippet}</code>
                      </pre>
                    </div>
                  )}

                  {/* Accepted Answer Preview */}
                  {q.answers && q.answers.length > 0 && (
                    <div className="pt-3 border-t border-white/[0.06] space-y-2">
                      <span className="text-[10px] font-mono text-[#10B981] uppercase font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Accepted Answer by {q.answers[0].author.name} (+25 Community Rep):
                      </span>
                      <div className="p-3.5 rounded-xl bg-[#111722] border border-[#10B981]/20 text-xs text-[#E2E8F0] space-y-2">
                        <p>{q.answers[0].content}</p>
                        {q.answers[0].codeSnippet && (
                          <pre className="p-2 rounded bg-[#070A0F] font-mono text-[11px] text-[#38BDF8] overflow-x-auto">
                            <code>{q.answers[0].codeSnippet}</code>
                          </pre>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 text-xs text-[#64748B]">
                    <div className="flex items-center gap-4">
                      <span>{q.upvotesCount} Upvotes</span>
                      <span>•</span>
                      <span>{q.answersCount} Answers</span>
                    </div>

                    <Link
                      href={`/community/questions/${q.id}`}
                      className="px-3.5 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold transition-all shadow-md shadow-[#8B5CF6]/20"
                    >
                      View Discussion & Answer
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: PEER CODE REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {peerReviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-[#0D121A] border border-white/[0.08] hover:border-white/[0.16] rounded-2xl p-6 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={r.requester.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4'}
                        alt={r.requester.name}
                        className="w-10 h-10 rounded-full border border-white/[0.1]"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">{r.requester.name}</span>
                        <span className="text-[10px] font-mono text-[#64748B]">
                          @{r.requester.username} • {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/25 uppercase font-bold">
                      {r.status}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold text-white">{r.title}</h3>
                    <p className="text-xs text-[#94A3B8]">{r.description}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#111722] border border-white/[0.04] flex items-center justify-between text-xs">
                    <span className="text-[11px] font-mono text-[#64748B]">Focus Areas:</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {r.focusAreas.map(f => (
                        <span key={f} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#070A0F] text-[#A78BFA]">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {r.responses && r.responses.length > 0 && (
                    <div className="p-4 rounded-xl bg-[#111722] border border-white/[0.06] space-y-2 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                        <span className="font-bold text-white">Peer Audit by {r.responses[0].reviewer.name}</span>
                        <span className="font-mono text-[#10B981] font-bold">Quality: {r.responses[0].codeQualityScore}/100</span>
                      </div>
                      <p className="text-[#94A3B8] text-[11px]">{r.responses[0].feedbackNotes}</p>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <a
                      href={r.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] font-mono text-[#38BDF8] hover:underline"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>{r.repositoryUrl}</span>
                    </a>

                    <Link
                      href={`/community/reviews/${r.id}`}
                      className="px-3.5 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold transition-all shadow-md shadow-[#8B5CF6]/20"
                    >
                      Audit & Provide Feedback
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: MY COMMUNITY REPUTATION */}
          {activeTab === 'reputation' && (
            <div className="bg-[#0D121A] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-[#A78BFA] uppercase tracking-wider block">
                    Auditable Community Ledger
                  </span>
                  <h3 className="text-xl font-bold text-white">Community Reputation & Contributions</h3>
                  <p className="text-xs text-[#94A3B8]">
                    Earned through verified peer reviews, accepted Q&A answers, and open-source contributions. Kept strictly separate from the core DCC score.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#111722] border border-[#8B5CF6]/30 text-center shrink-0">
                  <span className="text-2xl font-mono font-bold text-[#A78BFA] block">
                    {reputation?.totalReputationPoints || 420} pts
                  </span>
                  <span className="text-[10px] font-mono text-[#64748B] uppercase">
                    Badge: {reputation?.badgeLevel || 'Architect'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#111722] border border-white/[0.04] space-y-1">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase">Accepted Answers</span>
                  <h4 className="text-lg font-bold text-white">{reputation?.acceptedAnswersCount || 8}</h4>
                </div>
                <div className="p-4 rounded-xl bg-[#111722] border border-white/[0.04] space-y-1">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase">Peer Code Reviews</span>
                  <h4 className="text-lg font-bold text-white">{reputation?.helpfulReviewsCount || 5}</h4>
                </div>
                <div className="p-4 rounded-xl bg-[#111722] border border-white/[0.04] space-y-1">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase">Technical Writeups</span>
                  <h4 className="text-lg font-bold text-white">{reputation?.technicalWriteupsCount || 6}</h4>
                </div>
                <div className="p-4 rounded-xl bg-[#111722] border border-white/[0.04] space-y-1">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase">Evidence Items Linked</span>
                  <h4 className="text-lg font-bold text-[#10B981]">{reputation?.verifiedContributionsCount || 12}</h4>
                </div>
              </div>
            </div>
          )}

          {/* Modal 1: New Technical Writeup */}
          {isPostModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="bg-[#0D121A] border border-white/[0.1] rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#8B5CF6]" />
                    <h3 className="text-sm font-bold text-white">Publish Technical Writeup</h3>
                  </div>
                </div>

                <form onSubmit={handleCreatePost} className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-[11px] font-mono text-[#64748B] block mb-1">Title *</label>
                    <input
                      type="text"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      placeholder="e.g. Zero-Alloc Buffer Pools in Rust"
                      required
                      className="w-full bg-[#111722] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-[#64748B] block mb-1">Content Type</label>
                      <select
                        value={newPostType}
                        onChange={(e) => setNewPostType(e.target.value as CommunityContentType)}
                        className="w-full bg-[#111722] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="technical_discussion">Technical Discussion</option>
                        <option value="project_showcase">Project Showcase</option>
                        <option value="code_help">Code Help</option>
                        <option value="tutorial">Tutorial</option>
                        <option value="progress_update">Progress Update</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-[#64748B] block mb-1">Tags (Comma-separated)</label>
                      <input
                        type="text"
                        value={newPostTags}
                        onChange={(e) => setNewPostTags(e.target.value)}
                        placeholder="e.g. TypeScript, WebGL"
                        className="w-full bg-[#111722] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-[#64748B] block mb-1">Writeup Content *</label>
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      rows={3}
                      placeholder="Explain your technical insight, benchmark findings, or architectural tradeoffs..."
                      required
                      className="w-full bg-[#111722] border border-white/[0.08] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-[#64748B] block mb-1">Code Snippet (Optional)</label>
                    <textarea
                      value={newPostSnippet}
                      onChange={(e) => setNewPostSnippet(e.target.value)}
                      rows={3}
                      placeholder="// Code snippet..."
                      className="w-full bg-[#111722] border border-white/[0.08] rounded-xl p-3 text-xs text-[#38BDF8] font-mono focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-[#64748B] block mb-1">Repository URL</label>
                      <input
                        type="url"
                        value={newPostRepoUrl}
                        onChange={(e) => setNewPostRepoUrl(e.target.value)}
                        placeholder="https://github.com/user/project"
                        className="w-full bg-[#111722] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-[#64748B] block mb-1">Demo URL</label>
                      <input
                        type="url"
                        value={newPostDemoUrl}
                        onChange={(e) => setNewPostDemoUrl(e.target.value)}
                        placeholder="https://project.vercel.app"
                        className="w-full bg-[#111722] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => setIsPostModalOpen(false)}
                      className="px-4 py-2 text-xs text-[#94A3B8] hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingPost}
                      className="px-5 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-[#8B5CF6]/25"
                    >
                      {submittingPost ? 'Publishing...' : 'Publish to Feed'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal 2: Ask Question */}
          {isQuestionModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="bg-[#0D121A] border border-white/[0.1] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-[#8B5CF6]" />
                    <h3 className="text-sm font-bold text-white">Ask Technical Question</h3>
                  </div>
                </div>

                <form onSubmit={handleCreateQuestion} className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-[11px] font-mono text-[#64748B] block mb-1">Question Title *</label>
                    <input
                      type="text"
                      value={newQTitle}
                      onChange={(e) => setNewQTitle(e.target.value)}
                      placeholder="e.g. How to optimize PostgreSQL jsonb index?"
                      required
                      className="w-full bg-[#111722] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-[#64748B] block mb-1">Description & Problem Statement *</label>
                    <textarea
                      value={newQContent}
                      onChange={(e) => setNewQContent(e.target.value)}
                      rows={3}
                      placeholder="Describe what you tried, the observed behavior, and expected outcome..."
                      required
                      className="w-full bg-[#111722] border border-white/[0.08] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-[#64748B] block mb-1">Code Snippet (Optional)</label>
                    <textarea
                      value={newQSnippet}
                      onChange={(e) => setNewQSnippet(e.target.value)}
                      rows={3}
                      placeholder="// Code example..."
                      className="w-full bg-[#111722] border border-white/[0.08] rounded-xl p-3 text-xs text-[#38BDF8] font-mono focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => setIsQuestionModalOpen(false)}
                      className="px-4 py-2 text-xs text-[#94A3B8] hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingQ}
                      className="px-5 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-[#8B5CF6]/25"
                    >
                      {submittingQ ? 'Posting...' : 'Post Question'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal 3: Request Peer Review */}
          {isReviewModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="bg-[#0D121A] border border-white/[0.1] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-[#8B5CF6]" />
                    <h3 className="text-sm font-bold text-white">Request Peer Code Review</h3>
                  </div>
                </div>

                <form onSubmit={handleCreateReviewRequest} className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-[11px] font-mono text-[#64748B] block mb-1">Title *</label>
                    <input
                      type="text"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="e.g. Peer Review: Distributed Sliding-Window Rate Limiter"
                      required
                      className="w-full bg-[#111722] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-[#64748B] block mb-1">Public GitHub Repository URL *</label>
                    <input
                      type="url"
                      value={reviewRepoUrl}
                      onChange={(e) => setReviewRepoUrl(e.target.value)}
                      placeholder="https://github.com/username/repo"
                      required
                      className="w-full bg-[#111722] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-[#64748B] block mb-1">Review Focus & Questions *</label>
                    <textarea
                      value={reviewDesc}
                      onChange={(e) => setReviewDesc(e.target.value)}
                      rows={3}
                      placeholder="Specify areas where you'd like feedback (e.g. concurrency safety, performance bottlenecks)..."
                      required
                      className="w-full bg-[#111722] border border-white/[0.08] rounded-xl p-3 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => setIsReviewModalOpen(false)}
                      className="px-4 py-2 text-xs text-[#94A3B8] hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-5 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-[#8B5CF6]/25"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Request'}
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
