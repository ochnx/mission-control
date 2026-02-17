'use client';

import { useState, useCallback } from 'react';
import { wakeAgent } from '@/lib/wake';

export function useWake() {
  const [toastVisible, setToastVisible] = useState(false);

  const wake = useCallback((text: string) => {
    // Fire-and-forget: don't block the caller
    wakeAgent(text).then((ok) => {
      if (ok) {
        setToastVisible(true);
        setTimeout(() => setToastVisible(false), 2000);
      }
      // silent fail — no error shown
    });
  }, []);

  return { wake, toastVisible };
}
