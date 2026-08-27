'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, Users, GitBranch, ShieldCheck, Activity, Award, UserCheck, LayoutGrid 
} from 'lucide-react';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function AnalyticsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'developer' | 'company' | 'platform'>('developer');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [profRes, analRes] = await Promise.all([
          fetch('/api/profile').then(r => r.json()),
          fetch('/api/analytics').then(r => r.json()),
        ]);
        if (profRes.success) setProfile(profRes.data);
        if (analRes.success) setAnalytics(analRes.data);
      } catch (err) {
        console.error('Failed to load analytics data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <Navbar user={profile?.profile} breadcrumb="Analytics" />
      <div className="flex flex-1">
        <Sidebar trustScore={profile?.trustScore} />
        
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">Analytics Dashboard</h1>
                <p className="text-xs text-zinc-400">Real-time platform activity, repository progress, and recruitment metrics</p>
              </div>
              
              {/* Tab Selector */}
              <div className="flex bg-zinc-900/50 border border-zinc-800 p-0.5 rounded-lg">
                {(['developer', 'company', 'platform'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === tab 
                        ? 'bg-violet-600 text-white shadow-md' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                <svg className="animate-spin h-8 w-8 text-violet-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-zinc-400 text-xs">Compiling telemetry charts...</p>
              </div>
            ) : !analytics ? (
              <div className="glass-card rounded-xl p-8 text-center text-zinc-400 text-xs">
                Failed to load analytics charts. Please run an audit to initialize data.
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                
                {/* 1. Developer Tab */}
                {activeTab === 'developer' && (
                  <div className="flex flex-col gap-6">
                    {/* Top Stats Strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      {[
                        { label: 'Weekly Growth', val: analytics.developer.growthRate, icon: TrendingUp, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                        { label: 'Trust Trend', val: analytics.developer.trustGrowth, icon: ShieldCheck, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
                        { label: 'Profile Views', val: profile?.passport?.viewCount || 0, icon: Users, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                        { label: 'Commit Activity', val: 'Active', icon: Activity, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                      ].map((item, idx) => {
                        const Icon = item.icon;
                        return (
                          <div key={idx} className="glass-card rounded-xl p-5 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{item.label}</span>
                              <span className="text-xl font-black">{item.val}</span>
                            </div>
                            <span className={`p-2 rounded-lg border ${item.color}`}><Icon className="h-4 w-4" /></span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chart Block */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="glass-card rounded-xl p-6 md:col-span-2 flex flex-col gap-4">
                        <div>
                          <h3 className="text-sm font-bold text-zinc-300">Weekly Progress</h3>
                          <p className="text-[10px] text-zinc-500">Commits and AI audits processed over the last 4 weeks</p>
                        </div>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.developer.weeklyProgress} margin={{ left: -25 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                              <XAxis dataKey="week" stroke="#71717a" fontSize={10} />
                              <YAxis stroke="#71717a" fontSize={10} />
                              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} />
                              <Bar dataKey="commits" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Commits" />
                              <Bar dataKey="reviews" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="AI Audits" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Heatmap summary */}
                      <div className="glass-card rounded-xl p-6 md:col-span-1 flex flex-col gap-4">
                        <div>
                          <h3 className="text-sm font-bold text-zinc-300">Activity Calendar</h3>
                          <p className="text-[10px] text-zinc-500">Daily contribution frequency mapping</p>
                        </div>
                        <div className="grid grid-cols-7 gap-1.5">
                          {analytics.developer.heatmap.map((day: any, idx: number) => {
                            const bg = day.count > 5 ? 'bg-violet-600' : day.count > 2 ? 'bg-violet-800' : day.count > 0 ? 'bg-violet-950/70 border border-violet-900/30' : 'bg-zinc-900';
                            return (
                              <div 
                                key={idx}
                                className={`h-6 w-full rounded ${bg} transition-all hover:scale-110 cursor-pointer`}
                                title={`${day.date}: ${day.count} activities`}
                              />
                            );
                          })}
                        </div>
                        <div className="mt-auto flex justify-between items-center text-[10px] text-zinc-500 border-t border-zinc-900 pt-3">
                          <span>Less</span>
                          <div className="flex gap-1">
                            <span className="h-2 w-2 rounded bg-zinc-900" />
                            <span className="h-2 w-2 rounded bg-violet-950" />
                            <span className="h-2 w-2 rounded bg-violet-800" />
                            <span className="h-2 w-2 rounded bg-violet-600" />
                          </div>
                          <span>More</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Company Tab */}
                {activeTab === 'company' && (
                  <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Funnel chart */}
                      <div className="glass-card rounded-xl p-6 md:col-span-2 flex flex-col gap-4">
                        <div>
                          <h3 className="text-sm font-bold text-zinc-300">Recruitment Funnel</h3>
                          <p className="text-[10px] text-zinc-500">Total candidate conversions through the hiring pipeline</p>
                        </div>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics.company.funnel} margin={{ left: -25 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                              <XAxis dataKey="name" stroke="#71717a" fontSize={10} />
                              <YAxis stroke="#71717a" fontSize={10} />
                              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} />
                              <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} name="Candidates" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Top candidates */}
                      <div className="glass-card rounded-xl p-6 md:col-span-1 flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-zinc-300">Top Rated Candidates</h3>
                        <div className="flex flex-col gap-3">
                          {analytics.company.topCandidatesTrustScore.map((cand: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center bg-zinc-900/40 p-3 rounded-lg border border-zinc-900">
                              <div className="flex items-center gap-2.5">
                                <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 h-6 w-6 rounded-full flex items-center justify-center">#{idx + 1}</span>
                                <span className="text-xs font-semibold">{cand.name}</span>
                              </div>
                              <span className="text-xs font-black text-emerald-400">{cand.score}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Platform Tab */}
                {activeTab === 'platform' && (
                  <div className="flex flex-col gap-6">
                    {/* Top Stats Strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      {[
                        { label: 'Daily Active Users', val: analytics.platform.dau, icon: Users, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
                        { label: 'Monthly Active Users', val: analytics.platform.mau, icon: UserCheck, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                        { label: 'Repos Audited', val: analytics.platform.repositoriesAnalyzed, icon: GitBranch, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                        { label: 'Average Trust', val: analytics.platform.averageTrustScore, icon: Award, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                      ].map((item, idx) => {
                        const Icon = item.icon;
                        return (
                          <div key={idx} className="glass-card rounded-xl p-5 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{item.label}</span>
                              <span className="text-xl font-black">{item.val}</span>
                            </div>
                            <span className={`p-2 rounded-lg border ${item.color}`}><Icon className="h-4 w-4" /></span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chart block */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Top Skills Pie */}
                      <div className="glass-card rounded-xl p-6 md:col-span-1 flex flex-col gap-4">
                        <h3 className="text-sm font-bold text-zinc-300">Top Verified Skills</h3>
                        <div className="h-48 w-full flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={analytics.platform.topSkills}
                                innerRadius={45}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="count"
                              >
                                {analytics.platform.topSkills.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {analytics.platform.topSkills.map((skill: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-[10px]">
                              <div className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                <span>{skill.name}</span>
                              </div>
                              <span className="font-mono text-zinc-500">({skill.count})</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Repos/Reviews activity over time */}
                      <div className="glass-card rounded-xl p-6 md:col-span-2 flex flex-col gap-4">
                        <div>
                          <h3 className="text-sm font-bold text-zinc-300">Platform Analysis Growth</h3>
                          <p className="text-[10px] text-zinc-500">Active repository audits and reviews executed over time</p>
                        </div>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={[
                              { name: 'Month 1', repos: 10, reviews: 8 },
                              { name: 'Month 2', repos: 30, reviews: 24 },
                              { name: 'Month 3', repos: 75, reviews: 68 },
                              { name: 'Month 4', repos: analytics.platform.repositoriesAnalyzed, reviews: analytics.platform.reviewsGenerated },
                            ]} margin={{ left: -25 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                              <XAxis dataKey="name" stroke="#71717a" fontSize={10} />
                              <YAxis stroke="#71717a" fontSize={10} />
                              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} />
                              <Line type="monotone" dataKey="repos" stroke="#3b82f6" strokeWidth={2} name="Repositories" />
                              <Line type="monotone" dataKey="reviews" stroke="#8b5cf6" strokeWidth={2} name="Reviews" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                    </div>
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
