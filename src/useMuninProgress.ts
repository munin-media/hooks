import { useState, useEffect, useCallback, useRef } from 'react';
import type { MuninInstance, ProgressEntry } from '@munin-media/core';
import type { AsyncState } from './types.js';

/**
 * Tracks progress for a single title (movie or episode).
 * Auto-refreshes when 'progress.updated' events fire for this title.
 */
export function useMuninProgress(
  munin: MuninInstance,
  userId: string,
  titleId: string,
): AsyncState<ProgressEntry> {
  const [data, setData] = useState<ProgressEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await munin.progress.get(userId, titleId);
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
  }, [munin, userId, titleId]);

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => {
      mountedRef.current = false;
    };
  }, [fetch]);

  // Subscribe to progress updates for this specific title
  useEffect(() => {
    const handler = (entry: ProgressEntry) => {
      if (entry.userId === userId && entry.titleId === titleId) {
        setData(entry);
      }
    };

    munin.on('progress.updated', handler);
    return () => {
      munin.off('progress.updated', handler);
    };
  }, [munin, userId, titleId]);

  return { data, loading, error, refresh: fetch };
}
