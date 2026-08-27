async function testRoutes() {
  console.log('======================================================');
  console.log('  🌐 TESTING SKILLVERSE HTTP ENDPOINTS & PAGES');
  console.log('======================================================\n');

  const BASE = 'http://localhost:3001';
  const routes = [
    { path: '/', expectedStatus: 200, name: 'Home Landing Page' },
    { path: '/overview', expectedStatus: 200, name: 'Dashboard Overview Page' },
    { path: '/dashboard', expectedStatus: 200, name: 'Dashboard Page' },
    { path: '/dcc', expectedStatus: 200, name: 'Developer Capability Card (DCC)' },
    { path: '/developer/siddharthkadbhane-pixel', expectedStatus: 200, name: 'Public DCC Profile' },
    { path: '/skills', expectedStatus: 200, name: 'Skills Page' },
    { path: '/repositories', expectedStatus: 200, name: 'Repositories Page' },
    { path: '/skill-dna', expectedStatus: 200, name: 'Skill DNA Page' },
    { path: '/activity', expectedStatus: 200, name: 'Activity Page' },
    { path: '/api/dcc', expectedStatus: 200, name: 'API: /api/dcc' },
    { path: '/api/dcc/growth', expectedStatus: 200, name: 'API: /api/dcc/growth' },
    { path: '/api/dcc/history', expectedStatus: 200, name: 'API: /api/dcc/history' },
    { path: '/api/dashboard/growth', expectedStatus: 200, name: 'API: /api/dashboard/growth' },
  ];

  let passed = 0;
  let failed = 0;

  for (const r of routes) {
    try {
      const res = await fetch(`${BASE}${r.path}`);
      if (res.status === r.expectedStatus || (res.status >= 200 && res.status < 400)) {
        console.log(`  ✅ [${res.status}] ${r.name} (${r.path})`);
        passed++;
      } else {
        console.error(`  ❌ [${res.status}] ${r.name} (${r.path}) - Expected ${r.expectedStatus}`);
        failed++;
      }
    } catch (err: any) {
      console.error(`  ❌ ERROR on ${r.name} (${r.path}): ${err.message}`);
      failed++;
    }
  }

  console.log('\n======================================================');
  console.log(`  📊 HTTP ROUTE RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) process.exit(1);
}

testRoutes().then(() => process.exit(0)).catch(() => process.exit(1));
