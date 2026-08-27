import { db, syncDatabaseSchema } from '../lib/drizzle';
import { RepositoryIntelligenceService } from '../services/intelligence/service';
import { RepositoryHealthService } from '../services/health/service';
import { TrustCalculatorService } from '../services/trust/calculator';
import { NotificationsService } from '../services/notifications/service';
import { CachingService } from '../lib/caching/service';
import { RateLimiter } from '../lib/rate-limit';
import { NextRequest } from 'next/server';
import { sql } from 'drizzle-orm';

async function runTests() {
  console.log('🚀 Starting SkillVerse Production Intelligence Engine test runner...\n');

  let failed = false;

  // Test 1: Database Auto-Sync
  try {
    console.log('🧪 Test 1: Checking Database Connectivity & Schema sync...');
    await syncDatabaseSchema();
    const result = await db.execute(sql`SELECT 1 as ping`);
    if (result && result.length > 0) {
      console.log('✅ Test 1 Passed: Database connected and auto-sync schema executed.\n');
    } else {
      throw new Error('No result returned from ping query');
    }
  } catch (err: any) {
    console.error('❌ Test 1 Failed: Database check failed.', err);
    failed = true;
  }

  // Sample Mock Context for testing Heuristics
  const mockContext = {
    metadata: {
      owner: 'siddharthkadbhane-pixel',
      defaultBranch: 'main',
      languagesBreakdown: { TypeScript: 85000, CSS: 12000, HTML: 3000 },
      openIssues: 2,
    },
    readme: '# NextJS AI Agent Project\n\n## Getting Started\n\nInstall using npm install.\n\n## Architecture\n\nUses a clean modular architecture.',
    packageJson: {
      name: 'test-project',
      dependencies: {
        'next': '^15.0.0',
        'react': '^19.0.0',
        'typescript': '^5.0.0',
        'drizzle-orm': '^0.35.0',
      },
      devDependencies: {
        'vitest': '^2.0.0',
      }
    },
    topSourceFiles: [
      { path: 'package.json', content: '{"dependencies": {}}' },
      { path: 'readme.md', content: '# Readme' },
      { path: 'tsconfig.json', content: '{}' },
      { path: 'drizzle.config.ts', content: 'export default {}' },
      { path: 'app/page.tsx', content: 'export default function Page() { return <div>Home</div> }' },
      { path: 'app/api/route.ts', content: 'export async function GET() { return Response.json({}) }' },
    ],
    commits: [
      { sha: 'sha1', message: 'initial commit', author: 'Siddharth', date: new Date().toISOString() },
      { sha: 'sha2', message: 'add api route', author: 'Siddharth', date: new Date().toISOString() },
    ],
    languagesBreakdown: { TypeScript: 85000 },
  };

  // Test 2: Repository Intelligence Report Heuristics
  let intelReport: any;
  try {
    console.log('🧪 Test 2: Evaluating Repository Intelligence Engine...');
    intelReport = RepositoryIntelligenceService.generateReport(mockContext as any);
    
    if (
      intelReport.dependencies.framework === 'Next.js' &&
      intelReport.structure.folderDepth > 0 &&
      intelReport.dependencies.hasTypeScript === true &&
      intelReport.documentation.hasSetupGuide === true
    ) {
      console.log('✅ Test 2 Passed: Intelligence report parsed correctly:');
      console.log(`   - Framework: ${intelReport.dependencies.framework}`);
      console.log(`   - Language: TypeScript (Detected)`);
      console.log(`   - Architecture Style: ${intelReport.architectureStyle}\n`);
    } else {
      throw new Error(`Invalid intelligence report values: ${JSON.stringify(intelReport)}`);
    }
  } catch (err: any) {
    console.error('❌ Test 2 Failed: Intelligence Engine failed.', err);
    failed = true;
  }

  // Test 3: Repository Health Engine Telemetry
  let healthReport: any;
  try {
    console.log('🧪 Test 3: Checking Repository Health Engine scoring...');
    healthReport = RepositoryHealthService.generateReport(mockContext as any, intelReport);

    if (
      healthReport.overallHealth > 0 &&
      healthReport.categories.documentation.score > 0 &&
      healthReport.categories.testing.score > 0 // Vitest dependency exists
    ) {
      console.log('✅ Test 3 Passed: Health scoring compiled:');
      console.log(`   - Overall Health Score: ${healthReport.overallHealth}%`);
      console.log(`   - Documentation Score: ${healthReport.categories.documentation.score}%`);
      console.log(`   - Testing Score: ${healthReport.categories.testing.score}%\n`);
    } else {
      throw new Error(`Invalid health report values: ${JSON.stringify(healthReport)}`);
    }
  } catch (err: any) {
    console.error('❌ Test 3 Failed: Health Engine failed.', err);
    failed = true;
  }

  // Test 4: Cache Engine
  try {
    console.log('🧪 Test 4: Testing Caching Service...');
    CachingService.set('test-key-cache', { data: 'test-value' }, 5);
    const cached = CachingService.get<any>('test-key-cache');
    if (cached && cached.data === 'test-value') {
      console.log('✅ Test 4 Passed: Cache set/get operations verified.\n');
    } else {
      throw new Error('Cache retrieval returned empty or incorrect values');
    }
  } catch (err: any) {
    console.error('❌ Test 4 Failed: Caching failed.', err);
    failed = true;
  }

  // Test 5: Rate Limiter
  try {
    console.log('🧪 Test 5: Evaluating Sliding Rate Limiter...');
    const fakeRequest = new NextRequest('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: { 'x-forwarded-for': '192.168.1.50' },
    });

    const check1 = RateLimiter.isAllowed(fakeRequest);
    if (check1.allowed && check1.remaining === 99) {
      console.log('✅ Test 5 Passed: Rate limiter tokens consumed correctly.\n');
    } else {
      throw new Error(`Rate limit calculation failed: ${JSON.stringify(check1)}`);
    }
  } catch (err: any) {
    console.error('❌ Test 5 Failed: Rate Limiter failed.', err);
    failed = true;
  }

  if (failed) {
    console.log('❌ TELEMETRY VERIFICATION COMPLETED WITH FAILURES.');
    process.exit(1);
  } else {
    console.log('🎉 ALL TELEMETRY VERIFICATION TESTS PASSED SUCCESSFULLY.');
    process.exit(0);
  }
}

runTests();
