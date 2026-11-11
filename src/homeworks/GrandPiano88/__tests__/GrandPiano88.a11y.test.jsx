import { render } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from '../../../App';
import GrandPiano88 from '../GrandPiano88';
import { FakeAudioContext } from '../audio/__tests__/fakeAudioContext';

// jsdom has no layout engine, so these two rules cannot be measured here.
// They are verified manually with Lighthouse / DevTools instead.
const AXE_OPTIONS = {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
  rules: {
    'color-contrast': { enabled: false },
    'target-size': { enabled: false },
  },
};

async function getViolations(container) {
  const results = await axe.run(container, AXE_OPTIONS);

  // Readable failure message: rule id + offending HTML.
  return results.violations.map((violation) => ({
    id: violation.id,
    nodes: violation.nodes.map((node) => node.html),
  }));
}

describe('GrandPiano88 accessibility (axe-core, WCAG 2.2 A/AA)', () => {
  beforeEach(() => {
    vi.stubGlobal('AudioContext', FakeAudioContext);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('has no detectable violations on the piano page', async () => {
    const { container } = render(<GrandPiano88 />);

    expect(await getViolations(container)).toEqual([]);
  });

  it('has no detectable violations in the full app shell', async () => {
    const { container } = render(<App />);

    expect(await getViolations(container)).toEqual([]);
  });
});
