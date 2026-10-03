// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useVisualViewportBox } from './visual-viewport';

class FakeViewport extends EventTarget {
  offsetLeft = 0;
  offsetTop = 0;
  width = 412;
  height = 915;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderAttached(element: HTMLElement) {
  const rendered = renderHook(() => useVisualViewportBox<HTMLElement>());
  act(() => rendered.result.current[1](element));
  return rendered;
}

test('covers the visual viewport as it pans and shrinks', () => {
  const viewport = new FakeViewport();
  vi.stubGlobal('visualViewport', viewport);
  const element = document.createElement('div');
  const { result, unmount } = renderAttached(element);
  expect(result.current[0]).toBe(element);
  expect(element.style.transform).toBe('translate(0px, 0px)');
  expect(element.style.width).toBe('412px');
  expect(element.style.height).toBe('915px');

  Object.assign(viewport, { offsetLeft: 30, offsetTop: 503, height: 400 });
  viewport.dispatchEvent(new Event('scroll'));
  expect(element.style.transform).toBe('translate(30px, 503px)');
  expect(element.style.height).toBe('400px');

  Object.assign(viewport, { width: 300 });
  viewport.dispatchEvent(new Event('resize'));
  expect(element.style.width).toBe('300px');

  unmount();
  viewport.offsetTop = 200;
  viewport.dispatchEvent(new Event('scroll'));
  expect(element.style.transform).toBe('translate(30px, 503px)');
});

test('leaves the element alone without visualViewport', () => {
  vi.stubGlobal('visualViewport', undefined);
  const element = document.createElement('div');
  renderAttached(element);
  expect(element.getAttribute('style')).toBeNull();
});
