
import { useEffect, useRef, useState } from 'react';

// Elements where keyboard shortcuts must be disabled.
const IGNORED_TAGS = new Set([
  'INPUT',
  'TEXTAREA',
  'SELECT',
]);

// Check whether the user is typing or editing content.
function isTypingTarget(target) {
  if (!(target instanceof Element)) {
    return false;
  }

  return (
    IGNORED_TAGS.has(target.tagName) ||
    target.isContentEditable ||
    Boolean(target.closest('[contenteditable="true"]'))
  );
}

export function useDrumKeyboard(
  padMap,
  onTriggerPad,
  onReleasePad,
  isEnabled = true,
) {
  // 1. Track currently pressed physical keys.
  const pressedCodesRef = useRef(new Map());

  // 2. Track active pad IDs for React UI.
  const [pressedPadIds, setPressedPadIds] = useState(
    () => new Set(),
  );

  useEffect(() => {
    if (!isEnabled) {
      return undefined;
    }

    // Keep a stable reference for this effect's lifecycle.
    const pressedCodes = pressedCodesRef.current;

    // 3. Handle physical keydown events.
    const handleKeyDown = (event) => {
      if (event.repeat) {
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      const pad = padMap.get(event.code);

      if (!pad) {
        return;
      }

      event.preventDefault();

      if (pressedCodes.has(event.code)) {
        return;
      }

      pressedCodes.set(event.code, pad.id);

      setPressedPadIds((previous) => {
        const next = new Set(previous);
        next.add(pad.id);
        return next;
      });

      onTriggerPad?.(pad.id);
    };

    // 4. Handle physical keyup events.
    const handleKeyUp = (event) => {
      const padId = pressedCodes.get(event.code);

      if (!padId) {
        return;
      }

      pressedCodes.delete(event.code);

      setPressedPadIds((previous) => {
        const next = new Set(previous);
        next.delete(padId);
        return next;
      });

      onReleasePad?.(padId);
    };

    // 5. Release all keys when browser window loses focus.
    const handleWindowBlur = () => {
      const releasedPadIds = [...pressedCodes.values()];

      pressedCodes.clear();
      setPressedPadIds(new Set());

      releasedPadIds.forEach((padId) => {
        onReleasePad?.(padId);
      });
    };

    // 6. Register global keyboard listeners.
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    // 7. Cleanup listeners and internal tracking.
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);

      pressedCodes.clear();
    };
  }, [
    padMap,
    isEnabled,
    onTriggerPad,
    onReleasePad,
  ]);

  // 8. Expose currently pressed pads to React components.
  return {
    pressedPadIds,
  };
}
