import { NextRequest, NextResponse } from 'next/server';
import { DeveloperSearchService } from '@/services/discovery/search';
import { DeveloperSearchParams } from '@/types/discovery';
import { Logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const rawQuery = searchParams.get('q') || '';
    if (rawQuery.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Search query exceeds maximum allowed length of 100 characters.' },
        { status: 400 }
      );
    }

    const params: DeveloperSearchParams = {
      q: rawQuery,
      skill: searchParams.get('skill') || undefined,
      status: (searchParams.get('status') as any) || undefined,
      level: (searchParams.get('level') as any) || undefined,
      category: searchParams.get('category') || undefined,
      minProjects: searchParams.get('minProjects') ? parseInt(searchParams.get('minProjects')!, 10) : undefined,
      minScore: searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!, 10) : undefined,
      sort: (searchParams.get('sort') as any) || 'relevance',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20,
    };

    const result = await DeveloperSearchService.searchDevelopers(params);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    Logger.error('API Error in GET /api/developers/search:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred while searching developers. Please try again.' },
      { status: 500 }
    );
  }
}
