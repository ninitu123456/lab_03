# Situationship Analyzer – "Hẹn Hò Nhưng Không Yêu" (Bonus)

## 1. Overview

A creative React 19 exercise inspired by the song title "Hẹn Hò Nhưng Không Yêu".
It replaces contradictory boolean flags with a finite state machine, scores
asymmetric effort from an immutable signal log, and cleans up a "seen, no reply"
ghosting timer without leaks.

## 2. Requirements

- **No boolean soup:** `isDating && !isLoved && !hasTitle` is replaced by one
  phase: `FRIENDS` | `DATING_NO_LOVE` | `OFFICIAL_LOVE` | `GHOSTED_EXIT`.
- **Asymmetric effort:** "Em cố trăm lần" (weight 0.1) vs "ai đó một phần"
  (weight 50), computed from an immutable action log as pure derived state.
- **Ghosting timer:** sending a message starts a 5 s reply timer; ignoring it
  or stopping aborts pending promises and clears the timer.
- **Accessibility:** every input labelled with `useId()`, red-flag warnings
  announced with `<output role="status" aria-live="polite">`, 375 px layout.

## 3. Structure

```text
SituationshipAnalyzer/
├── model/                     State machine, effort scoring, mock partner
├── hooks/                     Ghosting reply timer
├── SituationshipAnalyzer.jsx  Analyzer UI
├── SituationshipPage.jsx      Page shown in the app navigation
└── README.md
```

## 4. Usage

| Action | Result |
|---|---|
| **Ghi nỗ lực của em / của ai đó** | Appends an immutable effort signal; scores and the red flag update instantly. |
| **Gửi** a message | Waits 5 s for a reply. No reply → the machine moves to "Đã dừng lại". |
| **Dừng lại** | Leaves the situationship and cancels any pending reply wait. |
| **Xác nhận yêu thật** / **Làm lại từ đầu** | Only the transitions that are legal in the current phase are shown. |

## 5. Verification

```bash
npm run test -- --run
npm run lint
npm run build
```

- Evidence: `evidence/bonus-situationship/` (red flag, timeout, reply, "Dừng lại" cleanup with timer counts, 375 px, Lighthouse 100).
- AI issues: `AI_FAILURE_AUDIT.md`, Issues 14–16.
