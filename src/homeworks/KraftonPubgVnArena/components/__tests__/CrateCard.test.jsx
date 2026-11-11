import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AIRDROP_WINDOW_MS } from '../../data/arenaData';
import { CrateCard } from '../CrateCard';

const NOW = 1_800_000_000_000;

const makeDrop = (overrides = {}) => ({
  id: 'vip-pass',
  title: 'PVS Finals VIP Pass',
  priceVnd: 1_250_000,
  remainingStock: 5,
  dropEpochMs: NOW + 90_000,
  ...overrides,
});

function renderCard(props = {}) {
  const onClaim = vi.fn();

  render(<CrateCard drop={makeDrop()} isPending={false} onClaim={onClaim} {...props} />);

  return { onClaim, claimButton: screen.getByRole('button') };
}

describe('CrateCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is an article named by its title, with the price in VND', () => {
    renderCard();

    expect(screen.getByRole('article', { name: 'PVS Finals VIP Pass' })).toBeInTheDocument();
    expect(screen.getByText(/^1\.250\.000\s₫$/)).toBeInTheDocument();
  });

  it('counts down during WARMUP and blocks claiming', () => {
    const { claimButton, onClaim } = renderCard();

    expect(screen.getByText('Warm-up')).toBeInTheDocument();
    expect(screen.getByText('01:30')).toBeInTheDocument();
    expect(claimButton).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(claimButton);
    expect(onClaim).not.toHaveBeenCalled();
  });

  it('goes AIRDROP_LIVE at zero and allows claiming', () => {
    const { claimButton, onClaim } = renderCard();

    act(() => vi.advanceTimersByTime(90_000));

    expect(screen.getByText('Airdrop live')).toBeInTheDocument();
    expect(claimButton).toHaveAttribute('aria-disabled', 'false');

    fireEvent.click(claimButton);
    expect(onClaim).toHaveBeenCalledWith('vip-pass');
  });

  it('shows LOOTED_OUT when the stock is empty', () => {
    renderCard({ drop: makeDrop({ dropEpochMs: NOW - 1000, remainingStock: 0 }) });

    expect(screen.getByText('Looted out')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows EXPIRED after the airdrop window', () => {
    renderCard({ drop: makeDrop({ dropEpochMs: NOW - AIRDROP_WINDOW_MS }) });

    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('marks a pending claim as busy and blocks a second click', () => {
    const { claimButton, onClaim } = renderCard({
      drop: makeDrop({ dropEpochMs: NOW - 1000 }),
      isPending: true,
    });

    expect(claimButton).toHaveTextContent('Claiming…');
    expect(claimButton).toHaveAttribute('aria-busy', 'true');

    fireEvent.click(claimButton);
    expect(onClaim).not.toHaveBeenCalled();
  });

  it('announces the claim result in a polite live region', () => {
    renderCard({
      drop: makeDrop({ dropEpochMs: NOW - 1000, remainingStock: 0 }),
      status: { type: 'conflict', message: 'Looted out! Your claim was rolled back.' },
    });

    const status = screen.getByText(/your claim was rolled back/i);

    expect(status.tagName).toBe('OUTPUT');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });
});
