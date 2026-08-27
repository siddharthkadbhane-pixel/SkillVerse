import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const firstEqual = trimmed.indexOf('=');
      if (firstEqual !== -1) {
        const key = trimmed.substring(0, firstEqual).trim();
        let value = trimmed.substring(firstEqual + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  }
}

async function testConn(url: string, name: string) {
  console.log(`Testing ${name}...`);
  const client = postgres(url, { prepare: false, timeout: 5 });
  try {
    const res = await client`SELECT 1 as connected`;
    console.log(`✅ ${name} connected successfully:`, res);
    return true;
  } catch (err: any) {
    console.log(`❌ ${name} failed: ${err.message}`);
    return false;
  } finally {
    await client.end();
  }
}

async function main() {
  const currentUrl = process.env.DATABASE_URL || '';
  await testConn(currentUrl, 'Current Pooler URL');

  // Try direct
  const directUrl = currentUrl.replace('aws-0-ap-southeast-2.pooler.supabase.com:6543', 'db.bzgznpisotfezgismedj.supabase.co:5432').replace('postgres.bzgznpisotfezgismedj', 'postgres');
  await testConn(directUrl, 'Direct Supabase URL');

  // Try session pooler on 5432
  const sessionPooler = currentUrl.replace(':6543', ':5432');
  await testConn(sessionPooler, 'Session Pooler 5432');
}

main().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
