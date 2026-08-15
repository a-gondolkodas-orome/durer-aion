import { useState } from 'react';

/**
 * State that lives for exactly one move: the value is stamped with the
 * `moveCount` at which it was set and exposed only while that stamp matches, so
 * any move discards it on the very next render — no effect, no reset call, and
 * no frame in which a stale selection is painted over an advanced board. That
 * last part is why this exists rather than
 * `useEffect(() => setX(initial), [ctx.moveCount])`.
 *
 * Pass `ctx.moveCount` from a BoardClient, or a `moveCount` prop when the state
 * lives inside a repeated child component.
 *
 * Two things to get right:
 * - `initial` is returned on every stale render, so a non-primitive must be one
 *   stable reference — hoist it to module scope, never write `[]` inline.
 * - mid-turn state the *engine* has to see (anything `getPlayerStepDescription`
 *   reads) belongs in `ctx.turnState`; this hook is local to the component.
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
