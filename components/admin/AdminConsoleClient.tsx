'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Database, 
  Lock, 
  Key, 
  CheckCircle2, 
  Activity, 
  FileText, 
  Building2, 
  Server, 
  AlertTriangle, 
  Search, 
  Filter, 
  RefreshCw, 
  MoreVertical, 
  UserCheck, 
  UserX, 
  ShieldAlert, 
  Sliders, 
  Loader2, 
  Check, 
  X, 
  ExternalLink 
} from 'lucide-react';

interface UserItem {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl?: string;
  role: 'developer' | 'recruiter' | 'company_admin' | 'admin';
  status: 'active' | 'suspended';
  companyId?: string;
  emailVerified: boolean;
  createdAt: string;
}

interface CompanyItem {
  id: string;
  name: string;
  logoUrl?: string;
  website?: string;
  description?: string;
  verified: boolean;
  createdAt: string;
  memberCount: number;
}

interface AuditLogItem {
  id: string;
  actorId?: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  details?: any;
  createdAt: string;
}

interface AdminConsoleProps {
  currentUser: {
    id: string;
    email?: string | null;
    name?: string | null;
    role: string;
  };
}

export default function AdminConsoleClient({ currentUser }: AdminConsoleProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'companies' | 'audit' | 'health' | 'settings'>('overview');

  // Users Tab State
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Companies Tab State
  const [companiesList, setCompaniesList] = useState<CompanyItem[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companySearch, setCompanySearch] = useState('');

  // Audit Logs State
  const [auditLogsList, setAuditLogsList] = useState<AuditLogItem[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState('');

  // Settings State
  const [settings, setSettings] = useState({
    registrationOpen: true,
    maintenanceMode: false,
    mfaRequiredForAdmin: false,
    rateLimitingEnabled: true,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Modals State
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState<'developer' | 'recruiter' | 'company_admin' | 'admin'>('developer');
  const [roleReason, setRoleReason] = useState('');
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // MFA State
  const [mfaModalOpen, setMfaModalOpen] = useState(false);
  const [mfaData, setMfaData] = useState<{ secret: string; totpURI: string; backupCodes: string[] } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaSuccess, setMfaSuccess] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);

  const handleOpenMfaModal = async () => {
    setMfaModalOpen(true);
    setMfaLoading(true);
    setMfaError(null);
    setMfaSuccess(false);
    setMfaCode('');
    try {
      const res = await fetch('/api/admin/mfa/enroll', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data) {
        setMfaData(data.data);
      } else {
        setMfaError(data.error || 'Failed to initiate MFA enrollment.');
      }
    } catch (err: any) {
      setMfaError(err.message);
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaCode.trim()) return;
    setMfaLoading(true);
    setMfaError(null);
    try {
      const res = await fetch('/api/admin/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: mfaCode.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setMfaSuccess(true);
      } else {
        setMfaError(data.message || data.error || 'Invalid verification code.');
      }
    } catch (err: any) {
      setMfaError(err.message);
    } finally {
      setMfaLoading(false);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(userPage));
      params.set('limit', '15');

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setUsersList(data.data.users || []);
        setTotalUsers(data.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch Companies
  const fetchCompanies = async () => {
    setCompaniesLoading(true);
    try {
      const params = new URLSearchParams();
      if (companySearch) params.set('q', companySearch);
      params.set('limit', '20');

      const res = await fetch(`/api/admin/companies?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setCompaniesList(data.data.companies || []);
      }
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setCompaniesLoading(false);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams();
      if (auditActionFilter) params.set('action', auditActionFilter);
      params.set('limit', '30');

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.data) {
        setAuditLogsList(data.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  // Fetch Settings
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success && data.data) {
        setSettings(data.data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  // Trigger data fetches based on active tab
  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'companies') fetchCompanies();
    if (activeTab === 'audit') fetchAuditLogs();
    if (activeTab === 'settings') fetchSettings();
  }, [activeTab, userPage, roleFilter, statusFilter, auditActionFilter]);

  // Handle Role Change
  const handleRoleChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setModalLoading(true);
    setModalMessage(null);

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole, reason: roleReason }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to update user role.');
      }

      setModalMessage({ type: 'success', text: `User role successfully changed to ${newRole}.` });
      setTimeout(() => {
        setRoleModalOpen(false);
        setSelectedUser(null);
        setRoleReason('');
        setModalMessage(null);
        fetchUsers();
      }, 1200);
    } catch (err: any) {
      setModalMessage({ type: 'error', text: err.message });
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Status Toggle (Suspend / Reactivate)
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setModalLoading(true);
    setModalMessage(null);

    const targetStatus = selectedUser.status === 'active' ? 'suspended' : 'active';

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus, reason: statusReason }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to update account status.');
      }

      setModalMessage({
        type: 'success',
        text: `Account successfully ${targetStatus === 'suspended' ? 'suspended' : 'reactivated'}.`,
      });
      setTimeout(() => {
        setStatusModalOpen(false);
        setSelectedUser(null);
        setStatusReason('');
        setModalMessage(null);
        fetchUsers();
      }, 1200);
    } catch (err: any) {
      setModalMessage({ type: 'error', text: err.message });
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Settings Save
  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2500);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-white/[0.08] overflow-x-auto pb-px">
        {[
          { id: 'overview', label: 'Platform Overview', icon: Activity },
          { id: 'users', label: 'User & Role Management', icon: Users },
          { id: 'companies', label: 'Companies & Workspaces', icon: Building2 },
          { id: 'audit', label: 'Security & Audit Logs', icon: FileText },
          { id: 'health', label: 'System Health', icon: Server },
          { id: 'settings', label: 'Platform Settings', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap border-b-2 -mb-px ${
                isActive
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-500/[0.04]'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-[#F1F5F9]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#10131B] p-4.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Database Engine</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Operational
                </span>
              </div>
              <div className="text-xl font-bold">Neon Serverless</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Dedicated pooler role with SSL</p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#10131B] p-4.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Authentication</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  <Lock className="w-3 h-3" /> Enforced
                </span>
              </div>
              <div className="text-xl font-bold">Better Auth</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Fail-closed session cookies</p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#10131B] p-4.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Access Control</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <ShieldCheck className="w-3 h-3" /> 4-Tier
                </span>
              </div>
              <div className="text-xl font-bold">RBAC Architecture</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">developer, recruiter, company_admin, admin</p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#10131B] p-4.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Identity Federation</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-purple-500/10 text-purple-500 border border-purple-500/20">
                  <Key className="w-3 h-3" /> Active
                </span>
              </div>
              <div className="text-xl font-bold">Google & GitHub</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Trusted account linking enabled</p>
            </div>
          </div>

          {/* Role Architecture Blueprint */}
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#10131B] p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-[#F1F5F9]">
              Role Architecture & Authority Boundaries
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.03] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">developer</span>
                  <span className="text-[10.5px] text-slate-400">Default Role</span>
                </div>
                <h3 className="text-sm font-semibold">Developer Workspace</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Default persona for all registered users. Access to AST code reviews, DCC credentials, skill graph, and learning challenges.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/[0.03] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">recruiter</span>
                  <span className="text-[10.5px] text-slate-400">Tenant Scoped</span>
                </div>
                <h3 className="text-sm font-semibold">Recruiter Workspace</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Talent directory search, candidate comparison matrices, DCC verification evidence, and applicant pipelines. Read-only on team & billing.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-teal-500/20 bg-teal-500/[0.03] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-500 uppercase tracking-wider">company_admin</span>
                  <span className="text-[10.5px] text-slate-400">Organization</span>
                </div>
                <h3 className="text-sm font-semibold">Company Admin</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Full control over company hiring workspace. Invite and manage team recruiters, edit company branding, and manage subscription billing.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/[0.03] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">admin</span>
                  <span className="text-[10.5px] text-purple-400">Super Admin</span>
                </div>
                <h3 className="text-sm font-semibold">Platform Governance</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Unrestricted cross-tenant visibility, user management, global role assignment, account suspension, audit logs, and platform settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER & ROLE MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#10131B] p-3.5 rounded-xl border border-slate-200 dark:border-white/[0.08]">
            <div className="flex flex-1 items-center gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#08090D] text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <button
                onClick={fetchUsers}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-xs font-medium transition-colors"
              >
                Search
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#08090D] text-xs focus:outline-none"
              >
                <option value="">All Roles</option>
                <option value="developer">Developer</option>
                <option value="recruiter">Recruiter</option>
                <option value="company_admin">Company Admin</option>
                <option value="admin">Platform Admin</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#08090D] text-xs focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>

              <button
                onClick={fetchUsers}
                title="Refresh"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500"
              >
                <RefreshCw className={`w-4 h-4 ${usersLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#10131B] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Email Verified</th>
                    <th className="px-4 py-3">Registered</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                  {usersLoading && usersList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-500" />
                        <span>Loading registered users...</span>
                      </td>
                    </tr>
                  ) : usersList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No registered users match your query.
                      </td>
                    </tr>
                  ) : (
                    usersList.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                                {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="block font-medium text-slate-900 dark:text-[#F1F5F9] truncate leading-tight">
                                {user.name} {user.id === currentUser.id && <span className="text-[10px] text-purple-400">(You)</span>}
                              </span>
                              <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate leading-tight">
                                {user.email} · @{user.username}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            user.role === 'admin'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : user.role === 'company_admin'
                              ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                              : user.role === 'recruiter'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          }`}>
                            {user.role}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                            user.status === 'suspended'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {user.status === 'suspended' ? 'Suspended' : 'Active'}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {user.emailVerified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-500 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">Unverified</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setNewRole(user.role);
                                setRoleModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300 transition-colors"
                            >
                              Edit Role
                            </button>

                            {user.id !== currentUser.id && (
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setStatusModalOpen(true);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                  user.status === 'suspended'
                                    ? 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                                    : 'border-red-500/20 text-red-400 hover:bg-red-500/10'
                                }`}
                              >
                                {user.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Showing {usersList.length} of {totalUsers} total users</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={userPage <= 1}
                  onClick={() => setUserPage(p => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/[0.08] disabled:opacity-40"
                >
                  Previous
                </button>
                <span>Page {userPage}</span>
                <button
                  disabled={usersList.length < 15}
                  onClick={() => setUserPage(p => p + 1)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/[0.08] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMPANIES & WORKSPACES */}
      {activeTab === 'companies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-[#10131B] p-3.5 rounded-xl border border-slate-200 dark:border-white/[0.08]">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search registered companies..."
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCompanies()}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#08090D] text-xs sm:text-sm focus:outline-none"
              />
            </div>
            <button
              onClick={fetchCompanies}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500"
            >
              <RefreshCw className={`w-4 h-4 ${companiesLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companiesLoading && companiesList.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-500" />
                <span>Loading registered companies...</span>
              </div>
            ) : companiesList.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-500">
                No company workspaces registered yet.
              </div>
            ) : (
              companiesList.map((company) => (
                <div
                  key={company.id}
                  className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#10131B] p-4.5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {company.logoUrl ? (
                        <img src={company.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-sm">
                          {company.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-[#F1F5F9] truncate">{company.name}</h4>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {company.memberCount} team member(s)
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold border ${
                      company.verified
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {company.verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>

                  {company.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {company.description}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                    <span>Registered {new Date(company.createdAt).toLocaleDateString()}</span>
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
                      >
                        <span>Website</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY & AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-[#10131B] p-3.5 rounded-xl border border-slate-200 dark:border-white/[0.08]">
            <select
              value={auditActionFilter}
              onChange={(e) => setAuditActionFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#08090D] text-xs focus:outline-none"
            >
              <option value="">All Security Events</option>
              <option value="USER_ROLE_UPDATED">Role Changes</option>
              <option value="ADMIN_PROMOTED">Admin Promotions</option>
              <option value="ADMIN_DEMOTED">Admin Demotions</option>
              <option value="USER_SUSPENDED">Account Suspensions</option>
              <option value="USER_REACTIVATED">Account Reactivations</option>
              <option value="SUPER_ADMIN_BOOTSTRAP">Bootstrap Events</option>
              <option value="PLATFORM_SETTINGS_UPDATED">Settings Changes</option>
            </select>

            <button
              onClick={fetchAuditLogs}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500"
            >
              <RefreshCw className={`w-4 h-4 ${auditLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#10131B] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Target Resource</th>
                    <th className="px-4 py-3">Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                  {auditLoading && auditLogsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-500" />
                        <span>Loading audit logs...</span>
                      </td>
                    </tr>
                  ) : auditLogsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No audit events recorded matching criteria.
                      </td>
                    </tr>
                  ) : (
                    auditLogsList.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{log.actorRole}</span>
                          {log.actorId && <span className="text-slate-500 block font-mono text-[10px]">{log.actorId.slice(0, 8)}...</span>}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{log.resourceType}</span>
                          {log.resourceId && <span className="text-slate-500 block font-mono text-[10px]">{log.resourceId.slice(0, 8)}...</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate font-mono text-[11px]">
                          {log.details ? JSON.stringify(log.details) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SYSTEM HEALTH */}
      {activeTab === 'health' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#10131B] p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-[#F1F5F9]">Security Policy Enforcement State</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span>Anti-Self-Escalation</span>
                  <span className="text-emerald-500 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Enforced</span>
                </div>
                <p className="text-slate-500 text-[11.5px]">Profile update schemas strictly whitelist scalar fields and strip role mutation attempts.</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span>Cross-Tenant IDOR Guard</span>
                  <span className="text-emerald-500 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Enforced</span>
                </div>
                <p className="text-slate-500 text-[11.5px]">Company APIs validate company_members membership against target companyId before resolving queries.</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span>Active Session Invalidation</span>
                  <span className="text-emerald-500 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Enforced</span>
                </div>
                <p className="text-slate-500 text-[11.5px]">Security-sensitive role demotions and account suspensions immediately purge active session tokens.</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span>Anti-Lockout Rule</span>
                  <span className="text-emerald-500 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Enforced</span>
                </div>
                <p className="text-slate-500 text-[11.5px]">Administrators cannot revoke their own admin role or suspend their own user account.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PLATFORM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#10131B] p-6 space-y-6 max-w-2xl">
          <div className="border-b border-slate-100 dark:border-white/[0.06] pb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-[#F1F5F9]">Platform Configuration Controls</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Updates to platform-wide settings are recorded in the security audit log.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
              <div>
                <span className="font-semibold text-xs sm:text-sm block">Public User Registration</span>
                <span className="text-xs text-slate-500">Allow incoming new users to register accounts via OAuth.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.registrationOpen}
                onChange={(e) => setSettings({ ...settings, registrationOpen: e.target.checked })}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
              <div>
                <span className="font-semibold text-xs sm:text-sm block">Platform Maintenance Mode</span>
                <span className="text-xs text-slate-500">Restrict access to Super Administrators during system upgrades.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
              <div>
                <span className="font-semibold text-xs sm:text-sm block">Enforce Admin MFA / 2FA</span>
                <span className="text-xs text-slate-500">Require multi-factor authentication for Super Admin console access.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.mfaRequiredForAdmin}
                onChange={(e) => setSettings({ ...settings, mfaRequiredForAdmin: e.target.checked })}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/[0.03]">
              <div>
                <span className="font-semibold text-xs sm:text-sm block text-purple-400">Authenticator App (TOTP) Enrollment</span>
                <span className="text-xs text-slate-500">Configure Google Authenticator, 1Password, or Authy for your Super Admin account.</span>
              </div>
              <button
                type="button"
                onClick={handleOpenMfaModal}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors shrink-0 ml-2"
              >
                Configure MFA
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {settingsSaved ? (
              <span className="text-xs text-emerald-500 flex items-center gap-1 font-medium">
                <Check className="w-4 h-4" /> Platform settings saved successfully.
              </span>
            ) : <div />}

            <button
              onClick={handleSaveSettings}
              disabled={settingsLoading}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs sm:text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {settingsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>Save Configuration</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: EDIT ROLE */}
      {roleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#10131B] rounded-2xl border border-slate-200 dark:border-white/[0.1] max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
              <h3 className="font-bold text-base">Modify User Role</h3>
              <button onClick={() => setRoleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-1 text-slate-500">
              <div>Target: <strong className="text-slate-900 dark:text-[#F1F5F9]">{selectedUser.name}</strong> ({selectedUser.email})</div>
              <div>Current Role: <span className="font-mono text-purple-400 font-semibold">{selectedUser.role}</span></div>
            </div>

            {modalMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                modalMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}>
                {modalMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{modalMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleRoleChangeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">New Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#08090D] text-xs sm:text-sm focus:outline-none"
                >
                  <option value="developer">developer (Standard Developer)</option>
                  <option value="recruiter">recruiter (Hiring Workspace)</option>
                  <option value="company_admin">company_admin (Company Administrator)</option>
                  <option value="admin">admin (Platform Super Admin)</option>
                </select>
              </div>

              {newRole === 'admin' && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" /> Warning: Super Admin Privilege
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Granting Platform Admin gives full unrestricted access across all users, companies, and system telemetry.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Promoted to lead technical recruiter"
                  value={roleReason}
                  onChange={(e) => setRoleReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#08090D] text-xs sm:text-sm focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRoleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 disabled:opacity-50"
                >
                  {modalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Role Change</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SUSPEND / REACTIVATE */}
      {statusModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#10131B] rounded-2xl border border-slate-200 dark:border-white/[0.1] max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
              <h3 className="font-bold text-base">
                {selectedUser.status === 'active' ? 'Suspend User Account' : 'Reactivate User Account'}
              </h3>
              <button onClick={() => setStatusModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-1 text-slate-500">
              <div>Target: <strong className="text-slate-900 dark:text-[#F1F5F9]">{selectedUser.name}</strong> ({selectedUser.email})</div>
              <div>Current Status: <span className="font-semibold">{selectedUser.status}</span></div>
            </div>

            {modalMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                modalMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}>
                {modalMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{modalMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              {selectedUser.status === 'active' && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <UserX className="w-4 h-4" /> Security Action: Immediate Revocation
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Suspending this account will immediately revoke all active browser sessions and prevent further API or web access.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1">Reason</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Terms of service violation / investigation"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#08090D] text-xs sm:text-sm focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className={`px-4 py-2 rounded-xl text-xs font-medium text-white flex items-center gap-2 disabled:opacity-50 ${
                    selectedUser.status === 'active'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {modalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{selectedUser.status === 'active' ? 'Confirm Suspension' : 'Confirm Reactivation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: MFA SETUP */}
      {mfaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#10131B] rounded-2xl border border-slate-200 dark:border-white/[0.1] max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
              <h3 className="font-bold text-base">Multi-Factor Authentication (TOTP) Setup</h3>
              <button onClick={() => setMfaModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {mfaError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{mfaError}</span>
              </div>
            )}

            {mfaSuccess ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-slate-900 dark:text-[#F1F5F9]">MFA Successfully Configured!</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Your administrator account is now protected with time-based one-time passwords (TOTP).
                </p>

                {mfaData?.backupCodes && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#08090D] border border-slate-200 dark:border-white/[0.1] text-left space-y-2">
                    <span className="font-bold text-xs uppercase tracking-wider block text-slate-700 dark:text-slate-300">
                      Recovery Backup Codes (Save Now)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Store these single-use codes safely. If you lose your authenticator device, each code can be used once to access the admin console.
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-xs text-purple-400 pt-1">
                      {mfaData.backupCodes.map((code, idx) => (
                        <div key={idx} className="p-1.5 bg-white dark:bg-[#10131B] rounded border border-slate-200 dark:border-white/[0.06] text-center">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setMfaModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs transition-colors"
                >
                  Close & Done
                </button>
              </div>
            ) : mfaLoading && !mfaData ? (
              <div className="py-8 text-center text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-500" />
                <span>Generating secure TOTP secret...</span>
              </div>
            ) : (
              <form onSubmit={handleVerifyMfa} className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider block">1. Add to Authenticator App</span>
                  <p className="text-xs text-slate-500">
                    Open your authenticator app (Google Authenticator, 1Password, Authy) and enter this secret key:
                  </p>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#08090D] border border-slate-200 dark:border-white/[0.1] font-mono text-xs text-purple-400 font-bold select-all break-all text-center">
                    {mfaData?.secret}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider block">2. Enter 6-digit Code to Confirm</span>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 123456"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-widest font-mono text-lg py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#08090D] focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMfaModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={mfaLoading || mfaCode.length !== 6}
                    className="px-5 py-2 rounded-xl text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 disabled:opacity-50"
                  >
                    {mfaLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Verify & Activate MFA</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
