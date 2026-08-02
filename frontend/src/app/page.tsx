'use client';

import { useEffect } from 'react';
import { useVerbaStore } from '@/store/useVerbaStore';
import { LandingPage } from '@/components/LandingPage';
import { AuthModal } from '@/components/AuthModal';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { hydrateAuth, token } = useVerbaStore();
  const router = useRouter();

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    if (token) {
      router.push('/dashboard');
    }
  }, [token, router]);

  return (
    <>
      <LandingPage />
      <AuthModal />
    </>
  );
}
