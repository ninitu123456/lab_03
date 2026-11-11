import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PianoKey } from '../PianoKey';

function renderKey(props = {}) {
  const onNoteOn = vi.fn();
  const onNoteOff = vi.fn();

  const utils = render(
    <PianoKey
      midi={60}
      noteName="C4"
      isBlack={false}
      isPressed={false}
      whiteIndex={23}
      onNoteOn={onNoteOn}
      onNoteOff={onNoteOff}
      {...props}
    />,
  );

  return {
    ...utils,
    button: screen.getByRole('button', { name: 'C4' }),
    onNoteOn,
    onNoteOff,
  };
}

describe('PianoKey', () => {
  it('is wrapped in React.memo', () => {
    expect(PianoKey.$$typeof).toBe(Symbol.for('react.memo'));
  });

  it('renders an accessible button with the note name', () => {
    const { button } = renderKey();

    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('piano-key', 'piano-key--white');
  });

  it('uses the black key style for black keys', () => {
    const onNoteOn = vi.fn();

    render(
      <PianoKey
        midi={61}
        noteName="C#4"
        isBlack
        isPressed={false}
        whiteIndex={23}
        onNoteOn={onNoteOn}
        onNoteOff={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'C#4' })).toHaveClass('piano-key--black');
  });

  it('exposes the pressed state with aria-pressed', () => {
    const { button, rerender, onNoteOn, onNoteOff } = renderKey();

    expect(button).toHaveAttribute('aria-pressed', 'false');

    rerender(
      <PianoKey
        midi={60}
        noteName="C4"
        isBlack={false}
        isPressed
        whiteIndex={23}
        onNoteOn={onNoteOn}
        onNoteOff={onNoteOff}
      />,
    );

    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('plays and releases the note with the pointer', () => {
    const { button, onNoteOn, onNoteOff } = renderKey();

    fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
    expect(onNoteOn).toHaveBeenCalledWith(60);

    fireEvent.pointerUp(button, { button: 0, pointerId: 1 });
    expect(onNoteOff).toHaveBeenCalledWith(60);
  });

  it('releases the note when the pointer is cancelled', () => {
    const { button, onNoteOff } = renderKey();

    fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
    fireEvent.pointerCancel(button, { pointerId: 1 });

    expect(onNoteOff).toHaveBeenCalledWith(60);
  });

  it('ignores non-primary mouse buttons', () => {
    const { button, onNoteOn } = renderKey();

    fireEvent.pointerDown(button, { button: 2, pointerId: 1 });

    expect(onNoteOn).not.toHaveBeenCalled();
  });

  it('can be played with Space and Enter from the keyboard', () => {
    const { button, onNoteOn, onNoteOff } = renderKey();

    fireEvent.keyDown(button, { code: 'Space' });
    fireEvent.keyUp(button, { code: 'Space' });
    fireEvent.keyDown(button, { code: 'Enter' });

    expect(onNoteOn).toHaveBeenCalledTimes(2);
    expect(onNoteOff).toHaveBeenCalledTimes(1);
  });

  it('ignores keyboard auto-repeat', () => {
    const { button, onNoteOn } = renderKey();

    fireEvent.keyDown(button, { code: 'Space' });
    fireEvent.keyDown(button, { code: 'Space', repeat: true });

    expect(onNoteOn).toHaveBeenCalledTimes(1);
  });

  it('ignores unrelated keys', () => {
    const { button, onNoteOn } = renderKey();

    fireEvent.keyDown(button, { code: 'KeyQ' });

    expect(onNoteOn).not.toHaveBeenCalled();
  });
});
