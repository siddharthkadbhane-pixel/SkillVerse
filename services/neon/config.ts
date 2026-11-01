/**
 * Neon Ecosystem Configuration for SkillVerse
 * Manages configuration parameters pulled via `neon deploy`
 */

export const neonConfig = {
  // Postgres
  databaseUrl: process.env.DATABASE_URL || '',
  databaseUrlUnpooled: process.env.DATABASE_URL_UNPOOLED || '',
  branch: process.env.NEON_BRANCH || 'production',

  // Auth (Better Auth)
  auth: {
    baseUrl: process.env.NEON_AUTH_BASE_URL || '',
    jwksUrl: process.env.NEON_AUTH_JWKS_URL || '',
  },

  // Functions
  functions: {
    helloBaseUrl: process.env.NEON_FUNCTION_HELLO_BASE_URL || '',
  },

  // Object Storage
  storage: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    endpointUrl: process.env.AWS_ENDPOINT_URL_S3 || '',
    region: process.env.AWS_REGION || 'ap-southeast-1',
    defaultBucket: 'assets',
  },

  // Realtime
  realtime: {
    url: process.env.NEON_REALTIME_URL || '',
    secret: process.env.NEON_REALTIME_SECRET || '',
  },
};
