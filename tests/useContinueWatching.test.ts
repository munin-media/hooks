import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useContinueWatching } from '../src/useContinueWatching.js';
import { createMockMunin } from './helpers.js';
import type { ProgressEntry } from '@munin/core';

describe('useContinueWatching', () => {
  const inProgressEntries: ProgressEntry[] = [
    {
      userId: 'user-1',
      titleId: 'movie-a',
      type: 'movie',
      currentSeconds: 3600,
      durationSeconds: 7200,
      percent: 0.5,
      isCompleted: false,
      lastUpdated: new Date('2026-08-16'),
    },
    {
      userId: 'user-1',
      titleId: 'movie-b',
      type: 'movie',
      currentSeconds: 600,
      durationSeconds: 5400,
      percent: 0.11,
      isCompleted: false,
      lastUpdated: new Date('2026-08-15'),
    },
  ];

  it('should fetch in-progress items on mount', async () => {
    const munin = createMockMunin({
      progressGetInProgress: vi.fn().mockResolvedValue(inProgressEntries),
    });

    const { result } = renderHook(() => useContinueWatching(munin, 'user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].titleId).toBe('movie-a');
  });

  it('should pass limit and offset options', async () => {
    const getInProgressFn = vi.fn().mockResolvedValue([inProgressEntries[0]]);
    const munin = createMockMunin({
      progressGetInProgress: getInProgressFn,
    });

    renderHook(() => useContinueWatching(munin, 'user-1', { limit: 5, offset: 10 }));

    await waitFor(() => {
      expect(getInProgressFn).toHaveBeenCalledWith('user-1', { limit: 5, offset: 10 });
    });
  });

  it('should refresh when progress updates for this user', async () => {
    let callCount = 0;
    const munin = createMockMunin({
      progressGetInProgress: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? inProgressEntries : [inProgressEntries[0]];
      }),
    });

    const { result } = renderHook(() => useContinueWatching(munin, 'user-1'));

    await waitFor(() => {
      expect(result.current.data).toHaveLength(2);
    });

    act(() => {
      munin.__emit('progress.updated', inProgressEntries[0]);
    });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });
  });

  it('should not refresh when progress updates for a different user', async () => {
    const getInProgressFn = vi.fn().mockResolvedValue(inProgressEntries);
    const munin = createMockMunin({
      progressGetInProgress: getInProgressFn,
    });

    renderHook(() => useContinueWatching(munin, 'user-1'));

    await waitFor(() => {
      expect(getInProgressFn).toHaveBeenCalledTimes(1);
    });

    act(() => {
      munin.__emit('progress.updated', { ...inProgressEntries[0], userId: 'user-2' });
    });

    // Should still only have been called once
    expect(getInProgressFn).toHaveBeenCalledTimes(1);
  });
});
