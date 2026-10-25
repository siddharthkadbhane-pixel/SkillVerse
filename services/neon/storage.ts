import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { neonConfig } from './config';
import { StorageSecurityService, StorageCategory, CATEGORY_POLICIES } from '@/services/storage/isolation';

let s3ClientInstance: S3Client | null = null;

export function getNeonS3Client(): S3Client {
  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: neonConfig.storage.region,
      endpoint: neonConfig.storage.endpointUrl || undefined,
      credentials: {
        accessKeyId: neonConfig.storage.accessKeyId,
        secretAccessKey: neonConfig.storage.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }
  return s3ClientInstance;
}

export class NeonStorageService {
  private static bucket = neonConfig.storage.defaultBucket;
  private static readonly MAX_SIGNED_EXPIRY_SEC = 900;

  /**
   * Healthcheck test to verify bucket availability
   */
  static async checkHealth(): Promise<{ ok: boolean; bucket: string; message: string }> {
    try {
      const client = getNeonS3Client();
      await client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return { ok: true, bucket: this.bucket, message: 'Bucket is accessible' };
    } catch (err: any) {
      return {
        ok: err?.$metadata?.httpStatusCode < 500,
        bucket: this.bucket,
        message: err.message || 'Storage check complete',
      };
    }
  }

  /**
   * Upload an asset to the Neon assets bucket with tenant scoping and validation
   */
  static async uploadAsset(
    auth: { userId: string; role?: string; tenantId?: string },
    options: {
      category: StorageCategory;
      fileName: string;
      body: Buffer | Uint8Array | string;
      contentType: string;
      tenantId?: string;
    }
  ): Promise<{ key: string; url: string; isPublic: boolean }> {
    if (!auth || !auth.userId) {
      throw new Error('Unauthorized: Authentication required for object storage uploads.');
    }

    const tenantId = options.tenantId || auth.tenantId || 'default';
    const { buffer } = StorageSecurityService.validateUpload(options.category, options.body, options.contentType);
    const scopedKey = StorageSecurityService.buildScopedKey(tenantId, auth.userId, options.category, options.fileName);
    const policy = CATEGORY_POLICIES[options.category];

    // If S3 credentials are configured, send to S3
    if (neonConfig.storage.accessKeyId && neonConfig.storage.secretAccessKey) {
      const client = getNeonS3Client();
      await client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: scopedKey.fullKey,
          Body: buffer,
          ContentType: options.contentType,
        })
      );
    } else {
      // Store in memory security store for offline/test environments
      await StorageSecurityService.uploadAsset(auth, options);
    }

    const endpoint = neonConfig.storage.endpointUrl || 'https://storage.skillverse.dev';
    return {
      key: scopedKey.fullKey,
      url: policy.isPublic ? `${endpoint}/${this.bucket}/${scopedKey.fullKey}` : '',
      isPublic: policy.isPublic,
    };
  }

  /**
   * Generate presigned URL for secure asset download with strict authorization
   */
  static async getSignedAssetUrl(
    auth: { userId: string; role?: string; tenantId?: string },
    key: string,
    expiresInSeconds = 300
  ): Promise<string> {
    if (!auth || !auth.userId) {
      throw new Error('Unauthorized: Authentication required to generate presigned download URL.');
    }

    // Enforce authorization & Anti-IDOR check
    const authorized = StorageSecurityService.parseAndAuthorizeKey(key, auth.userId, auth.role, auth.tenantId);
    const boundedExpiry = Math.min(this.MAX_SIGNED_EXPIRY_SEC, Math.max(10, expiresInSeconds));

    if (neonConfig.storage.accessKeyId && neonConfig.storage.secretAccessKey) {
      const client = getNeonS3Client();
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: authorized.fullKey,
      });
      return getSignedUrl(client, command, { expiresIn: boundedExpiry });
    }

    // Mock presigned URL for offline/test environment
    const res = await StorageSecurityService.getSignedAssetUrl(auth, key, boundedExpiry);
    return res.signedUrl;
  }

  /**
   * Delete an asset with strict ownership verification
   */
  static async deleteAsset(
    auth: { userId: string; role?: string; tenantId?: string },
    key: string
  ): Promise<{ success: boolean; key: string }> {
    if (!auth || !auth.userId) {
      throw new Error('Unauthorized: Authentication required to delete assets.');
    }

    const authorized = StorageSecurityService.parseAndAuthorizeKey(key, auth.userId, auth.role, auth.tenantId);

    if (neonConfig.storage.accessKeyId && neonConfig.storage.secretAccessKey) {
      const client = getNeonS3Client();
      await client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: authorized.fullKey,
        })
      );
    }

    await StorageSecurityService.deleteAsset(auth, key).catch(() => {});
    return { success: true, key: authorized.fullKey };
  }

  /**
   * List files in the assets bucket strictly scoped to caller's namespace
   */
  static async listAssets(
    auth: { userId: string; role?: string; tenantId?: string },
    category?: StorageCategory
  ): Promise<string[]> {
    if (!auth || !auth.userId) {
      throw new Error('Unauthorized: Authentication required to list storage assets.');
    }

    const tenantId = auth.tenantId || 'default';
    const scopedPrefix = category 
      ? `tenants/${tenantId}/users/${auth.userId}/${category}/`
      : `tenants/${tenantId}/users/${auth.userId}/`;

    if (neonConfig.storage.accessKeyId && neonConfig.storage.secretAccessKey) {
      const client = getNeonS3Client();
      const res = await client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: scopedPrefix,
          MaxKeys: 100,
        })
      );
      return (res.Contents || []).map((item) => item.Key || '').filter(Boolean);
    }

    return StorageSecurityService.listAssets(auth, category);
  }
}

