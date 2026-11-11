import { fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import App from '../../../App';
import SituationshipPage from '../SituationshipPage';

// jsdom has no layout engine: contrast and target size are measured
// in a real browser (Lighthouse) instead.
const AXE_OPTIONS = {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
  rules: {
    'color-contrast': { enabled: false },
    'target-size': { enabled: false },
  },
};

describe('SituationshipPage', () => {
  it('is reachable from the homework navigation', () => {
    render(<App />);

    const navButton = screen.getByRole('button', { name: 'Bonus · Hẹn Hò Nhưng Không Yêu' });
    expect(navButton).toHaveAttribute('lang', 'vi');

    fireEvent.click(navButton);

    expect(screen.getByRole('heading', { level: 1, name: 'Hẹn Hò Nhưng Không Yêu' })).toBeInTheDocument();
    expect(document.title).toBe('Bonus · Hẹn Hò Nhưng Không Yêu | Lab 03 · React 19 Studio');
  });

  it('has no detectable axe violations (WCAG 2.2 A/AA + best practices)', async () => {
    const { container } = render(<SituationshipPage />);

    const results = await axe.run(container, AXE_OPTIONS);
    const violations = results.violations.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.map((node) => node.html.slice(0, 120)),
    }));

    expect(violations).toEqual([]);
  });
});
