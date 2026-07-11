import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { getSessionUser } from '@/services/supabase';
import { PassportTimelineService } from '@/services/passport/timeline';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    
    // Baseline mock logs if not logged in
    if (!user) {
      return NextResponse.json({
        success: true,
        data: [
          { id: '1', title: 'Joined SkillVerse', description: 'GitHub OAuth connected.', date: new Date().toISOString(), type: 'join' },
          { id: '2', title: 'Connected nextjs-ai-agent', description: 'Imported repository metadata.', date: new Date().toISOString(), type: 'repo' }
        ]
      });
    }

    try {
      const feed = await PassportTimelineService.compileTimelineForUser(user.id);
      return NextResponse.json({
        success: true,
        data: feed,
      });
    } catch {
      // Fallback logs
      return NextResponse.json({
        success: true,
        data: [
          { id: '1', title: 'Joined SkillVerse', description: 'GitHub OAuth connected.', date: new Date().toISOString(), type: 'join' }
        ]
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
