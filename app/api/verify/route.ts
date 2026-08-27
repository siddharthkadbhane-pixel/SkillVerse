import { NextRequest, NextResponse } from 'next/server';
import { GlobalVerificationService } from '@/services/verification/service';
import { Logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { partnerId, developerId } = body;

    if (!partnerId || !developerId) {
      return NextResponse.json({ success: false, error: 'partnerId and developerId are required' }, { status: 400 });
    }

    const verificationResult = await GlobalVerificationService.verifyDeveloper(partnerId, developerId);

    return NextResponse.json({
      success: true,
      data: verificationResult,
    });
  } catch (error: any) {
    Logger.error('API Error in /api/verify:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 401 }); // Auth/Consent failures
  }
}
