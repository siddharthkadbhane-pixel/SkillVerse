import React from 'react';
import Link from 'next/link';
import { Shield, Lock, Eye, FileText, Database, Server, UserCheck, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — SkillVerse',
  description: 'Learn how SkillVerse handles your developer identity, repository AST telemetry, and capability verification data with strict privacy safeguards.',
};

export default function PrivacyPolicyPage() {
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
            <Link href="/terms" className="text-zinc-400 hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/cookies" className="text-zinc-400 hover:text-white transition-colors">Cookies</Link>
            <Link href="/contact/privacy" className="px-3 py-1.5 rounded-lg bg-purple-600/10 border border-purple-500/30 text-purple-300 hover:bg-purple-600/20 transition-all">
              Privacy Request
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1">
        {/* Title & Badge */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-4">
            <Lock className="w-3.5 h-3.5" /> Notice Version 1.0 • Effective August 2026
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            SkillVerse Privacy Policy
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            SkillVerse is built on a fundamental principle: <strong>Proof Over Claims</strong>. This privacy policy explains honestly how we collect, process, and protect your developer identity, repository AST telemetry, and capability verification data.
          </p>
        </div>

        {/* Highlight Banner */}
        <div className="p-5 rounded-xl bg-purple-950/20 border border-purple-800/30 mb-10 flex items-start gap-4">
          <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            <strong className="text-white block mb-1">Our Core Technical Privacy Guarantee:</strong>
            SkillVerse does <strong>NOT</strong> clone or store your full source code repositories. We only inspect lightweight structural manifests (<code className="text-purple-300 font-mono">package.json</code>, READMEs, commit messages) under a strict 500KB cap to derive capability ratings. Your payment tier has 0.0% influence on your capability ratings.
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-10 text-sm text-zinc-300 leading-relaxed">
          {/* Section 1 */}
          <section className="border-t border-white/[0.06] pt-8">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-400" /> 1. Data We Collect & How It Is Sourced
            </h2>
            <p className="mb-3">
              We collect information in three distinct categories based on your direct actions on the platform:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li><strong>Account Identity:</strong> When you register via GitHub or email, we store your username, name, email address, and profile photo provided by the identity provider.</li>
              <li><strong>Repository Manifests & Telemetry:</strong> When you request an AST analysis of a repository, we read commit counts, language breakdowns, package dependencies, and file structures.</li>
              <li><strong>Deterministic Capability Data:</strong> Based on the AST audit, our engine compiles your Developer Capability Card (DCC 2.0), verified skills, and Trust Score.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="border-t border-white/[0.06] pt-8">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-400" /> 2. How GitHub Integration Operates
            </h2>
            <p className="mb-3">
              SkillVerse uses GitHub OAuth to streamline verification. Here is what happens when you connect GitHub:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>We request read-only access to verify repository ownership and commit author signatures.</li>
              <li>We read AST structural file paths and dependencies (capped at 500KB total context per analysis).</li>
              <li>We <strong>never</strong> write to or alter your Git repositories.</li>
              <li>You can click <strong>Disconnect GitHub</strong> at any time in Settings, which immediately deletes local OAuth tokens and halts synchronization.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="border-t border-white/[0.06] pt-8">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" /> 3. AI Processing & Multi-Agent Reviews
            </h2>
            <p className="mb-3">
              SkillVerse uses serverless AI inference (powered by Hugging Face Inference API) for code architecture review and constructive feedback:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>Only truncated manifest summaries and file structural descriptions are sent in-flight to the AI model.</li>
              <li>Data transmitted to the inference endpoint is ephemeral and is <strong>not used to train third-party AI models</strong>.</li>
              <li>If the AI service is unavailable, our deterministic AST heuristic engine generates code feedback automatically, ensuring zero service disruption.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="border-t border-white/[0.06] pt-8">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-400" /> 4. Public Profile & DCC Visibility Controls
            </h2>
            <p className="mb-3">
              You maintain granular control over what information is publicly visible:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>By default, your Developer Capability Card (DCC) and verified skills can be viewed via your public link (e.g. <code className="text-purple-300 font-mono">/developer/your-handle</code>).</li>
              <li>You can toggle your profile to <strong>Private</strong> in Settings, which instantly prevents recruiter searches and hides your DCC passport.</li>
              <li>Private repositories analyzed with your explicit consent are never linked publicly on your profile.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="border-t border-white/[0.06] pt-8">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" /> 5. Your Rights & Data Controls
            </h2>
            <p className="mb-3">
              Under global privacy standards and the Digital Personal Data Protection Act, 2023 (DPDP) of India, you possess the following rights:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
              <div className="p-4 rounded-lg bg-zinc-900/60 border border-white/[0.06]">
                <strong className="text-white block mb-1">Right to Access & Portability</strong>
                <span className="text-xs text-zinc-400">Download a complete verified JSON archive of your profile, DCC, and evidence via "Download My Data" in Settings.</span>
              </div>
              <div className="p-4 rounded-lg bg-zinc-900/60 border border-white/[0.06]">
                <strong className="text-white block mb-1">Right to Erasure / Anonymization</strong>
                <span className="text-xs text-zinc-400">Permanently scrub personal information (email, name, tokens) while safely preserving immutable capability hashes.</span>
              </div>
              <div className="p-4 rounded-lg bg-zinc-900/60 border border-white/[0.06]">
                <strong className="text-white block mb-1">Right to Withdraw Consent</strong>
                <span className="text-xs text-zinc-400">Toggle granular consent permissions (public profile, telemetry, private repo scanning) at any time.</span>
              </div>
              <div className="p-4 rounded-lg bg-zinc-900/60 border border-white/[0.06]">
                <strong className="text-white block mb-1">Grievance Redressal</strong>
                <span className="text-xs text-zinc-400">Submit inquiries or privacy grievances through our dedicated portal at <Link href="/contact/privacy" className="text-purple-400 underline">/contact/privacy</Link>.</span>
              </div>
            </div>
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
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
            <Link href="/privacy" className="text-purple-400 transition-colors">Privacy</Link>
            <Link href="/cookies" className="hover:text-zinc-300 transition-colors">Cookies</Link>
            <Link href="/contact/privacy" className="hover:text-zinc-300 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
