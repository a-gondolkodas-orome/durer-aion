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
 */
export function useHoverPreview<T>(moveCount: number) {
  const [hovered, setHovered] = useState<{ value: T; moveCount: number } | null>(null);

  const value = hovered?.moveCount === moveCount ? hovered.value : null;

  const hoverProps = (v: T) => {
    const set = () => setHovered({ value: v, moveCount });
    const clear = () => setHovered(null);
    return {
      onPointerEnter: set,
      onPointerMove: set,
      onPointerLeave: clear,
      onFocus: set,
      onBlur: clear
    };
  };

  return { value, hoverProps };
}
