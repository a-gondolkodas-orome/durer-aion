// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVisualViewportTop } from './visual-viewport';

class FakeViewport extends EventTarget {
  offsetTop = 0;
}

const rootTop = () => document.documentElement.style.getPropertyValue('--visual-viewport-top');

afterEach(() => {
  vi.unstubAllGlobals();
});

test('follows the visual viewport down, never above the top, and clears on unmount', () => {
  const viewport = new FakeViewport();
  vi.stubGlobal('visualViewport', viewport);
  const { unmount } = renderHook(() => useVisualViewportTop());
  expect(rootTop()).toBe('0px');

  viewport.offsetTop = 503;
  viewport.dispatchEvent(new Event('scroll'));
  expect(rootTop()).toBe('503px');

  viewport.offsetTop = -12;
  viewport.dispatchEvent(new Event('resize'));
  expect(rootTop()).toBe('0px');

  unmount();
  expect(rootTop()).toBe('');
});
