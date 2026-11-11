import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PianoKeyboard } from '../PianoKeyboard';

function renderKeyboard(pressedNotes = new Set()) {
  const onNoteOn = vi.fn();
  const onNoteOff = vi.fn();

  render(
    <PianoKeyboard
      pressedNotes={pressedNotes}
      onNoteOn={onNoteOn}
      onNoteOff={onNoteOff}
    />,
  );

  const group = screen.getByRole('group', { name: /88-key piano keyboard/i });
  const keys = within(group).getAllByRole('button');

  return { group, keys, onNoteOn, onNoteOff };
}

describe('PianoKeyboard', () => {
  it('renders 88 keys: 52 white and 36 black', () => {
    const { keys } = renderKeyboard();

    expect(keys).toHaveLength(88);
    expect(keys.filter((key) => key.classList.contains('piano-key--white'))).toHaveLength(52);
    expect(keys.filter((key) => key.classList.contains('piano-key--black'))).toHaveLength(36);
  });

  it('renders keys in MIDI order from A0 to C8', () => {
    const { keys } = renderKeyboard();

    expect(keys[0]).toHaveAccessibleName('A0');
    expect(keys[1]).toHaveAccessibleName('A#0');
    expect(keys.at(-1)).toHaveAccessibleName('C8');
  });

  it('marks only the pressed keys with aria-pressed', () => {
    const { keys } = renderKeyboard(new Set([60, 64]));
    const pressed = keys.filter((key) => key.getAttribute('aria-pressed') === 'true');

    expect(pressed.map((key) => key.textContent)).toEqual(['C4', 'E4']);
  });

  it('exposes a single Tab stop on Middle C', () => {
    const { keys } = renderKeyboard();
    const tabbable = keys.filter((key) => key.tabIndex === 0);

    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toHaveAccessibleName('C4');
  });

  it('moves focus with ArrowRight, ArrowLeft, Home and End', () => {
    renderKeyboard();

    const middleC = screen.getByRole('button', { name: 'C4' });
    middleC.focus();

    fireEvent.keyDown(middleC, { code: 'ArrowRight' });
    expect(screen.getByRole('button', { name: 'C#4' })).toHaveFocus();

    fireEvent.keyDown(document.activeElement, { code: 'ArrowLeft' });
    expect(middleC).toHaveFocus();

    fireEvent.keyDown(document.activeElement, { code: 'Home' });
    expect(screen.getByRole('button', { name: 'A0' })).toHaveFocus();

    fireEvent.keyDown(document.activeElement, { code: 'End' });
    const lastKey = screen.getByRole('button', { name: 'C8' });
    expect(lastKey).toHaveFocus();
    expect(lastKey.tabIndex).toBe(0);
  });

  it('forwards pointer input to the note callbacks', () => {
    const { onNoteOn, onNoteOff } = renderKeyboard();
    const a4 = screen.getByRole('button', { name: 'A4' });

    fireEvent.pointerDown(a4, { button: 0, pointerId: 1 });
    fireEvent.pointerUp(a4, { button: 0, pointerId: 1 });

    expect(onNoteOn).toHaveBeenCalledWith(69);
    expect(onNoteOff).toHaveBeenCalledWith(69);
  });
});
