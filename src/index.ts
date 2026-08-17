/**
 * @munin/hooks — Platform-agnostic React hooks for @munin/core.
 *
 * Bridges the zero-knowledge media memory library with React UI layers.
 * Works identically on web and React Native (no DOM dependencies).
 */

export { useMuninProgress } from './useMuninProgress.js';
export { useMuninSeries } from './useMuninSeries.js';
export { useMuninRatings } from './useMuninRatings.js';
export { useMuninCollections } from './useMuninCollections.js';
export { useMuninRecommendations } from './useMuninRecommendations.js';
export { useContinueWatching } from './useContinueWatching.js';

export type { AsyncState, ContinueWatchingOptions } from './types.js';
