'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Dna,
  Code2,
  FolderGit2,
  Github,
  Activity,
  Trophy,
  Users,
  UserCheck,
  User,
  Search,
  Bookmark,
  Briefcase,
  GitPullRequest,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowLeftRight,
  Compass,
  MessageSquare,
} from 'lucide-react';
import { DUMMY_USERS } from '@/lib/dummyData';

interface SidebarProps {
  trustScore?: { overallScore: number } | null;
  user?: { name?: string; username?: string; avatarUrl?: string; role?: string } | null;
}

export default function Sidebar({ trustScore, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [activeUser, setActiveUser] = useState(DUMMY_USERS[0]);

  const isCompanyPath = pathname?.startsWith('/company');
  const isRecruiterOrAdmin = activeUser.role === 'recruiter' || activeUser.role === 'admin';
  const isCompanyMode =
    isCompanyPath ||
    (isRecruiterOrAdmin &&
      !pathname?.startsWith('/overview') &&
      !pathname?.startsWith('/skill-dna') &&
      !pathname?.startsWith('/skills') &&
      !pathname?.startsWith('/projects') &&
      !pathname?.startsWith('/github') &&
      !pathname?.startsWith('/activity') &&
      !pathname?.startsWith('/network') &&
      !pathname?.startsWith('/challenges') &&
      !pathname?.startsWith('/community') &&
      !pathname?.startsWith('/career') &&
      !pathname?.startsWith('/profile') &&
      !pathname?.startsWith('/developers') &&
      !pathname?.startsWith('/developer'));

  useEffect(() => {
    if (user?.username) {
      const match = DUMMY_USERS.find((u) => u.username === user.username);
      if (match) setActiveUser(match);
    }
  }, [user]);

  const isActive = (href: string) => {
    if (href === '/overview' && (pathname === '/overview' || pathname === '/dashboard')) return true;
    if (href === '/company' && pathname === '/company') return true;
    return pathname === href || (href !== '/' && href !== '/company' && pathname?.startsWith(href));
  };

  const DEVELOPER_NAV = [
    { name: 'Overview', href: '/overview', icon: LayoutDashboard },
    { name: 'Career & Learning', href: '/career', icon: Compass },
    { name: 'Discover', href: '/developers', icon: Search },
    { name: 'Opportunities', href: '/jobs', icon: Briefcase },
    { name: 'Challenges', href: '/challenges', icon: Trophy },
    { name: 'Teams', href: '/teams', icon: Users },
    { name: 'Skill DNA', href: '/skill-dna', icon: Dna },
    { name: 'Skills', href: '/skills', icon: Code2 },
    { name: 'Projects', href: '/projects', icon: FolderGit2 },
    { name: 'GitHub', href: '/github', icon: Github },
    { name: 'Activity', href: '/activity', icon: Activity },
    { name: 'Community', href: '/community', icon: MessageSquare },
    { name: 'Network', href: '/network', icon: UserCheck },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const COMPANY_HIRING_NAV = [
    { name: 'Overview', href: '/company', icon: LayoutDashboard },
    { name: 'Find Developers', href: '/company/developers', icon: Search },
    { name: 'Opportunities', href: '/company/jobs', icon: Briefcase },
    { name: 'Challenges', href: '/company/challenges', icon: Trophy },
    { name: 'Applications', href: '/company/applications', icon: GitPullRequest },
    { name: 'Saved Talent', href: '/company/saved', icon: Bookmark },
    { name: 'Compare', href: '/company/compare', icon: ArrowLeftRight },
  ];

  const COMPANY_ORG_NAV = [
    { name: 'Team Members', href: '/company/members', icon: Users },
    { name: 'Company Profile', href: '/company/profile', icon: Building2 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const toggleMode = () => {
    if (isCompanyMode) {
      router.push('/overview');
    } else {
      router.push('/company');
    }
  };

  const currentScore = trustScore?.overallScore || activeUser.trustScore.overallScore || 940;
  const scorePercent = Math.round((currentScore / 1000) * 100);

  // Nav item renderer
  const NavItem = ({ item, activeColor }: { item: { name: string; href: string; icon: any }; activeColor: string }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    const isTeal = activeColor === 'teal' || activeColor === 'cyan';
    return (
      <Link
        href={item.href}
        aria-current={active ? 'page' : undefined}
        title={collapsed ? item.name : undefined}
        className={[
          'flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition-colors duration-150 relative select-none',
          collapsed ? 'justify-center' : '',
          active
            ? isTeal
              ? 'bg-[rgba(20,184,166,0.08)] dark:bg-[rgba(20,184,166,0.15)] text-[#14B8A6] dark:text-[#5EEAD4] font-medium'
              : 'bg-[rgba(99,102,241,0.08)] dark:bg-[rgba(99,102,241,0.15)] text-[#6366F1] dark:text-[#93C5FD] font-medium'
            : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F1F5F9] hover:bg-slate-100 dark:hover:bg-[#181F2C]',
        ].join(' ')}
      >
        {/* Active indicator bar */}
        {active && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full"
            style={{ background: isTeal ? '#14B8A6' : '#6366F1' }}
          />
        )}
        <Icon
          className={[
            'w-4 h-4 shrink-0 transition-opacity',
            active
              ? isTeal
                ? 'text-[#14B8A6] dark:text-[#5EEAD4] opacity-100'
                : 'text-[#6366F1] dark:text-[#93C5FD] opacity-100'
              : 'text-slate-400 dark:text-[#64748B] opacity-70',
          ].join(' ')}
        />
        {!collapsed && <span className="truncate">{item.name}</span>}
      </Link>
    );
  };

  return (
    <motion.aside
      className="relative flex flex-col bg-slate-50/80 dark:bg-[#0E1117] border-r border-slate-200 dark:border-white/[0.07] shrink-0 z-30 select-none transition-colors"
      style={{ minHeight: 'calc(100vh - 56px)' }}
      animate={{ width: collapsed ? 52 : 240 }}
      transition={{ duration: 0.18, ease: 'easeInOut' }}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3 top-6 z-20 flex items-center justify-center w-[22px] h-[22px] rounded-full bg-white dark:bg-[#131720] border border-slate-200 dark:border-white/[0.10] hover:border-slate-300 dark:hover:border-white/[0.20] text-slate-500 dark:text-[#64748B] hover:text-slate-900 dark:hover:text-[#F1F5F9] transition-all shadow-sm"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Mode indicator strip */}
      <div
        className="px-3 pt-3 pb-2 border-b border-slate-200 dark:border-white/[0.07]"
      >
        <button
          onClick={toggleMode}
          aria-label={isCompanyMode ? 'Switch to Developer Workspace' : 'Switch to Company Workspace'}
          title={isCompanyMode ? 'Switch to Developer Workspace' : 'Switch to Company Workspace'}
          className={[
            'w-full flex items-center gap-2 px-2.5 py-[7px] rounded-lg text-[12px] font-medium transition-colors border',
            collapsed ? 'justify-center' : '',
            isCompanyMode
              ? 'bg-[rgba(20,184,166,0.08)] text-[#14B8A6] border-[rgba(20,184,166,0.20)] hover:bg-[rgba(20,184,166,0.14)]'
              : 'bg-[rgba(99,102,241,0.08)] text-[#6366F1] border-[rgba(99,102,241,0.20)] hover:bg-[rgba(99,102,241,0.14)]',
          ].join(' ')}
        >
          <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
          {!collapsed && (
            <span className="truncate">
              {isCompanyMode ? 'Company Workspace' : 'Developer Workspace'}
            </span>
          )}
        </button>
      </div>

      {/* Score mini-card (developer mode, expanded) */}
      {!isCompanyMode && !collapsed && (
        <div className="mx-3 mt-3 p-3 rounded-lg bg-white dark:bg-[#131720] border border-slate-200 dark:border-white/[0.06] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-slate-500 dark:text-[#64748B] font-medium">Verified Score</span>
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#14B8A6]/10 text-[#14B8A6]"
            >
              Elite
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-[18px] font-semibold text-slate-900 dark:text-[#F1F5F9] tracking-tight leading-none">
              {currentScore}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-[#64748B]">/1000</span>
          </div>
          <div className="w-full h-[2px] bg-slate-100 dark:bg-[#181F2C] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#3B82F6] transition-all"
              style={{ width: `${scorePercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-3">
        {isCompanyMode ? (
          <>
            <div>
              {!collapsed && (
                <div className="px-2.5 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.05em] text-slate-400 dark:text-[#475569]">
                  Hiring Platform
                </div>
              )}
              <div className="space-y-0.5 mt-0.5">
                {COMPANY_HIRING_NAV.map((item) => (
                  <NavItem key={item.name} item={item} activeColor="teal" />
                ))}
              </div>
            </div>
            <div>
              {!collapsed && (
                <div className="px-2.5 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.05em] text-slate-400 dark:text-[#475569]">
                  Organization
                </div>
              )}
              <div className="space-y-0.5 mt-0.5">
                {COMPANY_ORG_NAV.map((item) => (
                  <NavItem key={item.name} item={item} activeColor="teal" />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div>
            {!collapsed && (
              <div className="px-2.5 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.05em] text-slate-400 dark:text-[#475569]">
                Build · Prove · Grow
              </div>
            )}
            <div className="space-y-0.5 mt-0.5">
              {DEVELOPER_NAV.map((item) => (
                <NavItem key={item.name} item={item} activeColor="indigo" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-slate-200 dark:border-white/[0.07]">
        {!collapsed ? (
          <div className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#181F2C] transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={activeUser.avatarUrl}
                alt={activeUser.name}
                className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-white/[0.08] shrink-0"
              />
              <div className="min-w-0">
                <span className="block text-[13px] font-medium text-slate-900 dark:text-[#F1F5F9] truncate leading-tight">
                  {activeUser.name}
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-[#64748B] truncate leading-tight">
                  {activeUser.role === 'recruiter'
                    ? 'Recruiter'
                    : `Score ${activeUser.trustScore.overallScore}`}
                </span>
              </div>
            </div>
            <Link
              href={`/u/${activeUser.username}`}
              className="text-slate-400 dark:text-[#64748B] hover:text-[#6366F1] dark:hover:text-[#93C5FD] transition-colors p-1 shrink-0"
              title="View Public Profile"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <img
              src={activeUser.avatarUrl}
              alt={activeUser.name}
              className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-white/[0.08]"
              title={activeUser.name}
            />
          </div>
        )}
      </div>
    </motion.aside>
  );
}
