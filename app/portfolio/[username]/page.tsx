'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import SkillPassport from '@/features/passport/SkillPassport';
import Link from 'next/link';
import { Shield, ChevronLeft } from 'lucide-react';

export default function PublicPortfolioPage() {
  const params = useParams();
  const username = params.username as string;
  const [loading, setLoading] = useState(true);
  const [portfolioData, setPortfolioData] = useState<any>(null);

  useEffect(() => {
    if (!username) return;

    fetch(`/api/portfolio/${username}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setPortfolioData(json.data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 gap-4">
        <svg className="animate-spin h-8 w-8 text-violet-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-zinc-500 text-sm font-semibold tracking-wide">Resolving Verified Passport...</span>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 gap-4">
        <span className="text-zinc-500 text-sm">Portfolio for @{username} not found.</span>
        <Link href="/" className="text-xs font-semibold text-violet-400 hover:text-white transition-colors">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 grid-bg">
      {/* Visual background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />

      {/* Top minimal header */}
      <nav className="w-full border-b border-zinc-900/60 bg-zinc-950/40 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-1.5 font-bold tracking-tight text-white">
            <Shield className="h-4 w-4 text-violet-400" />
            <span className="text-xs font-extrabold tracking-tight">SkillVerse Verified Passport</span>
          </div>

          <div className="text-[10px] uppercase font-bold text-zinc-500 pl-1 shrink-0">
            Public Registry
          </div>
        </div>
      </nav>

      {/* SkillPassport view */}
      <main className="py-8 relative z-10">
        <SkillPassport
          user={portfolioData.user}
          trustScore={portfolioData.trustScore}
          skillDna={portfolioData.skillDna}
          repositories={portfolioData.repositories || []}
        />
      </main>

      {/* Mini footer */}
      <footer className="w-full py-8 text-center text-[10px] text-zinc-600 border-t border-zinc-900/40 mt-12 bg-zinc-950/40 z-10 relative">
        <span>Verified cryptographic passport signature: sv_cert_auth_{username}_2026</span>
      </footer>
    </div>
  );
}
