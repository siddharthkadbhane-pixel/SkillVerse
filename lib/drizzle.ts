import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/database/schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

// Disable prefetch as it is recommended for Supabase connection pooling (Transaction Mode)
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
