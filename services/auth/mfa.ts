// SkillVerse Multi-Factor Authentication (MFA/TOTP) Service
// RFC 6238 compliant TOTP, encrypted secret storage, and Better Auth schema alignment (Phase 46)

import crypto from 'crypto';
import { db, withDbTimeout } from '@/lib/drizzle';
import { twoFactors, users, auditLogs } from '@/database/schema';
import { eq, desc, and } from 'drizzle-orm';
import { AuditLogService } from '@/services/security/audit';
import { Logger } from '@/lib/logger';

// Base32 RFC 4648
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export interface MfaEnrollmentResult {
  secret: string; // Base32 encoded secret for manual entry
  totpURI: string; // otpauth:// URI for QR code generation
  backupCodes: string[]; // Plain backup codes (shown once to user upon enrollment)
}

export interface MfaVerificationResult {
  verified: boolean;
  method?: 'totp' | 'backup_code';
  remainingBackupCodes?: number;
  error?: string;
}

export interface MfaRecord {
  userId: string;
  secret: string; // encrypted
  backupCodes: string[]; // hashed
  verified: boolean;
  failedVerificationCount: number;
  lockedUntil?: Date | null;
  updatedAt: Date;
}

export interface IMfaStorage {
  getRecord(userId: string): Promise<MfaRecord | null>;
  saveRecord(record: MfaRecord): Promise<boolean>;
  consumeBackupCode(userId: string, codeHash: string): Promise<{ success: boolean; remainingCount: number }>;
}

/**
 * Default PostgreSQL Database Storage via Drizzle ORM
 */
export class MfaDatabaseStorage implements IMfaStorage {
  async getRecord(userId: string): Promise<MfaRecord | null> {
    try {
      const rows = await withDbTimeout(
        db.select().from(twoFactors).where(eq(twoFactors.userId, userId)).limit(1),
        2000
      );
      if (!rows || rows.length === 0) return null;
      const r = rows[0];
      return {
        userId: r.userId,
        secret: r.secret,
        backupCodes: JSON.parse(r.backupCodes || '[]'),
        verified: r.verified,
        failedVerificationCount: r.failedVerificationCount || 0,
        lockedUntil: r.lockedUntil ? new Date(r.lockedUntil) : null,
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
      };
    } catch (err) {
      Logger.error(`[MFA DB Storage] Error fetching record for user ${userId}:`, err);
      return null;
    }
  }

  async saveRecord(record: MfaRecord): Promise<boolean> {
    try {
      await withDbTimeout(
        db.insert(twoFactors)
          .values({
            userId: record.userId,
            secret: record.secret,
            backupCodes: JSON.stringify(record.backupCodes),
            verified: record.verified,
            failedVerificationCount: record.failedVerificationCount,
            lockedUntil: record.lockedUntil || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: twoFactors.userId,
            set: {
              secret: record.secret,
              backupCodes: JSON.stringify(record.backupCodes),
              verified: record.verified,
              failedVerificationCount: record.failedVerificationCount,
              lockedUntil: record.lockedUntil || null,
              updatedAt: new Date(),
            },
          }),
        3000
      );
      return true;
    } catch (err) {
      Logger.error(`[MFA DB Storage] Error saving record for user ${record.userId}:`, err);
      return false;
    }
  }

  async consumeBackupCode(userId: string, codeHash: string): Promise<{ success: boolean; remainingCount: number }> {
    try {
      return await db.transaction(async (tx) => {
        const rows = await tx.select().from(twoFactors).where(eq(twoFactors.userId, userId)).for('update');
        if (!rows || rows.length === 0) return { success: false, remainingCount: 0 };
        const row = rows[0];
        const codes: string[] = JSON.parse(row.backupCodes || '[]');
        const idx = codes.indexOf(codeHash);
        if (idx === -1) return { success: false, remainingCount: codes.length };

        codes.splice(idx, 1);
        await tx.update(twoFactors).set({
          backupCodes: JSON.stringify(codes),
          failedVerificationCount: 0,
          updatedAt: new Date(),
        }).where(eq(twoFactors.userId, userId));

        return { success: true, remainingCount: codes.length };
      });
    } catch (err) {
      Logger.error(`[MFA DB Storage] Error consuming backup code for user ${userId}:`, err);
      return { success: false, remainingCount: 0 };
    }
  }
}

/**
 * Cryptographic MFA Session Token Service
 * Issues and validates signed, session-bound, timestamped MFA tokens for skillverse_mfa_verified cookie
 */
export class MfaTokenService {
  private static readonly TOKEN_PREFIX = 'v1';
  public static readonly MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

  public static getSecretKey(): string {
    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error('[MFA Security Error] BETTER_AUTH_SECRET must be configured in production');
    }
    return secret || 'skillverse_development_better_auth_secret_minimum_32_bytes_long';
  }

  public static hashSession(sessionToken: string): string {
    return crypto.createHash('sha256').update(sessionToken || '').digest('hex').slice(0, 16);
  }

  /**
   * Creates a signed, session-bound, timestamped MFA verification token
   */
  public static createSignedToken(userId: string, sessionToken: string): string {
    if (!userId || !sessionToken) {
      throw new Error('userId and sessionToken are required to create MFA token');
    }
    const expiresAt = Date.now() + this.MAX_AGE_MS;
    const sessionHash = this.hashSession(sessionToken);
    const payload = `${this.TOKEN_PREFIX}.${userId}.${sessionHash}.${expiresAt}`;
    const signature = crypto
      .createHmac('sha256', this.getSecretKey())
      .update(payload)
      .digest('hex');
    return `${payload}.${signature}`;
  }

  /**
   * Validates a signed MFA verification token against the expected user and active session
   */
  public static verifySignedToken(
    token: string | undefined | null,
    expectedUserId: string,
    currentSessionToken: string
  ): { valid: boolean; reason?: string } {
    if (!token || typeof token !== 'string') {
      return { valid: false, reason: 'TOKEN_MISSING' };
    }

    const parts = token.split('.');
    if (parts.length !== 5) {
      return { valid: false, reason: 'TOKEN_MALFORMED' };
    }

    const [prefix, tokenUserId, tokenSessionHash, expiresAtStr, signature] = parts;

    if (prefix !== this.TOKEN_PREFIX) {
      return { valid: false, reason: 'UNSUPPORTED_VERSION' };
    }

    // 1. Verify User Binding
    if (!tokenUserId || tokenUserId !== expectedUserId) {
      return { valid: false, reason: 'USER_MISMATCH' };
    }

    // 2. Verify Session Binding
    const currentSessionHash = this.hashSession(currentSessionToken);
    if (!tokenSessionHash || tokenSessionHash !== currentSessionHash) {
      return { valid: false, reason: 'SESSION_MISMATCH' };
    }

    // 3. Verify Expiry
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { valid: false, reason: 'TOKEN_EXPIRED' };
    }

    // 4. Verify Cryptographic Signature with Timing-Safe Comparison
    const payload = `${prefix}.${tokenUserId}.${tokenSessionHash}.${expiresAtStr}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.getSecretKey())
      .update(payload)
      .digest('hex');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false, reason: 'SIGNATURE_INVALID' };
    }

    return { valid: true };
  }
}

// Temporary in-memory holding for pending enrollment awaiting initial code verification
const pendingEnrollments = new Map<string, { secret: string; backupCodes: string[]; createdAt: number }>();
let activeStorageAdapter: IMfaStorage = new MfaDatabaseStorage();

export class MfaService {
  /**
   * Allows injecting a storage adapter for multi-instance or isolation testing
   */
  public static setStorageAdapter(storage: IMfaStorage): void {
    activeStorageAdapter = storage;
  }

  public static resetStorageAdapter(): void {
    activeStorageAdapter = new MfaDatabaseStorage();
  }

  /**
   * Generates a secure random 160-bit (20 byte) secret encoded in Base32
   */
  public static generateSecret(): string {
    const buffer = crypto.randomBytes(20);
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;
      while (bits >= 5) {
        output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    if (bits > 0) {
      output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
    }
    return output;
  }

  /**
   * Generates standard RFC 6238 6-digit TOTP code
   */
  public static generateTotpCode(secretBase32: string, time = Date.now(), period = 30, digits = 6): string {
    const clean = secretBase32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
    let bits = 0;
    let value = 0;
    const bytes: number[] = [];

    for (let i = 0; i < clean.length; i++) {
      const idx = BASE32_ALPHABET.indexOf(clean[i]);
      if (idx === -1) continue;
      value = (value << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    const key = Buffer.from(bytes);
    const counter = Math.floor(time / 1000 / period);
    const counterBuf = Buffer.alloc(8);
    counterBuf.writeBigInt64BE(BigInt(counter));

    const hmac = crypto.createHmac('sha1', key).update(counterBuf).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = binary % Math.pow(10, digits);
    return otp.toString().padStart(digits, '0');
  }

  /**
   * Verifies incoming 6-digit TOTP code with time-drift window of ±1 step (±30s)
   */
  public static verifyCode(secretBase32: string, code: string, window = 1): boolean {
    if (!code || typeof code !== 'string') return false;
    const cleanCode = code.trim();
    if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) return false;

    const now = Date.now();
    const period = 30;

    for (let i = -window; i <= window; i++) {
      const expected = this.generateTotpCode(secretBase32, now + i * period * 1000, period, 6);
      if (crypto.timingSafeEqual(Buffer.from(cleanCode), Buffer.from(expected))) {
        return true;
      }
    }
    return false;
  }

  /**
   * Generates 10 single-use recovery backup codes
   */
  public static generateBackupCodes(count = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const p1 = crypto.randomBytes(2).toString('hex');
      const p2 = crypto.randomBytes(2).toString('hex');
      codes.push(`${p1}-${p2}`);
    }
    return codes;
  }

  /**
   * Hashes a backup code with SHA-256 for secure comparison
   */
  public static hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code.trim().toLowerCase()).digest('hex');
  }

  /**
   * Encrypts sensitive secrets at rest using AES-256-GCM
   */
  public static encryptSecret(plainText: string): string {
    const secretKey = crypto.createHash('sha256').update(process.env.BETTER_AUTH_SECRET || 'skillverse_development_better_auth_secret_minimum_32_bytes_long').digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', secretKey, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decrypts encrypted secret at rest
   */
  public static decryptSecret(cipherText: string): string {
    const secretKey = crypto.createHash('sha256').update(process.env.BETTER_AUTH_SECRET || 'skillverse_development_better_auth_secret_minimum_32_bytes_long').digest();
    const parts = cipherText.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted payload format');
    const [ivHex, authTagHex, encryptedHex] = parts;
    const decipher = crypto.createDecipheriv('aes-256-gcm', secretKey, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Initiates TOTP MFA enrollment for a user.
   * Generates secret, otpauth URI, and 10 single-use recovery codes.
   */
  public static initiateEnrollment(userId: string, email: string): MfaEnrollmentResult {
    const secret = this.generateSecret();
    const cleanEmail = encodeURIComponent(email.trim());
    const issuer = encodeURIComponent('SkillVerse');
    const totpURI = `otpauth://totp/${issuer}:${cleanEmail}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
    const backupCodes = this.generateBackupCodes();

    // Cache pending enrollment awaiting initial code verification
    pendingEnrollments.set(userId, {
      secret,
      backupCodes,
      createdAt: Date.now(),
    });

    return {
      secret,
      totpURI,
      backupCodes,
    };
  }

  /**
   * Confirms and activates MFA enrollment by validating the user's first 6-digit TOTP code.
   * Encrypts and persists the secret directly to persistent storage.
   */
  public static async confirmEnrollment(userId: string, code: string): Promise<boolean> {
    const pending = pendingEnrollments.get(userId);
    if (!pending) {
      Logger.warn(`[MFA] Enrollment confirmation failed: No pending enrollment found for user ${userId}`);
      return false;
    }

    // Verify first code
    const isValid = this.verifyCode(pending.secret, code);
    if (!isValid) {
      Logger.warn(`[MFA] Enrollment confirmation failed: Invalid verification code for user ${userId}`);
      return false;
    }

    // Encrypt secret & hash backup codes
    const encryptedSecret = this.encryptSecret(pending.secret);
    const hashedBackupCodes = pending.backupCodes.map((c) => this.hashBackupCode(c));

    // Save directly to persistent storage
    const saved = await activeStorageAdapter.saveRecord({
      userId,
      secret: encryptedSecret,
      backupCodes: hashedBackupCodes,
      verified: true,
      failedVerificationCount: 0,
      updatedAt: new Date(),
    });

    if (!saved) {
      Logger.error(`[MFA] Enrollment confirmation failed: Persistent storage save failed for user ${userId}`);
      return false; // FAIL CLOSED
    }

    pendingEnrollments.delete(userId);

    // Record immutable security audit event
    await AuditLogService.log({
      actorId: userId,
      actorRole: 'admin',
      action: 'MFA_ENROLLED',
      resourceType: 'user',
      resourceId: userId,
      details: {
        method: 'TOTP_RFC6238',
        backupCodesCount: hashedBackupCodes.length,
        timestamp: new Date().toISOString(),
      },
    });

    Logger.info(`[MFA] Multi-Factor Authentication successfully enrolled and verified for admin ${userId}`);
    return true;
  }

  /**
   * Checks whether a user has enrolled in MFA from persistent storage
   */
  public static async isMfaEnrolled(userId: string): Promise<boolean> {
    if (!userId) return false;

    try {
      const record = await activeStorageAdapter.getRecord(userId);
      return Boolean(record && record.verified);
    } catch {
      // Fail closed on error
      return false;
    }
  }

  /**
   * Verifies an incoming TOTP code or recovery backup code for an enrolled user.
   */
  public static async verifyUserMfa(userId: string, codeOrBackup: string): Promise<MfaVerificationResult> {
    const cleanInput = (codeOrBackup || '').trim();
    if (!cleanInput) {
      return { verified: false, error: 'CODE_REQUIRED' };
    }

    // Retrieve enrollment from persistent storage
    let record: MfaRecord | null = null;
    try {
      record = await activeStorageAdapter.getRecord(userId);
    } catch (err) {
      Logger.error(`[MFA] Storage error during verification for user ${userId}:`, err);
      return { verified: false, error: 'STORAGE_UNAVAILABLE' };
    }

    if (!record || !record.verified) {
      return { verified: false, error: 'MFA_NOT_ENROLLED' };
    }

    // Check account lockout
    if (record.lockedUntil && new Date(record.lockedUntil) > new Date()) {
      return { verified: false, error: 'MFA_ACCOUNT_LOCKED' };
    }

    // 1. Check TOTP 6-digit code
    if (/^\d{6}$/.test(cleanInput)) {
      try {
        const plainSecret = this.decryptSecret(record.secret);
        if (this.verifyCode(plainSecret, cleanInput)) {
          return { verified: true, method: 'totp' };
        }
      } catch (err: any) {
        Logger.error(`[MFA] Decryption error during TOTP verification for user ${userId}:`, err);
        return { verified: false, error: 'DECRYPTION_FAILED' };
      }
    }

    // 2. Check Backup Recovery Codes (Atomic single-use consumption)
    const hashedInput = this.hashBackupCode(cleanInput);
    if (record.backupCodes.includes(hashedInput)) {
      const consumption = await activeStorageAdapter.consumeBackupCode(userId, hashedInput);
      if (consumption.success) {
        await AuditLogService.log({
          actorId: userId,
          actorRole: 'admin',
          action: 'MFA_BACKUP_CODE_USED',
          resourceType: 'user',
          resourceId: userId,
          details: {
            remainingCodesCount: consumption.remainingCount,
            timestamp: new Date().toISOString(),
          },
        });

        return {
          verified: true,
          method: 'backup_code',
          remainingBackupCodes: consumption.remainingCount,
        };
      }
    }

    return { verified: false, error: 'INVALID_MFA_CODE' };
  }

  /**
   * Clears in-memory caches for testing
   */
  public static clearCache(): void {
    pendingEnrollments.clear();
  }
}
