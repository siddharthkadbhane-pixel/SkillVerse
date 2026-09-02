'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, Send, CheckCircle2, AlertCircle, ArrowLeft, Mail, FileCheck } from 'lucide-react';

export default function PrivacyContactPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [requestType, setRequestType] = useState('data_access');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      const res = await fetch('/api/privacy/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, requestType, details }),
      });
      const json = await res.json();

      if (json.success) {
        setStatus({
          ok: true,
          msg: 'Your request has been officially recorded. Our data protection team will review and respond to your email within 72 hours.',
        });
        setEmail('');
        setName('');
        setDetails('');
      } else {
        setStatus({ ok: false, msg: json.error || 'Failed to submit request' });
      }
    } catch {
      setStatus({ ok: false, msg: 'Network error submitting request. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

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
            <Link href="/terms" className="text-zinc-400 hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/cookies" className="text-zinc-400 hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 flex-1">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-4">
            <Mail className="w-3.5 h-3.5" /> Privacy & Grievance Redressal
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Submit a Privacy or Grievance Request
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            In accordance with global privacy principles and the Digital Personal Data Protection Act, 2023 (DPDP) of India, you may use this portal to exercise your data subject rights or submit an inquiry.
          </p>
        </div>

        {status && (
          <div
            className={`p-4 rounded-xl mb-6 flex items-start gap-3 text-xs leading-relaxed border ${
              status.ok
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                : 'bg-red-950/20 border-red-800/40 text-red-300'
            }`}
          >
            {status.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
            <div>{status.msg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-zinc-900/30 border border-white/[0.06] space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Your Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Siddharth Kadbhane"
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900/60 border border-white/[0.08] text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address <span className="text-purple-400">*</span></label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@domain.com"
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900/60 border border-white/[0.08] text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Request Type <span className="text-purple-400">*</span></label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900/60 border border-white/[0.08] text-white text-xs focus:outline-none focus:border-purple-500/50"
            >
              <option value="data_access">Data Access & Portability Request (Copy of data)</option>
              <option value="data_rectification">Data Rectification Request (Correct profile error)</option>
              <option value="account_deletion">Account Erasure / Anonymization Request</option>
              <option value="consent_withdrawal">Consent Withdrawal</option>
              <option value="general_inquiry">General Privacy Inquiry / Grievance</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">Request Details <span className="text-purple-400">*</span></label>
            <textarea
              required
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please describe your specific request or inquiry in detail..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-900/60 border border-white/[0.08] text-white text-xs placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {submitting ? 'Submitting Request...' : (
              <>
                <Send className="w-3.5 h-3.5" /> Submit Privacy Request
              </>
            )}
          </button>
        </form>

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
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
            <Link href="/cookies" className="hover:text-zinc-300 transition-colors">Cookies</Link>
            <Link href="/contact/privacy" className="text-purple-400 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
