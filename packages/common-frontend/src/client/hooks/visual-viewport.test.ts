// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useVisualViewportBox } from './visual-viewport';

// #530: with a phone keyboard open, the screen shows only part of the page,
// panned down to the focused input. The snackbar box must follow that part.

// Round numbers rather than a real phone's: only how they relate matters.
const SCREEN = { width: 400, height: 800 };
const KEYBOARD_HEIGHT = 300;
const PAN_TO_INPUT = 500;

class FakeVisualViewport extends EventTarget {
  offsetLeft = 0;
  offsetTop = 0;
  width = SCREEN.width;
  height = SCREEN.height;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderBox() {
  const viewport = new FakeVisualViewport();
  vi.stubGlobal('visualViewport', viewport);
  const box = document.createElement('div');
  const { result, unmount } = renderHook(() => useVisualViewportBox<HTMLElement>());
  act(() => result.current[1](box));
  return { viewport, box, unmount };
}

// Browsers report the keyboard opening as a resize, and the pan as a scroll.
function openKeyboard(viewport: FakeVisualViewport) {
  viewport.height = SCREEN.height - KEYBOARD_HEIGHT;
  viewport.dispatchEvent(new Event('resize'));
}

function panToInput(viewport: FakeVisualViewport) {
  viewport.offsetTop = PAN_TO_INPUT;
  viewport.dispatchEvent(new Event('scroll'));
}

function placement(box: HTMLElement) {
  const [left, top] = box.style.transform.match(/\d+/g)?.map(Number) ?? [];
  return { left, top, width: parseFloat(box.style.width), height: parseFloat(box.style.height) };
}

test('without a keyboard, the box covers the screen', () => {
  const { box } = renderBox();
  expect(placement(box)).toEqual({ left: 0, top: 0, ...SCREEN });
});

test('with the keyboard open, the box covers the part of the page on screen above it', () => {
  const { viewport, box } = renderBox();
  openKeyboard(viewport);
  expect(placement(box).height).toBe(SCREEN.height - KEYBOARD_HEIGHT);
  panToInput(viewport);
  expect(placement(box)).toEqual({
    left: 0, top: PAN_TO_INPUT, width: SCREEN.width, height: SCREEN.height - KEYBOARD_HEIGHT,
  });
});

test('the box stops following the screen once unmounted', () => {
  const { viewport, box, unmount } = renderBox();
  unmount();
  panToInput(viewport);
  expect(placement(box).top).toBe(0);
});
