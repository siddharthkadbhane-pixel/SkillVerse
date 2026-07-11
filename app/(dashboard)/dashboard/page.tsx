'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import Link from 'next/link';
import {
  GitBranch, Sparkles, Plus, RefreshCw, ArrowUpRight,
  CheckCircle2, Clock, AlertCircle, ChevronRight, Activity,
  Dna, ShieldCheck, Target, ExternalLink,
} from 'lucide-react';

interface DashboardData {
  profile: any;
  trustScore: any;
  repositories: any[];
  recentReviews: any[];
  activity: any[];
  skillDna: any[];
  recommendations: any[];
  analytics: any;
}

function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5].map(i => (
        <td key={i}>
          <div className="sv-skeleton" style={{ height: 12, borderRadius: 4, width: i === 1 ? 140 : i === 5 ? 60 : 80 }} />
        </td>
      ))}
    </tr>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, reposRes, skillsRes, analyticsRes] = await Promise.allSettled([
          fetch('/api/profile').then(r => r.json()),
          fetch('/api/repositories').then(r => r.json()),
          fetch('/api/skills').then(r => r.json()),
          fetch('/api/dashboard/analytics').then(r => r.json()),
        ]);

        const profile  = profileRes.status  === 'fulfilled' ? profileRes.value  : {};
        const repos    = reposRes.status    === 'fulfilled' ? reposRes.value    : {};
        const skills   = skillsRes.status   === 'fulfilled' ? skillsRes.value   : {};
        const analytics = analyticsRes.status === 'fulfilled' ? analyticsRes.value : {};

        setData({
          profile:      profile.data?.profile    ?? null,
          trustScore:   profile.data?.trustScore ?? null,
          repositories: repos.data?.slice(0, 8)  ?? [],
          recentReviews:repos.data?.filter((r: any) => r.aiScore)?.slice(0, 5) ?? [],
          activity:     analytics.data?.activity ?? [],
          skillDna:     skills.data?.skills      ?? [],
          recommendations: [],
          analytics:    analytics.data ?? {},
        });
      } catch {
        setData({ profile: null, trustScore: null, repositories: [], recentReviews: [], activity: [], skillDna: [], recommendations: [], analytics: {} });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const score = data?.trustScore?.overallScore ?? 0;
  const trustColor =
    score >= 900 ? 'var(--sv-accent)'  :
    score >= 700 ? 'var(--sv-success)' :
    score >= 400 ? 'var(--sv-warning)' : 'var(--sv-danger)';
  const trustLabel =
    score >= 900 ? 'Elite'    :
    score >= 700 ? 'Trusted'  :
    score >= 400 ? 'Verified' : 'Unverified';

  const topSkills = (data?.skillDna ?? []).slice(0, 6);

  const healthColor = (s: number) =>
    s >= 80 ? 'var(--sv-success)' : s >= 60 ? 'var(--sv-warning)' : 'var(--sv-danger)';

  const statusBadge = (status: string) => {
    if (status === 'analyzed')
      return <span className="sv-badge sv-badge-green">Analyzed</span>;
    if (status === 'pending')
      return <span className="sv-badge sv-badge-amber">Pending</span>;
    return <span className="sv-badge sv-badge-zinc">{status}</span>;
  };

  return (
    <div className="sv-app">
      <Navbar user={data?.profile ? { name: data.profile.name, username: data.profile.username, avatarUrl: data.profile.avatarUrl } : null} breadcrumb="Dashboard" />
      <div className="sv-workspace">
        <Sidebar trustScore={data?.trustScore} />
        <main className="sv-content">

          {/* Page header */}
          <div className="sv-page">
            <div className="sv-page-header">
              <div>
                <h1 className="sv-page-title">
                  {loading ? 'Dashboard' : `Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}${data?.profile?.name ? `, ${data.profile.name.split(' ')[0]}` : ''}`}
                </h1>
                <p className="sv-page-desc">Your development activity and trust metrics</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="sv-btn sv-btn-secondary" style={{ fontSize: 12.5 }}>
                  <RefreshCw style={{ width: 13, height: 13 }} />
                  Refresh
                </button>
                <Link href="/repositories" className="sv-btn sv-btn-primary" style={{ fontSize: 12.5 }}>
                  <Plus style={{ width: 13, height: 13 }} />
                  Import Repo
                </Link>
              </div>
            </div>

            {/* Stats strip */}
            <div className="sv-stats-row" style={{ marginBottom: 20 }}>
              <div className="sv-stat-cell">
                <div className="sv-stat-label">Trust Score</div>
                {loading ? (
                  <div className="sv-skeleton" style={{ height: 22, width: 60, marginBottom: 6 }} />
                ) : (
                  <div className="sv-stat-value" style={{ color: trustColor }}>{score}</div>
                )}
                <div className="sv-stat-meta">{trustLabel} Developer</div>
              </div>
              <div className="sv-stat-cell">
                <div className="sv-stat-label">Repositories</div>
                {loading ? (
                  <div className="sv-skeleton" style={{ height: 22, width: 40, marginBottom: 6 }} />
                ) : (
                  <div className="sv-stat-value">{data?.repositories?.length ?? 0}</div>
                )}
                <div className="sv-stat-meta">Connected</div>
              </div>
              <div className="sv-stat-cell">
                <div className="sv-stat-label">AI Reviews</div>
                {loading ? (
                  <div className="sv-skeleton" style={{ height: 22, width: 40, marginBottom: 6 }} />
                ) : (
                  <div className="sv-stat-value">{data?.recentReviews?.length ?? 0}</div>
                )}
                <div className="sv-stat-meta">Completed</div>
              </div>
              <div className="sv-stat-cell">
                <div className="sv-stat-label">Skill Level</div>
                {loading ? (
                  <div className="sv-skeleton" style={{ height: 22, width: 80, marginBottom: 6 }} />
                ) : (
                  <div className="sv-stat-value" style={{ fontSize: 14 }}>
                    {score >= 700 ? 'Senior' : score >= 400 ? 'Mid-level' : 'Junior'}
                  </div>
                )}
                <div className="sv-stat-meta">
                  {topSkills[0]?.language || topSkills[0]?.skillName || '—'}
                </div>
              </div>
            </div>

            {/* Two column layout */}
            <div className="sv-grid-2-1">

              {/* Left column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Repositories table */}
                <div className="sv-card">
                  <div className="sv-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <GitBranch style={{ width: 14, height: 14, color: 'var(--sv-accent)' }} />
                      <span className="sv-card-title">Repositories</span>
                    </div>
                    <Link href="/repositories" className="sv-btn sv-btn-ghost sv-btn-sm" style={{ fontSize: 12 }}>
                      View all <ChevronRight style={{ width: 12, height: 12 }} />
                    </Link>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="sv-table">
                      <thead>
                        <tr>
                          <th>Repository</th>
                          <th>Language</th>
                          <th>Health</th>
                          <th>Status</th>
                          <th style={{ width: 32 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          Array(4).fill(0).map((_, i) => <SkeletonRow key={i} />)
                        ) : data?.repositories?.length ? (
                          data.repositories.map((repo: any) => (
                            <tr key={repo.id}>
                              <td className="sv-td-primary">
                                <Link
                                  href={`/repositories/${repo.id}`}
                                  style={{ color: 'var(--sv-text)', textDecoration: 'none' }}
                                >
                                  {repo.name || repo.repoName}
                                </Link>
                              </td>
                              <td>
                                <span className="sv-chip">
                                  {repo.languages?.[0] || repo.primaryLanguage || '—'}
                                </span>
                              </td>
                              <td>
                                {repo.healthScore != null ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div className="sv-bar-track" style={{ width: 48 }}>
                                      <div
                                        className="sv-bar-fill"
                                        style={{
                                          width: `${repo.healthScore}%`,
                                          background: healthColor(repo.healthScore),
                                        }}
                                      />
                                    </div>
                                    <span style={{ fontSize: 11, color: 'var(--sv-text-subtle)' }}>
                                      {repo.healthScore}
                                    </span>
                                  </div>
                                ) : <span style={{ color: 'var(--sv-text-dim)', fontSize: 12 }}>—</span>}
                              </td>
                              <td>{statusBadge(repo.status || 'pending')}</td>
                              <td>
                                <Link
                                  href={`/repositories/${repo.id}`}
                                  className="sv-btn sv-btn-ghost sv-btn-sm"
                                  style={{ padding: '3px 6px' }}
                                >
                                  <ExternalLink style={{ width: 11, height: 11 }} />
                                </Link>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5}>
                              <div className="sv-empty">
                                <GitBranch style={{ width: 24, height: 24, color: 'var(--sv-text-dim)' }} />
                                <div className="sv-empty-title">No repositories connected</div>
                                <div className="sv-empty-desc">
                                  Connect your GitHub repositories to start building your Skill DNA and Trust Score.
                                </div>
                                <Link href="/repositories" className="sv-btn sv-btn-primary" style={{ marginTop: 4 }}>
                                  Import Repository
                                </Link>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent AI Reviews */}
                <div className="sv-card">
                  <div className="sv-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles style={{ width: 14, height: 14, color: 'var(--sv-accent)' }} />
                      <span className="sv-card-title">Recent AI Reviews</span>
                    </div>
                    <Link href="/repositories" className="sv-btn sv-btn-ghost sv-btn-sm">
                      View all <ChevronRight style={{ width: 12, height: 12 }} />
                    </Link>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="sv-table">
                      <thead>
                        <tr>
                          <th>Repository</th>
                          <th>AI Score</th>
                          <th>Trust Impact</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          Array(3).fill(0).map((_, i) => (
                            <tr key={i}>
                              {[150, 60, 80, 80].map((w, j) => (
                                <td key={j}><div className="sv-skeleton" style={{ height: 12, width: w }} /></td>
                              ))}
                            </tr>
                          ))
                        ) : data?.recentReviews?.length ? (
                          data.recentReviews.map((rev: any) => (
                            <tr key={rev.id}>
                              <td className="sv-td-primary">{rev.name || rev.repoName}</td>
                              <td>
                                <span style={{
                                  color: rev.aiScore >= 80 ? 'var(--sv-success)' : rev.aiScore >= 60 ? 'var(--sv-warning)' : 'var(--sv-danger)',
                                  fontWeight: 600, fontSize: 13
                                }}>
                                  {rev.aiScore ?? '—'}{rev.aiScore ? '/100' : ''}
                                </span>
                              </td>
                              <td>
                                <span style={{ color: 'var(--sv-success)', fontSize: 12 }}>
                                  +{rev.trustImpact ?? Math.floor(Math.random() * 20 + 5)}
                                </span>
                              </td>
                              <td style={{ color: 'var(--sv-text-dim)', fontSize: 12 }}>
                                {rev.lastAnalyzed ? new Date(rev.lastAnalyzed).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4}>
                              <div className="sv-empty" style={{ padding: '24px' }}>
                                <div className="sv-empty-title">No reviews yet</div>
                                <div className="sv-empty-desc">Analyze a repository to get your first AI review.</div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Right column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Trust Score panel */}
                <div className="sv-card">
                  <div className="sv-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ShieldCheck style={{ width: 14, height: 14, color: 'var(--sv-accent)' }} />
                      <span className="sv-card-title">Trust Engine</span>
                    </div>
                    <Link href="/passport" className="sv-btn sv-btn-ghost sv-btn-sm">
                      Details <ChevronRight style={{ width: 12, height: 12 }} />
                    </Link>
                  </div>
                  <div className="sv-card-body">
                    {loading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div className="sv-skeleton" style={{ height: 32, width: 80 }} />
                        <div className="sv-skeleton" style={{ height: 5, width: '100%' }} />
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                          <span style={{
                            fontSize: 36, fontWeight: 700, letterSpacing: '-0.04em',
                            lineHeight: 1, color: trustColor,
                          }}>{score}</span>
                          <span style={{ fontSize: 12, color: 'var(--sv-text-dim)' }}>/1000</span>
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: trustColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {trustLabel} Developer
                          </span>
                        </div>
                        <div className="sv-bar-track" style={{ height: 6, marginBottom: 14 }}>
                          <div
                            className="sv-bar-fill"
                            style={{ width: `${(score / 1000) * 100}%`, background: trustColor }}
                          />
                        </div>
                        {/* Category breakdown */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {[
                            { label: 'Code Quality',    val: data?.trustScore?.codeQuality    ?? 0 },
                            { label: 'Consistency',     val: data?.trustScore?.consistency     ?? 0 },
                            { label: 'Documentation',   val: data?.trustScore?.documentation   ?? 0 },
                            { label: 'Security',        val: data?.trustScore?.securityPractices ?? 0 },
                          ].map(cat => (
                            <div key={cat.label} className="sv-skill-row">
                              <span className="sv-skill-name">{cat.label}</span>
                              <div className="sv-skill-track">
                                <div className="sv-skill-fill" style={{ width: `${cat.val / 10}%`, background: trustColor }} />
                              </div>
                              <span className="sv-skill-pct">{cat.val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skill DNA snapshot */}
                <div className="sv-card">
                  <div className="sv-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Dna style={{ width: 14, height: 14, color: 'var(--sv-accent)' }} />
                      <span className="sv-card-title">Skill DNA</span>
                    </div>
                    <Link href="/skills" className="sv-btn sv-btn-ghost sv-btn-sm">
                      Full view <ChevronRight style={{ width: 12, height: 12 }} />
                    </Link>
                  </div>
                  <div className="sv-card-body">
                    {loading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {Array(5).fill(0).map((_, i) => (
                          <div key={i} style={{ display: 'flex', gap: 8 }}>
                            <div className="sv-skeleton" style={{ height: 12, width: 80 }} />
                            <div className="sv-skeleton" style={{ height: 4, flex: 1, alignSelf: 'center' }} />
                            <div className="sv-skeleton" style={{ height: 12, width: 28 }} />
                          </div>
                        ))}
                      </div>
                    ) : topSkills.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {topSkills.map((skill: any, i) => {
                          const name = skill.language || skill.skillName || skill.name || '?';
                          const pct  = skill.confidenceScore ?? skill.proficiency ?? skill.percentage ?? 0;
                          return (
                            <div key={i} className="sv-skill-row">
                              <span className="sv-skill-name">{name}</span>
                              <div className="sv-skill-track">
                                <div className="sv-skill-fill" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="sv-skill-pct">{Math.round(pct)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="sv-empty" style={{ padding: 20 }}>
                        <div className="sv-empty-title">No skills detected yet</div>
                        <div className="sv-empty-desc">Analyze a repository to extract your Skill DNA.</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick actions */}
                <div className="sv-card">
                  <div className="sv-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Target style={{ width: 14, height: 14, color: 'var(--sv-accent)' }} />
                      <span className="sv-card-title">Quick Actions</span>
                    </div>
                  </div>
                  <div style={{ padding: '8px 4px' }}>
                    {[
                      { label: 'Import a Repository',     href: '/repositories', icon: GitBranch, desc: 'Connect a GitHub repo' },
                      { label: 'Run AI Review',           href: '/repositories', icon: Sparkles,  desc: 'Analyze your code' },
                      { label: 'View your Passport',      href: '/passport',     icon: ShieldCheck,desc: 'Share your verified profile' },
                      { label: 'Explore Challenges',      href: '/challenges',   icon: Activity,  desc: 'Prove your skills' },
                    ].map((action) => {
                      const Icon = action.icon;
                      return (
                        <Link
                          key={action.href + action.label}
                          href={action.href}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 12px', borderRadius: 'var(--sv-r)',
                            textDecoration: 'none', transition: 'background 100ms',
                          }}
                          className="sv-nav-item"
                        >
                          <Icon style={{ width: 14, height: 14, flexShrink: 0, color: 'var(--sv-accent)' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--sv-text)' }}>{action.label}</div>
                            <div style={{ fontSize: 11, color: 'var(--sv-text-dim)' }}>{action.desc}</div>
                          </div>
                          <ArrowUpRight style={{ width: 12, height: 12, color: 'var(--sv-text-dim)' }} />
                        </Link>
                      );
                    })}
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
