import { NextRequest } from 'next/server';
import { JobEngine } from '@/services/opportunity/engine';
import { ApiResponse } from '@/services/api/response';

export async function GET(req: NextRequest) {
  try {
    const data = await JobEngine.getJobs({ limit: 10 });
    return ApiResponse.success(data.jobs);
  } catch (error: any) {
    return ApiResponse.error('INTERNAL_SERVER_ERROR', error.message || 'Failed to retrieve jobs', { status: 500 });
  }
}
