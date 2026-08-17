import { useState, useEffect, useCallback, useRef } from 'react';
import type { MuninInstance, SeriesProgress, ProgressEntry } from '@munin/core';
import type { AsyncState } from './types.js';

/**
 * Tracks full series progress (all seasons/episodes).
 * Auto-refreshes when any episode in this series gets updated.
 */
export function useMuninSeries(
  munin: MuninInstance,
  userId: string,
  seriesId: string,
): AsyncState<SeriesProgress> {
  const [data, setData] = useState<SeriesProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await munin.progress.getSeries(userId, seriesId);
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
  }, [munin, userId, seriesId]);

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => {
      mountedRef.current = false;
    };
  }, [fetch]);

  // Re-fetch when an episode in this series gets updated
  useEffect(() => {
    const handler = (entry: ProgressEntry) => {
      if (entry.userId === userId && entry.seriesId === seriesId) {
        fetch();
      }
    };

    munin.on('progress.updated', handler);
    return () => {
      munin.off('progress.updated', handler);
    };
  }, [munin, userId, seriesId, fetch]);

  return { data, loading, error, refresh: fetch };
}
