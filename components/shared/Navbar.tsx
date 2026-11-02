'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Check,
  LogOut,
  ChevronDown,
  ArrowLeftRight,
  Sparkles,
  Shield,
  Building2,
  Code2,
  Settings,
  User,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface NavbarProps {
  user?: { name?: string; username?: string; avatarUrl?: string; role?: string } | null;
  breadcrumb?: string;
}

export default function Navbar({ user, breadcrumb }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [fetchedUser, setFetchedUser] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // If user prop was not passed, resolve verified user from /api/v1/me
  useEffect(() => {
    if (!user) {
      fetch('/api/v1/me')
        .then((r) => (r.ok ? r.json() : null))
        .then((res) => {
          if (res?.data?.user) {
            setFetchedUser(res.data.user);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const currentUser = user || fetchedUser || {
    name: 'Developer',
    username: 'developer',
    avatarUrl: '',
    role: 'developer',
  };

  const role = (currentUser.role || 'developer').toLowerCase();
  const isPrivileged = role === 'recruiter' || role === 'company_admin' || role === 'admin';
  const isAdmin = role === 'admin';

  const isCompanyPath = pathname?.startsWith('/company');
  const searchPlaceholder = isCompanyPath
    ? 'Search developers, skills, jobs...'
    : 'Search projects, skills, repositories...';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleWorkspaceMode = () => {
    if (!isPrivileged) return;
    if (isCompanyPath) {
      router.push('/overview');
    } else {
      router.push('/company');
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (e) {
      console.error('Sign out failed:', e);
    } finally {
      window.location.href = '/login';
    }
  };

  const getRoleBadge = () => {
    if (role === 'admin') {
      return (
        <span className="px-2 py-0.5 text-[9.5px] font-bold rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
          ADMIN
        </span>
      );
    }
    if (role === 'company_admin') {
      return (
        <span className="px-2 py-0.5 text-[9.5px] font-bold rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
          COMPANY ADMIN
        </span>
      );
    }
    if (role === 'recruiter') {
      return (
        <span className="px-2 py-0.5 text-[9.5px] font-bold rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
          RECRUITER
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[9.5px] font-bold rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
        DEVELOPER
      </span>
    );
  };

  return (
    <header className="h-14 sticky top-0 z-40 flex items-center justify-between gap-4 px-4 sm:px-5 shrink-0 bg-white/90 dark:bg-[#0E1117]/95 backdrop-blur border-b border-slate-200 dark:border-white/[0.07] transition-colors">
      {/* Left: Logo + breadcrumb */}
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href={isCompanyPath ? '/company' : '/overview'}
          className="flex items-center gap-2 group"
        >
          {/* Brand mark */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm"
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)' }}
          >
            ✦
          </div>
          <span className="font-semibold text-[14px] tracking-[-0.02em] text-slate-900 dark:text-[#F1F5F9] group-hover:text-[#6366F1] dark:group-hover:text-[#93C5FD] transition-colors leading-none">
            SkillVerse
          </span>
          {isCompanyPath && (
            <span className="hidden sm:inline text-[10px] text-slate-500 dark:text-[#64748B] font-medium tracking-wide ml-0.5">
              Hiring
            </span>
          )}
        </Link>

        {breadcrumb && (
          <div className="hidden sm:flex items-center gap-2 text-[12.5px] text-slate-400 dark:text-[#475569]">
            <span>/</span>
            <span className="text-slate-600 dark:text-[#64748B]">{breadcrumb}</span>
          </div>
        )}
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-sm hidden sm:block">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            aria-label="Search"
            className="w-full h-8 bg-slate-100 dark:bg-[#131720] border border-slate-200 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.12] focus:border-[#6366F1]/50 focus:ring-1 focus:ring-[#6366F1]/20 rounded-lg pl-8 pr-8 text-[12.5px] text-slate-900 dark:text-[#F1F5F9] placeholder-slate-400 dark:placeholder-[#475569] outline-none transition-colors"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const q = encodeURIComponent(e.currentTarget.value);
                router.push(isCompanyPath ? `/company/developers?q=${q}` : `/developers?q=${q}`);
              }
            }}
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 dark:text-[#475569] bg-white dark:bg-white/[0.04] px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/[0.06] leading-none pointer-events-none">
            /
          </kbd>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Workspace toggle - Only shown if authorized (recruiter, company_admin, admin) */}
        {isPrivileged && (
          <button
            onClick={toggleWorkspaceMode}
            aria-label={isCompanyPath ? 'Switch to Developer Workspace' : 'Switch to Hiring Workspace'}
            title={isCompanyPath ? 'Switch to Developer Workspace' : 'Switch to Hiring Workspace'}
            className="hidden md:flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[12px] font-medium text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F1F5F9] bg-slate-100 dark:bg-[#131720] hover:bg-slate-200 dark:hover:bg-[#181F2C] border border-slate-200 dark:border-white/[0.07] transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#6366F1]" />
            <span>{isCompanyPath ? 'Dev' : 'Hire'}</span>
          </button>
        )}

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <Link
          href="/activity"
          aria-label="Activity and notifications"
          className="relative flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 dark:text-[#64748B] hover:text-slate-900 dark:hover:text-[#F1F5F9] hover:bg-slate-100 dark:hover:bg-[#181F2C] transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
        </Link>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Open account menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 h-8 pl-1.5 pr-2 rounded-lg bg-slate-100 dark:bg-[#131720] hover:bg-slate-200 dark:hover:bg-[#181F2C] border border-slate-200 dark:border-white/[0.07] transition-colors"
          >
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name || 'User'}
                className="w-5.5 h-5.5 rounded-full object-cover border border-slate-200 dark:border-white/[0.08]"
                style={{ width: 22, height: 22 }}
              />
            ) : (
              <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                {(currentUser.name || currentUser.username || 'D').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden lg:flex flex-col text-left leading-none gap-0.5">
              <span className="text-[12px] font-medium text-slate-900 dark:text-[#F1F5F9]">
                {(currentUser.name || 'Developer').split(' ')[0]}
              </span>
            </span>
            <ChevronDown
              className="w-3 h-3 text-slate-400 dark:text-[#64748B] transition-transform duration-150"
              style={{ transform: menuOpen ? 'rotate(180deg)' : undefined }}
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl bg-white dark:bg-[#0E1117] border border-slate-200 dark:border-white/[0.10] shadow-xl z-50 overflow-hidden animate-scale-in">
              {/* Authenticated User Header */}
              <div className="px-3.5 py-3 border-b border-slate-100 dark:border-white/[0.07] flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {currentUser.name || 'Developer'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-[#64748B] truncate font-mono">
                    @{currentUser.username || 'developer'}
                  </p>
                </div>
                <div className="shrink-0">{getRoleBadge()}</div>
              </div>

              {/* Navigation Options */}
              <div className="p-1.5 space-y-0.5">
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                  >
                    <Shield className="w-4 h-4 shrink-0" />
                    Admin Console
                  </Link>
                )}

                {isPrivileged && (
                  <Link
                    href="/company"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors"
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    Company Workspace
                  </Link>
                )}

                <Link
                  href="/overview"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#181F2C] rounded-lg transition-colors"
                >
                  <Code2 className="w-4 h-4 shrink-0 text-slate-400" />
                  Developer Overview
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#181F2C] rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4 shrink-0 text-slate-400" />
                  Account Settings
                </Link>

                <Link
                  href={`/u/${currentUser.username || 'developer'}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#181F2C] rounded-lg transition-colors"
                >
                  <User className="w-4 h-4 shrink-0 text-slate-400" />
                  Public Profile
                </Link>
              </div>

              {/* Footer */}
              <div className="px-3 py-2.5 flex items-center justify-between border-t border-slate-100 dark:border-white/[0.07] bg-slate-50/50 dark:bg-black/20">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-[11.5px] text-red-500 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                >
                  <LogOut className="w-3 h-3" />
                  Sign Out
                </button>
                <Link
                  href={`/passport/${currentUser.username || 'developer'}`}
                  className="text-[11.5px] text-[#6366F1] dark:text-[#93C5FD] hover:underline font-medium transition-colors"
                >
                  Public Passport →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
