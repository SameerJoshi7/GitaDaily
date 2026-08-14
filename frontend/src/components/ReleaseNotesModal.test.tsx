import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReleaseNotesModal } from './ReleaseNotesModal';

describe('ReleaseNotesModal', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ReleaseNotesModal isOpen={false} onClose={() => {}} version="v1.1.0" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when isOpen is true', () => {
    render(
      <ReleaseNotesModal isOpen={true} onClose={() => {}} version="v1.1.0" />
    );
    expect(screen.getByText("What's New in v1.1.0")).toBeInTheDocument();
    expect(screen.getByText('Sadhana Streaks')).toBeInTheDocument();
    expect(screen.getByText('Performance Polish')).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <ReleaseNotesModal isOpen={true} onClose={handleClose} version="v1.1.0" />
    );
    
    // Find the 'X' button
    const closeBtn = screen.getByText('×');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the main action button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <ReleaseNotesModal isOpen={true} onClose={handleClose} version="v1.1.0" />
    );
    
    // Find the 'Explore Now' button
    const exploreBtn = screen.getByText('Explore Now');
    fireEvent.click(exploreBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
