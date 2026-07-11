'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import Link from 'next/link';
import {
  Building2, Users, Briefcase, ShieldCheck, Plus,
  Search, ChevronRight, UserCheck, ExternalLink, BarChart2,
} from 'lucide-react';

const TABS = ['Dashboard', 'Jobs', 'Candidates', 'Analytics'];

export default function CompanyPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [profRes, compRes, candRes, jobRes] = await Promise.allSettled([
          fetch('/api/profile').then(r => r.json()),
          fetch('/api/company/dashboard').then(r => r.json()),
          fetch('/api/candidates').then(r => r.json()),
          fetch('/api/jobs').then(r => r.json()),
        ]);
        if (profRes.status === 'fulfilled'  && profRes.value.success)  setProfile(profRes.value.data);
        if (compRes.status === 'fulfilled'  && compRes.value.success)  setCompanyData(compRes.value.data);
        if (candRes.status === 'fulfilled'  && candRes.value.success)  setCandidates(candRes.value.data ?? []);
        if (jobRes.status  === 'fulfilled'  && jobRes.value.success)   setJobs(jobRes.value.data ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredCandidates = candidates.filter(c => {
    const q = search.toLowerCase();
    return !q || (c.name||'').toLowerCase().includes(q) || (c.username||'').toLowerCase().includes(q);
  });

  const trustColor = (score: number) =>
    score >= 700 ? 'var(--sv-success)' : score >= 400 ? 'var(--sv-warning)' : 'var(--sv-danger)';

  return (
    <div className="sv-app">
      <Navbar
        user={profile?.profile ? { name: profile.profile.name, username: profile.profile.username, avatarUrl: profile.profile.avatarUrl } : null}
        breadcrumb="Company Workspace"
      />
      <div className="sv-workspace">
        <Sidebar trustScore={profile?.trustScore} />
        <main className="sv-content">
          <div className="sv-page">
            <div className="sv-page-header">
              <div>
                <h1 className="sv-page-title">Company Workspace</h1>
                <p className="sv-page-desc">Hiring dashboard — recruit verified developers</p>
              </div>
              <button className="sv-btn sv-btn-primary">
                <Plus style={{ width: 13, height: 13 }} />
                Post Job
              </button>
            </div>

            {/* Tabs */}
            <div className="sv-tabs" style={{ marginBottom: 20 }}>
              {TABS.map(tab => (
                <button
                  key={tab}
                  className={`sv-tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Dashboard tab */}
            {activeTab === 'Dashboard' && (
              <>
                <div className="sv-stats-row" style={{ marginBottom: 20 }}>
                  <div className="sv-stat-cell">
                    <div className="sv-stat-label">Active Jobs</div>
                    <div className="sv-stat-value">{loading ? '—' : jobs.filter(j => j.status === 'active').length}</div>
                  </div>
                  <div className="sv-stat-cell">
                    <div className="sv-stat-label">Total Candidates</div>
                    <div className="sv-stat-value">{loading ? '—' : candidates.length}</div>
                  </div>
                  <div className="sv-stat-cell">
                    <div className="sv-stat-label">Verified Candidates</div>
                    <div className="sv-stat-value" style={{ color: 'var(--sv-success)' }}>
                      {loading ? '—' : candidates.filter(c => (c.trustScore?.overallScore ?? 0) >= 400).length}
                    </div>
                  </div>
                  <div className="sv-stat-cell">
                    <div className="sv-stat-label">Avg Trust Score</div>
                    <div className="sv-stat-value">
                      {loading ? '—' : candidates.length
                        ? Math.round(candidates.reduce((s, c) => s + (c.trustScore?.overallScore ?? 0), 0) / candidates.length)
                        : 0}
                    </div>
                  </div>
                </div>

                {/* Recent candidates */}
                <div className="sv-card" style={{ marginBottom: 16 }}>
                  <div className="sv-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users style={{ width: 14, height: 14, color: 'var(--sv-accent)' }} />
                      <span className="sv-card-title">Top Candidates</span>
                    </div>
                    <button className="sv-btn sv-btn-ghost sv-btn-sm" onClick={() => setActiveTab('Candidates')}>
                      View all <ChevronRight style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="sv-table">
                      <thead>
                        <tr>
                          <th>Candidate</th>
                          <th>Trust Score</th>
                          <th>Top Skill</th>
                          <th>Repos</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? Array(4).fill(0).map((_, i) => (
                          <tr key={i}>{[140, 80, 100, 50, 80, 70].map((w, j) => (
                            <td key={j}><div className="sv-skeleton" style={{ height: 12, width: w }} /></td>
                          ))}</tr>
                        )) : candidates.slice(0, 8).map((c, i) => {
                          const score = c.trustScore?.overallScore ?? c.overallScore ?? 0;
                          return (
                            <tr key={i}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                  {c.avatarUrl ? (
                                    <img src={c.avatarUrl} alt={c.name} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
                                  ) : (
                                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--sv-surface-2)', border: '1px solid var(--sv-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'var(--sv-accent)' }}>
                                      {(c.name || c.username || '?')[0].toUpperCase()}
                                    </div>
                                  )}
                                  <div>
                                    <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--sv-text)' }}>{c.name || c.username}</div>
                                    <div style={{ fontSize: 11, color: 'var(--sv-text-dim)' }}>@{c.username}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span style={{ color: trustColor(score), fontWeight: 600, fontSize: 13 }}>{score}</span>
                              </td>
                              <td><span className="sv-chip">{c.topSkill || '—'}</span></td>
                              <td style={{ color: 'var(--sv-text-subtle)', fontSize: 12 }}>{c.repositoryCount ?? '—'}</td>
                              <td>
                                {score >= 700
                                  ? <span className="sv-badge sv-badge-green"><ShieldCheck style={{ width: 9, height: 9 }} />Trusted</span>
                                  : score >= 400
                                  ? <span className="sv-badge sv-badge-amber">Verified</span>
                                  : <span className="sv-badge sv-badge-zinc">Unverified</span>}
                              </td>
                              <td>
                                <Link href={`/u/${c.username}`} className="sv-btn sv-btn-secondary sv-btn-sm">
                                  <ExternalLink style={{ width: 11, height: 11 }} />
                                  Profile
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Jobs tab */}
            {activeTab === 'Jobs' && (
              <div className="sv-card">
                <div style={{ overflowX: 'auto' }}>
                  <table className="sv-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Trust Req.</th>
                        <th>Salary</th>
                        <th>Applications</th>
                        <th>Status</th>
                        <th>Posted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? Array(5).fill(0).map((_, i) => (
                        <tr key={i}>{[160, 80, 80, 90, 70, 70, 90].map((w, j) => (
                          <td key={j}><div className="sv-skeleton" style={{ height: 12, width: w }} /></td>
                        ))}</tr>
                      )) : jobs.length === 0 ? (
                        <tr><td colSpan={7}>
                          <div className="sv-empty">
                            <Briefcase style={{ width: 24, height: 24, color: 'var(--sv-text-dim)' }} />
                            <div className="sv-empty-title">No jobs posted yet</div>
                            <div className="sv-empty-desc">Post your first job listing to find verified developers.</div>
                            <button className="sv-btn sv-btn-primary" style={{ marginTop: 8 }}>
                              <Plus style={{ width: 13, height: 13 }} />Post Job
                            </button>
                          </div>
                        </td></tr>
                      ) : jobs.map((j, i) => (
                        <tr key={i}>
                          <td className="sv-td-primary">{j.title || j.jobTitle}</td>
                          <td><span className="sv-chip">{j.jobType || 'Full-time'}</span></td>
                          <td style={{ fontSize: 12, color: 'var(--sv-success)' }}>{j.trustScoreRequired ?? '—'}+</td>
                          <td style={{ fontSize: 12, color: 'var(--sv-text-muted)' }}>
                            {j.salaryMin && j.salaryMax ? `$${Math.round(j.salaryMin/1000)}k–$${Math.round(j.salaryMax/1000)}k` : '—'}
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--sv-text-subtle)' }}>{j.applicationCount ?? 0}</td>
                          <td><span className={`sv-badge ${j.status === 'active' ? 'sv-badge-green' : 'sv-badge-zinc'}`}>{j.status || 'Active'}</span></td>
                          <td style={{ fontSize: 12, color: 'var(--sv-text-dim)' }}>
                            {j.createdAt ? new Date(j.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Candidates tab */}
            {activeTab === 'Candidates' && (
              <div className="sv-card">
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--sv-border)' }}>
                  <div className="sv-search" style={{ maxWidth: 280 }}>
                    <Search style={{ width: 13, height: 13, color: 'var(--sv-text-dim)', flexShrink: 0 }} />
                    <input
                      placeholder="Search candidates..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="sv-table">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Trust Score</th>
                        <th>Skills</th>
                        <th>Repos</th>
                        <th>Tier</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.map((c, i) => {
                        const score = c.trustScore?.overallScore ?? c.overallScore ?? 0;
                        return (
                          <tr key={i}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                {c.avatarUrl ? (
                                  <img src={c.avatarUrl} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--sv-accent-dim)', border: '1px solid var(--sv-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--sv-accent)' }}>
                                    {(c.name || c.username || '?')[0].toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--sv-text)' }}>{c.name}</div>
                                  <div style={{ fontSize: 11, color: 'var(--sv-text-dim)' }}>@{c.username}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div className="sv-bar-track" style={{ width: 40 }}>
                                  <div className="sv-bar-fill" style={{ width: `${score / 10}%`, background: trustColor(score) }} />
                                </div>
                                <span style={{ color: trustColor(score), fontWeight: 600, fontSize: 13 }}>{score}</span>
                              </div>
                            </td>
                            <td style={{ fontSize: 12, color: 'var(--sv-text-subtle)' }}>{c.skillCount ?? '—'} skills</td>
                            <td style={{ fontSize: 12, color: 'var(--sv-text-subtle)' }}>{c.repositoryCount ?? '—'}</td>
                            <td>
                              {score >= 700
                                ? <span className="sv-badge sv-badge-green">Trusted</span>
                                : score >= 400
                                ? <span className="sv-badge sv-badge-amber">Verified</span>
                                : <span className="sv-badge sv-badge-zinc">Unverified</span>}
                            </td>
                            <td>
                              <Link href={`/u/${c.username}`} className="sv-btn sv-btn-secondary sv-btn-sm">
                                <UserCheck style={{ width: 11, height: 11 }} />View
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
