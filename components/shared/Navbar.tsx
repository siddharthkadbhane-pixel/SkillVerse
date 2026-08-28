'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  Sparkles,
  Check,
  LogOut,
  ChevronDown,
  ArrowLeftRight,
  ShieldCheck,
  Building2,
  Code2,
} from 'lucide-react';
import { DUMMY_USERS } from '@/lib/dummyData';

interface NavbarProps {
  user?: { name?: string; username?: string; avatarUrl?: string; role?: string } | null;
  breadcrumb?: string;
}

export default function Navbar({ user, breadcrumb }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeUsername = user?.username || 'siddharthkadbhane-pixel';
  const activeUser = DUMMY_USERS.find((u) => u.username === activeUsername) || DUMMY_USERS[0];

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

  const switchAccount = async (targetUser: typeof DUMMY_USERS[0]) => {
    try {
      setSwitching(true);
      await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUser.id }),
      });
      setMenuOpen(false);

      const targetUrl =
        targetUser.role === 'recruiter' || targetUser.role === 'company_admin'
          ? '/company'
          : '/overview';
      router.push(targetUrl);
      router.refresh();
      window.location.href = targetUrl;
    } catch (err) {
      console.error('Failed to switch test account:', err);
    } finally {
      setSwitching(false);
    }
  };

  const toggleWorkspaceMode = () => {
    if (isCompanyPath) {
      router.push('/overview');
    } else {
      router.push('/company');
    }
  };

  return (
    <header className="h-14 bg-[#070A0F]/90 backdrop-blur-md border-b border-white/[0.08] sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left Section: Logo & Context */}
      <div className="flex items-center gap-3">
        <Link
          href={isCompanyPath ? '/company' : '/overview'}
          className="flex items-center gap-2 group shrink-0"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] flex items-center justify-center shadow-sm shadow-[#7C3AED]/30">
            <span className="text-white text-xs font-black">✦</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-sm tracking-tight text-[#F8FAFC] group-hover:text-[#A78BFA] transition-colors">
              SKILLVERSE
            </span>
            <span className="text-[10px] font-mono text-[#64748B] hidden md:inline">
              {isCompanyPath ? 'HIRING' : 'DEVELOPER'}
            </span>
          </div>
        </Link>

        {breadcrumb && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#64748B]">
            <span>/</span>
            <span className="text-[#94A3B8] font-medium">{breadcrumb}</span>
          </div>
        )}
      </div>

      {/* Middle Section: Contextual Search Bar */}
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="w-full bg-[#0D121A] border border-white/[0.08] hover:border-white/[0.14] focus:border-[#7C3AED]/50 rounded-lg pl-8 pr-8 py-1.5 text-xs text-[#F8FAFC] placeholder-[#64748B] outline-none transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (isCompanyPath) {
                  router.push(`/company/developers?q=${encodeURIComponent(e.currentTarget.value)}`);
                } else {
                  router.push(`/developers?q=${encodeURIComponent(e.currentTarget.value)}`);
                }
              }
            }}
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#64748B] bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
            /
          </kbd>
        </div>
      </div>

      {/* Right Section: Workspace Switch, Notifications, Persona Switcher */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Fast Workspace Toggle Button */}
        <button
          onClick={toggleWorkspaceMode}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#111722] hover:bg-[#151B26] border border-white/[0.08] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
          title={isCompanyPath ? 'Switch to Developer Workspace' : 'Switch to Company Workspace'}
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-[#7C3AED]" />
          <span>{isCompanyPath ? 'Dev Mode' : 'Hire Mode'}</span>
        </button>

        {/* Notifications */}
        <Link
          href="/activity"
          className="relative p-2 rounded-lg bg-[#111722] hover:bg-[#151B26] border border-white/[0.08] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
          title="Notifications & Activity"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#7C3AED] shadow-sm shadow-[#7C3AED]" />
        </Link>

        {/* Test Persona Switcher Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg bg-[#111722] hover:bg-[#151B26] border border-white/[0.08] hover:border-white/[0.14] transition-all text-left"
          >
            <img
              src={activeUser.avatarUrl}
              alt={activeUser.name}
              className="w-6 h-6 rounded-full object-cover border border-white/10"
            />
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-[#F8FAFC] leading-none">
                {activeUser.name.split(' ')[0]}
              </span>
              <span className="text-[10px] font-mono text-[#64748B] leading-tight">
                {activeUser.role === 'recruiter'
                  ? 'Recruiter'
                  : activeUser.role === 'company_admin'
                  ? 'Admin'
                  : `${activeUser.trustScore.overallScore}`}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-[#64748B]" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-xl p-3 bg-[#0D121A] border border-white/[0.12] shadow-2xl z-50 flex flex-col gap-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#7C3AED]" />
                  Switch Test Account
                </span>
                <span className="text-[10px] font-mono text-[#94A3B8]">5 Personas</span>
              </div>

              <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
                {DUMMY_USERS.map((u) => {
                  const isCurrent = u.id === activeUser.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => switchAccount(u)}
                      disabled={switching}
                      className={`text-left p-2 rounded-lg transition-all flex items-center gap-2.5 border ${
                        isCurrent
                          ? 'bg-[#7C3AED]/15 border-[#7C3AED]/40 text-white'
                          : 'bg-[#111722]/50 border-transparent hover:bg-[#151B26] hover:border-white/[0.08] text-[#94A3B8] hover:text-white'
                      }`}
                    >
                      <img
                        src={u.avatarUrl}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold truncate text-[#F8FAFC]">
                            {u.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-bold bg-white/[0.04] text-[#94A3B8]">
                            {u.role === 'recruiter'
                              ? 'Recruiter'
                              : u.role === 'company_admin'
                              ? 'Admin'
                              : u.dccLevel}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#64748B] truncate">{u.role}</p>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                <Link
                  href="/login"
                  className="text-[11px] text-[#64748B] hover:text-white flex items-center gap-1 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  Sign In Screen
                </Link>
                <Link
                  href={`/passport/${activeUser.username}`}
                  className="text-[11px] text-[#7C3AED] hover:underline font-semibold"
                >
                  Public Passport &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
