import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFavorites } from '../hooks/useFavorites';

describe('useFavorites', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with empty array and toggles favorite status', () => {
    const { result } = renderHook(() => useFavorites());

    expect(result.current.favorites).toEqual([]);
    expect(result.current.isFavorite(1)).toBe(false);

    act(() => {
      result.current.toggleFavorite(1);
    });

    expect(result.current.favorites).toContain(1);
    expect(result.current.isFavorite(1)).toBe(true);

    act(() => {
      result.current.toggleFavorite(1);
    });

    expect(result.current.favorites).not.toContain(1);
    expect(result.current.isFavorite(1)).toBe(false);
  });

  it('persists favorites to localStorage and handles corrupt storage', () => {
    localStorage.setItem('fav', '[1, 2, 3]');
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([1, 2, 3]);

    localStorage.setItem('fav', 'corrupted_json');
    const { result: corruptResult } = renderHook(() => useFavorites());
    expect(corruptResult.current.favorites).toEqual([]);
  });
});
