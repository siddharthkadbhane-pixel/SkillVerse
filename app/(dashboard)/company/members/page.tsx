'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Trash2,
  Mail,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { CompanyMember, CompanyRole } from '@/types/company';

export default function CompanyMembersPage() {
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<CompanyRole>('recruiter');
  const [inviting, setInviting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function loadMembers() {
    try {
      const res = await fetch('/api/company/members').then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        setMembers(res.data);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch('/api/company/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      }).then(r => r.json());

      if (res.success && res.member) {
        setMembers(prev => [...prev, res.member]);
        setIsInviteModalOpen(false);
        setInviteEmail('');
        setFeedback('Invitation sent successfully.');
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err) {
      console.error('Failed to invite member:', err);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await fetch(`/api/company/members?memberId=${memberId}`, { method: 'DELETE' });
      setMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#08090D] text-slate-900 dark:text-[#F1F5F9] transition-colors">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-6 max-w-[1200px] w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-500 dark:text-[#38BDF8]" />
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Team Members & Permissions
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#111722] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-white/[0.06]">
                  {members.length} Members
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-1">
                Manage recruiters and company admins authorized to search candidates and create private evaluation notes.
              </p>
            </div>

            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-semibold shadow-lg shadow-[#6366F1]/25 transition-all self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Team Member</span>
            </button>
          </div>

          {feedback && (
            <div className="p-3.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 text-xs text-[#10B981] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Members Table */}
          <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Authorized Workspace Members
              </h3>
              <span className="text-xs text-slate-500 dark:text-[#64748B]">
                Role-based Access Control Active
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500 dark:text-[#64748B]">
                Loading team members...
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-white/[0.01] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={m.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                        alt={m.user.name || m.user.username}
                        className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/[0.1] shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {m.user.name || m.user.username}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-100 dark:bg-[#111722] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-white/[0.06]">
                            @{m.user.username}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-[#64748B]">{m.user.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border ${
                        m.role === 'company_admin'
                          ? 'bg-[#6366F1]/15 text-[#6366F1] dark:text-[#C4B5FD] border-[#6366F1]/25'
                          : 'bg-sky-500/10 text-sky-600 dark:text-[#38BDF8] border-sky-500/20'
                      }`}>
                        {m.role === 'company_admin' ? 'Company Admin' : 'Recruiter'}
                      </span>

                      <span className="text-xs text-slate-500 dark:text-[#64748B] font-mono hidden md:block">
                        Joined {new Date(m.joinedAt).toLocaleDateString()}
                      </span>

                      {m.role !== 'company_admin' && (
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invite Modal */}
          {isInviteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.1] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-[#6366F1]" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Invite Team Recruiter</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:border-[#6366F1]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] block mb-1">
                      Workspace Role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as CompanyRole)}
                      className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6366F1]"
                    >
                      <option value="recruiter">Recruiter (Search, Save & Note)</option>
                      <option value="company_admin">Company Admin (Full Workspace Access)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsInviteModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInvite}
                    disabled={inviting || !inviteEmail.trim()}
                    className="px-4 py-2 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-md shadow-[#6366F1]/20"
                  >
                    {inviting ? 'Inviting...' : 'Send Invitation'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
