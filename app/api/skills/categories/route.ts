import { NextRequest, NextResponse } from 'next/server';
import { SKILL_CATEGORIES } from '@/services/skill-dna';

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: SKILL_CATEGORIES,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
