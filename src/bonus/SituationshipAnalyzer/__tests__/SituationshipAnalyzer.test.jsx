import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockPartner } from '../model/mockPartner';
import { SituationshipAnalyzer } from '../SituationshipAnalyzer';

const ghosting = () => createMockPartner({ random: () => 0.99 }); // seen, no reply
const replying = () => createMockPartner({ random: () => 0, replyDelayMs: 2000 });

function renderAnalyzer(partner = ghosting()) {
  render(<SituationshipAnalyzer partner={partner} />);
}

// Two live regions exist; each has its own accessible name.
const verdict = () => screen.getByRole('status', { name: 'Cảnh báo red-flag' });
const button = (name) => screen.getByRole('button', { name });

function sendMessage(text) {
  fireEvent.change(screen.getByLabelText('Tin nhắn'), { target: { value: text } });
  fireEvent.click(button('Gửi'));
}

describe('SituationshipAnalyzer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is a Vietnamese-language article starting in DATING_NO_LOVE', () => {
    renderAnalyzer();

    const article = screen.getByRole('article', { name: 'Hẹn Hò Nhưng Không Yêu Analyzer' });

    expect(article).toHaveAttribute('lang', 'vi');
    expect(screen.getByText('Hẹn hò nhưng không yêu')).toBeInTheDocument();
  });

  it('labels every input with useId', () => {
    renderAnalyzer();

    expect(screen.getByLabelText('Em cố bao nhiêu lần (× 0.1)')).toHaveValue(100);
    expect(screen.getByLabelText('Ai đó bao nhiêu phần (× 50)')).toHaveValue(1);
    expect(screen.getByLabelText('Tin nhắn')).toHaveAttribute('type', 'text');
  });

  it('derives a red flag: 100 tries x 0.1 < 1 part x 50', () => {
    renderAnalyzer();

    fireEvent.click(button('Ghi nỗ lực của em'));
    fireEvent.click(button('Ghi nỗ lực của ai đó'));

    expect(verdict()).toHaveAttribute('aria-live', 'polite');
    expect(verdict().tagName).toBe('OUTPUT');
    expect(verdict()).toHaveTextContent('[RED-FLAG] Hẹn hò nhưng không yêu: em 10 điểm, ai đó 50 điểm');
    expect(screen.getByText('Nhật ký: 2 tín hiệu (bất biến)')).toBeInTheDocument();
  });

  it('stays stable when the effort is balanced', () => {
    renderAnalyzer();

    fireEvent.change(screen.getByLabelText('Em cố bao nhiêu lần (× 0.1)'), { target: { value: '1000' } });
    fireEvent.click(button('Ghi nỗ lực của em')); // 100 points
    fireEvent.click(button('Ghi nỗ lực của ai đó')); // 50 points

    expect(verdict()).toHaveTextContent('[OK] Stable');
  });

  it('rejects invalid step counts', () => {
    renderAnalyzer();

    const input = screen.getByLabelText('Em cố bao nhiêu lần (× 0.1)');
    fireEvent.change(input, { target: { value: '2.5' } });
    fireEvent.click(button('Ghi nỗ lực của em'));

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Nhật ký: 0 tín hiệu (bất biến)')).toBeInTheDocument();
  });

  it('"Seen không rep": exits automatically after 5 s', async () => {
    renderAnalyzer();

    sendMessage('Tối nay rảnh không?');
    expect(screen.getByText(/đang chờ trả lời/)).toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(5000));

    expect(screen.getByText('Đã dừng lại', { selector: 'strong' })).toBeInTheDocument();
    expect(verdict()).toHaveTextContent('bộ nhớ đã được giải phóng');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('records the reply as "ai đó một phần" when they answer in time', async () => {
    renderAnalyzer(replying());

    sendMessage('Ngủ chưa?');
    await act(() => vi.advanceTimersByTimeAsync(2000));

    expect(screen.getByText(/ai đó đã trả lời/i)).toBeInTheDocument();
    expect(screen.getByText('Hẹn hò nhưng không yêu', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText('Ai đó: 1 phần')).toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('"Dừng lại" cancels the pending wait immediately', async () => {
    renderAnalyzer();

    sendMessage('Mình là gì của nhau?');
    fireEvent.click(button('Dừng lại (giải phóng bộ nhớ)'));

    expect(vi.getTimerCount()).toBe(0);
    await act(() => vi.advanceTimersByTimeAsync(10_000));
    expect(screen.getByText('Đã dừng lại', { selector: 'strong' })).toBeInTheDocument();
  });

  it('only offers transitions that are legal in the current phase', () => {
    renderAnalyzer();

    expect(button('Xác nhận yêu thật')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Làm lại từ đầu' })).not.toBeInTheDocument();

    fireEvent.click(button('Dừng lại (giải phóng bộ nhớ)'));

    expect(button('Làm lại từ đầu')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Xác nhận yêu thật' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Tin nhắn')).toBeDisabled();
  });

  it('official love cancels the ghosting timer and never shows a red flag', async () => {
    renderAnalyzer();

    fireEvent.click(button('Ghi nỗ lực của em'));
    fireEvent.click(button('Ghi nỗ lực của ai đó'));
    sendMessage('Yêu nhau nhé?');
    fireEvent.click(button('Xác nhận yêu thật'));

    await act(() => vi.advanceTimersByTimeAsync(10_000));

    expect(screen.getByText('Yêu chính thức', { selector: 'strong' })).toBeInTheDocument();
    expect(verdict()).toHaveTextContent('[OK]');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cleans up the pending wait on unmount', () => {
    const { unmount } = render(<SituationshipAnalyzer partner={ghosting()} />);

    sendMessage('Alo?');
    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
