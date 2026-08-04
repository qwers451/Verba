'use client';

import React, { Suspense, useEffect } from 'react';
import { ReportCard } from '@/components/ReportCard';
import { useSearchParams } from 'next/navigation';
import { useVerbaStore } from '@/store/useVerbaStore';

export default function ReportPage() {
  return <Suspense fallback={<div className="max-w-4xl mx-auto glass-card rounded-xl p-10 text-center text-on-surface-variant">Загружаем отчёт…</div>}><ReportPageContent /></Suspense>;
}

function ReportPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const { finalReport, activeSession, fetchReport, isLoadingReport } = useVerbaStore();

  useEffect(() => {
    if (sessionId && (activeSession?.id !== sessionId || !finalReport)) {
      void fetchReport(sessionId);
    }
  }, [activeSession?.id, fetchReport, finalReport, sessionId]);

  if (isLoadingReport) {
    return <div className="max-w-4xl mx-auto glass-card rounded-xl p-10 text-center text-on-surface-variant">Формируем отчёт…</div>;
  }
  return (
    <div className="max-w-4xl mx-auto w-full">
      <ReportCard />
    </div>
  );
}
