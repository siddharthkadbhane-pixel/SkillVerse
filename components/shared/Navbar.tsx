'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Bell, Search, ChevronRight, User, Settings } from 'lucide-react';

interface NavbarProps {
  user?: {
    name?: string;
    username: string;
    avatarUrl?: string | null;
  } | null;
  breadcrumb?: string;
}

export default function Navbar({ user, breadcrumb }: NavbarProps) {
  const pathname = usePathname();

  // Derive breadcrumb from pathname if not passed
  const pathLabel = breadcrumb || (() => {
    const parts = pathname.split('/').filter(Boolean);
    if (!parts.length) return 'Dashboard';
    return parts[parts.length - 1]
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  })();

  return (
    <header className="sv-header">
      {/* Logo */}
      <Link href="/dashboard" className="sv-logo" style={{ marginRight: 8 }}>
        <div className="sv-logo-mark">
          <Shield style={{ width: 12, height: 12, color: 'white' }} />
        </div>
        <span>SkillVerse</span>
      </Link>

      {/* Separator + Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--sv-text-dim)', fontSize: 13 }}>
        <ChevronRight style={{ width: 14, height: 14, flexShrink: 0 }} />
        <span style={{ color: 'var(--sv-text-muted)', fontWeight: 450 }}>{pathLabel}</span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Search */}
      <button
        className="sv-btn sv-btn-ghost"
        style={{ gap: 6, color: 'var(--sv-text-dim)', fontSize: 12.5 }}
        aria-label="Search"
      >
        <Search style={{ width: 14, height: 14 }} />
        <span style={{ display: 'none' }} className="lg:inline">Search</span>
        <kbd style={{
          fontSize: 10, padding: '1px 5px', borderRadius: 4,
          background: 'var(--sv-surface-2)', border: '1px solid var(--sv-border)',
          color: 'var(--sv-text-dim)', fontFamily: 'inherit',
          display: 'none',
        }} className="lg:inline">⌘K</kbd>
      </button>

      {/* Notifications */}
      <button
        className="sv-btn sv-btn-ghost"
        style={{ position: 'relative', padding: '5px 8px' }}
        aria-label="Notifications"
      >
        <Bell style={{ width: 15, height: 15 }} />
        <span style={{
          position: 'absolute', top: 4, right: 4,
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--sv-accent)', border: '1.5px solid var(--sv-bg)',
        }} />
      </button>

      {/* Divider */}
      <div className="sv-divider-v" style={{ height: 20, margin: '0 4px' }} />

      {/* User */}
      {user ? (
        <Link
          href={`/u/${user.username}`}
          style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              style={{
                width: 26, height: 26, borderRadius: '50%',
                border: '1px solid var(--sv-border)', objectFit: 'cover',
              }}
            />
          ) : (
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'var(--sv-surface-2)',
              border: '1px solid var(--sv-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <User style={{ width: 12, height: 12, color: 'var(--sv-text-subtle)' }} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--sv-text)' }}>
              {user.name || user.username}
            </span>
            <span style={{ fontSize: 11, color: 'var(--sv-text-dim)' }}>
              @{user.username}
            </span>
          </div>
        </Link>
      ) : (
        <Link href="/login" className="sv-btn sv-btn-primary" style={{ fontSize: 12.5 }}>
          Sign In
        </Link>
      )}
    </header>
  );
}
