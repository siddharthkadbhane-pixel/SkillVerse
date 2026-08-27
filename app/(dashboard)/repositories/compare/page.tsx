'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import { 
  GitBranch, HelpCircle, ShieldAlert, CheckCircle2, AlertCircle, ArrowLeftRight, Check, X 
} from 'lucide-react';

export default function CompareRepositoriesPage() {
  const [profile, setProfile] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedIdA, setSelectedIdA] = useState<string>('');
  const [selectedIdB, setSelectedIdB] = useState<string>('');

  const [detailsA, setDetailsA] = useState<any>(null);
  const [detailsB, setDetailsB] = useState<any>(null);

  const [reviewA, setReviewA] = useState<any>(null);
  const [reviewB, setReviewB] = useState<any>(null);

  const [loadingCompare, setLoadingCompare] = useState(false);

  useEffect(() => {
    const loadInit = async () => {
      try {
        setLoading(true);
        const [profRes, repoRes] = await Promise.all([
          fetch('/api/profile').then(r => r.json()),
          fetch('/api/repositories').then(r => r.json()),
        ]);
        if (profRes.success) setProfile(profRes.data);
        if (repoRes.success) {
          const list = repoRes.data || [];
          setRepos(list);
          if (list.length > 0) setSelectedIdA(list[0].id);
          if (list.length > 1) setSelectedIdB(list[1].id);
        }
      } catch (err) {
        console.error('Failed to load initial compare data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInit();
  }, []);

  const handleCompare = async () => {
    if (!selectedIdA || !selectedIdB) return;
    setLoadingCompare(true);
    try {
      const [repoARes, repoBRes, revARes, revBRes] = await Promise.all([
        fetch(`/api/repositories/${selectedIdA}`).then(r => r.json()),
        fetch(`/api/repositories/${selectedIdB}`).then(r => r.json()),
        fetch(`/api/repositories/${selectedIdA}/review`).then(r => r.json()),
        fetch(`/api/repositories/${selectedIdB}/review`).then(r => r.json()),
      ]);

      if (repoARes.success) setDetailsA(repoARes.data);
      if (repoBRes.success) setDetailsB(repoBRes.data);
      setReviewA(revARes.success ? revARes.data : null);
      setReviewB(revBRes.success ? revBRes.data : null);
    } catch (err) {
      console.error('Compare fetch failed:', err);
    } finally {
      setLoadingCompare(false);
    }
  };

  useEffect(() => {
    if (selectedIdA && selectedIdB) {
      handleCompare();
    }
  }, [selectedIdA, selectedIdB]);

  // Extract score value helper
  const getVal = (scoresObj: any, category: string): number => {
    if (!scoresObj) return 0;
    return scoresObj.categories?.[category]?.score || 0;
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <Navbar user={profile?.profile} breadcrumb="Compare" />
      <div className="flex flex-1">
        <Sidebar trustScore={profile?.trustScore} />
        
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">Repository Comparison</h1>
                <p className="text-xs text-zinc-400">Side-by-side structural patterns, health telemetry, and trust contributions</p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-24">
                <span className="sv-spinner h-6 w-6 text-violet-500" />
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                
                {/* Selector strip */}
                <div className="glass-card rounded-xl p-5 grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                  <div className="md:col-span-3 flex flex-col gap-1.5">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Repository A</label>
                    <select
                      value={selectedIdA}
                      onChange={e => setSelectedIdA(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-violet-500 text-white w-full"
                    >
                      {repos.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-1 flex justify-center text-zinc-500">
                    <ArrowLeftRight className="h-5 w-5" />
                  </div>

                  <div className="md:col-span-3 flex flex-col gap-1.5">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Repository B</label>
                    <select
                      value={selectedIdB}
                      onChange={e => setSelectedIdB(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-violet-500 text-white w-full"
                      disabled={repos.length < 2}
                    >
                      {repos.length < 2 ? (
                        <option>Connect more repositories first</option>
                      ) : (
                        repos.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {loadingCompare ? (
                  <div className="flex justify-center py-20">
                    <span className="sv-spinner h-6 w-6 text-violet-500" />
                  </div>
                ) : !detailsA || !detailsB ? (
                  <div className="glass-card rounded-xl p-8 text-center text-zinc-400 text-xs">
                    Please select two verified repositories to execute telemetry comparisons.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Repository A Comparison */}
                    <div className="glass-card rounded-xl p-6 flex flex-col gap-5 border-t-2 border-violet-600">
                      <div>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase">Repository A</span>
                        <h2 className="text-lg font-black tracking-tight text-white">{detailsA.name}</h2>
                        <p className="text-[10px] text-zinc-400 truncate mt-1">{detailsA.description || 'No description'}</p>
                      </div>

                      {/* Score Breakdown list */}
                      <div className="flex flex-col gap-3 border-t border-zinc-900 pt-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">Architecture Pattern:</span>
                          <span className="font-semibold text-zinc-200">{reviewA?.healthScores?.architectureStyle || detailsA.summary?.projectType || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">Complexity Index:</span>
                          <span className="font-semibold text-zinc-200">{detailsA.summary?.complexity || 'Medium'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">Trust Contribution:</span>
                          <span className="font-semibold text-emerald-400">+{Math.round((reviewA?.overallScore || 70) * 4)} pts</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">Overall Health:</span>
                          <span className="font-bold text-violet-400">{reviewA?.healthScores?.overallHealth || 60}%</span>
                        </div>
                      </div>

                      {/* Individual Capability Telemetry Bars */}
                      <div className="flex flex-col gap-3.5 border-t border-zinc-900 pt-4">
                        <h3 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Health Breakdown</h3>
                        {[
                          { key: 'documentation', label: 'Documentation' },
                          { key: 'maintainability', label: 'Maintainability' },
                          { key: 'security', label: 'Security' },
                          { key: 'performance', label: 'Performance' },
                          { key: 'testing', label: 'Testing' },
                        ].map(item => {
                          const val = getVal(reviewA?.healthScores, item.key);
                          const grade = reviewA?.healthScores?.categories?.[item.key]?.grade || 'C';
                          return (
                            <div key={item.key} className="flex flex-col gap-1.5">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-zinc-400">{item.label}</span>
                                <span className="font-mono text-zinc-300">{val}% (Grade {grade})</span>
                              </div>
                              <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
                                <div className="h-full bg-violet-600 rounded-full" style={{ width: `${val}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Verified Skills */}
                      <div className="flex flex-col gap-2 border-t border-zinc-900 pt-4">
                        <h3 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Verified Skills Stack</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {(reviewA?.skillsExtracted || []).slice(0, 8).map((sk: any, idx: number) => (
                            <span key={idx} className="text-[10px] bg-zinc-900 border border-zinc-800 rounded px-2.5 py-0.5 text-zinc-300 font-medium">
                              {sk.name} <b className="text-violet-400 font-bold">Lvl {sk.level}</b>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Repository B Comparison */}
                    <div className="glass-card rounded-xl p-6 flex flex-col gap-5 border-t-2 border-blue-600">
                      <div>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase">Repository B</span>
                        <h2 className="text-lg font-black tracking-tight text-white">{detailsB.name}</h2>
                        <p className="text-[10px] text-zinc-400 truncate mt-1">{detailsB.description || 'No description'}</p>
                      </div>

                      {/* Score Breakdown list */}
                      <div className="flex flex-col gap-3 border-t border-zinc-900 pt-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">Architecture Pattern:</span>
                          <span className="font-semibold text-zinc-200">{reviewB?.healthScores?.architectureStyle || detailsB.summary?.projectType || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">Complexity Index:</span>
                          <span className="font-semibold text-zinc-200">{detailsB.summary?.complexity || 'Medium'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">Trust Contribution:</span>
                          <span className="font-semibold text-emerald-400">+{Math.round((reviewB?.overallScore || 70) * 4)} pts</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">Overall Health:</span>
                          <span className="font-bold text-blue-400">{reviewB?.healthScores?.overallHealth || 60}%</span>
                        </div>
                      </div>

                      {/* Individual Capability Telemetry Bars */}
                      <div className="flex flex-col gap-3.5 border-t border-zinc-900 pt-4">
                        <h3 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Health Breakdown</h3>
                        {[
                          { key: 'documentation', label: 'Documentation' },
                          { key: 'maintainability', label: 'Maintainability' },
                          { key: 'security', label: 'Security' },
                          { key: 'performance', label: 'Performance' },
                          { key: 'testing', label: 'Testing' },
                        ].map(item => {
                          const val = getVal(reviewB?.healthScores, item.key);
                          const grade = reviewB?.healthScores?.categories?.[item.key]?.grade || 'C';
                          return (
                            <div key={item.key} className="flex flex-col gap-1.5">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-zinc-400">{item.label}</span>
                                <span className="font-mono text-zinc-300">{val}% (Grade {grade})</span>
                              </div>
                              <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-850">
                                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${val}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Verified Skills */}
                      <div className="flex flex-col gap-2 border-t border-zinc-900 pt-4">
                        <h3 className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Verified Skills Stack</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {(reviewB?.skillsExtracted || []).slice(0, 8).map((sk: any, idx: number) => (
                            <span key={idx} className="text-[10px] bg-zinc-900 border border-zinc-800 rounded px-2.5 py-0.5 text-zinc-300 font-medium">
                              {sk.name} <b className="text-blue-400 font-bold">Lvl {sk.level}</b>
                            </span>
                          ))}
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
