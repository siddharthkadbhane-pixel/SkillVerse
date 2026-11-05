'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const id = (params?.id as string) || '';
    if (id) {
      router.replace(`/repositories/${id}`);
    } else {
      router.replace('/repositories');
    }
  }, [params, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#070A0F]">
      <div className="flex flex-col items-center gap-3">
        <span className="sv-spinner h-8 w-8 text-primary" />
        <span className="text-xs text-slate-500">Opening repository audit...</span>
      </div>
    </div>
  );
}
