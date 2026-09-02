import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/services/supabase';
import { EntitlementService } from '@/services/billing/entitlements';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetType = (searchParams.get('targetType') as 'user' | 'company') || (user.role === 'recruiter' || user.role === 'company_admin' ? 'company' : 'user');
    const targetId = user.id;

    const summary = await EntitlementService.getUsageSummary(targetId, targetType);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch usage metrics' },
      { status: 500 }
    );
  }
}
