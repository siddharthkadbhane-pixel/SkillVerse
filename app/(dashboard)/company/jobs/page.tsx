'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import {
  Briefcase,
  Plus,
  Building2,
  MapPin,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Edit,
  XCircle,
  Eye
} from 'lucide-react';
import { OpportunityItem, OpportunityType, WorkplaceType, ExperienceLevel } from '@/types/opportunity';

export default function CompanyJobsManagementPage() {
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<OpportunityType>('full_time');
  const [workplaceType, setWorkplaceType] = useState<WorkplaceType>('remote');
  const [location, setLocation] = useState('Remote');
  const [salaryRange, setSalaryRange] = useState('$140,000 - $180,000 USD');
  const [requiredSkillsStr, setRequiredSkillsStr] = useState('TypeScript, Next.js, PostgreSQL');
  const [preferredSkillsStr, setPreferredSkillsStr] = useState('Docker, Tailwind CSS');
  const [requiredCapStr, setRequiredCapStr] = useState('Frontend Engineering, Full-Stack Development');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Senior');

  async function loadOpportunities() {
    try {
      const res = await fetch('/api/jobs').then(r => r.json());
      if (res.success && Array.isArray(res.data)) {
        setOpportunities(res.data);
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOpportunities();
  }, []);

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const requiredSkills = requiredSkillsStr.split(',').map(s => s.trim()).filter(Boolean);
      const preferredSkills = preferredSkillsStr.split(',').map(s => s.trim()).filter(Boolean);
      const requiredCapabilities = requiredCapStr.split(',').map(s => s.trim()).filter(Boolean);

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          type,
          workplaceType,
          location,
          salaryRange,
          requiredSkills,
          preferredSkills,
          requiredCapabilities,
          experienceLevel,
        }),
      }).then(r => r.json());

      if (res.success && res.opportunity) {
        setOpportunities(prev => [res.opportunity, ...prev]);
        setIsCreateModalOpen(false);
        setTitle('');
        setDescription('');
      }
    } catch (err) {
      console.error('Failed to create opportunity:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#08090D] text-slate-900 dark:text-[#F1F5F9] transition-colors">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-6 max-w-[1400px] w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#6366F1]" />
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Opportunity Management
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#6366F1]/15 text-[#6366F1] dark:text-[#C4B5FD] border border-[#6366F1]/25">
                  Recruiter Workspace
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-1">
                Create and manage job, internship, freelance, and project postings with structured skill requirements.
              </p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-semibold shadow-lg shadow-[#6366F1]/25 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Opportunity</span>
            </button>
          </div>

          {/* Opportunities Table / List */}
          <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Active Postings ({opportunities.length})
              </h3>
              <Link
                href="/company/applications"
                className="text-xs font-semibold text-sky-600 dark:text-[#38BDF8] hover:text-sky-700 dark:hover:text-[#7DD3FC] flex items-center gap-1"
              >
                <span>View All Applications</span>
                <Users className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500 dark:text-[#64748B]">
                Loading company opportunities...
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {opportunities.map((opp) => (
                  <div
                    key={opp.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-white/[0.01] transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{opp.title}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-100 dark:bg-[#111722] text-sky-600 dark:text-[#38BDF8] border border-sky-500/20 uppercase">
                          {opp.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25">
                          {opp.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-[#64748B]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {opp.location} ({opp.workplaceType})
                        </span>
                        <span>•</span>
                        <span>{opp.salaryRange || 'Competitive'}</span>
                        <span>•</span>
                        <span>Created {new Date(opp.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right hidden sm:block">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          {opp.applicationsCount || 0} Applicants
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-[#64748B]">
                          {opp.viewsCount || 0} Views
                        </span>
                      </div>

                      <Link
                        href={`/jobs/${opp.id}`}
                        target="_blank"
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-xs font-semibold text-sky-600 dark:text-[#38BDF8] border border-slate-200 dark:border-white/[0.06] flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </Link>

                      <Link
                        href="/company/applications"
                        className="px-3.5 py-1.5 rounded-lg bg-[#6366F1] hover:bg-[#4F46E5] text-xs font-semibold text-white transition-colors"
                      >
                        Review Applicants
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Opportunity Modal */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.1] rounded-2xl max-w-xl w-full p-6 sm:p-7 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-[#6366F1]" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create New Opportunity</h3>
                  </div>
                </div>

                <form onSubmit={handleCreateOpportunity} className="space-y-4 text-xs">
                  <div>
                    <label className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] block mb-1">
                      Opportunity Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Staff Full-Stack Engineer"
                      required
                      className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6366F1]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] block mb-1">
                        Opportunity Type
                      </label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as OpportunityType)}
                        className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="full_time">Full-Time</option>
                        <option value="part_time">Part-Time</option>
                        <option value="internship">Internship</option>
                        <option value="contract">Contract</option>
                        <option value="freelance">Freelance</option>
                        <option value="project">Project Opportunity</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] block mb-1">
                        Workplace Type
                      </label>
                      <select
                        value={workplaceType}
                        onChange={(e) => setWorkplaceType(e.target.value as WorkplaceType)}
                        className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                        <option value="onsite">Onsite</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] block mb-1">
                      Role Description & Responsibilities
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Outline the core engineering responsibilities and project scope..."
                      required
                      className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6366F1]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] block mb-1">
                      Required Skills (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={requiredSkillsStr}
                      onChange={(e) => setRequiredSkillsStr(e.target.value)}
                      placeholder="e.g. TypeScript, Next.js, PostgreSQL"
                      required
                      className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6366F1]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] block mb-1">
                      Required Capability Areas (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={requiredCapStr}
                      onChange={(e) => setRequiredCapStr(e.target.value)}
                      placeholder="e.g. Frontend Engineering, Full-Stack Development"
                      className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#6366F1]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] block mb-1">
                        Salary / Compensation Range
                      </label>
                      <input
                        type="text"
                        value={salaryRange}
                        onChange={(e) => setSalaryRange(e.target.value)}
                        placeholder="e.g. $140,000 - $180,000 USD"
                        className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-500 dark:text-[#64748B] block mb-1">
                        Experience Level
                      </label>
                      <select
                        value={experienceLevel}
                        onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                        className="w-full bg-slate-50 dark:bg-[#111722] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="Junior">Junior</option>
                        <option value="Mid-Level">Mid-Level</option>
                        <option value="Senior">Senior</option>
                        <option value="Lead">Lead</option>
                        <option value="Staff">Staff</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-5 py-2 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-[#6366F1]/25 transition-all"
                    >
                      {creating ? 'Publishing...' : 'Publish Opportunity'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
