import { NextRequest, NextResponse } from 'next/server';
import { ApiAuthService } from '@/services/api/auth';
import { DataControlsService } from '@/services/security/dataControls';

export async function POST(req: NextRequest) {
  const auth = await ApiAuthService.authenticate(req);
  if (!auth.success || !auth.context.isAuthenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const exportData = await DataControlsService.exportUserData(auth.context.user.id);

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="skillverse_export_${auth.context.user.username || 'user'}_${Date.now()}.json"`,
        'X-Request-Id': auth.context.requestId,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
