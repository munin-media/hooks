import { useState, useEffect, useCallback, useRef } from 'react';
import type { MuninInstance, ProgressEntry } from '@munin/core';
import type { AsyncState, ContinueWatchingOptions } from './types.js';

/**
 * Returns in-progress titles sorted by most recently updated.
 * Excludes completed titles — only shows items the user can resume.
 * Auto-refreshes on any progress update for this user.
 */
export function useContinueWatching(
  munin: MuninInstance,
  userId: string,
  options?: ContinueWatchingOptions,
): AsyncState<ProgressEntry[]> {
  const [data, setData] = useState<ProgressEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await munin.progress.getInProgress(userId, { limit, offset });
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [munin, userId, limit, offset]);

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => {
      mountedRef.current = false;
    };
  }, [fetch]);

  // Refresh on any progress update for this user
  useEffect(() => {
    const handler = (entry: ProgressEntry) => {
      if (entry.userId === userId) {
        fetch();
      }
    };

    munin.on('progress.updated', handler);
    return () => {
      munin.off('progress.updated', handler);
    };
  }, [munin, userId, fetch]);

  return { data, loading, error, refresh: fetch };
}
