'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import { 
  Star, GitFork, Cpu, CheckCircle2, AlertCircle, Calendar, 
  BookOpen, Code2, Layers, ShieldAlert, ArrowLeft, RefreshCw, BarChart4,
  Flame, ShieldCheck, Heart, Sparkles, Award, ListChecks, ArrowLeftRight, Clock, Dna, HelpCircle
} from 'lucide-react';
import Link from 'next/link';

interface RepositoryDetails {
  id: string;
  githubRepoId: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  language: string | null;
  stars: number;
  forks: number;
  isAnalyzed: boolean;
  analyzedAt: string | null;
  reviewStatus: 'idle' | 'pending' | 'running' | 'completed' | 'failed';
  metadata?: {
    owner: string;
    defaultBranch: string;
    languagesBreakdown: Record<string, number>;
    openIssues: number;
    createdAt: string;
    updatedAt: string;
    topics: string[];
  };
  summary?: {
    framework: string;
    languages: string[];
    libraries: string[];
    projectType: 'Frontend' | 'Backend' | 'Fullstack' | 'Library' | 'Mobile' | 'Unknown';
    complexity: 'Low' | 'Medium' | 'High';
    folderStructure: string[];
    developmentActivity: 'Low' | 'Medium' | 'High';
  };
}

interface ReviewDetails {
  id: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  architecture: string;
  codeQuality: string;
  documentation: string;
  bestPractices: string;
  suggestedLearning: string[];
  overallScore: number;
  confidenceScore: number;
  healthScores?: any;
  intelligenceReport?: any;
  aiExplainability?: any;
  skillsExtracted?: any;
}

export default function RepositoryDetailPage({ params }: { params: any }) {
  const unwrappedParams = React.use<{ id: string }>(params);
  const id = unwrappedParams.id;

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [repo, setRepo] = useState<RepositoryDetails | null>(null);
  const [review, setReview] = useState<ReviewDetails | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'review' | 'health' | 'intelligence' | 'timeline' | 'history'>('review');

  // Timeline & History States
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [reviewHistoryList, setReviewHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Version Comparison state
  const [compareVerA, setCompareVerA] = useState<string>('');
  const [compareVerB, setCompareVerB] = useState<string>('');
  const [compDetailsA, setCompDetailsA] = useState<any>(null);
  const [compDetailsB, setCompDetailsB] = useState<any>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load profile
      const profRes = await fetch('/api/profile');
      const profJson = await profRes.json();
      if (profJson.success) {
        setProfile(profJson.data);
      }

      // Load repository details
      const repoRes = await fetch(`/api/repositories/${id}`);
      const repoJson = await repoRes.json();
      if (repoJson.success) {
        setRepo(repoJson.data);
        
        // If review is completed, fetch details
        if (repoJson.data.reviewStatus === 'completed') {
          fetchReview();
          loadTimeline();
          loadHistory();
        }
        // If review is in progress, auto-start polling
        else if (repoJson.data.reviewStatus === 'running' || repoJson.data.reviewStatus === 'pending') {
          setAnalyzing(true);
          startPolling();
        }
      } else {
        setError(repoJson.error || 'Failed to load repository details');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred loading the details');
    } finally {
      setLoading(false);
    }
  };

  const fetchReview = async () => {
    try {
      const reviewRes = await fetch(`/api/repositories/${id}/review`);
      const reviewJson = await reviewRes.json();
      if (reviewJson.success) {
        setReview(reviewJson.data);
      }
    } catch (err) {
      console.error('Failed to load review details:', err);
    }
  };

  const loadTimeline = async () => {
    setLoadingTimeline(true);
    try {
      const res = await fetch(`/api/repository/${id}/timeline`);
      const json = await res.json();
      if (json.success) setTimelineEvents(json.data || []);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/history?repositoryId=${id}`);
      const json = await res.json();
      if (json.success) {
        const list = json.data || [];
        setReviewHistoryList(list);
        if (list.length > 0) setCompareVerA(list[0].id);
        if (list.length > 1) setCompareVerB(list[1].id);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (compareVerA && reviewHistoryList.length > 0) {
      setCompDetailsA(reviewHistoryList.find(h => h.id === compareVerA));
    }
  }, [compareVerA, reviewHistoryList]);

  useEffect(() => {
    if (compareVerB && reviewHistoryList.length > 0) {
      setCompDetailsB(reviewHistoryList.find(h => h.id === compareVerB));
    }
  }, [compareVerB, reviewHistoryList]);

  useEffect(() => {
    loadData();
    return () => stopPolling();
  }, [id]);

  // Polling Status Logic
  const startPolling = () => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/repositories/${id}`);
        const json = await res.json();
        if (json.success) {
          const updatedRepo = json.data;
          setRepo(updatedRepo);

          if (updatedRepo.reviewStatus === 'completed') {
            stopPolling();
            setAnalyzing(false);
            fetchReview();
            loadTimeline();
            loadHistory();
            // Refresh profile to update trust scores on sidebar
            const profRes = await fetch('/api/profile');
            const profJson = await profRes.json();
            if (profJson.success) {
              setProfile(profJson.data);
            }
          } else if (updatedRepo.reviewStatus === 'failed') {
            stopPolling();
            setAnalyzing(false);
            setError('AI Review process failed. Please try again.');
          }
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleStartReview = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    setError(null);
    try {
      // Step 1: Trigger global POST analyze endpoint enqueuing background job
      const analyzeRes = await fetch(`/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubRepoId: repo?.githubRepoId,
          fullName: repo?.fullName,
          name: repo?.name,
          language: repo?.language,
        })
      });
      const analyzeJson = await analyzeRes.json();
      if (!analyzeJson.success) {
        throw new Error(analyzeJson.error || 'Repository file discovery failed');
      }
      setRepo(prev => prev ? { ...prev, reviewStatus: 'pending' } : null);
      startPolling();
    } catch (err: any) {
      setError(err.message || 'An error occurred triggering the review');
      setAnalyzing(false);
    }
  };

  const totalBytes = repo?.metadata?.languagesBreakdown 
    ? Object.values(repo.metadata.languagesBreakdown).reduce((a, b) => a + b, 0)
    : 0;

  const sortedLanguages = repo?.metadata?.languagesBreakdown
    ? Object.entries(repo.metadata.languagesBreakdown).sort((a, b) => b[1] - a[1])
    : [];

  const getLanguagePercentage = (bytes: number, total: number) => {
    if (total === 0) return '0%';
    return `${((bytes / total) * 100).toFixed(1)}%`;
  };

  const getLangBg = (lang: string) => {
    const map: Record<string, string> = {
      TypeScript: 'bg-blue-500', JavaScript: 'bg-yellow-500', Python: 'bg-sky-400',
      Go: 'bg-cyan-500', Rust: 'bg-orange-500', HTML: 'bg-red-500',
      CSS: 'bg-violet-500', Java: 'bg-amber-600', Ruby: 'bg-rose-500',
    };
    return map[lang] || 'bg-zinc-500';
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <Navbar user={profile?.profile} />
      <div className="flex flex-1">
        <Sidebar trustScore={profile?.trustScore} />
        
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            
            {/* Back link */}
            <div className="flex items-center">
              <Link 
                href="/repositories"
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Explorer
              </Link>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                <span className="sv-spinner h-8 w-8 text-violet-500" />
                <p className="text-zinc-400 text-xs">Loading repository metrics...</p>
              </div>
            ) : error || !repo ? (
              <div className="glass-card rounded-xl p-8 flex flex-col items-center text-center gap-3">
                <AlertCircle className="h-10 w-10 text-red-500" />
                <h3 className="text-lg font-bold">Failed to load details</h3>
                <p className="text-zinc-400 text-xs max-w-md">{error || 'Repository details could not be found.'}</p>
                <button 
                  onClick={loadData}
                  className="mt-2 flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-xs font-semibold hover:bg-zinc-850"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Try Again
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                
                {/* Header section */}
                <div className="glass-card rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="text-2xl font-extrabold tracking-tight">{repo.name}</h1>
                      {repo.reviewStatus === 'completed' ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" />
                          Audit Completed
                        </span>
                      ) : repo.reviewStatus === 'running' || repo.reviewStatus === 'pending' ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-full animate-pulse">
                          <Cpu className="h-3 w-3" />
                          Job Enqueued...
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-800 border border-zinc-700 px-2.5 py-0.5 rounded-full">
                          Unreviewed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400">
                      Full Path: <a href={repo.htmlUrl} target="_blank" rel="noopener noreferrer" className="hover:text-violet-400 hover:underline">{repo.fullName}</a>
                    </p>
                    <p className="text-xs text-zinc-400 mt-2 max-w-2xl">
                      {repo.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="flex flex-col sm:items-end gap-3 shrink-0">
                    <button
                      onClick={handleStartReview}
                      disabled={analyzing || repo.reviewStatus === 'running' || repo.reviewStatus === 'pending'}
                      className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-500 transition-all duration-250 active:scale-97 disabled:bg-zinc-850 disabled:text-zinc-600 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      {analyzing || repo.reviewStatus === 'running' || repo.reviewStatus === 'pending' ? (
                        <>
                          <span className="sv-spinner h-3.5 w-3.5 text-white" />
                          Executing Scan...
                        </>
                      ) : (
                        <>
                          <Cpu className="h-4 w-4" />
                          {repo.reviewStatus === 'completed' ? 'Re-Trigger Audit Pipeline' : 'Run Audit Pipeline'}
                        </>
                      )}
                    </button>
                    {repo.isAnalyzed && repo.analyzedAt && (
                      <span className="text-[10px] text-zinc-500">
                        Last audited {new Date(repo.analyzedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Indicator */}
                {(repo.reviewStatus === 'running' || repo.reviewStatus === 'pending') && (
                  <div className="glass-card rounded-xl p-8 flex flex-col items-center justify-center gap-4 text-center py-16">
                    <Sparkles className="h-10 w-10 text-violet-500 animate-pulse" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Running background intelligence pipeline...</h3>
                      <p className="text-zinc-400 text-[10px] mt-1 max-w-md">
                        We are scanning repository files, mapping directory folders, evaluating locked dependency components, and preparing intelligence reports.
                      </p>
                    </div>
                    <div className="h-1.5 w-64 bg-zinc-900 rounded-full overflow-hidden mt-2 border border-zinc-800">
                      <div className="h-full bg-violet-600 rounded-full animate-[shimmer_2s_infinite]" style={{ width: '60%' }} />
                    </div>
                  </div>
                )}

                {/* Sub Tab View selectors */}
                {repo.reviewStatus === 'completed' && review && (
                  <div className="flex flex-col gap-6">
                    <div className="flex border-b border-zinc-900 pb-0.5 gap-6">
                      {[
                        { id: 'review', label: 'Explainable AI Review', icon: Sparkles },
                        { id: 'health', label: 'Health Dashboard', icon: Heart },
                        { id: 'intelligence', label: 'Intelligence Report', icon: Dna },
                        { id: 'timeline', label: 'Repository Timeline', icon: Clock },
                        { id: 'history', label: 'Version History', icon: Layers },
                      ].map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 pb-2.5 text-xs font-bold transition-all relative ${
                              isActive ? 'text-violet-400 border-b-2 border-violet-500' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Tab Content 1: AI Explainable Review */}
                    {activeTab === 'review' && (
                      <div className="flex flex-col gap-6">
                        
                        {/* Overall Breakdown card */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          <div className="glass-card rounded-xl p-6 md:col-span-1 flex flex-col items-center justify-center text-center gap-3">
                            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Explainable Score</span>
                            <div className="relative flex items-center justify-center h-24 w-24 rounded-full border-4 border-violet-500/20 bg-zinc-900/40">
                              <span className="text-3xl font-black text-white">{review.overallScore}</span>
                              <span className="text-[8px] text-zinc-500 absolute bottom-2">/ 100</span>
                            </div>
                            <span className="text-[10px] text-zinc-400">Confidence: <b>{review.confidenceScore}%</b></span>
                          </div>

                          <div className="glass-card rounded-xl p-6 md:col-span-3 flex flex-col gap-3">
                            <h3 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 uppercase pl-0.5 border-b border-zinc-900 pb-2">
                              <Award className="h-4 w-4 text-violet-400" />
                              Audit Findings Executive Summary
                            </h3>
                            <p className="text-xs text-zinc-300 leading-relaxed font-medium pl-0.5">
                              {review.summary}
                            </p>
                            {review.aiExplainability && (
                              <div className="flex flex-col gap-1 text-[11px] text-zinc-400 bg-zinc-900/30 border border-zinc-900/50 p-3 rounded-lg mt-1">
                                <span className="font-bold text-zinc-300">Evidence audit reasoning:</span>
                                <span>{review.aiExplainability.reasoning}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Positive / Negative factors list */}
                        {review.aiExplainability && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glass-card rounded-xl p-5 flex flex-col gap-3">
                              <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase pl-0.5">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                Positive Findings
                              </h3>
                              <ul className="flex flex-col gap-2 list-disc list-inside text-xs text-zinc-300">
                                {review.strengths.map((str, idx) => (
                                  <li key={idx} className="leading-relaxed">{str}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="glass-card rounded-xl p-5 flex flex-col gap-3">
                              <h3 className="text-xs font-bold text-red-400 flex items-center gap-1.5 uppercase pl-0.5">
                                <ShieldAlert className="h-4 w-4 text-red-400" />
                                Key Problems Found
                              </h3>
                              <ul className="flex flex-col gap-2 list-disc list-inside text-xs text-zinc-300">
                                {review.weaknesses.map((weak, idx) => (
                                  <li key={idx} className="leading-relaxed">{weak}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* Roadmap suggested fixes */}
                        <div className="glass-card rounded-xl p-5 flex flex-col gap-3">
                          <h3 className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 uppercase pl-0.5">
                            <ListChecks className="h-4 w-4 text-violet-400" />
                            Suggested Fixes & Learning Resources
                          </h3>
                          <ul className="flex flex-col gap-2.5 text-xs text-zinc-300 mt-1 pl-1">
                            {review.suggestedLearning.map((rec, idx) => (
                              <li key={idx} className="flex gap-2.5 items-start leading-relaxed">
                                <span className="h-4.5 w-4.5 shrink-0 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 text-[10px] flex items-center justify-center font-bold">
                                  {idx + 1}
                                </span>
                                <div className="flex flex-col">
                                  <span>{rec}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>

                      </div>
                    )}

                    {/* Tab Content 2: Health Dashboard */}
                    {activeTab === 'health' && (
                      <div className="flex flex-col gap-6">
                        
                        {/* Overall health and list */}
                        {review.healthScores ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* Category items */}
                            <div className="glass-card rounded-xl p-6 md:col-span-2 flex flex-col gap-4">
                              <h3 className="text-sm font-bold text-zinc-300 border-b border-zinc-900 pb-2">Category Scores</h3>
                              <div className="flex flex-col gap-4">
                                {Object.entries(review.healthScores.categories || {}).map(([key, category]: any) => (
                                  <div key={key} className="flex flex-col gap-1.5">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-zinc-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                      <span className="font-semibold text-zinc-200">{category.score}% (Grade {category.grade})</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
                                      <div className="h-full bg-violet-600 rounded-full animate-pulse" style={{ width: `${category.score}%` }} />
                                    </div>
                                    <span className="text-[10px] text-zinc-500 font-medium pl-0.5">{category.evidence}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Recommendations side list */}
                            <div className="flex flex-col gap-6">
                              <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3">
                                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Overall Health</span>
                                <div className="relative flex items-center justify-center h-24 w-24 rounded-full border-4 border-violet-500/20 bg-zinc-900/40">
                                  <span className="text-3xl font-black text-white">{review.healthScores.overallHealth}</span>
                                  <span className="text-[8px] text-zinc-500 absolute bottom-2">/ 100</span>
                                </div>
                              </div>

                              <div className="glass-card rounded-xl p-5 flex flex-col gap-3">
                                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Improvement Recommendations</h3>
                                <div className="flex flex-col gap-3">
                                  {review.healthScores.recommendations?.map((rec: any, idx: number) => (
                                    <div key={idx} className="bg-zinc-900/50 border border-zinc-900 rounded-lg p-3 flex flex-col gap-1">
                                      <div className="flex justify-between items-center text-[10px] font-bold">
                                        <span className="text-zinc-300">{rec.category}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] ${
                                          rec.impact === 'High' ? 'text-red-400 bg-red-500/10' : 'text-yellow-400 bg-yellow-500/10'
                                        }`}>{rec.impact} Impact</span>
                                      </div>
                                      <p className="text-[10px] text-zinc-400 font-semibold">{rec.message}</p>
                                      <p className="text-[9px] text-zinc-500 italic mt-0.5">{rec.actionableStep}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                          </div>
                        ) : (
                          <div className="glass-card rounded-xl p-8 text-center text-zinc-500 text-xs">
                            No health scoring metrics extracted. Please trigger review.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab Content 3: Intelligence Report */}
                    {activeTab === 'intelligence' && (
                      <div className="flex flex-col gap-6">
                        {review.intelligenceReport ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* Structure */}
                            <div className="glass-card rounded-xl p-5 flex flex-col gap-4">
                              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-900 pb-2">Folder Layout</h3>
                              <div className="flex flex-col gap-2.5 text-xs text-zinc-300">
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Architecture Style:</span>
                                  <span className="font-semibold text-zinc-200">{review.intelligenceReport.architectureStyle}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Max Folder Depth:</span>
                                  <span className="font-semibold text-zinc-200">{review.intelligenceReport.structure.folderDepth} levels</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Total Scanned Files:</span>
                                  <span className="font-semibold text-zinc-200">{review.intelligenceReport.structure.totalFilesCount} files</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Has src/ directory:</span>
                                  <span className="font-semibold text-zinc-200">{review.intelligenceReport.structure.hasSrcFolder ? 'Yes' : 'No'}</span>
                                </div>
                              </div>

                              <div className="flex flex-col gap-1 border-t border-zinc-900 pt-3">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase">Root folders:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {review.intelligenceReport.structure.foldersList.map((f: string) => (
                                    <span key={f} className="text-[9px] bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400 font-mono">/{f}</span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Configuration files */}
                            <div className="glass-card rounded-xl p-5 flex flex-col gap-4">
                              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-900 pb-2">Configs Audited</h3>
                              <div className="flex flex-col gap-3">
                                {review.intelligenceReport.configs.map((cfg: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center text-xs">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-semibold text-zinc-300">{cfg.name}</span>
                                      <span className="text-[9px] text-zinc-500">{cfg.purpose}</span>
                                    </div>
                                    {cfg.detected ? (
                                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Detected</span>
                                    ) : (
                                      <span className="text-[9px] font-bold text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded">Missing</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Dependencies info */}
                            <div className="glass-card rounded-xl p-5 flex flex-col gap-4">
                              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-900 pb-2">Manifest Details</h3>
                              <div className="flex flex-col gap-3 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Framework:</span>
                                  <span className="font-semibold text-zinc-200">{review.intelligenceReport.dependencies.framework}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Package Manager:</span>
                                  <span className="font-semibold text-zinc-200 uppercase">{review.intelligenceReport.dependencies.packageManager}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Build Tool:</span>
                                  <span className="font-semibold text-zinc-200">{review.intelligenceReport.dependencies.buildTool}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">Total Dependencies:</span>
                                  <span className="font-semibold text-zinc-200">{review.intelligenceReport.dependencies.totalDependencies} packages</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-zinc-500">TypeScript configured:</span>
                                  <span className="font-semibold text-zinc-200">{review.intelligenceReport.dependencies.hasTypeScript ? 'Yes' : 'No'}</span>
                                </div>
                              </div>
                            </div>

                          </div>
                        ) : (
                          <div className="glass-card rounded-xl p-8 text-center text-zinc-500 text-xs">
                            No intelligence metrics compiled. Please audit repository.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab Content 4: Repository Timeline */}
                    {activeTab === 'timeline' && (
                      <div className="flex flex-col gap-6">
                        {loadingTimeline ? (
                          <div className="flex justify-center py-10">
                            <span className="sv-spinner h-6 w-6 text-violet-500" />
                          </div>
                        ) : timelineEvents.length === 0 ? (
                          <div className="glass-card rounded-xl p-8 text-center text-zinc-500 text-xs">
                            No events loaded for timeline.
                          </div>
                        ) : (
                          <div className="glass-card rounded-xl p-6 flex flex-col gap-6">
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-0.5">Interactive Audit Trail</h3>
                            <div className="relative pl-6 border-l border-zinc-900 flex flex-col gap-6">
                              {timelineEvents.map((evt: any, idx: number) => (
                                <div key={evt.id} className="relative">
                                  {/* Dot */}
                                  <span className={`absolute -left-[30px] top-1.5 h-3.5 w-3.5 rounded-full border-4 border-zinc-950 ${
                                    evt.type === 'creation' ? 'bg-zinc-600' :
                                    evt.type === 'commit' ? 'bg-blue-500' :
                                    evt.type === 'review' ? 'bg-violet-600' : 'bg-emerald-500'
                                  }`} />
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-bold text-zinc-200">{evt.title}</span>
                                    <span className="text-[10px] text-zinc-400 font-semibold">{evt.description}</span>
                                    <span className="text-[9px] text-zinc-600 mt-1">{new Date(evt.timestamp).toLocaleString()}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab Content 5: Version History */}
                    {activeTab === 'history' && (
                      <div className="flex flex-col gap-6">
                        {loadingHistory ? (
                          <div className="flex justify-center py-10">
                            <span className="sv-spinner h-6 w-6 text-violet-500" />
                          </div>
                        ) : reviewHistoryList.length === 0 ? (
                          <div className="glass-card rounded-xl p-8 text-center text-zinc-500 text-xs">
                            No history records logged.
                          </div>
                        ) : (
                          <div className="flex flex-col gap-6">
                            
                            {/* Version Selector for comparison */}
                            <div className="glass-card rounded-xl p-5 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                              <div className="md:col-span-2 flex flex-col gap-1.5">
                                <label className="text-[9px] text-zinc-500 font-bold uppercase">Version A (Baseline)</label>
                                <select
                                  value={compareVerA}
                                  onChange={e => setCompareVerA(e.target.value)}
                                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none text-white w-full"
                                >
                                  {reviewHistoryList.map(h => (
                                    <option key={h.id} value={h.id}>v{h.version} ({new Date(h.createdAt).toLocaleDateString()})</option>
                                  ))}
                                </select>
                              </div>
                              <div className="md:col-span-1 flex justify-center text-zinc-500">
                                <ArrowLeftRight className="h-4 w-4" />
                              </div>
                              <div className="md:col-span-2 flex flex-col gap-1.5">
                                <label className="text-[9px] text-zinc-500 font-bold uppercase">Version B (Comparison)</label>
                                <select
                                  value={compareVerB}
                                  onChange={e => setCompareVerB(e.target.value)}
                                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none text-white w-full"
                                  disabled={reviewHistoryList.length < 2}
                                >
                                  {reviewHistoryList.length < 2 ? (
                                    <option>Run more audits to generate version history</option>
                                  ) : (
                                    reviewHistoryList.map(h => (
                                      <option key={h.id} value={h.id}>v{h.version} ({new Date(h.createdAt).toLocaleDateString()})</option>
                                    ))
                                  )}
                                </select>
                              </div>
                            </div>

                            {/* Side by side comparison details */}
                            {compDetailsA && compDetailsB && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* Version A */}
                                <div className="glass-card rounded-xl p-5 flex flex-col gap-4 border border-zinc-900">
                                  <div className="border-b border-zinc-900 pb-2">
                                    <span className="text-[9px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">Version {compDetailsA.version}</span>
                                    <h4 className="text-xs font-bold text-zinc-300 mt-2">{compDetailsA.summary.slice(0, 100)}...</h4>
                                  </div>
                                  
                                  <div className="flex flex-col gap-2.5 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">Overall Score:</span>
                                      <span className="font-semibold text-zinc-300">{compDetailsA.overallScore}/100</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">Confidence Score:</span>
                                      <span className="font-semibold text-zinc-300">{compDetailsA.confidenceScore}%</span>
                                    </div>
                                    {compDetailsA.healthScores && (
                                      <div className="flex justify-between">
                                        <span className="text-zinc-500">Overall Health Score:</span>
                                        <span className="font-semibold text-zinc-300">{compDetailsA.healthScores.overallHealth}%</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Version B */}
                                <div className="glass-card rounded-xl p-5 flex flex-col gap-4 border border-zinc-900">
                                  <div className="border-b border-zinc-900 pb-2">
                                    <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">Version {compDetailsB.version}</span>
                                    <h4 className="text-xs font-bold text-zinc-300 mt-2">{compDetailsB.summary.slice(0, 100)}...</h4>
                                  </div>
                                  
                                  <div className="flex flex-col gap-2.5 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">Overall Score:</span>
                                      <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                                        {compDetailsB.overallScore}/100
                                        {compDetailsB.overallScore > compDetailsA.overallScore ? (
                                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1 rounded">+{compDetailsB.overallScore - compDetailsA.overallScore}</span>
                                        ) : compDetailsB.overallScore < compDetailsA.overallScore ? (
                                          <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1">-{compDetailsA.overallScore - compDetailsB.overallScore}</span>
                                        ) : null}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">Confidence Score:</span>
                                      <span className="font-semibold text-zinc-300">{compDetailsB.confidenceScore}%</span>
                                    </div>
                                    {compDetailsB.healthScores && (
                                      <div className="flex justify-between">
                                        <span className="text-zinc-500">Overall Health Score:</span>
                                        <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                                          {compDetailsB.healthScores.overallHealth}%
                                          {compDetailsB.healthScores.overallHealth > compDetailsA.healthScores?.overallHealth ? (
                                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1">+{compDetailsB.healthScores.overallHealth - compDetailsA.healthScores?.overallHealth}%</span>
                                          ) : compDetailsB.healthScores.overallHealth < compDetailsA.healthScores?.overallHealth ? (
                                            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1">-{compDetailsA.healthScores?.overallHealth - compDetailsB.healthScores.overallHealth}%</span>
                                          ) : null}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )}
                
                {/* Default display before review trigger */}
                {repo.reviewStatus !== 'completed' && repo.reviewStatus !== 'running' && repo.reviewStatus !== 'pending' && (
                  <div className="glass-card rounded-xl p-12 flex flex-col items-center text-center justify-center gap-4 py-16">
                    <BarChart4 className="h-12 w-12 text-zinc-700 animate-pulse" />
                    <div>
                      <h3 className="text-base font-bold text-white">AI Code Review Available</h3>
                      <p className="text-zinc-500 text-xs max-w-sm mt-1">
                        Run our automated code auditing engine to calculate capability scores, identify codebase vulnerabilities, and extract verified skills.
                      </p>
                    </div>
                    <button 
                      onClick={handleStartReview}
                      className="mt-2 flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-xs font-bold transition-all active:scale-97"
                    >
                      <Cpu className="h-4 w-4" />
                      Trigger AI Audit & Review
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
