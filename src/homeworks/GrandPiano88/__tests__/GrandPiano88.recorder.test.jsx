import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import GrandPiano88 from '../GrandPiano88';
import { FakeAudioContext } from '../audio/__tests__/fakeAudioContext';

function pressKey(code) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code }));
  });
}

function releaseKey(code) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keyup', { code }));
  });
}

describe('GrandPiano88 record and replay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('AudioContext', FakeAudioContext);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('records a note and replays it on the keyboard', async () => {
    render(<GrandPiano88 />);

    const recordButton = screen.getByRole('button', { name: 'Record' });
    const playButton = screen.getByRole('button', { name: 'Play' });
    const c4 = screen.getByRole('button', { name: 'C4' });

    // Record C4 played on the computer keyboard.
    fireEvent.click(recordButton);
    expect(recordButton).toHaveAttribute('aria-pressed', 'true');

    pressKey('KeyA');
    act(() => vi.advanceTimersByTime(300));
    releaseKey('KeyA');

    fireEvent.click(recordButton);
    expect(screen.getByRole('status')).toHaveTextContent(/recorded 1 note \(/i);

    // Replay: the key lights up again, then is released.
    fireEvent.click(playButton);
    expect(screen.getByRole('status')).toHaveTextContent(/playing 1 note at 1x/i);

    await act(() => vi.advanceTimersByTimeAsync(10));
    expect(c4).toHaveAttribute('aria-pressed', 'true');

    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(c4).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('status')).toHaveTextContent('Playback finished.');
  });

  it('Stop Sequence silences the replay immediately', async () => {
    render(<GrandPiano88 />);

    fireEvent.click(screen.getByRole('button', { name: 'Record' }));
    pressKey('KeyA');
    act(() => vi.advanceTimersByTime(2000));
    releaseKey('KeyA');
    fireEvent.click(screen.getByRole('button', { name: 'Record' }));

    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    await act(() => vi.advanceTimersByTimeAsync(100));

    const c4 = screen.getByRole('button', { name: 'C4' });
    expect(c4).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Stop Sequence' }));
    await act(() => vi.advanceTimersByTimeAsync(0));

    expect(c4).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('status')).toHaveTextContent('Playback stopped.');
  });
});
