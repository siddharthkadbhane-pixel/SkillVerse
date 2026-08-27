'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import PageHeader from '@/components/ui/PageHeader';
import {
  Users,
  Plus,
  ShieldCheck,
  Mail,
  MoreVertical,
  UserCheck,
  CheckCircle2,
  X,
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Recruiter' | 'Hiring Manager' | 'Interviewer' | 'Viewer';
  avatarUrl: string;
  status: 'Active' | 'Pending';
  lastActive: string;
}

const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'm_1',
    name: 'Marcus Vance',
    email: 'marcus@hyperion.ai',
    role: 'Owner',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    status: 'Active',
    lastActive: 'Just now',
  },
  {
    id: 'm_2',
    name: 'Emily Watson',
    email: 'emily.watson@hyperion.ai',
    role: 'Recruiter',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    status: 'Active',
    lastActive: '2h ago',
  },
  {
    id: 'm_3',
    name: 'Jason Bourne',
    email: 'jason@hyperion.ai',
    role: 'Hiring Manager',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    status: 'Active',
    lastActive: '1d ago',
  },
  {
    id: 'm_4',
    name: 'Sophia Loren',
    email: 'sophia@hyperion.ai',
    role: 'Interviewer',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    status: 'Active',
    lastActive: '3d ago',
  },
];

export default function CompanyTeamPage() {
  const [profile, setProfile] = useState<any>(null);
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('Recruiter');

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data.profile);
      })
      .catch(() => {});
  }, []);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const newMember: TeamMember = {
      id: `m_${Date.now()}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
      status: 'Pending',
      lastActive: 'Invited',
    };

    setTeam([...team, newMember]);
    setInviteEmail('');
    setShowInviteModal(false);
  };

  const getRoleBadge = (role: TeamMember['role']) => {
    switch (role) {
      case 'Owner':
        return 'bg-[#7C3AED]/20 text-[#C4B5FD] border-[#7C3AED]/40';
      case 'Admin':
        return 'bg-[#06B6D4]/20 text-[#67E8F9] border-[#06B6D4]/40';
      case 'Recruiter':
        return 'bg-[#F59E0B]/20 text-[#FBBF24] border-[#F59E0B]/40';
      default:
        return 'bg-white/[0.06] text-[#94A3B8] border-white/[0.10]';
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="Team Management" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-6">
          <PageHeader
            title="Team & Permissions"
            description="Manage company workspace members, technical recruiters, and interviewer access."
            badge={{ text: `${team.length} Members`, variant: 'cyan' }}
          >
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Invite Team Member
            </button>
          </PageHeader>

          {/* Members Table Card */}
          <div className="bg-[#0D121A] border border-white/[0.08] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-[#111722] text-[#64748B] font-mono text-[11px] uppercase">
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Last Active</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {team.map((member) => (
                    <tr key={member.id} className="hover:bg-[#111722]/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.avatarUrl}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-white/10"
                          />
                          <div>
                            <span className="font-semibold text-xs text-[#F8FAFC] block">
                              {member.name}
                            </span>
                            <span className="text-[11px] font-mono text-[#64748B]">
                              {member.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getRoleBadge(
                            member.role
                          )}`}
                        >
                          {member.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            member.status === 'Active' ? 'text-[#10B981]' : 'text-[#F59E0B]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              member.status === 'Active' ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
                            }`}
                          />
                          {member.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[#64748B]">
                        {member.lastActive}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button className="text-xs font-semibold text-[#64748B] hover:text-white transition-colors">
                          Edit Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invite Modal */}
          {showInviteModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <form
                onSubmit={handleInvite}
                className="bg-[#0D121A] border border-white/[0.12] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative"
              >
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="absolute right-4 top-4 p-1.5 rounded-lg text-[#64748B] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
                  <Mail className="w-5 h-5 text-[#7C3AED]" />
                  <h2 className="text-base font-bold text-[#F8FAFC]">Invite Team Member</h2>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[#94A3B8] font-medium mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="teammate@hyperion.ai"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full bg-[#111722] border border-white/[0.08] focus:border-[#7C3AED]/50 rounded-lg px-3 py-2 text-[#F8FAFC] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#94A3B8] font-medium mb-1">Role & Permissions</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      className="w-full bg-[#111722] border border-white/[0.08] focus:border-[#7C3AED]/50 rounded-lg px-3 py-2 text-[#F8FAFC] outline-none"
                    >
                      <option value="Recruiter">Recruiter (Search & Shortlist)</option>
                      <option value="Hiring Manager">Hiring Manager (Pipeline & Offers)</option>
                      <option value="Interviewer">Interviewer (Candidate Reviews)</option>
                      <option value="Admin">Admin (Full Team Access)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#111722] hover:bg-[#151B26] border border-white/[0.08] text-[#94A3B8]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#7C3AED] hover:bg-[#8B5CF6] text-white"
                  >
                    Send Invitation
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
