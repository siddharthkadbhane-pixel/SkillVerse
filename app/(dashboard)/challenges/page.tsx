'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import Link from 'next/link';
import { Trophy, Search, Clock, Users, Zap, ChevronRight, RefreshCw, Filter } from 'lucide-react';

const FILTERS = ['All', 'Active', 'Completed', 'Upcoming'];

export default function ChallengesPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const load = async () => {
      try {
        const [profRes, chalRes] = await Promise.allSettled([
          fetch('/api/profile').then(r => r.json()),
          fetch('/api/challenges').then(r => r.json()),
        ]);
        if (profRes.status === 'fulfilled' && profRes.value.success) setProfile(profRes.value.data);
        if (chalRes.status === 'fulfilled' && chalRes.value.success) setChallenges(chalRes.value.data ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = challenges.filter(c => {
    const name = (c.title || c.name || '').toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchFilter = filter === 'All' || c.status?.toLowerCase() === filter.toLowerCase();
    return matchSearch && matchFilter;
  });

  const diffBadge = (diff: string) => {
    if (diff === 'Hard') return <span className="sv-badge sv-badge-red">Hard</span>;
    if (diff === 'Medium') return <span className="sv-badge sv-badge-amber">Medium</span>;
    return <span className="sv-badge sv-badge-green">Easy</span>;
  };

  const statusBadge = (status: string) => {
    if (status === 'active')    return <span className="sv-badge sv-badge-blue">Active</span>;
    if (status === 'completed') return <span className="sv-badge sv-badge-green">Completed</span>;
    if (status === 'upcoming')  return <span className="sv-badge sv-badge-zinc">Upcoming</span>;
    return <span className="sv-badge sv-badge-zinc">{status}</span>;
  };

  return (
    <div className="sv-app">
      <Navbar
        user={profile?.profile ? { name: profile.profile.name, username: profile.profile.username, avatarUrl: profile.profile.avatarUrl } : null}
        breadcrumb="Challenges"
      />
      <div className="sv-workspace">
        <Sidebar trustScore={profile?.trustScore} />
        <main className="sv-content">
          <div className="sv-page">
            <div className="sv-page-header">
              <div>
                <h1 className="sv-page-title">Challenges</h1>
                <p className="sv-page-desc">Prove your skills through verified coding challenges</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="sv-stats-row" style={{ marginBottom: 16 }}>
              <div className="sv-stat-cell">
                <div className="sv-stat-label">Active</div>
                <div className="sv-stat-value">{challenges.filter(c => c.status === 'active').length}</div>
              </div>
              <div className="sv-stat-cell">
                <div className="sv-stat-label">Completed</div>
                <div className="sv-stat-value">{challenges.filter(c => c.status === 'completed').length}</div>
              </div>
              <div className="sv-stat-cell">
                <div className="sv-stat-label">Total Challenges</div>
                <div className="sv-stat-value">{challenges.length}</div>
              </div>
              <div className="sv-stat-cell">
                <div className="sv-stat-label">Trust Earned</div>
                <div className="sv-stat-value" style={{ color: 'var(--sv-success)' }}>
                  +{challenges.filter(c => c.status === 'completed').reduce((s, c) => s + (c.trustReward ?? 0), 0)}
                </div>
              </div>
            </div>

            {/* Filter + Search */}
            <div className="sv-card" style={{ marginBottom: 16 }}>
              <div style={{ padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'center', borderBottom: '1px solid var(--sv-border)' }}>
                <div className="sv-search" style={{ maxWidth: 280 }}>
                  <Search style={{ width: 13, height: 13, color: 'var(--sv-text-dim)', flexShrink: 0 }} />
                  <input
                    placeholder="Search challenges..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {FILTERS.map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`sv-btn sv-btn-sm ${filter === f ? 'sv-btn-primary' : 'sv-btn-ghost'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--sv-text-subtle)' }}>{filtered.length} results</span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="sv-table">
                  <thead>
                    <tr>
                      <th>Challenge</th>
                      <th>Type</th>
                      <th>Difficulty</th>
                      <th>Trust Reward</th>
                      <th>Participants</th>
                      <th>Deadline</th>
                      <th>Status</th>
                      <th style={{ width: 80 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array(5).fill(0).map((_, i) => (
                        <tr key={i}>{[180, 80, 80, 70, 70, 90, 80, 70].map((w, j) => (
                          <td key={j}><div className="sv-skeleton" style={{ height: 12, width: w }} /></td>
                        ))}</tr>
                      ))
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={8}>
                        <div className="sv-empty">
                          <Trophy style={{ width: 24, height: 24, color: 'var(--sv-text-dim)' }} />
                          <div className="sv-empty-title">{search ? 'No challenges match your search' : 'No challenges available'}</div>
                          <div className="sv-empty-desc">Check back soon for new challenges to prove your skills.</div>
                        </div>
                      </td></tr>
                    ) : (
                      filtered.map((c, i) => (
                        <tr key={i}>
                          <td className="sv-td-primary">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <span>{c.title || c.name}</span>
                              {c.description && (
                                <span style={{ fontSize: 11, color: 'var(--sv-text-dim)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {c.description}
                                </span>
                              )}
                            </div>
                          </td>
                          <td><span className="sv-chip">{c.type || c.challengeType || 'Coding'}</span></td>
                          <td>{diffBadge(c.difficulty || 'Medium')}</td>
                          <td>
                            <span style={{ color: 'var(--sv-success)', fontWeight: 600, fontSize: 13 }}>
                              +{c.trustReward ?? c.rewardPoints ?? 0}
                            </span>
                          </td>
                          <td style={{ color: 'var(--sv-text-subtle)', fontSize: 12 }}>
                            <Users style={{ width: 11, height: 11, display: 'inline', marginRight: 3 }} />
                            {c.participantCount ?? 0}
                          </td>
                          <td style={{ color: 'var(--sv-text-dim)', fontSize: 12 }}>
                            {c.endDate ? new Date(c.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                          </td>
                          <td>{statusBadge(c.status || 'active')}</td>
                          <td>
                            <Link
                              href={`/challenges/${c.id}`}
                              className={`sv-btn sv-btn-sm ${c.status === 'completed' ? 'sv-btn-ghost' : 'sv-btn-primary'}`}
                            >
                              {c.status === 'completed' ? 'View' : <><Zap style={{ width: 11, height: 11 }} />Start</>}
                            </Link>
                          </td>
                        </tr>
                      ))
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
