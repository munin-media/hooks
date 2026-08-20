import { useState, useEffect, useCallback, useRef } from 'react';
import type { MuninInstance, Recommendation, CandidateTitle } from '@munin-media/core';
import type { AsyncState } from './types.js';

/**
 * Computes recommendations for a user given a set of candidate titles.
 * Auto-refreshes when ratings change (affinity profile recalculates).
 */
export function useMuninRecommendations(
  munin: MuninInstance,
  userId: string,
  candidates: CandidateTitle[],
): AsyncState<Recommendation[]> {
  const [data, setData] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  // Stabilize candidates reference — only re-fetch if serialized value changes
  const candidatesKey = JSON.stringify(candidates);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await munin.recommendations.get(userId, candidates);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [munin, userId, candidatesKey]);

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => {
      mountedRef.current = false;
    };
  }, [fetch]);

  // Refresh when ratings change (affinity recalculates)
  useEffect(() => {
    const handler = () => {
      fetch();
    };

    munin.on('rating.added', handler);
    munin.on('rating.updated', handler);
    return () => {
      munin.off('rating.added', handler);
      munin.off('rating.updated', handler);
    };
  }, [munin, fetch]);

  return { data, loading, error, refresh: fetch };
}
