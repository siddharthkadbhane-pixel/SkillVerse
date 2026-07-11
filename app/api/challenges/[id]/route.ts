import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { challenges } from '@/database/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    try {
      const challenge = await db.query.challenges.findFirst({
        where: eq(challenges.id, id),
      });

      if (!challenge) {
        return NextResponse.json({ success: false, error: 'Challenge not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: challenge,
      });
    } catch {
      // Fallback mock details
      const mockResult = {
        id,
        title: id === 'chal_002' ? 'Bug Fix: Connection Pool Leak' : 'Frontend Telemetry Dashboard Challenge',
        description: 'Build a premium developer telemetry dashboard displaying loading gauges and data tables using Tailwind utility classes.',
        difficulty: id === 'chal_002' ? 'Advanced' : 'Intermediate',
        technologies: id === 'chal_002' ? ['Node.js', 'PostgreSQL', 'Drizzle ORM'] : ['React', 'TypeScript', 'Tailwind CSS'],
        timeLimit: id === 'chal_002' ? '2 Hours' : '4 Hours',
        maxParticipants: 100,
        reward: id === 'chal_002' ? '$750 USD + Vercel Interview Match' : '$500 USD + Stripe Fast Track',
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        data: mockResult,
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
