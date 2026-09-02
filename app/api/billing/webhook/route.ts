import { NextRequest, NextResponse } from 'next/server';
import { BillingWebhookService } from '@/services/billing/webhooks';

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-billing-signature') || req.headers.get('stripe-signature') || '';
    const provider = req.headers.get('x-billing-provider') || 'mock';

    const rawBody = await req.text();
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    const result = await BillingWebhookService.processWebhook(
      payload,
      signature,
      provider
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message, eventId: result.eventId },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal webhook error' },
      { status: 500 }
    );
  }
}
