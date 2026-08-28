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
  BarChart3,
  Building2,
  Settings,
  CreditCard,
  Bell,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowLeftRight,
  ShieldCheck,
  Sparkles,
  Award,
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

  // Determine if in Company Mode vs Developer Mode
  const isCompanyPath = pathname?.startsWith('/company');
  const isRecruiterOrAdmin = activeUser.role === 'recruiter' || activeUser.role === 'admin';
  const isCompanyMode = isCompanyPath || (isRecruiterOrAdmin && !pathname?.startsWith('/overview') && !pathname?.startsWith('/skill-dna') && !pathname?.startsWith('/skills') && !pathname?.startsWith('/projects') && !pathname?.startsWith('/github') && !pathname?.startsWith('/activity') && !pathname?.startsWith('/network') && !pathname?.startsWith('/challenges') && !pathname?.startsWith('/community') && !pathname?.startsWith('/career') && !pathname?.startsWith('/profile') && !pathname?.startsWith('/developers') && !pathname?.startsWith('/developer'));

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

  return (
    <motion.aside
      className="relative flex flex-col bg-[#0D121A] border-r border-white/[0.08] shrink-0 z-30 transition-all duration-200 select-none min-h-[calc(100vh-56px)]"
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.18, ease: 'easeInOut' }}
    >
      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-5 z-20 flex items-center justify-center w-5 h-5 rounded-full bg-[#151B26] border border-white/[0.12] hover:border-[#7C3AED]/40 hover:bg-[#1C2433] text-[#94A3B8] hover:text-[#F8FAFC] transition-all shadow-sm"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Mode Switcher Pill */}
      <div className="p-3 border-b border-white/[0.06]">
        <button
          onClick={toggleMode}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all border ${
            isCompanyMode
              ? 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/20 hover:bg-[#38BDF8]/15'
              : 'bg-[#7C3AED]/10 text-[#A78BFA] border-[#7C3AED]/20 hover:bg-[#7C3AED]/15'
          } ${collapsed ? 'justify-center px-1.5' : ''}`}
          title={isCompanyMode ? 'Switch to Developer Workspace' : 'Switch to Company Workspace'}
        >
          <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
          {!collapsed && (
            <span className="truncate">
              {isCompanyMode ? 'Company Workspace' : 'Developer Workspace'}
            </span>
          )}
        </button>
      </div>

      {/* Developer Level Mini-Card (in Developer Mode when expanded) */}
      {!isCompanyMode && !collapsed && (
        <div className="mx-3 mt-3 p-2.5 rounded-lg bg-[#111722] border border-white/[0.06] space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Verified Level
            </span>
            <span className="font-mono text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.2 rounded">
              Elite
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-base font-bold text-[#F8FAFC]">
              {currentScore}
              <span className="text-[10px] text-[#64748B] font-normal">/1000</span>
            </span>
            <span className="text-[10px] text-[#A78BFA] font-medium">Top 1% Rank</span>
          </div>
          <div className="w-full h-1 bg-[#151B26] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#06B6D4]"
              style={{ width: `${(currentScore / 1000) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
        {isCompanyMode ? (
          <>
            <div>
              {!collapsed && (
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                  Hiring Platform
                </div>
              )}
              <div className="space-y-0.5 mt-1">
                {COMPANY_HIRING_NAV.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                        active
                          ? 'bg-[#38BDF8]/10 text-[#38BDF8] font-semibold'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04]'
                      } ${collapsed ? 'justify-center' : ''}`}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#38BDF8]' : 'text-[#64748B]'}`} />
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              {!collapsed && (
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                  Organization
                </div>
              )}
              <div className="space-y-0.5 mt-1">
                {COMPANY_ORG_NAV.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                        active
                          ? 'bg-[#38BDF8]/10 text-[#38BDF8] font-semibold'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04]'
                      } ${collapsed ? 'justify-center' : ''}`}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#38BDF8]' : 'text-[#64748B]'}`} />
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div>
            {!collapsed && (
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                Build &bull; Prove &bull; Grow
              </div>
            )}
            <div className="space-y-0.5 mt-1">
              {DEVELOPER_NAV.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                      active
                        ? 'bg-[#7C3AED]/15 text-[#A78BFA] font-semibold'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04]'
                    } ${collapsed ? 'justify-center' : ''}`}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#A78BFA]' : 'text-[#64748B]'}`} />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Profile & Status */}
      <div className="p-2 border-t border-white/[0.06]">
        {!collapsed ? (
          <div className="flex items-center justify-between p-2 rounded-lg bg-[#111722] border border-white/[0.04]">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={activeUser.avatarUrl}
                alt=""
                className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0"
              />
              <div className="min-w-0">
                <span className="block text-xs font-semibold text-[#F8FAFC] truncate">
                  {activeUser.name}
                </span>
                <span className="block font-mono text-[10px] text-[#64748B] truncate">
                  {activeUser.role === 'recruiter'
                    ? 'Recruiter'
                    : `Score: ${activeUser.trustScore.overallScore}`}
                </span>
              </div>
            </div>
            <Link
              href={`/u/${activeUser.username}`}
              className="text-[#64748B] hover:text-[#A78BFA] transition-colors p-1"
              title="View Public Profile"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <img
              src={activeUser.avatarUrl}
              alt=""
              className="w-7 h-7 rounded-full object-cover border border-white/10"
              title={activeUser.name}
            />
          </div>
        )}
      </div>
    </motion.aside>
  );
}
