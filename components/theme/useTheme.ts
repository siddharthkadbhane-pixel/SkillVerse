'use client';

import { useState, useEffect, useCallback } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

export function getEffectiveTheme(preference: ThemePreference): EffectiveTheme {
  if (typeof window === 'undefined') return 'dark';
  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(preference: ThemePreference) {
  if (typeof window === 'undefined') return;
  const effective = getEffectiveTheme(preference);
  if (effective === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  try {
    localStorage.setItem('skillverse_theme', preference);
  } catch {}
  window.dispatchEvent(
    new CustomEvent('skillverse-theme-change', {
      detail: { preference, effective },
    })
  );
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>('dark');
  const [mounted, setMounted] = useState(false);

  const update = useCallback(() => {
    if (typeof window === 'undefined') return;
    const saved = (localStorage.getItem('skillverse_theme') as ThemePreference) || 'system';
    const effective = getEffectiveTheme(saved);
    setPreference(saved);
    setEffectiveTheme(effective);
  }, []);

  useEffect(() => {
    setMounted(true);
    update();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      const saved = (localStorage.getItem('skillverse_theme') as ThemePreference) || 'system';
      if (saved === 'system') {
        applyTheme('system');
        update();
      }
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    const handleCustomChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setPreference(detail.preference);
        setEffectiveTheme(detail.effective);
      } else {
        update();
      }
    };
    window.addEventListener('skillverse-theme-change', handleCustomChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('skillverse-theme-change', handleCustomChange);
    };
  }, [update]);

  const setTheme = useCallback((newTheme: ThemePreference) => {
    applyTheme(newTheme);
    setPreference(newTheme);
    setEffectiveTheme(getEffectiveTheme(newTheme));
  }, []);

  return { preference, effectiveTheme, setTheme, mounted };
}
