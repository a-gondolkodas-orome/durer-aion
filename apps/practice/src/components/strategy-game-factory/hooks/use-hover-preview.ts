import { useMoveScopedState } from './use-move-scoped-state';

/**
 * Move-scoped hover state for board previews: `useMoveScopedState` plus the
 * pointer/focus plumbing, so any move invalidates the preview on the next
 * render — which is what stops one from "sticking" after a move on touch
 * devices, where no `pointerleave` fires.
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
 * express — a touch two-tap where the first tap sets the preview, or handlers
 * filtering by `pointerType`. Values set that way carry the same stamp.
 */
export function useHoverPreview<T>(moveCount: number) {
  const [value, setHovered, clear] = useMoveScopedState<T | null>(moveCount, null);

  const set = (v: T) => setHovered(v);

  const hoverProps = (v: T) => ({
    onPointerEnter: () => set(v),
    onPointerMove: () => set(v),
    onPointerLeave: clear,
    onFocus: () => set(v),
    onBlur: clear
  });

  return { value, hoverProps, set, clear };
}
