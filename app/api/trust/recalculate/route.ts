import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/services/supabase';
import { TrustCalculatorService } from '@/services/trust';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    
    // Baseline mock recalculation if not logged in
    if (!user) {
      return NextResponse.json({
        success: true,
        data: {
          overallScore: 840,
          categoryScores: {
            codeQuality: 85,
            maintainability: 82,
            security: 78,
            performance: 88,
            testing: 20,
            gitActivity: 75,
            documentation: 80,
          },
          weightValues: {
            codeQuality: 0.25,
            maintainability: 0.15,
            security: 0.20,
            performance: 0.10,
            testing: 0.10,
            gitActivity: 0.10,
            documentation: 0.10,
          },
          confidence: 85,
          engineVersion: '1.0.0',
          explanation: 'Mock Trust Score recalculated. Codebase quality remains stable.',
          suggestions: [
            {
              category: 'testing',
              message: 'Write automated unit tests (Jest/Vitest) to verify edge behaviors and boost test score.',
              score: 20,
              priority: 'High',
            }
          ]
        }
      });
    }

    try {
      const updatedDetails = await TrustCalculatorService.calculateUserTrustScore(user.id);
      return NextResponse.json({
        success: true,
        data: updatedDetails,
      });
    } catch (err: any) {
      console.error('Recalculation error:', err);
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
