# LAB 03 - TASK DECOMPOSITION

## 1. Project Objective

Modernize legacy React applications using React 19,
modern JavaScript, accessibility engineering,
performance optimization and asynchronous systems.

## 2. Project Work Breakdown Structure

### Phase 1 - Project Foundation

| ID | Task | Deliverable |
|---|---|---|
| P1.1 | Initialize React 19 + Vite | Working project |
| P1.2 | Configure ESLint | Lint configuration |
| P1.3 | Define project architecture | Folder structure |
| P1.4 | Define engineering rules | project-rules.md |
| P1.5 | Define task decomposition | This document |
| P1.6 | Create AI audit template | AI_FAILURE_AUDIT.md |

### Phase 2 - HW1: Production Studio Drum Kit

| ID | Task | Deliverable |
|---|---|---|
| H1.1 | Define drum pad configuration | drumPads.js |
| H1.2 | Implement audio engine | DrumAudioEngine.js |
| H1.3 | Implement keyboard hook | useDrumKeyboard.js |
| H1.4 | Implement drum pad component | DrumPad.jsx |
| H1.5 | Implement pad grid | DrumPadGrid.jsx |
| H1.6 | Implement hit history | HitLog.jsx |
| H1.7 | Implement decibel meter | DecibelMeter.jsx |
| H1.8 | Implement studio interface | DrumMachine.jsx |
| H1.9 | Implement responsive styles | DrumMachine.module.css |
| H1.10 | Verify WCAG 2.2 AA | Accessibility tests |
| H1.11 | Verify functional behavior | Test evidence |
| H1.12 | Complete AI audit | AI_FAILURE_AUDIT.md |

### Phase 3 - HW2: 88-Key Polyphonic Piano

- Algorithmic MIDI generation.
- White and black key classification.
- Polyphonic Audio Engine.
- FIFO voice stealing.
- ADSR envelope.
- FIFO recording and replay.
- AbortController cancellation.
- React.memo render isolation.
- React DevTools Profiler verification.

### Phase 4 - HW3: KRAFTON PUBG Vietnam Arena

- Anti-drift timer hook.
- Visibility change synchronization.
- Optimistic inventory claim.
- HTTP 409 rollback.
- Vietnamese squad leaderboard.
- Kill-feed filtering.
- Responsive interface.
- AI failure verification.

### Phase 5 - Bonus: Situationship Analyzer

- Finite State Machine.
- Immutable effort signals.
- Pure derived state.
- Ghosting timer.
- Abortable asynchronous operations.
- Accessible red-flag announcements.

### Phase 6 - Final Quality Assurance

- ESLint validation.
- Responsive testing at 375px.
- Lighthouse accessibility audit.
- Keyboard navigation audit.
- React DevTools Profiler.
- Git history review.
- Live refactoring defense.

## 3a. HW1 Git Commit Mapping

| Commit | Task |
|---|---|
| 01 | Project initialization |
| 02 | Engineering documentation |
| 03 | Drum pad configuration |
| 04 | Audio engine |
| 05 | Keyboard hook |
| 06 | Interactive drum pads |
| 07 | Accessibility and hit log |
| 08 | Decibel meter |
| 09 | Responsive UI |
| 10 | Testing and bug fixes |
| 11 | AI failure audit |
| 12 | Post-review WCAG fixes (heading contrast, label in name) |

## 3b. HW2 Git Commit Mapping

| Commit | Task |
|---|---|
| 01 | Scaffold Grand Piano module |
| 02 | MIDI note utilities |
| 03 | Algorithmic 88-key generation |
| 04 | Polyphonic audio engine, ADSR, FIFO voice stealing |
| 05 | Align voice pool with course contract (Map by midi, 40 ms fade) |
| 06 | Memoized accessible PianoKey |
| 07 | 88-key keyboard layout with roving focus |
| 08 | Piano page, stable callbacks, computer keyboard input |
| 09 | FIFO performance recorder |
| 10 | AudioTaskQueue and abortable variable-speed replay |
| 11 | Record / Play / Stop Sequence controls |
| 12 | WCAG 2.2 AA fixes (focus contrast, target size, page title) |
| 13 | React.memo render isolation tests |
| 14 | HW2 documentation and AI failure audit |


## 3c. HW3 Git Commit Mapping

| Commit | Task |
|---|---|
| 01 | Scaffold KRAFTON x PUBG Vietnam Arena module |
| 02 | Domain data, drop phases, VND formatter |
| 03 | Zero-drift airdrop timer with visibility resync |
| 04 | Mock claim server (409 Conflict, idempotent, abortable) |
| 05 | Optimistic claim hook (in-flight lock, 409 rollback) |
| 06 | Crate card with derived drop phase |
| 07 | Pure leaderboard ranking (sort, search, WWCD filter) |
| 08 | Accessible squad leaderboard UI |
| 09 | Virtualized, filterable kill feed |
| 10 | Arena page and homework navigation |
| 11 | WCAG fixes (heading line-height) and axe audit |
| 12 | HW3 evidence and AI failure audit |

## 3d. Bonus Git Commit Mapping

| Commit | Task |
|---|---|
| 01 | Scaffold Situationship Analyzer |
| 02 | `feat(fsm): model HenHoKhongYeu state machine` |
| 03 | Immutable effort signals and derived red-flag scoring |
| 04 | Abortable "seen, no reply" ghosting timer |
| 05 | `feat(ui): add derived red-flag meter & ghosting cleanup` |
| 06 | Navigation entry and axe audit |
| 07 | Bonus evidence and AI failure audit |

## 4. Definition of Done

A task is complete only when:

- Implementation is functional.
- Relevant edge cases are tested.
- Accessibility requirements are checked.
- ESLint reports no relevant errors.
- Changes are committed atomically.
- Documentation is updated where necessary.