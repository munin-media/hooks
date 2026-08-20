import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMuninRatings } from '../src/useMuninRatings.js';
import { createMockMunin } from './helpers.js';
import type { UserRating } from '@munin-media/core';

describe('useMuninRatings', () => {
  const mockRatings: UserRating[] = [
    {
      userId: 'user-1',
      titleId: 'title-1',
      score: 8,
      tags: ['sci-fi', 'action'],
      ratedAt: new Date('2026-08-16'),
    },
    {
      userId: 'user-1',
      titleId: 'title-2',
      score: 6,
      tags: ['drama'],
      ratedAt: new Date('2026-08-15'),
    },
  ];

  it('should fetch all ratings on mount', async () => {
    const munin = createMockMunin({
      ratingsGetAll: vi.fn().mockResolvedValue(mockRatings),
    });

    const { result } = renderHook(() => useMuninRatings(munin, 'user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].score).toBe(8);
  });

  it('should refresh when rating.added fires for this user', async () => {
    let callCount = 0;
    const munin = createMockMunin({
      ratingsGetAll: vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) return mockRatings;
        return [...mockRatings, { userId: 'user-1', titleId: 'title-3', score: 9, tags: ['thriller'], ratedAt: new Date() }];
      }),
    });

    const { result } = renderHook(() => useMuninRatings(munin, 'user-1'));

    await waitFor(() => {
      expect(result.current.data).toHaveLength(2);
    });

    act(() => {
      munin.__emit('rating.added', { userId: 'user-1', titleId: 'title-3', score: 9, tags: ['thriller'], ratedAt: new Date() });
    });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(3);
    });
  });

  it('should not refresh when rating fires for different user', async () => {
    const getAllFn = vi.fn().mockResolvedValue(mockRatings);
    const munin = createMockMunin({
      ratingsGetAll: getAllFn,
    });

    renderHook(() => useMuninRatings(munin, 'user-1'));

    await waitFor(() => {
      expect(getAllFn).toHaveBeenCalledTimes(1);
    });

    act(() => {
      munin.__emit('rating.added', { userId: 'user-2', titleId: 'title-x', score: 5, tags: [], ratedAt: new Date() });
    });

    // Should not trigger a re-fetch
    expect(getAllFn).toHaveBeenCalledTimes(1);
  });
});
