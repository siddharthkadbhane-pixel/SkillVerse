// Phase 35: Standard Engineering Role Taxonomy & Requirements

import { CareerRoleId, CareerRoleTaxonomy } from '@/types/career';

export const CAREER_ROLE_TAXONOMY: Record<CareerRoleId, CareerRoleTaxonomy> = {
  frontend_developer: {
    id: 'frontend_developer',
    name: 'Frontend Developer',
    category: 'Application Development',
    shortDescription: 'Build modern, reactive, accessible, and high-performance client web applications.',
    fullDescription: 'Frontend Developers specialize in crafting resilient user interfaces, client-side state management architectures, responsive layouts, web vitals optimization, and modular component design systems.',
    iconName: 'Layout',
    standardStack: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Vitest'],
    requiredCapabilities: [
      {
        capabilityName: 'Frontend Engineering',
        minLevel: 'Strong',
        weight: 5,
        description: 'Demonstrated mastery in modern UI components, reactive state, and DOM rendering lifecycle.',
      },
      {
        capabilityName: 'Software Architecture',
        minLevel: 'Proficient',
        weight: 3,
        description: 'Modular file organisation, clear separation of presentational and data layers.',
      },
      {
        capabilityName: 'Testing & QA',
        minLevel: 'Developing',
        weight: 2,
        description: 'Unit and component regression tests validating user interactions and view contracts.',
      },
    ],
    preferredCapabilities: [
      {
        capabilityName: 'Developer Tooling',
        preferredLevel: 'Proficient',
        weight: 2,
        description: 'Vite/Turborepo bundling, ESLint, TypeScript strict compiler configurations.',
      },
      {
        capabilityName: 'Performance Engineering',
        preferredLevel: 'Developing',
        weight: 2,
        description: 'Core Web Vitals, tree shaking, bundle splitting, and client rendering budget management.',
      },
    ],
    coreSkillsRequired: ['react', 'next.js', 'typescript', 'javascript', 'html', 'css', 'tailwind'],
    recommendedSkills: ['vitest', 'playwright', 'zustand', 'redux', 'vite'],
    typicalToolchain: ['Next.js 15', 'React 19', 'TypeScript', 'Tailwind CSS', 'Vitest', 'Vite', 'Turborepo'],
  },

  backend_developer: {
    id: 'backend_developer',
    name: 'Backend Developer',
    category: 'Application Development',
    shortDescription: 'Design scalable server architectures, resilient APIs, data persistence, and business domain logic.',
    fullDescription: 'Backend Developers architect server systems, secure API protocols, high-concurrency request handling, database indexing strategies, transactions, and caching subsystems.',
    iconName: 'Server',
    standardStack: ['Node.js', 'PostgreSQL', 'REST API', 'Redis', 'Docker'],
    requiredCapabilities: [
      {
        capabilityName: 'Backend Engineering',
        minLevel: 'Strong',
        weight: 5,
        description: 'Production backend services, error propagation, concurrent execution, and service lifecycles.',
      },
      {
        capabilityName: 'Database Engineering',
        minLevel: 'Proficient',
        weight: 4,
        description: 'Schema modeling, relational joins, indexing strategies, transactions, and ORM abstractions.',
      },
      {
        capabilityName: 'API Development',
        minLevel: 'Proficient',
        weight: 4,
        description: 'RESTful / GraphQL schemas, status semantics, payload validation, and serialisation.',
      },
    ],
    preferredCapabilities: [
      {
        capabilityName: 'Testing & QA',
        preferredLevel: 'Developing',
        weight: 3,
        description: 'Automated integration assertions, mock fixtures, and HTTP endpoint contract validation.',
      },
      {
        capabilityName: 'DevOps & Infrastructure',
        preferredLevel: 'Developing',
        weight: 2,
        description: 'Docker containerization and reproducible deployment manifests.',
      },
      {
        capabilityName: 'Security Awareness',
        preferredLevel: 'Developing',
        weight: 2,
        description: 'Authentication boundaries, JWT token validation, rate limiting, and parameter sanitization.',
      },
    ],
    coreSkillsRequired: ['node.js', 'postgresql', 'rest api', 'typescript', 'express', 'sql'],
    recommendedSkills: ['redis', 'docker', 'vitest', 'prisma', 'drizzle', 'graphql'],
    typicalToolchain: ['Node.js / Go / Python', 'PostgreSQL', 'Drizzle / Prisma', 'Redis', 'Docker', 'Vitest'],
  },

  fullstack_developer: {
    id: 'fullstack_developer',
    name: 'Full-Stack Developer',
    category: 'Application Development',
    shortDescription: 'Bridge front-end UX and back-end services into unified, data-driven web products.',
    fullDescription: 'Full-Stack Developers build end-to-end features spanning responsive client applications, type-safe API boundaries, server logic, database persistence, and cloud deployment pipelines.',
    iconName: 'Layers',
    standardStack: ['Next.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
    requiredCapabilities: [
      {
        capabilityName: 'Full-Stack Development',
        minLevel: 'Strong',
        weight: 5,
        description: 'Seamless integration linking reactive client states with server-side validation and DB queries.',
      },
      {
        capabilityName: 'Frontend Engineering',
        minLevel: 'Proficient',
        weight: 4,
        description: 'Modern component design, form controls, and dynamic client routing.',
      },
      {
        capabilityName: 'Backend Engineering',
        minLevel: 'Proficient',
        weight: 4,
        description: 'API endpoints, authentication handling, database interactions, and business rules.',
      },
      {
        capabilityName: 'Database Engineering',
        minLevel: 'Developing',
        weight: 3,
        description: 'Relational data models, migrations, and query composition.',
      },
    ],
    preferredCapabilities: [
      {
        capabilityName: 'DevOps & Infrastructure',
        preferredLevel: 'Developing',
        weight: 2,
        description: 'Serverless deployment, environment configuration, and container workflows.',
      },
      {
        capabilityName: 'Testing & QA',
        preferredLevel: 'Developing',
        weight: 2,
        description: 'End-to-end user journey tests and unit validation.',
      },
    ],
    coreSkillsRequired: ['next.js', 'react', 'typescript', 'node.js', 'postgresql', 'tailwind'],
    recommendedSkills: ['drizzle', 'prisma', 'docker', 'supabase', 'vitest'],
    typicalToolchain: ['Next.js App Router', 'TypeScript', 'PostgreSQL / Supabase', 'Tailwind', 'Drizzle ORM'],
  },

  mobile_developer: {
    id: 'mobile_developer',
    name: 'Mobile Developer',
    category: 'Application Development',
    shortDescription: 'Create responsive, smooth native or cross-platform mobile apps for iOS and Android.',
    fullDescription: 'Mobile Developers focus on mobile device lifecycle, touch gesture interactions, offline storage sync, push notifications, and native hardware API integrations.',
    iconName: 'Smartphone',
    standardStack: ['React Native', 'TypeScript', 'Expo', 'REST API', 'Jest'],
    requiredCapabilities: [
      {
        capabilityName: 'Frontend Engineering',
        minLevel: 'Strong',
        weight: 5,
        description: 'Mobile layout paradigms, virtualized list performance, and fluid gesture handling.',
      },
      {
        capabilityName: 'API Development',
        minLevel: 'Proficient',
        weight: 4,
        description: 'Efficient JSON payload hydration, offline caching, and network resilience.',
      },
    ],
    preferredCapabilities: [
      {
        capabilityName: 'Software Architecture',
        preferredLevel: 'Developing',
        weight: 3,
        description: 'Cross-platform modular abstractions and state persistence.',
      },
      {
        capabilityName: 'Testing & QA',
        preferredLevel: 'Developing',
        weight: 2,
        description: 'Component snapshot tests and mobile flow validation.',
      },
    ],
    coreSkillsRequired: ['react native', 'typescript', 'javascript', 'mobile', 'expo'],
    recommendedSkills: ['graphql', 'jest', 'firebase', 'redux'],
    typicalToolchain: ['React Native / Flutter', 'Expo', 'TypeScript', 'Jest', 'Redux Toolkit'],
  },

  devops_engineer: {
    id: 'devops_engineer',
    name: 'DevOps Engineer',
    category: 'Infrastructure & Operations',
    shortDescription: 'Automate build pipelines, container orchestration, CI/CD, and infrastructure stability.',
    fullDescription: 'DevOps Engineers ensure seamless deployment pipelines, containerized environments, continuous integration test runners, infrastructure provisioning, and production telemetry.',
    iconName: 'Terminal',
    standardStack: ['Docker', 'Kubernetes', 'GitHub Actions', 'Linux', 'Terraform'],
    requiredCapabilities: [
      {
        capabilityName: 'DevOps & Infrastructure',
        minLevel: 'Strong',
        weight: 5,
        description: 'Container manifests, Docker multi-stage builds, CI/CD pipeline automation, and Linux scripting.',
      },
      {
        capabilityName: 'Cloud Engineering',
        minLevel: 'Proficient',
        weight: 4,
        description: 'Cloud provider compute, virtual networks, container registries, and edge hosting.',
      },
    ],
    preferredCapabilities: [
      {
        capabilityName: 'Security Awareness',
        preferredLevel: 'Proficient',
        weight: 3,
        description: 'Secrets management, least-privilege IAM roles, and vulnerability vulnerability scanning.',
      },
      {
        capabilityName: 'Developer Tooling',
        preferredLevel: 'Proficient',
        weight: 3,
        description: 'Automated linting, monorepo task runners, and build cache acceleration.',
      },
    ],
    coreSkillsRequired: ['docker', 'ci/cd', 'github actions', 'linux', 'kubernetes'],
    recommendedSkills: ['terraform', 'nginx', 'aws', 'helm', 'ansible'],
    typicalToolchain: ['Docker', 'Kubernetes', 'GitHub Actions', 'Terraform', 'Linux Bash', 'Nginx'],
  },

  cloud_engineer: {
    id: 'cloud_engineer',
    name: 'Cloud Engineer',
    category: 'Infrastructure & Operations',
    shortDescription: 'Architect cloud infrastructure, serverless runtimes, managed storage, and edge distribution.',
    fullDescription: 'Cloud Engineers configure scalable cloud architecture patterns, serverless event handlers, distributed object storage, VPC networking, and cloud disaster recovery topologies.',
    iconName: 'Cloud',
    standardStack: ['AWS', 'Terraform', 'Docker', 'Serverless', 'Cloudflare'],
    requiredCapabilities: [
      {
        capabilityName: 'Cloud Engineering',
        minLevel: 'Strong',
        weight: 5,
        description: 'Serverless compute, edge networks, managed object storage, and multi-region routing.',
      },
      {
        capabilityName: 'DevOps & Infrastructure',
        minLevel: 'Proficient',
        weight: 4,
        description: 'Infrastructure as code manifests, automated environments, and container runtimes.',
      },
      {
        capabilityName: 'Software Architecture',
        minLevel: 'Proficient',
        weight: 3,
        description: 'Distributed microservices, asynchronous message queues, and decoupled topologies.',
      },
    ],
    preferredCapabilities: [
      {
        capabilityName: 'Security Awareness',
        preferredLevel: 'Developing',
        weight: 3,
        description: 'Cloud IAM policies, ingress SSL certificates, and network security groups.',
      },
    ],
    coreSkillsRequired: ['aws', 'cloud', 'terraform', 'docker', 'serverless'],
    recommendedSkills: ['gcp', 'cloudflare', 'kubernetes', 's3', 'lambda'],
    typicalToolchain: ['AWS (Lambda, S3, ECS)', 'Terraform', 'Cloudflare', 'Docker'],
  },

  data_engineer: {
    id: 'data_engineer',
    name: 'Data Engineer',
    category: 'Data & Artificial Intelligence',
    shortDescription: 'Construct reliable data pipelines, high-throughput stores, ETL jobs, and query optimization.',
    fullDescription: 'Data Engineers build batch and stream data pipelines, analytical warehouse schemas, distributed query engines, and database indexing strategies for large volume datasets.',
    iconName: 'Database',
    standardStack: ['Python', 'PostgreSQL', 'SQL', 'Redis', 'Docker'],
    requiredCapabilities: [
      {
        capabilityName: 'Database Engineering',
        minLevel: 'Strong',
        weight: 5,
        description: 'Deep understanding of execution plans, partitioned tables, transactions, and caching.',
      },
      {
        capabilityName: 'Backend Engineering',
        minLevel: 'Proficient',
        weight: 4,
        description: 'Data transformation scripts, concurrency, and ingestion worker services.',
      },
    ],
    preferredCapabilities: [
      {
        capabilityName: 'Performance Engineering',
        preferredLevel: 'Proficient',
        weight: 3,
        description: 'Zero-alloc data buffers, stream processing, and low-latency aggregation algorithms.',
      },
    ],
    coreSkillsRequired: ['python', 'postgresql', 'sql', 'database', 'redis'],
    recommendedSkills: ['docker', 'fastapi', 'spark', 'kafka', 'duckdb'],
    typicalToolchain: ['Python', 'PostgreSQL', 'DuckDB / ClickHouse', 'Redis', 'Docker'],
  },

  ai_ml_engineer: {
    id: 'ai_ml_engineer',
    name: 'AI/ML Engineer',
    category: 'Data & Artificial Intelligence',
    shortDescription: 'Implement machine learning pipelines, LLM agent orchestrations, embeddings, and model APIs.',
    fullDescription: 'AI/ML Engineers bridge machine learning research and software engineering: building prompt orchestration pipelines, embeddings indexing, model fine-tuning, and inference endpoints.',
    iconName: 'Cpu',
    standardStack: ['Python', 'PyTorch', 'FastAPI', 'Hugging Face', 'Docker'],
    requiredCapabilities: [
      {
        capabilityName: 'Backend Engineering',
        minLevel: 'Proficient',
        weight: 4,
        description: 'High-throughput async inference endpoints, payload parsing, and batching.',
      },
      {
        capabilityName: 'Software Architecture',
        minLevel: 'Proficient',
        weight: 4,
        description: 'Multi-agent orchestration workflows, vector memory caching, and fallback pipelines.',
      },
    ],
    preferredCapabilities: [
      {
        capabilityName: 'Performance Engineering',
        preferredLevel: 'Developing',
        weight: 3,
        description: 'Inference latency optimization, streaming token responses, and tensor memory management.',
      },
    ],
    coreSkillsRequired: ['python', 'ai/ml', 'fastapi', 'hugging face', 'pytorch'],
    recommendedSkills: ['docker', 'numpy', 'pandas', 'vector db', 'langchain'],
    typicalToolchain: ['Python', 'PyTorch', 'FastAPI', 'Hugging Face Transformers', 'Docker'],
  },

  security_engineer: {
    id: 'security_engineer',
    name: 'Security Engineer',
    category: 'Quality & Security',
    shortDescription: 'Safeguard applications against vulnerabilities, secure authentication, and audit codebases.',
    fullDescription: 'Security Engineers analyze codebases for OWASP vulnerabilities, design cryptographic token flows, enforce strict authentication, audit third-party dependencies, and harden infrastructure.',
    iconName: 'ShieldAlert',
    standardStack: ['OAuth / JWT', 'OWASP', 'TypeScript', 'Docker', 'Linux'],
    requiredCapabilities: [
      {
        capabilityName: 'Security Awareness',
        minLevel: 'Strong',
        weight: 5,
        description: 'Defensive coding, injection defense, cryptographic hashing, and access control models.',
      },
      {
        capabilityName: 'Backend Engineering',
        minLevel: 'Proficient',
        weight: 4,
        description: 'Secure session management, cryptographic middleware, and audit logging.',
      },
    ],
    preferredCapabilities: [
      {
        capabilityName: 'DevOps & Infrastructure',
        preferredLevel: 'Developing',
        weight: 3,
        description: 'Container security scanning, least-privilege configurations, and TLS certificates.',
      },
    ],
    coreSkillsRequired: ['auth', 'jwt', 'oauth', 'security auditing', 'owasp'],
    recommendedSkills: ['encryption', 'rate limiting', 'docker', 'linux', 'typescript'],
    typicalToolchain: ['OWASP ZAP', 'OAuth 2.0 / JWT', 'TypeScript', 'Docker', 'Linux'],
  },

  qa_test_engineer: {
    id: 'qa_test_engineer',
    name: 'QA / Test Engineer',
    category: 'Quality & Security',
    shortDescription: 'Build comprehensive test harnesses, automated integration suites, and e2e regression pipelines.',
    fullDescription: 'QA & Test Engineers design automated verification strategies across unit, integration, and end-to-end tiers, establishing continuous regression gates and stress testing suites.',
    iconName: 'CheckCheck',
    standardStack: ['Vitest', 'Playwright', 'TypeScript', 'Jest', 'GitHub Actions'],
    requiredCapabilities: [
      {
        capabilityName: 'Testing & QA',
        minLevel: 'Strong',
        weight: 5,
        description: 'Comprehensive assertion frameworks, mock isolation, snapshot tests, and e2e runs.',
      },
      {
        capabilityName: 'Developer Tooling',
        minLevel: 'Proficient',
        weight: 4,
        description: 'Automated CI test harnesses, code coverage instrumentation, and pre-commit hooks.',
      },
    ],
    preferredCapabilities: [
      {
        capabilityName: 'Frontend Engineering',
        preferredLevel: 'Developing',
        weight: 3,
        description: 'DOM interaction simulation, accessibility assertions, and visual regression checking.',
      },
    ],
    coreSkillsRequired: ['vitest', 'jest', 'playwright', 'testing', 'unit tests'],
    recommendedSkills: ['cypress', 'ci/cd', 'github actions', 'typescript', 'integration tests'],
    typicalToolchain: ['Vitest', 'Playwright', 'Jest', 'GitHub Actions CI', 'TypeScript'],
  },
};

export class CareerTaxonomyService {
  static getAllRoles(): CareerRoleTaxonomy[] {
    return Object.values(CAREER_ROLE_TAXONOMY);
  }

  static getRoleById(roleId: CareerRoleId | string): CareerRoleTaxonomy | undefined {
    return CAREER_ROLE_TAXONOMY[roleId as CareerRoleId];
  }

  static getRolesByCategory(category: string): CareerRoleTaxonomy[] {
    return Object.values(CAREER_ROLE_TAXONOMY).filter((r) => r.category === category);
  }
}
