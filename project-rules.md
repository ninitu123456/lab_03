# LAB 03 - PROJECT ENGINEERING RULES

## 1. Technology Stack

- React 19
- React DOM 19
- Vite
- JavaScript ES6+
- CSS Modules
- Web Audio API
- ESLint

## 2. React Standards

- Functional Components only.
- Use React Hooks correctly.
- No Class Components.
- No ReactDOM.render().
- Use createRoot() from react-dom/client.
- No defaultProps.
- Use React.memo when render isolation is required.
- Never mutate React state directly.
- Avoid redundant derived state.
- Every useEffect must have correct cleanup when needed.

## 3. JavaScript Standards

- Use const by default.
- Use let only when reassignment is necessary.
- Prefer immutable state updates.
- Use descriptive variable and function names.
- Avoid unnecessary dependencies.
- Handle asynchronous errors.

## 4. Accessibility

- Target WCAG 2.2 AA.
- Use semantic HTML.
- Every form control must have an accessible label.
- Use useId() for form label associations.
- All interactive elements must support keyboard navigation.
- Visible focus indicators are mandatory.
- Maintain sufficient color contrast.
- Use aria-live for dynamic announcements.
- Use aria-pressed for toggle buttons.

## 5. Performance

- Avoid unnecessary re-renders.
- Use React.memo where justified.
- Clean up event listeners.
- Clean up timers.
- Release audio resources when appropriate.
- Avoid memory leaks.
- Optimize for mobile screens starting at 375px.

## 6. Security

- Never use eval().
- Never use dangerouslySetInnerHTML.
- Never trust unvalidated external input.
- Handle API errors explicitly.
- Never expose secrets in source code.

## 7. Git Standards

- Every commit must represent one logical change.
- Use conventional commit messages.
- Do not combine unrelated features in one commit.
- Test changes before committing.
- Keep documentation synchronized with implementation.

## 8. AI Collaboration Rules

- AI-generated code must be reviewed.
- Never accept code without understanding it.
- Verify claims using browser DevTools.
- Record actual AI-generated bugs in AI_FAILURE_AUDIT.md.
- Never fabricate test results or evidence.
- Explain important implementation decisions.