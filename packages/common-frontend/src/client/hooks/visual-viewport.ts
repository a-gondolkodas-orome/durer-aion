import { useEffect } from "react";

/// How far the visible part of the page sits below the top of the layout
/// viewport, as a CSS length: what a `fixed` or `sticky` element adds to its
/// `top` to stay in sight.
///
/// The two differ whenever the browser pans the screen instead of the page: an
/// open on-screen keyboard (mobile Chrome and iOS Safari both pan to the
/// focused input) or a pinch zoom. `top: 0` then sits above what the team
/// sees, and the relay answer input keeps focus after an answer is sent, so a
/// phone is in that state exactly when the verdict arrives (#530).
export const VISUAL_VIEWPORT_TOP = 'var(--visual-viewport-top, 0px)';

/// Keeps `--visual-viewport-top` on the document root up to date. Mounted once,
/// by `Layout`.
export function useVisualViewportTop() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }
    const root = document.documentElement;
    // iOS reports a negative offset while bouncing past the top.
    const update = () => root.style.setProperty('--visual-viewport-top', `${Math.max(0, viewport.offsetTop)}px`);
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      root.style.removeProperty('--visual-viewport-top');
    };
  }, []);
}
