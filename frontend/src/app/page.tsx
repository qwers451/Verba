'use client';

import { useEffect } from 'react';
import { useVerbaStore } from '@/store/useVerbaStore';
import { LandingPage } from '@/components/LandingPage';
import { AuthModal } from '@/components/AuthModal';

export default function Home() {
  const { hydrateAuth } = useVerbaStore();

  useEffect(() => {
    void hydrateAuth();
  }, [hydrateAuth]);

  return (
    <>
      <LandingPage />
      <AuthModal />
    </>
  );
}
