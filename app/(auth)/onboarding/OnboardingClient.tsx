'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Code2, 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Search, 
  ShieldCheck, 
  Github, 
  Compass, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import Link from 'next/link';

interface OnboardingClientProps {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    username?: string | null;
    role: string;
    companyId?: string | null;
  };
}

export default function OnboardingClient({ user }: OnboardingClientProps) {
  const router = useRouter();
  const [selectedPersona, setSelectedPersona] = useState<'developer' | 'hiring' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Company registration form state
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');

  const handleDeveloperContinue = () => {
    setLoading(true);
    router.push('/overview');
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('Company name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyName.trim(),
          website: companyWebsite.trim() || undefined,
          description: companyDescription.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to register company workspace.');
      }

      // Switch active workspace to company
      await fetch('/api/workspace/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'company' }),
      });

      router.push('/company');
    } catch (err: any) {
      setError(err?.message || 'An error occurred while creating your company workspace.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#08090D] text-slate-900 dark:text-[#F1F5F9] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5" /> Welcome to SkillVerse, {user.name || user.username || 'Engineer'}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            How do you plan to use SkillVerse?
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Choose your primary objective. You can always access both personal developer tools and company workspaces from your account.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Persona Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Developer */}
          <div 
            onClick={() => { setSelectedPersona('developer'); setError(null); }}
            className={`cursor-pointer rounded-2xl border p-6 sm:p-8 transition-all flex flex-col justify-between ${
              selectedPersona === 'developer'
                ? 'border-indigo-500 bg-indigo-500/[0.04] shadow-lg ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#10131B] hover:border-slate-300 dark:hover:border-white/[0.15]'
            }`}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center">
                <Code2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">I am a Developer / Engineer</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Audit your code, build verified Skill DNA, prove capabilities through AST evidence, and advance your engineering career.
                </p>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Connect GitHub repositories for AST auditing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Generate verified Developer Capability Card (DCC)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Join competitive engineering challenges & roadmaps</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                type="button"
                disabled={loading}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPersona('developer');
                  handleDeveloperContinue();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {loading && selectedPersona === 'developer' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Enter Developer Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 2: Hiring / Recruiter */}
          <div 
            onClick={() => { setSelectedPersona('hiring'); setError(null); }}
            className={`cursor-pointer rounded-2xl border p-6 sm:p-8 transition-all flex flex-col justify-between ${
              selectedPersona === 'hiring'
                ? 'border-blue-500 bg-blue-500/[0.04] shadow-lg ring-2 ring-blue-500/20'
                : 'border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#10131B] hover:border-slate-300 dark:hover:border-white/[0.15]'
            }`}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">I am Hiring Developers</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Discover engineers with proven evidence, review code quality metrics, compare candidates, and manage talent pipelines.
                </p>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Search verified developer directory with DCC scores</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Compare candidates side-by-side with code evidence</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Create or join an organization hiring workspace</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPersona('hiring');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Setup Company Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Company Registration Form (Expands when Hiring is selected) */}
        {selectedPersona === 'hiring' && (
          <div className="rounded-2xl border border-blue-500/30 bg-white dark:bg-[#10131B] p-6 sm:p-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300 shadow-xl">
            <div className="border-b border-slate-100 dark:border-white/[0.06] pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-[#F1F5F9]">
                Register Your Company Workspace
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Creating a verified organization workspace establishes administrative ownership and enables hiring features.
              </p>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Engineering Labs"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#08090D] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Website (Optional)
                  </label>
                  <input
                    type="url"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    placeholder="https://acme.dev"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#08090D] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Short Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={companyDescription}
                    onChange={(e) => setCompanyDescription(e.target.value)}
                    placeholder="Distributed systems & developer tools"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#08090D] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Already have an invitation from a teammate? Check your email or invitation link.
                </span>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Setup</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
