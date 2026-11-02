import React from 'react';
import { requireServerAuth } from '@/services/security/authorizer';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforces server-side authentication across all dashboard routes
  // Redirects unauthenticated users to /login
  await requireServerAuth();

  return <>{children}</>;
}

