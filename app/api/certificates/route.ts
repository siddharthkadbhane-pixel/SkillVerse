import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/services/supabase';
import { CertificationService } from '@/services/certificates/service';
import { Logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, repositoryId } = body;

    if (!title || !repositoryId) {
      return NextResponse.json({ success: false, error: 'title and repositoryId are required' }, { status: 400 });
    }

    const certificate = await CertificationService.issueCertificate(user.id, title, repositoryId);

    return NextResponse.json({
      success: true,
      message: 'Evidence certificate successfully claimed and issued.',
      data: certificate,
    });
  } catch (error: any) {
    Logger.error('API Error in /api/certificates:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
