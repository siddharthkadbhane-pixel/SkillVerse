import { AnalyzerContext } from '../analyzer';
import { IntelligenceReport } from '../intelligence/service';

export interface HealthScoreCategory {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  evidence: string;
}

export interface HealthReport {
  overallHealth: number;
  categories: {
    documentation: HealthScoreCategory;
    maintainability: HealthScoreCategory;
    security: HealthScoreCategory;
    performance: HealthScoreCategory;
    testing: HealthScoreCategory;
    scalability: HealthScoreCategory;
    architecture: HealthScoreCategory;
    readability: HealthScoreCategory;
    dependencyHealth: HealthScoreCategory;
    codeOrganization: HealthScoreCategory;
  };
  recommendations: {
    category: string;
    impact: 'High' | 'Medium' | 'Low';
    message: string;
    actionableStep: string;
  }[];
}

export class RepositoryHealthService {
  private static getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  }

  static generateReport(context: AnalyzerContext, intelReport: IntelligenceReport): HealthReport {
    const readme = context.readme || '';
    const packageJson = context.packageJson || {};
    const topFiles = context.topSourceFiles || [];

    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    // Category 1: Documentation (0-100)
    const docScore = intelReport.documentation.completenessRating;
    const docEvidence = `README has ${readme.length} characters with ${
      intelReport.documentation.hasSetupGuide ? 'setup guide' : 'no setup guide'
    } and ${
      intelReport.documentation.hasArchitectureSection ? 'architecture details' : 'no architecture outline'
    }.`;

    // Category 2: Maintainability (0-100)
    let maintainabilityScore = 70;
    if (deps['typescript']) maintainabilityScore += 15;
    if (deps['eslint']) maintainabilityScore += 10;
    if (intelReport.structure.folderDepth > 4) maintainabilityScore -= 10; // high complexity
    maintainabilityScore = Math.max(20, Math.min(100, maintainabilityScore));
    const maintainabilityEvidence = `Typescript configuration is ${
      deps['typescript'] ? 'enabled' : 'disabled'
    }. Codebase nesting depth is ${intelReport.structure.folderDepth} folders.`;

    // Category 3: Security (0-100)
    let securityScore = 80;
    const envDetected = topFiles.some(f => f.path.toLowerCase().includes('.env'));
    const envInCode = topFiles.some(f => f.content && f.content.includes('process.env') && !f.path.includes('.env'));
    
    if (envDetected) securityScore -= 10; // risk of env committed
    if (envInCode && !topFiles.some(f => f.path.includes('.env.example'))) {
      securityScore -= 15; // env used without example template
    }
    securityScore = Math.max(30, Math.min(100, securityScore));
    const securityEvidence = `${envDetected ? 'Sensitive environment parameter files committed.' : 'No configuration secrets committed in repository root.'} env examples are ${
      topFiles.some(f => f.path.includes('.env.example')) ? 'provided' : 'missing'
    }.`;

    // Category 4: Performance (0-100)
    let performanceScore = 75;
    if (deps['next']) performanceScore += 15; // static generation
    if (deps['recharts']) performanceScore -= 5; // heavy libraries
    const performanceEvidence = `Built with ${intelReport.dependencies.framework} and optimized using ${intelReport.dependencies.buildTool}.`;

    // Category 5: Testing (0-100)
    let testingScore = 0;
    if (deps['jest'] || deps['vitest'] || deps['@testing-library/react'] || deps['mocha']) {
      testingScore = 85;
    } else if (deps['cypress'] || deps['playwright']) {
      testingScore = 75;
    }
    const testingEvidence = testingScore > 0 
      ? 'Automated unit/integration tests framework is properly configured.' 
      : 'No test runners detected in project dependencies.';

    // Category 6: Scalability (0-100)
    let scalabilityScore = 65;
    if (deps['redis'] || deps['ioredis']) scalabilityScore += 20;
    if (deps['drizzle-orm'] || deps['prisma']) scalabilityScore += 10;
    scalabilityScore = Math.max(40, Math.min(100, scalabilityScore));
    const scalabilityEvidence = `Database access layers optimized with ${
      deps['drizzle-orm'] ? 'Drizzle ORM' : deps['prisma'] ? 'Prisma client' : 'no structured ORM'
    }.`;

    // Category 7: Architecture (0-100)
    let architectureScore = 70;
    if (intelReport.architectureStyle !== 'Unknown') architectureScore += 15;
    if (intelReport.structure.hasSrcFolder) architectureScore += 10;
    architectureScore = Math.max(30, Math.min(100, architectureScore));
    const architectureEvidence = `Code layout structures mapped as ${intelReport.architectureStyle} design pattern.`;

    // Category 8: Readability (0-100)
    let readabilityScore = 75;
    if (deps['typescript']) readabilityScore += 10;
    if (deps['prettier']) readabilityScore += 10;
    readabilityScore = Math.max(40, Math.min(100, readabilityScore));
    const readabilityEvidence = `Format constraints enforced with ${
      deps['prettier'] ? 'Prettier config' : 'no automatic prettier configuration'
    }.`;

    // Category 9: Dependency Health (0-100)
    let depHealthScore = 85;
    const hasLockfile = topFiles.some(f => f.path.includes('package-lock') || f.path.includes('pnpm-lock') || f.path.includes('yarn.lock'));
    if (!hasLockfile) depHealthScore -= 30; // no lockfile is bad for reproducibility
    depHealthScore = Math.max(40, Math.min(100, depHealthScore));
    const depHealthEvidence = `${
      hasLockfile ? 'Lockfiles are verified.' : 'No locking manifest file detected (unstable build risk).'
    } Total dependencies: ${intelReport.dependencies.totalDependencies}.`;

    // Category 10: Code Organization (0-100)
    let codeOrgScore = 70;
    if (intelReport.structure.foldersList.length > 5) codeOrgScore += 15;
    codeOrgScore = Math.max(40, Math.min(100, codeOrgScore));
    const codeOrgEvidence = `Separation of responsibilities managed across ${intelReport.structure.foldersList.length} workspace directories.`;

    // Overall Health calculation
    const categoriesList = [
      docScore, maintainabilityScore, securityScore, performanceScore,
      testingScore, scalabilityScore, architectureScore, readabilityScore,
      depHealthScore, codeOrgScore
    ];
    const overallHealth = Math.round(categoriesList.reduce((a, b) => a + b, 0) / categoriesList.length);

    // Dynamic recommendations
    const recommendations: HealthReport['recommendations'] = [];
    if (testingScore === 0) {
      recommendations.push({
        category: 'Testing',
        impact: 'High',
        message: 'No test framework detected.',
        actionableStep: 'Install Jest or Vitest and add a sample unit test suite in a /tests folder.',
      });
    }
    if (docScore < 60) {
      recommendations.push({
        category: 'Documentation',
        impact: 'High',
        message: 'Project documentation is incomplete.',
        actionableStep: 'Extend your README.md detailing project installation steps and environment guidelines.',
      });
    }
    if (!hasLockfile) {
      recommendations.push({
        category: 'Dependency Health',
        impact: 'High',
        message: 'Lockfile is missing.',
        actionableStep: 'Run npm install or pnpm install to commit a package-lock.json or pnpm-lock.yaml file.',
      });
    }
    if (securityScore < 75) {
      recommendations.push({
        category: 'Security',
        impact: 'Medium',
        message: 'Ensure environment variables template is provided.',
        actionableStep: 'Create a .env.example showing required keys, and ensure no actual .env values are committed.',
      });
    }
    if (maintainabilityScore < 80) {
      recommendations.push({
        category: 'Maintainability',
        impact: 'Medium',
        message: 'Strict typing guidelines can be improved.',
        actionableStep: 'Enable strict rules in tsconfig.json to prevent loose implicit any declarations.',
      });
    }

    // Default recommendation
    if (recommendations.length === 0) {
      recommendations.push({
        category: 'Performance',
        impact: 'Low',
        message: 'Codebase looks healthy.',
        actionableStep: 'Enable edge caching routes on your Next.js project to optimize loading speeds.',
      });
    }

    return {
      overallHealth,
      categories: {
        documentation: { score: docScore, grade: this.getGrade(docScore), evidence: docEvidence },
        maintainability: { score: maintainabilityScore, grade: this.getGrade(maintainabilityScore), evidence: maintainabilityEvidence },
        security: { score: securityScore, grade: this.getGrade(securityScore), evidence: securityEvidence },
        performance: { score: performanceScore, grade: this.getGrade(performanceScore), evidence: performanceEvidence },
        testing: { score: testingScore, grade: this.getGrade(testingScore), evidence: testingEvidence },
        scalability: { score: scalabilityScore, grade: this.getGrade(scalabilityScore), evidence: scalabilityEvidence },
        architecture: { score: architectureScore, grade: this.getGrade(architectureScore), evidence: architectureEvidence },
        readability: { score: readabilityScore, grade: this.getGrade(readabilityScore), evidence: readabilityEvidence },
        dependencyHealth: { score: depHealthScore, grade: this.getGrade(depHealthScore), evidence: depHealthEvidence },
        codeOrganization: { score: codeOrgScore, grade: this.getGrade(codeOrgScore), evidence: codeOrgEvidence },
      },
      recommendations,
    };
  }
}

export default RepositoryHealthService;
