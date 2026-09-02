// SkillVerse Privacy & Grievance Request Engine (Phase 41)

import { db, withDbTimeout } from '@/lib/drizzle';
import { privacyRequests } from '@/database/schema';
import { eq, desc } from 'drizzle-orm';
import { PrivacyRequest, PrivacyRequestType, PrivacyRequestStatus } from '@/types/privacy';
import { AuditLogService } from '@/services/security/audit';
import { Logger } from '@/lib/logger';

const inMemoryRequests: PrivacyRequest[] = [];

export class PrivacyRequestService {
  /**
   * Submits a formal privacy request or grievance
   */
  public static async submitRequest(params: {
    userId?: string | null;
    email: string;
    name?: string | null;
    requestType: PrivacyRequestType;
    details: string;
  }): Promise<PrivacyRequest> {
    const request: PrivacyRequest = {
      id: `req_priv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: params.userId || null,
      email: params.email,
      name: params.name || null,
      requestType: params.requestType,
      details: params.details,
      status: 'pending',
      responseNotes: null,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };

    inMemoryRequests.unshift(request);

    // Persist to DB
    try {
      await withDbTimeout(
        db.insert(privacyRequests).values({
          userId: params.userId ? (params.userId as any) : null,
          email: params.email,
          name: params.name,
          requestType: params.requestType,
          details: params.details,
          status: 'pending',
        }),
        120
      );
    } catch {
      // In-memory store updated safely
    }

    // Audit log
    await AuditLogService.log({
      actorId: params.userId || null,
      action: 'privacy.request_submitted',
      resourceType: 'privacy_request',
      resourceId: request.id,
      details: { requestType: params.requestType, email: params.email },
    });

    Logger.info(`[PRIVACY] Grievance/Privacy request submitted (${params.requestType}) by ${params.email}`);

    return request;
  }

  /**
   * Lists privacy requests (for administrators)
   */
  public static async listRequests(statusFilter?: PrivacyRequestStatus): Promise<PrivacyRequest[]> {
    if (statusFilter) {
      return inMemoryRequests.filter((r) => r.status === statusFilter);
    }
    return inMemoryRequests;
  }

  /**
   * Resolves or updates a privacy request
   */
  public static async updateRequestStatus(
    requestId: string,
    status: PrivacyRequestStatus,
    responseNotes?: string,
    adminId?: string
  ): Promise<PrivacyRequest | null> {
    const req = inMemoryRequests.find((r) => r.id === requestId);
    if (!req) return null;

    req.status = status;
    req.responseNotes = responseNotes || req.responseNotes;
    if (status === 'completed' || status === 'rejected') {
      req.resolvedAt = new Date().toISOString();
    }

    await AuditLogService.log({
      actorId: adminId || 'admin',
      action: 'privacy.request_resolved',
      resourceType: 'privacy_request',
      resourceId: requestId,
      details: { status, responseNotes },
    });

    return req;
  }
}
