import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  COMPUTER_KEY_MAP,
  useComputerKeyboardPiano,
} from '../useComputerKeyboardPiano';

function press(code, options = {}) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, ...options }));
  });
}

function release(code) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keyup', { code }));
  });
}

describe('useComputerKeyboardPiano', () => {
  it('maps 15 physical keys chromatically from Middle C', () => {
    expect(COMPUTER_KEY_MAP.size).toBe(15);
    expect(COMPUTER_KEY_MAP.get('KeyA')).toBe(60); // C4
    expect(COMPUTER_KEY_MAP.get('KeyW')).toBe(61); // C#4
    expect(COMPUTER_KEY_MAP.get('KeyL')).toBe(74); // D5
  });

  it('plays and releases a note with e.code', () => {
    const onNoteOn = vi.fn();
    const onNoteOff = vi.fn();

    renderHook(() => useComputerKeyboardPiano(onNoteOn, onNoteOff));

    press('KeyA');
    release('KeyA');

    expect(onNoteOn).toHaveBeenCalledWith(60);
    expect(onNoteOff).toHaveBeenCalledWith(60);
  });

  it('ignores OS auto-repeat', () => {
    const onNoteOn = vi.fn();

    renderHook(() => useComputerKeyboardPiano(onNoteOn, vi.fn()));

    press('KeyA');
    press('KeyA', { repeat: true });

    expect(onNoteOn).toHaveBeenCalledTimes(1);
  });

  it('ignores shortcuts while typing in an input', () => {
    const onNoteOn = vi.fn();

    renderHook(() => useComputerKeyboardPiano(onNoteOn, vi.fn()));

    const input = document.createElement('input');
    document.body.appendChild(input);

    act(() => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', { code: 'KeyA', bubbles: true }),
      );
    });

    expect(onNoteOn).not.toHaveBeenCalled();
    input.remove();
  });

  it('leaves browser shortcuts with modifier keys alone', () => {
    const onNoteOn = vi.fn();

    renderHook(() => useComputerKeyboardPiano(onNoteOn, vi.fn()));

    press('KeyS', { ctrlKey: true });

    expect(onNoteOn).not.toHaveBeenCalled();
  });

  it('releases held notes when the window loses focus', () => {
    const onNoteOff = vi.fn();

    renderHook(() => useComputerKeyboardPiano(vi.fn(), onNoteOff));

    press('KeyA');
    press('KeyD');

    act(() => {
      window.dispatchEvent(new Event('blur'));
    });

    expect(onNoteOff).toHaveBeenCalledWith(60);
    expect(onNoteOff).toHaveBeenCalledWith(64);
  });

  it('keeps held keys when callbacks change between renders', () => {
    // Regression test for the HW1 bug: new callback identities
    // must NOT reset the held-key tracking.
    const onNoteOff = vi.fn();

    renderHook(() =>
      useComputerKeyboardPiano(
        () => {}, // new function on every render
        (midi) => onNoteOff(midi),
      ),
    );

    press('KeyA');
    release('KeyA');

    expect(onNoteOff).toHaveBeenCalledWith(60);
  });

  it('releases held notes on unmount', () => {
    const onNoteOff = vi.fn();

    const { unmount } = renderHook(() =>
      useComputerKeyboardPiano(vi.fn(), onNoteOff),
    );

    press('KeyA');
    unmount();

    expect(onNoteOff).toHaveBeenCalledWith(60);
  });
});
