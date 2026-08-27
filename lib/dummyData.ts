/**
 * SkillVerse Master Dummy Dataset & Test Accounts Suite
 * Provides comprehensive, evidence-backed mock data for all platform subsystems:
 * - Test Accounts (Developer, Senior Architect, AI Engineer, Recruiter, Company Admin)
 * - Repositories & AST Intelligence Analysis
 * - AI Code Reviews with Health Metrics & Explainability
 * - DCC 2.0 (Developer Capability Cards) & Radar Dimensions
 * - Verified Skills & Evolution History
 * - Hackathons, Competitions & Submissions
 * - Companies, Job Openings & Candidate Applications
 * - Community Feed Posts & Technical Q&A
 * - AI Mentorship & Career Milestones
 * - Cloud IDE Workspaces & Build Telemetry
 * - Developer Intelligence Graph (Nodes & Edges)
 * - Global Verification Network (Institutions & Certificates)
 * - Notifications & Activity Streams
 */

export interface TestUser {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl: string;
  githubId: string;
  role: 'developer' | 'recruiter' | 'company_admin' | 'admin';
  bio: string;
  website: string;
  location: string;
  companyName?: string;
  trustScore: {
    overallScore: number;
    projectScore: number;
    contributionScore: number;
    competitionScore: number;
    peerVouchScore: number;
    confidence: number;
  };
  dccLevel: 'Explorer' | 'Builder' | 'Creator' | 'Professional' | 'Advanced' | 'Expert' | 'Elite';
  tagline: string;
}

// -------------------------------------------------------------
// 1. Five Specialized Test Accounts
// -------------------------------------------------------------
export const DUMMY_USERS: TestUser[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'siddharth@skillverse.dev',
    name: 'Siddharth Kadbhane',
    username: 'siddharthkadbhane-pixel',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    githubId: '84218321',
    role: 'developer',
    bio: 'Lead Full-Stack Architect specializing in Next.js 15, TypeScript, PostgreSQL, and Serverless Multi-Agent Orchestration.',
    website: 'https://siddharthkadbhane-pixel.github.io',
    location: 'Mumbai, India',
    trustScore: {
      overallScore: 940,
      projectScore: 960,
      contributionScore: 920,
      competitionScore: 950,
      peerVouchScore: 910,
      confidence: 96,
    },
    dccLevel: 'Elite',
    tagline: 'Staff Fullstack Architect & AI Systems Specialist',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'alex@skillverse.dev',
    name: 'Alex Chen',
    username: 'alex-chen',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    githubId: '91245678',
    role: 'developer',
    bio: 'Design Systems Engineer & React 19 / Next.js Specialist. Passionate about micro-interactions and high-performance WebGL rendering.',
    website: 'https://alexchen.dev',
    location: 'San Francisco, CA, USA',
    trustScore: {
      overallScore: 820,
      projectScore: 840,
      contributionScore: 810,
      competitionScore: 790,
      peerVouchScore: 840,
      confidence: 91,
    },
    dccLevel: 'Expert',
    tagline: 'Principal Frontend Engineer & Design Systems Lead',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'sarah@skillverse.dev',
    name: 'Sarah Connor',
    username: 'sarah-connor',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    githubId: '76543210',
    role: 'developer',
    bio: 'Backend & Distributed AI Systems Engineer. Expert in Python, FastAPI, PyTorch, Go, Redis clusters and Kubernetes automation.',
    website: 'https://sarahconnor.ai',
    location: 'Berlin, Germany',
    trustScore: {
      overallScore: 760,
      projectScore: 780,
      contributionScore: 750,
      competitionScore: 730,
      peerVouchScore: 770,
      confidence: 89,
    },
    dccLevel: 'Advanced',
    tagline: 'Distributed Systems & ML Platform Engineer',
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'emily.watson@vanguardtech.io',
    name: 'Emily Watson',
    username: 'emily-recruiter',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    githubId: '65432109',
    role: 'recruiter',
    bio: 'Principal Technical Talent Partner at Vanguard Technologies. Finding top 1% verified engineering talent via SkillVerse DCC telemetry.',
    website: 'https://vanguardtech.io/careers',
    location: 'London, UK',
    companyName: 'Vanguard Technologies',
    trustScore: {
      overallScore: 0,
      projectScore: 0,
      contributionScore: 0,
      competitionScore: 0,
      peerVouchScore: 0,
      confidence: 100,
    },
    dccLevel: 'Explorer',
    tagline: 'Principal Tech Recruiter @ Vanguard Tech',
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    email: 'marcus@hyperion.ai',
    name: 'Marcus Vance',
    username: 'marcus-admin',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    githubId: '54321098',
    role: 'company_admin',
    bio: 'VP of Engineering & Open-Source Advocate at Hyperion AI. Building next-generation AI infrastructure and hosting global developer hackathons.',
    website: 'https://hyperion.ai',
    location: 'Austin, TX, USA',
    companyName: 'Hyperion AI',
    trustScore: {
      overallScore: 950,
      projectScore: 970,
      contributionScore: 940,
      competitionScore: 960,
      peerVouchScore: 930,
      confidence: 98,
    },
    dccLevel: 'Elite',
    tagline: 'VP of Engineering @ Hyperion AI',
  },
];

export function getDummyUserById(id?: string | null): TestUser {
  if (!id) return DUMMY_USERS[0];
  return DUMMY_USERS.find(u => u.id === id) || DUMMY_USERS[0];
}

export function getDummyUserByUsername(username?: string | null): TestUser {
  if (!username) return DUMMY_USERS[0];
  return DUMMY_USERS.find(u => u.username.toLowerCase() === username.toLowerCase()) || DUMMY_USERS[0];
}

// -------------------------------------------------------------
// 2. Verified Repositories Dataset
// -------------------------------------------------------------
export const DUMMY_REPOSITORIES = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    userId: DUMMY_USERS[0].id,
    githubRepoId: 8421001,
    name: 'SkillVerse',
    fullName: 'siddharthkadbhane-pixel/SkillVerse',
    description: 'Decentralized Proof-of-Skill Reputation Platform with AST telemetry, AI review pipelines, and Developer Capability Cards (DCC).',
    htmlUrl: 'https://github.com/siddharthkadbhane-pixel/SkillVerse',
    language: 'TypeScript',
    stars: 28,
    forks: 7,
    isAnalyzed: true,
    analyzedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    overallScore: 95,
    healthScore: 94,
    languagesBreakdown: { TypeScript: 92000, CSS: 14000, SQL: 6000, HTML: 2000 },
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    userId: DUMMY_USERS[0].id,
    githubRepoId: 8421002,
    name: 'hyperion-distributed-cache',
    fullName: 'siddharthkadbhane-pixel/hyperion-distributed-cache',
    description: 'Ultra low-latency in-memory distributed cache with Raft consensus, zero-copy serialization, and Prometheus telemetry.',
    htmlUrl: 'https://github.com/siddharthkadbhane-pixel/hyperion-distributed-cache',
    language: 'Rust',
    stars: 164,
    forks: 42,
    isAnalyzed: true,
    analyzedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    overallScore: 96,
    healthScore: 97,
    languagesBreakdown: { Rust: 124000, Shell: 3000 },
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    userId: DUMMY_USERS[0].id,
    githubRepoId: 8421003,
    name: 'neural-agent-orchestrator',
    fullName: 'siddharthkadbhane-pixel/neural-agent-orchestrator',
    description: 'Multi-agent LLM workflow orchestrator with vector memory retrieval, dynamic function routing, and streaming output.',
    htmlUrl: 'https://github.com/siddharthkadbhane-pixel/neural-agent-orchestrator',
    language: 'Python',
    stars: 95,
    forks: 21,
    isAnalyzed: true,
    analyzedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    overallScore: 92,
    healthScore: 91,
    languagesBreakdown: { Python: 88000, TypeScript: 15000 },
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    userId: DUMMY_USERS[1].id,
    githubRepoId: 8421004,
    name: 'react-glassmorphic-ui',
    fullName: 'alex-chen/react-glassmorphic-ui',
    description: 'Accessible, dark-first React 19 component library with GPU-accelerated backdrop blur shaders and fluid micro-animations.',
    htmlUrl: 'https://github.com/alex-chen/react-glassmorphic-ui',
    language: 'TypeScript',
    stars: 342,
    forks: 68,
    isAnalyzed: true,
    analyzedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    overallScore: 94,
    healthScore: 95,
    languagesBreakdown: { TypeScript: 76000, CSS: 28000 },
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    userId: DUMMY_USERS[2].id,
    githubRepoId: 8421005,
    name: 'fastapi-high-throughput',
    fullName: 'sarah-connor/fastapi-high-throughput',
    description: 'Asynchronous Python microservice boilerplate with uvloop, asyncpg, Redis pipelining, and automated OpenTelemetry tracing.',
    htmlUrl: 'https://github.com/sarah-connor/fastapi-high-throughput',
    language: 'Python',
    stars: 180,
    forks: 34,
    isAnalyzed: true,
    analyzedAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    overallScore: 90,
    healthScore: 92,
    languagesBreakdown: { Python: 64000, Dockerfile: 2000 },
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    userId: DUMMY_USERS[0].id,
    githubRepoId: 8421006,
    name: 'zero-knowledge-audit-pipeline',
    fullName: 'siddharthkadbhane-pixel/zero-knowledge-audit-pipeline',
    description: 'Cryptographic commit verifier generating snark proofs for git author history without revealing private repository code.',
    htmlUrl: 'https://github.com/siddharthkadbhane-pixel/zero-knowledge-audit-pipeline',
    language: 'TypeScript',
    stars: 72,
    forks: 14,
    isAnalyzed: true,
    analyzedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    overallScore: 93,
    healthScore: 90,
    languagesBreakdown: { TypeScript: 54000, Rust: 32000 },
  },
];

// -------------------------------------------------------------
// 3. AI Code Review Reports Dataset
// -------------------------------------------------------------
export const DUMMY_REVIEWS = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    repositoryId: DUMMY_REPOSITORIES[0].id,
    overallScore: 95,
    confidenceScore: 96,
    summary: 'Outstanding architectural integrity and type safety. Demonstrates clean Next.js 15 App Router separation of concerns, robust Drizzle ORM schema modeling, and zero raw SQL vulnerabilities.',
    strengths: [
      'Strict TypeScript configuration with zero `any` evasions across core services',
      'Modular micro-agent pipeline with dedicated AST heuristics and health analyzers',
      'Exemplary UI styling with customized Linear/V2 design tokens and dark mode palette',
      'Comprehensive error boundaries and fallback resilience throughout API routes'
    ],
    weaknesses: [
      'Could expand end-to-end integration tests using Playwright for auth callbacks',
      'Database connection pool limits require tuning under high serverless concurrency'
    ],
    architecture: 'Clean Layered Architecture with clear boundaries between App Router handlers, domain services, ORM entities, and client components.',
    codeQuality: 'High readability, strong idiomatic patterns, strict null checking, and consistent linting compliance.',
    documentation: 'Complete README with architecture diagrams, installation guides, environment configurations, and schema dictionaries.',
    bestPractices: 'Follows 12-factor application guidelines, secure cookie management, sanitized headers, and rate-limited endpoints.',
    suggestedLearning: [
      'Explore distributed transaction tracing with OpenTelemetry',
      'Implement Edge caching strategies with Next.js stale-while-revalidate headers'
    ],
    healthScores: {
      overallHealth: 94,
      categories: {
        codeQuality: { score: 96, label: 'Code Quality' },
        architecture: { score: 95, label: 'Architecture' },
        security: { score: 94, label: 'Security' },
        performance: { score: 92, label: 'Performance' },
        testing: { score: 88, label: 'Testing' },
        documentation: { score: 97, label: 'Documentation' },
      }
    },
    aiExplainability: {
      summary: 'Verified code metrics synthesized from 18,400+ lines of TypeScript across 42 modules.',
      keySignals: [
        'Deterministic AST type checking verified across all API handlers',
        'Cryptographic audit trail confirmed against GitHub commit signatures',
        'Zero high-severity CVEs detected in npm dependency tree'
      ]
    },
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    repositoryId: DUMMY_REPOSITORIES[1].id,
    overallScore: 96,
    confidenceScore: 98,
    summary: 'Exceptional systems engineering in Rust. Near-zero memory allocations in hot paths, provably safe concurrency abstractions, and sub-millisecond p99 latency benchmarks.',
    strengths: [
      'Flawless use of async-std and tokio for concurrent I/O multiplexing',
      'Lock-free data structures minimizing cache coherency invalidation',
      '100% test coverage across Raft consensus state machine transitions'
    ],
    weaknesses: [
      'High compile times due to deep generic monomorphization',
    ],
    architecture: 'Actor-model distributed system with isolated state transitions and append-only WAL storage.',
    codeQuality: 'Idiomatic Rust with zero unsafe blocks outside of hardware-accelerated SIMD routines.',
    documentation: 'Exhaustive API documentation with micro-benchmark figures and operational runbooks.',
    bestPractices: 'Deterministic memory reclamation, memory-mapped I/O, and SIGTERM graceful shutdown.',
    suggestedLearning: [
      'Investigate eBPF kernel-bypass networking for ultra-dense cluster setups'
    ],
    healthScores: {
      overallHealth: 97,
      categories: {
        codeQuality: { score: 98, label: 'Code Quality' },
        architecture: { score: 97, label: 'Architecture' },
        security: { score: 99, label: 'Security' },
        performance: { score: 98, label: 'Performance' },
        testing: { score: 95, label: 'Testing' },
        documentation: { score: 94, label: 'Documentation' },
      }
    },
    aiExplainability: {
      summary: 'Engineered for high-reliability cloud native infrastructure.',
      keySignals: ['Verified 0-alloc hot path', 'Fuzz-tested against network partitions']
    },
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  }
];

// -------------------------------------------------------------
// 4. DCC 2.0 Full Dataset (Developer Capability Cards)
// -------------------------------------------------------------
export function getDummyDCCData(userId: string) {
  const user = getDummyUserById(userId);
  const isSiddharth = user.username === 'siddharthkadbhane-pixel';
  const isAlex = user.username === 'alex-chen';
  const isSarah = user.username === 'sarah-connor';

  const overallScore = user.trustScore.overallScore || 850;
  const level = user.dccLevel;

  return {
    developer: {
      id: user.id,
      name: user.name,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      location: user.location,
      website: user.website,
      tagline: user.tagline,
      primaryTechnologies: isSiddharth 
        ? ['TypeScript', 'Next.js 15', 'PostgreSQL', 'Rust', 'Python', 'TailwindCSS']
        : isAlex 
        ? ['React 19', 'TypeScript', 'Next.js', 'WebGL', 'TailwindCSS', 'CSS Shaders']
        : ['Python', 'FastAPI', 'PyTorch', 'Go', 'Docker', 'Redis', 'Kubernetes'],
      joinedAt: new Date(Date.now() - 3600000 * 24 * 180).toISOString(),
    },
    card: {
      id: `card_${user.id.slice(0, 8)}`,
      userId: user.id,
      overallScore,
      level,
      summary: `Verified developer with proven proficiency across ${isSiddharth ? '18' : isAlex ? '12' : '14'} audited engineering skills and ${isSiddharth ? '5' : '3'} repository audit trails.`,
      verificationStatus: 'verified' as const,
      confidenceScore: user.trustScore.confidence || 94,
      lastUpdated: new Date().toISOString(),
    },
    dimensions: {
      engineering: {
        codeQuality: isSiddharth ? 95 : isAlex ? 94 : 91,
        architecture: isSiddharth ? 96 : isAlex ? 90 : 93,
        security: isSiddharth ? 92 : isAlex ? 88 : 94,
        performance: isSiddharth ? 94 : isAlex ? 96 : 95,
        testing: isSiddharth ? 89 : isAlex ? 86 : 90,
        documentation: isSiddharth ? 96 : isAlex ? 92 : 88,
      },
      skills: {
        languages: isSiddharth ? ['TypeScript', 'Rust', 'Python', 'SQL', 'Go'] : isAlex ? ['TypeScript', 'JavaScript', 'HTML5', 'GLSL'] : ['Python', 'Go', 'SQL', 'Bash'],
        frameworks: isSiddharth ? ['Next.js', 'React', 'FastAPI', 'Node.js'] : isAlex ? ['React 19', 'Next.js', 'Tailwind CSS', 'Framer Motion'] : ['FastAPI', 'PyTorch', 'Django', 'Gin'],
        databases: ['PostgreSQL', 'Redis', 'Supabase'],
        devops: ['Docker', 'GitHub Actions', 'Vercel', 'AWS'],
        cloud: ['AWS', 'Vercel', 'Cloudflare'],
        aiMl: isSiddharth ? ['Hugging Face Inference', 'Llama-3', 'LangChain'] : isSarah ? ['PyTorch', 'Transformers', 'vLLM', 'Qwen-2.5'] : [],
        mobile: [],
        web: ['TypeScript', 'Next.js', 'Tailwind CSS', 'WebSockets'],
      },
      projects: {
        repositoryQuality: isSiddharth ? 95 : isAlex ? 93 : 91,
        complexity: isSiddharth ? 92 : isAlex ? 88 : 94,
        openSource: isSiddharth ? 90 : isAlex ? 96 : 84,
        buildSuccess: 99,
        deployments: isSiddharth ? 12 : isAlex ? 8 : 6,
        projectDiversity: isSiddharth ? 94 : isAlex ? 88 : 90,
      },
      collaboration: {
        pullRequests: isSiddharth ? 48 : isAlex ? 36 : 29,
        codeReviews: isSiddharth ? 32 : isAlex ? 24 : 19,
        mentoring: isSiddharth ? 90 : isAlex ? 82 : 78,
        discussions: isSiddharth ? 64 : isAlex ? 42 : 31,
        teamwork: isSiddharth ? 94 : isAlex ? 90 : 88,
        communityHelp: isSiddharth ? 88 : isAlex ? 85 : 82,
      },
      growth: {
        velocity: isSiddharth ? 95 : isAlex ? 90 : 88,
        consistency: isSiddharth ? 96 : isAlex ? 92 : 91,
        skillExpansion: isSiddharth ? 92 : isAlex ? 86 : 89,
        activity: isSiddharth ? 94 : isAlex ? 89 : 87,
        milestones: isSiddharth ? 16 : isAlex ? 11 : 9,
      },
      career: {
        readiness: 'Immediate (Senior Ready)',
        roleRecommendations: isSiddharth
          ? ['Principal Fullstack Architect', 'Staff Systems Engineer', 'AI Platform Lead']
          : isAlex
          ? ['Lead Design Systems Engineer', 'Senior Frontend Architect', 'UI/UX Performance Lead']
          : ['Staff Backend Engineer', 'Distributed Systems Architect', 'MLOps Lead'],
        strengths: isSiddharth
          ? ['Next.js & TypeScript Architecture', 'High-Performance Distributed Caching', 'Telemetry & Git Auditing']
          : isAlex
          ? ['Design System Scalability', 'GPU-Accelerated Micro-Animations', 'Accessibility Standards']
          : ['High-Throughput Async APIs', 'PyTorch Model Serving', 'Container Orchestration'],
        weaknesses: ['Automated End-to-End Test Rigor across legacy browsers'],
        experienceTrend: 'Accelerating',
      },
    },
    verifiedSkills: [
      { name: 'TypeScript', category: 'Languages', proficiency: 98, status: 'verified', evidenceCount: 4, verificationSource: 'Git AST + AI Audit' },
      { name: 'Next.js', category: 'Frontend', proficiency: 96, status: 'verified', evidenceCount: 3, verificationSource: 'SkillVerse Repository Scan' },
      { name: 'React', category: 'Frontend', proficiency: 95, status: 'verified', evidenceCount: 5, verificationSource: 'Git AST + Production Telemetry' },
      { name: 'PostgreSQL', category: 'Database', proficiency: 92, status: 'verified', evidenceCount: 3, verificationSource: 'Drizzle Schema Analysis' },
      { name: 'Rust', category: 'Languages', proficiency: 94, status: 'verified', evidenceCount: 2, verificationSource: 'hyperion-distributed-cache Audit' },
      { name: 'Python', category: 'Languages', proficiency: 90, status: 'verified', evidenceCount: 3, verificationSource: 'neural-agent-orchestrator Audit' },
      { name: 'Docker', category: 'DevOps & Cloud', proficiency: 88, status: 'verified', evidenceCount: 4, verificationSource: 'CI/CD Pipeline Telemetry' },
      { name: 'Tailwind CSS', category: 'Frontend', proficiency: 96, status: 'verified', evidenceCount: 4, verificationSource: 'Design Tokens Analysis' },
      { name: 'FastAPI', category: 'Backend', proficiency: 91, status: 'verified', evidenceCount: 2, verificationSource: 'API Telemetry' },
      { name: 'Redis', category: 'Database', proficiency: 89, status: 'verified', evidenceCount: 3, verificationSource: 'Cluster Benchmark' },
    ],
    engineeringMetrics: [
      { dimension: 'Code Quality', score: isSiddharth ? 95 : 92, benchmark: 82, status: 'Exceptional' },
      { dimension: 'Architecture', score: isSiddharth ? 96 : 90, benchmark: 80, status: 'Elite' },
      { dimension: 'Security', score: isSiddharth ? 92 : 88, benchmark: 75, status: 'Verified' },
      { dimension: 'Performance', score: isSiddharth ? 94 : 95, benchmark: 78, status: 'Exceptional' },
      { dimension: 'Testing & Coverage', score: isSiddharth ? 89 : 86, benchmark: 70, status: 'Strong' },
      { dimension: 'Documentation', score: isSiddharth ? 96 : 92, benchmark: 74, status: 'Elite' },
    ],
    projectEvidence: DUMMY_REPOSITORIES.filter(r => r.userId === user.id || isSiddharth).map(r => ({
      name: r.name,
      fullName: r.fullName,
      url: r.htmlUrl,
      stars: r.stars,
      forks: r.forks,
      language: r.language,
      overallScore: r.overallScore,
      healthScore: r.healthScore,
      verifiedAt: r.analyzedAt,
    })),
    insights: {
      strengths: [
        'Top 1% architectural consistency across multi-tier TypeScript codebases',
        'Proven ability to design zero-alloc systems with verified sub-millisecond p99 latency',
        'Impeccable schema migration rigor and type safety enforcement'
      ],
      weaknesses: [
        'Expand automated integration tests in serverless environments to minimize edge latency'
      ],
      learningSuggestions: [
        'Advanced eBPF kernel network monitoring',
        'WebAssembly distributed state machines'
      ],
      advice: 'Your profile demonstrates elite engineering readiness for Staff and Principal level architecture roles.',
    },
    history: [
      { score: overallScore - 60, level: 'Expert', changedAt: new Date(Date.now() - 3600000 * 24 * 90).toISOString() },
      { score: overallScore - 30, level: 'Elite', changedAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString() },
      { score: overallScore, level: 'Elite', changedAt: new Date().toISOString() },
    ],
    publicUrl: `/passport/${user.username}`,
  };
}

// -------------------------------------------------------------
// 5. Companies & Verified Job Openings
// -------------------------------------------------------------
export const DUMMY_COMPANIES = [
  {
    id: 'comp_001',
    name: 'Hyperion AI',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
    website: 'https://hyperion.ai',
    description: 'Next-generation frontier AI infrastructure, distributed agent execution engines, and neural model compilers.',
    verified: true,
    location: 'Austin, TX / Remote',
  },
  {
    id: 'comp_002',
    name: 'Vanguard Technologies',
    logoUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=120&auto=format&fit=crop&q=80',
    website: 'https://vanguardtech.io',
    description: 'Ultra-low latency financial infrastructure, verifiable execution ledgers, and institutional asset protocols.',
    verified: true,
    location: 'London, UK / Remote',
  },
  {
    id: 'comp_003',
    name: 'Nebula Cloud Systems',
    logoUrl: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=120&auto=format&fit=crop&q=80',
    website: 'https://nebulacloud.dev',
    description: 'Serverless edge container platform with sub-10ms cold starts and global state synchronization.',
    verified: true,
    location: 'San Francisco, CA / Remote',
  },
  {
    id: 'comp_004',
    name: 'Starlight Fintech',
    logoUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=120&auto=format&fit=crop&q=80',
    website: 'https://starlightfintech.io',
    description: 'Decentralized reputation and real-time verifiable settlement engine for global commerce.',
    verified: true,
    location: 'Singapore / Remote',
  },
];

export const DUMMY_JOBS = [
  {
    id: 'job_001',
    companyId: DUMMY_COMPANIES[0].id,
    companyName: DUMMY_COMPANIES[0].name,
    companyLogo: DUMMY_COMPANIES[0].logoUrl,
    title: 'Staff Distributed Systems Engineer',
    description: 'Lead the architecture of Hyperion’s distributed agent mesh. You will design lock-free actor pipelines, Raft consensus nodes, and low-latency memory buses.',
    requirements: ['Rust or Go', 'Distributed Consensus', 'High-Throughput Systems', 'Kubernetes'],
    location: 'Remote (Global)',
    type: 'full_time' as const,
    salaryRange: '$190,000 - $250,000 + 0.25% Equity',
    minTrustScore: 800,
    active: true,
    applicantsCount: 14,
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: 'job_002',
    companyId: DUMMY_COMPANIES[0].id,
    companyName: DUMMY_COMPANIES[0].name,
    companyLogo: DUMMY_COMPANIES[0].logoUrl,
    title: 'Senior Full-Stack AI Engineer',
    description: 'Build user-facing orchestration dashboards and streaming LLM pipelines using Next.js 15, TypeScript, and Python.',
    requirements: ['Next.js 15', 'TypeScript', 'Python', 'PostgreSQL', 'Tailwind CSS'],
    location: 'Remote (US/EU/APAC)',
    type: 'full_time' as const,
    salaryRange: '$160,000 - $210,000 + Equity',
    minTrustScore: 750,
    active: true,
    applicantsCount: 28,
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  },
  {
    id: 'job_003',
    companyId: DUMMY_COMPANIES[1].id,
    companyName: DUMMY_COMPANIES[1].name,
    companyLogo: DUMMY_COMPANIES[1].logoUrl,
    title: 'Principal Frontend Architect (Design Systems)',
    description: 'Spearhead Vanguard’s flagship trading UI. Deliver ultra-performant WebGL charts, dark mode tokens, and fluid keyboard-first UX.',
    requirements: ['React 19', 'TypeScript', 'WebGL / Canvas', 'Tailwind CSS', 'Performance Profiling'],
    location: 'London, UK / Hybrid',
    type: 'full_time' as const,
    salaryRange: '£130,000 - £175,000 + Bonus',
    minTrustScore: 780,
    active: true,
    applicantsCount: 19,
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  },
  {
    id: 'job_004',
    companyId: DUMMY_COMPANIES[2].id,
    companyName: DUMMY_COMPANIES[2].name,
    companyLogo: DUMMY_COMPANIES[2].logoUrl,
    title: 'Cloud Runtime & Container Specialist',
    description: 'Architect secure micro-VM runtimes (Firecracker/gVisor) for instant code execution sandboxes with zero host escape risk.',
    requirements: ['Linux Kernels', 'Rust / C', 'Docker', 'eBPF', 'Zero-Trust Networking'],
    location: 'San Francisco, CA / Remote',
    type: 'full_time' as const,
    salaryRange: '$180,000 - $235,000',
    minTrustScore: 820,
    active: true,
    applicantsCount: 9,
    createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
  },
  {
    id: 'job_005',
    companyId: DUMMY_COMPANIES[3].id,
    companyName: DUMMY_COMPANIES[3].name,
    companyLogo: DUMMY_COMPANIES[3].logoUrl,
    title: 'Cryptographic Audit & Zero-Knowledge Engineer',
    description: 'Develop zk-SNARK circuits for verifiable developer reputation scoring without leaking private repository IP.',
    requirements: ['Circom / Halo2', 'Solidity or Rust', 'Cryptography', 'TypeScript'],
    location: 'Remote (Worldwide)',
    type: 'contract' as const,
    salaryRange: '$120 - $180 / hr (6-month retainer)',
    minTrustScore: 790,
    active: true,
    applicantsCount: 11,
    createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
  },
];

export const DUMMY_APPLICATIONS = [
  {
    id: 'app_001',
    jobId: DUMMY_JOBS[0].id,
    jobTitle: DUMMY_JOBS[0].title,
    companyName: DUMMY_JOBS[0].companyName,
    userId: DUMMY_USERS[0].id,
    userName: DUMMY_USERS[0].name,
    userUsername: DUMMY_USERS[0].username,
    userScore: 940,
    userLevel: 'Elite',
    status: 'shortlisted' as const,
    createdAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
  },
  {
    id: 'app_002',
    jobId: DUMMY_JOBS[2].id,
    jobTitle: DUMMY_JOBS[2].title,
    companyName: DUMMY_JOBS[2].companyName,
    userId: DUMMY_USERS[1].id,
    userName: DUMMY_USERS[1].name,
    userUsername: DUMMY_USERS[1].username,
    userScore: 820,
    userLevel: 'Expert',
    status: 'reviewing' as const,
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: 'app_003',
    jobId: DUMMY_JOBS[1].id,
    jobTitle: DUMMY_JOBS[1].title,
    companyName: DUMMY_JOBS[1].companyName,
    userId: DUMMY_USERS[2].id,
    userName: DUMMY_USERS[2].name,
    userUsername: DUMMY_USERS[2].username,
    userScore: 760,
    userLevel: 'Advanced',
    status: 'offered' as const,
    createdAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
  },
];

// -------------------------------------------------------------
// 6. Hackathons & Algorithmic Challenges Dataset
// -------------------------------------------------------------
export const DUMMY_CHALLENGES = [
  {
    id: 'chal_001',
    title: 'Global Distributed Systems Hackathon 2026',
    description: 'Design a resilient distributed KV-store capable of sustaining 500,000 write ops/sec during simulated chaos monkey node failures.',
    difficulty: 'Hard',
    technologies: ['Rust', 'Go', 'Raft', 'gRPC', 'Docker'],
    timeLimit: '48 Hours',
    prizePool: '$15,000 USD + Cloud Credits',
    maxParticipants: 100,
    participantsCount: 64,
    status: 'active',
    deadline: new Date(Date.now() + 3600000 * 24 * 6).toISOString(),
    organizationName: 'Hyperion AI & Linux Foundation',
  },
  {
    id: 'chal_002',
    title: 'Next.js 15 Ultra-Fast Micro-Frontend Sprint',
    description: 'Construct a modular enterprise dashboard with sub-100ms LCP, instant dynamic theme switching, and zero layout shift.',
    difficulty: 'Medium',
    technologies: ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
    timeLimit: '24 Hours',
    prizePool: '$8,000 USD',
    maxParticipants: 150,
    participantsCount: 112,
    status: 'active',
    deadline: new Date(Date.now() + 3600000 * 24 * 3).toISOString(),
    organizationName: 'SkillVerse Core Labs',
  },
  {
    id: 'chal_003',
    title: 'Zero-Knowledge Circuit Optimization Challenge',
    description: 'Write an optimized Circom/Halo2 proof circuit verifying Merkle inclusion with under 4,000 R1CS constraints.',
    difficulty: 'Hard',
    technologies: ['Circom', 'Rust', 'zk-SNARKs', 'Solidity'],
    timeLimit: '72 Hours',
    prizePool: '$12,000 USD',
    maxParticipants: 50,
    participantsCount: 38,
    status: 'active',
    deadline: new Date(Date.now() + 3600000 * 24 * 10).toISOString(),
    organizationName: 'Ethereum Foundation Ecosystem',
  },
  {
    id: 'chal_004',
    title: 'AI Multi-Agent Task Routing Benchmark',
    description: 'Implement a semantic router directing complex coding queries to specialized LLM workers with minimum token overhead.',
    difficulty: 'Medium',
    technologies: ['Python', 'FastAPI', 'PyTorch', 'Vector DBs'],
    timeLimit: '36 Hours',
    prizePool: '$10,000 USD',
    maxParticipants: 120,
    participantsCount: 89,
    status: 'active',
    deadline: new Date(Date.now() + 3600000 * 24 * 4).toISOString(),
    organizationName: 'Hugging Face Partner Network',
  },
];

// -------------------------------------------------------------
// 7. Community Feed Posts & Technical Discussions
// -------------------------------------------------------------
export const DUMMY_POSTS = [
  {
    id: 'post_001',
    title: 'Architecting Zero-Alloc In-Memory Buffers for Real-Time Telemetry',
    content: 'Here is a breakdown of how we achieved sub-50µs write latencies using memory-mapped circular buffers and lock-free atomic pointers in Rust. Key takeaway: never allocate on the critical path!',
    category: 'Architecture',
    githubLink: 'https://github.com/siddharthkadbhane-pixel/hyperion-distributed-cache',
    codeSnippet: `pub struct RingBuffer<T> {\n    buffer: Vec<UnsafeCell<T>>,\n    head: AtomicUsize,\n    tail: AtomicUsize,\n    capacity: usize,\n}\n\nimpl<T: Copy> RingBuffer<T> {\n    pub fn try_push(&self, item: T) -> Result<(), ()> {\n        let head = self.head.load(Ordering::Acquire);\n        // Atomic lock-free push\n    }\n}`,
    authorName: 'Siddharth Kadbhane',
    authorUsername: 'siddharthkadbhane-pixel',
    authorAvatar: DUMMY_USERS[0].avatarUrl,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    likesCount: 42,
    commentsCount: 9,
    bookmarked: true,
  },
  {
    id: 'post_002',
    title: 'Next.js 15 Turbopack + React 19: Best Practices for Component Shaders',
    content: 'We migrated our design system to React 19 server actions and WebGL micro-shaders. The render frame times dropped from 16ms to a rock-solid 2.1ms across 4K displays.',
    category: 'Frontend',
    githubLink: 'https://github.com/alex-chen/react-glassmorphic-ui',
    codeSnippet: `'use client';\nimport { Canvas } from '@react-three/fiber';\n\nexport function ShaderCard({ children }) {\n  return (\n    <div className="neon-border backdrop-blur-xl">\n      {children}\n    </div>\n  );\n}`,
    authorName: 'Alex Chen',
    authorUsername: 'alex-chen',
    authorAvatar: DUMMY_USERS[1].avatarUrl,
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    likesCount: 56,
    commentsCount: 14,
    bookmarked: false,
  },
  {
    id: 'post_003',
    title: 'High-Throughput AsyncPG Connection Pooling in Serverless FastAPIs',
    content: 'When deploying FastAPI microservices on containerized edge clusters, pre-fork worker models can exhaust database pool limits. Here is how we configured dynamic pool resizing with asyncpg.',
    category: 'Backend',
    githubLink: 'https://github.com/sarah-connor/fastapi-high-throughput',
    codeSnippet: `@asynccontextmanager\nasync def lifespan(app: FastAPI):\n    app.state.pool = await asyncpg.create_pool(\n        dsn=DATABASE_URL,\n        min_size=5,\n        max_size=20,\n        timeout=10.0\n    )\n    yield\n    await app.state.pool.close()`,
    authorName: 'Sarah Connor',
    authorUsername: 'sarah-connor',
    authorAvatar: DUMMY_USERS[2].avatarUrl,
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    likesCount: 38,
    commentsCount: 7,
    bookmarked: true,
  },
];

// -------------------------------------------------------------
// 8. AI Mentorship & Career Guidance Dataset
// -------------------------------------------------------------
export const DUMMY_MENTOR_CHAT = [
  {
    id: 'msg_001',
    sender: 'user',
    text: 'What are the top 3 architectural competencies I need to elevate my DCC score to 960+?',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'msg_002',
    sender: 'ai',
    text: 'Based on your audited repositories and Git AST telemetry, here are your 3 high-impact leverage areas:\n\n1. **Automated End-to-End Test Rigor**: Integrate Playwright CI runs verifying serverless auth flows under high concurrency.\n2. **OpenTelemetry Tracing**: Implement distributed trace spans in your multi-agent orchestrator.\n3. **Decentralized Verification**: Link a zero-knowledge cryptographic signature verifying your repository commits.',
    timestamp: new Date(Date.now() - 3600000 * 2 + 15000).toISOString(),
  },
];

export const DUMMY_CAREER_GOALS = [
  { id: 'goal_001', title: 'Publish OpenTelemetry distributed tracing module for SkillVerse', status: 'in_progress', progress: 75 },
  { id: 'goal_002', title: 'Win Top 3 in Global Distributed Systems Hackathon 2026', status: 'in_progress', progress: 50 },
  { id: 'goal_003', title: 'Attain 950+ Trust Score and Elite DCC Capability Card', status: 'completed', progress: 100 },
  { id: 'goal_004', title: 'Publish 3 Verified Technical Architecture Papers', status: 'in_progress', progress: 60 },
];

// -------------------------------------------------------------
// 9. Cloud IDE Workspaces & Build Telemetry
// -------------------------------------------------------------
export const DUMMY_WORKSPACES = [
  {
    id: 'ws_001',
    userId: DUMMY_USERS[0].id,
    name: 'SkillVerse-Core-Dev',
    repositoryName: 'siddharthkadbhane-pixel/SkillVerse',
    status: 'running',
    branch: 'main',
    environment: 'Node.js 24 + TypeScript 5.6 + PostgreSQL 16',
    cpuUsage: 14,
    memoryUsage: '380 MB / 4 GB',
    activeJobs: 1,
    lastActive: 'Just now',
  },
  {
    id: 'ws_002',
    userId: DUMMY_USERS[0].id,
    name: 'Distributed-Cache-Benchmark',
    repositoryName: 'siddharthkadbhane-pixel/hyperion-distributed-cache',
    status: 'idle',
    branch: 'feat/simd-acceleration',
    environment: 'Rust 1.82 (Nightly) + LLVM 18',
    cpuUsage: 0,
    memoryUsage: '120 MB / 4 GB',
    activeJobs: 0,
    lastActive: '2 hours ago',
  },
];

export const DUMMY_BUILDS = [
  {
    id: 'build_001',
    workspaceId: DUMMY_WORKSPACES[0].id,
    commitHash: 'c01a9df',
    status: 'completed',
    duration: '24s',
    branch: 'main',
    deploymentUrl: 'https://skillverse-app.vercel.app',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    logs: [
      '[INFO] Initializing Next.js 15.1.0 Turbopack builder...',
      '[INFO] Running TypeScript AST strict verification... Passed (0 errors)',
      '[INFO] Compiling CSS design tokens & Tailwind classes... Done (42ms)',
      '[INFO] Generating static pages & API edge routes... (14/14 static)',
      '[SUCCESS] Production bundle ready! Deployed to Vercel Edge Network.',
    ],
  },
];

// -------------------------------------------------------------
// 10. Developer Intelligence Graph (Nodes & Edges)
// -------------------------------------------------------------
export const DUMMY_GRAPH_DATA = {
  nodes: [
    { id: 'node_dev_1', label: 'Siddharth Kadbhane', type: 'developer', score: 940, level: 'Elite' },
    { id: 'node_dev_2', label: 'Alex Chen', type: 'developer', score: 820, level: 'Expert' },
    { id: 'node_dev_3', label: 'Sarah Connor', type: 'developer', score: 760, level: 'Advanced' },
    { id: 'node_repo_1', label: 'SkillVerse', type: 'repository', stars: 28, language: 'TypeScript' },
    { id: 'node_repo_2', label: 'hyperion-distributed-cache', type: 'repository', stars: 164, language: 'Rust' },
    { id: 'node_repo_3', label: 'react-glassmorphic-ui', type: 'repository', stars: 342, language: 'TypeScript' },
    { id: 'node_skill_1', label: 'TypeScript', type: 'skill', proficiency: 98 },
    { id: 'node_skill_2', label: 'Next.js 15', type: 'skill', proficiency: 96 },
    { id: 'node_skill_3', label: 'Rust', type: 'skill', proficiency: 94 },
    { id: 'node_skill_4', label: 'Python / AI', type: 'skill', proficiency: 90 },
    { id: 'node_comp_1', label: 'Hyperion AI', type: 'company' },
    { id: 'node_comp_2', label: 'Vanguard Technologies', type: 'company' },
  ],
  edges: [
    { source: 'node_dev_1', target: 'node_repo_1', type: 'created' },
    { source: 'node_dev_1', target: 'node_repo_2', type: 'created' },
    { source: 'node_dev_1', target: 'node_skill_1', type: 'mastered' },
    { source: 'node_dev_1', target: 'node_skill_2', type: 'mastered' },
    { source: 'node_dev_1', target: 'node_skill_3', type: 'mastered' },
    { source: 'node_dev_2', target: 'node_repo_3', type: 'created' },
    { source: 'node_dev_2', target: 'node_skill_1', type: 'mastered' },
    { source: 'node_dev_1', target: 'node_comp_1', type: 'collaborates_with' },
    { source: 'node_dev_2', target: 'node_comp_2', type: 'interviewing' },
    { source: 'node_dev_1', target: 'node_dev_2', type: 'peer_vouched' },
  ],
};

// -------------------------------------------------------------
// 11. Global Verification Network & Certificates
// -------------------------------------------------------------
export const DUMMY_ORGANIZATIONS = [
  { id: 'org_001', name: 'Linux Foundation', type: 'partner', verifiedCount: 1420 },
  { id: 'org_002', name: 'MIT Open Learning', type: 'academic', verifiedCount: 890 },
  { id: 'org_003', name: 'Ethereum Foundation Ecosystem', type: 'partner', verifiedCount: 650 },
  { id: 'org_004', name: 'Google Cloud Developer Network', type: 'partner', verifiedCount: 2100 },
];

export const DUMMY_CERTIFICATES = [
  {
    id: 'cert_001',
    userId: DUMMY_USERS[0].id,
    title: 'Verified Distributed Systems Architect — Level Elite',
    issuer: 'SkillVerse Global Verification Network',
    evidenceRepoUrl: 'https://github.com/siddharthkadbhane-pixel/hyperion-distributed-cache',
    issuedAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    verificationHash: '0x8f29c40b83e1a87e34d2891f63ba8892f39c01',
  },
  {
    id: 'cert_002',
    userId: DUMMY_USERS[0].id,
    title: 'Fullstack Next.js & Multi-Agent Systems Specialist',
    issuer: 'Hyperion AI & SkillVerse Labs',
    evidenceRepoUrl: 'https://github.com/siddharthkadbhane-pixel/SkillVerse',
    issuedAt: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
    verificationHash: '0x4e71a93d7c58f01b920182ec34710189a812ef',
  },
];

// -------------------------------------------------------------
// 12. Real-Time Notifications Dataset
// -------------------------------------------------------------
export const DUMMY_NOTIFICATIONS = [
  {
    id: 'notif_001',
    userId: DUMMY_USERS[0].id,
    title: 'AI Repository Audit Completed',
    content: 'Repository "siddharthkadbhane-pixel/SkillVerse" scored 95/100 (Health 94%). DCC score updated to 940 (Level: Elite).',
    type: 'review_done',
    isRead: false,
    actionUrl: '/dcc',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'notif_002',
    userId: DUMMY_USERS[0].id,
    title: 'Talent Shortlist Invitation',
    content: 'Emily Watson (Principal Recruiter at Vanguard Technologies) viewed your Capability Card and shortlisted your profile for Staff Distributed Systems Engineer.',
    type: 'job_application',
    isRead: false,
    actionUrl: '/jobs',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'notif_003',
    userId: DUMMY_USERS[0].id,
    title: 'Hackathon Submission Verified',
    content: 'Your submission for "Global Distributed Systems Hackathon 2026" passed automated stress testing with 100% score.',
    type: 'challenge',
    isRead: true,
    actionUrl: '/challenges',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'notif_004',
    userId: DUMMY_USERS[0].id,
    title: 'Community Upvote Milestone',
    content: 'Your technical breakdown "Architecting Zero-Alloc In-Memory Buffers" surpassed 40+ verified developer upvotes.',
    type: 'like',
    isRead: true,
    actionUrl: '/community',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];
