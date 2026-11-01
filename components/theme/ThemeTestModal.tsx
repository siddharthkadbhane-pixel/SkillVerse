'use client';

import React, { useEffect } from 'react';
import { 
  X, 
  Sun, 
  Moon, 
  Monitor, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  TrendingUp, 
  ExternalLink,
  Layers
} from 'lucide-react';
import { useTheme, ThemePreference } from './useTheme';

interface ThemeTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeTestModal({ isOpen, onClose }: ThemeTestModalProps) {
  const { preference, effectiveTheme, setTheme } = useTheme();

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const effectiveThemeDisplay =
    preference === 'system'
      ? `System → ${effectiveTheme === 'dark' ? 'Dark' : 'Light'}`
      : preference === 'dark'
      ? 'Dark'
      : 'Light';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-test-panel-title"
    >
      <div 
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.12] p-6 shadow-2xl space-y-6 text-slate-900 dark:text-[#F8FAFC] transition-colors"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-white/[0.08] gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#6366F1]/10 text-[#6366F1] border border-[#6366F1]/20">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 id="theme-test-panel-title" className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Theme Preview & UI Test Panel
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
              Verify actual rendering tokens, contrast ratios, card backgrounds, and interactive controls in real time.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close theme test panel"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Effective Theme Status & Switcher */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-mono uppercase text-slate-500 dark:text-[#64748B] block">
              Active Mode
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {effectiveThemeDisplay}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-[#6366F1]/15 text-[#6366F1] dark:text-[#93C5FD] border border-[#6366F1]/30">
                Resolved: {effectiveTheme}
              </span>
            </div>
          </div>

          {/* Quick Segmented Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#070A0F] border border-slate-200 dark:border-white/[0.08]">
            {(['light', 'dark', 'system'] as ThemePreference[]).map((mode) => {
              const active = preference === mode;
              const Icon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTheme(mode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    active
                      ? 'bg-[#6366F1] text-white shadow-sm'
                      : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{mode}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 1: Surfaces & Card Hierarchy */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#64748B]">
            1. Surfaces & Elevation Hierarchy
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Default Surface */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] shadow-sm flex flex-col justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-[#64748B]">Default Card</span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">Surface Token</h4>
                <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5">
                  Clean white in Light, graphite `#0D121A` in Dark.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#6366F1] dark:text-[#93C5FD]">--surface</span>
            </div>

            {/* Elevated Surface */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] shadow-sm flex flex-col justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-[#64748B]">Elevated Card</span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">Subtle Neutral</h4>
                <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5">
                  Slate-50 in Light, `#111722` in Dark.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#6366F1] dark:text-[#93C5FD]">--elevated</span>
            </div>

            {/* Interactive Card */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#0D121A] hover:bg-slate-50 dark:hover:bg-[#111722] border border-slate-200 dark:border-white/[0.08] hover:border-[#6366F1]/50 dark:hover:border-[#6366F1]/50 transition-all cursor-pointer shadow-sm flex flex-col justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 dark:text-[#64748B]">Interactive Card</span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">Hover Highlight</h4>
                <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5">
                  Interactive state with indigo border highlight.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#6366F1] dark:text-[#93C5FD]">hover:border-accent</span>
            </div>
          </div>
        </div>

        {/* Section 2: Text Hierarchy & Contrast */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#64748B]">
            2. Text Hierarchy & Readability
          </h3>
          <div className="p-4 rounded-xl bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] space-y-2 shadow-sm">
            <h1 className="text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
              Primary Headline: High Contrast Title (Slate-900 / #F8FAFC)
            </h1>
            <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              Secondary Body Text: Highly legible explanatory text designed for reading comfort without harsh brightness in either mode.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500 dark:text-[#64748B] font-mono">
              <span>Muted Meta: #64748B</span>
              <span>•</span>
              <span className="text-[#6366F1] dark:text-[#93C5FD]">Brand Accent: #6366F1</span>
              <span>•</span>
              <span className="text-[#14B8A6]">Verified Teal: #14B8A6</span>
            </div>
          </div>
        </div>

        {/* Section 3: Buttons & Interactive Elements */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#64748B]">
            3. Buttons, Badges & Focus Rings
          </h3>
          <div className="p-4 rounded-xl bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] flex flex-wrap items-center gap-3 shadow-sm">
            {/* Primary Button */}
            <button
              type="button"
              className="px-4 py-2 text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] active:scale-95 rounded-xl shadow-md shadow-indigo-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              Primary Indigo
            </button>

            {/* Secondary Button */}
            <button
              type="button"
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#111722] hover:bg-slate-200 dark:hover:bg-[#181F2C] border border-slate-200 dark:border-white/[0.08] active:scale-95 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              Secondary Neutral
            </button>

            {/* Danger Button */}
            <button
              type="button"
              className="px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/15 bg-red-500/10 border border-red-500/20 active:scale-95 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-red-500/30"
            >
              Danger
            </button>

            {/* Verified Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#14B8A6]/10 text-[#0D9488] dark:text-[#14B8A6] border border-[#14B8A6]/30 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified Audit
            </span>

            {/* Unverified Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-3.5 h-3.5" />
              Unverified
            </span>
          </div>
        </div>

        {/* Section 4: Inputs & Dropdowns */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#64748B]">
            4. Inputs, Selects & Form Controls
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-xl bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] shadow-sm">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Standard Input
              </label>
              <input
                type="text"
                placeholder="Search or enter query..."
                defaultValue="TypeScript AST Audit"
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-white/[0.10] bg-slate-50 dark:bg-[#111722] px-3 text-xs text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                Select Dropdown
              </label>
              <select
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-white/[0.10] bg-slate-50 dark:bg-[#111722] px-3 text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 transition-all"
                defaultValue="elite"
              >
                <option value="all" className="bg-white dark:bg-[#111722] text-slate-900 dark:text-white">All Capability Tiers</option>
                <option value="elite" className="bg-white dark:bg-[#111722] text-slate-900 dark:text-white">Elite (900+)</option>
                <option value="expert" className="bg-white dark:bg-[#111722] text-slate-900 dark:text-white">Expert (800+)</option>
                <option value="advanced" className="bg-white dark:bg-[#111722] text-slate-900 dark:text-white">Advanced (650+)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 5: Tooltip & Chart Colors Preview */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#64748B]">
            5. Tooltip & Chart Colors Preview
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Chart Simulation */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] space-y-3 shadow-sm">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 dark:border-white/[0.06]">
                <span className="font-semibold text-slate-800 dark:text-white">Trend Grid Preview</span>
                <span className="text-[#14B8A6] font-mono text-[11px] font-bold">+18.4%</span>
              </div>
              <div className="h-16 flex items-end gap-2 pt-2 border-b border-slate-200 dark:border-white/[0.08]">
                {[40, 65, 55, 80, 75, 95].map((h, i) => (
                  <div key={i} className="flex-1 bg-slate-100 dark:bg-[#111722] rounded-t flex flex-col justify-end h-full">
                    <div 
                      className="w-full bg-[#6366F1] rounded-t transition-all hover:bg-[#4F46E5]" 
                      style={{ height: `${h}%` }}
                      title={`Value: ${h}%`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 dark:text-[#64748B]">
                <span>Week 1</span>
                <span>Week 6</span>
              </div>
            </div>

            {/* Tooltip Sample */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] flex flex-col justify-center gap-2">
              <span className="text-[10px] font-mono text-slate-500 dark:text-[#64748B]">Chart Tooltip Box Sample:</span>
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/10 shadow-lg text-xs space-y-1">
                <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">TypeScript AST Audit</span>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-500 dark:text-[#94A3B8]">Overall Score:</span>
                  <strong className="text-[#6366F1] dark:text-[#93C5FD]">98/100</strong>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-slate-500 dark:text-[#94A3B8]">Status:</span>
                  <strong className="text-[#14B8A6]">Verified</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/[0.08]">
          <span className="text-xs text-slate-400 dark:text-[#64748B]">
            Testing controls operate entirely locally via shared CSS variables.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#6366F1] hover:bg-[#4F46E5] transition-all shadow-sm"
          >
            Done Testing
          </button>
        </div>
      </div>
    </div>
  );
}

export default ThemeTestModal;
