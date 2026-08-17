/**
 * Test helpers — mock MuninInstance for hook testing.
 */

import type { MuninInstance, ProgressEntry, SeriesProgress, UserRating, Collection, Recommendation, CandidateTitle } from '@munin/core';
import type { MuninEvents } from '@munin/core';

type EventHandler<T> = (data: T) => void;

/**
 * Creates a mock MuninInstance with controllable return values.
 * Event subscription is functional — tests can emit events to trigger hook refreshes.
 */
export function createMockMunin(overrides?: Partial<MockMuninConfig>): MockMuninInstance {
  const listeners = new Map<string, Set<EventHandler<unknown>>>();

  const on = <K extends keyof MuninEvents>(event: K, handler: EventHandler<MuninEvents[K]>) => {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event)!.add(handler as EventHandler<unknown>);
  };

  const off = <K extends keyof MuninEvents>(event: K, handler: EventHandler<MuninEvents[K]>) => {
    listeners.get(event)?.delete(handler as EventHandler<unknown>);
  };

  const emit = <K extends keyof MuninEvents>(event: K, data: MuninEvents[K]) => {
    const handlers = listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(data);
      }
    }
  };

  const instance = {
    progress: {
      get: overrides?.progressGet ?? (async () => null),
      getAll: overrides?.progressGetAll ?? (async () => []),
      getSeries: overrides?.progressGetSeries ?? (async () => null),
      getInProgress: overrides?.progressGetInProgress ?? (async () => []),
      update: overrides?.progressUpdate ?? (async () => ({}) as ProgressEntry),
    },
    ratings: {
      get: overrides?.ratingsGet ?? (async () => null),
      getAll: overrides?.ratingsGetAll ?? (async () => []),
      set: overrides?.ratingsSet ?? (async () => ({}) as UserRating),
      delete: overrides?.ratingsDelete ?? (async () => false),
      getScoreRange: () => ({ min: 1, max: 10 }),
    },
    recommendations: {
      get: overrides?.recommendationsGet ?? (async () => []),
      getAffinityProfile: overrides?.getAffinityProfile ?? (async () => ({ userId: '', affinities: new Map(), lastCalculated: new Date() })),
      recalculateAffinity: overrides?.recalculateAffinity ?? (async () => ({ userId: '', affinities: new Map(), lastCalculated: new Date() })),
    },
    collections: {
      getAll: overrides?.collectionsGetAll ?? (async () => []),
      get: overrides?.collectionsGet ?? (async () => null),
      create: overrides?.collectionsCreate ?? (async () => ({}) as Collection),
      update: overrides?.collectionsUpdate ?? (async () => ({}) as Collection),
      delete: overrides?.collectionsDelete ?? (async () => false),
      addItem: overrides?.collectionsAddItem ?? (async () => ({}) as Collection),
      removeItem: overrides?.collectionsRemoveItem ?? (async () => ({}) as Collection),
    },
    contributions: {} as MuninInstance['contributions'],
    export: {} as MuninInstance['export'],
    on,
    off,
    deleteAllUserData: async () => ({ deleted: { progress: 0, ratings: 0, collections: 0, affinityProfiles: 0, contributions: 0, seriesProgress: 0 }, timestamp: new Date() }),
    close: async () => {},
    /** Test utility: emit an event to subscribed hooks */
    __emit: emit,
  } as unknown as MockMuninInstance;

  return instance;
}

export interface MockMuninInstance extends MuninInstance {
  __emit: <K extends keyof MuninEvents>(event: K, data: MuninEvents[K]) => void;
}

export interface MockMuninConfig {
  progressGet: MuninInstance['progress']['get'];
  progressGetAll: MuninInstance['progress']['getAll'];
  progressGetSeries: MuninInstance['progress']['getSeries'];
  progressGetInProgress: MuninInstance['progress']['getInProgress'];
  progressUpdate: MuninInstance['progress']['update'];
  ratingsGet: MuninInstance['ratings']['get'];
  ratingsGetAll: MuninInstance['ratings']['getAll'];
  ratingsSet: MuninInstance['ratings']['set'];
  ratingsDelete: MuninInstance['ratings']['delete'];
  recommendationsGet: MuninInstance['recommendations']['get'];
  getAffinityProfile: MuninInstance['recommendations']['getAffinityProfile'];
  recalculateAffinity: MuninInstance['recommendations']['recalculateAffinity'];
  collectionsGetAll: MuninInstance['collections']['getAll'];
  collectionsGet: MuninInstance['collections']['get'];
  collectionsCreate: MuninInstance['collections']['create'];
  collectionsUpdate: MuninInstance['collections']['update'];
  collectionsDelete: MuninInstance['collections']['delete'];
  collectionsAddItem: MuninInstance['collections']['addItem'];
  collectionsRemoveItem: MuninInstance['collections']['removeItem'];
}
