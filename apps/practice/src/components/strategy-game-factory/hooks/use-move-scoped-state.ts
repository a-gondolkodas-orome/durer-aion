import { useState } from 'react';

/**
 * State that lives for exactly one move.
 *
 * The value is stamped with the `moveCount` at which it was set, and is
 * exposed only while that stamp still matches. Any move bumps `moveCount`, so
 * a value set under the previous one is gone on the very next render — no
 * effect, no reset call, and no frame in which a stale selection is painted
 * over an advanced board.
 *
 * This is the alternative to `useEffect(() => setX(initial), [ctx.moveCount])`,
 * which repairs the state one render too late and has to be remembered on
 * every component that keeps mid-turn UI state.
 *
 * Pass `ctx.moveCount` from a BoardClient, or a `moveCount` prop when the
 * state lives inside a repeated child component.
 *
 * `initial` is returned whenever the stamp is stale, so it must be a stable
 * reference — hoist a non-primitive to module scope rather than writing `[]`
 * or `{}` inline, which would hand out a fresh object on every such render.
 *
 * For mid-turn state the *engine* has to see — anything
 * `getPlayerStepDescription` reads — use `ctx.turnState` and `setTurnState`
 * instead. This hook is local to the component.
 */
export function useMoveScopedState<T>(moveCount: number, initial: T) {
  const [stamped, setStamped] = useState<{ value: T; moveCount: number } | null>(null);

  const value = stamped?.moveCount === moveCount ? stamped.value : initial;

  // The updater form reads through the stamp rather than the raw state, so a
  // toggle written as `set(prev => ...)` sees `initial` after a move rather
  // than the value that move invalidated. Deriving it inside setStamped (not
  // from `value` above) also keeps two set calls in one handler correct.
  const set = (next: T | ((prev: T) => T)) =>
    setStamped(stale => {
      const current = stale?.moveCount === moveCount ? stale.value : initial;
      const resolved = typeof next === 'function' ? (next as (prev: T) => T)(current) : next;
      return { value: resolved, moveCount };
    });

  const reset = () => setStamped(null);

  return [value, set, reset] as const;
}
