'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import Skeleton from '@/components/ui/Skeleton';
import DCCHeader from '@/components/dcc/DCCHeader';
import DCCCapabilityOverview from '@/components/dcc/DCCCapabilityOverview';
import DCCVerifiedSkills from '@/components/dcc/DCCVerifiedSkills';
import DCCEngineeringCapability from '@/components/dcc/DCCEngineeringCapability';
import DCCProjectEvidence from '@/components/dcc/DCCProjectEvidence';
import DCCGrowthHistory from '@/components/dcc/DCCGrowthHistory';
import DCCShareModal from '@/components/dcc/DCCShareModal';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { DCCFullData } from '@/types/dcc';

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

export default function DCCPage() {
  const [data, setData] = useState<DCCFullData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/dcc');
      const json = await res.json();

      if (json.success && json.data) {
        setData(json.data);
      } else {
        setError(json.error || 'Failed to load Developer Capability Card.');
      }
    } catch (err: any) {
      console.error('Failed to load DCC data:', err);
      setError(err.message || 'Network error while loading capability card.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegenerate = async () => {
    if (regenerating) return;
    setRegenerating(true);
    try {
      const res = await fetch('/api/dcc/regenerate', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        await loadData();
      }
    } catch (err) {
      console.error('Failed to recalculate DCC:', err);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="app-shell">
      <Navbar user={data?.developer as any} breadcrumb="Capability Card 2.0" />
      <div className="app-layout">
        <Sidebar trustScore={{ overallScore: data?.card.overallScore || 800 }} />
        <main className="app-main">
          <motion.div className="app-page max-w-7xl mx-auto px-4 sm:px-6 py-6" initial="initial" animate="animate">
            
            {loading ? (
              <div className="flex flex-col gap-6">
                <Skeleton height={140} className="rounded-xl" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <Skeleton height={200} className="lg:col-span-5 rounded-xl" />
                  <Skeleton height={200} className="lg:col-span-7 rounded-xl" />
                </div>
                <Skeleton height={300} className="rounded-xl" />
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center flex flex-col items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <h3 className="text-base font-semibold text-white">Capability Card Unavailable</h3>
                <p className="text-xs text-zinc-400 max-w-md">{error}</p>
                <button
                  onClick={loadData}
                  className="mt-2 px-4 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-all"
                >
                  Retry Loading
                </button>
              </div>
            ) : data ? (
              <div className="flex flex-col gap-6">
                
                {/* 1. Developer Header */}
                <motion.div {...fadeUp}>
                  <DCCHeader
                    developer={data.developer}
                    card={data.card}
                    onRegenerate={handleRegenerate}
                    onShare={() => setIsShareModalOpen(true)}
                    isRegenerating={regenerating}
                  />
                </motion.div>

                {/* 2. Capability Overview (30s Scannable Matrix) */}
                <motion.div {...fadeUp}>
                  <DCCCapabilityOverview
                    card={data.card}
                    dimensions={data.dimensions}
                    insights={data.insights}
                  />
                </motion.div>

                {/* 3. Verified Skills & Proofs */}
                <motion.div {...fadeUp}>
                  <DCCVerifiedSkills skills={data.verifiedSkills} />
                </motion.div>

                {/* 4. Engineering Capability */}
                <motion.div {...fadeUp}>
                  <DCCEngineeringCapability metrics={data.engineeringMetrics} />
                </motion.div>

                {/* 5. Project Evidence Cards */}
                <motion.div {...fadeUp}>
                  <DCCProjectEvidence projects={data.projectEvidence} />
                </motion.div>

                {/* 6. Skill Growth & Actionable Upgrades */}
                <motion.div {...fadeUp}>
                  <DCCGrowthHistory 
                    history={data.history} 
                    timeline={data.timeline} 
                    growthChart={data.growthChart} 
                    insights={data.insights} 
                  />
                </motion.div>

                {/* Share Modal */}
                <DCCShareModal
                  username={data.developer.username}
                  isOpen={isShareModalOpen}
                  onClose={() => setIsShareModalOpen(false)}
                  overallScore={data.card.overallScore}
                  level={data.card.level}
                />

              </div>
            ) : null}

          </motion.div>
        </main>
      </div>
    </div>
  );
}
