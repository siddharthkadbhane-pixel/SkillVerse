'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import Link from 'next/link';
import {
  MessageSquare, GitFork, ExternalLink, Send, Plus,
  AlertCircle, CheckCircle2, Users, Code2, ArrowUpRight,
} from 'lucide-react';

const CATEGORIES = ['Project Showcase', 'Bug Help', 'General Coding', 'Open Source'];

export default function CommunityPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  // Post form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Project Showcase');
  const [githubLink, setGithubLink] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profRes, feedRes, projRes] = await Promise.allSettled([
        fetch('/api/profile').then(r => r.json()),
        fetch('/api/feed').then(r => r.json()),
        fetch('/api/projects').then(r => r.json()),
      ]);
      if (profRes.status === 'fulfilled' && profRes.value.success) setProfile(profRes.value.data);
      if (feedRes.status === 'fulfilled' && feedRes.value.success) setFeed(feedRes.value.data ?? []);
      if (projRes.status === 'fulfilled' && projRes.value.success) setProjects(projRes.value.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);
    setPostResult(null);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, category, githubLink: githubLink || null, codeSnippet: codeSnippet || null }),
      });
      const json = await res.json();
      if (json.success) {
        setPostResult({ ok: true, msg: 'Post published successfully.' });
        setTitle(''); setContent(''); setGithubLink(''); setCodeSnippet('');
        loadData();
      } else {
        setPostResult({ ok: false, msg: json.error || 'Failed to post.' });
      }
    } catch {
      setPostResult({ ok: false, msg: 'Network error.' });
    } finally {
      setPosting(false);
    }
  };

  const catBadge = (cat: string) => {
    if (cat === 'Project Showcase') return <span className="sv-badge sv-badge-blue">{cat}</span>;
    if (cat === 'Bug Help')         return <span className="sv-badge sv-badge-red">{cat}</span>;
    if (cat === 'Open Source')      return <span className="sv-badge sv-badge-green">{cat}</span>;
    return <span className="sv-badge sv-badge-zinc">{cat}</span>;
  };

  return (
    <div className="sv-app">
      <Navbar
        user={profile?.profile ? { name: profile.profile.name, username: profile.profile.username, avatarUrl: profile.profile.avatarUrl } : null}
        breadcrumb="Community"
      />
      <div className="sv-workspace">
        <Sidebar trustScore={profile?.trustScore} />
        <main className="sv-content">
          <div className="sv-page">
            <div className="sv-page-header">
              <div>
                <h1 className="sv-page-title">Community</h1>
                <p className="sv-page-desc">Share projects, get help, collaborate with verified developers</p>
              </div>
            </div>

            <div className="sv-grid-2-1">

              {/* Left: feed */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Post composer */}
                <div className="sv-card">
                  <div className="sv-card-header">
                    <span className="sv-card-title">New Post</span>
                  </div>
                  <form onSubmit={handlePost}>
                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div className="sv-input-group">
                          <label className="sv-label">Title</label>
                          <input
                            required
                            className="sv-input"
                            placeholder="What are you sharing?"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                          />
                        </div>
                        <div className="sv-input-group">
                          <label className="sv-label">Category</label>
                          <select
                            className="sv-input sv-select"
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                          >
                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="sv-input-group">
                        <label className="sv-label">Content</label>
                        <textarea
                          required
                          rows={3}
                          className="sv-input"
                          style={{ resize: 'vertical', minHeight: 72 }}
                          placeholder="Describe your project, question, or update..."
                          value={content}
                          onChange={e => setContent(e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div className="sv-input-group">
                          <label className="sv-label">GitHub Link (optional)</label>
                          <input
                            type="url"
                            className="sv-input"
                            placeholder="https://github.com/..."
                            value={githubLink}
                            onChange={e => setGithubLink(e.target.value)}
                          />
                        </div>
                        <div className="sv-input-group">
                          <label className="sv-label">Code Snippet (optional)</label>
                          <input
                            className="sv-input sv-mono"
                            placeholder="const x = () => {}"
                            value={codeSnippet}
                            onChange={e => setCodeSnippet(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {postResult && (
                      <div style={{ margin: '0 16px 10px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: postResult.ok ? 'var(--sv-success)' : 'var(--sv-danger)' }}>
                        {postResult.ok ? <CheckCircle2 style={{ width: 13, height: 13 }} /> : <AlertCircle style={{ width: 13, height: 13 }} />}
                        {postResult.msg}
                      </div>
                    )}

                    <div style={{ padding: '10px 16px', borderTop: '1px solid var(--sv-border)', display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="submit" disabled={posting} className="sv-btn sv-btn-primary">
                        {posting ? <><span className="sv-spinner" style={{ width: 12, height: 12 }} />Publishing</> : <><Send style={{ width: 13, height: 13 }} />Publish</>}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Feed */}
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="sv-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div className="sv-skeleton" style={{ height: 14, width: 200 }} />
                        <div className="sv-skeleton" style={{ height: 12, width: '80%' }} />
                        <div className="sv-skeleton" style={{ height: 12, width: '60%' }} />
                      </div>
                    ))}
                  </div>
                ) : feed.length === 0 ? (
                  <div className="sv-card">
                    <div className="sv-empty">
                      <MessageSquare style={{ width: 24, height: 24, color: 'var(--sv-text-dim)' }} />
                      <div className="sv-empty-title">No posts yet</div>
                      <div className="sv-empty-desc">Be the first to share something with the community.</div>
                    </div>
                  </div>
                ) : (
                  feed.map((post: any) => (
                    <div key={post.id} className="sv-card">
                      {/* Post header */}
                      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--sv-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--sv-accent-dim)', border: '1px solid var(--sv-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--sv-accent)', flexShrink: 0 }}>
                          {(post.authorName || 'U')[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--sv-text)' }}>{post.authorName}</span>
                            {catBadge(post.category)}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--sv-text-dim)' }}>
                            @{post.authorUsername} · {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>

                      {/* Post body */}
                      <div style={{ padding: '12px 14px' }}>
                        <h4 style={{ fontSize: 13, fontWeight: 500, color: 'var(--sv-text)', marginBottom: 6 }}>{post.title}</h4>
                        <p style={{ fontSize: 12.5, color: 'var(--sv-text-muted)', lineHeight: 1.6 }}>{post.content}</p>

                        {post.codeSnippet && (
                          <div className="sv-code" style={{ marginTop: 10 }}>
                            {post.codeSnippet}
                          </div>
                        )}
                      </div>

                      {/* Post footer */}
                      <div style={{ padding: '8px 14px', borderTop: '1px solid var(--sv-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {post.githubLink ? (
                          <a
                            href={post.githubLink}
                            target="_blank"
                            rel="noopener"
                            className="sv-btn sv-btn-ghost sv-btn-sm"
                          >
                            <GitFork style={{ width: 11, height: 11 }} />
                            Repository
                            <ExternalLink style={{ width: 10, height: 10 }} />
                          </a>
                        ) : <span />}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--sv-text-subtle)' }}>
                          <MessageSquare style={{ width: 12, height: 12 }} />
                          {post.commentsCount ?? 0} comments
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Right: open source teams */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="sv-card">
                  <div className="sv-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users style={{ width: 14, height: 14, color: 'var(--sv-accent)' }} />
                      <span className="sv-card-title">Open Source Teams</span>
                    </div>
                  </div>
                  <div>
                    {loading ? (
                      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {Array(3).fill(0).map((_, i) => <div key={i} className="sv-skeleton" style={{ height: 52 }} />)}
                      </div>
                    ) : projects.length === 0 ? (
                      <div className="sv-empty" style={{ padding: 24 }}>
                        <div className="sv-empty-title">No open teams</div>
                        <div className="sv-empty-desc">Start a collaborative project to find contributors.</div>
                      </div>
                    ) : (
                      projects.map((proj: any, i) => (
                        <div key={i} style={{ padding: '11px 14px', borderBottom: i < projects.length - 1 ? '1px solid var(--sv-border)' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--sv-text)', marginBottom: 2 }}>{proj.name}</div>
                              <div style={{ fontSize: 11.5, color: 'var(--sv-text-subtle)', lineHeight: 1.5 }}>{proj.description}</div>
                            </div>
                            {proj.repoUrl && (
                              <a
                                href={proj.repoUrl}
                                target="_blank"
                                rel="noopener"
                                className="sv-btn sv-btn-ghost sv-btn-sm"
                                style={{ flexShrink: 0 }}
                              >
                                <ExternalLink style={{ width: 11, height: 11 }} />
                              </a>
                            )}
                          </div>
                          <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                            <span className="sv-badge sv-badge-blue">Seeking Contributors</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick tips */}
                <div className="sv-card">
                  <div className="sv-card-header">
                    <span className="sv-card-title">Community Guidelines</span>
                  </div>
                  <div style={{ padding: '4px 8px 8px' }}>
                    {[
                      'Share real projects, not concepts',
                      'Provide reproducible code examples',
                      'Be specific when asking for help',
                      'Credit collaborators in your posts',
                    ].map((tip, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, padding: '7px 6px', borderBottom: i < 3 ? '1px solid var(--sv-border-2)' : 'none' }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--sv-accent)', flexShrink: 0, marginTop: 6 }} />
                        <span style={{ fontSize: 12, color: 'var(--sv-text-subtle)', lineHeight: 1.5 }}>{tip}</span>
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
