import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/services/supabase';
import { EntitlementService } from '@/services/billing/entitlements';
import { PlanService } from '@/services/billing/plans';
import { PlanId } from '@/types/billing';

const UpdateSubscriptionSchema = z.object({
  planId: z.enum(['free', 'developer_pro', 'company', 'enterprise']),
  action: z.enum(['upgrade', 'downgrade', 'cancel']).optional(),
  targetType: z.enum(['user', 'company']).optional(),
});

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
    const plan = PlanService.getPlan(subscription.planId);

    return NextResponse.json({
      success: true,
      data: {
        subscription,
        plan,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to retrieve subscription' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = UpdateSubscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { planId, action, targetType = (user.role === 'recruiter' || user.role === 'company_admin' ? 'company' : 'user') } = parsed.data;
    const targetId = user.id;

    const status = action === 'cancel' ? 'cancelled' : 'active';
    const finalPlanId: PlanId = action === 'cancel' ? 'free' : planId;

    const updatedSub = await EntitlementService.updateSubscription(
      targetId,
      finalPlanId,
      status,
      targetType
    );

    return NextResponse.json({
      success: true,
      data: {
        subscription: updatedSub,
        message: action === 'cancel' ? 'Subscription cancelled successfully' : `Successfully switched to ${PlanService.getPlan(finalPlanId).name}`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
