import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from '../App';

describe('App homework navigation', () => {
  it('shows the Drum Kit by default', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'Interactive Drum Kit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'HW1 · Drum Kit' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches to the Grand Piano and unmounts the Drum Kit', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'HW2 · Grand Piano 88' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Grand Piano 88' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Interactive Drum Kit' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'HW2 · Grand Piano 88' })).toHaveAttribute('aria-pressed', 'true');
  });
    it('names the current homework in the page title (WCAG 2.4.2)', () => {
    render(<App />);

    expect(document.title).toBe('HW1 · Drum Kit | Lab 03 · React 19 Studio');

    fireEvent.click(screen.getByRole('button', { name: 'HW2 · Grand Piano 88' }));

    expect(document.title).toBe('HW2 · Grand Piano 88 | Lab 03 · React 19 Studio');
  });

});
