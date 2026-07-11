import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { trustScores, users } from '@/database/schema';
import { getSessionUser } from '@/services/supabase';
import { TrustCalculatorService } from '@/services/trust';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    
    // Baseline mock profile if not logged in
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
          explanation: 'Mock Trust Profile. Project quality is solid, but testing coverage requires expansion.',
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
      let trustScore = await db.query.trustScores.findFirst({
        where: eq(trustScores.userId, user.id),
      });

      // Initialize score if it doesn't exist
      if (!trustScore) {
        const details = await TrustCalculatorService.calculateUserTrustScore(user.id);
        return NextResponse.json({ success: true, data: details });
      }

      // Generate dynamic suggestions
      const categoryScores = (trustScore.categoryScores || {}) as any;
      const suggestions = [];
      if (categoryScores.testing < 70) {
        suggestions.push({
          category: 'testing',
          message: 'Write automated unit tests (Jest/Vitest) to verify edge behaviors and boost test score.',
          score: categoryScores.testing || 0,
          priority: (categoryScores.testing || 0) < 40 ? 'High' : 'Medium',
        });
      }
      if (categoryScores.security < 70) {
        suggestions.push({
          category: 'security',
          message: 'Ensure environment variables are strictly validated and avoid committing sensitive keys.',
          score: categoryScores.security || 0,
          priority: 'High',
        });
      }
      if (categoryScores.documentation < 70) {
        suggestions.push({
          category: 'documentation',
          message: 'Expand your README.md detailing project architecture, configuration steps, and start guides.',
          score: categoryScores.documentation || 0,
          priority: 'Medium',
        });
      }

      if (suggestions.length === 0) {
        suggestions.push({
          category: 'gitActivity',
          message: 'Maintain consistent commit history and contribution frequency to sustain score metrics.',
          score: categoryScores.gitActivity || 75,
          priority: 'Low',
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          overallScore: trustScore.overallScore,
          categoryScores: trustScore.categoryScores,
          weightValues: trustScore.weightValues,
          confidence: trustScore.confidence,
          engineVersion: trustScore.engineVersion,
          explanation: trustScore.explanation,
          suggestions,
        },
      });
    } catch {
      // Fallback on database failure
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
          explanation: 'Mock Trust Profile. Project quality is solid, but testing coverage requires expansion.',
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
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
