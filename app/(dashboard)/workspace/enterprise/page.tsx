'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import { 
  Building2, GraduationCap, Award, Download, ExternalLink, ShieldCheck, 
  Trophy, HelpCircle, Key, ArrowUpRight, CheckCircle2, History 
} from 'lucide-react';

export default function EnterprisePortalPage() {
  const [profile, setProfile] = useState<any>(null);
  const [organizationsList, setOrganizationsList] = useState<any[]>([]);
  const [challengesList, setChallengesList] = useState<any[]>([]);
  const [repos, setRepos] = useState<any[]>([]);

  // Certificate Issuance State
  const [certTitle, setCertTitle] = useState('');
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Sync token State
  const [syncKey, setSyncKey] = useState('');
  const [generatingKey, setGeneratingKey] = useState(false);

  const loadData = async () => {
    try {
      const [profRes, orgRes, chalRes, repoRes] = await Promise.all([
        fetch('/api/profile').then(r => r.json()),
        fetch('/api/organizations').then(r => r.json()),
        fetch('/api/challenges').then(r => r.json()),
        fetch('/api/repositories').then(r => r.json()),
      ]);

      if (profRes.success) setProfile(profRes.data);
      if (orgRes.success) setOrganizationsList(orgRes.data || []);
      if (chalRes.success) setChallengesList(chalRes.data || []);
      if (repoRes.success) {
        // Filter only analyzed repositories with high score if possible
        setRepos(repoRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load portal telemetry:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certTitle || !selectedRepoId) return;

    setIssuing(true);
    setMessage(null);

    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: certTitle, repositoryId: selectedRepoId }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: `Success! Certificate successfully claimed.` });
        setCertTitle('');
        setSelectedRepoId('');
      } else {
        setMessage({ type: 'error', text: json.error || 'Failed to issue certificate' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error executing certificate issuance.' });
    } finally {
      setIssuing(false);
    }
  };

  const handleGenerateSyncKey = async () => {
    setGeneratingKey(true);
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'vscode' }),
      });
      const json = await res.json();
      if (json.success) {
        setSyncKey(json.data.token);
      }
    } catch {}
    setGeneratingKey(false);
  };

  const handleDownloadPassport = async (format: 'pdf' | 'json') => {
    try {
      window.open(`/api/passport?format=${format}`, '_blank');
    } catch {}
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      <Navbar user={profile?.profile} breadcrumb="Enterprise & Education Portal" />
      <div className="flex flex-1">
        <Sidebar trustScore={profile?.trustScore} />
        
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto flex flex-col gap-6">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">Ecosystem Portal</h1>
                <p className="text-xs text-zinc-400">Verifiable credentials standard for corporations, bootcamps, and universities</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadPassport('json')}
                  className="flex items-center gap-1 text-xs bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-zinc-300 font-semibold hover:bg-zinc-850"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export JSON
                </button>
                <button
                  onClick={() => handleDownloadPassport('pdf')}
                  className="flex items-center gap-1 text-xs bg-violet-650/10 border border-violet-500/20 text-violet-300 rounded-lg px-3.5 py-2 font-semibold hover:bg-violet-650/20"
                >
                  <Award className="h-3.5 w-3.5" />
                  Download PDF Passport
                </button>
              </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Column: Universities and Partners */}
              <div className="md:col-span-2 flex flex-col gap-6">
                
                {/* Academic verification network */}
                <div className="glass-card rounded-xl p-5 flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-900 pb-2.5 flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-violet-400" />
                    Connected Verification partners
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {organizationsList.map((org, idx) => (
                      <div key={idx} className="bg-zinc-900/40 border border-zinc-900 rounded-lg p-4 flex justify-between items-center">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-zinc-200">{org.name}</span>
                          <span className="text-[9px] text-zinc-500 uppercase font-semibold">{org.type}</span>
                        </div>
                        <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                          <ShieldCheck className="h-3 w-3" />
                          Authorized
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Global Challenges hacks events */}
                <div className="glass-card rounded-xl p-5 flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-900 pb-2.5 flex items-center gap-1.5">
                    <Trophy className="h-4 w-4 text-violet-400" />
                    Global challenge events network
                  </h3>

                  <div className="flex flex-col gap-3">
                    {challengesList.map((evt, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-zinc-900/40 border border-zinc-900 p-3.5 rounded-lg">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-zinc-250">{evt.title}</span>
                          <span className="text-[10px] text-zinc-400">{evt.rules}</span>
                        </div>
                        <button className="flex items-center gap-1 text-[9px] font-bold bg-violet-600 hover:bg-violet-500 px-3 py-1.5 rounded text-white">
                          Join Contest
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Issuance Certification & Extensions */}
              <div className="flex flex-col gap-6">
                
                {/* University and Capstone Certification Issuer */}
                <div className="glass-card rounded-xl p-5 flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-900 pb-2.5 flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-violet-400" />
                    Claim credential certificate
                  </h3>

                  <form onSubmit={handleIssueCertificate} className="flex flex-col gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-zinc-400 uppercase font-bold">Certificate Title</label>
                      <input
                        placeholder="e.g. NextJS Modular Architect"
                        value={certTitle}
                        onChange={e => setCertTitle(e.target.value)}
                        className="bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-zinc-400 uppercase font-bold">Evidence Repository</label>
                      <select
                        value={selectedRepoId}
                        onChange={e => setSelectedRepoId(e.target.value)}
                        className="bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
                        required
                      >
                        <option value="">Select audited repository...</option>
                        {repos.map(r => (
                          <option key={r.id} value={r.id}>{r.name} {r.isAnalyzed ? '(Audited)' : '(Not Audited)'}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={issuing}
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-xs font-bold text-white"
                    >
                      Issue Verification badge
                    </button>

                    {message && (
                      <div className={`text-[10px] p-2.5 rounded border ${
                        message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      }`}>
                        {message.text}
                      </div>
                    )}
                  </form>
                </div>

                {/* IDE plugin integrations */}
                <div className="glass-card rounded-xl p-5 flex flex-col gap-4">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-900 pb-2.5 flex items-center gap-1.5">
                    <Key className="h-4 w-4 text-violet-400" />
                    IDE extension settings
                  </h3>
                  
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    Generate an integration token to sync your verified Trust score and Skill DNA badge directly in VS Code or JetBrains plugins.
                  </p>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleGenerateSyncKey}
                      disabled={generatingKey}
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 px-4 py-2 text-xs font-bold text-white"
                    >
                      Generate Sync Key
                    </button>

                    {syncKey && (
                      <div className="bg-black p-3.5 rounded border border-zinc-900 font-mono text-[10px] text-yellow-500 break-all select-all">
                        {syncKey}
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
