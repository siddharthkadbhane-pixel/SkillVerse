'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import { Search, MapPin, Briefcase, DollarSign, ShieldCheck, ExternalLink, Filter, Building2 } from 'lucide-react';

const JOB_TYPES = ['All', 'Full-time', 'Contract', 'Remote', 'Part-time'];

export default function JobsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    const load = async () => {
      try {
        const [profRes, jobRes] = await Promise.allSettled([
          fetch('/api/profile').then(r => r.json()),
          fetch('/api/jobs').then(r => r.json()),
        ]);
        if (profRes.status === 'fulfilled' && profRes.value.success) setProfile(profRes.value.data);
        if (jobRes.status === 'fulfilled' && jobRes.value.success) setJobs(jobRes.value.data ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const trustScore = profile?.trustScore?.overallScore ?? 0;

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    const match = !q || (j.title||'').toLowerCase().includes(q) || (j.company||'').toLowerCase().includes(q);
    const typeMatch = typeFilter === 'All' || (j.jobType||'').toLowerCase().includes(typeFilter.toLowerCase());
    return match && typeMatch;
  });

  const matchPct = (j: any) => {
    const req = j.trustScoreRequired ?? j.minTrustScore ?? 0;
    if (!req) return 100;
    return Math.min(100, Math.round((trustScore / req) * 100));
  };

  const matchBadge = (pct: number) => {
    if (pct >= 100) return <span className="sv-badge sv-badge-green">Match</span>;
    if (pct >= 80)  return <span className="sv-badge sv-badge-amber">Close</span>;
    return <span className="sv-badge sv-badge-red">Low</span>;
  };

  return (
    <div className="sv-app">
      <Navbar
        user={profile?.profile ? { name: profile.profile.name, username: profile.profile.username, avatarUrl: profile.profile.avatarUrl } : null}
        breadcrumb="Jobs"
      />
      <div className="sv-workspace">
        <Sidebar trustScore={profile?.trustScore} />
        <main className="sv-content">
          <div className="sv-page">
            <div className="sv-page-header">
              <div>
                <h1 className="sv-page-title">Jobs</h1>
                <p className="sv-page-desc">{jobs.length} opportunities matched to your Trust Score</p>
              </div>
            </div>

            {/* Metric row */}
            <div className="sv-stats-row" style={{ marginBottom: 16 }}>
              <div className="sv-stat-cell">
                <div className="sv-stat-label">Your Trust Score</div>
                <div className="sv-stat-value" style={{ color: trustScore >= 700 ? 'var(--sv-success)' : trustScore >= 400 ? 'var(--sv-warning)' : 'var(--sv-danger)' }}>
                  {trustScore}
                </div>
                <div className="sv-stat-meta">/ 1000 points</div>
              </div>
              <div className="sv-stat-cell">
                <div className="sv-stat-label">Eligible Roles</div>
                <div className="sv-stat-value">{jobs.filter(j => matchPct(j) >= 100).length}</div>
              </div>
              <div className="sv-stat-cell">
                <div className="sv-stat-label">Total Listings</div>
                <div className="sv-stat-value">{jobs.length}</div>
              </div>
              <div className="sv-stat-cell">
                <div className="sv-stat-label">Remote Available</div>
                <div className="sv-stat-value">{jobs.filter(j => (j.jobType||'').toLowerCase().includes('remote')).length}</div>
              </div>
            </div>

            {/* Filter */}
            <div className="sv-card" style={{ marginBottom: 16 }}>
              <div style={{ padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center', borderBottom: '1px solid var(--sv-border)' }}>
                <div className="sv-search" style={{ maxWidth: 300 }}>
                  <Search style={{ width: 13, height: 13, color: 'var(--sv-text-dim)', flexShrink: 0 }} />
                  <input
                    placeholder="Search roles or companies..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {JOB_TYPES.map(t => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`sv-btn sv-btn-sm ${typeFilter === t ? 'sv-btn-primary' : 'sv-btn-ghost'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--sv-text-subtle)' }}>{filtered.length} results</span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="sv-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Role</th>
                      <th>Location</th>
                      <th>Type</th>
                      <th>Trust Required</th>
                      <th>Salary</th>
                      <th>Match</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array(6).fill(0).map((_, i) => (
                        <tr key={i}>{[100, 160, 100, 80, 90, 90, 60, 70].map((w, j) => (
                          <td key={j}><div className="sv-skeleton" style={{ height: 12, width: w }} /></td>
                        ))}</tr>
                      ))
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={8}>
                        <div className="sv-empty">
                          <Briefcase style={{ width: 24, height: 24, color: 'var(--sv-text-dim)' }} />
                          <div className="sv-empty-title">{search ? 'No jobs match your search' : 'No jobs available right now'}</div>
                          <div className="sv-empty-desc">Improve your Trust Score to unlock more opportunities.</div>
                        </div>
                      </td></tr>
                    ) : (
                      filtered.map((job, i) => {
                        const pct = matchPct(job);
                        const req = job.trustScoreRequired ?? job.minTrustScore ?? 0;
                        const meetsReq = !req || trustScore >= req;
                        return (
                          <tr key={i}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 22, height: 22, borderRadius: 4, background: 'var(--sv-surface-2)', border: '1px solid var(--sv-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <Building2 style={{ width: 11, height: 11, color: 'var(--sv-text-dim)' }} />
                                </div>
                                <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--sv-text)' }}>{job.company || '—'}</span>
                              </div>
                            </td>
                            <td className="sv-td-primary">{job.title || job.jobTitle || '—'}</td>
                            <td style={{ fontSize: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--sv-text-subtle)' }}>
                                <MapPin style={{ width: 10, height: 10 }} />
                                {job.location || 'Remote'}
                              </div>
                            </td>
                            <td><span className="sv-chip">{job.jobType || 'Full-time'}</span></td>
                            <td>
                              {req > 0 ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <ShieldCheck style={{ width: 11, height: 11, color: meetsReq ? 'var(--sv-success)' : 'var(--sv-danger)' }} />
                                  <span style={{ fontSize: 12, color: meetsReq ? 'var(--sv-success)' : 'var(--sv-danger)', fontWeight: 500 }}>
                                    {req}+
                                  </span>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--sv-text-dim)', fontSize: 12 }}>None</span>
                              )}
                            </td>
                            <td style={{ fontSize: 12, color: 'var(--sv-text-muted)' }}>
                              {job.salaryMin && job.salaryMax
                                ? `$${Math.round(job.salaryMin / 1000)}k–$${Math.round(job.salaryMax / 1000)}k`
                                : job.salaryRange || '—'}
                            </td>
                            <td>{matchBadge(pct)}</td>
                            <td>
                              <a
                                href={job.applyUrl || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`sv-btn sv-btn-sm ${meetsReq ? 'sv-btn-primary' : 'sv-btn-secondary'}`}
                              >
                                <ExternalLink style={{ width: 11, height: 11 }} />
                                Apply
                              </a>
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
