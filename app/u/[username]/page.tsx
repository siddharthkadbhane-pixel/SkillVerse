import { Metadata } from 'next';
import { db } from '@/lib/drizzle';
import { users, passports, repositories, reviews, trustScores, skillDna } from '@/database/schema';
import { PassportBadgeService } from '@/services/passport/badge';
import { PassportTimelineService } from '@/services/passport/timeline';
import { getDummyUserByUsername } from '@/lib/dummyData';
import { eq, and } from 'drizzle-orm';
import ProfileClientView from './ProfileClientView';

// Next.js 15 Server-Side Dynamic SEO Metadata Generator
export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await params;

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!user) {
      return {
        title: 'Developer Profile | SkillVerse',
        description: 'Verified developer rep scorecard and skill passports.',
      };
    }

    return {
      title: `${user.name} (@${user.username}) | Verified Skill DNA Passport`,
      description: `${user.bio || `${user.name}'s verified developer passport, trust score scorecard, and codebase reviews on SkillVerse.`}`,
      alternates: {
        canonical: `/u/${user.username}`,
      },
      openGraph: {
        title: `${user.name} - Verified Developer Reputation Passport`,
        description: `${user.bio || 'Analyzed code telemetry scores and capability DNA.'}`,
        url: `/u/${user.username}`,
        images: [
          {
            url: user.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4',
            width: 800,
            height: 600,
            alt: `${user.name} Avatar`,
          },
        ],
        type: 'profile',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${user.name} | Verified Developer Rep Passport`,
        description: `${user.bio || 'Verified code telemetry scores and capability DNA.'}`,
        images: [user.avatarUrl || 'https://avatars.githubusercontent.com/u/84218321?v=4'],
      },
    };
  } catch {
    return {
      title: 'Sidharth Kadbhane (@siddharthkadbhane-pixel) | Verified Skill DNA Passport',
      description: 'Full Stack Engineer specializing in TypeScript, Next.js, PostgreSQL and Distributed AI Pipelines.',
    };
  }
}

// Server Component fetching the initial data
export default async function PublicProfilePage(
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // Resolve user from DB or Dummy Users
  let userRecord: any = null;
  try {
    userRecord = await db.query.users.findFirst({
      where: eq(users.username, username),
    });
  } catch {}

  // Mock profile fallback
  if (!userRecord) {
    const dummy = getDummyUserByUsername(username);
    userRecord = {
      id: dummy.id,
      email: dummy.email,
      name: dummy.name,
      username: dummy.username,
      avatarUrl: dummy.avatarUrl,
      bio: dummy.bio,
      website: dummy.website,
      location: dummy.location,
      role: dummy.role,
      githubToken: null,
      githubId: dummy.githubId,
      companyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  const resolvedUser = userRecord!;

  // Get settings & increase views
  let passportRecord = await db.query.passports.findFirst({
    where: eq(passports.userId, resolvedUser.id),
  });

  const trustScore = await db.query.trustScores.findFirst({
    where: eq(trustScores.userId, resolvedUser.id),
  });

  const skillDnaRecord = await db.query.skillDna.findFirst({
    where: eq(skillDna.userId, resolvedUser.id),
  });

  const repos = await db.query.repositories.findMany({
    where: and(
      eq(repositories.userId, resolvedUser.id),
      eq(repositories.isAnalyzed, true)
    ),
  });

  const verifiedRepos = [];
  for (const repo of repos) {
    const reviewRecord = await db.query.reviews.findFirst({
      where: eq(reviews.repositoryId, repo.id),
    });

    verifiedRepos.push({
      id: repo.id,
      name: repo.name,
      fullName: repo.fullName,
      description: repo.description,
      htmlUrl: repo.htmlUrl,
      language: repo.language,
      stars: repo.stars,
      forks: repo.forks,
      analyzedAt: repo.analyzedAt ? repo.analyzedAt.toISOString() : null,
      review: reviewRecord ? {
        overallScore: reviewRecord.overallScore,
        summary: reviewRecord.summary,
        strengths: reviewRecord.strengths,
        weaknesses: reviewRecord.weaknesses,
        architecture: reviewRecord.architecture,
        codeQuality: reviewRecord.codeQuality,
        documentation: reviewRecord.documentation,
        bestPractices: reviewRecord.bestPractices,
      } : null,
    });
  }

  const badges = await PassportBadgeService.calculateBadgesForUser(resolvedUser.id);
  const timeline = await PassportTimelineService.compileTimelineForUser(resolvedUser.id);

  const initialData = {
    profile: {
      ...resolvedUser,
      createdAt: resolvedUser.createdAt.toISOString(),
      updatedAt: resolvedUser.updatedAt.toISOString(),
    },
    passport: passportRecord ? {
      ...passportRecord,
      lastGeneratedAt: passportRecord.lastGeneratedAt.toISOString(),
    } : {
      visibility: 'public',
      theme: 'dark',
      viewCount: 15,
    },
    trustScore: trustScore || {
      overallScore: 840,
      confidence: 85,
      engineVersion: '1.0.0',
      explanation: 'Calculated reputational metrics from codebase audits.',
      categoryScores: {
        codeQuality: 85,
        maintainability: 82,
        security: 78,
        performance: 88,
        testing: 20,
        gitActivity: 75,
        documentation: 80,
      }
    },
    skillDna: skillDnaRecord?.dnaStructure || {
      overallLevel: 75,
      skills: [
        { name: 'TypeScript', category: 'Programming Languages', level: 85, confidence: 90, evidenceCount: 5, repositoryCount: 2, lastVerified: new Date().toISOString(), growthTrend: 15, verificationStatus: 'verified' },
        { name: 'React', category: 'Frontend', level: 82, confidence: 90, evidenceCount: 4, repositoryCount: 2, lastVerified: new Date().toISOString(), growthTrend: 10, verificationStatus: 'verified' }
      ],
      categorySummaries: [
        { name: 'Frontend', averageLevel: 83, skillsCount: 2 },
      ],
      lastUpdated: new Date().toISOString(),
      engineVersion: '1.0.0',
    },
    repositories: verifiedRepos,
    badges,
    timeline: timeline.map(t => ({ ...t, date: t.date })),
  };

  // Compile JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    'mainEntity': {
      '@type': 'Person',
      'name': resolvedUser.name,
      'alternateName': resolvedUser.username,
      'description': resolvedUser.bio,
      'image': resolvedUser.avatarUrl,
      'sameAs': [
        resolvedUser.website,
        `https://github.com/${resolvedUser.username}`
      ].filter(Boolean)
    }
  };

  return (
    <>
      {/* Inject JSON-LD Schema for Google Search Crawler */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <ProfileClientView initialData={initialData} />
    </>
  );
}
