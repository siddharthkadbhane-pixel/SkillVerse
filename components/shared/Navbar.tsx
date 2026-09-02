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

  const switchAccount = async (targetUser: (typeof DUMMY_USERS)[0]) => {
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
    <header
      className="h-14 sticky top-0 z-40 flex items-center justify-between gap-4 px-4 sm:px-5 shrink-0"
      style={{
        background: '#0E1117',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Left: Logo + breadcrumb */}
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href={isCompanyPath ? '/company' : '/overview'}
          className="flex items-center gap-2 group"
        >
          {/* Brand mark — gradient is intentional here for the logo */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-sm"
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)' }}
          >
            ✦
          </div>
          <span className="font-semibold text-[14px] tracking-[-0.02em] text-[#F1F5F9] group-hover:text-[#A78BFA] transition-colors leading-none">
            SkillVerse
          </span>
          {isCompanyPath && (
            <span className="hidden sm:inline text-[10px] text-[#64748B] font-medium tracking-wide ml-0.5">
              Hiring
            </span>
          )}
        </Link>

        {breadcrumb && (
          <div className="hidden sm:flex items-center gap-2 text-[12.5px] text-[#475569]">
            <span>/</span>
            <span className="text-[#64748B]">{breadcrumb}</span>
          </div>
        )}
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-sm hidden sm:block">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            aria-label="Search"
            className="w-full h-8 bg-[#131720] border border-white/[0.07] hover:border-white/[0.12] focus:border-[#7C3AED]/40 rounded-lg pl-8 pr-8 text-[12.5px] text-[#F1F5F9] placeholder-[#475569] outline-none transition-colors"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const q = encodeURIComponent(e.currentTarget.value);
                router.push(isCompanyPath ? `/company/developers?q=${q}` : `/developers?q=${q}`);
              }
            }}
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#475569] bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06] leading-none pointer-events-none">
            /
          </kbd>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Workspace toggle */}
        <button
          onClick={toggleWorkspaceMode}
          aria-label={isCompanyPath ? 'Switch to Developer Workspace' : 'Switch to Hiring Workspace'}
          title={isCompanyPath ? 'Switch to Developer Workspace' : 'Switch to Hiring Workspace'}
          className="hidden md:flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[12px] font-medium text-[#94A3B8] hover:text-[#F1F5F9] bg-[#131720] hover:bg-[#181F2C] border border-white/[0.07] transition-colors"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-[#7C3AED]" />
          <span>{isCompanyPath ? 'Dev' : 'Hire'}</span>
        </button>

        {/* Notifications */}
        <Link
          href="/activity"
          aria-label="Activity and notifications"
          className="relative flex items-center justify-center w-8 h-8 rounded-lg text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#181F2C] transition-colors"
        >
          <Bell className="w-4 h-4" />
          {/* Simple dot indicator — no glow */}
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: '#7C3AED' }}
          />
        </Link>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Open account menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 h-8 pl-1.5 pr-2 rounded-lg bg-[#131720] hover:bg-[#181F2C] border border-white/[0.07] transition-colors"
          >
            <img
              src={activeUser.avatarUrl}
              alt={activeUser.name}
              className="w-5.5 h-5.5 rounded-full object-cover border border-white/[0.08]"
              style={{ width: 22, height: 22 }}
            />
            <span className="hidden lg:flex flex-col text-left leading-none gap-0.5">
              <span className="text-[12px] font-medium text-[#F1F5F9]">
                {activeUser.name.split(' ')[0]}
              </span>
            </span>
            <ChevronDown
              className="w-3 h-3 text-[#64748B] transition-transform duration-150"
              style={{ transform: menuOpen ? 'rotate(180deg)' : undefined }}
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl bg-[#0E1117] border border-white/[0.10] shadow-xl z-50 overflow-hidden animate-scale-in">
              {/* Header */}
              <div className="px-3 py-2.5 border-b border-white/[0.07] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
                  <Sparkles className="w-3 h-3 text-[#7C3AED]" />
                  <span className="font-medium">Switch Test Account</span>
                </div>
                <span className="text-[10px] text-[#475569]">5 personas</span>
              </div>

              {/* Account list */}
              <div className="p-1.5 flex flex-col gap-0.5 max-h-64 overflow-y-auto">
                {DUMMY_USERS.map((u) => {
                  const isCurrent = u.id === activeUser.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => switchAccount(u)}
                      disabled={switching}
                      className={[
                        'text-left px-2.5 py-2 rounded-lg transition-colors flex items-center gap-2.5 w-full',
                        isCurrent
                          ? 'bg-[rgba(124,58,237,0.10)] text-[#F1F5F9]'
                          : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#181F2C]',
                      ].join(' ')}
                    >
                      <img
                        src={u.avatarUrl}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[12.5px] font-medium truncate">{u.name}</span>
                          <span className="text-[10px] text-[#64748B] shrink-0 font-mono">
                            {u.role === 'recruiter'
                              ? 'Recruiter'
                              : u.role === 'company_admin'
                              ? 'Admin'
                              : u.dccLevel}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#475569] truncate">{u.role}</p>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div
                className="px-3 py-2.5 flex items-center justify-between"
                style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
              >
                <Link
                  href="/login"
                  className="text-[11.5px] text-[#64748B] hover:text-[#F1F5F9] flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  Sign In Screen
                </Link>
                <Link
                  href={`/passport/${activeUser.username}`}
                  className="text-[11.5px] text-[#A78BFA] hover:text-[#C4B5FD] font-medium transition-colors"
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
