import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { GuidanceTab } from '../components/GuidanceTab';
import '@testing-library/jest-dom';

describe('GuidanceTab Component', () => {
  const defaultProps = {
    guidanceQuery: '',
    setGuidanceQuery: vi.fn(),
    guidanceLoading: false,
    guidanceResult: null,
    guidanceError: null,
    onSubmit: vi.fn(),
    bookmarks: [],
    onToggleBookmark: vi.fn(),
    lang: 'english'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the guidance form', () => {
    render(<GuidanceTab {...defaultProps} />);
    expect(screen.getByText(/Seek Divine Guidance/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Seek Guidance/i })).toBeInTheDocument();
  });

  test('shows loading state when guidanceLoading is true', () => {
    render(<GuidanceTab {...defaultProps} guidanceLoading={true} />);
    expect(screen.getByText(/Consulting the Gita/i)).toBeInTheDocument();
  });

  test('displays guidance result when available', () => {
    const result = {
      shloka: { chapter: 2, verse: 47, text: 'Karmanye vadhikaraste...', translation: 'You have a right to perform your prescribed duty...', meaning: '' },
      counsel: {
        modernCounsel: 'Do your work without expectation.',
        wellbeingInsight: 'Letting go of outcomes reduces anxiety.',
        actionStep: 'Focus on the process today.'
      }
    } as any;

    render(<GuidanceTab {...defaultProps} guidanceResult={result} />);
    expect(screen.getByText(/Divine AI Counsel for your query/i)).toBeInTheDocument();
    expect(screen.getByText(/Do your work without expectation/i)).toBeInTheDocument();
  });

  test('displays guest limit error correctly', () => {
    render(<GuidanceTab {...defaultProps} guidanceError="Guest limit reached" />);
    expect(screen.getByText(/You've reached your daily guidance limit/i)).toBeInTheDocument();
  });
});
