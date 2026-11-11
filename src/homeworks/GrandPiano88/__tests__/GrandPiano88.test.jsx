import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import GrandPiano88 from '../GrandPiano88';
import { FakeAudioContext } from '../audio/__tests__/fakeAudioContext';

// Remember every AudioContext the page creates.
const createdContexts = [];

class TrackedAudioContext extends FakeAudioContext {
  constructor() {
    super();
    createdContexts.push(this);
  }
}

describe('GrandPiano88 page', () => {
  beforeEach(() => {
    createdContexts.length = 0;
    vi.stubGlobal('AudioContext', TrackedAudioContext);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the heading and the 88-key keyboard', () => {
    render(<GrandPiano88 />);

    expect(screen.getByRole('heading', { level: 1, name: 'Grand Piano 88' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /88-key piano keyboard/i })).toBeInTheDocument();
  });

  it('plays a note with the pointer and shows it as held', () => {
    render(<GrandPiano88 />);

    const c4 = screen.getByRole('button', { name: 'C4' });

    fireEvent.pointerDown(c4, { button: 0, pointerId: 1 });

    expect(c4).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/held notes/i)).toHaveTextContent('C4');
    expect(createdContexts[0].oscillators).toHaveLength(1);

    fireEvent.pointerUp(c4, { button: 0, pointerId: 1 });

    expect(c4).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(/held notes/i)).toHaveTextContent('none');
  });

  it('plays a chord from the computer keyboard', () => {
    render(<GrandPiano88 />);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA' })); // C4
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' })); // E4
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyG' })); // G4
    });

    expect(screen.getByText(/held notes/i)).toHaveTextContent('C4 E4 G4');
    expect(screen.getByRole('button', { name: 'E4' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows the shortcut legend', () => {
    render(<GrandPiano88 />);

    expect(screen.getByRole('heading', { name: /computer keyboard shortcuts/i })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(15);
  });

  it('closes the AudioContext on unmount', () => {
    const { unmount } = render(<GrandPiano88 />);

    fireEvent.pointerDown(screen.getByRole('button', { name: 'C4' }), { button: 0, pointerId: 1 });
    unmount();

    expect(createdContexts[0].close).toHaveBeenCalled();
  });
});
