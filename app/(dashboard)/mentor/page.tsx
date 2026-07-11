'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import {
  Sparkles, Send, RefreshCw, ChevronRight, BookOpen,
  User, Bot, AlertCircle, CheckCircle2, Clock, Target,
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function MentorPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [recs, setRecs] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI Mentor. I can help you understand your Skill DNA, suggest learning paths, explain your Trust Score, and guide your career growth. What would you like to explore?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [profRes, recRes] = await Promise.allSettled([
          fetch('/api/profile').then(r => r.json()),
          fetch('/api/dashboard/recommendations').then(r => r.json()),
        ]);
        if (profRes.status === 'fulfilled' && profRes.value.success) setProfile(profRes.value.data);
        if (recRes.status === 'fulfilled' && recRes.value.success) setRecs(recRes.value.data ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg: Message = { role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim() }),
      });
      const json = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: json.reply || json.message || "I'm analyzing your profile. Please ensure your repositories are connected and analyzed for the most accurate guidance.",
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I encountered an issue connecting to the AI service. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setSending(false);
    }
  };

  const QUICK_PROMPTS = [
    'What are my weakest skills?',
    'How do I improve my Trust Score?',
    'What should I learn next?',
    'Explain my Skill DNA',
    'Suggest career paths for me',
  ];

  return (
    <div className="sv-app">
      <Navbar
        user={profile?.profile ? { name: profile.profile.name, username: profile.profile.username, avatarUrl: profile.profile.avatarUrl } : null}
        breadcrumb="AI Mentor"
      />
      <div className="sv-workspace">
        <Sidebar trustScore={profile?.trustScore} />
        <main className="sv-content">
          <div className="sv-page">
            <div className="sv-page-header">
              <div>
                <h1 className="sv-page-title">AI Mentor</h1>
                <p className="sv-page-desc">Personalized career guidance powered by your Skill DNA and Trust Score</p>
              </div>
            </div>

            <div className="sv-grid-2-1">

              {/* Left: Chat interface */}
              <div className="sv-card" style={{ display: 'flex', flexDirection: 'column', minHeight: 560 }}>
                <div className="sv-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles style={{ width: 14, height: 14, color: 'var(--sv-accent)' }} />
                    <span className="sv-card-title">Chat with AI Mentor</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sv-success)' }} />
                    <span style={{ fontSize: 11, color: 'var(--sv-text-subtle)' }}>Online</span>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        gap: 8,
                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                        background: msg.role === 'assistant' ? 'var(--sv-accent-dim)' : 'var(--sv-surface-2)',
                        border: `1px solid ${msg.role === 'assistant' ? 'var(--sv-accent-dim2)' : 'var(--sv-border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {msg.role === 'assistant'
                          ? <Sparkles style={{ width: 12, height: 12, color: 'var(--sv-accent)' }} />
                          : <User style={{ width: 12, height: 12, color: 'var(--sv-text-subtle)' }} />}
                      </div>
                      <div style={{
                        maxWidth: '75%',
                        background: msg.role === 'assistant' ? 'var(--sv-surface-2)' : 'var(--sv-accent-dim)',
                        border: `1px solid ${msg.role === 'assistant' ? 'var(--sv-border)' : 'var(--sv-accent-dim2)'}`,
                        borderRadius: 'var(--sv-r-md)',
                        padding: '8px 12px',
                      }}>
                        <p style={{ fontSize: 12.5, color: 'var(--sv-text-muted)', lineHeight: 1.6, margin: 0 }}>
                          {msg.content}
                        </p>
                        <div style={{ fontSize: 10.5, color: 'var(--sv-text-dim)', marginTop: 4 }}>
                          {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {sending && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--sv-accent-dim)', border: '1px solid var(--sv-accent-dim2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles style={{ width: 12, height: 12, color: 'var(--sv-accent)' }} />
                      </div>
                      <div style={{ background: 'var(--sv-surface-2)', border: '1px solid var(--sv-border)', borderRadius: 'var(--sv-r-md)', padding: '10px 14px', display: 'flex', gap: 4 }}>
                        {[0, 1, 2].map(d => (
                          <div key={d} style={{
                            width: 5, height: 5, borderRadius: '50%', background: 'var(--sv-text-dim)',
                            animation: `sv-pulse ${600 + d * 150}ms ease infinite`,
                          }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick prompts */}
                <div style={{ padding: '8px 14px', borderTop: '1px solid var(--sv-border)', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {QUICK_PROMPTS.map(p => (
                    <button
                      key={p}
                      onClick={() => setInput(p)}
                      className="sv-chip"
                      style={{ cursor: 'pointer', transition: 'background 120ms', color: 'var(--sv-text-muted)' }}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <form onSubmit={handleSend} style={{ padding: '10px 14px', borderTop: '1px solid var(--sv-border)', display: 'flex', gap: 8 }}>
                  <input
                    className="sv-input"
                    placeholder="Ask about your skills, career, or learning path..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="sv-btn sv-btn-primary"
                    style={{ flexShrink: 0 }}
                  >
                    <Send style={{ width: 13, height: 13 }} />
                  </button>
                </form>
              </div>

              {/* Right: Recommendations + Context */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* Learning recommendations */}
                <div className="sv-card">
                  <div className="sv-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <BookOpen style={{ width: 14, height: 14, color: 'var(--sv-accent)' }} />
                      <span className="sv-card-title">Learning Recommendations</span>
                    </div>
                  </div>
                  <div>
                    {loading ? (
                      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {Array(4).fill(0).map((_, i) => <div key={i} className="sv-skeleton" style={{ height: 48 }} />)}
                      </div>
                    ) : recs.length > 0 ? (
                      recs.slice(0, 5).map((rec: any, i) => (
                        <div key={i} style={{ padding: '10px 14px', borderBottom: i < Math.min(recs.length, 5) - 1 ? '1px solid var(--sv-border)' : 'none' }}>
                          <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--sv-text)', marginBottom: 2 }}>
                            {rec.title || rec.topic || rec.skillName}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--sv-text-subtle)', lineHeight: 1.5 }}>
                            {rec.reason || rec.description || 'Improve this skill to boost your Trust Score'}
                          </div>
                          {rec.priority === 'high' && (
                            <span className="sv-badge sv-badge-red" style={{ marginTop: 5 }}>High Priority</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="sv-empty" style={{ padding: 24 }}>
                        <div className="sv-empty-title">No recommendations yet</div>
                        <div className="sv-empty-desc">Analyze repositories to get personalized learning suggestions.</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Career context */}
                <div className="sv-card">
                  <div className="sv-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Target style={{ width: 14, height: 14, color: 'var(--sv-accent)' }} />
                      <span className="sv-card-title">Career Context</span>
                    </div>
                  </div>
                  <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {[
                      { label: 'Trust Score',  value: profile?.trustScore?.overallScore ?? '—', color: 'var(--sv-success)' },
                      { label: 'Skill Level',  value: (profile?.trustScore?.overallScore ?? 0) >= 700 ? 'Senior' : (profile?.trustScore?.overallScore ?? 0) >= 400 ? 'Mid' : 'Junior' },
                      { label: 'Top Skill',    value: profile?.topSkill || '—' },
                      { label: 'Profile',      value: profile?.profile?.username ? `@${profile.profile.username}` : '—' },
                    ].map((row, i) => (
                      <div key={i} className="sv-form-row" style={{ padding: '9px 0' }}>
                        <span style={{ fontSize: 12, color: 'var(--sv-text-subtle)' }}>{row.label}</span>
                        <span style={{ fontSize: 12.5, fontWeight: 500, color: (row as any).color || 'var(--sv-text)' }}>{row.value}</span>
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
