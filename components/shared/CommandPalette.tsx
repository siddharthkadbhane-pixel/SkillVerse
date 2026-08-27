'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Terminal, GitBranch, Settings, LayoutDashboard, ShieldCheck, Trophy, Sparkles, BarChart2, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandItem {
  icon: any;
  label: string;
  category: string;
  action: () => void;
}

export default function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [repos, setRepos] = useState<any[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch repositories list once loaded to allow direct searching
  useEffect(() => {
    if (isOpen) {
      fetch('/api/repositories')
        .then(r => r.json())
        .then(res => {
          if (res.success) setRepos(res.data || []);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Toggle Command Palette on Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
      setSearch('');
    }
  }, [isOpen]);

  // Compile static command options
  const defaultCommands: CommandItem[] = [
    { label: 'Go to Dashboard', icon: LayoutDashboard, category: 'Navigation', action: () => router.push('/dashboard') },
    { label: 'View Repositories List', icon: GitBranch, category: 'Navigation', action: () => router.push('/repositories') },
    { label: 'Compare Repositories', icon: Terminal, category: 'Navigation', action: () => router.push('/repositories/compare') },
    { label: 'Open Analytics Telemetry', icon: BarChart2, category: 'Navigation', action: () => router.push('/analytics') },
    { label: 'View Trust Passport', icon: ShieldCheck, category: 'Navigation', action: () => router.push('/passport') },
    { label: 'Open AI Reviews', icon: Sparkles, category: 'Navigation', action: () => router.push('/reviews') },
    { label: 'Browse Challenges', icon: Trophy, category: 'Navigation', action: () => router.push('/challenges') },
    { label: 'Settings & Configs', icon: Settings, category: 'General', action: () => router.push('/settings') },
  ];

  // Merge static commands and fetched repositories
  const repoCommands: CommandItem[] = repos.map(r => ({
    label: `Open Repo: ${r.name}`,
    icon: GitBranch,
    category: 'Repositories',
    action: () => router.push(`/repositories/${r.id}`),
  }));

  const allItems = [...defaultCommands, ...repoCommands];

  const filteredItems = allItems.filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const grouped = filteredItems.reduce<Record<string, CommandItem[]>>((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {});

  // Keyboard navigation inside list
  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  let flatIndex = -1;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={() => setIsOpen(false)}
      >
        {/* Frosted backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-lg flex flex-col overflow-hidden max-h-[440px] rounded-2xl"
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={e => e.stopPropagation()}
          onKeyDown={handleListKeyDown}
        >
          {/* Gradient border wrapper */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/30 via-cyan-500/10 to-violet-500/20 p-[1px]">
            <div className="w-full h-full rounded-2xl bg-surface" />
          </div>

          <div className="relative z-10 flex flex-col overflow-hidden rounded-2xl">
            {/* Search header */}
            <div className="flex items-center gap-3 px-4 border-b border-subtle py-3.5">
              <div className="flex items-center justify-center rounded-lg bg-accent-dim"
                   style={{ width: 28, height: 28, flexShrink: 0 }}>
                <Command style={{ width: 14, height: 14, color: '#A78BFA' }} />
              </div>
              <input
                ref={inputRef}
                placeholder="Type a command or search..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setSelectedIndex(0);
                }}
                className="bg-transparent text-white text-sm font-medium focus:outline-none w-full placeholder:text-dim"
              />
              <kbd className="bg-elevated text-[10px] text-dim border border-subtle px-1.5 py-0.5 rounded font-mono shrink-0">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="overflow-y-auto flex-1 py-2">
              {filteredItems.length === 0 ? (
                <div className="text-muted text-xs px-4 py-10 text-center flex flex-col items-center gap-2">
                  <Search style={{ width: 20, height: 20, color: '#475569' }} />
                  <span>No commands or repositories matched your search.</span>
                </div>
              ) : (
                Object.entries(grouped).map(([category, items]) => (
                  <div key={category}>
                    <div className="px-4 pt-3 pb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-dim">
                        {category}
                      </span>
                    </div>
                    {items.map((item) => {
                      flatIndex++;
                      const idx = flatIndex;
                      const Icon = item.icon;
                      const isSelected = selectedIndex === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            item.action();
                            setIsOpen(false);
                          }}
                          className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg cursor-pointer transition-all duration-150 ${
                            isSelected
                              ? 'bg-accent-dim border border-accent-muted'
                              : 'border border-transparent hover:bg-hover'
                          }`}
                        >
                          <div className={`flex items-center justify-center rounded-md ${
                            isSelected ? 'bg-accent-muted' : 'bg-elevated'
                          }`} style={{ width: 28, height: 28, flexShrink: 0 }}>
                            <Icon style={{ width: 14, height: 14 }}
                                  className={isSelected ? 'text-accent-hover' : 'text-muted'} />
                          </div>
                          <span className={`text-sm font-medium flex-1 ${
                            isSelected ? 'text-accent-hover' : 'text-secondary'
                          }`}>
                            {item.label}
                          </span>
                          {isSelected && (
                            <kbd className="text-[9px] text-dim bg-elevated border border-subtle px-1 py-0.5 rounded font-mono">
                              ↵
                            </kbd>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer hints */}
            <div className="px-4 py-2.5 border-t border-subtle flex items-center gap-4 text-[10px] text-dim">
              <span className="flex items-center gap-1">
                <kbd className="bg-elevated border border-subtle px-1 py-0.5 rounded font-mono">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-elevated border border-subtle px-1 py-0.5 rounded font-mono">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-elevated border border-subtle px-1 py-0.5 rounded font-mono">ESC</kbd>
                Close
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
