import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import GrandPiano88 from '../GrandPiano88';
import { FakeAudioContext } from '../audio/__tests__/fakeAudioContext';

// Shared with the mock factory below (vi.mock is hoisted to the top).
const tracker = vi.hoisted(() => ({ renderedMidis: [] }));

// Wrap the REAL PianoKey: same memo() boundary, same markup,
// but every actual render is logged with the key's MIDI number.
vi.mock('../components/PianoKey', async (importOriginal) => {
  const actual = await importOriginal();
  const { memo } = await import('react');
  const renderKey = actual.PianoKey.type; // function inside memo()

  return {
    PianoKey: memo(function TrackedPianoKey(props) {
      tracker.renderedMidis.push(props.midi);
      return renderKey(props);
    }),
  };
});

// Renders that happen while `action` runs.
function rendersDuring(action) {
  tracker.renderedMidis.length = 0;
  action();
  return [...tracker.renderedMidis];
}

describe('React.memo render isolation (88 PianoKey components)', () => {
  beforeEach(() => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders all 88 keys once on mount', () => {
    const renders = rendersDuring(() => render(<GrandPiano88 />));

    expect(renders).toHaveLength(88);
  });

  it('pressing one key re-renders ONLY that key', () => {
    render(<GrandPiano88 />);
    const c4 = screen.getByRole('button', { name: 'C4' });

    expect(rendersDuring(() => {
      fireEvent.pointerDown(c4, { button: 0, pointerId: 1 });
    })).toEqual([60]);

    expect(rendersDuring(() => {
      fireEvent.pointerUp(c4, { button: 0, pointerId: 1 });
    })).toEqual([60]);
  });

  it('a chord re-renders only the keys of the chord', () => {
    render(<GrandPiano88 />);

    const renders = rendersDuring(() => {
      act(() => {
        for (const code of ['KeyA', 'KeyD', 'KeyG']) {
          window.dispatchEvent(new KeyboardEvent('keydown', { code }));
        }
      });
    });

    expect(renders.toSorted((a, b) => a - b)).toEqual([60, 64, 67]);
  });

  it('moving keyboard focus re-renders only the old and new key', () => {
    render(<GrandPiano88 />);
    const c4 = screen.getByRole('button', { name: 'C4' });
    c4.focus();

    const renders = rendersDuring(() => {
      fireEvent.keyDown(c4, { code: 'ArrowRight' });
    });

    expect(renders.toSorted((a, b) => a - b)).toEqual([60, 61]);
  });

  it('page-level state changes re-render NO keys', () => {
    render(<GrandPiano88 />);

    const renders = rendersDuring(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Record' }));
      fireEvent.change(screen.getByLabelText('Playback speed'), {
        target: { value: '2' },
      });
    });

    expect(renders).toEqual([]);
  });
});
