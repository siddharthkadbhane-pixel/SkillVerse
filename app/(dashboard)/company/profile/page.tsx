'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import PageHeader from '@/components/ui/PageHeader';
import SkillChip from '@/components/ui/SkillChip';
import {
  Building2,
  ShieldCheck,
  Globe,
  MapPin,
  Users,
  Briefcase,
  ExternalLink,
  Code2,
  CheckCircle2,
} from 'lucide-react';
import { DUMMY_COMPANIES, DUMMY_JOBS } from '@/lib/dummyData';

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const company = DUMMY_COMPANIES[0]; // Hyperion AI

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data.profile);
      })
      .catch(() => {});
  }, []);

  const techStack = [
    'Next.js 15',
    'React 19',
    'TypeScript',
    'Rust',
    'Python',
    'PyTorch',
    'PostgreSQL',
    'Redis',
    'Kubernetes',
    'Docker',
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="Company Profile" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-6">
          <PageHeader
            title="Company Profile"
            description="Company identity, verified employer credentials, and engineering culture."
            badge={{ text: 'Verified Employer', variant: 'primary' }}
          />

          {/* Company Card */}
          <div className="bg-[#0D121A] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] flex items-center justify-center text-white text-3xl font-black shadow-lg">
                  H
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-[#F8FAFC]">
                      {company.name}
                    </h1>
                    <ShieldCheck className="w-5 h-5 text-[#10B981]" />
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30">
                      ✓ Verified Company
                    </span>
                  </div>

                  <p className="text-xs text-[#94A3B8]">
                    Frontier AI Infrastructure & High-Throughput Distributed Systems
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      San Francisco, CA &bull; Remote
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      150 - 500 Employees
                    </span>
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[#A78BFA] hover:underline"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      {company.website}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="pt-4 border-t border-white/[0.06] text-xs text-[#94A3B8] leading-relaxed">
              {company.description}
            </div>
          </div>

          {/* Technology Stack */}
          <div className="bg-[#0D121A] border border-white/[0.08] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
              <Code2 className="w-4 h-4 text-[#7C3AED]" />
              <h3 className="font-semibold text-sm text-[#F8FAFC]">
                Engineering Technology Stack
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {techStack.map((tech, i) => (
                <SkillChip key={i} name={tech} verified={true} />
              ))}
            </div>
          </div>

          {/* Open Positions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-[#F8FAFC]">
                Active Engineering Vacancies ({DUMMY_JOBS.length})
              </h3>
              <Link href="/company/jobs" className="text-xs font-semibold text-[#A78BFA] hover:underline">
                Manage Jobs &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DUMMY_JOBS.map((j) => (
                <div
                  key={j.id}
                  className="p-4 rounded-xl bg-[#0D121A] border border-white/[0.08] hover:border-white/[0.14] transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-[#F8FAFC]">{j.title}</h4>
                    <span className="text-[10px] font-mono text-[#10B981] font-semibold">{j.salaryRange}</span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8]">{j.location}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {(j.requirements || []).slice(0, 3).map((r: string, i: number) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[#111722] text-[#94A3B8]">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
