import React from 'react';
import Link from 'next/link';
import { Cookie, Shield, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Cookie & Tracking Disclosure — SkillVerse',
  description: 'Understand the cookies and local storage mechanisms used by SkillVerse. Zero third-party advertising tracking.',
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#070A0F] text-[#F8FAFC] flex flex-col justify-between selection:bg-purple-500/30 selection:text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#070A0F]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-sm font-semibold tracking-tight hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Shield className="w-4 h-4" />
            </div>
            <span>SkillVerse</span>
          </Link>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/privacy" className="text-zinc-400 hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-zinc-400 hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/contact/privacy" className="px-3 py-1.5 rounded-lg bg-purple-600/10 border border-purple-500/30 text-purple-300 hover:bg-purple-600/20 transition-all">
              Privacy Request
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-4">
            <Cookie className="w-3.5 h-3.5" /> Effective August 2026
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Cookie & Tracking Disclosure
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            SkillVerse respects your digital privacy. We maintain an ultra-minimalist approach to browser storage, using only strictly necessary authentication cookies and UI state preferences.
          </p>
        </div>

        {/* Core Guarantee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-800/30 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-zinc-300">
              <strong className="text-white block mb-1">What We Use:</strong>
              Encrypted, HttpOnly session cookies for authenticated login and local browser storage for dark-mode and tab preferences.
            </div>
          </div>
          <div className="p-5 rounded-xl bg-purple-950/20 border border-purple-800/30 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-zinc-300">
              <strong className="text-white block mb-1">What We NEVER Use:</strong>
              Zero third-party advertising cookies, zero behavioral tracking pixels, and zero cross-site profile scrapers.
            </div>
          </div>
        </div>

        {/* Cookies Table */}
        <div className="border border-white/[0.06] rounded-xl overflow-hidden mb-10 bg-zinc-900/30">
          <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white">Categories of Storage Used on SkillVerse</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-400">
              <thead className="bg-white/[0.01] border-b border-white/[0.06] text-zinc-300 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="px-6 py-3">Storage Key / Cookie</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Purpose</th>
                  <th className="px-6 py-3">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                <tr>
                  <td className="px-6 py-3 font-mono text-purple-300">sb-*-auth-token</td>
                  <td className="px-6 py-3"><span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px]">Essential</span></td>
                  <td className="px-6 py-3">Encrypted session token managing authenticated developer/recruiter login.</td>
                  <td className="px-6 py-3">Session / 7 Days</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-mono text-purple-300">skillverse-theme</td>
                  <td className="px-6 py-3"><span className="px-2 py-0.5 rounded bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 text-[10px]">Preference</span></td>
                  <td className="px-6 py-3">Stores user preference for dark-mode UI rendering.</td>
                  <td className="px-6 py-3">Persistent (Local Storage)</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-mono text-purple-300">skillverse-active-tab</td>
                  <td className="px-6 py-3"><span className="px-2 py-0.5 rounded bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 text-[10px]">Preference</span></td>
                  <td className="px-6 py-3">Remembers your active Settings or Dashboard tab to eliminate layout shifting.</td>
                  <td className="px-6 py-3">Session (Local Storage)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-12 pt-6 border-t border-white/[0.06]">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to SkillVerse
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 text-xs text-zinc-500 bg-[#05070B]">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 SkillVerse Inc. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
            <Link href="/cookies" className="text-purple-400 transition-colors">Cookies</Link>
            <Link href="/contact/privacy" className="hover:text-zinc-300 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
