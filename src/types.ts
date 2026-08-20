/**
 * Shared types for @munin-media/hooks return values and options.
 */

/** Standard async state wrapper returned by all hooks */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  /** Manually trigger a re-fetch */
  refresh: () => void;
}

/** Options for useContinueWatching */
export interface ContinueWatchingOptions {
  /** Maximum number of items to return (default: 20) */
  limit?: number;
  /** Offset for pagination (default: 0) */
  offset?: number;
}
