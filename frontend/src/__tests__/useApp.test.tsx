import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { useApp } from '../hooks/useApp';

// Mock matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

describe('useApp Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    ) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('initializes with default state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
    );

    const { result } = renderHook(() => useApp(), { wrapper });

    expect(result.current.activeTab).toBe('guidance'); // default due to initialEntries / handling
    expect(result.current.chapters).toEqual([]);
    expect(result.current.bookmarks).toEqual([]);
    expect(result.current.userId).toBe('');
  });
});
