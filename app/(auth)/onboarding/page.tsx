import React from 'react';
import { getSessionUser } from '@/services/auth/session';
import { redirect } from 'next/navigation';
import OnboardingClient from './OnboardingClient';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login?next=%2Fonboarding');
  }

  // If user is already platform admin or company admin, redirect directly
  if (user.role === 'admin') {
    redirect('/admin');
  }

  return <OnboardingClient user={user} />;
}

