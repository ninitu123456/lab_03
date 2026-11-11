import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SQUAD_STANDINGS } from '../../data/arenaData';
import { createKillFeed } from '../../data/killFeed';
import { KillFeed, ROW_HEIGHT } from '../KillFeed';

const FEED = createKillFeed(500);

function renderFeed() {
  render(<KillFeed entries={FEED} squads={SQUAD_STANDINGS} />);

  const viewport = screen.getByRole('region', { name: /kill feed/i });
  const rows = () => within(viewport).queryAllByRole('listitem');

  return { viewport, rows };
}

describe('KillFeed (virtualized)', () => {
  it('renders only a small window of the 500 entries', () => {
    const { rows } = renderFeed();

    expect(rows().length).toBeGreaterThan(0);
    expect(rows().length).toBeLessThanOrEqual(15);
    expect(rows()[0]).toHaveAttribute('aria-setsize', '500');
    expect(rows()[0]).toHaveAttribute('aria-posinset', '1');
  });

  it('moves the rendered window when scrolling', () => {
    const { viewport, rows } = renderFeed();

    fireEvent.scroll(viewport, { target: { scrollTop: 200 * ROW_HEIGHT } });

    const firstPosition = Number(rows()[0].getAttribute('aria-posinset'));

    expect(firstPosition).toBeGreaterThan(190);
    expect(rows().length).toBeLessThanOrEqual(15);
  });

  it('pairs every filter with a label (useId)', () => {
    renderFeed();

    expect(screen.getByLabelText('Squad').tagName).toBe('SELECT');
    expect(screen.getByLabelText('Weapon').tagName).toBe('SELECT');
    expect(screen.getByLabelText('Headshots only')).toHaveAttribute('type', 'checkbox');
  });

  it('filters by squad, announces the count and resets to the top', () => {
    const { viewport, rows } = renderFeed();

    fireEvent.scroll(viewport, { target: { scrollTop: 100 * ROW_HEIGHT } });
    fireEvent.change(screen.getByLabelText('Squad'), { target: { value: 'agg' } });

    const count = screen.getByText(/of 500 kills/);

    expect(count).toHaveAttribute('aria-live', 'polite');
    expect(count.textContent).not.toBe('500 of 500 kills');
    expect(rows()[0]).toHaveAttribute('aria-posinset', '1');
    expect(rows().every((row) => row.textContent.includes('AGG.'))).toBe(true);
  });

  it('shows only headshots when the checkbox is ticked', () => {
    const { rows } = renderFeed();

    fireEvent.click(screen.getByLabelText('Headshots only'));

    expect(rows().every((row) => row.textContent.includes('Headshot'))).toBe(true);
  });

  it('shows an empty state when no kill matches', () => {
    render(<KillFeed entries={[]} squads={SQUAD_STANDINGS} />);

    expect(screen.getByText('No kills match these filters.')).toBeInTheDocument();
  });
});
