'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Visibility-aware polling hook.
 * Calls `fetchFn` on mount and every `interval` ms while the tab is visible.
 * Pauses when the tab is hidden, resumes immediately when it becomes visible.
 */
export function usePolling(fetchFn: () => Promise<void>, interval = 10_000) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const doFetch = useCallback(async () => {
    await fetchRef.current();
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    // Initial fetch
    doFetch();

    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (!timer) {
        timer = setInterval(doFetch, interval);
      }
    };

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        doFetch(); // fetch immediately on tab focus
        start();
      } else {
        stop();
      }
    };

    // Start polling if tab is currently visible
    if (document.visibilityState === 'visible') {
      start();
    }

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [doFetch, interval]);

  return { lastUpdated };
}
