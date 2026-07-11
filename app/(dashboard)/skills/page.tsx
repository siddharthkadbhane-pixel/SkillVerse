'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import Link from 'next/link';
import {
  Dna, RefreshCw, ChevronRight, CheckCircle2,
  AlertCircle, BarChart2, BookOpen, Zap,
} from 'lucide-react';

const CATEGORIES = ['All', 'Languages', 'Frameworks', 'Tools', 'Concepts'];

export default function SkillsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [recalculating, setRecalculating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [profRes, skillRes] = await Promise.allSettled([
        fetch('/api/profile').then(r => r.json()),
        fetch('/api/skills').then(r => r.json()),
      ]);
      if (profRes.status === 'fulfilled' && profRes.value.success) setProfile(profRes.value.data);
      if (skillRes.status === 'fulfilled' && skillRes.value.success) {
        setSkills(skillRes.value.data?.skills ?? []);
        setHistory(skillRes.value.data?.history ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await fetch('/api/skills/recalculate', { method: 'POST' });
      await load();
    } finally {
      setRecalculating(false);
    }
  };

  const filteredSkills = activeCategory === 'All'
    ? skills
    : skills.filter(s => (s.category || 'Languages').toLowerCase() === activeCategory.toLowerCase());

  const topSkills = [...skills].sort((a, b) => (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0)).slice(0, 5);

  const levelColor = (pct: number) =>
    pct >= 80 ? 'var(--sv-success)' : pct >= 60 ? 'var(--sv-accent)' : pct >= 40 ? 'var(--sv-warning)' : 'var(--sv-danger)';

  const levelLabel = (pct: number) =>
    pct >= 85 ? 'Expert' : pct >= 70 ? 'Advanced' : pct >= 50 ? 'Intermediate' : pct >= 30 ? 'Beginner' : 'Novice';

  return (
    <div className="sv-app">
      <Navbar
        user={profile?.profile ? { name: profile.profile.name, username: profile.profile.username, avatarUrl: profile.profile.avatarUrl } : null}
        breadcrumb="Skill DNA"
      />
      <div className="sv-workspace">
        <Sidebar trustScore={profile?.trustScore} />
        <main className="sv-content">
          <div className="sv-page">

            {/* Header */}
            <div className="sv-page-header">
              <div>
                <h1 className="sv-page-title">Skill DNA</h1>
                <p className="sv-page-desc">{skills.length} verified skills across {new Set(skills.map(s => s.category)).size} categories</p>
              </div>
              <button
                onClick={handleRecalculate}
                disabled={recalculating}
                className="sv-btn sv-btn-secondary"
              >
                {recalculating ? <><span className="sv-spinner" style={{ width: 12, height: 12 }} />Recalculating</> : <><RefreshCw style={{ width: 13, height: 13 }} />Recalculate</>}
              </button>
            </div>

            <div className="sv-grid-2-1">

              {/* Left: skill table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Category tabs */}
                <div className="sv-card">
                  <div className="sv-tabs">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        className={`sv-tab ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                      >
                        {cat}
                        <span className="nav-count" style={{ marginLeft: 4, background: 'transparent', border: 'none', fontSize: 10, color: 'var(--sv-text-dim)', padding: 0 }}>
                          {cat === 'All' ? skills.length : skills.filter(s => (s.category || 'Languages').toLowerCase() === cat.toLowerCase()).length}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="sv-table">
                      <thead>
                        <tr>
                          <th>Skill</th>
                          <th>Category</th>
                          <th>Confidence</th>
                          <th>Level</th>
                          <th>Evidence</th>
                          <th>Verified</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          Array(6).fill(0).map((_, i) => (
                            <tr key={i}>
                              {[100, 80, 120, 70, 50, 50].map((w, j) => (
                                <td key={j}><div className="sv-skeleton" style={{ height: 12, width: w }} /></td>
                              ))}
                            </tr>
                          ))
                        ) : filteredSkills.length === 0 ? (
                          <tr>
                            <td colSpan={6}>
                              <div className="sv-empty">
                                <Dna style={{ width: 24, height: 24, color: 'var(--sv-text-dim)' }} />
                                <div className="sv-empty-title">No skills in this category</div>
                                <div className="sv-empty-desc">Analyze a repository to extract your Skill DNA.</div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredSkills.map((skill, i) => {
                            const pct = Math.round(skill.confidenceScore ?? skill.proficiency ?? 0);
                            return (
                              <tr key={i}>
                                <td className="sv-td-primary">
                                  {skill.language || skill.skillName || skill.name || '—'}
                                </td>
                                <td>
                                  <span className="sv-chip">
                                    {skill.category || skill.skillType || 'Language'}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div className="sv-bar-track" style={{ width: 60 }}>
                                      <div className="sv-bar-fill" style={{ width: `${pct}%`, background: levelColor(pct) }} />
                                    </div>
                                    <span style={{ fontSize: 12, color: 'var(--sv-text-subtle)', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
                                  </div>
                                </td>
                                <td>
                                  <span style={{ fontSize: 12, color: levelColor(pct), fontWeight: 500 }}>
                                    {levelLabel(pct)}
                                  </span>
                                </td>
                                <td style={{ color: 'var(--sv-text-dim)', fontSize: 12 }}>
                                  {skill.evidenceCount ?? skill.repositoryCount ?? '—'} repos
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
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Growth history */}
                {history.length > 0 && (
                  <div className="sv-card">
                    <div className="sv-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <BarChart2 style={{ width: 14, height: 14, color: 'var(--sv-accent)' }} />
                        <span className="sv-card-title">Growth History</span>
                      </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="sv-table">
                        <thead>
                          <tr>
                            <th>Skill</th>
                            <th>Previous</th>
                            <th>Current</th>
                            <th>Change</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.slice(0, 8).map((h: any, i) => {
                            const change = (h.newScore ?? 0) - (h.previousScore ?? 0);
                            return (
                              <tr key={i}>
                                <td className="sv-td-primary">{h.skillName || h.language}</td>
                                <td style={{ color: 'var(--sv-text-subtle)', fontSize: 12 }}>{h.previousScore ?? 0}%</td>
                                <td style={{ fontSize: 12 }}>{h.newScore ?? 0}%</td>
                                <td>
                                  <span style={{ color: change >= 0 ? 'var(--sv-success)' : 'var(--sv-danger)', fontSize: 12, fontWeight: 500 }}>
                                    {change >= 0 ? '+' : ''}{change}%
                                  </span>
                                </td>
                                <td style={{ color: 'var(--sv-text-dim)', fontSize: 12 }}>
                                  {h.calculatedAt ? new Date(h.calculatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
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

              {/* Right: summary panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Top 5 skills */}
                <div className="sv-card">
                  <div className="sv-card-header">
                    <span className="sv-card-title">Top Skills</span>
                  </div>
                  <div className="sv-card-body">
                    {loading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {Array(5).fill(0).map((_, i) => <div key={i} className="sv-skeleton" style={{ height: 28 }} />)}
                      </div>
                    ) : topSkills.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {topSkills.map((skill, i) => {
                          const name = skill.language || skill.skillName || skill.name || '—';
                          const pct = Math.round(skill.confidenceScore ?? skill.proficiency ?? 0);
                          return (
                            <div key={i}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--sv-text)' }}>{name}</span>
                                <span style={{ fontSize: 12, color: levelColor(pct), fontWeight: 500 }}>{pct}%</span>
                              </div>
                              <div className="sv-bar-track" style={{ height: 5 }}>
                                <div className="sv-bar-fill" style={{ width: `${pct}%`, background: levelColor(pct) }} />
                              </div>
                              {i < topSkills.length - 1 && <div style={{ height: 8 }} />}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="sv-empty" style={{ padding: 20 }}>
                        <div className="sv-empty-title">No skills yet</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skill summary stats */}
                <div className="sv-card">
                  <div className="sv-card-header">
                    <span className="sv-card-title">Skill Summary</span>
                  </div>
                  <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {[
                      { label: 'Total Skills',  value: skills.length },
                      { label: 'Verified',      value: skills.filter(s => s.verified).length },
                      { label: 'Expert Level',  value: skills.filter(s => (s.confidenceScore ?? 0) >= 85).length },
                      { label: 'Advanced',      value: skills.filter(s => (s.confidenceScore ?? 0) >= 70 && (s.confidenceScore ?? 0) < 85).length },
                      { label: 'Intermediate',  value: skills.filter(s => (s.confidenceScore ?? 0) >= 50 && (s.confidenceScore ?? 0) < 70).length },
                    ].map(row => (
                      <div key={row.label} className="sv-form-row" style={{ padding: '10px 0' }}>
                        <span className="sv-form-row-label" style={{ fontSize: 12.5 }}>{row.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sv-text)' }}>{loading ? '—' : row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Learning recommendations */}
                <div className="sv-card">
                  <div className="sv-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <BookOpen style={{ width: 14, height: 14, color: 'var(--sv-accent)' }} />
                      <span className="sv-card-title">Skill Gaps</span>
                    </div>
                  </div>
                  <div style={{ padding: '4px 8px 8px' }}>
                    {['TypeScript', 'System Design', 'Testing', 'DevOps', 'Security'].map(gap => (
                      <div key={gap} className="sv-nav-item" style={{ gap: 8 }}>
                        <Zap style={{ width: 12, height: 12, color: 'var(--sv-warning)', flexShrink: 0 }} />
                        <span style={{ fontSize: 12.5, color: 'var(--sv-text-muted)' }}>{gap}</span>
                        <Link href="/mentor" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--sv-accent)', textDecoration: 'none' }}>
                          Learn <ChevronRight style={{ width: 10, height: 10, display: 'inline' }} />
                        </Link>
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
