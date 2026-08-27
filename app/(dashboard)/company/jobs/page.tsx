'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import SkillChip from '@/components/ui/SkillChip';
import EmptyState from '@/components/ui/EmptyState';
import {
  Briefcase,
  Plus,
  Search,
  Users,
  MapPin,
  DollarSign,
  Calendar,
  Sparkles,
  CheckCircle2,
  X,
} from 'lucide-react';
import { DUMMY_JOBS } from '@/lib/dummyData';

export default function CompanyJobsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>(DUMMY_JOBS);
  const [selectedTab, setSelectedTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Job Form State
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('Remote');
  const [salary, setSalary] = useState('$180,000 - $220,000');
  const [skills, setSkills] = useState('TypeScript, Next.js, Rust');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data.profile);
      })
      .catch(() => {});
  }, []);

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newJob = {
      id: `job_${Date.now()}`,
      title,
      companyName: 'Hyperion AI',
      location,
      salaryRange: salary,
      requirements: skills.split(',').map((s) => s.trim()),
      minTrustScore: 800,
      description: description || 'Responsible for architecting frontier technical systems.',
      createdAt: new Date().toISOString(),
      status: 'Active',
      candidatesCount: 14,
      shortlistedCount: 3,
    };

    setJobs([newJob, ...jobs]);
    setTitle('');
    setDescription('');
    setShowCreateModal(false);
  };

  const tabs = ['All', 'Active', 'Draft', 'Closed'];

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070A0F] text-[#F8FAFC]">
      <Sidebar user={profile} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={profile} breadcrumb="Manage Jobs" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <PageHeader
            title="Active Positions & Job Management"
            description="Manage engineering vacancies and match candidates automatically with AST technical proof."
            badge={{ text: `${jobs.length} Positions`, variant: 'primary' }}
          >
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Create New Job
            </button>
          </PageHeader>

          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Openings" value={jobs.length} icon={Briefcase} iconColor="text-[#38BDF8]" />
            <StatCard label="Total Candidates" value="68" trend={{ value: '+12 this week', isPositive: true }} icon={Users} iconColor="text-[#7C3AED]" />
            <StatCard label="Shortlisted Pipeline" value="18" icon={Sparkles} iconColor="text-[#10B981]" />
            <StatCard label="Avg Time to Match" value="3.4 Days" icon={Calendar} iconColor="text-[#F59E0B]" />
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0D121A] border border-white/[0.08] p-3 rounded-xl">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedTab === tab
                      ? 'bg-[#7C3AED] text-white'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search job titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111722] border border-white/[0.08] hover:border-white/[0.14] focus:border-[#7C3AED]/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F8FAFC] placeholder-[#64748B] outline-none transition-all"
              />
            </div>
          </div>

          {/* Jobs List */}
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-[#0D121A] hover:bg-[#111722] border border-white/[0.08] hover:border-white/[0.14] rounded-xl p-5 transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-bold text-sm text-[#F8FAFC] group-hover:text-[#A78BFA] transition-colors">
                      {job.title}
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30">
                      Active
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[#F8FAFC]">
                      <DollarSign className="w-3.5 h-3.5 text-[#10B981]" />
                      {job.salaryRange}
                    </span>
                    <span className="font-mono text-[11px] text-[#A78BFA]">
                      Min Trust: {job.minTrustScore}+
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(job.requirements || []).map((req: string, i: number) => (
                      <SkillChip key={i} name={req} size="sm" verified={false} />
                    ))}
                  </div>
                </div>

                {/* Pipeline Stats & Actions */}
                <div className="flex items-center gap-4 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-white/[0.06]">
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-[#38BDF8] block">
                      18 Candidates
                    </span>
                    <span className="text-[10px] text-[#64748B]">4 Shortlisted</span>
                  </div>

                  <Link
                    href={`/company/pipeline`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors"
                  >
                    View Pipeline
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Create Job Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <form
                onSubmit={handleCreateJob}
                className="bg-[#0D121A] border border-white/[0.12] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative"
              >
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="absolute right-4 top-4 p-1.5 rounded-lg text-[#64748B] hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
                  <Briefcase className="w-5 h-5 text-[#7C3AED]" />
                  <h2 className="text-base font-bold text-[#F8FAFC]">Create Engineering Position</h2>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[#94A3B8] font-medium mb-1">Job Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Principal Distributed Systems Architect"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-[#111722] border border-white/[0.08] focus:border-[#7C3AED]/50 rounded-lg px-3 py-2 text-[#F8FAFC] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#94A3B8] font-medium mb-1">Work Location</label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-[#111722] border border-white/[0.08] focus:border-[#7C3AED]/50 rounded-lg px-3 py-2 text-[#F8FAFC] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[#94A3B8] font-medium mb-1">Salary Range</label>
                      <input
                        type="text"
                        value={salary}
                        onChange={(e) => setSalary(e.target.value)}
                        className="w-full bg-[#111722] border border-white/[0.08] focus:border-[#7C3AED]/50 rounded-lg px-3 py-2 text-[#F8FAFC] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#94A3B8] font-medium mb-1">Required Skills (Comma separated)</label>
                    <input
                      type="text"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      className="w-full bg-[#111722] border border-white/[0.08] focus:border-[#7C3AED]/50 rounded-lg px-3 py-2 text-[#F8FAFC] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#94A3B8] font-medium mb-1">Job Description & Responsibilities</label>
                    <textarea
                      rows={3}
                      placeholder="Details on engineering challenges, scale, and stack..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-[#111722] border border-white/[0.08] focus:border-[#7C3AED]/50 rounded-lg px-3 py-2 text-[#F8FAFC] outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#111722] hover:bg-[#151B26] border border-white/[0.08] text-[#94A3B8]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#7C3AED] hover:bg-[#8B5CF6] text-white"
                  >
                    Publish Position
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
