export const SKILL_CATEGORIES = [
  'Programming Languages',
  'Frontend',
  'Backend',
  'Database',
  'Cloud & DevOps',
  'Software Engineering'
];

export const SKILL_CATEGORY_MAPPING: Record<string, string> = {
  // Languages
  typescript: 'Programming Languages',
  javascript: 'Programming Languages',
  python: 'Programming Languages',
  java: 'Programming Languages',
  go: 'Programming Languages',
  rust: 'Programming Languages',
  kotlin: 'Programming Languages',
  swift: 'Programming Languages',
  ruby: 'Programming Languages',
  php: 'Programming Languages',
  html: 'Programming Languages',
  css: 'Programming Languages',

  // Frontend
  react: 'Frontend',
  'next.js': 'Frontend',
  nextjs: 'Frontend',
  vue: 'Frontend',
  angular: 'Frontend',
  svelte: 'Frontend',
  'tailwind css': 'Frontend',
  tailwindcss: 'Frontend',
  redux: 'Frontend',
  recharts: 'Frontend',

  // Backend
  'node.js': 'Backend',
  nodejs: 'Backend',
  express: 'Backend',
  nestjs: 'Backend',
  graphql: 'Backend',
  apis: 'Backend',
  authentication: 'Backend',
  jwt: 'Backend',

  // Database
  postgresql: 'Database',
  postgres: 'Database',
  mysql: 'Database',
  mongodb: 'Database',
  redis: 'Database',
  'drizzle orm': 'Database',
  drizzle: 'Database',
  prisma: 'Database',

  // Cloud & DevOps
  docker: 'Cloud & DevOps',
  'ci/cd': 'Cloud & DevOps',
  cicd: 'Cloud & DevOps',
  'github actions': 'Cloud & DevOps',

  // Software Engineering
  testing: 'Software Engineering',
  documentation: 'Software Engineering',
  security: 'Software Engineering',
  performance: 'Software Engineering',
  'system design': 'Software Engineering',
  'clean code': 'Software Engineering',
};

export function getSkillCategory(skillName: string): string {
  const normalized = skillName.trim().toLowerCase();
  return SKILL_CATEGORY_MAPPING[normalized] || 'Software Engineering';
}
