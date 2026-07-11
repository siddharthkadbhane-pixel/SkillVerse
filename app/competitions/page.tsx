'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import { Award, Calendar, Users, Star, Trophy, ArrowUpRight, Zap, Target } from 'lucide-react';

interface Competition {
  id: string;
  title: string;
  description: string;
  prizePool: string;
  daysLeft: number;
  status: 'active' | 'upcoming' | 'completed';
  participantsCount: number;
}

interface LeaderboardUser {
  rank: number;
  name: string;
  username: string;
  avatarUrl: string;
  trustScore: number;
  languages: string[];
}

export default function CompetitionsPage() {
  const [profile, setProfile] = useState<any>(null);
  
  useEffect(() => {
    fetch('/api/profile')
      .then(res => res.json())
      .then(json => {
        if (json.success) setProfile(json.data);
      })
      .catch(() => {});
  }, []);

  const activeCompetitions: Competition[] = [
    {
      id: 'comp_001',
      title: 'Distributed System Stream Challenge',
      description: 'Audit, optimize, and build a high-throughput stream buffer in Rust or Go. Evaluated on connection speed and memory constraints.',
      prizePool: '$5,000 USD',
      daysLeft: 4,
      status: 'active',
      participantsCount: 142,
    },
    {
      id: 'comp_002',
      title: 'Supabase Schema Hackathon',
      description: 'Build a fully recursive Postgres schema wrapper for client databases. Evaluated on security architecture and index performance.',
      prizePool: '$3,500 USD',
      daysLeft: 12,
      status: 'active',
      participantsCount: 88,
    },
  ];

  const upcomingCompetitions: Competition[] = [
    {
      id: 'comp_003',
      title: 'Next.js 15 Edge Router Audit',
      description: 'Find and document memory leaks inside custom next layouts using dynamic stream rendering tools.',
      prizePool: '$2,000 USD',
      daysLeft: 22,
      status: 'upcoming',
      participantsCount: 0,
    },
  ];

  const leaderboard: LeaderboardUser[] = [
    {
      rank: 1,
      name: 'Alex Rivera',
      username: 'arivera-code',
      avatarUrl: 'https://avatars.githubusercontent.com/u/1024025?v=4',
      trustScore: 978,
      languages: ['Rust', 'Go', 'PostgreSQL'],
    },
    {
      rank: 2,
      name: 'Sidharth Kadbhane',
      username: 'siddharthkadbhane-pixel',
      avatarUrl: 'https://avatars.githubusercontent.com/u/84218321?v=4',
      trustScore: 840,
      languages: ['TypeScript', 'React', 'Next.js'],
    },
    {
      rank: 3,
      name: 'Elena Rostova',
      username: 'elena-dev',
      avatarUrl: 'https://avatars.githubusercontent.com/u/4588231?v=4',
      trustScore: 825,
      languages: ['TypeScript', 'Python', 'AWS'],
    },
    {
      rank: 4,
      name: 'Marcus Vance',
      username: 'mvance-git',
      avatarUrl: 'https://avatars.githubusercontent.com/u/982314?v=4',
      trustScore: 812,
      languages: ['C++', 'Python', 'Docker'],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
      <Navbar user={profile?.profile} />
      <div className="flex flex-1">
        <Sidebar trustScore={profile?.trustScore} />
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <div className="flex flex-col gap-8 max-w-6xl mx-auto">
            {/* Header info */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Skill Challenges
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                Participate in verified engineering events to instantly upgrade your Trust Passport.
              </p>
            </div>

            {/* Split Grid: Left = Hackathons, Right = Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              
              {/* Challenges Section */}
              <div className="lg:col-span-3 flex flex-col gap-6">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2 pl-1">
                  <Target className="h-4 w-4 text-violet-400" />
                  Active Challenges
                </h3>

                {activeCompetitions.map((comp) => (
                  <div key={comp.id} className="glass-card rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden border border-zinc-800 bg-zinc-900/10">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1">
                        <h4 className="font-bold text-white text-base tracking-tight hover:text-violet-400 transition-colors">
                          {comp.title}
                        </h4>
                        <div className="flex items-center gap-4 text-[10px] text-zinc-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {comp.daysLeft} days left
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {comp.participantsCount} developers joined
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full shrink-0">
                        {comp.prizePool}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {comp.description}
                    </p>

                    <div className="flex items-center gap-2 mt-2 pt-4 border-t border-zinc-900">
                      <button className="flex items-center justify-center gap-1 text-[11px] font-bold text-black bg-white hover:bg-zinc-200 px-4 py-2 rounded-lg transition-colors ml-auto">
                        Register Code
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Upcoming */}
                <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2 pl-1 mt-4">
                  <Calendar className="h-4 w-4 text-zinc-500" />
                  Upcoming Challenges
                </h3>

                {upcomingCompetitions.map((comp) => (
                  <div key={comp.id} className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <h4 className="font-semibold text-zinc-300 text-sm">{comp.title}</h4>
                      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-1">{comp.description}</p>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-bold shrink-0">
                      Starts in {comp.daysLeft} days
                    </span>
                  </div>
                ))}
              </div>

              {/* Leaderboard Section */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2 pl-1">
                  <Trophy className="h-4 w-4 text-violet-400" />
                  Global Leaderboard
                </h3>

                <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4 flex flex-col gap-2.5">
                  {leaderboard.map((userItem) => (
                    <div key={userItem.rank} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-zinc-900/40 transition-colors border border-transparent hover:border-zinc-800">
                      <div className="flex items-center gap-3">
                        {/* Rank index badge */}
                        <span className={`h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          userItem.rank === 1 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          userItem.rank === 2 ? 'bg-zinc-400/10 text-zinc-300 border border-zinc-500/20' :
                          userItem.rank === 3 ? 'bg-amber-700/10 text-amber-600 border border-amber-700/20' :
                          'bg-zinc-900 text-zinc-500 border border-zinc-850'
                        }`}>
                          {userItem.rank}
                        </span>

                        {/* Avatar & Info */}
                        <img src={userItem.avatarUrl} alt={userItem.name} className="h-8 w-8 rounded-full bg-zinc-950 border border-zinc-800 shrink-0" />
                        
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white hover:text-violet-400 cursor-pointer transition-colors leading-tight">
                            {userItem.name}
                          </span>
                          <span className="text-[9px] text-zinc-500 leading-normal">@{userItem.username}</span>
                        </div>
                      </div>

                      {/* Points / Score */}
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-xs font-black text-white">{userItem.trustScore}</span>
                        <span className="text-[8px] text-zinc-500 uppercase tracking-wider font-semibold">Rep pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
