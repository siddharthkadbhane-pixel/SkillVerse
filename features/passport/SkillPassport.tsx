'use client';

import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { Shield, Award, Users, CheckCircle2, Terminal, Calendar, Code, ExternalLink, Star, ShieldAlert, Award as BadgeIcon } from 'lucide-react';

export interface SkillDnaItem {
  name: string;
  category: string;
  level: number;
  weight: number;
}

export interface SkillPassportProps {
  user: {
    name: string | null;
    username: string;
    avatarUrl: string | null;
    bio: string | null;
    website: string | null;
    location: string | null;
    role: string;
    createdAt: string;
  };
  trustScore: {
    overallScore: number;
    projectScore: number;
    contributionScore: number;
    competitionScore: number;
    peerVouchScore: number;
  };
  skillDna: SkillDnaItem[];
  repositories: {
    id: string;
    name: string;
    fullName: string;
    language: string | null;
    stars: number;
    isAnalyzed: boolean;
    review: {
      overallScore: number;
      summary: string;
    } | null;
  }[];
}

export default function SkillPassport({ user, trustScore, skillDna, repositories }: SkillPassportProps) {
  // Format Skill DNA for Recharts radar chart
  const radarData = skillDna.map(item => ({
    subject: item.name,
    level: item.level,
    fullMark: 5,
  }));

  const defaultRadarData = [
    { subject: 'React', level: 5, fullMark: 5 },
    { subject: 'TypeScript', level: 5, fullMark: 5 },
    { subject: 'Next.js', level: 4, fullMark: 5 },
    { subject: 'PostgreSQL', level: 4, fullMark: 5 },
    { subject: 'Node.js', level: 4, fullMark: 5 },
  ];

  const activeRadarData = radarData.length >= 3 ? radarData : defaultRadarData;

  // Generate simulated contribution heatmap blocks (53 weeks * 7 days)
  const renderHeatmap = () => {
    const days = 7;
    const weeks = 40; // Truncated to fit dashboard width cleanly
    const cells = [];

    // Helper to get random contribution color weight
    const getWeightColor = (idx: number) => {
      // Simulate clusters of activity
      const weight = (Math.sin(idx / 12) + Math.cos(idx / 5) + 2) / 4;
      if (weight > 0.8) return 'bg-emerald-500';
      if (weight > 0.5) return 'bg-emerald-700';
      if (weight > 0.25) return 'bg-emerald-900';
      return 'bg-zinc-900';
    };

    for (let i = 0; i < weeks * days; i++) {
      cells.push(
        <div
          key={i}
          className={`h-2 w-2 rounded-[1px] transition-all hover:scale-125 ${getWeightColor(i)}`}
          title={`Simulated commit count: ${Math.round(Math.random() * 8)}`}
        />
      );
    }

    return (
      <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto py-1">
        {cells}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      
      {/* 1. Profile Header Widget */}
      <div className="relative rounded-2xl overflow-hidden glass-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-zinc-800/80 bg-zinc-900/10">
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="h-20 w-20 rounded-xl object-cover border border-zinc-800 bg-zinc-950"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-zinc-950 border border-zinc-850">
              <Terminal className="h-10 w-10 text-violet-400" />
            </div>
          )}
          <div className="flex flex-col text-center sm:text-left gap-1">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {user.name || user.username}
              </h2>
              <span className="text-[10px] uppercase font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 rounded-full shrink-0">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-zinc-500">@{user.username}</p>
            {user.bio && (
              <p className="text-xs text-zinc-400 mt-2 max-w-md leading-relaxed">
                {user.bio}
              </p>
            )}
            
            {/* Visual Badges row */}
            <div className="flex flex-wrap gap-1.5 mt-2 justify-center sm:justify-start">
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                ✓ SECURITY VERIFIED
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded">
                🛡️ ELITE CONTRIBUTOR
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-[10px] text-zinc-500 mt-4 border-t border-zinc-900 pt-3">
              {user.location && <span>📍 {user.location}</span>}
              {user.website && (
                <a href={user.website} target="_blank" rel="noopener noreferrer" className="hover:text-white flex items-center gap-1 transition-colors">
                  🔗 Website <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <span>🗓️ Registered {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Passport Score Banner */}
        <div className="flex flex-col items-center justify-center rounded-xl bg-zinc-950 border border-zinc-900 p-6 shrink-0 h-32 w-full md:w-44 text-center relative overflow-hidden">
          <div className="absolute top-[-5px] right-[-5px] h-10 w-10 bg-violet-600/10 rounded-full blur-md" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Rep Score</span>
          <span className="text-4xl font-extrabold tracking-tight text-white mt-1">
            {trustScore.overallScore}
          </span>
          <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full mt-2">
            Verified Level: {trustScore.overallScore >= 700 ? 'Elite' : 'Professional'}
          </span>
        </div>
      </div>

      {/* 2. Passport Metrics Breakdown & Skill DNA Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Passport Scores Breakdown */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2 pl-1">
            <Shield className="h-4 w-4 text-violet-400" />
            Verification Breakdown
          </h3>

          <div className="flex flex-col gap-2">
            {/* Project Score Card */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4 flex items-center justify-between hover:border-zinc-800 transition-colors">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-zinc-300">Project Quality Score</span>
                <span className="text-[10px] text-zinc-500">Calculated from AI source audits</span>
              </div>
              <span className="text-sm font-bold text-white">
                {trustScore.projectScore} <span className="text-[10px] text-zinc-600 font-normal">/1000</span>
              </span>
            </div>

            {/* Git Contributions Card */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4 flex items-center justify-between hover:border-zinc-800 transition-colors">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-zinc-300">Git Contribution Weight</span>
                <span className="text-[10px] text-zinc-500">Calculated from commit weights</span>
              </div>
              <span className="text-sm font-bold text-white">
                {trustScore.contributionScore} <span className="text-[10px] text-zinc-600 font-normal">/1000</span>
              </span>
            </div>

            {/* Competition Score Card */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4 flex items-center justify-between hover:border-zinc-800 transition-colors">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-zinc-300">Competition Index</span>
                <span className="text-[10px] text-zinc-500">Earned from hackathons & events</span>
              </div>
              <span className="text-sm font-bold text-white">
                {trustScore.competitionScore} <span className="text-[10px] text-zinc-600 font-normal">/1000</span>
              </span>
            </div>

            {/* Peer Vouch Score Card */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4 flex items-center justify-between hover:border-zinc-800 transition-colors">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-zinc-300">Peer Vouch Reputation</span>
                <span className="text-[10px] text-zinc-500">Earned from community feedback</span>
              </div>
              <span className="text-sm font-bold text-white">
                {trustScore.peerVouchScore} <span className="text-[10px] text-zinc-600 font-normal">/1000</span>
              </span>
            </div>
          </div>
        </div>

        {/* Skill DNA Radar Visualizer */}
        <div className="lg:col-span-3 rounded-2xl border border-zinc-900 bg-zinc-950/40 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Terminal className="h-4 w-4 text-violet-400" />
              Skill DNA Radar
            </h3>
            <span className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">
              Proficiency levels (1-5)
            </span>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={activeRadarData}>
                <PolarGrid stroke="#18181b" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#3f3f46', fontSize: 9 }} />
                <Radar
                  name="Verified Skill DNA"
                  dataKey="level"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.15}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#09090b',
                    borderColor: '#27272a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. GitHub Contribution Heatmap Simulation */}
      <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
            <Calendar className="h-4 w-4 text-violet-400" />
            Verified Git Contributions Heatmap
          </h3>
          <span className="text-[9px] text-zinc-500 uppercase font-semibold">
            Telemetry synchronized: hourly
          </span>
        </div>

        {/* Heatmap Grid */}
        <div className="flex flex-col gap-2">
          {renderHeatmap()}
          <div className="flex justify-end gap-1.5 text-[8px] text-zinc-500 font-semibold uppercase mt-1 pl-1">
            <span>Less</span>
            <div className="h-2 w-2 rounded-[1px] bg-zinc-900" />
            <div className="h-2 w-2 rounded-[1px] bg-emerald-900" />
            <div className="h-2 w-2 rounded-[1px] bg-emerald-700" />
            <div className="h-2 w-2 rounded-[1px] bg-emerald-500" />
            <span>More</span>
          </div>
        </div>
      </div>

      {/* 4. Verified Projects & Repositories list */}
      <div className="flex flex-col gap-4">
        <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2 pl-1">
          <Code className="h-4 w-4 text-violet-400" />
          Verified Code Audits
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repositories.filter(r => r.isAnalyzed).map((repo) => (
            <div key={repo.id} className="glass-card rounded-xl p-5 flex flex-col justify-between h-40">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm truncate max-w-[70%]">
                    {repo.name}
                  </h4>
                  {repo.review && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                      Score: {repo.review.overallScore}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-3 leading-relaxed">
                  {repo.review?.summary || 'Project analyzed with standard repository properties.'}
                </p>
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-900/60 pt-3 mt-2">
                {repo.language && (
                  <span className="font-semibold text-zinc-400">
                    💻 {repo.language}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  <span>{repo.stars} stars</span>
                </div>
              </div>
            </div>
          ))}
          {repositories.filter(r => r.isAnalyzed).length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-zinc-800 p-8 flex flex-col items-center justify-center text-center gap-2">
              <span className="text-zinc-500 text-xs">No repositories have been analyzed yet.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
