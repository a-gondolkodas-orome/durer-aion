import { useEffect } from 'react';

/// Keeps `element`, a `position: fixed` box at the top left, sized and
/// translated to the visual viewport: the part of the page on screen, which an
/// open on-screen keyboard or a pinch zoom pans within the layout viewport. The
/// transform makes the box the containing block of its `fixed` descendants, so
/// they position against what is on screen.
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
