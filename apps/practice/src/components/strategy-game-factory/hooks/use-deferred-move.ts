import { useEffect, useRef } from 'react';
import { stepDelay } from '../engine/timing';

// A few games submit a two-part turn from one click — discard a pile, then
// split another — and play the second move a beat later so the board reads as
// two actions rather than one jump.
//
// Scheduling that beat by hand leaks: the callback closes over the board the
// first move produced, so a restart, a variant switch or an undo inside the
// window fires the second move into a position that is no longer on the board.
// Here it is cancelled on all of those — they rewind moveCount — and on
// unmount, the same discipline the engine keeps for its own bot pacing.
export const useDeferredMove = (moveCount: number) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduledAfterRef = useRef<number | null>(null);

  const cancel = () => {
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    scheduledAfterRef.current = null;
  };

  // The pending move is the only thing that should advance the count from here,
  // so anything that does not advance it has replaced the position instead.
  useEffect(() => {
    if (scheduledAfterRef.current !== null && moveCount <= scheduledAfterRef.current) cancel();
  }, [moveCount]);

  useEffect(() => cancel, []);

  return (playSecondMove: () => void) => {
    cancel();
    scheduledAfterRef.current = moveCount;
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      scheduledAfterRef.current = null;
      playSecondMove();
    }, stepDelay());
  };
};
