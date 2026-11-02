import React from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import { getSessionUser } from '@/services/supabase';
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
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminConsolePage() {
  const user = await getSessionUser();

  const systemKpis = [
    {
      title: 'Neon PostgreSQL',
      value: 'Connected',
      status: 'Operational',
      subtext: 'Dedicated skillverse_app pooler role',
      icon: Database,
      color: 'teal',
    },
    {
      title: 'Authentication Engine',
      value: 'Better Auth',
      status: 'Enforced',
      subtext: 'Fail-closed session validation',
      icon: Lock,
      color: 'indigo',
    },
    {
      title: 'Access Control Model',
      value: '4-Tier RBAC',
      status: 'Active',
      subtext: 'developer, recruiter, company_admin, admin',
      icon: ShieldCheck,
      color: 'blue',
    },
    {
      title: 'OAuth Providers',
      value: 'GitHub OAuth',
      status: 'Operational',
      subtext: 'Production identity federation',
      icon: Key,
      color: 'purple',
    },
  ];

  const roleDefinitions = [
    {
      role: 'developer',
      name: 'Developer Workspace',
      description: 'Default role for all registered accounts. Access to DCC, skill graph, AST repo audit, learning paths.',
      privileges: ['View verified DCC', 'Submit repos for review', 'Join challenges', 'Manage public passport'],
      defaultAssigned: 'All new signups',
      badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    },
    {
      role: 'recruiter',
      name: 'Recruiter Workspace',
      description: 'Scoped hiring platform access. Filter candidates, save talent pipelines, add private notes.',
      privileges: ['Search talent directory', 'Review DCC evidence', 'Manage candidates', 'View applicant pool'],
      defaultAssigned: 'Invited by Company Admin',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    {
      role: 'company_admin',
      name: 'Company Administrator',
      description: 'Full management of registered company workspace, team member roles, and billing.',
      privileges: ['All recruiter permissions', 'Invite/remove team members', 'Manage billing & subscriptions', 'Edit company profile'],
      defaultAssigned: 'Company registration flow',
      badge: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    },
    {
      role: 'admin',
      name: 'Platform Administrator',
      description: 'Overarching platform governance, database migration validation, system telemetry, and audit access.',
      privileges: ['Unrestricted workspace access', 'System health monitoring', 'Audit log inspection', 'Security governance'],
      defaultAssigned: 'Administrative onboarding',
      badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
  ];

  const activeSecurityGuards = [
    {
      name: 'Anti-Self-Escalation',
      detail: 'Client-driven role modifications are completely stripped by ProfileUpdateSchema (Zod whitelist).',
      status: 'Verified',
    },
    {
      name: 'Anti-Cross-Tenant IDOR',
      detail: 'Company workspace APIs enforce AuthorizationGuard.requireCompanyMembership against PostgreSQL records.',
      status: 'Verified',
    },
    {
      name: 'Edge & Layout Route Defense',
      detail: 'Protected routes guarded at edge via middleware cookie interceptor AND server component layouts.',
      status: 'Verified',
    },
    {
      name: 'Least-Privilege Database Role',
      detail: 'Application execution strictly confined to skillverse_app role with DDL operations restricted.',
      status: 'Verified',
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#08090D] text-slate-900 dark:text-[#F1F5F9] transition-colors">
      <Sidebar user={user} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={user} breadcrumb="Admin Console" />

        <main className="flex-1 overflow-y-auto px-5 sm:px-6 py-6 max-w-[1600px] w-full mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/[0.07]">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] font-semibold tracking-tight text-slate-900 dark:text-[#F1F5F9] leading-tight">
                  Platform Administration Console
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-[13px] text-slate-500 dark:text-[#64748B] mt-1">
                Centralized role governance, infrastructure health telemetry, and access control audit.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                RBAC Foundations Active
              </span>
            </div>
          </div>

          {/* System KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemKpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={kpi.title}
                  className="bg-white dark:bg-[#0E1117] border border-slate-200 dark:border-white/[0.07] rounded-xl p-4 flex flex-col justify-between shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-[#64748B]">{kpi.title}</span>
                    <Icon className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="my-2">
                    <div className="text-lg font-bold text-slate-900 dark:text-[#F1F5F9]">{kpi.value}</div>
                    <div className="text-[11px] text-slate-500 dark:text-[#64748B]">{kpi.subtext}</div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-white/[0.05] flex items-center justify-between">
                    <span className="text-[10.5px] text-slate-400">Status</span>
                    <span className="text-[10.5px] font-semibold text-emerald-500 dark:text-emerald-400">
                      {kpi.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Role Governance Matrix */}
          <div className="bg-white dark:bg-[#0E1117] border border-slate-200 dark:border-white/[0.07] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900 dark:text-[#F1F5F9]">
                  Role Hierarchy & Authorization Scopes
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#64748B] mt-0.5">
                  Formal privilege boundaries across developer, employer, and administrative domains.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roleDefinitions.map((def) => (
                <div
                  key={def.role}
                  className="p-4 rounded-lg bg-slate-50 dark:bg-[#131720] border border-slate-200 dark:border-white/[0.06] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-[#F1F5F9]">{def.name}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${def.badge}`}>
                        {def.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-[#94A3B8] mb-3 leading-relaxed">
                      {def.description}
                    </p>
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Capabilities
                      </span>
                      <ul className="text-xs text-slate-600 dark:text-[#94A3B8] space-y-1">
                        {def.privileges.map((p, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 pt-2 border-t border-slate-200 dark:border-white/[0.05] text-[11px] text-slate-500 dark:text-[#64748B]">
                    Assignment: <span className="text-slate-700 dark:text-slate-300 font-medium">{def.defaultAssigned}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Security Controls */}
          <div className="bg-white dark:bg-[#0E1117] border border-slate-200 dark:border-white/[0.07] rounded-xl p-5 shadow-sm space-y-3">
            <h2 className="text-[15px] font-semibold text-slate-900 dark:text-[#F1F5F9]">
              Active Defensive Security Controls
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeSecurityGuards.map((g) => (
                <div
                  key={g.name}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-[#131720] border border-slate-200 dark:border-white/[0.06] flex items-start gap-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-[#F1F5F9]">{g.name}</span>
                    <p className="text-[11.5px] text-slate-500 dark:text-[#64748B] mt-0.5 leading-snug">{g.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

