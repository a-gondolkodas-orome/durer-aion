import { useState } from 'react';

/**
 * Move-scoped hover state for board previews.
 *
 * A hover is stamped with the `moveCount` at which it was set, and the derived
 * `value` is exposed only while that stamp still matches the current
 * `moveCount`. Any move bumps `moveCount`, so a stale hover is invalidated on
 * the very next render — no effect and no explicit reset call. This is what
 * stops a preview from "sticking" after a move on touch devices, where no
 * `pointerleave` fires (the original reason the `moveCount` guard was added).
 *
 * Pass `ctx.moveCount` from a BoardClient, or a `moveCount` prop when the hover
 * lives inside a repeated child component.
 *
 * Spread `hoverProps(value)` onto a hoverable element; don't attach it to one
 * that shouldn't drive a preview (e.g. a currently disabled one). It is safe on
 * a container with focusable children too: React's onFocus/onBlur bubble, so a
 * child's focus previews the container — matching pointer hover.
 *
 * `set`/`clear` are the imperative escape hatch for flows `hoverProps` can't
 * express — e.g. a touch two-tap flow where the first tap (onClick) sets the
 * preview, or handlers that filter by `pointerType`. Values set this way get
 * the same moveCount stamp, so they are invalidated by the next move too.
 */
export function useHoverPreview<T>(moveCount: number) {
  const [hovered, setHovered] = useState<{ value: T; moveCount: number } | null>(null);

  const value = hovered?.moveCount === moveCount ? hovered.value : null;

  const set = (v: T) => setHovered({ value: v, moveCount });
  const clear = () => setHovered(null);

  const hoverProps = (v: T) => ({
    onPointerEnter: () => set(v),
    onPointerMove: () => set(v),
    onPointerLeave: clear,
    onFocus: () => set(v),
    onBlur: clear
  });

  return { value, hoverProps, set, clear };
}
