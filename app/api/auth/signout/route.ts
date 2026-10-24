import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/services/supabase';

export async function POST() {
  try {
    const cookieStore = await cookies();

    // 1. Clear demo test cookie
    cookieStore.delete('skillverse_demo_user');

    // 2. Clear real Supabase auth session
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch {
      // Supabase unconfigured or offline
    }

    return NextResponse.json({
      success: true,
      message: 'Signed out successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Sign out failed' },
      { status: 500 }
    );
  }
}
