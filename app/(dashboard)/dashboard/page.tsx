import { redirect } from 'next/navigation';
import { getSessionUser } from '@/services/auth/session';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login?next=%2Fdashboard');
  }

  // Dynamic role-based redirection to the appropriate workspace
  if (user.role === 'admin') {
    redirect('/admin');
  }

  if (user.role === 'recruiter' || user.role === 'company_admin') {
    redirect('/company');
  }

  // Default talent persona routes to Developer Overview
  redirect('/overview');
}
