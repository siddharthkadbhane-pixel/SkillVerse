import React from 'react';
import Link from 'next/link';
import { FileText, Shield, Scale, Terminal, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service — SkillVerse',
  description: 'Terms of Service and acceptable use rules for the SkillVerse developer capability verification platform.',
};

export default function TermsPage() {
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
            <Link href="/cookies" className="text-zinc-400 hover:text-white transition-colors">Cookies</Link>
            <Link href="/contact/privacy" className="px-3 py-1.5 rounded-lg bg-purple-600/10 border border-purple-500/30 text-purple-300 hover:bg-purple-600/20 transition-all">
              Privacy Request
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1">
        {/* Title */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-4">
            <Scale className="w-3.5 h-3.5" /> Effective August 2026
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Terms of Service
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Welcome to SkillVerse. These Terms of Service govern your access to and use of our developer capability intelligence platform, public passport services, and recruiter workspace tools.
          </p>
        </div>

        {/* Highlight Banner */}
        <div className="p-5 rounded-xl bg-purple-950/20 border border-purple-800/30 mb-10 flex items-start gap-4">
          <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            <strong className="text-white block mb-1">Our Core Commitment:</strong>
            SkillVerse is dedicated to honest, verifiable technical merit. We do not sell user data, we do not allow paid manipulation of Developer Capability Cards (DCC), and we protect your codebase intellectual property at all times.
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-10 text-sm text-zinc-300 leading-relaxed">
          {/* Section 1 */}
          <section className="border-t border-white/[0.06] pt-8">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" /> 1. Account Creation & Security
            </h2>
            <p className="mb-3">
              To use SkillVerse, you must register through a supported authentication method (GitHub OAuth or email). You agree to:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>Provide accurate identification information and link only repositories you own or contribute to legitimately.</li>
              <li>Maintain the security of your account, API tokens (<code className="text-purple-300 font-mono">sk_live_...</code>), and session credentials.</li>
              <li>Notify us immediately of any unauthorized access to your account.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="border-t border-white/[0.06] pt-8">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" /> 2. Intellectual Property & Code Ownership
            </h2>
            <p className="mb-3">
              <strong>You retain 100% ownership of your source code and repositories.</strong> By requesting an AST analysis on SkillVerse:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>You grant SkillVerse a limited, non-exclusive license solely to read manifests (<code className="text-purple-300 font-mono">package.json</code>, dependencies, file metrics) under 500KB to generate your DCC.</li>
              <li>SkillVerse does <strong>not</strong> claim any ownership, copyright, or commercial rights in your software projects.</li>
              <li>You warrant that you have the requisite permissions to submit linked repositories for evaluation.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="border-t border-white/[0.06] pt-8">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-400" /> 3. Nature of DCC Ratings & AI Insights
            </h2>
            <p className="mb-3">
              Developer Capability Cards (DCC 2.0) and AI reviews are automated algorithmic evaluations derived from AST heuristics:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>Scores represent technical telemetry and code quality indicators, not formal professional guarantees of employment or fitness.</li>
              <li>AI-generated feedback is advisory and designed for developer learning and progression.</li>
              <li>SkillVerse does not guarantee specific hiring outcomes or career placements.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="border-t border-white/[0.06] pt-8">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-purple-400" /> 4. Acceptable Use Policy
            </h2>
            <p className="mb-3">
              You agree not to engage in any of the following prohibited behaviors:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>Submitting fraudulent, copied, or plagiarized code to artificially manipulate Trust Scores or capability tiers.</li>
              <li>Attempting to bypass server-side rate limits (180 req/min), scrape private recruiter notes, or execute Denial-of-Service attacks.</li>
              <li>Harassing, spamming, or submitting abusive content in the Developer Community or Verification Challenge spaces.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="border-t border-white/[0.06] pt-8">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" /> 5. Service Availability & Limitation of Liability
            </h2>
            <p className="mb-3 text-zinc-400">
              SkillVerse is provided "as is" and "as available". To the maximum extent permitted by applicable law, SkillVerse shall not be liable for indirect, incidental, special, or consequential damages resulting from your use of or inability to use the platform.
            </p>
          </section>
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
            <Link href="/terms" className="text-purple-400 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
            <Link href="/cookies" className="hover:text-zinc-300 transition-colors">Cookies</Link>
            <Link href="/contact/privacy" className="hover:text-zinc-300 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
