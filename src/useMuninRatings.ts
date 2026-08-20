import { useState, useEffect, useCallback, useRef } from 'react';
import type { MuninInstance, UserRating } from '@munin-media/core';
import type { AsyncState } from './types.js';

/**
 * Returns all ratings for a user, sorted by most recent.
 * Auto-refreshes when 'rating.added' or 'rating.updated' events fire.
 */
export function useMuninRatings(
  munin: MuninInstance,
  userId: string,
): AsyncState<UserRating[]> {
  const [data, setData] = useState<UserRating[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await munin.ratings.getAll(userId);
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

  // Subscribe to rating events for this user
  useEffect(() => {
    const handler = (rating: UserRating) => {
      if (rating.userId === userId) {
        fetch();
      }
    };

    munin.on('rating.added', handler);
    munin.on('rating.updated', handler);
    return () => {
      munin.off('rating.added', handler);
      munin.off('rating.updated', handler);
    };
  }, [munin, userId, fetch]);

  return { data, loading, error, refresh: fetch };
}
