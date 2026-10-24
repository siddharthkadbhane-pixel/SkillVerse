import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DUMMY_USERS } from '@/lib/dummyData';
import { isDemoAuthEnabled } from '@/services/supabase';

export async function GET(req: NextRequest) {
  // Reject in production or when demo auth is disabled
  if (!isDemoAuthEnabled()) {
    return NextResponse.json(
      { success: false, error: 'Forbidden', message: 'Demo authentication is disabled in this environment' },
      { status: 403 }
    );
  }

  try {
    const cookieStore = await cookies();
    const demoUserId = cookieStore.get('skillverse_demo_user')?.value;
    const currentUser = demoUserId ? DUMMY_USERS.find((u) => u.id === demoUserId) || null : null;

    const { searchParams } = new URL(req.url);
    const switchUser = searchParams.get('switch');
    const redirectUrl = searchParams.get('redirect') || '/dashboard';

    if (switchUser) {
      const targetUser = DUMMY_USERS.find(
        (u) => u.username.toLowerCase() === switchUser.toLowerCase() || u.id === switchUser
      );

      if (!targetUser) {
        return NextResponse.json({ success: false, error: 'Invalid demo user specified' }, { status: 400 });
      }

      cookieStore.set('skillverse_demo_user', targetUser.id, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 1 day
      });

      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }

    return NextResponse.json({
      success: true,
      data: {
        currentUser,
        availableUsers: DUMMY_USERS,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Reject in production or when demo auth is disabled
  if (!isDemoAuthEnabled()) {
    return NextResponse.json(
      { success: false, error: 'Forbidden', message: 'Demo authentication is disabled in this environment' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { userId, username } = body;

    const targetUser = DUMMY_USERS.find(
      (u) => (userId && u.id === userId) || (username && u.username.toLowerCase() === username.toLowerCase())
    );

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'Bad Request', message: 'Valid demo userId or username required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set('skillverse_demo_user', targetUser.id, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
    });

    return NextResponse.json({
      success: true,
      message: `Switched active test account to ${targetUser.name} (@${targetUser.username})`,
      data: targetUser,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isDemoAuthEnabled()) {
    return NextResponse.json(
      { success: false, error: 'Forbidden', message: 'Demo authentication is disabled in this environment' },
      { status: 403 }
    );
  }

  try {
    const cookieStore = await cookies();
    cookieStore.delete('skillverse_demo_user');

    return NextResponse.json({
      success: true,
      message: 'Demo test session cleared',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
