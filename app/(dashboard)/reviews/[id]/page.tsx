'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import ReviewDetails, { ReviewData } from '@/features/analyzer/ReviewDetails';

export default function ReviewDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<ReviewData | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const loadReview = async () => {
      try {
        // Fetch profile
        const profRes = await fetch('/api/profile');
        const profJson = await profRes.json();
        if (profJson.success) {
          setProfile(profJson.data);
        }

        // Mock loading reviews for demo values
        // Normally: await fetch(`/api/reviews/${id}`)
        setTimeout(() => {
          setReview({
            id: id || 'rev_001',
            summary: 'The project structure follows Next.js App Router guidelines correctly. Dependencies are clean, modern, and minimal. Excellent use of TypeScript interfaces for strong contracts.',
            strengths: [
              'Uses strict TypeScript configurations with zero compile warnings',
              'Subtle and efficient component separation using React Hook Form',
              'Proper indexing in SQL schema declarations',
            ],
            weaknesses: [
              'Lacks end-to-end automated tests',
              'Missing Docker container configuration for sandbox deployments',
            ],
            architecture: 'Modern Next.js 15 App Router architecture. Code logic is separated into app layout components, and api route handlers. Excellent folder cleanliness.',
            codeQuality: 'High code quality, clean SOLID implementations. Strong typing bounds. Modular logic keeps component bundles light.',
            documentation: 'Readme file details core capabilities. Suggested: Add comprehensive JSDoc descriptions on API routes.',
            bestPractices: 'Follows recommended ESLint rules, optimizes image patterns, and sets appropriate cache boundaries.',
            suggestedLearning: [
              'Integrate Playwright / Cypress for front-end interface testing',
              'Add Dockerfile configurations to set up reproducible local runtimes',
            ],
            overallScore: 88,
            confidenceScore: 92,
            createdAt: new Date().toISOString(),
          });
          setLoading(false);
        }, 600);
      } catch {
        setLoading(false);
      }
    };

    loadReview();
  }, [id]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
      <Navbar user={profile?.profile} />
      <div className="flex flex-1">
        <Sidebar trustScore={profile?.trustScore} />
        <main className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <svg className="animate-spin h-8 w-8 text-violet-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : review ? (
            <ReviewDetails review={review} repoName="nextjs-ai-agent" htmlUrl="https://github.com/siddharthkadbhane-pixel/nextjs-ai-agent" />
          ) : (
            <div className="text-center py-20 text-zinc-500">Review not found</div>
          )}
        </main>
      </div>
    </div>
  );
}
