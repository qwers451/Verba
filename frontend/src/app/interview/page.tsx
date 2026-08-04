'use client';

import React, { Suspense, useEffect } from 'react';
import { InterviewSimulator } from '@/components/InterviewSimulator';
import { useVerbaStore } from '@/store/useVerbaStore';
import { useRouter, useSearchParams } from 'next/navigation';

export default function InterviewPage() {
  return <Suspense fallback={<div className="h-screen grid place-items-center bg-background text-on-surface-variant">Загружаем собеседование…</div>}><InterviewPageContent /></Suspense>;
}

function InterviewPageContent() {
  const { activeSession, loadInterviewSession, isStartingInterview } = useVerbaStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  useEffect(() => {
    if (!activeSession && sessionId) {
      void loadInterviewSession(sessionId).catch(() => router.replace('/exams'));
    } else if (!activeSession && !sessionId) {
      router.replace('/materials');
    }
  }, [activeSession, loadInterviewSession, router, sessionId]);

  if (!activeSession) {
    return <div className="h-screen grid place-items-center bg-background text-on-surface-variant">{isStartingInterview ? 'Загружаем собеседование…' : 'Переходим к материалам…'}</div>;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <InterviewSimulator />
    </div>
  );
}
