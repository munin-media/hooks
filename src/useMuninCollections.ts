import { useState, useEffect, useCallback, useRef } from 'react';
import type { MuninInstance, Collection } from '@munin-media/core';
import type { AsyncState } from './types.js';

/**
 * Returns all collections for a user (both manual and smart).
 * Smart collections are resolved with their current items.
 * Auto-refreshes when ratings or progress change (smart filters may recalculate).
 */
export function useMuninCollections(
  munin: MuninInstance,
  userId: string,
): AsyncState<Collection[]> {
  const [data, setData] = useState<Collection[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await munin.collections.getAll(userId);
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
  }, [munin, userId]);

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => {
      mountedRef.current = false;
    };
  }, [fetch]);

  // Refresh when ratings change (smart filters depend on ratings)
  useEffect(() => {
    const ratingHandler = () => {
      fetch();
    };
    const progressHandler = () => {
      fetch();
    };

    munin.on('rating.added', ratingHandler);
    munin.on('rating.updated', ratingHandler);
    munin.on('progress.updated', progressHandler);
    return () => {
      munin.off('rating.added', ratingHandler);
      munin.off('rating.updated', ratingHandler);
      munin.off('progress.updated', progressHandler);
    };
  }, [munin, fetch]);

  return { data, loading, error, refresh: fetch };
}
