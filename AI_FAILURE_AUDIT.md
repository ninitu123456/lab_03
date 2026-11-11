
# AI Failure Audit – Drum Machine

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
| ESLint | PASS |
| Production build | PASS |

**Automated test result:** 8/8 tests passed.

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