import { useCallback, useEffect, useRef, useState } from 'react';

import { isConflictError } from '../api/mockClaimServer';

const updateStock = (drops, dropId, getStock) =>
  drops.map((drop) =>
    drop.id === dropId
      ? Object.freeze({ ...drop, remainingStock: getStock(drop.remainingStock) })
      : drop,
  );

/**
 * Optimistic crate / ticket claims.
 *
 * 1. In-flight lock: one pending claimId per drop, so double clicks
 *    never send a second request.
 * 2. Optimistic update: stock is decremented immediately.
 * 3. Server answer:
 *    - success  -> reconcile with the server's remainingStock
 *    - 409      -> roll back, then show the server truth (looted out)
 *    - other    -> roll back the optimistic decrement
 * 4. Unmount aborts every pending request.
 */
export function useOptimisticClaim(initialDrops, claimDrop) {
  const [drops, setDrops] = useState(initialDrops);
  const [pendingDropIds, setPendingDropIds] = useState(() => new Set());
  const [statusByDrop, setStatusByDrop] = useState({});

  // Synchronous lock: state updates are async, a ref is not.
  const inFlightRef = useRef(new Map()); // dropId -> claimId
  const controllersRef = useRef(new Set());

  const setPending = (dropId, isPending) => {
    setPendingDropIds((previous) => {
      const next = new Set(previous);

      if (isPending) {
        next.add(dropId);
      } else {
        next.delete(dropId);
      }

      return next;
    });
  };

  const setStatus = (dropId, type, message) => {
    setStatusByDrop((previous) => ({ ...previous, [dropId]: { type, message } }));
  };

  const claim = useCallback(
    async (dropId) => {
      const inFlight = inFlightRef.current;

      // 1. Idempotent lock: ignore clicks while this drop is in flight.
      if (inFlight.has(dropId)) {
        return;
      }

      const drop = drops.find((item) => item.id === dropId);

      if (!drop || drop.remainingStock <= 0) {
        return;
      }

      const claimId = crypto.randomUUID();
      const controller = new AbortController();

      inFlight.set(dropId, claimId);
      controllersRef.current.add(controller);
      setPending(dropId, true);

      // 2. Optimistic decrement.
      setDrops((previous) => updateStock(previous, dropId, (stock) => stock - 1));
      setStatus(dropId, 'pending', `Claiming ${drop.title}…`);

      try {
        const response = await claimDrop({ dropId, claimId, signal: controller.signal });

        // 3a. Reconcile with the server's real stock.
        setDrops((previous) => updateStock(previous, dropId, () => response.remainingStock));
        setStatus(dropId, 'success', `Claimed ${drop.title}!`);
      } catch (error) {
        // Unmounted: nothing to update.
        if (controller.signal.aborted) {
          return;
        }

        // 3b. Roll back the optimistic decrement.
        setDrops((previous) => updateStock(previous, dropId, (stock) => stock + 1));

        if (isConflictError(error)) {
          // 409: the server says the drop is empty -> show the truth.
          setDrops((previous) => updateStock(previous, dropId, () => 0));
          setStatus(dropId, 'conflict', `${error.message} Your claim was rolled back.`);
        } else {
          setStatus(dropId, 'error', `Claim failed: ${error.message}`);
        }
      } finally {
        controllersRef.current.delete(controller);

        if (!controller.signal.aborted) {
          inFlight.delete(dropId);
          setPending(dropId, false);
        }
      }
    },
    [drops, claimDrop],
  );

  // 4. Abort pending requests on unmount.
  useEffect(() => {
    const controllers = controllersRef.current;

    return () => {
      for (const controller of controllers) {
        controller.abort(new DOMException('Arena closed.', 'AbortError'));
      }

      controllers.clear();
    };
  }, []);

  return { drops, pendingDropIds, statusByDrop, claim };
}
