import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import App from '../App';
import '@testing-library/jest-dom';

// Mock matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

describe('App Component Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    // Mock the global fetch so useApp hooks don't fail immediately
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

  test('renders the GuidanceTab by default on root path', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      // "Describe your challenge..." is unique to GuidanceTab subtitle
      expect(screen.getByText(/Describe your challenge, mood, or question/i)).toBeInTheDocument();
    });
  });

  test('navigates to Browse Chapters tab on /browse', async () => {
    render(
      <MemoryRouter initialEntries={['/browse']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Look for multiple instances if it's in the sidebar too, or use a specific element
      const elements = screen.getAllByText(/Browse Chapters/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  test('navigates to Daily Insights tab on /dailyinsights', async () => {
    render(
      <MemoryRouter initialEntries={['/dailyinsights']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      const elements = screen.getAllByText(/Daily Insight/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });
});
