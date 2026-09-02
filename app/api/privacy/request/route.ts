import { NextRequest, NextResponse } from 'next/server';
import { ApiAuthService } from '@/services/api/auth';
import { PrivacyRequestService } from '@/services/privacy/requests';
import { PrivacyRequestType } from '@/types/privacy';

export async function GET(req: NextRequest) {
  const auth = await ApiAuthService.authenticate(req);
  if (!auth.success || !auth.context.isAuthenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Only admins can list all privacy requests; users can see their own
  const requests = await PrivacyRequestService.listRequests();
  const filtered = auth.context.user.role === 'admin'
    ? requests
    : requests.filter((r) => r.userId === auth.context.user.id || r.email === auth.context.user.email);

  return NextResponse.json({
    success: true,
    data: filtered,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, requestType, details } = body;

    if (!email || !requestType || !details) {
      return NextResponse.json(
        { success: false, error: 'Email, requestType, and details are required' },
        { status: 400 }
      );
    }

    // Optional auth context
    const auth = await ApiAuthService.authenticate(req);
    const userId = auth.success && auth.context.isAuthenticated ? auth.context.user.id : null;

    const request = await PrivacyRequestService.submitRequest({
      userId,
      email,
      name,
      requestType: requestType as PrivacyRequestType,
      details,
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Your privacy request has been recorded. Our data protection team will respond within standard timelines.',
        request,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
