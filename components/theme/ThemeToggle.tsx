'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check, Sparkles, ChevronDown } from 'lucide-react';
import { useTheme, ThemePreference } from './useTheme';
import { ThemeTestModal } from './ThemeTestModal';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { preference, effectiveTheme, setTheme, mounted } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  if (!mounted) {
    return (
      <div 
        aria-hidden="true" 
        className={`w-9 h-9 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-white/[0.04] ${className}`} 
      />
    );
  }

  const options: { id: ThemePreference; label: string; icon: typeof Sun }[] = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <>
      <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          type="button"
          aria-haspopup="true"
          aria-expanded={menuOpen}
          aria-label={`Theme setting: currently ${preference} (effective ${effectiveTheme}). Click to change.`}
          title={`Theme: ${preference.toUpperCase()} (${effectiveTheme})`}
          className={`relative inline-flex items-center justify-center w-9 h-9 rounded-lg border transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/40
            ${effectiveTheme === 'dark'
              ? 'bg-[#0E1117] hover:bg-[#131720] border-white/[0.10] text-[#F1F5F9] hover:border-white/[0.20]'
              : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 hover:border-slate-300 shadow-xs'
            }`}
        >
          {preference === 'system' ? (
            <Monitor className="w-4 h-4 text-[#6366F1] dark:text-[#93C5FD] transition-transform" />
          ) : effectiveTheme === 'dark' ? (
            <Moon className="w-4 h-4 text-indigo-400 transition-transform -rotate-12 hover:rotate-0" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500 transition-transform rotate-0 hover:rotate-45" />
          )}
        </button>

        {menuOpen && (
          <div
            role="menu"
            aria-orientation="vertical"
            className="absolute right-0 top-full mt-1.5 w-56 rounded-xl bg-white dark:bg-[#0E1117] border border-slate-200 dark:border-white/[0.10] shadow-xl z-50 overflow-hidden animate-scale-in p-1.5 space-y-1"
          >
            {/* Header info */}
            <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500 dark:text-[#64748B]">Theme Preference</span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-[#475569]">
                {preference === 'system' ? `OS: ${effectiveTheme}` : effectiveTheme}
              </span>
            </div>

            {/* Options list */}
            <div className="space-y-0.5">
              {options.map((opt) => {
                const Icon = opt.icon;
                const isSelected = preference === opt.id;
                return (
                  <button
                    key={opt.id}
                    role="menuitemradio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setTheme(opt.id);
                      setMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-[rgba(99,102,241,0.08)] dark:bg-[rgba(99,102,241,0.15)] text-[#6366F1] dark:text-[#93C5FD]'
                        : 'text-slate-700 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181F2C]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{opt.label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#6366F1]" />}
                  </button>
                );
              })}
            </div>

            {/* Theme Preview & UI Test button */}
            <div className="pt-1 border-t border-slate-100 dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setTestModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-[#6366F1] dark:text-[#93C5FD] hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#6366F1]" />
                <span>Theme Preview & UI Test</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Development & UI Testing Modal */}
      <ThemeTestModal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
      />
    </>
  );
}

export default ThemeToggle;
