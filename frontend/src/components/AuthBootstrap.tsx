'use client';

import { useEffect } from 'react';
import { useVerbaStore } from '@/store/useVerbaStore';

/** Restores a saved session when a user opens any dashboard URL directly. */
export function AuthBootstrap() {
  const hydrateAuth = useVerbaStore((state) => state.hydrateAuth);

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  return null;
}
