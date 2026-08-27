'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import ProgressRing from '@/components/ui/ProgressRing';
import {
  Users, Search, ShieldCheck, RefreshCw, BarChart3,
  Code, Cpu, TrendingUp, Award,
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' },
};

function CandidateCard({ dev, color }: { dev: any; color: string }) {
  if (!dev) return null;

  const dims = dev.dimensions;
  const metrics = dims ? [
    { label: 'Code Quality',  value: dims.engineering?.codeQuality ?? 0 },
    { label: 'Complexity',    value: dims.projects?.complexity ?? 0 },
    { label: 'Teamwork',      value: dims.collaboration?.teamwork ?? 0 },
    { label: 'Consistency',   value: dims.growth?.consistency ?? 0 },
    { label: 'Build Success', value: dims.projects?.buildSuccess ?? 0 },
  ] : [];

  const barFill = (v: number) =>
    v >= 80 ? '#2ECC71' : v >= 60 ? '#4F8CFF' : v >= 40 ? '#F4B740' : '#FF5C5C';

  return (
    <motion.div {...fadeUp} className="card p-6 flex flex-col gap-5">
      {/* Identity */}
      <div className="flex items-start justify-between pb-4 border-b border-subtle">
        <div>
          <span className="badge badge-blue font-semibold text-xs mb-1.5">{dev.level}</span>
          <h2 className="text-lg font-bold text-primary mt-1">{dev.name || dev.username}</h2>
          <span className="text-xs text-muted">@{dev.username}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-muted font-medium uppercase tracking-wider">Score</span>
          <ProgressRing
            value={dev.overallScore / 10}
            size={64}
            strokeWidth={4}
            color={color}
            label={String(dev.overallScore)}
          />
        </div>
      </div>

      {/* Metrics */}
      <div>
        <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Dimensions</h3>
        <div className="flex flex-col gap-3">
          {metrics.map(m => (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-secondary">{m.label}</span>
                <span className="text-xs font-semibold text-primary">{m.value}%</span>
              </div>
              <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: '#1B2028' }}>
                <motion.div
                  className="rounded-full"
                  style={{ height: '100%', background: barFill(m.value) }}
                  initial={{ width: 0 }}
                  animate={{ width: `${m.value}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      {dims?.skills && (
        <div>
          <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {[
              ...(dims.skills.web || []),
              ...(dims.skills.languages || []),
              ...(dims.skills.cloud || []),
              ...(dims.skills.devops || []),
            ].slice(0, 8).map((s: string) => (
              <span key={s} className="badge badge-default" style={{ fontSize: 11 }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Career */}
      {dims?.career && (
        <div className="flex items-center justify-between pt-3 border-t border-subtle">
          <span className="text-xs text-muted">Career Readiness</span>
          <span className="badge badge-blue" style={{ fontSize: 11 }}>{dims.career.readiness || 'N/A'}</span>
        </div>
      )}
    </motion.div>
  );
}

export default function RecruiterPage() {
  const [username1, setUsername1] = useState('health_test_dev');
  const [username2, setUsername2] = useState('');
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCompare = async () => {
    if (!username1 || !username2) {
      setError('Enter both developer usernames to compare.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/dcc/comparison?username1=${username1}&username2=${username2}`);
      const json = await res.json();
      if (json.success) {
        setComparison(json.data);
      } else {
        setError(json.error || 'Failed to compare candidates.');
      }
    } catch {
      setError('Failed to fetch developer profiles.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <Navbar user={null} breadcrumb="Recruiter Center" />
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <motion.div className="app-page" initial="initial" animate="animate">

            {/* Header */}
            <motion.div className="page-header" {...fadeUp}>
              <div>
                <h1 className="page-title">Candidate Comparison</h1>
                <p className="page-description">Side-by-side Developer Capability Card analysis</p>
              </div>
            </motion.div>

            {/* Search Form */}
            <motion.div {...fadeUp} className="card p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">Developer 1</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5" style={{ width: 14, height: 14, color: '#4B5563' }} />
                    <input
                      type="text"
                      placeholder="e.g. health_test_dev"
                      value={username1}
                      onChange={(e) => setUsername1(e.target.value)}
                      className="input pl-9"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">Developer 2</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5" style={{ width: 14, height: 14, color: '#4B5563' }} />
                    <input
                      type="text"
                      placeholder="e.g. other_dev"
                      value={username2}
                      onChange={(e) => setUsername2(e.target.value)}
                      className="input pl-9"
                    />
                  </div>
                </div>
              </div>

              {error && <p className="text-xs text-danger font-medium mb-3">{error}</p>}

              <button
                onClick={handleCompare}
                disabled={loading}
                className="btn btn-primary btn-md"
              >
                {loading ? <RefreshCw style={{ width: 14, height: 14 }} className="animate-spin" /> : <BarChart3 style={{ width: 14, height: 14 }} />}
                Compare Capabilities
              </button>
            </motion.div>

            {/* Results */}
            {comparison && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CandidateCard dev={comparison.developer1} color="#4F8CFF" />
                <CandidateCard dev={comparison.developer2} color="#2ECC71" />
              </div>
            )}

            {!comparison && !loading && (
              <div className="text-center py-16">
                <div className="flex items-center justify-center mx-auto mb-4 rounded-xl"
                     style={{ width: 56, height: 56, background: 'rgba(79,140,255,0.08)' }}>
                  <Users style={{ width: 24, height: 24, color: '#4F8CFF' }} />
                </div>
                <p className="text-sm text-muted">Enter two developer usernames above to compare their capability cards.</p>
              </div>
            )}

          </motion.div>
        </main>
      </div>
    </div>
  );
}
