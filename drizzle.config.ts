import type { Config } from 'drizzle-kit';

export default {
  schema: './database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DIRECT_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
  },
} satisfies Config;
