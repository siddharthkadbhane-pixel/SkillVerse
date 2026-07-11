'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import Link from 'next/link';
import {
  GitBranch, Search, Plus, RefreshCw, ExternalLink,
  AlertCircle, CheckCircle2, Clock, Zap, MoreHorizontal, Filter,
} from 'lucide-react';

interface Repo {
  id: string;
  name?: string;
  repoName?: string;
  repoUrl?: string;
  primaryLanguage?: string;
  languages?: string[];
  healthScore?: number;
  aiScore?: number;
  status?: string;
  lastAnalyzed?: string;
  starsCount?: number;
  description?: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  if (status === 'analyzed')
    return <span className="sv-badge sv-badge-green"><CheckCircle2 style={{ width: 9, height: 9 }} />Analyzed</span>;
  if (status === 'analyzing')
    return <span className="sv-badge sv-badge-blue"><span className="sv-spinner" style={{ width: 9, height: 9 }} />Analyzing</span>;
  if (status === 'failed')
    return <span className="sv-badge sv-badge-red"><AlertCircle style={{ width: 9, height: 9 }} />Failed</span>;
  return <span className="sv-badge sv-badge-amber"><Clock style={{ width: 9, height: 9 }} />Pending</span>;
};

const ScoreBar = ({ value }: { value: number }) => {
  const color = value >= 80 ? 'var(--sv-success)' : value >= 60 ? 'var(--sv-warning)' : 'var(--sv-danger)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div className="sv-bar-track" style={{ width: 52 }}>
        <div className="sv-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
};

export default function RepositoriesPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [analyzing, setAnalyzing] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const [profRes, repoRes] = await Promise.allSettled([
        fetch('/api/profile').then(r => r.json()),
        fetch('/api/repositories').then(r => r.json()),
      ]);
      if (profRes.status === 'fulfilled' && profRes.value.success) setProfile(profRes.value.data);
      if (repoRes.status === 'fulfilled' && repoRes.value.success) setRepos(repoRes.value.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAnalyze = async (repoId: string) => {
    setAnalyzing(prev => new Set(prev).add(repoId));
    try {
      await fetch(`/api/repositories/${repoId}/analyze`, { method: 'POST' });
      await load();
    } finally {
      setAnalyzing(prev => { const n = new Set(prev); n.delete(repoId); return n; });
    }
  };

  const filtered = repos.filter(r => {
    const name = (r.name || r.repoName || '').toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="sv-app">
      <Navbar
        user={profile?.profile ? { name: profile.profile.name, username: profile.profile.username, avatarUrl: profile.profile.avatarUrl } : null}
        breadcrumb="Repositories"
      />
      <div className="sv-workspace">
        <Sidebar trustScore={profile?.trustScore} />
        <main className="sv-content">
          <div className="sv-page">
            {/* Header */}
            <div className="sv-page-header">
              <div>
                <h1 className="sv-page-title">Repositories</h1>
                <p className="sv-page-desc">{repos.length} repositories connected</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={load} className="sv-btn sv-btn-secondary">
                  <RefreshCw style={{ width: 13, height: 13 }} />
                  Refresh
                </button>
                <button className="sv-btn sv-btn-primary">
                  <Plus style={{ width: 13, height: 13 }} />
                  Import Repo
                </button>
              </div>
            </div>

            {/* Filter bar */}
            <div className="sv-card" style={{ marginBottom: 16 }}>
              <div className="sv-filter-bar" style={{ borderBottom: 'none', padding: '8px 12px' }}>
                <div className="sv-search" style={{ maxWidth: 300 }}>
                  <Search style={{ width: 13, height: 13, color: 'var(--sv-text-dim)', flexShrink: 0 }} />
                  <input
                    placeholder="Search repositories..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="sv-input sv-select"
                  style={{ width: 140 }}
                >
                  <option value="all">All status</option>
                  <option value="analyzed">Analyzed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--sv-text-subtle)', alignSelf: 'center' }}>
                    {filtered.length} results
                  </span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="sv-card" style={{ overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="sv-table">
                  <thead>
                    <tr>
                      <th>Repository</th>
                      <th>Language</th>
                      <th>Health Score</th>
                      <th>AI Score</th>
                      <th>Status</th>
                      <th>Last Analyzed</th>
                      <th style={{ width: 120 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array(6).fill(0).map((_, i) => (
                        <tr key={i}>
                          {[160, 80, 100, 80, 90, 90, 100].map((w, j) => (
                            <td key={j}><div className="sv-skeleton" style={{ height: 12, width: w }} /></td>
                          ))}
                        </tr>
                      ))
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="sv-empty">
                            <GitBranch style={{ width: 28, height: 28, color: 'var(--sv-text-dim)' }} />
                            <div className="sv-empty-title">
                              {search ? 'No repositories match your search' : 'No repositories connected'}
                            </div>
                            <div className="sv-empty-desc">
                              {search
                                ? 'Try a different search term or clear filters.'
                                : 'Import your GitHub repositories to start building your developer profile.'}
                            </div>
                            {!search && (
                              <button className="sv-btn sv-btn-primary" style={{ marginTop: 8 }}>
                                <Plus style={{ width: 13, height: 13 }} /> Import Repository
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map(repo => {
                        const name = repo.name || repo.repoName || 'Untitled';
                        const lang = repo.languages?.[0] || repo.primaryLanguage;
                        const isAnalyzing = analyzing.has(repo.id);
                        return (
                          <tr key={repo.id}>
                            <td className="sv-td-primary">
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Link
                                  href={`/repositories/${repo.id}`}
                                  style={{ color: 'var(--sv-text)', textDecoration: 'none', fontWeight: 500, fontSize: 13 }}
                                >
                                  {name}
                                </Link>
                                {repo.description && (
                                  <span style={{ fontSize: 11, color: 'var(--sv-text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 280, whiteSpace: 'nowrap' }}>
                                    {repo.description}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>{lang ? <span className="sv-chip">{lang}</span> : <span style={{ color: 'var(--sv-text-dim)' }}>—</span>}</td>
                            <td>{repo.healthScore != null ? <ScoreBar value={repo.healthScore} /> : <span style={{ color: 'var(--sv-text-dim)' }}>—</span>}</td>
                            <td>
                              {repo.aiScore != null ? (
                                <span style={{
                                  color: repo.aiScore >= 80 ? 'var(--sv-success)' : repo.aiScore >= 60 ? 'var(--sv-warning)' : 'var(--sv-danger)',
                                  fontWeight: 600, fontSize: 13
                                }}>
                                  {repo.aiScore}<span style={{ color: 'var(--sv-text-dim)', fontWeight: 400, fontSize: 11 }}>/100</span>
                                </span>
                              ) : <span style={{ color: 'var(--sv-text-dim)' }}>—</span>}
                            </td>
                            <td><StatusBadge status={repo.status || 'pending'} /></td>
                            <td style={{ color: 'var(--sv-text-dim)', fontSize: 12 }}>
                              {repo.lastAnalyzed ? new Date(repo.lastAnalyzed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button
                                  onClick={() => handleAnalyze(repo.id)}
                                  disabled={isAnalyzing}
                                  className="sv-btn sv-btn-secondary sv-btn-sm"
                                >
                                  {isAnalyzing ? (
                                    <><span className="sv-spinner" style={{ width: 10, height: 10 }} />Analyzing</>
                                  ) : (
                                    <><Zap style={{ width: 11, height: 11 }} />Analyze</>
                                  )}
                                </button>
                                <Link href={`/repositories/${repo.id}`} className="sv-btn sv-btn-ghost sv-btn-sm" style={{ padding: '3px 6px' }}>
                                  <ExternalLink style={{ width: 11, height: 11 }} />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
