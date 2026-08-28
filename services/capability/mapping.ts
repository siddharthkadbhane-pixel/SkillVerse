import { CapabilityCategoryName, CapabilityTaxonomyDefinition } from '@/types/capability';

export const CAPABILITY_TAXONOMY: Record<CapabilityCategoryName, CapabilityTaxonomyDefinition> = {
  'Frontend Engineering': {
    name: 'Frontend Engineering',
    category: 'Engineering Domain',
    description: 'Modern client-side engineering, component design systems, state management, and user interaction patterns.',
    coreSkills: ['react', 'next.js', 'nextjs', 'vue', 'vue.js', 'angular', 'svelte', 'tailwind', 'tailwindcss', 'html', 'css', 'redux', 'zustand', 'astro', 'javascript', 'typescript'],
    evaluationCriteria: {
      minScoreForStrong: 85,
      minAnalyzedReposForStrong: 2,
      minVerifiedSkillsForStrong: 2,
      minAnalyzedReposForProficient: 1,
      minVerifiedSkillsForProficient: 1,
    },
  },
  'Backend Engineering': {
    name: 'Backend Engineering',
    category: 'Engineering Domain',
    description: 'Server architectures, business domain logic, concurrent request handling, and backend service lifecycle management.',
    coreSkills: ['node.js', 'nodejs', 'fastapi', 'express', 'nestjs', 'django', 'flask', 'spring boot', 'go', 'golang', 'rust', 'actix', 'grpc', 'graphql', 'rest api', 'python', 'java'],
    evaluationCriteria: {
      minScoreForStrong: 85,
      minAnalyzedReposForStrong: 2,
      minVerifiedSkillsForStrong: 2,
      minAnalyzedReposForProficient: 1,
      minVerifiedSkillsForProficient: 1,
    },
  },
  'Full-Stack Development': {
    name: 'Full-Stack Development',
    category: 'Engineering Domain',
    description: 'End-to-end integration uniting reactive frontend user interfaces with robust, data-backed backend services.',
    coreSkills: ['next.js', 'nextjs', 'react', 'node.js', 'typescript', 'postgresql', 'prisma', 'drizzle', 'supabase', 'fastapi', 'tailwind'],
    evaluationCriteria: {
      minScoreForStrong: 85,
      minAnalyzedReposForStrong: 2,
      minVerifiedSkillsForStrong: 3,
      minAnalyzedReposForProficient: 1,
      minVerifiedSkillsForProficient: 2,
    },
  },
  'API Development': {
    name: 'API Development',
    category: 'Architecture & Protocols',
    description: 'Contract-first API schemas, RESTful endpoint design, serialization, validation, and error semantics.',
    coreSkills: ['rest api', 'graphql', 'grpc', 'trpc', 'fastapi', 'express', 'openapi', 'swagger', 'postman'],
    evaluationCriteria: {
      minScoreForStrong: 80,
      minAnalyzedReposForStrong: 2,
      minVerifiedSkillsForStrong: 2,
      minAnalyzedReposForProficient: 1,
      minVerifiedSkillsForProficient: 1,
    },
  },
  'Database Engineering': {
    name: 'Database Engineering',
    category: 'Data & Persistence',
    description: 'Relational & non-relational database design, query optimization, indexing strategies, and ORM abstractions.',
    coreSkills: ['postgresql', 'postgres', 'mongodb', 'redis', 'mysql', 'sqlite', 'prisma', 'drizzle', 'supabase', 'dynamodb', 'sql'],
    evaluationCriteria: {
      minScoreForStrong: 85,
      minAnalyzedReposForStrong: 2,
      minVerifiedSkillsForStrong: 2,
      minAnalyzedReposForProficient: 1,
      minVerifiedSkillsForProficient: 1,
    },
  },
  'Software Architecture': {
    name: 'Software Architecture',
    category: 'Engineering Rigor',
    description: 'Modular separation of concerns, clean design patterns, serverless scaling, and distributed consensus mechanisms.',
    coreSkills: ['clean architecture', 'serverless', 'microservices', 'distributed systems', 'design patterns', 'raft', 'concurrency', 'modular design'],
    evaluationCriteria: {
      minScoreForStrong: 88,
      minAnalyzedReposForStrong: 2,
      minVerifiedSkillsForStrong: 1,
      minAnalyzedReposForProficient: 1,
      minVerifiedSkillsForProficient: 1,
    },
  },
  'DevOps & Infrastructure': {
    name: 'DevOps & Infrastructure',
    category: 'Operations & Deployment',
    description: 'Containerization, reproducible deployment manifests, continuous integration pipelines, and infrastructure as code.',
    coreSkills: ['docker', 'kubernetes', 'ci/cd', 'github actions', 'terraform', 'linux', 'nginx', 'ansible', 'helm'],
    evaluationCriteria: {
      minScoreForStrong: 82,
      minAnalyzedReposForStrong: 2,
      minVerifiedSkillsForStrong: 1,
      minAnalyzedReposForProficient: 1,
      minVerifiedSkillsForProficient: 1,
    },
  },
  'Cloud Engineering': {
    name: 'Cloud Engineering',
    category: 'Operations & Deployment',
    description: 'Leveraging cloud platforms, serverless compute, object storage, and edge networking for scalable applications.',
    coreSkills: ['aws', 'gcp', 'azure', 'vercel', 'cloudflare', 's3', 'lambda', 'cloudfront'],
    evaluationCriteria: {
      minScoreForStrong: 80,
      minAnalyzedReposForStrong: 1,
      minVerifiedSkillsForStrong: 1,
      minAnalyzedReposForProficient: 1,
      minVerifiedSkillsForProficient: 1,
    },
  },
  'Testing & QA': {
    name: 'Testing & QA',
    category: 'Engineering Rigor',
    description: 'Automated test suite design, unit and integration assertion harnesses, and end-to-end regression validation.',
    coreSkills: ['vitest', 'jest', 'playwright', 'cypress', 'testing library', 'integration tests', 'unit tests', 'e2e testing'],
    evaluationCriteria: {
      minScoreForStrong: 82,
      minAnalyzedReposForStrong: 2,
      minVerifiedSkillsForStrong: 1,
      minAnalyzedReposForProficient: 1,
      minVerifiedSkillsForProficient: 1,
    },
  },
  'Security Awareness': {
    name: 'Security Awareness',
    category: 'Engineering Rigor',
    description: 'Authentication primitives, secret handling, rate limiting, and defensive coding against injection and security vulnerabilities.',
    coreSkills: ['auth', 'jwt', 'oauth', 'owasp', 'encryption', 'cors', 'rate limiting', 'security auditing'],
    evaluationCriteria: {
      minScoreForStrong: 85,
      minAnalyzedReposForStrong: 1,
      minVerifiedSkillsForStrong: 1,
      minAnalyzedReposForProficient: 1,
      minVerifiedSkillsForProficient: 1,
    },
  },
  'Performance Engineering': {
    name: 'Performance Engineering',
    category: 'Engineering Rigor',
    description: 'Memory optimization, buffer management, low-latency execution, caching strategies, and computational efficiency.',
    coreSkills: ['zero-alloc', 'benchmarking', 'redis', 'caching', 'profiling', 'concurrent optimization', 'web vitals', 'tree shaking', 'rust'],
    evaluationCriteria: {
      minScoreForStrong: 88,
      minAnalyzedReposForStrong: 2,
      minVerifiedSkillsForStrong: 1,
      minAnalyzedReposForProficient: 1,
      minVerifiedSkillsForProficient: 1,
    },
  },
  'Developer Tooling': {
    name: 'Developer Tooling',
    category: 'Developer Productivity',
    description: 'Monorepo orchestration, build system bundling, static analysis linters, and team workflow automation.',
    coreSkills: ['turborepo', 'vite', 'webpack', 'eslint', 'prettier', 'biome', 'babel', 'git'],
    evaluationCriteria: {
      minScoreForStrong: 80,
      minAnalyzedReposForStrong: 1,
      minVerifiedSkillsForStrong: 1,
      minAnalyzedReposForProficient: 1,
      minVerifiedSkillsForProficient: 1,
    },
  },
};

export class CapabilityMappingService {
  /**
   * Returns all capability categories a specific skill maps to
   */
  static getCapabilitiesForSkill(skillName: string): CapabilityCategoryName[] {
    const s = skillName.toLowerCase().trim();
    const matches: CapabilityCategoryName[] = [];

    for (const [capName, def] of Object.entries(CAPABILITY_TAXONOMY)) {
      if (def.coreSkills.some(core => core === s || s.includes(core) || core.includes(s))) {
        matches.push(capName as CapabilityCategoryName);
      }
    }

    return matches;
  }

  /**
   * Returns all core skills associated with a capability
   */
  static getRelatedSkillsForCapability(capabilityName: CapabilityCategoryName): string[] {
    return CAPABILITY_TAXONOMY[capabilityName]?.coreSkills || [];
  }

  /**
   * Returns all registered taxonomy definitions
   */
  static getAllTaxonomies(): CapabilityTaxonomyDefinition[] {
    return Object.values(CAPABILITY_TAXONOMY);
  }
}
