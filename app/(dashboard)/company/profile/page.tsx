'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import {
  Building2,
  Globe,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Save,
  AlertCircle
} from 'lucide-react';
import { CompanyProfile } from '@/types/company';

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [size, setSize] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadCompany() {
      try {
        const res = await fetch('/api/company').then(r => r.json());
        if (res.success && res.data?.profile) {
          const p: CompanyProfile = res.data.profile;
          setProfile(p);
          setName(p.name);
          setWebsite(p.website || '');
          setDescription(p.description || '');
          setIndustry(p.industry || 'Software & Cloud Infrastructure');
          setLocation(p.location || 'San Francisco, CA & Remote');
          setSize(p.size || '50-200 employees');
        }
      } catch (err) {
        console.error('Failed to load company profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCompany();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          website,
          description,
          industry,
          location,
          size,
        }),
      }).then(r => r.json());

      if (res.success && res.data) {
        setProfile(res.data);
        setSavedMessage('Company profile updated successfully.');
        setTimeout(() => setSavedMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to update company profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-6 max-w-[1000px] w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#7C3AED]" />
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Company Workspace Profile
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30">
                  ✓ Verified Company
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-1">
                Manage your organization details and recruiter workspace identity.
              </p>
            </div>
          </div>

          {savedMessage && (
            <div className="p-3.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 text-xs text-[#10B981] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{savedMessage}</span>
            </div>
          )}

          {/* Form */}
          <div className="bg-[#0D121A] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-mono text-[#64748B] block mb-1.5">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-[#111722] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-[#64748B] block mb-1.5">
                    Official Website
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://company.com"
                    className="w-full bg-[#111722] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-[#64748B] block mb-1.5">
                  About the Company
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe your engineering stack, mission, and culture..."
                  className="w-full bg-[#111722] border border-white/[0.08] rounded-xl p-3.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-mono text-[#64748B] block mb-1.5">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Developer Tools, FinTech"
                    className="w-full bg-[#111722] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-[#64748B] block mb-1.5">
                    Company Size
                  </label>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="e.g. 50-200 employees"
                    className="w-full bg-[#111722] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-[#64748B] block mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA"
                    className="w-full bg-[#111722] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-[#7C3AED]/25 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving Changes...' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
