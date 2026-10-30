import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { sql } from 'drizzle-orm';
import { NeonStorageService } from '@/services/neon/storage';
import { NeonAuthService } from '@/services/neon/auth';
import { NeonFunctionsService } from '@/services/neon/functions';
import { NeonRealtimeService } from '@/services/neon/realtime';

export async function GET() {
  const results: Record<string, any> = {};

  // 1. Postgres Database
  try {
    const dbRes = await db.execute(sql`SELECT current_database() as db, version() as version;`);
    results.postgres = {
      status: 'healthy',
      database: dbRes[0]?.db || 'neondb',
      driver: 'postgres.js (Drizzle ORM)',
    };
  } catch (err: any) {
    results.postgres = { status: 'error', error: err.message };
  }

  // 2. Neon Auth
  try {
    const authRes = await NeonAuthService.checkHealth();
    results.auth = {
      status: authRes.ok ? 'healthy' : 'warning',
      jwksUrl: authRes.jwksUrl,
      message: authRes.message,
    };
  } catch (err: any) {
    results.auth = { status: 'error', error: err.message };
  }

  // 3. Object Storage
  try {
    const storageRes = await NeonStorageService.checkHealth();
    results.objectStorage = {
      status: storageRes.ok ? 'healthy' : 'warning',
      bucket: storageRes.bucket,
      message: storageRes.message,
    };
  } catch (err: any) {
    results.objectStorage = { status: 'error', error: err.message };
  }

  // 4. Serverless Functions
  try {
    const fnRes = await NeonFunctionsService.invokeHello();
    results.functions = {
      status: fnRes.ok ? 'healthy' : 'warning',
      url: fnRes.url,
      output: fnRes.text.trim(),
    };
  } catch (err: any) {
    results.functions = { status: 'error', error: err.message };
  }

  // 5. Realtime
  try {
    const rtRes = NeonRealtimeService.checkHealth();
    results.realtime = {
      status: rtRes.ok ? 'healthy' : 'warning',
      url: rtRes.url,
      configured: rtRes.hasSecret,
    };
  } catch (err: any) {
    results.realtime = { status: 'error', error: err.message };
  }

  return NextResponse.json({
    platform: 'Neon Cloud Ecosystem',
    timestamp: new Date().toISOString(),
    services: results,
  });
}
