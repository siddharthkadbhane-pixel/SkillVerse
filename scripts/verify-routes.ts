async function testAllRoutes() {
  const routes = [
    'http://localhost:3000/api/dcc',
    'http://localhost:3000/api/dcc/growth',
    'http://localhost:3000/api/dcc/growth?skill=React',
    'http://localhost:3000/api/dcc/evidence',
    'http://localhost:3000/api/dcc/evidence?skill=TypeScript',
    'http://localhost:3000/api/dashboard/growth',
    'http://localhost:3000/dcc',
    'http://localhost:3000/overview',
    'http://localhost:3000/skills/react',
    'http://localhost:3000/skill-dna',
    'http://localhost:3000/developer/siddharthkadbhane-pixel',
    'http://localhost:3000/developers/siddharthkadbhane-pixel',
  ];

  console.log('Testing Next.js HTTP routes:');
  for (const url of routes) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      console.log(`  [${res.status}] ${url}`);
      if (!res.ok) {
        const text = await res.text();
        console.error(`    Error snippet: ${text.slice(0, 300)}`);
      }
    } catch (e: any) {
      console.error(`  [FAILED] ${url}: ${e.message}`);
    }
  }
}

testAllRoutes();
