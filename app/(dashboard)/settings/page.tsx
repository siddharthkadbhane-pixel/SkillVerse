'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import {
  User, Shield, Key, Globe, Bell, Webhook,
  Save, AlertCircle, CheckCircle2, Eye, EyeOff,
  Trash2, Plus, Copy, Check, RefreshCw,
  CreditCard, Sparkles, Zap, ShieldCheck, Layers,
  BarChart3, ArrowUpRight, Info, Calendar, ArrowRight,
  Download, Lock, FileText, Scale, Cookie, UserX, AlertTriangle, UserCheck
} from 'lucide-react';


const TABS = ['Profile', 'Billing & Usage', 'Integrations', 'API Keys', 'Webhooks', 'Notifications', 'Privacy'];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [trustScore, setTrustScore] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('Profile');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<string | null>(null);
  const [newTokenName, setNewTokenName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['read:profile', 'read:dcc', 'read:skills']);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Set<string>>(new Set());
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>(['skill.verified', 'dcc.updated', 'repository.analyzed']);
  const [creatingWebhook, setCreatingWebhook] = useState(false);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [webhookTestResult, setWebhookTestResult] = useState<{ id: string; msg: string } | null>(null);

  // Billing & Usage state
  const [billingPlan, setBillingPlan] = useState<any>(null);
  const [usageSummary, setUsageSummary] = useState<any>(null);
  const [isAnnualBilling, setIsAnnualBilling] = useState(false);
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);
  const [planSwitchMessage, setPlanSwitchMessage] = useState<{ ok: boolean; msg: string } | null>(null);

  // Privacy & Consent state (Phase 41)
  const [consents, setConsents] = useState<Record<string, boolean>>({
    service_operation: true,
    public_profile: true,
    private_repo_analysis: false,
    analytics_telemetry: true,
    marketing_updates: false,
  });
  const [exportingData, setExportingData] = useState(false);
  const [disconnectingGithub, setDisconnectingGithub] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [privacyResult, setPrivacyResult] = useState<{ ok: boolean; msg: string } | null>(null);

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
      const [profRes, keyRes, whRes, planRes, usageRes, consentRes] = await Promise.allSettled([
        fetch('/api/profile').then(r => r.json()),
        fetch('/api/v1/keys').then(r => r.json()),
        fetch('/api/v1/webhooks').then(r => r.json()),
        fetch('/api/billing/plan').then(r => r.json()),
        fetch('/api/billing/usage').then(r => r.json()),
        fetch('/api/privacy/consent').then(r => r.json()),
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
      if (keyRes.status === 'fulfilled' && keyRes.value.data) setApiKeys(keyRes.value.data ?? []);
      if (whRes.status === 'fulfilled' && whRes.value.data) setWebhooks(whRes.value.data ?? []);
      if (planRes.status === 'fulfilled' && planRes.value.data) setBillingPlan(planRes.value.data);
      if (usageRes.status === 'fulfilled' && usageRes.value.data) setUsageSummary(usageRes.value.data);
      if (consentRes.status === 'fulfilled' && consentRes.value.success && consentRes.value.data?.consents) {
        setConsents(consentRes.value.data.consents);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleConsent = async (purpose: string, currentValue: boolean) => {
    const nextVal = !currentValue;
    setConsents(prev => ({ ...prev, [purpose]: nextVal }));
    try {
      await fetch('/api/privacy/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose, granted: nextVal }),
      });
      setPrivacyResult({ ok: true, msg: `Consent for ${purpose.replace(/_/g, ' ')} updated.` });
    } catch {
      setPrivacyResult({ ok: false, msg: 'Failed to update consent preference.' });
    }
  };

  const handleDownloadData = async () => {
    setExportingData(true);
    setPrivacyResult(null);
    try {
      const res = await fetch('/api/privacy/export', { method: 'POST' });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `skillverse_export_${profile?.username || 'developer'}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setPrivacyResult({ ok: true, msg: 'Your complete verified data archive has been downloaded.' });
    } catch (err: any) {
      setPrivacyResult({ ok: false, msg: err.message || 'Failed to download data archive.' });
    } finally {
      setExportingData(false);
    }
  };

  const handleDisconnectGithub = async () => {
    if (!window.confirm('Are you sure you want to disconnect GitHub? This will halt repository syncing and delete local OAuth credentials.')) {
      return;
    }
    setDisconnectingGithub(true);
    setPrivacyResult(null);
    try {
      const res = await fetch('/api/privacy/disconnect-github', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setPrivacyResult({ ok: true, msg: 'GitHub disconnected successfully.' });
        setGithubUsername('');
        await load();
      } else {
        setPrivacyResult({ ok: false, msg: json.error || 'Failed to disconnect GitHub.' });
      }
    } catch {
      setPrivacyResult({ ok: false, msg: 'Network error disconnecting GitHub.' });
    } finally {
      setDisconnectingGithub(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE_MY_ACCOUNT') {
      setPrivacyResult({ ok: false, msg: 'Please type DELETE_MY_ACCOUNT exactly to confirm.' });
      return;
    }
    setDeletingAccount(true);
    setPrivacyResult(null);
    try {
      const res = await fetch('/api/privacy/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'DELETE_MY_ACCOUNT' }),
      });
      const json = await res.json();
      if (json.success) {
        alert('Your account personal data has been permanently anonymized and tokens revoked.');
        window.location.href = '/';
      } else {
        setPrivacyResult({ ok: false, msg: json.error || 'Failed to delete account.' });
      }
    } catch {
      setPrivacyResult({ ok: false, msg: 'Network error deleting account.' });
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleSwitchPlan = async (planId: string) => {
    setUpgradingPlanId(planId);
    setPlanSwitchMessage(null);
    try {
      const res = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, action: 'upgrade' }),
      });
      const json = await res.json();
      if (json.success) {
        setPlanSwitchMessage({ ok: true, msg: json.data?.message || `Switched to ${planId}` });
        await load();
      } else {
        setPlanSwitchMessage({ ok: false, msg: json.error || 'Failed to switch plan' });
      }
    } catch {
      setPlanSwitchMessage({ ok: false, msg: 'Network error switching plan' });
    } finally {
      setUpgradingPlanId(null);
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
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTokenName.trim() || `PAT-${Date.now().toString().slice(-4)}`,
          scopes: selectedScopes,
          expiresInDays: 90,
        }),
      });
      const json = await res.json();
      if (json.data?.rawToken) {
        setNewlyCreatedToken(json.data.rawToken);
        setNewTokenName('');
        load();
      }
    } finally {
      setGeneratingKey(false);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    try {
      await fetch(`/api/v1/keys/${keyId}`, { method: 'DELETE' });
      load();
    } catch {}
  };

  const createWebhookSub = async () => {
    if (!webhookUrl.trim()) return;
    setCreatingWebhook(true);
    try {
      const res = await fetch('/api/v1/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl.trim(), events: webhookEvents }),
      });
      const json = await res.json();
      if (json.data) {
        setWebhookUrl('');
        setShowWebhookModal(false);
        load();
      }
    } finally {
      setCreatingWebhook(false);
    }
  };

  const deleteWebhookSub = async (id: string) => {
    try {
      await fetch(`/api/v1/webhooks/${id}`, { method: 'DELETE' });
      load();
    } catch {}
  };

  const testWebhookSub = async (id: string) => {
    setTestingWebhookId(id);
    setWebhookTestResult(null);
    try {
      const res = await fetch(`/api/v1/webhooks/${id}/test`, { method: 'POST' });
      const json = await res.json();
      setWebhookTestResult({
        id,
        msg: json.data?.message || 'Dispatched test payload with HMAC-SHA256 signature.',
      });
    } catch {
      setWebhookTestResult({ id, msg: 'Failed to test webhook.' });
    } finally {
      setTestingWebhookId(null);
    }
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

            {/* Billing & Usage Tab */}
            {activeTab === 'Billing & Usage' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {planSwitchMessage && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: 13,
                      background: planSwitchMessage.ok ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${planSwitchMessage.ok ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      color: planSwitchMessage.ok ? '#10B981' : '#EF4444',
                    }}
                  >
                    {planSwitchMessage.ok ? <CheckCircle2 style={{ width: 16, height: 16 }} /> : <AlertCircle style={{ width: 16, height: 16 }} />}
                    <span>{planSwitchMessage.msg}</span>
                  </div>
                )}

                {/* Top Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                  {/* Current Active Plan Card */}
                  <div className="sv-card" style={{ padding: 18, border: '1px solid rgba(124, 58, 237, 0.3)', background: 'linear-gradient(180deg, rgba(124, 58, 237, 0.05) 0%, rgba(13, 18, 26, 0.8) 100%)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#A78BFA' }}>
                        Active Subscription
                      </span>
                      <span className="sv-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        <CheckCircle2 style={{ width: 11, height: 11 }} />
                        {billingPlan?.subscription?.status === 'active' ? 'Active Tier' : 'Free Development Tier'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                        {billingPlan?.currentPlan?.name || 'Developer Free'}
                      </h2>
                      <span className="sv-mono" style={{ fontSize: 20, fontWeight: 700, color: '#F8FAFC' }}>
                        ${billingPlan?.currentPlan?.priceMonthly || 0}
                        <span style={{ fontSize: 11, color: 'var(--sv-text-subtle)', fontWeight: 400 }}> / mo</span>
                      </span>
                    </div>

                    <p style={{ fontSize: 12, color: 'var(--sv-text-subtle)', marginBottom: 14, lineHeight: 1.5 }}>
                      {billingPlan?.currentPlan?.description || 'Core proof-of-capability engine for every software engineer.'}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: '#94A3B8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                      <Calendar style={{ width: 13, height: 13, color: '#A78BFA' }} />
                      <span>
                        Period resets in <strong style={{ color: '#F8FAFC' }}>{usageSummary?.period?.daysRemaining ?? 30} days</strong> ({new Date(usageSummary?.period?.periodEnd || Date.now() + 30 * 86400000).toLocaleDateString()})
                      </span>
                    </div>
                  </div>

                  {/* Monthly Quota Consumption Meters */}
                  <div className="sv-card" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--sv-text-subtle)' }}>
                        Monthly Resource Usage
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--sv-text-subtle)' }}>
                        Resets Monthly
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* Repo Analyses */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: 'var(--sv-text)' }}>Repository AST Analyses</span>
                          <span className="sv-mono" style={{ color: '#F8FAFC', fontWeight: 600 }}>
                            {usageSummary?.metrics?.repository_analyses?.used ?? 3} / {usageSummary?.metrics?.repository_analyses?.limit ?? 10}
                          </span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${usageSummary?.metrics?.repository_analyses?.percentageUsed ?? 30}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #7C3AED, #06B6D4)',
                              borderRadius: 3,
                            }}
                          />
                        </div>
                      </div>

                      {/* AI Reviews */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: 'var(--sv-text)' }}>AI Architecture Reviews</span>
                          <span className="sv-mono" style={{ color: '#F8FAFC', fontWeight: 600 }}>
                            {usageSummary?.metrics?.ai_reviews?.used ?? 2} / {usageSummary?.metrics?.ai_reviews?.limit ?? 5}
                          </span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${usageSummary?.metrics?.ai_reviews?.percentageUsed ?? 40}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #3B82F6, #10B981)',
                              borderRadius: 3,
                            }}
                          />
                        </div>
                      </div>

                      {/* API Calls */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: 'var(--sv-text)' }}>Developer API Requests</span>
                          <span className="sv-mono" style={{ color: '#F8FAFC', fontWeight: 600 }}>
                            {usageSummary?.metrics?.api_requests?.used ?? 48} / {usageSummary?.metrics?.api_requests?.limit ?? 1000}
                          </span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${usageSummary?.metrics?.api_requests?.percentageUsed ?? 5}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #F59E0B, #EC4899)',
                              borderRadius: 3,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Free-First Trust & Capability Separation Notice */}
                <div
                  className="sv-card"
                  style={{
                    padding: '14px 18px',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    background: 'rgba(56, 189, 248, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShieldCheck style={{ width: 18, height: 18, color: '#38BDF8' }} />
                  </div>
                  <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5, color: '#94A3B8' }}>
                    <strong style={{ color: '#F8FAFC' }}>SkillVerse Proof-of-Capability Guarantee:</strong> Developer capability scores (DCC 2.0), Trust Scores, and verified skills are 100% computed from deterministic AST code heuristics and Git evidence. Paid tiers provide higher compute quotas and recruitment tooling — never score inflation.
                  </div>
                </div>

                {/* Plan Tier Switcher / Comparison */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC', margin: '0 0 4px' }}>
                        Available Plans
                      </h3>
                      <p style={{ fontSize: 12, color: 'var(--sv-text-subtle)', margin: 0 }}>
                        Switch plans at any time. All developer profiles retain core AST verification for free.
                      </p>
                    </div>

                    {/* Monthly / Annual Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#111722', padding: '4px 6px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
                      <button
                        onClick={() => setIsAnnualBilling(false)}
                        style={{
                          fontSize: 12,
                          padding: '4px 10px',
                          borderRadius: 6,
                          background: !isAnnualBilling ? 'var(--sv-accent)' : 'transparent',
                          color: !isAnnualBilling ? '#FFFFFF' : 'var(--sv-text-subtle)',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setIsAnnualBilling(true)}
                        style={{
                          fontSize: 12,
                          padding: '4px 10px',
                          borderRadius: 6,
                          background: isAnnualBilling ? 'var(--sv-accent)' : 'transparent',
                          color: isAnnualBilling ? '#FFFFFF' : 'var(--sv-text-subtle)',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        Annual
                        <span style={{ fontSize: 10, background: '#10B981', color: '#070A0F', fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>
                          Save 25%
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Plan Cards Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    {(billingPlan?.availablePlans || []).map((plan: any) => {
                      const isCurrent = (billingPlan?.subscription?.planId || 'free') === plan.id;
                      const price = isAnnualBilling ? plan.priceAnnualMonthly : plan.priceMonthly;

                      return (
                        <div
                          key={plan.id}
                          className="sv-card"
                          style={{
                            padding: 20,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            border: isCurrent ? '1px solid #7C3AED' : '1px solid var(--sv-border)',
                            position: 'relative',
                            background: isCurrent ? 'rgba(124, 58, 237, 0.03)' : 'var(--sv-card)',
                          }}
                        >
                          {plan.popular && (
                            <div style={{ position: 'absolute', top: -10, right: 16, background: '#7C3AED', color: '#FFFFFF', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 4 }}>
                              Most Popular
                            </div>
                          )}

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <h4 style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                                {plan.name}
                              </h4>
                              {isCurrent && (
                                <span className="sv-badge sv-badge-green" style={{ fontSize: 10 }}>
                                  Current Plan
                                </span>
                              )}
                            </div>

                            <p style={{ fontSize: 12, color: 'var(--sv-text-subtle)', minHeight: 34, marginBottom: 14 }}>
                              {plan.description}
                            </p>

                            <div style={{ marginBottom: 16 }}>
                              <span className="sv-mono" style={{ fontSize: 24, fontWeight: 700, color: '#F8FAFC' }}>
                                ${price}
                              </span>
                              <span style={{ fontSize: 12, color: 'var(--sv-text-subtle)' }}> / month</span>
                            </div>

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14, marginBottom: 18 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--sv-text-subtle)', marginBottom: 10 }}>
                                Included Features:
                              </div>
                              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {plan.features.map((feat: string, idx: number) => (
                                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#94A3B8' }}>
                                    <Check style={{ width: 14, height: 14, color: '#10B981', flexShrink: 0, marginTop: 1 }} />
                                    <span>{feat}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <button
                            onClick={() => handleSwitchPlan(plan.id)}
                            disabled={isCurrent || upgradingPlanId === plan.id}
                            className={`sv-btn ${isCurrent ? 'sv-btn-secondary' : 'sv-btn-primary'}`}
                            style={{ width: '100%', justifyContent: 'center' }}
                          >
                            {upgradingPlanId === plan.id ? (
                              <><span className="sv-spinner" style={{ width: 12, height: 12 }} />Switching...</>
                            ) : isCurrent ? (
                              'Active Plan'
                            ) : plan.id === 'free' ? (
                              'Downgrade to Free'
                            ) : (
                              <>Switch to {plan.name} <ArrowRight style={{ width: 13, height: 13 }} /></>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* API Keys / Personal Access Tokens tab */}
            {activeTab === 'API Keys' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--sv-text-muted)', lineHeight: 1.6, maxWidth: 520 }}>
                      Personal Access Tokens (PAT) allow the SkillVerse CLI, VS Code Extension, and custom automation to authenticate securely. Tokens are SHA-256 hashed and never stored in plaintext.
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
                      : <><Plus style={{ width: 13, height: 13 }} />Create Access Token</>}
                  </button>
                </div>

                {/* Newly Created Token Reveal Modal Banner */}
                {newlyCreatedToken && (
                  <div className="sv-card" style={{ padding: 16, border: '1px solid #7C3AED', background: 'rgba(124, 58, 237, 0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <CheckCircle2 style={{ width: 16, height: 16, color: '#10B981' }} />
                      <strong style={{ fontSize: 13, color: '#FFFFFF' }}>Personal Access Token Created</strong>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--sv-text-subtle)', marginBottom: 12 }}>
                      Make sure to copy your new personal access token now. You won't be able to see it again!
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <code className="sv-mono" style={{ background: '#070A0F', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', color: '#A78BFA', fontSize: 12, flex: 1, wordBreak: 'break-all' }}>
                        {newlyCreatedToken}
                      </code>
                      <button
                        onClick={() => copyKey(newlyCreatedToken, 'new_token')}
                        className="sv-btn sv-btn-primary"
                        style={{ flexShrink: 0 }}
                      >
                        {copiedKey === 'new_token' ? <Check style={{ width: 13, height: 13 }} /> : <Copy style={{ width: 13, height: 13 }} />}
                        {copiedKey === 'new_token' ? 'Copied' : 'Copy Token'}
                      </button>
                      <button
                        onClick={() => setNewlyCreatedToken(null)}
                        className="sv-btn sv-btn-ghost"
                        style={{ flexShrink: 0 }}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}

                <div className="sv-card">
                  <div style={{ overflowX: 'auto' }}>
                    <table className="sv-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Token Prefix</th>
                          <th>Scopes</th>
                          <th>Last Used</th>
                          <th>Created</th>
                          <th style={{ width: 90 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? Array(2).fill(0).map((_, i) => (
                          <tr key={i}>{[100, 150, 120, 90, 90, 50].map((w, j) => (
                            <td key={j}><div className="sv-skeleton" style={{ height: 12, width: w }} /></td>
                          ))}</tr>
                        )) : apiKeys.length === 0 ? (
                          <tr><td colSpan={6}>
                            <div className="sv-empty" style={{ padding: 32 }}>
                              <Key style={{ width: 24, height: 24, color: 'var(--sv-text-dim)' }} />
                              <div className="sv-empty-title">No personal access tokens</div>
                              <div className="sv-empty-desc">Create a token to authenticate the VS Code extension or CLI.</div>
                            </div>
                          </td></tr>
                        ) : apiKeys.map((k, i) => (
                          <tr key={i}>
                            <td className="sv-td-primary">{k.name || `Token ${i + 1}`}</td>
                            <td>
                              <code className="sv-mono" style={{ color: '#A78BFA', fontSize: 11 }}>
                                {k.tokenPrefix || 'sk_live_...key'}
                              </code>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, maxWidth: 220 }}>
                                {(k.scopes || ['read:profile', 'read:dcc']).slice(0, 3).map((p: string) => (
                                  <span key={p} className="sv-badge sv-badge-zinc" style={{ fontSize: 10 }}>{p}</span>
                                ))}
                                {(k.scopes || []).length > 3 && (
                                  <span className="sv-badge sv-badge-zinc" style={{ fontSize: 10 }}>+{(k.scopes || []).length - 3}</span>
                                )}
                              </div>
                            </td>
                            <td style={{ fontSize: 12, color: 'var(--sv-text-dim)' }}>
                              {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}
                            </td>
                            <td style={{ fontSize: 12, color: 'var(--sv-text-dim)' }}>
                              {k.createdAt ? new Date(k.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </td>
                            <td>
                              <button
                                onClick={() => revokeApiKey(k.id)}
                                className="sv-btn sv-btn-ghost sv-btn-sm"
                                title="Revoke token"
                                style={{ padding: '4px 8px', color: 'var(--sv-danger)' }}
                              >
                                <Trash2 style={{ width: 12, height: 12 }} /> Revoke
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="sv-card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <AlertCircle style={{ width: 14, height: 14, color: 'var(--sv-warning)', flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: 12.5, color: 'var(--sv-text-subtle)', lineHeight: 1.6 }}>
                      Personal access tokens authenticate API requests with your developer permissions. Check the <a href="/api/v1/openapi" target="_blank" className="text-[#A78BFA] underline">OpenAPI Documentation</a> for API endpoints and schema.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Webhooks tab */}
            {activeTab === 'Webhooks' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--sv-text-muted)', lineHeight: 1.6, maxWidth: 520 }}>
                      Subscribe to real-time events like skill verifications, DCC score changes, and AST review completions. Webhooks are signed with cryptographic HMAC-SHA256 headers.
                    </div>
                  </div>
                  <button
                    onClick={() => setShowWebhookModal(!showWebhookModal)}
                    className="sv-btn sv-btn-primary"
                    style={{ flexShrink: 0 }}
                  >
                    <Plus style={{ width: 13, height: 13 }} /> Add Webhook Endpoint
                  </button>
                </div>

                {/* Add Webhook Form */}
                {showWebhookModal && (
                  <div className="sv-card" style={{ padding: 16, border: '1px solid rgba(124, 58, 237, 0.3)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 12 }}>New Webhook Subscription</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 12, color: 'var(--sv-text-subtle)', marginBottom: 4, display: 'block' }}>Destination Endpoint URL</label>
                        <input
                          type="url"
                          placeholder="https://api.yourcompany.com/webhooks/skillverse"
                          className="sv-input"
                          value={webhookUrl}
                          onChange={e => setWebhookUrl(e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: 'var(--sv-text-subtle)', marginBottom: 4, display: 'block' }}>Event Subscriptions</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {['skill.verified', 'dcc.updated', 'repository.analyzed', 'review.completed', 'challenge.completed', 'opportunity.created'].map(evt => {
                            const isSelected = webhookEvents.includes(evt);
                            return (
                              <button
                                key={evt}
                                type="button"
                                onClick={() => {
                                  if (isSelected) setWebhookEvents(webhookEvents.filter(e => e !== evt));
                                  else setWebhookEvents([...webhookEvents, evt]);
                                }}
                                className={`sv-badge ${isSelected ? 'sv-badge-primary' : 'sv-badge-zinc'}`}
                                style={{ padding: '5px 9px', cursor: 'pointer' }}
                              >
                                {isSelected ? '✓ ' : '+ '} {evt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                        <button type="button" onClick={() => setShowWebhookModal(false)} className="sv-btn sv-btn-ghost">
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={createWebhookSub}
                          disabled={creatingWebhook || !webhookUrl.trim() || webhookEvents.length === 0}
                          className="sv-btn sv-btn-primary"
                        >
                          {creatingWebhook ? 'Subscribing...' : 'Save Webhook'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Webhook Test Alert */}
                {webhookTestResult && (
                  <div className="sv-card" style={{ padding: 12, border: '1px solid #10B981', background: 'rgba(16, 185, 129, 0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#10B981' }}>
                      <CheckCircle2 style={{ width: 14, height: 14 }} />
                      {webhookTestResult.msg}
                    </div>
                  </div>
                )}

                {/* Webhooks List */}
                <div className="sv-card">
                  <div style={{ overflowX: 'auto' }}>
                    <table className="sv-table">
                      <thead>
                        <tr>
                          <th>Endpoint URL</th>
                          <th>Events</th>
                          <th>Signing Secret</th>
                          <th>Status</th>
                          <th style={{ width: 140 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? Array(2).fill(0).map((_, i) => (
                          <tr key={i}>{[150, 150, 100, 80, 80].map((w, j) => (
                            <td key={j}><div className="sv-skeleton" style={{ height: 12, width: w }} /></td>
                          ))}</tr>
                        )) : webhooks.length === 0 ? (
                          <tr><td colSpan={5}>
                            <div className="sv-empty" style={{ padding: 32 }}>
                              <Webhook style={{ width: 24, height: 24, color: 'var(--sv-text-dim)' }} />
                              <div className="sv-empty-title">No webhook subscriptions</div>
                              <div className="sv-empty-desc">Add a webhook endpoint to receive realtime capability events.</div>
                            </div>
                          </td></tr>
                        ) : webhooks.map((w, i) => {
                          const isSecretVisible = showKeys.has(w.id);
                          return (
                            <tr key={i}>
                              <td className="sv-td-primary" style={{ maxWidth: 220, wordBreak: 'break-all' }}>
                                {w.url}
                              </td>
                              <td>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, maxWidth: 200 }}>
                                  {(w.events || []).map((e: string) => (
                                    <span key={e} className="sv-badge sv-badge-zinc" style={{ fontSize: 10 }}>{e}</span>
                                  ))}
                                </div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <code className="sv-mono" style={{ color: '#94A3B8', fontSize: 10 }}>
                                    {isSecretVisible ? w.secret : `${w.secret?.slice(0, 8)}...`}
                                  </code>
                                  <button
                                    onClick={() => toggleKeyVisibility(w.id)}
                                    className="sv-btn sv-btn-ghost sv-btn-sm"
                                    style={{ padding: '2px 4px' }}
                                  >
                                    {isSecretVisible ? <EyeOff style={{ width: 11, height: 11 }} /> : <Eye style={{ width: 11, height: 11 }} />}
                                  </button>
                                </div>
                              </td>
                              <td>
                                <span className={`sv-badge ${w.status === 'active' ? 'sv-badge-green' : 'sv-badge-zinc'}`}>
                                  {w.status || 'active'}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button
                                    onClick={() => testWebhookSub(w.id)}
                                    disabled={testingWebhookId === w.id}
                                    className="sv-btn sv-btn-secondary sv-btn-sm"
                                    style={{ fontSize: 11, padding: '3px 8px' }}
                                  >
                                    {testingWebhookId === w.id ? 'Testing...' : 'Test'}
                                  </button>
                                  <button
                                    onClick={() => deleteWebhookSub(w.id)}
                                    className="sv-btn sv-btn-ghost sv-btn-sm"
                                    style={{ padding: '3px 6px', color: 'var(--sv-danger)' }}
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

            {/* Privacy tab (Phase 41) */}
            {activeTab === 'Privacy' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {privacyResult && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--sv-r)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12,
                      background: privacyResult.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${privacyResult.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      color: privacyResult.ok ? '#34D399' : '#F87171',
                    }}
                  >
                    {privacyResult.ok ? <CheckCircle2 style={{ width: 14, height: 14 }} /> : <AlertCircle style={{ width: 14, height: 14 }} />}
                    {privacyResult.msg}
                  </div>
                )}

                {/* 1. Granular Consents */}
                <div className="sv-card">
                  <div className="sv-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Shield style={{ width: 14, height: 14, color: 'var(--sv-accent)' }} />
                      <span className="sv-card-title">Granular Processing & Privacy Consents</span>
                    </div>
                    <span className="sv-badge sv-badge-zinc" style={{ fontSize: 10 }}>Notice v1.0</span>
                  </div>
                  <div style={{ padding: '0 16px' }}>
                    {[
                      { key: 'public_profile', label: 'Public Profile & DCC Indexing', desc: 'Allows your verified developer passport and skills to be publicly shareable' },
                      { key: 'service_operation', label: 'Core AST Telemetry & Skill Mapping', desc: 'Enables deterministic AST code heuristics to derive your capability tiers (Essential)' },
                      { key: 'private_repo_analysis', label: 'Private Repository Manifest Access', desc: 'Explicitly authorizes reading metadata and package manifests from private repositories' },
                      { key: 'analytics_telemetry', label: 'Anonymous Operational Telemetry', desc: 'Transmits non-identifiable latency and error metrics to improve system reliability' },
                      { key: 'marketing_updates', label: 'Platform Announcements & Newsletters', desc: 'Receive periodic emails about new verification benchmarks and platform features' },
                    ].map((ctrl, i) => {
                      const isGranted = consents[ctrl.key] !== false;
                      const isLocked = ctrl.key === 'service_operation';
                      return (
                        <div key={i} className="sv-form-row">
                          <div>
                            <div className="sv-form-row-label">{ctrl.label}</div>
                            <div className="sv-form-row-desc">{ctrl.desc}</div>
                          </div>
                          <div>
                            <div
                              onClick={() => !isLocked && handleToggleConsent(ctrl.key, isGranted)}
                              style={{
                                width: 36, height: 20, borderRadius: 10,
                                background: isGranted ? 'var(--sv-accent)' : 'var(--sv-surface-2)',
                                border: `1px solid ${isGranted ? 'var(--sv-accent)' : 'var(--sv-border)'}`,
                                position: 'relative', cursor: isLocked ? 'not-allowed' : 'pointer',
                                opacity: isLocked ? 0.7 : 1,
                              }}
                            >
                              <div style={{
                                position: 'absolute', top: 2, left: isGranted ? 17 : 2,
                                width: 14, height: 14, borderRadius: '50%', background: 'white',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                transition: 'left 0.15s ease',
                              }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Data Portability & Access (Download My Data) */}
                <div className="sv-card">
                  <div className="sv-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Download style={{ width: 14, height: 14, color: 'var(--sv-accent)' }} />
                      <span className="sv-card-title">Data Portability & GDPR / DPDP Access</span>
                    </div>
                  </div>
                  <div style={{ padding: 16 }}>
                    <p style={{ fontSize: 12, color: 'var(--sv-text-subtle)', marginBottom: 14, lineHeight: 1.6 }}>
                      Download a verified, complete JSON archive containing your full developer profile, DCC 2.0 scores, radar dimensions, verified skill evidence, and analyzed repository summaries.
                    </p>
                    <button
                      onClick={handleDownloadData}
                      disabled={exportingData}
                      className="sv-btn sv-btn-secondary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                    >
                      <Download style={{ width: 13, height: 13 }} />
                      {exportingData ? 'Compiling JSON Archive...' : 'Download My Verified Data (.json)'}
                    </button>
                  </div>
                </div>

                {/* 3. GitHub Connection Management */}
                <div className="sv-card">
                  <div className="sv-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Globe style={{ width: 14, height: 14, color: 'var(--sv-accent)' }} />
                      <span className="sv-card-title">Connected OAuth Integrations</span>
                    </div>
                  </div>
                  <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--sv-text)', marginBottom: 2 }}>
                        GitHub Account: {githubUsername ? `@${githubUsername}` : 'Not connected'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--sv-text-subtle)' }}>
                        {githubUsername ? 'Active OAuth link for repository verification and commit signature proofs.' : 'Connect GitHub in the Integrations tab to link repositories.'}
                      </div>
                    </div>
                    {githubUsername && (
                      <button
                        onClick={handleDisconnectGithub}
                        disabled={disconnectingGithub}
                        className="sv-btn sv-btn-ghost sv-btn-danger"
                        style={{ fontSize: 12 }}
                      >
                        {disconnectingGithub ? 'Disconnecting...' : 'Disconnect GitHub'}
                      </button>
                    )}
                  </div>
                </div>

                {/* 4. Legal & Compliance Quick-Links */}
                <div className="sv-card">
                  <div className="sv-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText style={{ width: 14, height: 14, color: 'var(--sv-accent)' }} />
                      <span className="sv-card-title">Legal & Compliance Documentation</span>
                    </div>
                  </div>
                  <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                    {[
                      { title: 'Privacy Policy', path: '/privacy', icon: Shield },
                      { title: 'Terms of Service', path: '/terms', icon: Scale },
                      { title: 'Cookie Policy', path: '/cookies', icon: Cookie },
                      { title: 'Privacy Request Portal', path: '/contact/privacy', icon: UserCheck },
                    ].map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={i}
                          href={item.path}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 'var(--sv-r)',
                            background: 'var(--sv-surface-2)',
                            border: '1px solid var(--sv-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            textDecoration: 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Icon style={{ width: 13, height: 13, color: 'var(--sv-accent)' }} />
                            <span style={{ fontSize: 12, color: 'var(--sv-text)', fontWeight: 500 }}>{item.title}</span>
                          </div>
                          <ArrowRight style={{ width: 12, height: 12, color: 'var(--sv-text-dim)' }} />
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Danger Zone (Account Anonymization & Deletion) */}
                <div className="sv-card" style={{ borderColor: 'rgba(239,68,68,0.25)' }}>
                  <div className="sv-card-header" style={{ background: 'rgba(239,68,68,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle style={{ width: 14, height: 14, color: '#EF4444' }} />
                      <span className="sv-card-title" style={{ color: '#F87171' }}>Danger Zone: Account Erasure & Anonymization</span>
                    </div>
                  </div>
                  <div style={{ padding: 16 }}>
                    <p style={{ fontSize: 12, color: 'var(--sv-text-subtle)', marginBottom: 14, lineHeight: 1.6 }}>
                      Permanently anonymizes your personal identification (email, name, website, tokens) and deletes active API keys. Historical cryptographic hashes are preserved to prevent tampering with team and challenge leaderboards.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360 }}>
                      <label style={{ fontSize: 11, color: 'var(--sv-text-dim)' }}>
                        Type <code style={{ color: '#F87171', fontWeight: 600 }}>DELETE_MY_ACCOUNT</code> to confirm:
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="DELETE_MY_ACCOUNT"
                        className="sv-input"
                        style={{ fontSize: 12 }}
                      />
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deletingAccount || deleteConfirmText !== 'DELETE_MY_ACCOUNT'}
                        className="sv-btn sv-btn-ghost sv-btn-danger"
                        style={{ fontSize: 12, opacity: deleteConfirmText === 'DELETE_MY_ACCOUNT' ? 1 : 0.5 }}
                      >
                        {deletingAccount ? 'Anonymizing Account...' : 'Permanently Delete & Anonymize Account'}
                      </button>
                    </div>
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
