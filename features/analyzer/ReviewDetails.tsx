'use client';

import React from 'react';
import { Award, Check, AlertTriangle, ShieldCheck, FileText, Code2, BookOpen, ExternalLink, Zap } from 'lucide-react';

export interface ReviewData {
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
  createdAt: string;
}

interface ReviewDetailsProps {
  review: ReviewData;
  repoName: string;
  htmlUrl?: string;
}

export default function ReviewDetails({ review, repoName, htmlUrl }: ReviewDetailsProps) {
  // Score color selectors
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    if (score >= 50) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-red-400 border-red-500/20 bg-red-500/5';
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            AI Review Report
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Audit of repository{' '}
            <span className="text-violet-400 font-semibold">{repoName}</span>
          </p>
        </div>
        {htmlUrl && (
          <a
            href={htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 self-start text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            View GitHub Source
          </a>
        )}
      </div>

      {/* Scores Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Overall Score */}
        <div className={`rounded-xl border p-6 flex flex-col justify-between h-36 ${getScoreColor(review.overallScore)}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Overall Trust Score</span>
            <Award className="h-5 w-5" />
          </div>
          <div>
            <span className="text-4xl font-extrabold tracking-tight">{review.overallScore}</span>
            <span className="text-xs text-zinc-500 font-semibold ml-1">/100</span>
          </div>
          <span className="text-[10px] text-zinc-500">
            {review.overallScore >= 80 ? 'Excellent structure & logic quality' : review.overallScore >= 50 ? 'Valid, with minor room for improvement' : 'Requires optimization'}
          </span>
        </div>

        {/* Confidence Index */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 flex flex-col justify-between h-36">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Analysis Confidence</span>
            <ShieldCheck className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <span className="text-4xl font-extrabold tracking-tight text-white">{review.confidenceScore}</span>
            <span className="text-xs text-zinc-500 font-semibold ml-1">%</span>
          </div>
          <span className="text-[10px] text-zinc-500">
            Based on available package manifest, code files, and commits.
          </span>
        </div>

        {/* Summary Card */}
        <div className="sm:col-span-2 lg:col-span-1 rounded-xl border border-zinc-800 bg-zinc-900/20 p-5 flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Executive Summary</span>
          <p className="text-xs text-zinc-300 leading-relaxed overflow-y-auto max-h-24">
            {review.summary}
          </p>
        </div>
      </div>

      {/* Strengths & Weaknesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6">
          <h3 className="flex items-center gap-2 font-bold text-white text-sm uppercase tracking-wider border-b border-zinc-900 pb-3 mb-4">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <Check className="h-3 w-3" />
            </span>
            Code Strengths
          </h3>
          <ul className="flex flex-col gap-3">
            {review.strengths.map((str, idx) => (
              <li key={idx} className="flex gap-2 text-xs text-zinc-300 leading-relaxed">
                <span className="text-emerald-500 select-none">•</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-6">
          <h3 className="flex items-center gap-2 font-bold text-white text-sm uppercase tracking-wider border-b border-zinc-900 pb-3 mb-4">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
              <AlertTriangle className="h-3 w-3" />
            </span>
            Identified Weaknesses
          </h3>
          <ul className="flex flex-col gap-3">
            {review.weaknesses.map((weak, idx) => (
              <li key={idx} className="flex gap-2 text-xs text-zinc-300 leading-relaxed">
                <span className="text-amber-500 select-none">•</span>
                <span>{weak}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Review Breakdowns */}
      <div className="flex flex-col gap-4">
        {/* Architecture */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Code2 className="h-4 w-4 text-violet-400" />
            <span>Architecture & Architecture Design</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {review.architecture}
          </p>
        </div>

        {/* Code Quality & Safety */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <ShieldCheck className="h-4 w-4 text-violet-400" />
            <span>Code Quality & modular safety</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {review.codeQuality}
          </p>
        </div>

        {/* Documentation & Clarity */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <FileText className="h-4 w-4 text-violet-400" />
            <span>Documentation & Setup Guidelines</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {review.documentation}
          </p>
        </div>

        {/* Best Practices */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Zap className="h-4 w-4 text-violet-400" />
            <span>Best Practices & Lint Guidelines</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {review.bestPractices}
          </p>
        </div>
      </div>

      {/* Suggested Learning Path */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-600/5 p-6">
        <h3 className="flex items-center gap-2 font-bold text-white text-sm uppercase tracking-wider mb-4">
          <BookOpen className="h-4 w-4 text-violet-400" />
          Suggested Learning Path
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {review.suggestedLearning.map((learn, idx) => (
            <div key={idx} className="flex gap-2 bg-zinc-900/40 border border-zinc-800 p-3 rounded-lg text-xs text-zinc-300 leading-normal">
              <span className="text-violet-400 font-extrabold">0{idx + 1}.</span>
              <span>{learn}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
