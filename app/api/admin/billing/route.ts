import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/services/supabase';
import { BillingWebhookService } from '@/services/billing/webhooks';
import { PlanService } from '@/services/billing/plans';
import { DUMMY_USERS } from '@/lib/dummyData';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Role check: Only admin or company_admin can view aggregate billing telemetry
    if (user.role !== 'admin' && user.role !== 'company_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin privilege required' },
        { status: 403 }
      );
    }

    const recentEvents = await BillingWebhookService.getRecentBillingEvents(25);
    const plans = PlanService.getAllPlans();

    const planDistribution = [
      { planId: 'free', name: 'Developer Free', activeCount: 4120, mrr: 0 },
      { planId: 'developer_pro', name: 'Developer Pro', activeCount: 284, mrr: 3408 },
      { planId: 'company', name: 'Company Hiring Workspace', activeCount: 42, mrr: 8358 },
      { planId: 'enterprise', name: 'Enterprise Organization', activeCount: 8, mrr: 3992 },
    ];

    const totalMRR = planDistribution.reduce((acc, p) => acc + p.mrr, 0);

    return NextResponse.json({
      success: true,
      data: {
        totalMRR,
        currency: 'USD',
        activeSubscriptionsCount: 4454,
        planDistribution,
        plans,
        recentEvents,
        zeroCostMode: true,
        activeProvider: 'mock',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch admin billing data' },
      { status: 500 }
    );
  }
}
