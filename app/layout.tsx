import React from 'react';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SkillVerse - Proof of Skill Platform',
  description: 'Proving developer capability through verified repository audits and skill passports.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-zinc-950 text-zinc-50 min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
