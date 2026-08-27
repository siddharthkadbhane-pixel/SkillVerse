import React from 'react';
import type { Metadata } from 'next';
import { Inter, Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'SkillVerse — Developer Verification & Technical Hiring Platform',
  description: 'Developers prove their abilities through real technical evidence, and companies discover developers based on that evidence. Proof over claims.',
  keywords: ['developer verification', 'skill dna', 'technical hiring', 'code analysis', 'trust score', 'developer passport'],
  themeColor: '#070A0F',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${outfit.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-[#070A0F] text-[#F8FAFC]">
        {children}
      </body>
    </html>
  );
}
