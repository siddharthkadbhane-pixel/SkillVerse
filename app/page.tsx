'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Code2,
  Terminal,
  Cpu,
  Globe,
  Check,
  X,
  ShieldCheck,
  Sparkles,
  Search,
  Github,
  TrendingUp,
  Layers,
  Award,
  Zap,
  ExternalLink,
} from 'lucide-react';
import ThemeToggle from '@/components/theme/ThemeToggle';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-canvas text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-indigo-500/30 selection:text-indigo-200 aurora-bg dot-matrix transition-colors duration-200">

      {/* Immersive radial glow lights */}
      <div className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] ambient-glow-1 pointer-events-none" />
      <div className="absolute top-[40%] right-[-5%] w-[600px] h-[600px] ambient-glow-2 pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[5%] w-[500px] h-[500px] ambient-glow-3 pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/75 dark:bg-[#070A0F]/80 backdrop-blur-xl border-slate-200/80 dark:border-white/[0.08] transition-colors duration-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white heading-font">
              SkillVerse
            </span>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <Link href="/" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors">
              Home
            </Link>
            <a href="#developers" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              For Developers
            </a>
            <a href="#companies" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              For Companies
            </a>
            <a href="#pipeline" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Resources
            </a>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.10] border border-slate-200 dark:border-white/[0.08] rounded-xl transition-all active:scale-95"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 px-4.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl shadow-md shadow-indigo-600/25 transition-all active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 z-10 flex flex-col gap-28 sm:gap-36 items-center">

        {/* ================================================================= */}
        {/* Hero Section: 2-Column Split matching reference layout           */}
        {/* ================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full">

          {/* Left Column: Headline & Value Proposition */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-left items-start">

            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/25 px-3.5 py-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <span>Verified Skills • Real Projects • Actual Impact</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] heading-font text-slate-900 dark:text-white">
              Prove your code.{<br />}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-400 dark:from-indigo-400 dark:via-blue-400 dark:to-cyan-300">
                Skip the resume.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed font-normal">
              SkillVerse helps developers showcase their real skills through verified code, project evidence and a unique Developer Capability Card — because your code speaks louder than your resume.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl text-white font-bold px-7 py-3.5 text-xs sm:text-sm bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-indigo-600/25 transition-all active:scale-95 group"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.10] text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/[0.10] font-semibold px-6 py-3.5 text-xs sm:text-sm transition-all active:scale-95"
              >
                Explore Features
              </a>
            </div>

            {/* 3 Sub-Features Pills below CTAs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-6 w-full border-t border-slate-200/80 dark:border-white/[0.08]">
              <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold">Verified Skills</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Real project evidence</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold">Capability Card</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Your verified profile</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 shrink-0">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold">Growth Tracking</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">See your progress</div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Floating 3D Perspective Developer Capability Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end relative perspective-1000">

            {/* Ambient radiant glow behind card */}
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/25 via-blue-500/25 to-teal-500/15 rounded-3xl blur-2xl opacity-75 pointer-events-none" />

            {/* Developer Capability Card Component */}
            <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0E1420] border border-slate-200 dark:border-indigo-500/30 p-6 sm:p-7 shadow-2xl dark:shadow-indigo-500/10 tilt-card select-none">

              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.08]">
                <span className="text-xs font-bold tracking-tight text-slate-700 dark:text-slate-200">
                  Developer Capability Card
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-teal-500/10 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />
                  Verified
                </span>
              </div>

              {/* Developer Profile Header */}
              <div className="flex items-center gap-3.5 pt-5 pb-4">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 via-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold text-base shadow-md">
                    AK
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0E1420]" />
                </div>

                <div className="flex flex-col">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Alex Kumar
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Full Stack Developer
                  </span>
                </div>
              </div>

              {/* Skill Badges */}
              <div className="flex flex-wrap gap-1.5 pb-5">
                {['React', 'Node.js', 'PostgreSQL', 'TypeScript'].map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Trust Score Box with Dynamic Sparkline */}
              <div className="rounded-xl p-4 bg-slate-50 dark:bg-[#121927] border border-slate-200/80 dark:border-white/[0.08] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Trust Score
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-3 h-3" />
                    +12%
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    820
                  </div>

                  {/* SVG Upward Sparkline Wave */}
                  <div className="w-32 h-8">
                    <svg viewBox="0 0 120 30" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0 25 C20 22, 35 26, 50 16 C65 6, 85 14, 100 8 C108 5, 115 4, 120 2"
                        fill="none"
                        stroke="#14B8A6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M0 25 C20 22, 35 26, 50 16 C65 6, 85 14, 100 8 C108 5, 115 4, 120 2 L120 30 L0 30 Z"
                        fill="url(#sparklineGrad)"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Stats Grid: Projects / Contributions / Experience */}
              <div className="grid grid-cols-3 gap-2 pt-4 text-center">
                <div className="rounded-lg p-2.5 bg-slate-50/80 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.04]">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Projects</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">12</div>
                </div>
                <div className="rounded-lg p-2.5 bg-slate-50/80 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.04]">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Contributions</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">248</div>
                </div>
                <div className="rounded-lg p-2.5 bg-slate-50/80 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.04]">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Experience</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">3+ years</div>
                </div>
              </div>

            </div>

          </div>

        </section>

        {/* ================================================================= */}
        {/* Feature Cards Grid: Everything you need to prove your skills     */}
        {/* ================================================================= */}
        <section id="features" className="w-full flex flex-col gap-10">
          <div className="text-center flex flex-col gap-2.5 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight heading-font">
              Everything you need to prove your skills
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Cryptographic telemetry, automated AST codebase analysis, and tamper-resistant passports replacing unverified resumes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-2">
            {[
              {
                icon: Code2,
                title: 'Verified Skills',
                desc: 'Showcase your real technical skills with evidence from actual projects and contributions.',
                link: '/skills',
                color: 'text-indigo-500 dark:text-indigo-400',
                border: 'group-hover:border-indigo-500/50',
              },
              {
                icon: Github,
                title: 'Repository Evidence',
                desc: 'Link your GitHub repositories and let your code and commit telemetry do the talking.',
                link: '/github',
                color: 'text-blue-500 dark:text-blue-400',
                border: 'group-hover:border-blue-500/50',
              },
              {
                icon: ShieldCheck,
                title: 'Developer Capability Card',
                desc: 'Get a verifiable card that showcases your skills, experience and trust score.',
                link: '/career',
                color: 'text-teal-500 dark:text-teal-400',
                border: 'group-hover:border-teal-500/50',
              },
              {
                icon: TrendingUp,
                title: 'Growth History',
                desc: 'Track your skill development, code velocity, and see your progress over time.',
                link: '/activity',
                color: 'text-cyan-500 dark:text-cyan-400',
                border: 'group-hover:border-cyan-500/50',
              },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className={`rounded-2xl p-6 bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] shadow-sm hover:shadow-lg dark:hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between gap-6 group ${card.border}`}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-center rounded-xl w-11 h-11 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/[0.08]">
                      <Icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {card.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-2">
                        {card.desc}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={card.link}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 group-hover:translate-x-1 transition-all"
                  >
                    <span>Learn more</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================================================================= */}
        {/* Split Showcase: For Developers                                   */}
        {/* ================================================================= */}
        <section id="developers" className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center w-full pt-4">

          {/* Left Details */}
          <div className="lg:col-span-6 flex flex-col gap-5 text-left items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20">
              For Developers
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white heading-font">
              Build your reputation with real proof
            </h2>

            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
              Connect your GitHub, showcase your projects, get verified by the community and grow your engineering career with SkillVerse.
            </p>

            <ul className="flex flex-col gap-3 pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Showcase real projects with repository telemetry</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Get verified by automated AST code quality checks</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Track your skill growth and velocity over time</span>
              </li>
            </ul>

            <Link
              href="/login"
              className="mt-3 inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right Live-look Mini Dashboard Preview */}
          <div className="lg:col-span-6 w-full rounded-2xl bg-white dark:bg-[#0E1420] border border-slate-200 dark:border-white/[0.08] p-6 shadow-xl dark:shadow-2xl">

            {/* Header with Tabs */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">Overview</span>
                <span className="px-2.5 py-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">Skills</span>
                <span className="px-2.5 py-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">Projects</span>
                <span className="px-2.5 py-1 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">Growth</span>
              </div>
            </div>

            {/* Profile snippet */}
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                  AK
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Alex Kumar</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Full Stack Engineer</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">820 Trust</div>
                <div className="text-[10px] text-emerald-500 font-semibold">Top 5% Tier</div>
              </div>
            </div>

            {/* Verified Project Card Snippet */}
            <div className="rounded-xl p-4 bg-slate-50 dark:bg-[#121927] border border-slate-200/80 dark:border-white/[0.08] flex flex-col gap-2.5 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Featured Project</span>
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full">Audited</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">E-Commerce Platform</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">High-throughput microservices architecture</p>
                </div>
                <Link href="/projects" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 p-1">
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>

              <div className="flex gap-1.5 pt-1">
                {['React', 'Node.js', 'PostgreSQL'].map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>

          </div>

        </section>

        {/* ================================================================= */}
        {/* Split Showcase: For Companies / Hiring                            */}
        {/* ================================================================= */}
        <section id="companies" className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center w-full pt-4">

          {/* Left Preview: Enterprise Talent Match Box */}
          <div className="order-2 lg:order-1 lg:col-span-6 w-full rounded-2xl bg-white dark:bg-[#0E1420] border border-slate-200 dark:border-white/[0.08] p-6 shadow-xl dark:shadow-2xl">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-white/[0.08]">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Engineering Talent Pool</span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">100% Code-Audited</span>
            </div>

            <div className="flex flex-col gap-2.5 pt-3.5">
              {[
                { name: 'Sarah Chen', role: 'Staff Systems Architect', score: 890, skills: ['Go', 'Kubernetes', 'Distributed DB'] },
                { name: 'Alex Rivera', role: 'Lead Frontend Engineer', score: 840, skills: ['Next.js', 'TypeScript', 'Tailwind'] },
                { name: 'Marcus Vance', role: 'Security & Backend Engineer', score: 810, skills: ['PostgreSQL', 'Rust', 'OAuth/JWT'] },
              ].map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#121927] border border-slate-200/80 dark:border-white/[0.06] hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200">
                      {c.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{c.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{c.role}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{c.score} Trust</div>
                    <div className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">Verified</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Details */}
          <div className="order-1 lg:order-2 lg:col-span-6 flex flex-col gap-5 text-left items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 px-3 py-1 rounded-md bg-blue-500/10 border border-blue-500/20">
              For Companies
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white heading-font">
              Hire with confidence. Zero resume noise.
            </h2>

            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
              Filter candidates by audited code telemetry, repository architecture quality, and tamper-resistant trust scores. Skip initial screening loops with verified proof.
            </p>

            <ul className="flex flex-col gap-3 pt-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Evaluate commit velocity and AST structural architecture</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Compare candidate competencies on standardized benchmarks</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Eliminate false positives and recruitment mismatches</span>
              </li>
            </ul>

            <Link
              href="/developers"
              className="mt-3 inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.10] border border-slate-200 dark:border-white/[0.10] rounded-xl transition-all active:scale-95"
            >
              <span>Explore Talent Discovery</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </section>

        {/* ================================================================= */}
        {/* How It Works Pipeline                                             */}
        {/* ================================================================= */}
        <section id="pipeline" className="w-full flex flex-col gap-10">
          <div className="text-center flex flex-col gap-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight heading-font">
              The Code Verification Pipeline
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              How repository structures are parsed, audited, and converted to cryptographic proof.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-2">
            {[
              {
                icon: Code2,
                title: '1. Fetch Manifests',
                desc: 'Scans package declarations, commit history, and AST structures.',
                color: 'text-indigo-500 dark:text-indigo-400',
              },
              {
                icon: Terminal,
                title: '2. Context Compilation',
                desc: 'Compiles file metrics, architectural patterns, and design patterns.',
                color: 'text-blue-500 dark:text-blue-400',
              },
              {
                icon: Cpu,
                title: '3. Inference Audit',
                desc: 'Evaluates codebase depth through rigorous verification algorithms.',
                color: 'text-cyan-500 dark:text-cyan-400',
              },
              {
                icon: Globe,
                title: '4. Score Publication',
                desc: 'Publishes your verified Capability Card and tamper-resistant trust score.',
                color: 'text-teal-500 dark:text-teal-400',
              },
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl p-6 bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] shadow-sm flex flex-col gap-4 group hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-all"
                >
                  <div className="flex items-center justify-center rounded-xl w-10 h-10 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/[0.08]">
                    <Icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1.5">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================================================================= */}
        {/* Call to Action Banner                                             */}
        {/* ================================================================= */}
        <section className="w-full rounded-3xl bg-gradient-to-tr from-indigo-900/40 via-blue-900/30 to-slate-900/60 dark:from-indigo-950/60 dark:via-blue-950/40 dark:to-[#070A0F] border border-indigo-500/20 p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-5">
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight heading-font">
              Ready to prove your code?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg">
              Join engineering talent showcasing verifiable capability, or discover developers vetted by actual repository telemetry.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-7 py-3.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                <span>Get Started with GitHub</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/developers"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl transition-all active:scale-95"
              >
                Discover Developers
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-white/[0.08] py-12 text-xs text-slate-500 dark:text-slate-400 z-10 relative bg-white/40 dark:bg-black/20 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Shield className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white heading-font">SkillVerse</span>
            <span className="text-slate-400 dark:text-slate-600 ml-2">© 2026 SkillVerse Inc. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px] font-medium">
            <Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Cookie Policy</Link>
            <Link href="/contact/privacy" className="hover:text-indigo-600 dark:hover:text-white transition-colors">Privacy Request</Link>
            <Link href="/api/health" className="hover:text-indigo-600 dark:hover:text-white transition-colors">System Health</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
