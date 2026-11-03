import { redirect } from 'next/navigation';
import { getSessionUser } from '@/services/auth/session';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login?next=%2Fdashboard');
  }

  const cookieStore = await cookies();
  const activeWorkspace = cookieStore.get('skillverse_active_workspace')?.value;

  // 1. Platform Super Admin
  if (user.role === 'admin') {
    if (activeWorkspace === 'company') redirect('/company');
    if (activeWorkspace === 'developer') redirect('/overview');
    redirect('/admin');
  }

  // 2. Company Member / Recruiter / Company Admin
  if (user.role === 'recruiter' || user.role === 'company_admin') {
    if (activeWorkspace === 'developer') redirect('/overview');
    redirect('/company');
  }

  // 3. Dual Persona: Developer with active company membership
  if (activeWorkspace === 'company' && user.companyId) {
    redirect('/company');
  }

  // 4. Default talent persona routes to Developer Overview
  redirect('/overview');
}
