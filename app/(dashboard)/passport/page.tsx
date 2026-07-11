'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import Link from 'next/link';
import {
  ShieldCheck, ExternalLink, Share2, Download,
  CheckCircle2, AlertCircle, RefreshCw, ChevronRight, Copy, Check,
} from 'lucide-react';

export default function PassportPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [trustScore, setTrustScore] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [repos, setRepos] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [recalculating, setRecalculating] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [profRes, skillRes, repoRes, histRes] = await Promise.allSettled([
        fetch('/api/profile').then(r => r.json()),
        fetch('/api/skills').then(r => r.json()),
        fetch('/api/repositories').then(r => r.json()),
        fetch('/api/trust/history').then(r => r.json()),
      ]);
      if (profRes.status === 'fulfilled' && profRes.value.success) {
        setProfile(profRes.value.data?.profile);
        setTrustScore(profRes.value.data?.trustScore);
      }
      if (skillRes.status === 'fulfilled' && skillRes.value.success) setSkills(skillRes.value.data?.skills ?? []);
      if (repoRes.status === 'fulfilled' && repoRes.value.success) setRepos(repoRes.value.data ?? []);
      if (histRes.status === 'fulfilled' && histRes.value.success) setHistory(histRes.value.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await fetch('/api/trust/recalculate', { method: 'POST' });
      await load();
    } finally {
      setRecalculating(false);
    }
  };

  const copyPassportLink = () => {
    if (profile?.username) {
      navigator.clipboard.writeText(`${window.location.origin}/passport/${profile.username}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const score = trustScore?.overallScore ?? 0;
  const trustColor =
    score >= 900 ? 'var(--sv-accent)'  :
    score >= 700 ? 'var(--sv-success)' :
    score >= 400 ? 'var(--sv-warning)' : 'var(--sv-danger)';
  const trustLabel =
    score >= 900 ? 'Elite Developer'         :
    score >= 700 ? 'Trusted Developer'        :
    score >= 400 ? 'Verified Professional'    : 'Unverified — Claims Only';

  const categories = [
    { label: 'Code Quality',      key: 'codeQuality',       max: 300 },
    { label: 'Consistency',       key: 'consistency',        max: 200 },
    { label: 'Documentation',     key: 'documentation',      max: 150 },
    { label: 'Security',          key: 'securityPractices',  max: 150 },
    { label: 'Testing',           key: 'testingPractices',   max: 100 },
    { label: 'Community',         key: 'communityEngagement',max: 100 },
  ];

  const topSkills = [...skills].sort((a, b) => (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0)).slice(0, 8);
  const analyzedRepos = repos.filter(r => r.status === 'analyzed').slice(0, 5);

  return (
    <div className="sv-app">
      <Navbar
        user={profile ? { name: profile.name, username: profile.username, avatarUrl: profile.avatarUrl } : null}
        breadcrumb="Trust Passport"
      />
      <div className="sv-workspace">
        <Sidebar trustScore={trustScore} />
        <main className="sv-content">
          <div className="sv-page">

            {/* Header */}
            <div className="sv-page-header">
              <div>
                <h1 className="sv-page-title">Trust Passport</h1>
                <p className="sv-page-desc">Your verified developer identity and reputation</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={copyPassportLink} className="sv-btn sv-btn-secondary">
                  {copied ? <><Check style={{ width: 13, height: 13 }} />Copied</> : <><Copy style={{ width: 13, height: 13 }} />Copy Link</>}
                </button>
                {profile?.username && (
                  <Link href={`/passport/${profile.username}`} className="sv-btn sv-btn-secondary" target="_blank">
                    <ExternalLink style={{ width: 13, height: 13 }} />
                    Public View
                  </Link>
                )}
                <button
                  onClick={handleRecalculate}
                  disabled={recalculating}
                  className="sv-btn sv-btn-primary"
                >
                  {recalculating
                    ? <><span className="sv-spinner" style={{ width: 12, height: 12 }} />Updating</>
                    : <><RefreshCw style={{ width: 13, height: 13 }} />Recalculate</>}
                </button>
              </div>
            </div>

            <div className="sv-grid-2-1">

              {/* Left column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Trust score breakdown */}
                <div className="sv-card">
                  <div className="sv-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ShieldCheck style={{ width: 14, height: 14, color: 'var(--sv-accent)' }} />
                      <span className="sv-card-title">Trust Score Breakdown</span>
                    </div>
                    <span className="sv-card-subtitle">Transparent scoring system</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="sv-table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Score</th>
                          <th>Max</th>
                          <th>Weight</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          Array(6).fill(0).map((_, i) => (
                            <tr key={i}>
                              {[140, 60, 40, 60, 100].map((w, j) => (
                                <td key={j}><div className="sv-skeleton" style={{ height: 12, width: w }} /></td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          categories.map(cat => {
                            const val = trustScore?.[cat.key] ?? 0;
                            const pct = Math.round((val / cat.max) * 100);
                            const color = pct >= 70 ? 'var(--sv-success)' : pct >= 40 ? 'var(--sv-warning)' : 'var(--sv-danger)';
                            return (
                              <tr key={cat.key}>
                                <td className="sv-td-primary">{cat.label}</td>
                                <td>
                                  <span style={{ color, fontWeight: 600, fontSize: 13 }}>{val}</span>
                                </td>
                                <td style={{ color: 'var(--sv-text-dim)', fontSize: 12 }}>{cat.max}</td>
                                <td style={{ color: 'var(--sv-text-subtle)', fontSize: 12 }}>{pct}%</td>
                                <td>
                                  <div className="sv-bar-track" style={{ width: 80 }}>
                                    <div className="sv-bar-fill" style={{ width: `${pct}%`, background: color }} />
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                        {!loading && (
                          <tr style={{ borderTop: '1px solid var(--sv-border)' }}>
                            <td style={{ fontWeight: 600, fontSize: 13, color: 'var(--sv-text)' }}>Total</td>
                            <td><span style={{ color: trustColor, fontWeight: 700, fontSize: 14 }}>{score}</span></td>
                            <td style={{ color: 'var(--sv-text-dim)', fontSize: 12 }}>1000</td>
                            <td><span style={{ color: trustColor, fontSize: 12, fontWeight: 500 }}>{Math.round(score / 10)}%</span></td>
                            <td>
                              <div className="sv-bar-track" style={{ width: 80 }}>
                                <div className="sv-bar-fill" style={{ width: `${score / 10}%`, background: trustColor }} />
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Verified skills */}
                <div className="sv-card">
                  <div className="sv-card-header">
                    <span className="sv-card-title">Verified Skills</span>
                    <Link href="/skills" className="sv-btn sv-btn-ghost sv-btn-sm">
                      Manage <ChevronRight style={{ width: 12, height: 12 }} />
                    </Link>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="sv-table">
                      <thead>
                        <tr>
                          <th>Skill</th>
                          <th>Level</th>
                          <th>Confidence</th>
                          <th>Verified</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          Array(5).fill(0).map((_, i) => (
                            <tr key={i}>{[100, 80, 100, 50].map((w, j) => (
                              <td key={j}><div className="sv-skeleton" style={{ height: 12, width: w }} /></td>
                            ))}</tr>
                          ))
                        ) : topSkills.length > 0 ? (
                          topSkills.map((skill, i) => {
                            const pct = Math.round(skill.confidenceScore ?? skill.proficiency ?? 0);
                            const level = pct >= 85 ? 'Expert' : pct >= 70 ? 'Advanced' : pct >= 50 ? 'Intermediate' : 'Beginner';
                            const color = pct >= 80 ? 'var(--sv-success)' : pct >= 60 ? 'var(--sv-accent)' : pct >= 40 ? 'var(--sv-warning)' : 'var(--sv-danger)';
                            return (
                              <tr key={i}>
                                <td className="sv-td-primary">{skill.language || skill.skillName || '—'}</td>
                                <td><span style={{ fontSize: 12, color, fontWeight: 500 }}>{level}</span></td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div className="sv-bar-track" style={{ width: 60 }}>
                                      <div className="sv-bar-fill" style={{ width: `${pct}%`, background: color }} />
                                    </div>
                                    <span style={{ fontSize: 11, color: 'var(--sv-text-dim)' }}>{pct}%</span>
                                  </div>
                                </td>
                                <td>
                                  {skill.verified
                                    ? <CheckCircle2 style={{ width: 13, height: 13, color: 'var(--sv-success)' }} />
                                    : <AlertCircle  style={{ width: 13, height: 13, color: 'var(--sv-text-dim)' }} />
                                  }
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr><td colSpan={4}>
                            <div className="sv-empty" style={{ padding: 20 }}>
                              <div className="sv-empty-title">No skills verified yet</div>
                              <div className="sv-empty-desc">Analyze repositories to verify your skills.</div>
                            </div>
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Verified projects */}
                {analyzedRepos.length > 0 && (
                  <div className="sv-card">
                    <div className="sv-card-header">
                      <span className="sv-card-title">Verified Projects</span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="sv-table">
                        <thead>
                          <tr>
                            <th>Repository</th>
                            <th>Language</th>
                            <th>AI Score</th>
                            <th>Trust Impact</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyzedRepos.map((repo, i) => (
                            <tr key={i}>
                              <td className="sv-td-primary">
                                <Link href={`/repositories/${repo.id}`} style={{ color: 'var(--sv-text)', textDecoration: 'none' }}>
                                  {repo.name || repo.repoName}
                                </Link>
                              </td>
                              <td>{repo.languages?.[0] || repo.primaryLanguage
                                ? <span className="sv-chip">{repo.languages?.[0] || repo.primaryLanguage}</span>
                                : <span style={{ color: 'var(--sv-text-dim)' }}>—</span>}
                              </td>
                              <td>
                                <span style={{ color: (repo.aiScore ?? 0) >= 80 ? 'var(--sv-success)' : 'var(--sv-warning)', fontWeight: 600, fontSize: 13 }}>
                                  {repo.aiScore ?? '—'}{repo.aiScore ? '/100' : ''}
                                </span>
                              </td>
                              <td style={{ color: 'var(--sv-success)', fontSize: 12 }}>
                                +{repo.trustImpact ?? Math.floor((repo.aiScore ?? 0) * 0.3)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>

              {/* Right column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Trust score display */}
                <div className="sv-card">
                  <div className="sv-card-body">
                    {/* Score */}
                    <div style={{ textAlign: 'center', padding: '12px 0 20px' }}>
                      <div style={{
                        fontSize: 56, fontWeight: 800, letterSpacing: '-0.05em',
                        lineHeight: 1, color: trustColor, marginBottom: 6
                      }}>
                        {loading ? '—' : score}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: trustColor, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
                        {trustLabel}
                      </div>
                      <div className="sv-bar-track" style={{ height: 8, marginBottom: 12 }}>
                        <div className="sv-bar-fill" style={{ width: `${(score / 1000) * 100}%`, background: trustColor, height: '100%', borderRadius: 4 }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--sv-text-dim)' }}>
                        <span>0</span>
                        <span>500</span>
                        <span>1000</span>
                      </div>
                    </div>
                    <div className="sv-divider" style={{ marginBottom: 14 }} />
                    {/* Tier guide */}
                    {[
                      { range: '900–1000', label: 'Elite',    color: 'var(--sv-accent)' },
                      { range: '700–899',  label: 'Trusted',  color: 'var(--sv-success)' },
                      { range: '400–699',  label: 'Verified', color: 'var(--sv-warning)' },
                      { range: '0–399',    label: 'Unverified', color: 'var(--sv-danger)' },
                    ].map(tier => (
                      <div key={tier.range} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: tier.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: 'var(--sv-text-muted)' }}>{tier.label}</span>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--sv-text-dim)', fontVariantNumeric: 'tabular-nums' }}>{tier.range}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trust history */}
                {history.length > 0 && (
                  <div className="sv-card">
                    <div className="sv-card-header">
                      <span className="sv-card-title">Score History</span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="sv-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Score</th>
                            <th>Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.slice(0, 6).map((h: any, i) => {
                            const change = (h.overallScore ?? 0) - (h.previousScore ?? 0);
                            return (
                              <tr key={i}>
                                <td style={{ color: 'var(--sv-text-dim)', fontSize: 12 }}>
                                  {h.calculatedAt ? new Date(h.calculatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                </td>
                                <td style={{ fontWeight: 600, fontSize: 13 }}>{h.overallScore ?? 0}</td>
                                <td>
                                  <span style={{ color: change >= 0 ? 'var(--sv-success)' : 'var(--sv-danger)', fontSize: 12, fontWeight: 500 }}>
                                    {change >= 0 ? '+' : ''}{change}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Improvement tips */}
                <div className="sv-card">
                  <div className="sv-card-header">
                    <span className="sv-card-title">How to Improve</span>
                  </div>
                  <div style={{ padding: '4px 8px 8px' }}>
                    {[
                      'Add documentation to your repositories',
                      'Write unit tests to improve code quality',
                      'Fix security vulnerabilities',
                      'Maintain consistent commit history',
                      'Complete SkillVerse challenges',
                    ].map((tip, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, padding: '7px 4px', borderBottom: i < 4 ? '1px solid var(--sv-border-2)' : 'none' }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--sv-accent)', flexShrink: 0, marginTop: 5 }} />
                        <span style={{ fontSize: 12, color: 'var(--sv-text-muted)', lineHeight: 1.5 }}>{tip}</span>
                      </div>
                    ))}
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
