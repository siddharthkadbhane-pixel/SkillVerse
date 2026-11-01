import { Metadata } from 'next';
import { db } from '@/lib/drizzle';
import { users } from '@/database/schema';
import { DeveloperCapabilityCardService } from '@/services/dcc/service';
import DCCPublicView from '@/components/dcc/DCCPublicView';
import Link from 'next/link';
import { Lock, ShieldAlert, ArrowLeft } from 'lucide-react';

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await params;
  const cleanUsername = username.trim().toLowerCase();

  let user: any = null;
  try {
    const allUsers = await db.query.users.findMany();
    user = allUsers.find(u => u.username.toLowerCase() === cleanUsername);
  } catch {}

  const displayName = user?.name || (cleanUsername === 'siddharthkadbhane-pixel' ? 'Sidharth Kadbhane' : username);
  const bio = user?.bio || 'Full Stack Engineer specializing in TypeScript, Next.js, PostgreSQL and Distributed AI Pipelines.';

  return {
    title: `${displayName} (@${username}) | Verified Developer Capability Card (DCC 2.0)`,
    description: `${bio} — Verified engineering evidence, AST code audit benchmarks, and capability history on SkillVerse.`,
    alternates: {
      canonical: `/developer/${username}`,
    },
    openGraph: {
      title: `${displayName} — Verified Developer Capability Card`,
      description: `${bio}`,
      url: `/developer/${username}`,
      siteName: 'SkillVerse',
      images: [
        {
          url: user?.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4',
          width: 800,
          height: 600,
          alt: `${displayName} Capability Card`,
        },
      ],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName} | Verified Developer Capability Card`,
      description: `${bio}`,
      images: [user?.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4'],
    },
  };
}

export default async function PublicDeveloperDCCPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  // Retrieve public DCC data using dedicated service method with privacy protection
  const publicData = await DeveloperCapabilityCardService.getPublicDCC(username);

  if (!publicData) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#070A0F] text-slate-900 dark:text-[#F8FAFC] p-4 text-center">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0D121A] border border-slate-200 dark:border-white/[0.08] max-w-md w-full space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[#7C3AED] dark:text-[#A78BFA] flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Developer Profile Unavailable</h2>
            <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-1 leading-relaxed">
              The developer capability profile for <strong className="text-slate-900 dark:text-white">@{username}</strong> was not found on SkillVerse.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Explore SkillVerse
          </Link>
        </div>
      </div>
    );
  }

  // Compile Schema.org JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    'mainEntity': {
      '@type': 'Person',
      'name': publicData.name || publicData.username,
      'alternateName': publicData.username,
      'description': publicData.bio,
      'image': publicData.avatarUrl,
      'knowsAbout': publicData.verifiedSkills?.map((s: any) => s.name) || [],
      'url': `https://skillverse.dev/developer/${publicData.username}`,
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DCCPublicView data={publicData} />
    </>
  );
}
