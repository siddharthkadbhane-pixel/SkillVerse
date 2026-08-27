'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Calendar, Award, BookOpen, Clock, Heart, 
  Sparkles, Lock, ArrowLeft, Dna, GitBranch, Github 
} from 'lucide-react';
import Link from 'next/link';

export default function PublicPassportPage({ params }: { params: any }) {
  const unwrappedParams = React.use<{ username: string }>(params);
  const username = unwrappedParams.username;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [passportData, setPassportData] = useState<any>(null);
  const [reputation, setReputation] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [privacy, setPrivacy] = useState<any>(null);

  useEffect(() => {
    const loadPublicProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch User Public profile (Passport) details
        const profileRes = await fetch(`/api/profile?username=${username}`);
        const profileJson = await profileRes.json();
        
        if (!profileJson.success) {
          setError(profileJson.error || 'Developer not found');
          setLoading(false);
          return;
        }

        // Fetch user privacy settings
        const privacyRes = await fetch(`/api/privacy?username=${username}`);
        const privacyJson = await privacyRes.json();

        // Check if profile is set to private
        const priv = privacyJson.data;
        setPrivacy(priv);
        if (priv && priv.profileVisibility === 'private') {
          setPassportData(profileJson.data); // save user details only
          setLoading(false);
          return;
        }

        setPassportData(profileJson.data);

        // Fetch reputation and timeline
        const [repRes, timeRes] = await Promise.all([
          fetch(`/api/reputation?username=${username}`).then(r => r.json()),
          fetch(`/api/timeline?username=${username}`).then(r => r.json()),
        ]);

        if (repRes.success) setReputation(repRes.data);
        if (timeRes.success) setTimeline(timeRes.data || []);

      } catch (err: any) {
        setError(err.message || 'Error fetching public details');
      } finally {
        setLoading(false);
      }
    };
    loadPublicProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center items-center gap-4">
        <span className="sv-spinner h-8 w-8 text-violet-500" />
        <p className="text-zinc-400 text-xs">Accessing verified Developer Passport...</p>
      </div>
    );
  }

  if (error || !passportData) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center items-center gap-3 text-center px-4">
        <Lock className="h-12 w-12 text-zinc-700" />
        <h1 className="text-lg font-black tracking-tight">Developer Profile Locked</h1>
        <p className="text-xs text-zinc-400 max-w-sm">{error || 'This Developer Passport details are not public.'}</p>
        <Link href="/dashboard" className="text-xs text-violet-400 hover:underline mt-2">Return to SkillVerse</Link>
      </div>
    );
  }

  const isPrivate = privacy && privacy.profileVisibility === 'private';
  const profileUser = passportData.profile || {};
  const trust = passportData.trustScore || {};

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col p-6 sm:p-12 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
        
        {/* Navigation */}
        <div className="flex justify-between items-center pb-4 border-b border-zinc-900">
          <Link href="/dashboard" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 font-bold">
            <ArrowLeft className="h-4 w-4" />
            SkillVerse Platform
          </Link>
          <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">Public Passport</span>
        </div>

        {/* Profile Card Header */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border border-zinc-850">
          <div className="flex items-center gap-4.5">
            {profileUser.avatarUrl ? (
              <img src={profileUser.avatarUrl} alt={username} className="h-16 w-16 rounded-full border-2 border-violet-500 object-cover shrink-0" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-violet-600/10 border-2 border-violet-500/20 flex items-center justify-center shrink-0">
                <Dna className="h-7 w-7 text-violet-400" />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-black tracking-tight">{profileUser.name || username}</h1>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">@{username}</span>
                <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  <ShieldCheck className="h-3 w-3" />
                  Verified Talent
                </span>
              </div>
            </div>
          </div>

          {!isPrivate && trust.overallScore && (
            <div className="flex flex-col items-end shrink-0">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Trust score DNA</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-emerald-400">{trust.overallScore}</span>
                <span className="text-[10px] text-zinc-500 font-semibold">/1000</span>
              </div>
            </div>
          )}
        </div>

        {/* Private Profile Notice */}
        {isPrivate ? (
          <div className="glass-card rounded-xl p-12 text-center flex flex-col items-center gap-3">
            <Lock className="h-8 w-8 text-zinc-600" />
            <h3 className="text-sm font-bold text-zinc-300">Privacy Restriction Enabled</h3>
            <p className="text-[11px] text-zinc-500 max-w-sm leading-relaxed">
              This developer has set their SkillVerse Passport visibility to Private. Only connected recruiters and verified partners can request view access.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* Reputation Category Grid */}
            {reputation && (
              <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-900 pb-2">Reputation Profile Breakdown</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Engineering Reputation', val: reputation.engineering, color: 'text-violet-400' },
                    { label: 'Open Source', val: reputation.openSource, color: 'text-blue-400' },
                    { label: 'Mentorship Reputation', val: reputation.mentorship, color: 'text-emerald-400' },
                    { label: 'Community Hub', val: reputation.community, color: 'text-amber-400' },
                    { label: 'Learning Velocity', val: reputation.learning, color: 'text-sky-400' },
                    { label: 'Challenges Completed', val: reputation.challenge, color: 'text-rose-400' },
                  ].map((repItem, idx) => (
                    <div key={idx} className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between h-24">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase">{repItem.label}</span>
                      <div className="flex items-baseline gap-1 mt-auto">
                        <span className={`text-2xl font-black ${repItem.color}`}>{repItem.val}</span>
                        <span className="text-[9px] text-zinc-600">/1000</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills DNA List */}
            {passportData.skills && passportData.skills.length > 0 && (
              <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-900 pb-2">Verified Skill DNA</h3>
                <div className="flex flex-wrap gap-2">
                  {passportData.skills.map((skill: any, idx: number) => (
                    <span key={idx} className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-zinc-300 font-medium">
                      {skill.name} <b className="text-violet-400 font-bold ml-1">Lvl {skill.level}</b>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline Milestones */}
            <div className="glass-card rounded-2xl p-6 flex flex-col gap-5">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-900 pb-2">Engineering Timeline</h3>
              <div className="relative pl-6 border-l border-zinc-900 flex flex-col gap-6">
                {timeline.map((evt: any) => (
                  <div key={evt.id} className="relative">
                    <span className="absolute -left-[30px] top-1.5 h-3.5 w-3.5 rounded-full border-4 border-zinc-950 bg-violet-600" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-zinc-200">{evt.title}</span>
                      <span className="text-[10px] text-zinc-400 font-semibold">{evt.description}</span>
                      <span className="text-[9px] text-zinc-600 mt-1">{new Date(evt.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
