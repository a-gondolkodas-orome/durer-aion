import { useEffect, useEffectEvent } from 'react';
import { LATE_ANSWER_GRACE_MS } from 'game';

/**
 * Polls a relay's clock once, when its time and the grace for late answers are
 * up, while `active`.
 *
 * The game ends a match whose time ran out only on a move that arrives past
 * that grace, and a team waiting at the buzzer sends none: so a match left to
 * run out never ended, and the local apps, which keep the score its end report
 * carries, recorded 0 (#613). One poll is enough there: the clock the game
 * judges by is the board's own, and a poll skipped while the judge has the turn
 * is made up for by the judge's ruling, which ends a game past its end.
 */
export function useEndOnTime(end: string, active: boolean, poll: () => void) {
  // The timer outlives the render it started in, and only the latest callback
  // sees the board as it is now — InProgressRelay's, for one, whether the judge
  // has the turn.
  const pollLatest = useEffectEvent(poll);
  useEffect(() => {
    if (!active) {
      return;
    }
    // A second past the grace, which the game compares strictly.
    const pastGrace = new Date(end).getTime() + LATE_ANSWER_GRACE_MS + 1000;
    const handle = setTimeout(() => {
      pollLatest();
    }, Math.max(0, pastGrace - Date.now()));
    return () => {
      clearTimeout(handle);
    };
  }, [end, active]);
}
