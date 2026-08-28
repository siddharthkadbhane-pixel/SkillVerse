import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/services/supabase';
import { CareerEngine } from '@/services/career/engine';
import { CareerTaxonomyService } from '@/services/career/taxonomy';
import { Logger } from '@/lib/logger';
import { DUMMY_USERS } from '@/lib/dummyData';
import { CareerRoleId } from '@/types/career';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    const userId = user?.id || DUMMY_USERS[0].id;

    const taxonomy = CareerTaxonomyService.getRoleById(id);
    if (!taxonomy) {
      return NextResponse.json({ success: false, error: `Role '${id}' not found` }, { status: 404 });
    }

    const allRoleFits = await CareerEngine.getRoleFits(userId);
    const fit = allRoleFits.find((rf) => rf.roleId === id);
    const gaps = await CareerEngine.getSkillGaps(userId, id as CareerRoleId);

    return NextResponse.json({
      success: true,
      data: {
        taxonomy,
        fit,
        gaps,
      },
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/career/roles/[id]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
