'use client';

import React, { useState } from 'react';
import { Briefcase, MapPin, DollarSign, ShieldAlert, CheckCircle, Search, SlidersHorizontal, Lock } from 'lucide-react';

export interface JobItem {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  location: string | null;
  type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'remote';
  salaryRange: string | null;
  minTrustScore: number;
  active: boolean;
  companyName: string;
  companyLogoUrl: string | null;
}

interface JobBoardProps {
  jobs: JobItem[];
  userTrustScore: number;
  onApply: (jobId: string) => Promise<void>;
}

export default function JobBoard({ jobs, userTrustScore, onApply }: JobBoardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});

  const handleApplyClick = async (jobId: string) => {
    if (applyingJobId) return;
    setApplyingJobId(jobId);
    try {
      await onApply(jobId);
      setAppliedJobs(prev => ({ ...prev, [jobId]: true }));
    } catch (err: any) {
      setErrorMap(prev => ({ ...prev, [jobId]: err.message || 'Application failed' }));
    } finally {
      setApplyingJobId(null);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.location && job.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === 'all' || job.type === filterType;

    return matchesSearch && matchesType;
  });

  const jobTypeLabels: Record<string, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contract: 'Contract',
    internship: 'Internship',
    remote: 'Remote',
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* 1. Header & Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Verified Job Board
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Apply to positions gated by your verified trust reputation score.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative flex-grow sm:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search jobs, companies..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {/* Type selector */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            <option value="all">All Types</option>
            <option value="full_time">Full Time</option>
            <option value="remote">Remote</option>
            <option value="internship">Internship</option>
            <option value="contract">Contract</option>
          </select>
        </div>
      </div>

      {/* 2. Jobs List Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredJobs.map((job) => {
          const isGated = userTrustScore < job.minTrustScore;
          const isApplied = !!appliedJobs[job.id];
          const errorMsg = errorMap[job.id];

          return (
            <div 
              key={job.id} 
              className={`rounded-xl border p-5 flex flex-col md:flex-row justify-between gap-5 transition-all duration-200 ${
                isGated 
                  ? 'bg-zinc-950/20 border-zinc-900 opacity-75' 
                  : 'bg-zinc-900/10 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {/* Job Details */}
              <div className="flex items-start gap-4">
                {job.companyLogoUrl ? (
                  <img
                    src={job.companyLogoUrl}
                    alt={job.companyName}
                    className="h-12 w-12 rounded-lg object-cover bg-zinc-900 border border-zinc-850 shrink-0"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-850 text-zinc-400 shrink-0 font-extrabold uppercase">
                    {job.companyName.slice(0, 2)}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-white text-base tracking-tight">
                      {job.title}
                    </h3>
                    <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-800 border border-zinc-750 px-2 py-0.5 rounded-full">
                      {jobTypeLabels[job.type] || job.type}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-violet-400">
                    {job.companyName}
                  </span>

                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 mt-1">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-500 mt-2">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location}
                      </span>
                    )}
                    {job.salaryRange && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-zinc-400" />
                        {job.salaryRange}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-violet-400">
                      🛡️ Min Score: {job.minTrustScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Gate Column */}
              <div className="flex flex-col justify-between items-stretch md:items-end w-full md:w-48 gap-3 border-t md:border-t-0 border-zinc-900 pt-4 md:pt-0 shrink-0">
                {/* Gate warning alerts */}
                {isGated ? (
                  <div className="flex items-center gap-2 text-[10px] text-amber-400 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg leading-normal">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>
                      Gated. Your score ({userTrustScore}) is below required ({job.minTrustScore}).
                    </span>
                  </div>
                ) : isApplied ? (
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg w-full justify-center">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>Application Submitted</span>
                  </div>
                ) : null}

                {errorMsg && (
                  <span className="text-[10px] text-red-400 text-center w-full block">
                    ❌ {errorMsg}
                  </span>
                )}

                <button
                  onClick={() => handleApplyClick(job.id)}
                  disabled={isGated || isApplied || applyingJobId === job.id}
                  className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold w-full transition-all duration-200 ${
                    isGated
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : isApplied
                      ? 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-default'
                      : 'bg-white text-black hover:bg-zinc-200 active:scale-95'
                  }`}
                >
                  {isGated ? (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      Gated Position
                    </>
                  ) : applyingJobId === job.id ? (
                    'Applying...'
                  ) : isApplied ? (
                    'Applied'
                  ) : (
                    <>
                      <Briefcase className="h-3.5 w-3.5" />
                      Apply Instantly
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {filteredJobs.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center flex flex-col items-center justify-center gap-2">
            <span className="text-zinc-500 text-sm">No job positions match your active filters.</span>
          </div>
        )}
      </div>
    </div>
  );
}
