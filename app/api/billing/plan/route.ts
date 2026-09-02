import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/services/supabase';
import { EntitlementService } from '@/services/billing/entitlements';
import { PlanService } from '@/services/billing/plans';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetType = (searchParams.get('targetType') as 'user' | 'company') || (user.role === 'recruiter' || user.role === 'company_admin' ? 'company' : 'user');
    const targetId = user.id;

    const subscription = await EntitlementService.getActiveSubscription(targetId, targetType);
    const currentPlan = PlanService.getPlan(subscription.planId);
    const availablePlans = targetType === 'company' ? PlanService.getCompanyPlans() : PlanService.getDeveloperPlans();
    const allPlans = PlanService.getAllPlans();

    return NextResponse.json({
      success: true,
      data: {
        subscription,
        currentPlan,
        availablePlans,
        allPlans,
        targetType,
        targetId,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch plan information' },
      { status: 500 }
    );
  }
}
