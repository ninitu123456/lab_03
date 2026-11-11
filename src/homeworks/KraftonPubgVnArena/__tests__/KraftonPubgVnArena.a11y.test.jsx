import { render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import KraftonPubgVnArena from '../KraftonPubgVnArena';

// jsdom has no layout engine: contrast and target size are measured
// in a real browser (Lighthouse) instead.
const AXE_OPTIONS = {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
  rules: {
    'color-contrast': { enabled: false },
    'target-size': { enabled: false },
  },
};

describe('KraftonPubgVnArena accessibility (axe-core, WCAG 2.2 A/AA)', () => {
  it('has no detectable violations', async () => {
    const { container } = render(<KraftonPubgVnArena />);

    const results = await axe.run(container, AXE_OPTIONS);
    const violations = results.violations.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.map((node) => node.html.slice(0, 120)),
    }));

    expect(violations).toEqual([]);
  });
});
