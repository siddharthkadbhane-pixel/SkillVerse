// SkillVerse Enterprise Structured Logger & Secret Masking (Phase 40)

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'AUDIT';

export interface StructuredLogPayload {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  durationMs?: number;
  meta?: Record<string, any>;
  error?: {
    name?: string;
    message: string;
    code?: string;
  };
}

export class Logger {
  private static isProduction = process.env.NODE_ENV === 'production';

  /**
   * Masks sensitive credentials (API tokens, GitHub tokens, Bearer secrets, Webhook keys)
   */
  public static maskSecrets(input: string): string {
    if (!input || typeof input !== 'string') return input;

    return input
      // Mask PATs: sk_live_xxxxxxxx
      .replace(/sk_live_[a-zA-Z0-9_-]{20,}/g, (match) => `${match.slice(0, 10)}...[MASKED]`)
      // Mask GitHub Tokens: ghp_xxxxxxxx, gho_xxxxxxxx
      .replace(/gh[pousr]_[a-zA-Z0-9]{20,}/g, (match) => `${match.slice(0, 6)}...[MASKED]`)
      // Mask Webhook Secrets: whsec_xxxxxxxx
      .replace(/whsec_[a-zA-Z0-9_-]{16,}/g, (match) => `${match.slice(0, 8)}...[MASKED]`)
      // Mask Authorization Bearer headers
      .replace(/Bearer\s+([a-zA-Z0-9_\-\.]{15,})/gi, 'Bearer [MASKED_TOKEN]')
      // Mask PostgreSQL database passwords
      .replace(/(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@)/gi, '$1[MASKED_PASSWORD]$3');
  }

  /**
   * Deeply sanitizes meta objects to prevent accidental token or credential dumping
   */
  private static sanitizeMeta(meta?: any): any {
    if (!meta) return undefined;
    if (typeof meta === 'string') return this.maskSecrets(meta);
    if (typeof meta !== 'object') return meta;

    const SENSITIVE_FIELDS = new Set([
      'token',
      'password',
      'secret',
      'authorization',
      'githubtoken',
      'github_token',
      'apikey',
      'api_key',
    ]);

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(meta)) {
      if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED_SECRET]';
      } else if (typeof value === 'string') {
        sanitized[key] = this.maskSecrets(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeMeta(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private static formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const maskedMessage = this.maskSecrets(message);
    const cleanMeta = this.sanitizeMeta(meta);

    if (this.isProduction) {
      const payload: StructuredLogPayload = {
        timestamp,
        level,
        message: maskedMessage,
        meta: cleanMeta,
      };
      return JSON.stringify(payload);
    }

    const metaString = cleanMeta ? ` | Meta: ${JSON.stringify(cleanMeta)}` : '';
    return `[${timestamp}] [${level}] ${maskedMessage}${metaString}`;
  }

  static info(message: string, meta?: any) {
    console.log(this.formatMessage('INFO', message, meta));
  }

  static warn(message: string, meta?: any) {
    console.warn(this.formatMessage('WARN', message, meta));
  }

  static error(message: string, error?: any, meta?: any) {
    const maskedMessage = this.maskSecrets(message);
    const cleanMeta = this.sanitizeMeta(meta);

    const errorDetails = error
      ? {
          name: error.name || 'Error',
          message: this.maskSecrets(error.message || String(error)),
        }
      : undefined;

    if (this.isProduction) {
      const payload: StructuredLogPayload = {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: maskedMessage,
        meta: cleanMeta,
        error: errorDetails,
      };
      console.error(JSON.stringify(payload));
      return;
    }

    const errStr = errorDetails ? ` | Error: ${errorDetails.message}` : '';
    console.error(this.formatMessage('ERROR', maskedMessage, cleanMeta) + errStr);
  }

  static audit(action: string, actorId?: string, details?: any) {
    const timestamp = new Date().toISOString();
    const cleanDetails = this.sanitizeMeta(details);

    if (this.isProduction) {
      console.log(
        JSON.stringify({
          timestamp,
          level: 'AUDIT',
          action,
          actorId: actorId || 'system',
          details: cleanDetails,
        })
      );
      return;
    }

    console.log(`[${timestamp}] [AUDIT] Action: ${action} | Actor: ${actorId || 'system'} | Details: ${JSON.stringify(cleanDetails)}`);
  }
}

export default Logger;
