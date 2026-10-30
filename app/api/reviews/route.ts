import { NextRequest, NextResponse } from 'next/server';
import { db, withDbTimeout } from '@/lib/drizzle';
import { peerReviews, notifications } from '@/database/schema';
import { AuthorizationGuard } from '@/services/security/authorizer';
import { Logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const auth = await AuthorizationGuard.requireAuth(req);
    if (!auth.authorized) {
      return auth.response!;
    }

    const userId = auth.context.user.id;
    const body = await req.json();
    const { repositoryId, score, notes } = body;

    if (!repositoryId) {
      return NextResponse.json({
        success: false,
        error: 'Bad Request',
        message: 'repositoryId is required.',
      }, { status: 400 });
    }

    try {
      const reviewScore = Number(score) || 85;
      const [newReview] = await withDbTimeout(
        db
          .insert(peerReviews)
          .values({
            requestId: repositoryId,
            reviewerId: userId,
            architectureScore: reviewScore,
            codeQualityScore: reviewScore,
            securityScore: reviewScore,
            testingScore: reviewScore,
            feedbackNotes: notes || 'Peer review evaluation notes',
          })
          .returning(),
        2000
      );

      // Trigger user alert
      try {
        await withDbTimeout(
          db.insert(notifications).values({
            userId,
            title: 'Peer Review submitted',
            content: 'You submitted a code audit peer review. Reviewer score cached.',
            type: 'peer_review',
          }),
          1000
        );
      } catch {}

      return NextResponse.json({
        success: true,
        data: newReview,
      });
    } catch (dbError: any) {
      Logger.error('Database error in POST /api/reviews:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database operation failed while creating review.',
      }, { status: 500 });
    }
  } catch (error: any) {
    Logger.error('API Error in POST /api/reviews:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while submitting peer review.',
    }, { status: 500 });
  }
}
