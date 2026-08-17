import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMuninProgress } from '../src/useMuninProgress.js';
import { createMockMunin } from './helpers.js';
import type { ProgressEntry } from '@munin/core';

describe('useMuninProgress', () => {
  const mockEntry: ProgressEntry = {
    userId: 'user-1',
    titleId: 'title-abc',
    type: 'movie',
    currentSeconds: 1200,
    durationSeconds: 7200,
    percent: 0.167,
    isCompleted: false,
    lastUpdated: new Date('2026-08-16'),
  };

  it('should fetch progress on mount', async () => {
    const munin = createMockMunin({
      progressGet: vi.fn().mockResolvedValue(mockEntry),
    });

    const { result } = renderHook(() => useMuninProgress(munin, 'user-1', 'title-abc'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockEntry);
    expect(result.current.error).toBeNull();
  });

  it('should handle null (no progress yet)', async () => {
    const munin = createMockMunin({
      progressGet: vi.fn().mockResolvedValue(null),
    });

    const { result } = renderHook(() => useMuninProgress(munin, 'user-1', 'title-new'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    const munin = createMockMunin({
      progressGet: vi.fn().mockRejectedValue(new Error('storage offline')),
    });

    const { result } = renderHook(() => useMuninProgress(munin, 'user-1', 'title-abc'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error?.message).toBe('storage offline');
  });

  it('should update when progress event fires for this title', async () => {
    const munin = createMockMunin({
      progressGet: vi.fn().mockResolvedValue(mockEntry),
    });

    const { result } = renderHook(() => useMuninProgress(munin, 'user-1', 'title-abc'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updatedEntry: ProgressEntry = { ...mockEntry, currentSeconds: 3600, percent: 0.5 };

    act(() => {
      munin.__emit('progress.updated', updatedEntry);
    });

    expect(result.current.data?.currentSeconds).toBe(3600);
  });

  it('should not update when progress event fires for different title', async () => {
    const munin = createMockMunin({
      progressGet: vi.fn().mockResolvedValue(mockEntry),
    });

    const { result } = renderHook(() => useMuninProgress(munin, 'user-1', 'title-abc'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      munin.__emit('progress.updated', { ...mockEntry, titleId: 'title-other', currentSeconds: 9999 });
    });

    expect(result.current.data?.currentSeconds).toBe(1200);
  });

  it('should support manual refresh', async () => {
    let callCount = 0;
    const munin = createMockMunin({
      progressGet: vi.fn().mockImplementation(async () => {
        callCount++;
        return { ...mockEntry, currentSeconds: callCount * 100 };
      }),
    });

    const { result } = renderHook(() => useMuninProgress(munin, 'user-1', 'title-abc'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.data?.currentSeconds).toBe(200);
    });
  });
});
