import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SQUAD_STANDINGS } from '../../data/arenaData';
import { SquadLeaderboard } from '../SquadLeaderboard';

function renderBoard() {
  render(<SquadLeaderboard standings={SQUAD_STANDINGS} />);
}

// Squad names in table order (row headers).
const squadOrder = () =>
  within(screen.getByRole('table'))
    .queryAllByRole('rowheader')
    .map((cell) => cell.textContent);

describe('SquadLeaderboard', () => {
  it('renders a captioned table ranked by total points', () => {
    renderBoard();

    expect(screen.getByRole('table', { name: /pvs grand finals standings/i })).toBeInTheDocument();
    expect(squadOrder()).toEqual(['The Expendables', 'Cerberus Esports', 'Roy Esports', 'AGG']);
  });

  it('pairs every control with a label (useId)', () => {
    renderBoard();

    expect(screen.getByLabelText('Search squad')).toHaveAttribute('type', 'search');
    expect(screen.getByLabelText('Sort by').tagName).toBe('SELECT');
    expect(screen.getByLabelText('Minimum WWCD').tagName).toBe('SELECT');
  });

  it('re-sorts by kill points and marks the sorted column', () => {
    renderBoard();

    fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'killPts' } });

    expect(squadOrder()).toEqual(['The Expendables', 'Roy Esports', 'Cerberus Esports', 'AGG']);
    expect(screen.getByRole('columnheader', { name: 'Kills' })).toHaveAttribute('aria-sort', 'descending');
    expect(screen.getByRole('columnheader', { name: 'Total' })).not.toHaveAttribute('aria-sort');
  });

  it('searches without changing the rank and announces the count', () => {
    renderBoard();

    fireEvent.change(screen.getByLabelText('Search squad'), { target: { value: 'roy' } });

    expect(squadOrder()).toEqual(['Roy Esports']);
    expect(screen.getByRole('row', { name: /roy esports/i })).toHaveTextContent('#3');
    expect(screen.getByText('Showing 1 of 4 squads')).toHaveAttribute('aria-live', 'polite');
  });

  it('filters by minimum WWCD', () => {
    renderBoard();

    fireEvent.change(screen.getByLabelText('Minimum WWCD'), { target: { value: '3' } });

    expect(squadOrder()).toEqual(['The Expendables']);
  });

  it('shows an empty state when nothing matches', () => {
    renderBoard();

    fireEvent.change(screen.getByLabelText('Search squad'), { target: { value: 'zzz' } });

    expect(screen.getByText('No squads match your search.')).toBeInTheDocument();
    expect(screen.getByText('Showing 0 of 4 squads')).toBeInTheDocument();
  });

  it('wraps the table in a focusable, labelled scroll region', () => {
    renderBoard();

    const region = screen.getByRole('region', { name: 'Squad standings table' });

    expect(region).toHaveAttribute('tabindex', '0');
  });
});
