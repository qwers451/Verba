'use client';

import React from 'react';
import { InterviewSimulator } from '@/components/InterviewSimulator';
import { useVerbaStore } from '@/store/useVerbaStore';
import { useRouter } from 'next/navigation';

export default function InterviewPage() {
  const { activeSession } = useVerbaStore();
  const router = useRouter();

  if (!activeSession) {
    // If somehow accessed without an active session, redirect back
    if (typeof window !== 'undefined') {
      router.push('/dashboard');
    }
    return null;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <InterviewSimulator />
    </div>
  );
}
