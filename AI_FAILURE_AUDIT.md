# AI Failure Audit – Lab 03
e
## 1. Overview

This document records issues encountered during the AI-assisted development of the Drum Machine application.

The purpose of this audit is to evaluate AI-generated suggestions, identify technical problems, document corrective actions, and verify the final implementation.

AI-generated code was treated as a starting point rather than automatically accepted as correct.

## 2. Identified Issues and Corrective Actions

### Issue 01 – Vitest Setup Configuration

**Category:** Testing Configuration

**Problem:**

The initial test execution failed with:

`ReferenceError: expect is not defined`

The error occurred when importing `@testing-library/jest-dom` from the test setup file.

**Root Cause:**

The Jest DOM setup expected a global `expect` object, but the initial Vitest configuration did not expose it globally.

**Corrective Action:**

Updated `vite.config.js` to enable Vitest globals:

```js
test: {
  environment: 'jsdom',
  setupFiles: './src/setupTests.js',
  clearMocks: true,
  globals: true,
}
```

**Verification:**

Re-ran the automated test suite successfully.

**Lesson Learned:**

Testing libraries and test runners may have different configuration requirements. Their integration must be verified rather than assumed.

---

### Issue 02 – Unstable Callback Reference in Hook Test

**Category:** React State and Effect Management

**Problem:**

The test `updates pressed pad state on keydown and keyup` failed.

The pressed pad state remained active after the simulated keyup event.

**Root Cause:**

The test initially created `vi.fn()` directly inside the `renderHook` callback:

```jsx
renderHook(() =>
  useDrumKeyboard(DRUM_PAD_MAP, vi.fn()),
);
```

A new callback reference was created whenever the hook rendered again.

Because the hook's `useEffect` depends on callback references, React cleaned up and re-ran the effect after the state update. The cleanup cleared the pressed-key tracking Map before the keyup event could be processed.

**Corrective Action:**

Created the mock callback outside `renderHook`:

```jsx
const onTriggerPad = vi.fn();

const { result } = renderHook(() =>
  useDrumKeyboard(DRUM_PAD_MAP, onTriggerPad),
);
```

This keeps the callback reference stable during the test.

**Verification:**

The keydown and keyup state test passed.

**Lesson Learned:**

Callback identity matters when callbacks are included in React effect dependencies. Tests should reproduce realistic component behavior and avoid unnecessary reference changes.

---

### Issue 03 – Keyboard Hook Helper Function Structure

**Category:** JavaScript Implementation

**Problem:**

During implementation of the keyboard hook, the helper function responsible for identifying typing targets had a code-structure issue.

This affected the correct interpretation and execution of the keyboard shortcut logic.

**Corrective Action:**

Reviewed and corrected the `isTypingTarget()` helper function, ensuring that it:

- Checks whether the event target is an Element.
- Ignores INPUT, TEXTAREA, and SELECT elements.
- Ignores editable content.
- Returns a valid boolean result.

**Verification:**

The input-target keyboard test passed.

**Lesson Learned:**

Helper functions should be reviewed independently, especially when they control event filtering and application behavior.

---

### Issue 04 – ESLint and React Ref Handling

**Category:** Code Quality

**Problem:**

During development, ESLint identified issues related to React hook and ref usage.

**Corrective Action:**

Reviewed the hook lifecycle and kept keyboard tracking inside the effect-managed event handlers rather than updating tracking data during component rendering.

**Verification:**

Ran ESLint again and confirmed that the project passed without errors.

**Lesson Learned:**

React refs should be used carefully. Their lifecycle and interaction with rendering and effects must be understood.

---

### Issue 05 – Duplicate Responsive CSS Rules

**Category:** Maintainability and Responsive Design

**Problem:**

The Drum Machine stylesheet contained overlapping responsive media queries.

This made the stylesheet harder to maintain and increased the possibility of conflicting styles.

**Corrective Action:**

Consolidated responsive rules into organized breakpoints and reviewed the layout for:

- Desktop screens.
- Tablet screens.
- Mobile screens.
- Small screens around 375px.

**Verification:**

Reviewed the resulting CSS and checked the responsive layout.

**Lesson Learned:**

AI-generated CSS should be reviewed for duplicated selectors, overlapping media queries, and unnecessary complexity.

---

### Issue 06 – Drum Kit Heading Invisible in Light Mode

**Category:** Accessibility (WCAG 1.4.3 Contrast Minimum)

**Problem:**

The heading "Interactive Drum Kit" inherited the global `h1` color from `src/index.css` (`--text-h: #08060d`), which only switches to a light color under `prefers-color-scheme: dark`. On a light-mode system the heading was near-black text on the dark navy studio background (about 1.1:1).

**How it was detected:**

Screenshots taken in a headless browser running in light mode while collecting evidence. Lighthouse did not report it, because the header background is a gradient and color contrast cannot be computed automatically on gradients. The developer machine uses dark mode, so the defect was never visible during development.

**Corrective Action:**

Set an explicit color (`#f8fafc`) on `.drum-machine__header h1`, so the heading no longer depends on the global color scheme.

**Verification:**

Computed heading color after the fix: `rgb(248, 250, 252)`. Evidence: `evidence/hw1-drum-kit/01-desktop-overview.png`, `evidence/hw1-drum-kit/04-mobile-375px.png`.

**Lesson Learned:**

Test in both color schemes. Automated contrast checks silently skip gradient backgrounds.

---

### Issue 07 – Drum Pad aria-label Hid Visible Text (Label in Name)

**Category:** Accessibility (WCAG 2.5.3 Label in Name)

**Problem:**

Each pad showed "W / KICK / Bass Drum" but used `aria-label="KICK, keyboard shortcut W"`. The accessible name did not contain the visible text "Bass Drum", so a speech-input user saying "click Bass Drum" could not activate the pad.

**How it was detected:**

The Lighthouse audit `label-content-name-mismatch` failed on all 7 pads. The audit has weight 0, so the score still showed 100.

**Corrective Action:**

Removed `aria-label`; the accessible name now comes from the visible text. The shortcut is exposed with `aria-keyshortcuts="W"` instead.

**Verification:**

- New test: `keeps the visible text in the accessible name (WCAG 2.5.3)`.
- Lighthouse (navigation mode): 100, no failed audits. Evidence: `evidence/hw1-drum-kit/05-lighthouse-accessibility.png`.

**Lesson Learned:**

A score of 100 can still hide failed zero-weight audits. Read the failed-audit list, not only the score.

---

## 3. Testing and Verification Summary

The final implementation was checked using automated tests and project validation commands.

| Verification | Result |
|---|---|
| Keyboard shortcut tests | PASS |
| Repeated keydown prevention | PASS |
| Input shortcut exclusion | PASS |
| Keydown and keyup state | PASS |
| Disabled keyboard shortcuts | PASS |
| DrumPad rendering | PASS |
| DrumPad accessibility state | PASS |
| DrumPad click interaction | PASS |
| Label in Name (visible text in accessible name) | PASS |
| ESLint | PASS |
| Production build | PASS |

**Automated test result:** 9/9 Drum Kit tests passed (132/132 for the whole project).

### Evidence (`evidence/hw1-drum-kit/`)

| Screenshot | What it shows |
|---|---|
| `01-desktop-overview.png` | Studio layout, readable heading in light mode |
| `02-keyboard-hits-and-hit-log.png` | Real key presses W A S D J K L (`e.code`), Hit Log of the 8 latest hits, live region "KICK played" |
| `03-focus-visible-and-aria-pressed.png` | Visible focus ring on a pad (Tab) and the `aria-pressed` pad while S is held |
| `04-mobile-375px.png` | 375 px viewport: page width 375 px, no horizontal scroll |
| `05-lighthouse-accessibility.png` | Lighthouse 13.5.0 Accessibility **100** (navigation mode, no failed audits) |

Measured during capture: holding W (three `keydown` events, the last two with `e.repeat = true`) added exactly **one** hit (7 → 8). The live region is an `<output aria-live="polite">`.

## 4. Human Review and AI Limitations

AI assistance accelerated implementation and provided useful suggestions, but several issues demonstrated why human verification remains necessary.

The development process followed these principles:

1. Review generated code before accepting it.
2. Run ESLint to detect code-quality problems.
3. Run automated tests to verify application behavior.
4. Test keyboard interactions manually.
5. Review accessibility attributes and responsive styles.
6. Verify the production build before committing changes.

AI-generated code is not guaranteed to be correct, complete, accessible, or compatible with the existing project configuration.

## 5. Conclusion

The AI-assisted development process helped accelerate the implementation of the Drum Machine.

However, configuration errors, unstable callback references, code-structure issues, and CSS duplication demonstrated that generated suggestions require independent review and verification.

The final implementation was validated through automated tests, ESLint, and production build checks.

**Final result: 8/8 automated tests passed, ESLint passed, and production build completed successfully.**


---

# Homework 2 – Grand Piano 88

## 6. Identified Issues and Corrective Actions

### Issue 08 – Voice Pool Did Not Follow the Course Contract

**Category:** Requirements Compliance / Web Audio

**Introduced in:** `119dfaa` · **Fixed in:** `d2c45e9`

**Problem:**

The AI-generated `PianoAudioEngine` passed all of its own tests, but it did not match the HW2 contract:

- The voice `Map` used an internal voice id as key, so the oldest note could not be read with `voices.keys().next().value`.
- Stolen voices were faded with a 15 ms **linear** ramp instead of the required `exponentialRampToValueAtTime(0.0001, now + 0.04)`.

**How it was detected:**

Re-reading the lecturer's "Polyphonic Voice Pool" contract line by line against the code. The tests could not catch it because the AI wrote the tests for its own design, not for the specification.

**Corrective Action:**

- Keyed the voice pool by MIDI number (`Map<midi, voice>`); FIFO stealing reads `voices.keys().next().value`.
- Added `scheduleFadeOut()` with a 40 ms exponential ramp to `0.0001` before `oscillator.stop()`.
- Re-triggering a key that is still releasing restarts it instead of being ignored, so replayed repeated notes are not lost.

**Verification:**

New tests: `tracks voices in a midi-keyed Map with FIFO order`, `fades a stolen voice out exponentially within 40 ms`, `restarts a note that is still releasing`.

**Lesson Learned:**

Passing tests only prove the code matches the tests. Requirements must be checked against the specification, not against AI-written tests.

---

### Issue 09 – Focus Style Broke Absolute Key Positioning

**Category:** CSS / Layout

**Introduced in:** `0d2e9b5` · **Fixed in:** `537ec8e`

**Problem:**

The AI added `position: relative` to `.piano-key:focus-visible`. The keyboard layout positions every key with `position: absolute`. Both selectors have the same specificity, so a key focused with the keyboard could fall out of the layout and jump to the start of the keyboard.

**How it was detected:**

Code review while writing the keyboard layout CSS. Unit tests could not detect it because jsdom does not compute layout.

**Corrective Action:**

Removed `position: relative`; `z-index` alone keeps the focused key above its neighbours inside the absolutely positioned keyboard.

**Verification:**

Manual check: Tab into the keyboard and move with the arrow keys; the focused key stays in place.

**Lesson Learned:**

Component-level styles must be reviewed together with the parent layout. jsdom tests do not replace visual testing.

---

### Issue 10 – WCAG 2.2 AA Failures That Automated Tests Missed

**Category:** Accessibility

**Introduced in:** `0d2e9b5`, `537ec8e` · **Fixed in:** `eaecf66`

**Problem:**

| Criterion | Defect |
|---|---|
| 1.4.11 Non-text Contrast | Blue focus outline `#0057d9` on black keys `#1f1f1f`: about 2.5:1 (needs 3:1) |
| 2.5.8 Target Size (Minimum) | Black keys were 21.6 px (desktop) and 19.2 px (mobile) wide (needs 24 px) |
| 1.4.1 Use of Color | Pressed keys were indicated by background color only |
| 2.4.2 Page Titled | Browser tab title was `lab_03` |

**How it was detected:**

Manual contrast calculation and measuring the real layout in a browser at 375 px. axe-core in jsdom reported no violations because it cannot measure color contrast or target size without a layout engine.

**Corrective Action:**

- Amber focus outline on black keys (about 10:1).
- `--black-key-width: max(24px, ...)`.
- Pressed keys also get a dark bottom bar and a bold label.
- `document.title` names the active homework.
- `forced-colors` styles for Windows High Contrast.

**Verification:**

- Browser measurement at 375 px: page `scrollWidth` 375 px (no horizontal scroll, no overflowing element), black keys 24 px. Evidence: `evidence/hw2-grand-piano/08-mobile-375px.png`.
- `GrandPiano88.a11y.test.jsx` (axe-core, WCAG 2.2 A/AA tags): 0 violations.
- Lighthouse 13.5.0 Accessibility: **100** (snapshot mode after opening HW2, 23/23 audits passed). Evidence: `evidence/hw2-grand-piano/09-lighthouse-accessibility.png`.
- Focus on a black key uses the amber outline `rgb(251, 191, 36)`. Evidence: `evidence/hw2-grand-piano/04-focus-visible-black-key.png`.

**Lesson Learned:**

"0 violations" from an automated tool is not proof of WCAG compliance. Contrast and target size must be measured in a real browser.

---

## 7. HW2 Verification Summary

| Requirement | Evidence |
|---|---|
| 88 keys generated algorithmically (52 white, 36 black) | `pianoNotes.test.js`, `PianoKeyboard.test.jsx` |
| `f = 440 · 2^((midi − 69) / 12)` | `midi.test.js` |
| 8-voice polyphony, FIFO voice stealing | `PianoAudioEngine.test.js` |
| Click-free 40 ms exponential fade | `PianoAudioEngine.test.js`, `adsr.test.js` |
| FIFO recording `{ midi, freqHz, durationMs, deltaMs }` | `PerformanceRecorder.test.js` |
| Replay at 0.5x / 1x / 2x | `playSequence.test.js`, `usePianoSequencer.test.jsx` |
| AbortController stop / unmount, no leaked timers | `AudioTaskQueue.test.js`, `playSequence.test.js`, `usePianoSequencer.test.jsx` |
| React.memo: 1 key press re-renders 1 key | `GrandPiano88.renders.test.jsx` + `03-render-isolation-one-key.png` |
| WCAG 2.2 AA, 375 px | `GrandPiano88.a11y.test.jsx`, `08-mobile-375px.png`, `09-lighthouse-accessibility.png` |

**Automated result:** 132/132 tests passed, ESLint passed, production build passed.

### Evidence (`evidence/hw2-grand-piano/`)

| Screenshot | What it shows |
|---|---|
| `01-desktop-overview.png` | Keyboard, recorder and shortcut legend |
| `02-chord-polyphony.png` | Chord C4 E4 G4 held on the computer keyboard |
| `03-render-isolation-one-key.png` | One React commit after pressing C4: **1 of 88** `PianoKey` components re-rendered (green outline) |
| `04-focus-visible-black-key.png` | Roving focus on C#4 with the amber focus outline; one Tab stop for the keyboard |
| `05-recording-finished.png` | "Recorded 5 notes (1.8 s)." |
| `06-replay-in-progress.png` | Replay at 0.5x; the replayed note lights up its key |
| `07-stop-sequence.png` | "Playback stopped.", no key left pressed |
| `08-mobile-375px.png` | 375 px viewport, no horizontal page scroll |
| `09-lighthouse-accessibility.png` | Lighthouse Accessibility 100 (23/23 audits) |

How `03-render-isolation-one-key.png` was produced: the page was loaded with a stub of `__REACT_DEVTOOLS_GLOBAL_HOOK__`, the same hook React DevTools uses. After each commit, `onCommitFiberRoot` walks the fiber tree and marks a `PianoKey` as rendered when its props object changed (a `memo` bail-out keeps the previous props object). The application code was not modified.

---

# Homework 3 – KRAFTON x PUBG Vietnam Arena

## 8. Identified Issues and Corrective Actions

### Issue 11 – Reference Airdrop Timer Hook Failed Lint and Never Stopped

**Category:** React Hooks / Timers

**Found while writing:** `9c6999f`

**Problem:**

The `usePubgAirdropTimer` reference implementation from the HW3 contract was the starting point. Running the project's ESLint on it verbatim reported:

`React Hook useEffect has a missing dependency: 'calcRemaining'` (`react-hooks/exhaustive-deps`)

`calcRemaining` is a new function on every render. Adding it to the dependency array would restart the interval on every tick; leaving it out relies on a stale closure. The interval also kept firing every 200 ms after the countdown reached zero.

**How it was detected:**

Linting the contract code as-is before adapting it.

**Corrective Action:**

- Only the clock reading (`nowMs`) is state. `remainingMs = max(0, targetEpochMs - (nowMs + serverOffsetMs))` is derived during render, so the effect depends only on `targetEpochMs` and `serverOffsetMs`.
- The interval is cleared as soon as the drop is live.
- `visibilitychange` still re-syncs immediately when the tab wakes up.

**Verification:**

- Tests: `does not drift when the background tab skips ticks`, `goes live at zero and stops ticking`, `reflects a new target immediately`.
- Real browser: all page timers frozen for 20 s with Chrome's lifecycle state `frozen`; the countdown jumped from `01:30` to `01:09` immediately after resume. Evidence: `evidence/hw3-pubg-arena/02-zero-drift-after-freeze.png`.

**Lesson Learned:**

Reference code is a starting point, not a specification of quality. Run the same lint and tests on it as on your own code.

---

### Issue 12 – Wrapped Headings Overlapped (Template Line-Height)

**Category:** Accessibility / Responsive (WCAG 1.4.10 Reflow)

**Introduced in:** initial Vite template · **Fixed in:** `e4f1c05`

**Problem:**

At 375 px the HW3 heading "PUBG Vietnam Airdrop Arena" wrapped onto two lines that overlapped. `src/index.css` sets `font: 18px/145%` on `:root`. A percentage line-height is computed once (about 26 px) and inherited as a fixed length, so a 36 px `h1` got a 26 px line box. Every homework was affected whenever its title wrapped.

**How it was detected:**

Reviewing a real-browser screenshot at 375 px. Lighthouse (100) and axe-core (0 violations) did not report it, because overlapping text is not an automated rule.

**Corrective Action:**

Unitless `line-height: 1.15` on `h1`, which scales with the heading's own font size.

**Verification:**

Measured in Chrome for all three homeworks at 320 px and 375 px: `h1` line-height 41.4 px for a 36 px font (no overlap), page `scrollWidth` equal to the viewport. Evidence: `evidence/hw3-pubg-arena/09-mobile-375px.png`.

**Lesson Learned:**

Look at the screenshots. A perfect automated score does not mean the page is readable.

---

### Issue 13 – Ambiguous Test Query After Adding Landmarks

**Category:** Testing

**Found in:** `318ec1d` (fixed before commit)

**Problem:**

The AI-written page test looked up the kill feed with `getByRole('region', { name: /kill feed/i })`. The page wraps the feed in a `<section aria-labelledby>` titled "Kill feed", which is also a `region` landmark, so the query matched two elements and the test failed with "Found multiple elements".

**How it was detected:**

Running the test suite.

**Corrective Action:**

Query the scroll container by its exact accessible name, `'Kill feed, newest first'`. The section and the scroller keep distinct names, so assistive technology can tell them apart.

**Verification:**

`KraftonPubgVnArena.test.jsx` passes (209/209 at that commit).

**Lesson Learned:**

Loose regex queries in tests become ambiguous as the page grows. Match accessible names exactly when several landmarks share a word.

---

## 9. HW3 Verification Summary

| Requirement | Evidence |
|---|---|
| Zero-drift `usePubgAirdropTimer` with `visibilitychange` resync | `usePubgAirdropTimer.test.jsx`, `02-zero-drift-after-freeze.png` |
| Drop phases `WARMUP` / `AIRDROP_LIVE` / `LOOTED_OUT` / `EXPIRED` | `arenaData.test.js`, `CrateCard.test.jsx` |
| Prices with `Intl.NumberFormat('vi-VN')` | `arenaData.test.js` (`1.250.000 ₫`) |
| In-flight `claimId` lock (no double claim) | `useOptimisticClaim.test.jsx` |
| Optimistic decrement, 409 rollback | `useOptimisticClaim.test.jsx`, `03-…`, `04-…`, `05-409-conflict-rollback.png` |
| Idempotent, abortable claim API | `mockClaimServer.test.js` |
| Leaderboard: WWCD / placement / kill sort, search keeps rank | `leaderboard.test.js`, `SquadLeaderboard.test.jsx`, `06-…`, `07-…` |
| Virtualized, filterable kill feed | `killFeed.test.js`, `KillFeed.test.jsx`, `08-kill-feed-virtualized-filtered.png` |
| WCAG 2.2 AA, 375 px | `KraftonPubgVnArena.a11y.test.jsx`, `09-mobile-375px.png`, `10-lighthouse-accessibility.png` |

**Automated result:** 209/209 tests passed, ESLint passed, production build passed.

### Evidence (`evidence/hw3-pubg-arena/`)

| Screenshot | What it shows |
|---|---|
| `01-desktop-overview.png` | Airdrops, leaderboard and kill feed |
| `02-zero-drift-after-freeze.png` | Timers frozen 20 s, countdown `01:30` → `01:09` right after resume |
| `03-optimistic-claim-pending.png` | Stock 5 → 4 immediately, button "Claiming…" |
| `04-claim-confirmed.png` | Server confirmed: "Claimed PVS Finals VIP Pass + 5,000 G-Coin!" |
| `05-409-conflict-rollback.png` | Rivals looted the server stock; optimistic 4 → 3, then 409: "Looted out", stock 0, "Your claim was rolled back." |
| `06-leaderboard-sorted-by-kills.png` | Sorted by kill points, sorted column marked with ▼ and `aria-sort` |
| `07-leaderboard-search-keeps-rank.png` | Search "roy": 1 of 4 squads, still rank #3 |
| `08-kill-feed-virtualized-filtered.png` | AGG + headshots: 74 of 500 kills, only 12 rows in the DOM, first rendered row #24 of 74 |
| `09-mobile-375px.png` | 375 px viewport, page width 375 px |
| `10-lighthouse-accessibility.png` | Lighthouse 13.5.0 Accessibility 100 (snapshot mode after opening HW3, no failed audits) |

---

# Bonus – Situationship Analyzer ("Hẹn Hò Nhưng Không Yêu")

## 10. Identified Issues and Corrective Actions

### Issue 14 – Floating-Point Drift in Effort Scores

**Category:** Correctness / Derived State

**Found while writing:** `3f7e7d2`

**Problem:**

"Em cố trăm lần" is 100 separate signals of weight 0.1. Adding them one by one in JavaScript gives `9.99999999999998`, not `10` (verified with Node). A red-flag rule that compares scores could flip at exact thresholds because of this error.

**Corrective Action:**

Each signal's impact and every total are rounded to two decimals (`Math.round(value * 100) / 100`).

**Verification:**

Test `"Em cố trăm lần" (100 x 0.1) is less than "ai đó một phần" (1 x 50)` uses 100 separate one-step signals and expects exactly `emScore: 10`.

**Lesson Learned:**

Never compare sums of decimal fractions without rounding. Test with many small inputs, not one large one.

---

### Issue 15 – Reference Ghosting Effect Ignored "Sending a Message"

**Category:** Requirements Compliance / Effects

**Found while writing:** `b722178`

**Problem:**

The spec says *"Sending a message starts a 5s reply timer"*. The reference component instead runs:

```js
useEffect(() => {
  if (phase !== 'DATING_NO_LOVE') return undefined;
  const timerId = window.setTimeout(() => setPhase('GHOSTED_EXIT'), 5000);
  return () => window.clearTimeout(timerId);
}, [phase, myTries]);
```

The user is ghosted 5 s after the page opens even if no message was ever sent, and the 5 s window restarts on every effort change (`myTries`). It also has no reply promise to abort.

**How it was detected:**

Comparing the reference code against the written requirement before reusing it.

**Corrective Action:**

`useGhostingTimer` runs only while a message is pending. One `AbortController` per message cancels both the partner's reply promise and the timeout. Leaving `DATING_NO_LOVE`, pressing "Dừng lại", sending a new message or unmounting aborts everything. Callbacks are read from a ref, so re-renders do not restart the window.

**Verification:**

- Tests: `does nothing without a pending message`, `a new message restarts the 5 s window`, `does not restart the timer when only the callbacks change`, `"Dừng lại" (message cleared) aborts the wait and the timeout`.
- Real browser with a timer counter: pending timers `1 → 0` after "Dừng lại". Evidence: `evidence/bonus-situationship/06-dung-lai-cleanup.png`.

**Lesson Learned:**

Reference code can contradict its own specification. Check the effect's trigger and dependencies against what the user actually does.

---

### Issue 16 – Two Unnamed Live Regions

**Category:** Accessibility / Testing

**Found in:** `d7188fb` (fixed before commit)

**Problem:**

The red-flag verdict and the chat status were both `<output>` elements. `<output>` has the implicit role `status`, so the page had two unnamed status regions. Screen reader users could not tell which one was speaking, and the test `getByRole('status')` failed with "Found multiple elements".

**Corrective Action:**

Each live region has its own accessible name: `aria-label="Cảnh báo red-flag"` and `aria-label="Trạng thái tin nhắn"`. Tests query them by name.

**Verification:**

`SituationshipAnalyzer.test.jsx` (11 tests) and axe-core (0 violations, including best practices).

**Lesson Learned:**

When a page has more than one live region, name each one.

---

Note: the contract lists two different weight pairs (`0.05 / 100` in the `EffortSignal` comment, `0.1 / 50` in the reference component). The implementation follows the reference component (`0.1 / 50`).

## 11. Bonus Verification Summary

| Requirement | Evidence |
|---|---|
| FSM instead of boolean soup (4 phases, transition table) | `relationshipMachine.test.js`, `06-dung-lai-cleanup.png` (only legal next step offered) |
| Immutable effort log `[...prev, signal]` with `crypto.randomUUID()` | `effortSignals.test.js` |
| Pure derived scores and red flag (no `useEffect`) | `effortSignals.test.js`, `02-red-flag-derived.png`, `03-balanced-effort-stable.png` |
| 5 s "seen không rep" timer, AbortController cleanup | `useGhostingTimer.test.jsx`, `04-…`, `05-…`, `06-…` |
| `useId()` labels, `<output role="status" aria-live="polite">` | `SituationshipAnalyzer.test.jsx`, `SituationshipPage.test.jsx` (axe) |
| 375 px, Lighthouse | `07-mobile-375px.png`, `08-lighthouse-accessibility.png` |

**Automated result:** 246/246 tests passed, ESLint passed, production build passed.

### Evidence (`evidence/bonus-situationship/`)

The mock partner uses `Math.random`; the capture fixed it to `0.99` (never replies) or `0` (replies after 2 s) so the screenshots are reproducible.

| Screenshot | What it shows |
|---|---|
| `01-desktop-overview.png` | Analyzer in `DATING_NO_LOVE` |
| `02-red-flag-derived.png` | 100 tries × 0.1 = 10 vs 1 part × 50 = 50: "[RED-FLAG] Hẹn hò nhưng không yêu …" |
| `03-balanced-effort-stable.png` | Em 1000 × 0.1 = 100 > 50: "[OK] Stable" |
| `04-seen-no-reply-timeout.png` | No reply for 5 s: phase "Đã dừng lại", pending timers 0 |
| `05-reply-in-time.png` | Reply after 2 s: phase unchanged, timeout cancelled, pending timers 0 |
| `06-dung-lai-cleanup.png` | "Dừng lại" while waiting: pending timers 1 → 0, only "Làm lại từ đầu" offered |
| `07-mobile-375px.png` | 375 px viewport, page width 375 px |
| `08-lighthouse-accessibility.png` | Lighthouse 13.5.0 Accessibility 100 (snapshot mode, no failed audits) |
