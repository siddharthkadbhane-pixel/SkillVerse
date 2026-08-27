import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DUMMY_USERS, getDummyUserById, getDummyUserByUsername } from '@/lib/dummyData';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const demoUserId = cookieStore.get('skillverse_demo_user')?.value;
    const currentUser = getDummyUserById(demoUserId);

    const { searchParams } = new URL(req.url);
    const switchUser = searchParams.get('switch');
    const redirectUrl = searchParams.get('redirect') || '/dashboard';

    if (switchUser) {
      const targetUser = getDummyUserByUsername(switchUser) || getDummyUserById(switchUser);
      cookieStore.set('skillverse_demo_user', targetUser.id, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }

    return NextResponse.json({
      success: true,
      data: {
        currentUser,
        availableUsers: DUMMY_USERS,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { userId, username } = body;

    const targetUser = userId 
      ? getDummyUserById(userId) 
      : username 
      ? getDummyUserByUsername(username) 
      : DUMMY_USERS[0];

    const cookieStore = await cookies();
    cookieStore.set('skillverse_demo_user', targetUser.id, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({
      success: true,
      message: `Switched active test account to ${targetUser.name} (@${targetUser.username})`,
      data: targetUser,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('skillverse_demo_user');

    return NextResponse.json({
      success: true,
      message: 'Demo test session reset to default',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
