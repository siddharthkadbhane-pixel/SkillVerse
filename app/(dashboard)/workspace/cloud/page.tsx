'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import { 
  Play, Terminal, Cpu, HardDrive, CheckCircle2, AlertCircle, RefreshCw,
  FolderOpen, FileCode, PlayCircle, Settings, Plus, ExternalLink, Activity, History
} from 'lucide-react';

export default function CloudWorkspacePage() {
  const [profile, setProfile] = useState<any>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeWsId, setActiveWsId] = useState<string>('');
  const [newWsName, setNewWsName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Editor State
  const [fileName, setFileName] = useState('app.js');
  const [codeContent, setCodeContent] = useState(`// Welcome to SkillVerse Cloud Sandbox\nconsole.log("Hello from secure container sandbox!");\n\n// Try simple loops or variables\nlet val = 10;\nfor (let i = 0; i < 5; i++) {\n  val += i;\n}\nconsole.log("Computed output value:", val);`);
  const [language, setLanguage] = useState('node');

  // Terminal & CI/CD Telemetry State
  const [consoleLogs, setConsoleLogs] = useState<string[]>(['[Terminal Ready] - Select commands to execute script inside isolated vm sandbox...']);
  const [executing, setExecuting] = useState(false);
  const [building, setBuilding] = useState(false);
  const [deploying, setDeploying] = useState(false);

  const [runtimeDetails, setRuntimeDetails] = useState<any>(null);
  const [artifactsList, setArtifactsList] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profRes, wsRes] = await Promise.all([
        fetch('/api/profile').then(r => r.json()),
        fetch('/api/workspaces').then(r => r.json()),
      ]);

      if (profRes.success) setProfile(profRes.data);
      if (wsRes.success) {
        const list = wsRes.data || [];
        setWorkspaces(list);
        if (list.length > 0) setActiveWsId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load cloud workspace details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadWorkspaceMetrics = async () => {
    if (!activeWsId) return;
    try {
      const [runRes, artRes] = await Promise.all([
        fetch(`/api/runtime?workspaceId=${activeWsId}`).then(r => r.json()),
        fetch(`/api/artifacts?workspaceId=${activeWsId}`).then(r => r.json()),
      ]);

      if (runRes.success) setRuntimeDetails(runRes.data);
      if (artRes.success) setArtifactsList(artRes.data || []);
    } catch {}
  };

  useEffect(() => {
    loadWorkspaceMetrics();
  }, [activeWsId]);

  const handleCreateWorkspace = async () => {
    if (!newWsName) return;
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWsName }),
      });
      const json = await res.json();
      if (json.success) {
        setNewWsName('');
        setShowCreateModal(false);
        await loadData();
        setActiveWsId(json.data.id);
      }
    } catch {}
  };

  const handleRunSandbox = async () => {
    if (!activeWsId || executing) return;
    setExecuting(true);
    setConsoleLogs(prev => [...prev, `\n> node isolated-execution-job.js`]);
    try {
      const res = await fetch('/api/execution/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: activeWsId, language: 'javascript', code: codeContent }),
      });
      const json = await res.json();
      if (json.success) {
        const out = json.data;
        if (out.stdout) setConsoleLogs(prev => [...prev, out.stdout]);
        if (out.stderr) setConsoleLogs(prev => [...prev, `[stderr]: ${out.stderr}`]);
        setConsoleLogs(prev => [...prev, `[Job Finished] - Exit code: ${out.exitCode}`]);
        loadWorkspaceMetrics();
      }
    } catch {
      setConsoleLogs(prev => [...prev, `❌ VM runner sandbox crashed.`]);
    } finally {
      setExecuting(false);
    }
  };

  const handleTriggerBuild = async () => {
    if (!activeWsId || building) return;
    setBuilding(true);
    setConsoleLogs(prev => [...prev, `\n> npm run build`]);
    try {
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: activeWsId }),
      });
      const json = await res.json();
      if (json.success) {
        setConsoleLogs(prev => [...prev, `✅ Build complete. Bundle generated: ${json.data.artifact.fileName}`]);
        loadWorkspaceMetrics();
      }
    } catch {
      setConsoleLogs(prev => [...prev, `❌ Compilation build failed.`]);
    } finally {
      setBuilding(false);
    }
  };

  const handleRunTests = async () => {
    if (!activeWsId) return;
    setConsoleLogs(prev => [...prev, `\n> npm run test`]);
    try {
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: activeWsId }),
      });
      const json = await res.json();
      if (json.success) {
        setConsoleLogs(prev => [...prev, `✅ Test suite completed: ${json.data.testsPassed} passed, ${json.data.testsFailed} failed.`]);
        loadWorkspaceMetrics();
      }
    } catch {
      setConsoleLogs(prev => [...prev, `❌ Test runner execution failed.`]);
    }
  };

  const handleDeploy = async () => {
    if (!activeWsId || deploying) return;
    setDeploying(true);
    setConsoleLogs(prev => [...prev, `\n> vercel --prod`]);
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId: activeWsId, platform: 'vercel' }),
      });
      const json = await res.json();
      if (json.success) {
        setConsoleLogs(prev => [...prev, `🚀 Deploy finished. Live URL: ${json.data.deploymentUrl}`]);
        loadWorkspaceMetrics();
      }
    } catch {
      setConsoleLogs(prev => [...prev, `❌ Deployment connection failed.`]);
    } finally {
      setDeploying(false);
    }
  };

  const selectedWs = workspaces.find(w => w.id === activeWsId);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <Navbar user={profile?.profile} breadcrumb="Cloud IDE" />
      <div className="flex flex-1">
        <Sidebar trustScore={profile?.trustScore} />
        
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">Cloud Workspace</h1>
                <p className="text-xs text-zinc-400">Secure sandboxed execution environment and integrated CI/CD pipelines</p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={activeWsId}
                  onChange={e => setActiveWsId(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none text-white w-48"
                >
                  {workspaces.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Workspace
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-24">
                <span className="sv-spinner h-6 w-6 text-violet-500" />
              </div>
            ) : !selectedWs ? (
              <div className="glass-card rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3">
                <FolderOpen className="h-12 w-12 text-zinc-700 animate-pulse" />
                <h3 className="text-sm font-bold text-white">No Cloud Workspaces connected</h3>
                <p className="text-zinc-500 text-xs max-w-sm mt-1">Create an isolated workspace to write code, execute scripts, and verify pipelines.</p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="mt-2 flex items-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2 text-xs font-bold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Workspace
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                
                {/* IDE Panels Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[440px]">
                  
                  {/* Left Side: Explorer sidebar */}
                  <div className="glass-card rounded-xl p-4 flex flex-col gap-3 h-full">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Project Explorer</span>
                    <div className="flex flex-col gap-2.5 text-xs text-zinc-300">
                      {[
                        { name: 'app.js', type: 'file' },
                        { name: 'package.json', type: 'config' },
                        { name: 'tsconfig.json', type: 'config' },
                        { name: 'README.md', type: 'readme' },
                      ].map(item => (
                        <div 
                          key={item.name}
                          onClick={() => setFileName(item.name)}
                          className={`flex items-center gap-2 cursor-pointer p-1.5 rounded transition-all ${
                            fileName === item.name ? 'bg-violet-650/10 text-violet-300' : 'hover:bg-zinc-900/40'
                          }`}
                        >
                          <FileCode className="h-3.5 w-3.5 text-zinc-500" />
                          <span className="font-medium">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Center Panel: Editor area */}
                  <div className="glass-card rounded-xl p-4 md:col-span-2 flex flex-col gap-3 h-full">
                    <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                      <span className="text-xs font-bold text-zinc-300">{fileName}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleRunSandbox}
                          disabled={executing}
                          className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded"
                        >
                          <Play className="h-2.5 w-2.5" />
                          Execute VM
                        </button>
                        <button 
                          onClick={handleTriggerBuild}
                          disabled={building}
                          className="flex items-center gap-1 text-[9px] font-bold text-violet-400 bg-violet-500/10 px-2 py-1 rounded"
                        >
                          <Cpu className="h-2.5 w-2.5" />
                          Build bundle
                        </button>
                        <button 
                          onClick={handleRunTests}
                          className="flex items-center gap-1 text-[9px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded"
                        >
                          <Settings className="h-2.5 w-2.5" />
                          Run Tests
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={codeContent}
                      onChange={e => setCodeContent(e.target.value)}
                      className="flex-1 w-full bg-zinc-900/40 text-xs font-mono p-4 rounded-lg border border-zinc-900 focus:outline-none focus:border-violet-500 text-zinc-300 resize-none h-[300px]"
                    />
                  </div>

                  {/* Right Panel: Terminal Output console */}
                  <div className="glass-card rounded-xl p-4 flex flex-col gap-3 h-full overflow-hidden">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5" />
                      Sandbox Terminal console
                    </span>

                    <div className="flex-1 overflow-y-auto bg-black p-3.5 rounded-lg border border-zinc-900 font-mono text-[9px] text-emerald-400 leading-normal flex flex-col gap-1.5 h-[320px]">
                      {consoleLogs.map((log, idx) => (
                        <div key={idx} className="whitespace-pre-wrap">{log}</div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Bottom Panel: CI/CD Telemetry dashboards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Resource consumption limits */}
                  <div className="glass-card rounded-xl p-5 flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-900 pb-2.5 flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-violet-400" />
                      Runtime telemetry
                    </h3>

                    {runtimeDetails?.resourceUsage && runtimeDetails.resourceUsage.length > 0 ? (
                      <div className="flex flex-col gap-4 text-xs text-zinc-400">
                        <div className="flex justify-between">
                          <span>Active Containers:</span>
                          <span className="font-semibold text-zinc-200">1 Online</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Memory Limit:</span>
                          <span className="font-semibold text-zinc-200">512 MB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Compute Quota:</span>
                          <span className="font-semibold text-zinc-200">{(runtimeDetails.resourceUsage[0].cpuShares * 10)}% CPU shares</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-zinc-500 italic">No resources allocated. Execute a VM runner job.</div>
                    )}
                  </div>

                  {/* Artifacts Management list */}
                  <div className="glass-card rounded-xl p-5 flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-900 pb-2.5 flex items-center gap-1.5">
                      <HardDrive className="h-4 w-4 text-violet-400" />
                      Artifacts registry
                    </h3>
                    <div className="flex flex-col gap-3">
                      {artifactsList.length === 0 ? (
                        <div className="text-[10px] text-zinc-500 italic">No artifacts created yet. Compile build pipeline.</div>
                      ) : (
                        artifactsList.map((art, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-zinc-300">{art.fileName}</span>
                              <span className="text-[9px] text-zinc-500 uppercase">{art.type}</span>
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500">{(art.fileSize / 1024).toFixed(1)} KB</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Cloud integrations deployment */}
                  <div className="glass-card rounded-xl p-5 flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-900 pb-2.5 flex items-center gap-1.5">
                      <History className="h-4 w-4 text-violet-400" />
                      Deployment hooks
                    </h3>
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={handleDeploy}
                        disabled={deploying}
                        className="flex items-center justify-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-zinc-850"
                      >
                        Deploy to Vercel
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* Create Workspace Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Initialize cloud workspace</h3>
                  <input
                    placeholder="Workspace name (e.g. node-playground)"
                    value={newWsName}
                    onChange={e => setNewWsName(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-violet-500 text-white w-full"
                  />
                  <div className="flex gap-3 justify-end mt-2">
                    <button 
                      onClick={() => setShowCreateModal(false)}
                      className="text-xs text-zinc-400 font-bold hover:underline"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleCreateWorkspace}
                      className="bg-violet-600 hover:bg-violet-500 text-xs font-bold px-4 py-2 rounded-lg text-white"
                    >
                      Create
                    </button>
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
