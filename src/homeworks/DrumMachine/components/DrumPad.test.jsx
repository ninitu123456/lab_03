import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import DrumPad from './DrumPad';

const mockPad = {
  id: 'kick',
  name: 'KICK',
  keyLabel: 'W',
  description: 'Bass Drum',
};

describe('DrumPad', () => {
  it('renders the pad information', () => {
    render(
      <DrumPad
        pad={mockPad}
        isActive={false}
        onTrigger={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', {
        name: /kick/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText('Bass Drum')).toBeInTheDocument();
  });

  it('uses aria-pressed to expose active state', () => {
    const { rerender } = render(
      <DrumPad
        pad={mockPad}
        isActive={false}
        onTrigger={vi.fn()}
      />,
    );

    const button = screen.getByRole('button', {
      name: /kick/i,
    });

    expect(button).toHaveAttribute('aria-pressed', 'false');

    rerender(
      <DrumPad
        pad={mockPad}
        isActive
        onTrigger={vi.fn()}
      />,
    );

    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('triggers the correct pad when clicked', () => {
    const onTrigger = vi.fn();

    render(
      <DrumPad
        pad={mockPad}
        isActive={false}
        onTrigger={onTrigger}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: /kick/i,
      }),
    );

    expect(onTrigger).toHaveBeenCalledTimes(1);
    expect(onTrigger).toHaveBeenCalledWith('kick');
  });

  it('keeps the visible text in the accessible name (WCAG 2.5.3)', () => {
    render(
      <DrumPad
        pad={mockPad}
        isActive={false}
        onTrigger={vi.fn()}
      />,
    );

    const button = screen.getByRole('button', { name: /kick/i });

    // No aria-label overriding the visible label.
    expect(button).not.toHaveAttribute('aria-label');
    expect(button.textContent).toContain('KICK');
    expect(button.textContent).toContain('Bass Drum');

    // The shortcut is still announced, without replacing the name.
    expect(button).toHaveAttribute('aria-keyshortcuts', 'W');
  });
});