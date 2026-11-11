import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TransportControls } from '../TransportControls';

function renderControls(props = {}) {
  const handlers = {
    onSpeedChange: vi.fn(),
    onToggleRecording: vi.fn(),
    onPlay: vi.fn(),
    onStop: vi.fn(),
  };

  render(
    <TransportControls
      status="idle"
      noteCount={0}
      durationMs={0}
      speed={1}
      message="No recording yet."
      {...handlers}
      {...props}
    />,
  );

  return handlers;
}

describe('TransportControls', () => {
  it('pairs the speed select with its label via useId', () => {
    renderControls();

    const select = screen.getByLabelText('Playback speed');

    expect(select.tagName).toBe('SELECT');
    expect(select.id).not.toBe('');
  });

  it('offers 0.5x, 1x and 2x and reports numeric values', () => {
    const { onSpeedChange } = renderControls();
    const select = screen.getByLabelText('Playback speed');

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      '0.5x',
      '1x',
      '2x',
    ]);

    fireEvent.change(select, { target: { value: '2' } });

    expect(onSpeedChange).toHaveBeenCalledWith(2);
  });

  it('announces status messages in a polite live region', () => {
    renderControls({ message: 'Playback finished.' });

    const status = screen.getByText('Playback finished.');

    expect(status.tagName).toBe('OUTPUT');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('marks Play unavailable when nothing is recorded', () => {
    renderControls({ noteCount: 0 });

    expect(screen.getByRole('button', { name: 'Play' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Stop Sequence' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('exposes the recording state with aria-pressed', () => {
    renderControls({ status: 'recording' });

    expect(screen.getByRole('button', { name: 'Record' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Play' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('enables Stop Sequence only while playing', () => {
    const { onStop } = renderControls({ status: 'playing', noteCount: 3 });
    const stopButton = screen.getByRole('button', { name: 'Stop Sequence' });

    expect(stopButton).toHaveAttribute('aria-disabled', 'false');
    expect(screen.getByRole('button', { name: 'Record' })).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(stopButton);
    expect(onStop).toHaveBeenCalled();
  });

  it('shows the recording summary', () => {
    renderControls({ noteCount: 12, durationMs: 4250 });

    expect(screen.getByText(/recording:/i)).toHaveTextContent('Recording: 12 notes · 4.3 s');
  });
});
