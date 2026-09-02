import { NextRequest, NextResponse } from 'next/server';
import { ApiAuthService } from '@/services/api/auth';
import { ConsentService } from '@/services/privacy/consent';
import { ConsentPurpose } from '@/types/privacy';

export async function GET(req: NextRequest) {
  const auth = await ApiAuthService.authenticate(req);
  if (!auth.success || !auth.context.isAuthenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const consents = await ConsentService.getUserConsents(auth.context.user.id);

  return NextResponse.json({
    success: true,
    data: {
      userId: auth.context.user.id,
      consents,
      noticeVersion: 'v1.0',
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = await ApiAuthService.authenticate(req);
  if (!auth.success || !auth.context.isAuthenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { purpose, granted } = body;

    if (!purpose || typeof granted !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid payload: purpose and boolean granted are required' },
        { status: 400 }
      );
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const record = await ConsentService.recordConsent(auth.context.user.id, purpose as ConsentPurpose, granted, clientIp);

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
