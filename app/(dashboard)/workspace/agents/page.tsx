'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import { 
  Cpu, Activity, CheckCircle2, AlertCircle, RefreshCw, BarChart2,
  Terminal, ShieldCheck, HelpCircle, Layers, ArrowLeftRight, Clock, Dna, Play, Award
} from 'lucide-react';

export default function AgentEcosystemDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [activeRun, setActiveRun] = useState<any>(null);
  const [runDetails, setRunDetails] = useState<any>(null);
  const [agentsList, setAgentsList] = useState<any[]>([]);

  const [runningPipeline, setRunningPipeline] = useState(false);
  const [pollingRunId, setPollingRunId] = useState<string | null>(null);

  const [showLogs, setShowLogs] = useState<boolean>(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadInit = async () => {
      try {
        setLoading(true);
        const [profRes, repoRes, agentRes] = await Promise.all([
          fetch('/api/profile').then(r => r.json()),
          fetch('/api/repositories').then(r => r.json()),
          fetch('/api/agents').then(r => r.json()),
        ]);

        if (profRes.success) setProfile(profRes.data);
        if (repoRes.success) {
          const list = repoRes.data || [];
          setRepos(list);
          if (list.length > 0) setSelectedRepoId(list[0].id);
        }
        if (agentRes.success) setAgentsList(agentRes.data || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInit();
  }, []);

  const loadLatestRun = async () => {
    if (!selectedRepoId) return;
    try {
      const res = await fetch(`/api/agents/history?repositoryId=${selectedRepoId}`);
      const json = await res.json();
      if (json.success && json.data && json.data.length > 0) {
        const latest = json.data[0];
        setActiveRun(latest);
        fetchRunDetails(latest.id);
        if (latest.status === 'running' || latest.status === 'pending') {
          startPolling(latest.id);
        }
      } else {
        setActiveRun(null);
        setRunDetails(null);
      }
    } catch {}
  };

  useEffect(() => {
    loadLatestRun();
  }, [selectedRepoId]);

  const fetchRunDetails = async (runId: string) => {
    try {
      const res = await fetch(`/api/agents/output?runId=${runId}`);
      const json = await res.json();
      if (json.success) {
        setRunDetails(json.data);
      }
    } catch {}
  };

  const startPolling = (runId: string) => {
    stopPolling();
    setRunningPipeline(true);
    setPollingRunId(runId);

    pollingRef.current = setInterval(async () => {
      try {
        const statusRes = await fetch(`/api/agents/status?runId=${runId}`);
        const statusJson = await statusRes.json();
        if (statusJson.success) {
          const run = statusJson.data;
          setActiveRun((prev: any) => prev ? { ...prev, status: run.status, completedAt: run.completedAt, durationMs: run.durationMs } : run);
          fetchRunDetails(runId);

          if (run.status === 'completed' || run.status === 'failed') {
            stopPolling();
            setRunningPipeline(false);
            setPollingRunId(null);
            // Reload user profiles to update trust score displays
            fetch('/api/profile')
              .then(r => r.json())
              .then(res => {
                if (res.success) setProfile(res.data);
              });
          }
        }
      } catch (err) {
        console.error('Failed status polling', err);
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const handleTriggerPipeline = async () => {
    if (!selectedRepoId || runningPipeline) return;
    setRunningPipeline(true);
    try {
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repositoryId: selectedRepoId }),
      });
      const json = await res.json();
      if (json.success) {
        // Trigger status lookup
        setTimeout(loadLatestRun, 500);
      } else {
        setRunningPipeline(false);
      }
    } catch {
      setRunningPipeline(false);
    }
  };

  const handleRetryAgent = async (agentId: string) => {
    if (!activeRun) return;
    try {
      const res = await fetch('/api/agents/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: activeRun.id, agentId }),
      });
      const json = await res.json();
      if (json.success) {
        fetchRunDetails(activeRun.id);
      }
    } catch {}
  };

  // Helper method to look up details for a specific agent in the run
  const getAgentRunOutput = (agentId: string) => {
    if (!runDetails?.outputs) return null;
    return runDetails.outputs.find((o: any) => o.agentId === agentId);
  };

  const getAgentMetric = (agentId: string) => {
    if (!runDetails?.metrics) return null;
    return runDetails.metrics.find((m: any) => m.agentId === agentId);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <Navbar user={profile?.profile} breadcrumb="Agents Workspace" />
      <div className="flex flex-1">
        <Sidebar trustScore={profile?.trustScore} />
        
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">AI Agent Ecosystem</h1>
                <p className="text-xs text-zinc-400">Coordinating 12 specialized developer agents in a shared memory pipeline</p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-24">
                <span className="sv-spinner h-6 w-6 text-violet-500" />
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                
                {/* Repo selector and trigger action */}
                <div className="glass-card rounded-xl p-5 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                  <div className="flex flex-col gap-1.5 flex-1 max-w-sm">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Target Repository</label>
                    <select
                      value={selectedRepoId}
                      onChange={e => setSelectedRepoId(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs font-semibold focus:outline-none text-white w-full"
                    >
                      {repos.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleTriggerPipeline}
                    disabled={runningPipeline || !selectedRepoId}
                    className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-500 transition-all duration-250 active:scale-97 disabled:bg-zinc-850 disabled:text-zinc-600 disabled:cursor-not-allowed h-10 shrink-0 self-end sm:self-center"
                  >
                    {runningPipeline ? (
                      <>
                        <span className="sv-spinner h-3.5 w-3.5 text-white" />
                        Running Pipeline...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 fill-white" />
                        Execute Coordinated Multi-Agent Run
                      </>
                    )}
                  </button>
                </div>

                {/* Pipeline Execution Progress Indicator */}
                {activeRun && (
                  <div className="glass-card rounded-xl p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                      <div className="flex items-center gap-2.5">
                        <Cpu className="h-4 w-4 text-violet-400" />
                        <span className="text-xs font-bold">Execution Status:</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          activeRun.status === 'completed' ? 'text-emerald-400 bg-emerald-500/10' :
                          activeRun.status === 'failed' ? 'text-red-400 bg-red-500/10' :
                          'text-violet-400 bg-violet-500/10 animate-pulse'
                        }`}>{activeRun.status}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-semibold">
                        {activeRun.durationMs ? `Duration: ${(activeRun.durationMs / 1000).toFixed(1)}s` : 'Processing...'}
                      </div>
                    </div>

                    {/* Progress grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {agentsList.map(agent => {
                        const out = getAgentRunOutput(agent.id);
                        const metric = getAgentMetric(agent.id);
                        const status = out ? out.status : (runningPipeline ? 'pending' : 'idle');
                        
                        return (
                          <div 
                            key={agent.id}
                            onClick={() => {
                              setSelectedAgentId(agent.id);
                              setShowLogs(true);
                            }}
                            className={`p-3 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                              status === 'completed' ? 'bg-zinc-900/40 border-zinc-800' :
                              status === 'failed' ? 'bg-red-950/5 border-red-900/30' :
                              status === 'pending' ? 'bg-violet-950/5 border-violet-900/40 animate-pulse' :
                              'bg-zinc-950 border-zinc-900'
                            }`}
                          >
                            <span className="text-[8px] font-bold text-zinc-500 uppercase truncate max-w-full" title={agent.name}>{agent.name}</span>
                            {status === 'completed' ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : status === 'failed' ? (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            ) : status === 'pending' ? (
                              <span className="sv-spinner h-4 w-4 text-violet-500" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border border-zinc-700 bg-zinc-900" />
                            )}
                            <span className="text-[8px] text-zinc-400 font-semibold">{metric ? `${metric.executionTimeMs}ms` : 'Idle'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Structured Agent Card Details */}
                {activeRun && runDetails && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* List of Agents & outputs */}
                    <div className="md:col-span-2 flex flex-col gap-4">
                      <h3 className="text-sm font-bold text-zinc-300">Detailed Agent Output Reports</h3>
                      <div className="flex flex-col gap-4">
                        {agentsList.map(agent => {
                          const runOut = getAgentRunOutput(agent.id);
                          const isFailed = runOut?.status === 'failed';
                          const details = runOut?.output || {};

                          return (
                            <div key={agent.id} className="glass-card rounded-xl p-5 flex flex-col gap-3">
                              <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5">
                                <div className="flex flex-col gap-0.5">
                                  <h4 className="text-xs font-bold text-zinc-200">{agent.name}</h4>
                                  <p className="text-[9px] text-zinc-500">{agent.role}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isFailed ? (
                                    <button 
                                      onClick={() => handleRetryAgent(agent.id)}
                                      className="flex items-center gap-1 text-[8px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded hover:bg-red-500/20 transition-all"
                                    >
                                      <RefreshCw className="h-2.5 w-2.5" />
                                      Retry Agent
                                    </button>
                                  ) : (
                                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Active Output</span>
                                  )}
                                </div>
                              </div>

                              {/* Details display */}
                              {isFailed ? (
                                <p className="text-xs text-red-400 pl-0.5">Error: {runOut.errorMessage || 'Agent execution failed.'}</p>
                              ) : runOut ? (
                                <div className="flex flex-col gap-3 text-xs text-zinc-300">
                                  {/* Score metrics if exists */}
                                  {runOut.output.score !== undefined && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-zinc-500 font-bold uppercase">Assessment:</span>
                                      <span className="text-xs font-black text-violet-400">{runOut.output.score}/100</span>
                                    </div>
                                  )}

                                  {/* Render generic JSON detail nodes */}
                                  <div className="flex flex-col gap-2 bg-zinc-900/30 p-3 rounded-lg border border-zinc-900">
                                    {Object.entries(details).map(([key, val]: any) => {
                                      if (key === 'score') return null;
                                      return (
                                        <div key={key} className="flex flex-col gap-0.5">
                                          <span className="text-[9px] text-zinc-500 uppercase font-bold">{key.replace(/([A-Z])/g, ' $1')}</span>
                                          <span className="font-semibold text-zinc-200">
                                            {Array.isArray(val) ? val.join(', ') : typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[10px] text-zinc-500 italic pl-0.5">Pending pipeline processing...</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Shared memory & Console Logs sidebar */}
                    <div className="flex flex-col gap-6">
                      
                      {/* Logs Modal or Sidebar */}
                      {showLogs && (
                        <div className="glass-card rounded-xl p-5 border-l-2 border-violet-500 flex flex-col gap-3">
                          <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                              <Terminal className="h-4 w-4" />
                              Execution logs console
                            </span>
                            <button 
                              onClick={() => {
                                setShowLogs(false);
                                setSelectedAgentId(null);
                              }}
                              className="text-[10px] text-zinc-500 hover:text-zinc-300 font-bold"
                            >
                              Hide
                            </button>
                          </div>
                          
                          <div className="max-h-60 overflow-y-auto flex flex-col gap-2 font-mono text-[9px] bg-zinc-950 p-3 rounded border border-zinc-900">
                            {runDetails.logs
                              .filter((l: any) => !selectedAgentId || l.agentId === selectedAgentId)
                              .map((log: any, idx: number) => (
                                <div key={idx} className={`${
                                  log.logLevel === 'error' ? 'text-red-400' : 'text-zinc-400'
                                }`}>
                                  [{log.logLevel.toUpperCase()}] {log.message}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Shared Memory Broker */}
                      <div className="glass-card rounded-xl p-5 flex flex-col gap-4">
                        <div className="border-b border-zinc-900 pb-2 flex justify-between items-center">
                          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Dna className="h-4 w-4 text-violet-400" />
                            Shared Memory context
                          </h3>
                        </div>
                        <div className="flex flex-col gap-3.5">
                          {[
                            { key: 'repository_context', label: 'Repository Context (lockfiles, manifest)' },
                            { key: 'repository_metadata', label: 'Owner & Default Branch' },
                          ].map(item => (
                            <div key={item.key} className="bg-zinc-900/40 border border-zinc-900 rounded p-3 flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-zinc-300">{item.label}</span>
                              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Key: {item.key}</span>
                              <span className="text-[9px] text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 self-start mt-1">Shared Context Loaded</span>
                            </div>
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
