'use client';

import React, { useState } from 'react';
import Navbar from '@/components/shared/Navbar';
import { 
  Award, ShieldCheck, MapPin, BookOpen, Code, ShieldAlert, 
  GitFork, Briefcase, ToggleLeft, ToggleRight, Bookmark,
  Share2, Check, ExternalLink, Activity, Sparkles, User
} from 'lucide-react';

interface ProfileClientProps {
  initialData: any;
}

export default function ProfileClientView({ initialData }: ProfileClientProps) {
  const [recruiterMode, setRecruiterMode] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied] = useState(false);

  const { profile, trustScore, skillDna, repositories, badges, timeline, passport } = initialData;

  const handleBookmark = async () => {
    setBookmarked(!bookmarked);
    try {
      await fetch('/api/profile/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: profile.username }),
      });
    } catch (err) {
      console.error('Failed to log bookmark event:', err);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    try {
      fetch('/api/profile/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'copy' }),
      });
    } catch (err) {
      console.error('Failed to log share event:', err);
    }
  };

  const score = trustScore?.overallScore ?? 0;
  const trustColor =
    score >= 900 ? 'var(--sv-accent)'  :
    score >= 700 ? 'var(--sv-success)' :
    score >= 400 ? 'var(--sv-warning)' : 'var(--sv-danger)';
  const trustLabel =
    score >= 900 ? 'Elite Developer' :
    score >= 700 ? 'Trusted Developer' :
    score >= 400 ? 'Verified Professional' : 'Unverified';

  return (
    <div className="sv-app">
      <Navbar user={profile} />
      
      {/* Cover / Upper strip (clean dark gray cover line) */}
      <div style={{ height: 90, background: 'var(--sv-surface)', borderBottom: '1px solid var(--sv-border)', position: 'relative' }}>
        <div style={{ position: 'absolute', bottom: 12, right: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--sv-bg)', border: '1px solid var(--sv-border)', padding: '4px 10px', borderRadius: 'var(--sv-r)' }}>
            <span style={{ fontSize: 11, fontWeight: 650, color: 'var(--sv-text-subtle)', textTransform: 'uppercase' }}>Recruiter Mode</span>
            <button 
              onClick={() => setRecruiterMode(!recruiterMode)}
              style={{ background: 'none', border: 'none', display: 'flex', padding: 0, color: recruiterMode ? 'var(--sv-accent)' : 'var(--sv-text-dim)' }}
            >
              {recruiterMode ? (
                <ToggleRight style={{ width: 22, height: 22 }} />
              ) : (
                <ToggleLeft style={{ width: 22, height: 22 }} />
              )}
            </button>
          </div>
        </div>
      </div>

      <main className="sv-page" style={{ marginTop: -40, zIndex: 10, position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* Profile Card Header */}
        <div className="sv-card">
          <div className="sv-card-body" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              {profile.avatarUrl ? (
                <img 
                  src={profile.avatarUrl} 
                  alt={profile.name} 
                  style={{ width: 68, height: 68, borderRadius: '50%', border: '2px solid var(--sv-border)', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'var(--sv-surface-2)', border: '2px solid var(--sv-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User style={{ width: 28, height: 28, color: 'var(--sv-text-subtle)' }} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--sv-text)', margin: 0, letterSpacing: '-0.02em' }}>{profile.name}</h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--sv-text-subtle)' }}>
                  <span style={{ fontWeight: 500 }}>@{profile.username}</span>
                  {profile.location && (
                    <>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><MapPin style={{ width: 12, height: 12 }} /> {profile.location}</span>
                    </>
                  )}
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--sv-text-muted)', marginTop: 4, maxWidth: 540, lineHeight: 1.5 }}>
                  {profile.bio || 'Developer profile verified via SkillVerse code telemetry.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: trustColor, letterSpacing: '-0.03em' }}>{score}</span>
                <span style={{ fontSize: 11, color: 'var(--sv-text-dim)' }}>/1000 pts</span>
              </div>
              <span className={`sv-badge ${score >= 700 ? 'sv-badge-blue' : 'sv-badge-zinc'}`}>
                {trustLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Recruiter view simple layout */}
        {recruiterMode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Executive summary block */}
            <div className="sv-card">
              <div className="sv-card-header">
                <span className="sv-card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Briefcase style={{ width: 14, height: 14, color: 'var(--sv-accent)' }} />
                  Recruiter Candidate Snapshot
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button 
                    onClick={handleBookmark}
                    className={`sv-btn sv-btn-sm ${bookmarked ? 'sv-btn-primary' : 'sv-btn-secondary'}`}
                  >
                    <Bookmark style={{ width: 12, height: 12 }} />
                    {bookmarked ? 'Bookmarked' : 'Bookmark'}
                  </button>
                  <button 
                    onClick={handleShare}
                    className="sv-btn sv-btn-secondary sv-btn-sm"
                  >
                    {copied ? <Check style={{ width: 12, height: 12, color: 'var(--sv-success)' }} /> : <Share2 style={{ width: 12, height: 12 }} />}
                    {copied ? 'Copied' : 'Share Link'}
                  </button>
                </div>
              </div>

              <div className="sv-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {skillDna.skills.map((skill: any) => (
                    <span 
                      key={skill.name}
                      className="sv-badge sv-badge-blue"
                    >
                      {skill.name} (Lvl {skill.level})
                    </span>
                  ))}
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--sv-text-muted)', lineHeight: 1.6 }}>
                  {trustScore.explanation} This candidate displays a confidence level of {trustScore.confidence}% derived from verified repositories.
                </p>
              </div>
            </div>

            {/* Repos list simple */}
            <div className="sv-card">
              <div className="sv-card-header">
                <span className="sv-card-title">Verified Projects & Audits</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="sv-table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Language</th>
                      <th>Review Summary</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repositories.map((repo: any) => (
                      <tr key={repo.id}>
                        <td className="sv-td-primary">{repo.name}</td>
                        <td>
                          {repo.language ? <span className="sv-chip">{repo.language}</span> : '—'}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--sv-text-subtle)', whiteSpace: 'normal', maxWidth: 400 }}>
                          {repo.review?.summary || 'No review details available.'}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--sv-accent)', fontSize: 13 }}>
                          {repo.review?.overallScore || 70}/100
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        ) : (
          /* Developer full public profile view */
          <div className="sv-grid-2-1">
            
            {/* Main Column (Skill DNA Catalog + Repositories) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* Top Skills radar panel */}
              <div className="sv-card">
                <div className="sv-card-header">
                  <span className="sv-card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Code style={{ width: 14, height: 14, color: 'var(--sv-accent)' }} />
                    Skill DNA Levels Profile
                  </span>
                </div>
                <div className="sv-card-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {skillDna.skills.map((skill: any) => (
                      <div key={skill.name} className="sv-skill-row">
                        <span className="sv-skill-name" style={{ width: 120 }}>{skill.name}</span>
                        <div className="sv-skill-track">
                          <div className="sv-skill-fill" style={{ width: `${skill.level}%` }} />
                        </div>
                        <span className="sv-skill-pct">{skill.level}%</span>
                        <span className="sv-badge sv-badge-zinc" style={{ fontSize: 10 }}>{skill.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Repositories & Scorecards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="sv-section-header">
                  <span className="sv-section-title">Verified Repositories Audits</span>
                </div>
                
                {repositories.map((repo: any) => (
                  <div key={repo.id} className="sv-card">
                    <div className="sv-card-header">
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sv-text)' }}>{repo.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--sv-text-dim)' }}>{repo.fullName}</div>
                      </div>
                      {repo.review && (
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--sv-accent)' }}>{repo.review.overallScore}</span>
                          <span style={{ fontSize: 11, color: 'var(--sv-text-dim)' }}> / 100</span>
                        </div>
                      )}
                    </div>

                    <div className="sv-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <p style={{ fontSize: 12.5, color: 'var(--sv-text-muted)', lineHeight: 1.5, margin: 0 }}>
                        {repo.description || 'No description provided.'}
                      </p>

                      {repo.review && (
                        <div style={{ background: 'var(--sv-surface-2)', border: '1px solid var(--sv-border)', borderRadius: 'var(--sv-r)', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--sv-text-dim)', letterSpacing: '0.05em', marginBottom: 2 }}>Summary Findings</div>
                            <p style={{ fontSize: 12, color: 'var(--sv-text-subtle)', lineHeight: 1.5, margin: 0 }}>{repo.review.summary}</p>
                          </div>

                          <div className="sv-grid-1-1" style={{ gap: 12 }}>
                            {/* Strengths */}
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--sv-success)', letterSpacing: '0.05em', marginBottom: 4 }}>Strengths</div>
                              <ul style={{ paddingLeft: 12, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {repo.review.strengths.slice(0, 3).map((s: string, idx: number) => (
                                  <li key={idx} style={{ fontSize: 11.5, color: 'var(--sv-text-subtle)' }}>{s}</li>
                                ))}
                              </ul>
                            </div>
                            
                            {/* Weaknesses */}
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--sv-danger)', letterSpacing: '0.05em', marginBottom: 4 }}>Security Risks</div>
                              <ul style={{ paddingLeft: 12, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {repo.review.weaknesses.slice(0, 3).map((w: string, idx: number) => (
                                  <li key={idx} style={{ fontSize: 11.5, color: 'var(--sv-text-subtle)' }}>{w}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Sidebar Column (Trust + Skills + Achievements) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* Trust Score detailed */}
              <div className="sv-card">
                <div className="sv-card-header">
                  <span className="sv-card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck style={{ width: 14, height: 14, color: 'var(--sv-success)' }} />
                    Reputation Telemetry
                  </span>
                </div>
                <div className="sv-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {trustScore.categoryScores && Object.entries(trustScore.categoryScores).map(([key, scoreScore]: any) => (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                        <span style={{ color: 'var(--sv-text-subtle)' }}>
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--sv-text)' }}>{scoreScore}/100</span>
                      </div>
                      <div className="sv-bar-track">
                        <div 
                          className="sv-bar-fill sv-bar-fill-blue"
                          style={{ width: `${scoreScore}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Badges */}
              <div className="sv-card">
                <div className="sv-card-header">
                  <span className="sv-card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Award style={{ width: 14, height: 14, color: 'var(--sv-accent)' }} />
                    Verified Achievements
                  </span>
                </div>
                <div className="sv-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px' }}>
                  {badges.filter((b: any) => b.unlocked).map((badge: any) => (
                    <div key={badge.id} style={{ background: 'var(--sv-surface-2)', border: '1px solid var(--sv-border)', borderRadius: 'var(--sv-r)', padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--sv-text)' }}>{badge.title}</span>
                      <p style={{ fontSize: 11, color: 'var(--sv-text-subtle)', margin: 0 }}>{badge.description}</p>
                      <div style={{ borderTop: '1px solid var(--sv-border-2)', paddingTop: 4, marginTop: 2, fontSize: 10, color: 'var(--sv-text-dim)', fontFamily: 'monospace' }}>
                        Evidence: {badge.evidence}
                      </div>
                    </div>
                  ))}
                  {badges.filter((b: any) => b.unlocked).length === 0 && (
                    <span style={{ fontSize: 12, color: 'var(--sv-text-dim)' }}>No badges unlocked yet.</span>
                  )}
                </div>
              </div>

              {/* Developer Timeline */}
              <div className="sv-card">
                <div className="sv-card-header">
                  <span className="sv-card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Activity style={{ width: 14, height: 14, color: 'var(--sv-text-subtle)' }} />
                    Milestones Timeline
                  </span>
                </div>
                <div className="sv-card-body" style={{ padding: '12px 16px' }}>
                  <div className="sv-timeline">
                    {timeline.map((log: any) => (
                      <div key={log.id} className="sv-timeline-item">
                        <div className="sv-timeline-dot sv-timeline-dot-blue" />
                        <div className="sv-timeline-content">
                          <div className="sv-timeline-text" style={{ fontWeight: 500, color: 'var(--sv-text)' }}>{log.title}</div>
                          <div className="sv-timeline-text" style={{ fontSize: 11.5, color: 'var(--sv-text-subtle)' }}>{log.description}</div>
                          <div className="sv-timeline-time">{new Date(log.date).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}
