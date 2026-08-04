'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVerbaStore } from '@/store/useVerbaStore';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrateAuth = useVerbaStore((state) => state.hydrateAuth);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const authorize = async () => {
      if (!localStorage.getItem('verba_token')) {
        router.replace('/');
        return;
      }
      await hydrateAuth();
      if (!active) return;
      if (!useVerbaStore.getState().user) {
        router.replace('/');
        return;
      }
      setReady(true);
    };
    void authorize();
    return () => { active = false; };
  }, [hydrateAuth, router]);

  if (!ready) {
    return <div className="min-h-screen grid place-items-center bg-background text-on-surface-variant">Проверяем сессию…</div>;
  }
  return children;
}
