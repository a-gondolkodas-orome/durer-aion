import { useEffect, useEffectEvent } from 'react';
import { LATE_ANSWER_GRACE_MS } from 'game';

/** How often the poll is sent again until the game reports its end. A game
 *  judged on a server whose clock runs behind the board's ends a little later
 *  than the board expects. */
export const END_POLL_RETRY_MS = 5 * 1000;

/**
 * Polls a relay's clock once its time and the grace for late answers are up,
 * and again until the game reports its end.
 *
 * The game ends a match whose time ran out only on a move that arrives past
 * that grace, and a team waiting at the buzzer sends none: so a match left to
 * run out never ended, and the offline apps, which keep the score its end
 * report carries, recorded 0 (#613).
 */
export function useEndOnTime(end: string, gameover: unknown, poll: () => void) {
  // The timer outlives the render it started in, and only the latest callback
  // sees the board as it is now — InProgressRelay's, for one, whether the judge
  // has the turn.
  const pollLatest = useEffectEvent(poll);
  useEffect(() => {
    if (gameover) {
      return;
    }
    let handle: ReturnType<typeof setTimeout>;
    const tick = () => {
      pollLatest();
      handle = setTimeout(tick, END_POLL_RETRY_MS);
    };
    // A second past the grace, which the game compares strictly.
    const pastGrace = new Date(end).getTime() + LATE_ANSWER_GRACE_MS + 1000;
    handle = setTimeout(tick, Math.max(0, pastGrace - Date.now()));
    return () => {
      clearTimeout(handle);
    };
  }, [end, gameover]);
}
