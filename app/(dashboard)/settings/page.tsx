'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import {
  User, Shield, Key, Globe, Bell, Webhook,
  Save, AlertCircle, CheckCircle2, Eye, EyeOff,
  Trash2, Plus, Copy, Check, RefreshCw,
} from 'lucide-react';

const TABS = ['Profile', 'Integrations', 'API Keys', 'Notifications', 'Privacy'];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [trustScore, setTrustScore] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('Profile');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Set<string>>(new Set());

  // Profile form
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [location, setLocation] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [profRes, keyRes] = await Promise.allSettled([
        fetch('/api/profile').then(r => r.json()),
        fetch('/api/api-keys').then(r => r.json()),
      ]);
      if (profRes.status === 'fulfilled' && profRes.value.success) {
        const p = profRes.value.data?.profile;
        setProfile(p);
        setTrustScore(profRes.value.data?.trustScore);
        setName(p?.name || '');
        setBio(p?.bio || '');
        setGithubUsername(p?.githubUsername || '');
        setLinkedinUrl(p?.linkedinUrl || '');
        setPortfolioUrl(p?.portfolioUrl || '');
        setLocation(p?.location || '');
        setIsPublic(p?.isPublic !== false);
      }
      if (keyRes.status === 'fulfilled' && keyRes.value.success) setApiKeys(keyRes.value.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setResult(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio, githubUsername, linkedinUrl, portfolioUrl, location, isPublic }),
      });
      const json = await res.json();
      setResult(json.success ? { ok: true, msg: 'Profile saved successfully.' } : { ok: false, msg: json.error || 'Failed to save.' });
    } catch {
      setResult({ ok: false, msg: 'Network error.' });
    } finally {
      setSaving(false);
    }
  };

  const generateApiKey = async () => {
    setGeneratingKey(true);
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `Key ${apiKeys.length + 1}`, permissions: ['read'] }),
      });
      const json = await res.json();
      if (json.success) load();
    } finally {
      setGeneratingKey(false);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    try {
      await fetch(`/api/api-keys/${keyId}`, { method: 'DELETE' });
      load();
    } catch {}
  };

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleKeyVisibility = (id: string) => {
    setShowKeys(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  return (
    <div className="sv-app">
      <Navbar
        user={profile ? { name: profile.name, username: profile.username, avatarUrl: profile.avatarUrl } : null}
        breadcrumb="Settings"
      />
      <div className="sv-workspace">
        <Sidebar trustScore={trustScore} />
        <main className="sv-content">
          <div className="sv-page">
            <div className="sv-page-header">
              <div>
                <h1 className="sv-page-title">Settings</h1>
                <p className="sv-page-desc">Manage your account, integrations, and privacy</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="sv-tabs" style={{ marginBottom: 24 }}>
              {TABS.map(tab => (
                <button key={tab} className={`sv-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Profile tab */}
            {activeTab === 'Profile' && (
              <div className="sv-grid-2-1">
                <div className="sv-card">
                  <div className="sv-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <User style={{ width: 14, height: 14, color: 'var(--sv-accent)' }} />
                      <span className="sv-card-title">Profile Information</span>
                    </div>
                  </div>
                  <form onSubmit={saveProfile}>
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 0 }}>

                      {[
                        { label: 'Full Name', desc: 'Your display name across SkillVerse', value: name, onChange: setName, placeholder: 'Your name', type: 'text' },
                        { label: 'Location', desc: 'City, Country', value: location, onChange: setLocation, placeholder: 'San Francisco, CA', type: 'text' },
                        { label: 'GitHub Username', desc: 'Used to import repositories', value: githubUsername, onChange: setGithubUsername, placeholder: 'octocat', type: 'text' },
                        { label: 'LinkedIn URL', desc: 'Your LinkedIn profile', value: linkedinUrl, onChange: setLinkedinUrl, placeholder: 'https://linkedin.com/in/...', type: 'url' },
                        { label: 'Portfolio URL', desc: 'Personal website or portfolio', value: portfolioUrl, onChange: setPortfolioUrl, placeholder: 'https://...', type: 'url' },
                      ].map((field, i) => (
                        <div key={i} className="sv-form-row">
                          <div>
                            <div className="sv-form-row-label">{field.label}</div>
                            <div className="sv-form-row-desc">{field.desc}</div>
                          </div>
                          <div className="sv-form-row-ctrl">
                            <input
                              type={field.type}
                              className="sv-input"
                              placeholder={field.placeholder}
                              value={field.value}
                              onChange={e => field.onChange(e.target.value)}
                            />
                          </div>
                        </div>
                      ))}

                      {/* Bio */}
                      <div className="sv-form-row" style={{ alignItems: 'flex-start' }}>
                        <div>
                          <div className="sv-form-row-label">Bio</div>
                          <div className="sv-form-row-desc">Short developer bio</div>
                        </div>
                        <div className="sv-form-row-ctrl">
                          <textarea
                            rows={3}
                            className="sv-input"
                            placeholder="Senior fullstack developer specializing in..."
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            style={{ resize: 'vertical' }}
                          />
                        </div>
                      </div>

                      {/* Public profile toggle */}
                      <div className="sv-form-row">
                        <div>
                          <div className="sv-form-row-label">Public Profile</div>
                          <div className="sv-form-row-desc">Allow recruiters to find your profile</div>
                        </div>
                        <div className="sv-form-row-ctrl">
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                            <div
                              style={{
                                width: 36, height: 20, borderRadius: 10,
                                background: isPublic ? 'var(--sv-accent)' : 'var(--sv-surface-2)',
                                border: `1px solid ${isPublic ? 'var(--sv-accent)' : 'var(--sv-border)'}`,
                                position: 'relative', transition: 'background 200ms',
                                cursor: 'pointer',
                              }}
                              onClick={() => setIsPublic(!isPublic)}
                            >
                              <div style={{
                                position: 'absolute', top: 2, left: isPublic ? 17 : 2,
                                width: 14, height: 14, borderRadius: '50%', background: 'white',
                                transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                              }} />
                            </div>
                            <span style={{ fontSize: 12.5, color: 'var(--sv-text-muted)' }}>
                              {isPublic ? 'Public' : 'Private'}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {result && (
                      <div style={{ margin: '0 16px 10px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: result.ok ? 'var(--sv-success)' : 'var(--sv-danger)' }}>
                        {result.ok ? <CheckCircle2 style={{ width: 13, height: 13 }} /> : <AlertCircle style={{ width: 13, height: 13 }} />}
                        {result.msg}
                      </div>
                    )}

                    <div style={{ padding: '10px 16px', borderTop: '1px solid var(--sv-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button type="button" onClick={load} className="sv-btn sv-btn-ghost">
                        <RefreshCw style={{ width: 13, height: 13 }} />Reset
                      </button>
                      <button type="submit" disabled={saving} className="sv-btn sv-btn-primary">
                        {saving ? <><span className="sv-spinner" style={{ width: 12, height: 12 }} />Saving</> : <><Save style={{ width: 13, height: 13 }} />Save Changes</>}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Account summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="sv-card">
                    <div className="sv-card-header">
                      <span className="sv-card-title">Account Details</span>
                    </div>
                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {[
                        { label: 'Username', value: profile?.username ?? '—' },
                        { label: 'Email',    value: profile?.email ?? '—' },
                        { label: 'Plan',     value: 'Free' },
                        { label: 'Joined',   value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—' },
                        { label: 'Trust Score', value: trustScore?.overallScore ?? '—' },
                      ].map((row, i) => (
                        <div key={i} className="sv-form-row" style={{ padding: '9px 0' }}>
                          <span style={{ fontSize: 12, color: 'var(--sv-text-subtle)' }}>{row.label}</span>
                          <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--sv-text)' }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="sv-card">
                    <div className="sv-card-header">
                      <span className="sv-card-title">Danger Zone</span>
                    </div>
                    <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: 12.5, color: 'var(--sv-text-subtle)' }}>
                        Permanently delete your account and all associated data. This cannot be undone.
                      </div>
                      <button className="sv-btn sv-btn-danger" style={{ width: 'fit-content' }}>
                        <Trash2 style={{ width: 13, height: 13 }} />
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* API Keys tab */}
            {activeTab === 'API Keys' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--sv-text-muted)', lineHeight: 1.6, maxWidth: 480 }}>
                      API keys allow external applications to access SkillVerse data on your behalf.
                      Keep them secret — treat them like passwords.
                    </div>
                  </div>
                  <button
                    onClick={generateApiKey}
                    disabled={generatingKey}
                    className="sv-btn sv-btn-primary"
                    style={{ flexShrink: 0 }}
                  >
                    {generatingKey
                      ? <><span className="sv-spinner" style={{ width: 12, height: 12 }} />Generating</>
                      : <><Plus style={{ width: 13, height: 13 }} />Generate Key</>}
                  </button>
                </div>

                <div className="sv-card">
                  <div style={{ overflowX: 'auto' }}>
                    <table className="sv-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Key</th>
                          <th>Permissions</th>
                          <th>Last Used</th>
                          <th>Created</th>
                          <th style={{ width: 90 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? Array(2).fill(0).map((_, i) => (
                          <tr key={i}>{[100, 200, 80, 100, 100, 70].map((w, j) => (
                            <td key={j}><div className="sv-skeleton" style={{ height: 12, width: w }} /></td>
                          ))}</tr>
                        )) : apiKeys.length === 0 ? (
                          <tr><td colSpan={6}>
                            <div className="sv-empty" style={{ padding: 32 }}>
                              <Key style={{ width: 24, height: 24, color: 'var(--sv-text-dim)' }} />
                              <div className="sv-empty-title">No API keys yet</div>
                              <div className="sv-empty-desc">Generate a key to integrate SkillVerse with external tools.</div>
                            </div>
                          </td></tr>
                        ) : apiKeys.map((k, i) => {
                          const isVisible = showKeys.has(k.id);
                          const maskedKey = k.keyValue
                            ? `${k.keyValue.slice(0, 8)}${'•'.repeat(24)}${k.keyValue.slice(-4)}`
                            : 'sk-•••••••••••••••••••••';
                          return (
                            <tr key={i}>
                              <td className="sv-td-primary">{k.name || `Key ${i + 1}`}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <code className="sv-mono" style={{ color: 'var(--sv-text-subtle)', fontSize: 11 }}>
                                    {isVisible ? k.keyValue : maskedKey}
                                  </code>
                                </div>
                              </td>
                              <td>
                                {(k.permissions || ['read']).map((p: string) => (
                                  <span key={p} className="sv-badge sv-badge-zinc" style={{ marginRight: 3 }}>{p}</span>
                                ))}
                              </td>
                              <td style={{ fontSize: 12, color: 'var(--sv-text-dim)' }}>
                                {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}
                              </td>
                              <td style={{ fontSize: 12, color: 'var(--sv-text-dim)' }}>
                                {k.createdAt ? new Date(k.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: 3 }}>
                                  <button
                                    onClick={() => toggleKeyVisibility(k.id)}
                                    className="sv-btn sv-btn-ghost sv-btn-sm"
                                    title={isVisible ? 'Hide key' : 'Show key'}
                                    style={{ padding: '3px 5px' }}
                                  >
                                    {isVisible ? <EyeOff style={{ width: 12, height: 12 }} /> : <Eye style={{ width: 12, height: 12 }} />}
                                  </button>
                                  <button
                                    onClick={() => copyKey(k.keyValue, k.id)}
                                    className="sv-btn sv-btn-ghost sv-btn-sm"
                                    title="Copy key"
                                    style={{ padding: '3px 5px' }}
                                  >
                                    {copiedKey === k.id ? <Check style={{ width: 12, height: 12, color: 'var(--sv-success)' }} /> : <Copy style={{ width: 12, height: 12 }} />}
                                  </button>
                                  <button
                                    onClick={() => revokeApiKey(k.id)}
                                    className="sv-btn sv-btn-ghost sv-btn-sm"
                                    title="Revoke key"
                                    style={{ padding: '3px 5px', color: 'var(--sv-danger)' }}
                                  >
                                    <Trash2 style={{ width: 12, height: 12 }} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="sv-card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <AlertCircle style={{ width: 14, height: 14, color: 'var(--sv-warning)', flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: 12.5, color: 'var(--sv-text-subtle)', lineHeight: 1.6 }}>
                      API keys grant full access to your SkillVerse account via the API.
                      Revoke any key immediately if you suspect it has been compromised.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations tab */}
            {activeTab === 'Integrations' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { name: 'GitHub', desc: 'Connect your GitHub account to import repositories and track contributions', connected: !!profile?.githubUsername, action: 'Connect' },
                  { name: 'LinkedIn', desc: 'Sync your professional profile and career history', connected: !!profile?.linkedinUrl, action: 'Connect' },
                  { name: 'npm Registry', desc: 'Track your published npm packages as verified work', connected: false, action: 'Connect' },
                  { name: 'GitLab', desc: 'Import repositories from your GitLab account', connected: false, action: 'Connect (soon)', disabled: true },
                ].map((integration, i) => (
                  <div key={i} className="sv-card">
                    <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 'var(--sv-r)', background: 'var(--sv-surface-2)', border: '1px solid var(--sv-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Globe style={{ width: 14, height: 14, color: 'var(--sv-text-subtle)' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--sv-text)', marginBottom: 2 }}>{integration.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--sv-text-subtle)' }}>{integration.desc}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {integration.connected && (
                          <span className="sv-badge sv-badge-green"><CheckCircle2 style={{ width: 9, height: 9 }} />Connected</span>
                        )}
                        <button
                          disabled={(integration as any).disabled}
                          className={`sv-btn sv-btn-sm ${integration.connected ? 'sv-btn-ghost sv-btn-danger' : 'sv-btn-secondary'}`}
                          style={{ opacity: (integration as any).disabled ? 0.5 : 1 }}
                        >
                          {integration.connected ? 'Disconnect' : integration.action}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notifications tab */}
            {activeTab === 'Notifications' && (
              <div className="sv-card">
                <div className="sv-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Bell style={{ width: 14, height: 14, color: 'var(--sv-accent)' }} />
                    <span className="sv-card-title">Notification Preferences</span>
                  </div>
                </div>
                <div style={{ padding: '0 16px' }}>
                  {[
                    { label: 'AI Review Completed',     desc: 'When a repository review finishes',       defaultOn: true },
                    { label: 'Trust Score Changed',     desc: 'When your Trust Score updates',           defaultOn: true },
                    { label: 'New Job Match',           desc: 'When a job matches your profile',         defaultOn: true },
                    { label: 'Community Replies',       desc: 'When someone replies to your post',       defaultOn: false },
                    { label: 'Challenge Deadlines',     desc: 'Reminder before a challenge ends',        defaultOn: true },
                    { label: 'Weekly Report',           desc: 'Weekly summary of your progress',         defaultOn: true },
                    { label: 'Security Alerts',         desc: 'Unusual activity or access detected',     defaultOn: true },
                  ].map((pref, i) => (
                    <div key={i} className="sv-form-row">
                      <div>
                        <div className="sv-form-row-label">{pref.label}</div>
                        <div className="sv-form-row-desc">{pref.desc}</div>
                      </div>
                      <div>
                        <div
                          style={{
                            width: 36, height: 20, borderRadius: 10,
                            background: pref.defaultOn ? 'var(--sv-accent)' : 'var(--sv-surface-2)',
                            border: `1px solid ${pref.defaultOn ? 'var(--sv-accent)' : 'var(--sv-border)'}`,
                            position: 'relative', cursor: 'pointer',
                          }}
                        >
                          <div style={{
                            position: 'absolute', top: 2, left: pref.defaultOn ? 17 : 2,
                            width: 14, height: 14, borderRadius: '50%', background: 'white',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--sv-border)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="sv-btn sv-btn-primary">
                    <Save style={{ width: 13, height: 13 }} />Save Preferences
                  </button>
                </div>
              </div>
            )}

            {/* Privacy tab */}
            {activeTab === 'Privacy' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="sv-card">
                  <div className="sv-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Shield style={{ width: 14, height: 14, color: 'var(--sv-accent)' }} />
                      <span className="sv-card-title">Privacy Controls</span>
                    </div>
                  </div>
                  <div style={{ padding: '0 16px' }}>
                    {[
                      { label: 'Public Profile',       desc: 'Allow your profile to be discovered by recruiters' },
                      { label: 'Show Trust Score',      desc: 'Display your Trust Score on your public passport' },
                      { label: 'Show Skill DNA',        desc: 'Allow others to see your skill breakdown' },
                      { label: 'Show Repositories',     desc: 'List your analyzed repositories publicly' },
                      { label: 'Recruiter Discovery',   desc: 'Appear in recruiter candidate searches' },
                    ].map((ctrl, i) => (
                      <div key={i} className="sv-form-row">
                        <div>
                          <div className="sv-form-row-label">{ctrl.label}</div>
                          <div className="sv-form-row-desc">{ctrl.desc}</div>
                        </div>
                        <div style={{
                          width: 36, height: 20, borderRadius: 10,
                          background: 'var(--sv-accent)',
                          border: '1px solid var(--sv-accent)',
                          position: 'relative', cursor: 'pointer',
                        }}>
                          <div style={{
                            position: 'absolute', top: 2, left: 17,
                            width: 14, height: 14, borderRadius: '50%', background: 'white',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
