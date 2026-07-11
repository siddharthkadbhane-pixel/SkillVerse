'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import { 
  Star, GitFork, Cpu, CheckCircle2, AlertCircle, Calendar, 
  BookOpen, Code2, Layers, ShieldAlert, ArrowLeft, RefreshCw, BarChart4,
  Flame, ShieldCheck, Heart, Sparkles, Award, ListChecks
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
      // Step 1: Run code discovery analyzer (stores files context) if not already done
      if (!repo?.metadata) {
        const analyzeRes = await fetch(`/api/repositories/${id}/analyze`, {
          method: 'POST',
        });
        const analyzeJson = await analyzeRes.json();
        if (!analyzeJson.success) {
          throw new Error(analyzeJson.error || 'Repository file discovery failed');
        }
        setRepo(analyzeJson.data);
      }

      // Step 2: Trigger AI Review pipeline in background
      const reviewRes = await fetch(`/api/repositories/${id}/review`, {
        method: 'POST',
      });
      const reviewJson = await reviewRes.json();
      if (reviewJson.success) {
        setRepo(prev => prev ? { ...prev, reviewStatus: 'running' } : null);
        startPolling();
      } else {
        throw new Error(reviewJson.error || 'Failed to trigger AI Review');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred triggering the review');
      setAnalyzing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const getLanguagePercentage = (bytes: number, total: number) => {
    if (total === 0) return '0%';
    return `${((bytes / total) * 100).toFixed(1)}%`;
  };

  const totalBytes = repo?.metadata?.languagesBreakdown 
    ? Object.values(repo.metadata.languagesBreakdown).reduce((a, b) => a + b, 0)
    : 0;

  const sortedLanguages = repo?.metadata?.languagesBreakdown
    ? Object.entries(repo.metadata.languagesBreakdown).sort((a, b) => b[1] - a[1])
    : [];

  // Parse raw scores from string format (e.g. "Code Quality: 85/100. Maintainability: 82/100.")
  const extractScore = (scoreString: string | undefined, type: string): number => {
    if (!scoreString) return 0;
    const regex = new RegExp(`${type}:?\\s*(\\d+)/100`, 'i');
    const match = scoreString.match(regex);
    return match ? parseInt(match[1], 10) : 70; // Fallback default
  };

  const codeQualityScore = extractScore(review?.codeQuality, 'Code Quality');
  const maintainabilityScore = extractScore(review?.codeQuality, 'Maintainability');
  const documentationScore = extractScore(review?.documentation, 'Documentation rating is');
  const securityScore = extractScore(review?.bestPractices, 'Security');
  const performanceScore = extractScore(review?.bestPractices, 'Performance');
  const testingScore = extractScore(review?.bestPractices, 'Testing');

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <Navbar user={profile?.profile} />
      <div className="flex flex-1">
        <Sidebar trustScore={profile?.trustScore} />
        
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            
            {/* Back button */}
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
                <svg className="animate-spin h-8 w-8 text-violet-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
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
                
                {/* Header Section */}
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
                          Auditing...
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
                      className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-500 transition-all duration-250 active:scale-97 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      {analyzing || repo.reviewStatus === 'running' || repo.reviewStatus === 'pending' ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Generating review...
                        </>
                      ) : (
                        <>
                          <Cpu className="h-4 w-4" />
                          {repo.reviewStatus === 'completed' ? 'Regenerate AI Audit' : 'Generate AI Review'}
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

                {/* Processing Overlay */}
                {(repo.reviewStatus === 'running' || repo.reviewStatus === 'pending') && (
                  <div className="glass-card rounded-xl p-8 flex flex-col items-center justify-center gap-4 text-center py-16">
                    <Sparkles className="h-10 w-10 text-violet-500 animate-spin" />
                    <div>
                      <h3 className="text-lg font-bold text-white">Analyzing Codebase & Generating AI Review</h3>
                      <p className="text-zinc-400 text-xs mt-1 max-w-md">
                        We are running static telemetry, scanning files, and analyzing dependencies using Hugging Face pipelines. This may take up to 30 seconds.
                      </p>
                    </div>
                    {/* Live progress indicator bar */}
                    <div className="h-1.5 w-64 bg-zinc-900 rounded-full overflow-hidden mt-2 border border-zinc-800">
                      <div className="h-full bg-violet-600 rounded-full animate-[shimmer_2s_infinite]" style={{ width: '80%' }} />
                    </div>
                  </div>
                )}

                {/* Scorecard Display */}
                {repo.reviewStatus === 'completed' && review && (
                  <div className="flex flex-col gap-6">
                    
                    {/* Main Score & Summary Card */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      
                      {/* Left Block - Big Ring Score */}
                      <div className="glass-card rounded-xl p-6 md:col-span-1 flex flex-col items-center justify-center text-center gap-4">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Overall Score</span>
                        <div className="relative flex items-center justify-center h-28 w-28 rounded-full border-4 border-violet-500/20 bg-zinc-900/50 shadow-lg">
                          <span className="text-3xl font-black text-white">{review.overallScore}</span>
                          <span className="text-[10px] text-zinc-500 absolute bottom-3">/ 100</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-zinc-400">Confidence Score: <b>{review.confidenceScore}%</b></span>
                          <span className="text-[9px] text-zinc-500">Based on codebase size & documentation</span>
                        </div>
                      </div>

                      {/* Right Block - Summary */}
                      <div className="glass-card rounded-xl p-6 md:col-span-3 flex flex-col gap-3">
                        <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                          <Award className="h-4 w-4 text-violet-400" />
                          Executive Audit Summary
                        </h3>
                        <p className="text-xs text-zinc-300 leading-relaxed font-medium pl-0.5">
                          {review.summary}
                        </p>
                        <div className="mt-2 flex flex-col gap-1 text-[11px] text-zinc-400 bg-zinc-900/30 border border-zinc-900 p-3 rounded-lg">
                          <span className="font-bold text-zinc-300">Architecture Layout:</span>
                          <span>{review.architecture}</span>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Scores */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Metric score bars */}
                      <div className="glass-card rounded-xl p-6 flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-zinc-300 border-b border-zinc-900 pb-2">Capability Scorecard</h3>
                        
                        <div className="flex flex-col gap-3.5">
                          {[
                            { name: 'Code Quality', score: codeQualityScore, color: 'from-blue-600 to-indigo-600' },
                            { name: 'Maintainability', score: maintainabilityScore, color: 'from-violet-600 to-purple-600' },
                            { name: 'Security & Safety', score: securityScore, color: 'from-emerald-600 to-teal-600' },
                            { name: 'Performance', score: performanceScore, color: 'from-amber-600 to-orange-600' },
                            { name: 'Testing Integration', score: testingScore, color: 'from-rose-600 to-red-600' },
                          ].map(metric => (
                            <div key={metric.name} className="flex flex-col gap-1.5">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-zinc-400">{metric.name}</span>
                                <span className="text-zinc-200">{metric.score} / 100</span>
                              </div>
                              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
                                <div 
                                  className={`h-full rounded-full bg-gradient-to-r ${metric.color}`}
                                  style={{ width: `${metric.score}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Strengths & Weaknesses */}
                      <div className="grid grid-rows-2 gap-6">
                        
                        {/* Strengths */}
                        <div className="glass-card rounded-xl p-5 flex flex-col gap-3">
                          <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase pl-0.5">
                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                            Key Strengths
                          </h3>
                          <ul className="flex flex-col gap-1.5 list-disc list-inside text-xs text-zinc-300">
                            {review.strengths.map((str, idx) => (
                              <li key={idx} className="leading-relaxed">{str}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Weaknesses */}
                        <div className="glass-card rounded-xl p-5 flex flex-col gap-3">
                          <h3 className="text-xs font-bold text-red-400 flex items-center gap-1.5 uppercase pl-0.5">
                            <ShieldAlert className="h-4 w-4 text-red-400" />
                            Security / Code Risks
                          </h3>
                          <ul className="flex flex-col gap-1.5 list-disc list-inside text-xs text-zinc-300">
                            {review.weaknesses.map((weak, idx) => (
                              <li key={idx} className="leading-relaxed">{weak}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Recommendations and Verified Skills */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Learning Recommendations */}
                      <div className="glass-card rounded-xl p-5 md:col-span-2 flex flex-col gap-3">
                        <h3 className="text-xs font-bold text-zinc-400 flex items-center gap-1.5 uppercase pl-0.5">
                          <ListChecks className="h-4 w-4 text-violet-400" />
                          Suggested Learning Roadmap
                        </h3>
                        <ul className="flex flex-col gap-2.5 text-xs text-zinc-300 mt-1 pl-1">
                          {review.suggestedLearning.map((rec, idx) => (
                            <li key={idx} className="flex gap-2 items-start leading-relaxed">
                              <span className="h-4 w-4 shrink-0 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 text-[10px] flex items-center justify-center font-bold">
                                {idx + 1}
                              </span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Languages breakdown (if analyzed but not verified, show stats here) */}
                      {sortedLanguages.length > 0 && (
                        <div className="glass-card rounded-xl p-5 md:col-span-1 flex flex-col gap-4">
                          <h3 className="text-xs font-bold text-zinc-400 border-b border-zinc-900 pb-2">Languages Stack</h3>
                          <div className="flex flex-col gap-2">
                            {sortedLanguages.slice(0, 4).map(([lang, bytes]) => (
                              <div key={lang} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className={`h-2 w-2 rounded-full ${getLangBg(lang)}`} />
                                  <span className="font-semibold text-zinc-300">{lang}</span>
                                </div>
                                <span className="font-mono text-zinc-500">({getLanguagePercentage(bytes, totalBytes)})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
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
