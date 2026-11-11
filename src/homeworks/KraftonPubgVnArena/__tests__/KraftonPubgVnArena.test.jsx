import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../../../App';
import KraftonPubgVnArena from '../KraftonPubgVnArena';

const NOW = 1_800_000_000_000;
const LATENCY = 700;

const vipCard = () => screen.getByRole('article', { name: /vip pass/i });

describe('KraftonPubgVnArena page', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the airdrops, leaderboard and kill feed sections', () => {
    render(<KraftonPubgVnArena />);

    expect(screen.getByRole('heading', { level: 1, name: 'PUBG Vietnam Airdrop Arena' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getByRole('table', { name: /standings/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Kill feed, newest first' })).toBeInTheDocument();
  });

  it('claims a live drop optimistically, then confirms it', async () => {
    render(<KraftonPubgVnArena />);

    const card = vipCard();
    fireEvent.click(within(card).getByRole('button', { name: 'Claim' }));

    // Optimistic: stock 5 -> 4 before the server answers.
    expect(within(card).getByText('4')).toBeInTheDocument();
    expect(within(card).getByRole('button')).toHaveTextContent('Claiming…');

    await act(() => vi.advanceTimersByTimeAsync(LATENCY));

    expect(within(card).getByText(/claimed .*vip pass/i)).toBeInTheDocument();
    expect(within(card).getByText('4')).toBeInTheDocument();
  });

  it('rolls back with a 409 after rivals loot the server stock', async () => {
    render(<KraftonPubgVnArena />);

    fireEvent.click(screen.getByRole('button', { name: /simulate rivals/i }));
    expect(screen.getByText(/will be rejected with 409/i)).toBeInTheDocument();

    const card = vipCard();
    fireEvent.click(within(card).getByRole('button', { name: 'Claim' }));
    await act(() => vi.advanceTimersByTimeAsync(LATENCY));

    expect(within(card).getByText(/your claim was rolled back/i)).toBeInTheDocument();
    expect(within(card).getByText('Looted out')).toBeInTheDocument();
    expect(within(card).getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  });

  it('is reachable from the homework navigation', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'HW3 · PUBG VN Arena' }));

    expect(screen.getByRole('heading', { level: 1, name: 'PUBG Vietnam Airdrop Arena' })).toBeInTheDocument();
    expect(document.title).toBe('HW3 · PUBG VN Arena | Lab 03 · React 19 Studio');
  });
});
