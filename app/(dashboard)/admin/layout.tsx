import React from 'react';
import { requireServerAdmin } from '@/services/security/authorizer';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforces platform administrator role
  // Developers, recruiters, and company admins are redirected to /overview
  await requireServerAdmin();

  return <>{children}</>;
}

