import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/services/supabase';
import { BillingProviderRegistry } from '@/services/billing/providers/base';
import '@/services/billing/providers/mock'; // ensure mock provider registered
import { PlanService } from '@/services/billing/plans';

const CheckoutRequestSchema = z.object({
  planId: z.enum(['free', 'developer_pro', 'company', 'enterprise']),
  billingInterval: z.enum(['monthly', 'yearly']).default('monthly'),
  targetType: z.enum(['user', 'company']).optional(),
  successUrl: z.string().optional(),
  cancelUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CheckoutRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid checkout request payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { planId, billingInterval, targetType = 'user', successUrl, cancelUrl } = parsed.data;

    // Free plan does not need checkout session
    if (planId === 'free') {
      return NextResponse.json({
        success: true,
        data: {
          checkoutUrl: '/settings?billing_status=free_plan_active',
          mode: 'instant',
          planId: 'free',
        },
      });
    }

    const provider = BillingProviderRegistry.getActiveProvider();
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const session = await provider.createCheckoutSession({
      targetId: user.id,
      targetType,
      planId,
      billingInterval,
      customerEmail: user.email,
      successUrl: successUrl || `${origin}/settings?billing_status=success&plan=${planId}`,
      cancelUrl: cancelUrl || `${origin}/settings?billing_status=cancelled`,
    });

    return NextResponse.json({
      success: true,
      data: {
        session,
        plan: PlanService.getPlan(planId),
        providerName: provider.name,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to initiate checkout session' },
      { status: 500 }
    );
  }
}
