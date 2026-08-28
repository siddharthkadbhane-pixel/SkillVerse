import { NextRequest, NextResponse } from 'next/server';
import { CompanyWorkspaceService } from '@/services/company/workspace';
import { Logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { usernames } = body;

    if (!Array.isArray(usernames) || usernames.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'An array of developer usernames is required for comparison.',
      }, { status: 400 });
    }

    const comparison = await CompanyWorkspaceService.compareDevelopers(usernames);

    return NextResponse.json({
      success: true,
      data: comparison,
    });
  } catch (error: any) {
    Logger.error('API Error in POST /api/company/compare:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred while comparing developers.',
    }, { status: 500 });
  }
}
