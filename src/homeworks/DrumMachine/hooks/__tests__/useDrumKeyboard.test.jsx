
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useDrumKeyboard } from '../useDrumKeyboard';
import { DRUM_PAD_MAP } from '../../data/drumPads';

describe('useDrumKeyboard', () => {
  it('triggers the correct pad when a mapped key is pressed', () => {
    const onTriggerPad = vi.fn();

    renderHook(() =>
      useDrumKeyboard(DRUM_PAD_MAP, onTriggerPad),
    );

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'KeyW',
          bubbles: true,
        }),
      );
    });

    expect(onTriggerPad).toHaveBeenCalledTimes(1);
    expect(onTriggerPad).toHaveBeenCalledWith('kick');
  });

  it('ignores repeated keydown events', () => {
    const onTriggerPad = vi.fn();

    renderHook(() =>
      useDrumKeyboard(DRUM_PAD_MAP, onTriggerPad),
    );

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'KeyW',
          repeat: false,
        }),
      );

      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'KeyW',
          repeat: true,
        }),
      );
    });

    expect(onTriggerPad).toHaveBeenCalledTimes(1);
  });

  it('ignores shortcuts when typing in an input', () => {
    const onTriggerPad = vi.fn();

    renderHook(() =>
      useDrumKeyboard(DRUM_PAD_MAP, onTriggerPad),
    );

    const input = document.createElement('input');
    document.body.appendChild(input);

    act(() => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'KeyW',
          bubbles: true,
        }),
      );
    });

    expect(onTriggerPad).not.toHaveBeenCalled();

    input.remove();
  });

  it('updates pressed pad state on keydown and keyup', () => {
    // Keep callback reference stable across renders.
    const onTriggerPad = vi.fn();

    const { result } = renderHook(() =>
      useDrumKeyboard(DRUM_PAD_MAP, onTriggerPad),
    );

    // Press W.
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'KeyW',
          bubbles: true,
        }),
      );
    });

    expect(result.current.pressedPadIds.has('kick')).toBe(true);

    // Release W.
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keyup', {
          code: 'KeyW',
          bubbles: true,
        }),
      );
    });

    expect(result.current.pressedPadIds.has('kick')).toBe(false);
  });

  it('does not trigger shortcuts when disabled', () => {
    const onTriggerPad = vi.fn();

    renderHook(() =>
      useDrumKeyboard(
        DRUM_PAD_MAP,
        onTriggerPad,
        undefined,
        false,
      ),
    );

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          code: 'KeyW',
          bubbles: true,
        }),
      );
    });

    expect(onTriggerPad).not.toHaveBeenCalled();
  });
});
