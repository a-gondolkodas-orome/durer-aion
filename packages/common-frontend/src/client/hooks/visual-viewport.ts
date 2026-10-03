import { useEffect } from 'react';

/// Keeps `element`, a `position: fixed` box at the top left, covering the
/// visual viewport: the part of the page actually on screen. Its transform
/// makes it the containing block of its own `fixed` descendants, so they
/// position against what the team sees rather than the layout viewport.
///
/// The two differ whenever the browser pans the screen instead of the page: an
/// open on-screen keyboard (mobile Chrome and iOS Safari both pan to the
/// focused input) or a pinch zoom. The relay answer input keeps focus after an
/// answer is sent, so a phone is in that state exactly when the verdict's
/// snackbar arrives (#530). The box follows the pan in both directions, and
/// shrinks to the space above the keyboard; under a zoom, what it holds is
/// zoomed with the page.
///
/// Without `visualViewport` the element is left as it is.
export function useVisualViewportBox(element: HTMLElement | null) {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!element || !viewport) {
      return;
    }
    const update = () => {
      // iOS reports negative offsets while bouncing past an edge.
      const left = Math.max(0, viewport.offsetLeft);
      const top = Math.max(0, viewport.offsetTop);
      element.style.width = `${viewport.width}px`;
      element.style.height = `${viewport.height}px`;
      element.style.transform = `translate(${left}px, ${top}px)`;
    };
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, [element]);
}
