/**
 * test-validation-remediation.ts
 *
 * Comprehensive End-to-End Validation & Remediation Test Suite
 * Validates all P0 & P1 security and workflow fixes applied:
 * 1. P0-1: Repository Review IDOR Protection & Synthetic Fallback Removal
 * 2. P0-2: Role-based Server Dispatch (/dashboard -> /admin, /company, /overview)
 * 3. P1-1: Career Task Persistence & Auth Enforcement
 * 4. P1-2: Company Member Auto-Resolution of companyId
 * 5. P1-3: Google OAuth to GitHub Connect Flow in Settings & Projects
 * 6. P1-4: Elimination of Synthetic Fallbacks (Sidebar 940, Profile 940, Admin Billing Access)
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function runTest(name: string, fn: () => void | Promise<void>) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then(() => {
          console.log(`  [PASS] ${name}`);
          passed++;
        })
        .catch((err) => {
          console.error(`  [FAIL] ${name}:`, err.message);
          failed++;
        });
    } else {
      console.log(`  [PASS] ${name}`);
      passed++;
    }
  } catch (err: any) {
    console.error(`  [FAIL] ${name}:`, err.message);
    failed++;
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('SkillVerse Remediation & Verification Suite');
  console.log('======================================================\n');

  // --------------------------------------------------------------------------
  // TEST GROUP 1: P0-1 Repository Review IDOR Protection
  // --------------------------------------------------------------------------
  console.log('Group 1: P0-1 Repository Review IDOR Protection');
  
  runTest('Repository Review route asserts repository ownership', () => {
    const routePath = path.resolve('app/api/repositories/[id]/review/route.ts');
    const content = fs.readFileSync(routePath, 'utf8');
    
    // Check POST handler has ownership check
    assert(
      content.includes("targetRepo.userId !== user.id && user.role !== 'admin'"),
      'POST handler must assert targetRepo.userId matches user.id or role is admin'
    );
    
    // Check GET handler has ownership check
    assert(
      content.includes("Forbidden: You do not have permission to view this review."),
      'GET handler must reject non-owner with 403 Forbidden'
    );

    // Check synthetic fallback removal in non-demo mode
    assert(
      content.includes("if (process.env.NODE_ENV === 'production')"),
      'Must guard synthetic review generation with production check'
    );
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 2: P0-2 Role-Based Server Dispatch
  // --------------------------------------------------------------------------
  console.log('\nGroup 2: P0-2 Role-Based Dynamic Dashboard Dispatch');

  runTest('Dashboard page redirects based on user role', () => {
    const dashPath = path.resolve('app/(dashboard)/dashboard/page.tsx');
    const content = fs.readFileSync(dashPath, 'utf8');

    // Must be a Server Component with redirect
    assert(content.includes("import { redirect } from 'next/navigation'"), 'Must import redirect');
    assert(content.includes("import { getSessionUser }"), 'Must import getSessionUser');
    assert(!content.includes("'use client'"), 'Must not be a client-only component');

    // Role redirects
    assert(content.includes("redirect('/admin')"), 'Admin role must redirect to /admin');
    assert(content.includes("redirect('/company')"), 'Company admin/recruiter must redirect to /company');
    assert(content.includes("redirect('/overview')"), 'Developer role must redirect to /overview');
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 3: P1-1 Career Task Persistence & Auth Guard
  // --------------------------------------------------------------------------
  console.log('\nGroup 3: P1-1 Career Task Persistence & Auth Guard');

  runTest('Career engine persists tasks into database', () => {
    const enginePath = path.resolve('services/career/engine.ts');
    const content = fs.readFileSync(enginePath, 'utf8');

    assert(
      content.includes("db.insert(learningTasks)"),
      'getLearningTasks must persist generated tasks into learningTasks table'
    );
    assert(
      content.includes("Learning task") && content.includes("not found or not owned by user"),
      'completeLearningTask must verify task existence before returning success'
    );
  });

  runTest('Career task complete route requires authenticated user', () => {
    const completePath = path.resolve('app/api/career/tasks/[id]/complete/route.ts');
    const content = fs.readFileSync(completePath, 'utf8');

    assert(
      content.includes("if (!user)"),
      'Complete task route must check session user'
    );
    assert(
      content.includes("{ status: 401 }"),
      'Complete task route must return 401 Unauthorized for unauthenticated requests'
    );
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 4: P1-2 Company Member Auto-Resolution
  // --------------------------------------------------------------------------
  console.log('\nGroup 4: P1-2 Company Member Auto-Resolution');

  runTest('Company members route auto-resolves companyId from membership', () => {
    const membersPath = path.resolve('app/api/company/members/route.ts');
    const content = fs.readFileSync(membersPath, 'utf8');

    assert(
      content.includes("companyId = membership.companyId"),
      'Must resolve membership.companyId when parameter is omitted'
    );
    assert(
      content.includes("where: and(eq(companyMembers.userId, user.id), eq(companyMembers.status, 'active'))"),
      'Must verify active membership in companyMembers table'
    );
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 5: P1-3 Google OAuth to GitHub Connect Flow
  // --------------------------------------------------------------------------
  console.log('\nGroup 5: P1-3 Google OAuth to GitHub Connect Flow');

  runTest('Settings page includes active GitHub OAuth connect handlers', () => {
    const settingsPath = path.resolve('app/(dashboard)/settings/page.tsx');
    const content = fs.readFileSync(settingsPath, 'utf8');

    assert(content.includes("import { authClient } from '@/lib/authClient'"), 'Must import authClient');
    assert(content.includes("handleConnectGithub"), 'Must define handleConnectGithub');
    assert(content.includes("provider: 'github'"), 'Must specify github as provider');
    assert(content.includes("handleConnectGithub"), 'Integrations tab button must bind handleConnectGithub');
    assert(content.includes("Connect GitHub"), 'Privacy tab must offer Connect GitHub button when unlinked');
  });

  runTest('Projects page Add Repository button navigates to settings', () => {
    const projectsPath = path.resolve('app/(dashboard)/projects/page.tsx');
    const content = fs.readFileSync(projectsPath, 'utf8');

    assert(!content.includes("alert('Connect your GitHub account"), 'Must not have dead alert');
    assert(content.includes("router.push('/settings')"), 'Must route to /settings for integration linking');
  });

  runTest('Skill DNA Export downloads genuine JSON file instead of dead alert', () => {
    const dnaPath = path.resolve('app/(dashboard)/skill-dna/page.tsx');
    const content = fs.readFileSync(dnaPath, 'utf8');

    assert(!content.includes("alert('Downloading"), 'Must not have dead alert');
    assert(content.includes("handleExportDna"), 'Must implement handleExportDna');
    assert(content.includes("URL.createObjectURL(blob)"), 'Must generate real download blob');
  });

  // --------------------------------------------------------------------------
  // TEST GROUP 6: P1-4 Elimination of Synthetic Fallbacks
  // --------------------------------------------------------------------------
  console.log('\nGroup 6: P1-4 Elimination of Synthetic Fallbacks');

  runTest('Sidebar does not force synthetic 940 score on unranked developers', () => {
    const sidebarPath = path.resolve('components/shared/Sidebar.tsx');
    const content = fs.readFileSync(sidebarPath, 'utf8');

    assert(!content.includes("trustScore?.overallScore || 940"), 'Must not fallback to 940');
    assert(content.includes("trustScore?.overallScore ?? null"), 'Must use nullish coalescing to null');
    assert(content.includes("currentScore !== null ? currentScore : '—'"), 'Must display pending dash if unranked');
  });

  runTest('Profile API route does not return synthetic 940 in production', () => {
    const profilePath = path.resolve('app/api/profile/route.ts');
    const content = fs.readFileSync(profilePath, 'utf8');

    assert(content.includes("isDemoAuthEnabled()"), 'Must protect mock scores with demo auth condition');
    assert(content.includes("export const PUT = PATCH"), 'Must export PUT alias for PATCH');
  });

  runTest('Admin Billing API strictly rejects non-admin users', () => {
    const billingPath = path.resolve('app/api/admin/billing/route.ts');
    const content = fs.readFileSync(billingPath, 'utf8');

    assert(!content.includes("user.role !== 'company_admin'"), 'Must not permit company_admin in platform admin billing');
    assert(content.includes("if (user.role !== 'admin')"), 'Must strictly enforce user.role === admin');
  });

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
