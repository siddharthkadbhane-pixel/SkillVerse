import { AnalyzerContext } from '../analyzer';

export interface IntelligenceReport {
  structure: {
    folderDepth: number;
    totalFilesCount: number;
    foldersList: string[];
    hasSrcFolder: boolean;
  };
  configs: {
    name: string;
    detected: boolean;
    purpose: string;
  }[];
  dependencies: {
    framework: string;
    packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | 'unknown';
    totalDependencies: number;
    hasTypeScript: boolean;
    buildTool: string;
  };
  documentation: {
    readmeLength: number;
    hasSetupGuide: boolean;
    hasArchitectureSection: boolean;
    hasAPIReference: boolean;
    completenessRating: number; // 0-100
  };
  architectureStyle: 'Monolith' | 'Microservices' | 'Modular Monolith' | 'Serverless' | 'MVC' | 'Clean Architecture' | 'Unknown';
}

export class RepositoryIntelligenceService {
  static generateReport(context: AnalyzerContext): IntelligenceReport {
    const readme = context.readme || '';
    const packageJson = context.packageJson || {};
    const metadata = context.metadata || {};
    const topFiles = context.topSourceFiles || [];

    // 1. Folder structure & distribution heuristics
    const folders = new Set<string>();
    let maxDepth = 0;
    
    topFiles.forEach(file => {
      const parts = file.path.split('/');
      if (parts.length > maxDepth) maxDepth = parts.length;
      if (parts.length > 1) {
        folders.add(parts[0]);
      }
    });

    const hasSrcFolder = folders.has('src');

    // 2. Config files checks
    const configList = [
      { name: 'tsconfig.json', path: 'tsconfig.json', purpose: 'TypeScript configuration' },
      { name: 'drizzle.config.ts', path: 'drizzle.config.ts', purpose: 'Drizzle ORM configuration' },
      { name: 'prisma.schema', path: 'prisma/schema.prisma', purpose: 'Prisma ORM schema' },
      { name: 'tailwind.config.ts', path: 'tailwind.config.ts', purpose: 'Tailwind CSS styling configuration' },
      { name: 'next.config.js', path: 'next.config', purpose: 'Next.js configuration file' },
      { name: 'vite.config.ts', path: 'vite.config', purpose: 'Vite bundler configuration' },
      { name: '.env.example', path: '.env.example', purpose: 'Environment parameters guidelines template' },
      { name: 'Dockerfile', path: 'dockerfile', purpose: 'Container image definition' },
    ];

    const detectedConfigs = configList.map(cfg => {
      const isDetected = topFiles.some(f => f.path.toLowerCase().includes(cfg.path.toLowerCase())) 
        || (cfg.name === 'tsconfig.json' && packageJson.devDependencies?.typescript)
        || (cfg.name === 'drizzle.config.ts' && packageJson.dependencies?.['drizzle-orm']);
      return {
        name: cfg.name,
        detected: !!isDetected,
        purpose: cfg.purpose,
      };
    });

    // 3. Dependency analytics
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    let framework = 'Vanilla Javascript';
    if (deps['next']) framework = 'Next.js';
    else if (deps['react']) framework = 'React';
    else if (deps['vue']) framework = 'Vue';
    else if (deps['express']) framework = 'Express.js';
    else if (deps['@nestjs/core']) framework = 'NestJS';

    let buildTool = 'npm';
    if (deps['vite']) buildTool = 'Vite';
    else if (deps['next']) buildTool = 'Next.js Compiler';
    else if (deps['webpack']) buildTool = 'Webpack';

    // Package manager guess based on files
    let packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | 'unknown' = 'npm';
    if (topFiles.some(f => f.path.includes('pnpm-lock.yaml'))) packageManager = 'pnpm';
    else if (topFiles.some(f => f.path.includes('yarn.lock'))) packageManager = 'yarn';
    else if (topFiles.some(f => f.path.includes('bun.lockb'))) packageManager = 'bun';

    // 4. Documentation Analysis
    const readmeLower = readme.toLowerCase();
    const hasSetupGuide = readmeLower.includes('install') || readmeLower.includes('setup') || readmeLower.includes('getting started');
    const hasArchitectureSection = readmeLower.includes('architecture') || readmeLower.includes('folder structure') || readmeLower.includes('design');
    const hasAPIReference = readmeLower.includes('api') || readmeLower.includes('endpoints') || readmeLower.includes('usage');

    let completenessRating = 20;
    if (readme.length > 500) completenessRating += 20;
    if (readme.length > 2000) completenessRating += 20;
    if (hasSetupGuide) completenessRating += 15;
    if (hasArchitectureSection) completenessRating += 15;
    if (hasAPIReference) completenessRating += 10;
    completenessRating = Math.min(100, completenessRating);

    // 5. Architecture Style heuristic
    let architectureStyle: IntelligenceReport['architectureStyle'] = 'MVC';
    if (deps['next']) {
      architectureStyle = 'Serverless';
    } else if (folders.has('app') || folders.has('features')) {
      architectureStyle = 'Modular Monolith';
    } else if (folders.has('services') && folders.has('controllers')) {
      architectureStyle = 'Clean Architecture';
    }

    return {
      structure: {
        folderDepth: maxDepth,
        totalFilesCount: topFiles.length,
        foldersList: Array.from(folders).slice(0, 15),
        hasSrcFolder,
      },
      configs: detectedConfigs,
      dependencies: {
        framework,
        packageManager,
        totalDependencies: Object.keys(deps).length,
        hasTypeScript: !!deps['typescript'],
        buildTool,
      },
      documentation: {
        readmeLength: readme.length,
        hasSetupGuide,
        hasArchitectureSection,
        hasAPIReference,
        completenessRating,
      },
      architectureStyle,
    };
  }
}

export default RepositoryIntelligenceService;
