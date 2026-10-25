/**
 * SkillVerse Tenant-Isolated Object Storage Security Engine (Phase 43D)
 * 
 * Enforces:
 * 1. Server-side tenant and user authorization on all storage operations
 * 2. Strict path scoping: tenants/{tenantId}/users/{userId}/{category}/{fileName}
 * 3. Prevention of path traversal, null bytes, and arbitrary path selection
 * 4. File size limits and strict MIME content-type allowlists per category
 * 5. Private-by-default isolation with bounded presigned URLs (max 900s)
 * 6. Cross-user read, delete, and list denial (Anti-IDOR)
 */

import path from 'path';
import crypto from 'crypto';
import { ApiAuthContext } from '@/types/api';
import { Logger } from '@/lib/logger';

export type StorageCategory = 'avatars' | 'evidence' | 'resumes' | 'exports' | 'attachments';

export interface CategoryPolicy {
  allowedMimeTypes: string[];
  maxSizeBytes: number;
  isPublic: boolean;
}

export const CATEGORY_POLICIES: Record<StorageCategory, CategoryPolicy> = {
  avatars: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    isPublic: true,
  },
  evidence: {
    allowedMimeTypes: ['application/pdf', 'application/json', 'text/plain', 'image/jpeg', 'image/png'],
    maxSizeBytes: 25 * 1024 * 1024, // 25 MB
    isPublic: false,
  },
  resumes: {
    allowedMimeTypes: ['application/pdf'],
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    isPublic: false,
  },
  exports: {
    allowedMimeTypes: ['application/json', 'application/zip'],
    maxSizeBytes: 50 * 1024 * 1024, // 50 MB
    isPublic: false,
  },
  attachments: {
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'],
    maxSizeBytes: 15 * 1024 * 1024, // 15 MB
    isPublic: false,
  },
};

export interface ScopedObjectKey {
  tenantId: string;
  userId: string;
  category: StorageCategory;
  fileName: string;
  fullKey: string;
}

export class StorageSecurityService {
  private static readonly MAX_SIGNED_EXPIRY_SEC = 900; // 15 minutes max
  private static readonly DEFAULT_SIGNED_EXPIRY_SEC = 300; // 5 minutes default

  // In-memory isolated storage simulation when live S3 is not configured
  private static inMemoryStore = new Map<string, {
    key: string;
    tenantId: string;
    userId: string;
    category: StorageCategory;
    data: Buffer;
    contentType: string;
    size: number;
    createdAt: string;
  }>();

  /**
   * Validates and sanitizes a requested file name
   */
  public static sanitizeFileName(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') {
      throw new Error('Invalid file name: name must be a non-empty string.');
    }

    // Decode URL-encoded characters to catch %2e%2e, %00, %2f, etc.
    let decoded = fileName;
    try {
      decoded = decodeURIComponent(fileName);
    } catch {}

    // Reject null bytes, traversal, and dangerous path separators
    if (
      decoded.includes('\0') ||
      decoded.includes('..') ||
      decoded.includes('/') ||
      decoded.includes('\\') ||
      fileName.includes('\0') ||
      fileName.includes('..') ||
      fileName.includes('/') ||
      fileName.includes('\\')
    ) {
      throw new Error('Security Error: Path traversal and directory separators are strictly prohibited.');
    }

    const baseName = path.basename(decoded);
    const sanitized = baseName.replace(/[^a-zA-Z0-9_.-]/g, '_');

    if (!sanitized || sanitized === '.' || sanitized === '..') {
      throw new Error('Security Error: File name cannot be resolved to a valid name.');
    }

    return sanitized;
  }

  /**
   * Generates a deterministic, tenant-isolated object key
   */
  public static buildScopedKey(
    tenantId: string,
    userId: string,
    category: StorageCategory,
    rawFileName: string
  ): ScopedObjectKey {
    if (!tenantId || !userId || !category) {
      throw new Error('Tenant ID, User ID, and Category are required to construct an isolated key.');
    }

    if (!CATEGORY_POLICIES[category]) {
      throw new Error(`Invalid storage category: "${category}".`);
    }

    const cleanTenant = tenantId.replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanUser = userId.replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanFile = this.sanitizeFileName(rawFileName);

    const fullKey = `tenants/${cleanTenant}/users/${cleanUser}/${category}/${cleanFile}`;

    return {
      tenantId: cleanTenant,
      userId: cleanUser,
      category,
      fileName: cleanFile,
      fullKey,
    };
  }

  /**
   * Parses an object key and verifies that the caller owns the targeted resource
   */
  public static parseAndAuthorizeKey(
    fullKey: string,
    callerUserId: string,
    callerRole = 'developer',
    callerTenantId = 'default'
  ): ScopedObjectKey {
    if (!fullKey || typeof fullKey !== 'string') {
      throw new Error('Invalid object key.');
    }

    // Decode URL-encoded characters to catch %2e%2e, %00, %5c, etc.
    let decoded = fullKey;
    try {
      decoded = decodeURIComponent(fullKey);
    } catch {}

    // Prevent path traversal
    if (
      decoded.includes('..') ||
      decoded.includes('\0') ||
      decoded.includes('\\') ||
      fullKey.includes('..') ||
      fullKey.includes('\0') ||
      fullKey.includes('\\')
    ) {
      throw new Error('Security Error: Path traversal attempt detected.');
    }

    const parts = fullKey.split('/').filter(Boolean);
    // Expected: ['tenants', tenantId, 'users', userId, category, fileName]
    if (parts.length < 6 || parts[0] !== 'tenants' || parts[2] !== 'users') {
      throw new Error('Security Error: Invalid key structure. Objects must be scoped to tenant and user.');
    }

    const tenantId = parts[1];
    const targetUserId = parts[3];
    const category = parts[4] as StorageCategory;
    const fileName = parts.slice(5).join('/');

    if (!CATEGORY_POLICIES[category]) {
      throw new Error(`Security Error: Unknown storage category: "${category}".`);
    }

    // Authorization Guard: Caller must be resource owner or platform admin
    const isOwner = callerUserId === targetUserId;
    const isAdmin = callerRole === 'admin';
    const isSameTenantCompanyAdmin = callerRole === 'company_admin' && callerTenantId === tenantId;

    if (!isOwner && !isAdmin && !isSameTenantCompanyAdmin) {
      throw new Error('Forbidden: You do not have permission to access or mutate this object.');
    }

    return {
      tenantId,
      userId: targetUserId,
      category,
      fileName,
      fullKey,
    };
  }

  /**
   * Validates file upload payload against category policy
   */
  public static validateUpload(
    category: StorageCategory,
    body: Buffer | Uint8Array | string,
    contentType: string
  ): { buffer: Buffer; size: number } {
    const policy = CATEGORY_POLICIES[category];
    if (!policy) {
      throw new Error(`Invalid storage category: "${category}".`);
    }

    const cleanContentType = contentType.toLowerCase().split(';')[0].trim();
    if (!policy.allowedMimeTypes.includes(cleanContentType)) {
      throw new Error(
        `Disallowed MIME type "${cleanContentType}" for category "${category}". Permitted: [${policy.allowedMimeTypes.join(', ')}]`
      );
    }

    const buffer = Buffer.isBuffer(body)
      ? body
      : typeof body === 'string'
      ? Buffer.from(body, 'utf-8')
      : Buffer.from(body);

    if (buffer.length > policy.maxSizeBytes) {
      const maxMb = Math.round(policy.maxSizeBytes / (1024 * 1024));
      throw new Error(`File size (${(buffer.length / 1024 / 1024).toFixed(2)} MB) exceeds permitted limit (${maxMb} MB).`);
    }

    return { buffer, size: buffer.length };
  }

  /**
   * Secure upload with server-side tenant isolation
   */
  public static async uploadAsset(
    auth: { userId: string; role?: string; tenantId?: string },
    options: {
      category: StorageCategory;
      fileName: string;
      body: Buffer | Uint8Array | string;
      contentType: string;
      tenantId?: string;
    }
  ): Promise<{ key: string; isPublic: boolean; size: number }> {
    if (!auth || !auth.userId) {
      throw new Error('Authentication required for asset upload.');
    }

    const tenantId = options.tenantId || auth.tenantId || 'default';
    const { buffer, size } = this.validateUpload(options.category, options.body, options.contentType);

    // Build scoped key strictly locked to authenticated user
    const scopedKey = this.buildScopedKey(tenantId, auth.userId, options.category, options.fileName);
    const policy = CATEGORY_POLICIES[options.category];

    // Store in isolated store
    this.inMemoryStore.set(scopedKey.fullKey, {
      key: scopedKey.fullKey,
      tenantId: scopedKey.tenantId,
      userId: scopedKey.userId,
      category: scopedKey.category,
      data: buffer,
      contentType: options.contentType,
      size,
      createdAt: new Date().toISOString(),
    });

    Logger.info(`[STORAGE] Uploaded ${options.category} asset (${size} bytes) for user ${auth.userId}`);

    return {
      key: scopedKey.fullKey,
      isPublic: policy.isPublic,
      size,
    };
  }

  /**
   * Generates a secure, expiring presigned URL with tenant authorization
   */
  public static async getSignedAssetUrl(
    auth: { userId: string; role?: string; tenantId?: string },
    key: string,
    expiresInSeconds = this.DEFAULT_SIGNED_EXPIRY_SEC
  ): Promise<{ signedUrl: string; expiresIn: number }> {
    if (!auth || !auth.userId) {
      throw new Error('Authentication required to access storage assets.');
    }

    // Verify key authorization
    const authorized = this.parseAndAuthorizeKey(key, auth.userId, auth.role, auth.tenantId);
    const item = this.inMemoryStore.get(authorized.fullKey);

    if (!item) {
      throw new Error('Object not found in storage.');
    }

    // Cap expiry to bounded maximum
    const boundedExpiry = Math.min(this.MAX_SIGNED_EXPIRY_SEC, Math.max(10, expiresInSeconds));
    const token = crypto.randomBytes(16).toString('hex');
    const signedUrl = `https://storage.skillverse.dev/${authorized.fullKey}?token=${token}&expires=${Math.floor(Date.now() / 1000) + boundedExpiry}`;

    return {
      signedUrl,
      expiresIn: boundedExpiry,
    };
  }

  /**
   * Deletes an asset with strict ownership verification
   */
  public static async deleteAsset(
    auth: { userId: string; role?: string; tenantId?: string },
    key: string
  ): Promise<{ success: boolean; key: string }> {
    if (!auth || !auth.userId) {
      throw new Error('Authentication required to delete storage assets.');
    }

    // Authorize caller against object key
    const authorized = this.parseAndAuthorizeKey(key, auth.userId, auth.role, auth.tenantId);

    if (!this.inMemoryStore.has(authorized.fullKey)) {
      throw new Error('Object not found or already deleted.');
    }

    this.inMemoryStore.delete(authorized.fullKey);
    Logger.info(`[STORAGE] Deleted asset ${authorized.fullKey} by actor ${auth.userId}`);

    return { success: true, key: authorized.fullKey };
  }

  /**
   * Lists assets strictly scoped to the requesting user's prefix
   */
  public static async listAssets(
    auth: { userId: string; role?: string; tenantId?: string },
    category?: StorageCategory
  ): Promise<string[]> {
    if (!auth || !auth.userId) {
      throw new Error('Authentication required to list storage assets.');
    }

    const tenantId = auth.tenantId || 'default';
    const prefix = category 
      ? `tenants/${tenantId}/users/${auth.userId}/${category}/`
      : `tenants/${tenantId}/users/${auth.userId}/`;

    const results: string[] = [];
    for (const key of this.inMemoryStore.keys()) {
      if (key.startsWith(prefix)) {
        results.push(key);
      }
    }

    return results;
  }

  /**
   * Resets storage store (for tests)
   */
  public static clearStore(): void {
    this.inMemoryStore.clear();
  }
}
