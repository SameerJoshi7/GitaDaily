import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { BrowseTab } from '../components/BrowseTab';
import '@testing-library/jest-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom') as any;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('BrowseTab Component', () => {
  const mockChapters = [
    { chapterNumber: 1, theme: 'Observing the Armies', verses: [1, 2, 3] },
    { chapterNumber: 2, theme: 'Sankhya Yoga', verses: [1, 2, 3, 4, 47] }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the chapter grid when no specific chapter is selected', () => {
    render(
      <MemoryRouter>
        <BrowseTab
          chapters={mockChapters}
          lang="english"
          bookmarks={[]}
          onToggleBookmark={vi.fn()}
          email="test@test.com"
          apiBase="http://localhost/api"
          browseChapterNumber={null}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Observing the Armies')).toBeInTheDocument();
    expect(screen.getByText('Sankhya Yoga')).toBeInTheDocument();
  });

  test('navigates to chapter when clicked', () => {
    render(
      <MemoryRouter>
        <BrowseTab
          chapters={mockChapters}
          lang="english"
          bookmarks={[]}
          onToggleBookmark={vi.fn()}
          email="test@test.com"
          apiBase="http://localhost/api"
          browseChapterNumber={null}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Sankhya Yoga'));
    expect(mockNavigate).toHaveBeenCalledWith('/browse/chapter/2/verse/1');
  });
});
