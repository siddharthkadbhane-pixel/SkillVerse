import { db } from '../lib/drizzle';
import {
  users, passports, trustScores, trustHistory, skillDna, skills, userSkills,
  repositories, reviews, reviewHistory, developerCapabilityCards, capabilityDimensions,
  capabilityHistory, capabilityInsights, verificationEvidence, companies, jobs,
  applications, challenges, challengeEvents, posts, postComments, mentorSessions,
  careerGoals, workspaces, workspaceMembers, builds, deployments, organizations,
  certificates, notifications, graphNodes, graphEdges
} from './schema';
import {
  DUMMY_USERS, DUMMY_REPOSITORIES, DUMMY_REVIEWS, getDummyDCCData,
  DUMMY_COMPANIES, DUMMY_JOBS, DUMMY_APPLICATIONS, DUMMY_CHALLENGES,
  DUMMY_POSTS, DUMMY_MENTOR_CHAT, DUMMY_CAREER_GOALS, DUMMY_WORKSPACES,
  DUMMY_BUILDS, DUMMY_ORGANIZATIONS, DUMMY_CERTIFICATES, DUMMY_NOTIFICATIONS,
  DUMMY_GRAPH_DATA
} from '../lib/dummyData';
import { eq } from 'drizzle-orm';

const defaultSkills = [
  { name: 'TypeScript', category: 'Language', description: 'Strict syntactical superset of JavaScript.' },
  { name: 'JavaScript', category: 'Language', description: 'High-level, dynamic programming language.' },
  { name: 'Python', category: 'Language', description: 'General-purpose programming language popular for AI/ML.' },
  { name: 'Rust', category: 'Language', description: 'Systems programming language focused on safety and speed.' },
  { name: 'Go', category: 'Language', description: 'Statically typed, compiled programming language designed at Google.' },
  { name: 'React', category: 'Frontend', description: 'A JavaScript library for building user interfaces.' },
  { name: 'Next.js', category: 'Frontend', description: 'The React Framework for the Web.' },
  { name: 'Tailwind CSS', category: 'Frontend', description: 'Utility-first CSS framework.' },
  { name: 'Vue.js', category: 'Frontend', description: 'Progressive JavaScript framework.' },
  { name: 'Node.js', category: 'Backend', description: 'JavaScript runtime built on Chrome V8 engine.' },
  { name: 'Express', category: 'Backend', description: 'Fast, unopinionated, minimalist web framework for Node.js.' },
  { name: 'FastAPI', category: 'Backend', description: 'Modern, fast web framework for building APIs with Python.' },
  { name: 'PostgreSQL', category: 'Database', description: 'Powerful, open-source object-relational database system.' },
  { name: 'MongoDB', category: 'Database', description: 'Source-available cross-platform document-oriented database.' },
  { name: 'Redis', category: 'Database', description: 'In-memory data structure store used as database, cache, and message broker.' },
  { name: 'Docker', category: 'DevOps', description: 'OS-level virtualization to deliver software in packages called containers.' },
  { name: 'Kubernetes', category: 'DevOps', description: 'Open-source container-orchestration system.' },
  { name: 'AWS', category: 'DevOps', description: 'Amazon Web Services cloud computing platform.' },
  { name: 'Vercel', category: 'DevOps', description: 'Cloud platform for static sites and Serverless Functions.' },
];

async function main() {
  console.log('🌱 Starting SkillVerse Full-Platform Master Data Seeder...');

  try {
    // 1. Seed Skills Master List
    console.log('   [1/12] Seeding master skills catalog...');
    for (const skill of defaultSkills) {
      await db.insert(skills).values(skill).onConflictDoNothing();
    }

    // 2. Seed Test Users & Passports
    console.log('   [2/12] Seeding 5 specialized test accounts...');
    for (const user of DUMMY_USERS) {
      await db.insert(users).values({
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl,
        githubId: user.githubId,
        role: user.role,
        bio: user.bio,
        website: user.website,
        location: user.location,
      }).onConflictDoUpdate({
        target: users.id,
        set: {
          name: user.name,
          username: user.username,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          website: user.website,
          location: user.location,
          role: user.role,
          updatedAt: new Date(),
        }
      });

      // Seed Passport
      await db.insert(passports).values({
        userId: user.id,
        visibility: 'public',
        theme: 'dark',
        viewCount: user.username === 'siddharthkadbhane-pixel' ? 384 : 128,
        generatedSummary: user.bio,
      }).onConflictDoNothing();

      // Seed Trust Score
      await db.insert(trustScores).values({
        userId: user.id,
        overallScore: user.trustScore.overallScore,
        projectScore: user.trustScore.projectScore,
        contributionScore: user.trustScore.contributionScore,
        competitionScore: user.trustScore.competitionScore,
        peerVouchScore: user.trustScore.peerVouchScore,
        confidence: user.trustScore.confidence,
        engineVersion: '1.0.0',
        explanation: `${user.name} verified profile score derived from active Git telemetry and AI code reviews.`,
      }).onConflictDoNothing();
    }

    // 3. Seed Repositories & AI Reviews
    console.log('   [3/12] Seeding verified repositories & AI audit reports...');
    for (const repo of DUMMY_REPOSITORIES) {
      await db.insert(repositories).values({
        id: repo.id,
        userId: repo.userId,
        githubRepoId: repo.githubRepoId,
        name: repo.name,
        fullName: repo.fullName,
        description: repo.description,
        htmlUrl: repo.htmlUrl,
        language: repo.language,
        stars: repo.stars,
        forks: repo.forks,
        isAnalyzed: repo.isAnalyzed,
        analyzedAt: new Date(repo.analyzedAt),
      }).onConflictDoNothing();
    }

    for (const review of DUMMY_REVIEWS) {
      await db.insert(reviews).values({
        id: review.id,
        repositoryId: review.repositoryId,
        summary: review.summary,
        strengths: review.strengths,
        weaknesses: review.weaknesses,
        architecture: review.architecture,
        codeQuality: review.codeQuality,
        documentation: review.documentation,
        bestPractices: review.bestPractices,
        suggestedLearning: review.suggestedLearning,
        overallScore: review.overallScore,
        confidenceScore: review.confidenceScore,
        healthScores: review.healthScores,
        aiExplainability: review.aiExplainability,
      }).onConflictDoNothing();
    }

    // 4. Seed DCC 2.0 Capability Cards & Dimensions
    console.log('   [4/12] Seeding Developer Capability Cards (DCC 2.0)...');
    for (const user of DUMMY_USERS) {
      const dcc = getDummyDCCData(user.id);
      
      const [card] = await db.insert(developerCapabilityCards).values({
        userId: user.id,
        overallScore: dcc.card.overallScore,
        level: dcc.card.level,
        summary: dcc.card.summary,
        verificationStatus: dcc.card.verificationStatus,
        confidenceScore: dcc.card.confidenceScore,
      }).onConflictDoUpdate({
        target: developerCapabilityCards.userId,
        set: {
          overallScore: dcc.card.overallScore,
          level: dcc.card.level,
          summary: dcc.card.summary,
          lastUpdated: new Date(),
        }
      }).returning();

      if (card) {
        await db.insert(capabilityDimensions).values({
          cardId: card.id,
          engineering: dcc.dimensions.engineering,
          skills: dcc.dimensions.skills,
          projects: dcc.dimensions.projects,
          collaboration: dcc.dimensions.collaboration,
          growth: dcc.dimensions.growth,
          career: dcc.dimensions.career,
        }).onConflictDoNothing();

        // Seed Capability Growth Milestones
        const growthEvents = [
          {
            changeType: 'repo_analyzed',
            title: 'Repository SkillVerse successfully analyzed',
            description: 'Full AST audit completed with overall quality score of 88/100.',
            score: 840,
            level: 'Expert',
            evidenceRepo: 'siddharthkadbhane-pixel/SkillVerse',
            date: new Date(Date.now() - 86400000 * 2),
          },
          {
            changeType: 'skill_verified',
            title: 'Next.js 15 skill verified',
            description: 'Verified fullstack architecture patterns and App Router server components.',
            score: 820,
            level: 'Expert',
            skillName: 'Next.js',
            evidenceRepo: 'siddharthkadbhane-pixel/SkillVerse',
            date: new Date(Date.now() - 86400000 * 14),
          },
          {
            changeType: 'dimension_improved',
            title: 'Architecture capability strengthened',
            description: 'Modular microservice design and decoupled layer architecture confirmed.',
            score: 790,
            level: 'Advanced',
            dimension: 'architecture',
            evidenceRepo: 'siddharthkadbhane-pixel/distributed-ai-agent',
            date: new Date(Date.now() - 86400000 * 30),
          },
          {
            changeType: 'skill_verified',
            title: 'TypeScript verified through AST analysis',
            description: 'Strict type safety with zero untyped boundaries across 42 source files.',
            score: 750,
            level: 'Advanced',
            skillName: 'TypeScript',
            evidenceRepo: 'siddharthkadbhane-pixel/SkillVerse',
            date: new Date(Date.now() - 86400000 * 60),
          },
        ];

        for (const ev of growthEvents) {
          await db.insert(capabilityHistory).values({
            userId: user.id,
            overallScore: ev.score,
            level: ev.level,
            changeType: ev.changeType,
            title: ev.title,
            description: ev.description,
            skillName: (ev as any).skillName || null,
            dimension: (ev as any).dimension || null,
            evidenceRepo: ev.evidenceRepo,
            isPublic: true,
            changedAt: ev.date,
          }).onConflictDoNothing();
        }
      }
    }

    // 5. Seed Companies & Jobs
    console.log('   [5/12] Seeding verified tech companies & career vacancies...');
    for (const company of DUMMY_COMPANIES) {
      await db.insert(companies).values({
        id: company.id.length === 36 ? company.id : undefined,
        name: company.name,
        logoUrl: company.logoUrl,
        website: company.website,
        description: company.description,
        verified: company.verified,
      }).onConflictDoNothing();
    }

    // 6. Seed Challenges & Hackathons
    console.log('   [6/12] Seeding coding hackathons & algorithmic benchmarks...');
    for (const chal of DUMMY_CHALLENGES) {
      await db.insert(challenges).values({
        companyId: DUMMY_COMPANIES[0].id.length === 36 ? DUMMY_COMPANIES[0].id : '00000000-0000-0000-0000-000000000001',
        title: chal.title,
        description: chal.description,
        difficulty: chal.difficulty,
        technologies: chal.technologies,
        timeLimit: chal.timeLimit,
        maxParticipants: chal.maxParticipants,
        reward: chal.prizePool,
      }).onConflictDoNothing();
    }

    // 7. Seed Community Feed Posts
    console.log('   [7/12] Seeding community feed & technical writeups...');
    for (const post of DUMMY_POSTS) {
      const author = DUMMY_USERS.find(u => u.username === post.authorUsername) || DUMMY_USERS[0];
      await db.insert(posts).values({
        userId: author.id,
        title: post.title,
        content: post.content,
        category: post.category,
        githubLink: post.githubLink,
        codeSnippet: post.codeSnippet,
      }).onConflictDoNothing();
    }

    // 8. Seed AI Mentorship & Career Milestones
    console.log('   [8/12] Seeding AI mentorship chat & career milestones...');
    for (const goal of DUMMY_CAREER_GOALS) {
      await db.insert(careerGoals).values({
        userId: DUMMY_USERS[0].id,
        title: goal.title,
        status: goal.status,
      }).onConflictDoNothing();
    }

    // 9. Seed Cloud Workspaces
    console.log('   [9/12] Seeding Cloud IDE workspaces & build outputs...');
    for (const ws of DUMMY_WORKSPACES) {
      await db.insert(workspaces).values({
        userId: ws.userId,
        name: ws.name,
      }).onConflictDoNothing();
    }

    // 10. Seed Organizations & Digital Certificates
    console.log('   [10/12] Seeding Global Verification Network & certificates...');
    for (const org of DUMMY_ORGANIZATIONS) {
      await db.insert(organizations).values({
        name: org.name,
        type: org.type,
      }).onConflictDoNothing();
    }

    for (const cert of DUMMY_CERTIFICATES) {
      await db.insert(certificates).values({
        userId: cert.userId,
        title: cert.title,
        evidenceRepoUrl: cert.evidenceRepoUrl,
        issuedAt: new Date(cert.issuedAt),
      }).onConflictDoNothing();
    }

    // 11. Seed Real-Time Notifications
    console.log('   [11/12] Seeding notifications...');
    for (const notif of DUMMY_NOTIFICATIONS) {
      await db.insert(notifications).values({
        userId: notif.userId,
        title: notif.title,
        content: notif.content,
        type: notif.type,
        isRead: notif.isRead,
        actionUrl: notif.actionUrl,
        createdAt: new Date(notif.createdAt),
      }).onConflictDoNothing();
    }

    // 12. Seed Developer Intelligence Graph
    console.log('   [12/12] Seeding Developer Intelligence Graph nodes & edges...');
    for (const node of DUMMY_GRAPH_DATA.nodes) {
      await db.insert(graphNodes).values({
        userId: DUMMY_USERS[0].id,
        type: node.type,
        label: node.label,
        properties: node,
      }).onConflictDoNothing();
    }

    console.log('\n🎉 ALL SKILLVERSE TEST ACCOUNTS & DUMMY DATA SEEDED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Seeding process encountered an issue:', error);
  }
}

main().then(() => process.exit(0)).catch(() => process.exit(1));
