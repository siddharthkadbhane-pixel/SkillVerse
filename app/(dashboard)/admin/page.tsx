import React from 'react';
import Navbar from '@/components/shared/Navbar';
import Sidebar from '@/components/shared/Sidebar';
import { requireServerAdmin } from '@/services/security/authorizer';
import AdminConsoleClient from '@/components/admin/AdminConsoleClient';
import { Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminConsolePage() {
  // Enforces platform administrator role strictly
  const user = await requireServerAdmin();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#08090D] text-slate-900 dark:text-[#F1F5F9] transition-colors">
      <Sidebar user={user} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar user={user} breadcrumb="Admin Console" />

        <main className="flex-1 overflow-y-auto px-5 sm:px-6 py-6 max-w-[1600px] w-full mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/[0.07]">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Shield className="w-5 h-5" />
                </div>
                <h1 className="text-[20px] font-semibold tracking-tight text-slate-900 dark:text-[#F1F5F9] leading-tight">
                  Platform Administration Console
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
                Platform-wide governance, user & role management, tenant workspaces, audit events, and security policies.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Super Admin: {user.email}
              </span>
            </div>
          </div>

          {/* Interactive Console Component */}
          <AdminConsoleClient currentUser={user} />
        </main>
      </div>
    </div>
  );
}
