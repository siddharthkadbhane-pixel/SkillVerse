'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, GitBranch, Sparkles, Dna, ShieldCheck,
  Award, Briefcase, Building2, Users, Trophy, BookOpen,
  LayoutGrid, Settings, Bell, HelpCircle, CreditCard,
} from 'lucide-react';

interface SidebarProps {
  trustScore?: { overallScore: number } | null;
}

const NAV = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard',    href: '/dashboard',    icon: LayoutDashboard },
      { name: 'Repositories', href: '/repositories', icon: GitBranch },
      { name: 'AI Reviews',   href: '/reviews',      icon: Sparkles },
    ],
  },
  {
    label: 'Skills',
    items: [
      { name: 'Skill DNA',     href: '/skills',  icon: Dna },
      { name: 'Trust Engine',  href: '/passport', icon: ShieldCheck },
      { name: 'Passport',      href: '/passport', icon: CreditCard },
    ],
  },
  {
    label: 'Platform',
    items: [
      { name: 'Community',     href: '/community',  icon: Users },
      { name: 'Challenges',    href: '/challenges', icon: Trophy },
      { name: 'Learning Hub',  href: '/mentor',     icon: BookOpen },
      { name: 'Workspace',     href: '/workspace',  icon: LayoutGrid },
    ],
  },
  {
    label: 'Opportunities',
    items: [
      { name: 'Jobs',      href: '/jobs',    icon: Briefcase },
      { name: 'Companies', href: '/company', icon: Building2 },
    ],
  },
];

const BOTTOM_NAV = [
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings',      href: '/settings',      icon: Settings },
  { name: 'Help',          href: '/support',        icon: HelpCircle },
];

export default function Sidebar({ trustScore }: SidebarProps) {
  const pathname = usePathname();
  const score = trustScore?.overallScore ?? 0;

  const trustColor =
    score >= 900 ? 'var(--sv-accent)'   :
    score >= 700 ? 'var(--sv-success)'  :
    score >= 400 ? 'var(--sv-warning)'  : 'var(--sv-danger)';

  const trustLabel =
    score >= 900 ? 'Elite'              :
    score >= 700 ? 'Trusted'            :
    score >= 400 ? 'Verified'           : 'Unverified';

  return (
    <aside className="sv-sidebar">
      {/* Trust micro-badge */}
      {score > 0 && (
        <div style={{
          padding: '8px 10px',
          background: 'var(--sv-surface-2)',
          border: '1px solid var(--sv-border)',
          borderRadius: 'var(--sv-r-md)',
          marginBottom: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--sv-text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Trust Score
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: trustColor }}>{trustLabel}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 6 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: trustColor, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {score}
            </span>
            <span style={{ fontSize: 10, color: 'var(--sv-text-dim)' }}>/1000</span>
          </div>
          <div className="sv-bar-track">
            <div
              className="sv-bar-fill"
              style={{ width: `${(score / 1000) * 100}%`, background: trustColor }}
            />
          </div>
        </div>
      )}

      {/* Navigation sections */}
      {NAV.map((section) => (
        <div key={section.label} className="sv-sidebar-section">
          <div className="sv-section-label">{section.label}</div>
          {section.items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href + item.name}
                href={item.href}
                className={`sv-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon style={{ width: 14, height: 14, flexShrink: 0 }} />
                {item.name}
              </Link>
            );
          })}
        </div>
      ))}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bottom nav */}
      <div className="sv-divider" style={{ margin: '8px 0' }} />
      {BOTTOM_NAV.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`sv-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon style={{ width: 14, height: 14, flexShrink: 0 }} />
            {item.name}
          </Link>
        );
      })}
    </aside>
  );
}
