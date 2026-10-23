import { useEffect, useState } from 'react';

/// Returns an element and the ref to attach it with. The element, a
/// `position: fixed` box at the top left, is kept sized and translated to the
/// visual viewport: the part of the page on screen, which an open on-screen
/// keyboard or a pinch zoom pans within the layout viewport. The transform
/// makes the box the containing block of its `fixed` descendants, so they
/// position against what is on screen.
///
/// The element is a state rather than a ref's `current`, so a caller rendering
/// into it re-renders once it is mounted. Without `visualViewport` the element
/// is left as it is.
export function useVisualViewportBox<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!element || !viewport) {
      return;
    }
    const update = () => {
      element.style.width = `${viewport.width}px`;
      element.style.height = `${viewport.height}px`;
      element.style.transform = `translate(${viewport.offsetLeft}px, ${viewport.offsetTop}px)`;
    };
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, [element]);
  return [element, setElement] as const;
}
