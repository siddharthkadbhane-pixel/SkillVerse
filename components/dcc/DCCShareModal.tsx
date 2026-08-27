'use client';

import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Share2, 
  Code, 
  ShieldCheck, 
  Globe 
} from 'lucide-react';

interface DCCShareModalProps {
  username: string;
  isOpen: boolean;
  onClose: () => void;
  overallScore: number;
  level: string;
}

export default function DCCShareModal({
  username,
  isOpen,
  onClose,
  overallScore,
  level,
}: DCCShareModalProps) {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://skillverse.dev';
  const publicUrl = `${baseUrl}/developer/${username}`;
  const markdownBadge = `[![SkillVerse DCC](https://img.shields.io/badge/SkillVerse%20DCC-${overallScore}%20%7C%20${level}-7C3AED?style=flat-square&logo=github)](${publicUrl})`;
  const embedCode = `<iframe src="${publicUrl}" width="100%" height="600" frameborder="0"></iframe>`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#0D121A] p-6 shadow-2xl flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#7C3AED]/15 text-[#C4B5FD] border border-[#7C3AED]/30">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Share Developer Capability Card</h3>
              <p className="text-xs text-[#94A3B8]">Verified evidence-backed proof of skill identity</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#94A3B8] hover:text-white hover:bg-[#111722] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Public Share URL */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono text-[#94A3B8] flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#7C3AED]" />
            Public Shareable Link:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="flex-1 px-3 py-2 text-xs font-mono bg-[#111722] border border-white/[0.08] rounded-lg text-[#F8FAFC] focus:outline-none"
            />
            <button
              onClick={() => copyToClipboard(publicUrl, 'link')}
              className="px-3.5 py-2 text-xs font-semibold bg-[#7C3AED] hover:bg-[#8B5CF6] text-white rounded-lg transition-all flex items-center gap-1.5 shrink-0"
            >
              {copiedType === 'link' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedType === 'link' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Markdown Badge */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono text-[#94A3B8] flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-[#38BDF8]" />
            GitHub README Markdown Badge:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={markdownBadge}
              className="flex-1 px-3 py-2 text-xs font-mono bg-[#111722] border border-white/[0.08] rounded-lg text-[#64748B] focus:outline-none truncate"
            />
            <button
              onClick={() => copyToClipboard(markdownBadge, 'badge')}
              className="px-3.5 py-2 text-xs font-semibold bg-[#111722] hover:bg-[#151B26] text-[#F8FAFC] border border-white/[0.08] rounded-lg transition-all flex items-center gap-1.5 shrink-0"
            >
              {copiedType === 'badge' ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedType === 'badge' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#A78BFA] hover:underline font-semibold inline-flex items-center gap-1"
          >
            Preview Public Profile <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#111722] text-[#F8FAFC] hover:bg-[#151B26] border border-white/[0.06] transition-all"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
