'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import { 
  Dna, Cpu, GitBranch, ShieldCheck, RefreshCw, BarChart2,
  Layers, Users, Trophy, Play, Star, ExternalLink, HelpCircle
} from 'lucide-react';

export default function DeveloperGraphPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [graphData, setGraphData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profRes, graphRes, recRes] = await Promise.all([
        fetch('/api/profile').then(r => r.json()),
        fetch('/api/graph').then(r => r.json()),
        fetch('/api/recommendations').then(r => r.json()),
      ]);

      if (profRes.success) setProfile(profRes.data);
      if (graphRes.success) setGraphData(graphRes.data);
      if (recRes.success) setRecommendations(recRes.data || []);
    } catch (err) {
      console.error('Failed to load graph data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncGraph = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/graph/sync', { method: 'POST' });
      if (res.ok) {
        await loadData();
      }
    } catch {
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <Navbar user={profile?.profile} breadcrumb="Intelligence Graph" />
      <div className="flex flex-1">
        <Sidebar trustScore={profile?.trustScore} />
        
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">Developer Intelligence Graph</h1>
                <p className="text-xs text-zinc-400">Living mapping of verified repositories, skill categories, and opportunities</p>
              </div>
              <button
                onClick={handleSyncGraph}
                disabled={syncing}
                className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-xs font-semibold hover:bg-zinc-850 transition-all active:scale-97"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin text-violet-500' : ''}`} />
                {syncing ? 'Re-indexing Graph...' : 'Re-sync Graph Node Tree'}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-24">
                <span className="sv-spinner h-6 w-6 text-violet-500" />
              </div>
            ) : !graphData ? (
              <div className="glass-card rounded-xl p-8 text-center text-zinc-400 text-xs">
                No graph details built yet. Please click Sync Graph to seed nodes.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Visual relationship Node list */}
                <div className="glass-card rounded-xl p-5 md:col-span-2 flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-900 pb-2.5 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-violet-400" />
                    Verified Node Map ({graphData.nodes.length} entities, {graphData.edges.length} edges)
                  </h3>

                  <div className="flex flex-col gap-3">
                    {graphData.nodes.map((node: any) => {
                      const edgesFromNode = graphData.edges.filter((e: any) => e.sourceNodeId === node.id || e.targetNodeId === node.id);
                      return (
                        <div key={node.id} className="bg-zinc-900/30 border border-zinc-900 rounded-lg p-3.5 flex justify-between items-start gap-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                node.type === 'developer' ? 'text-violet-400 bg-violet-500/10' :
                                node.type === 'repository' ? 'text-blue-400 bg-blue-500/10' :
                                'text-emerald-400 bg-emerald-500/10'
                              }`}>{node.type}</span>
                              <h4 className="text-xs font-bold text-zinc-200">{node.label}</h4>
                            </div>
                            <span className="text-[10px] text-zinc-500 font-medium">Properties: {JSON.stringify(node.properties)}</span>
                          </div>
                          
                          <div className="flex flex-col items-end shrink-0">
                            <span className="text-[9px] text-zinc-400 font-bold">{edgesFromNode.length} edges</span>
                            <div className="flex flex-wrap gap-1 mt-1 justify-end max-w-[120px]">
                              {edgesFromNode.map((e: any, idx: number) => (
                                <span key={idx} className="text-[7px] bg-zinc-950 border border-zinc-800 text-zinc-500 px-1 rounded uppercase font-semibold">{e.type}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Popular tech + Opportunities sidebar */}
                <div className="flex flex-col gap-6">
                  
                  {/* Technology Trend analytics */}
                  <div className="glass-card rounded-xl p-5 flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-900 pb-2.5">Popular Technologies</h3>
                    <div className="flex flex-col gap-3">
                      {graphData.popularTech.map((tech: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-zinc-300">{tech.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 font-medium">Rating: {tech.popularity}%</span>
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{tech.growth}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Opportunities Recommender */}
                  <div className="glass-card rounded-xl p-5 flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-900 pb-2.5">AI Opportunities Matched</h3>
                    <div className="flex flex-col gap-3">
                      {recommendations.length === 0 ? (
                        <div className="text-[10px] text-zinc-500 italic">No matches generated yet. Run graph sync to recalculate.</div>
                      ) : (
                        recommendations.map((rec, idx) => (
                          <div key={idx} className="bg-zinc-900/50 border border-zinc-900 rounded p-3 flex flex-col gap-1">
                            <div className="flex justify-between items-center text-[9px] font-bold uppercase">
                              <span className="text-zinc-300">{rec.type}</span>
                              <span className="text-emerald-400">{rec.score}% Match</span>
                            </div>
                            <h4 className="text-xs font-bold text-zinc-200 mt-1">{rec.title}</h4>
                            <p className="text-[10px] text-zinc-400 leading-normal mt-1">{rec.reasoning}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
