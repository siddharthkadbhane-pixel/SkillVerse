import type { Config } from 'drizzle-kit';
import { validateMigratorDatabaseConfig } from './lib/db-config';

// Migration connection validation (Phase 44F):
// - Production requires explicit MIGRATOR_DATABASE_URL (prohibits runtime DATABASE_URL or owner fallback)
// - Development fallback supports MIGRATOR_DATABASE_URL || DATABASE_URL_UNPOOLED || DIRECT_URL || DATABASE_URL
const migratorConfig = validateMigratorDatabaseConfig(process.env);

export default {
  schema: './database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: migratorConfig.connectionString,
  },
} satisfies Config;
