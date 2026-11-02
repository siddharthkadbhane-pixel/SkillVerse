import React from 'react';
import { requireServerCompanyAccess } from '@/services/security/authorizer';

export const dynamic = 'force-dynamic';

export default async function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforces server-side company workspace authorization
  // Allows recruiter, company_admin (with verified company membership), and platform admin
  // Developer role and unauthorized users are redirected to /overview
  await requireServerCompanyAccess();

  return <>{children}</>;
}

