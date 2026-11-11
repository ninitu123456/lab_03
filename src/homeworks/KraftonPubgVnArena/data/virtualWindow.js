/**
 * Virtual scroller math (evolved from Lab 2 Slide 22).
 *
 * With fixed-height rows, only the rows inside the viewport (+ a small
 * overscan buffer) are rendered, so 500 or 50,000 entries cost the same.
 *
 * @returns {{ startIndex: number, endIndex: number, offsetY: number, totalHeight: number }}
 *          endIndex is exclusive.
 */
export function getVirtualWindow({
  itemCount,
  rowHeight,
  viewportHeight,
  scrollTop,
  overscan = 3,
}) {
  const totalHeight = itemCount * rowHeight;

  // Clamp: the browser can report a stale scrollTop after the list shrinks.
  const maxScrollTop = Math.max(0, totalHeight - viewportHeight);
  const safeScrollTop = Math.min(Math.max(0, scrollTop), maxScrollTop);

  const firstVisible = Math.floor(safeScrollTop / rowHeight);
  const visibleCount = Math.ceil(viewportHeight / rowHeight);

  const startIndex = Math.max(0, firstVisible - overscan);
  const endIndex = Math.min(itemCount, firstVisible + visibleCount + overscan);

  return {
    startIndex,
    endIndex,
    offsetY: startIndex * rowHeight,
    totalHeight,
  };
}
