import { useEffect, useRef } from 'react';
import type { FocusEvent, KeyboardEvent, RefObject } from 'react';

// A board's keyboard play (#709): the arrow keys move between its buttons and
// Enter presses one, which teams find much faster than the mouse. Browser-only,
// so it stays out of the package's barrel, which the server imports.

export interface BoardKeysOptions {
  /// Whether the team may move now. When it turns true and focus is on
  /// nothing — the bot's turn disabled the button that had it — focus returns
  /// to that button, or the nearest one still enabled.
  active: boolean;
  /// The buttons form a grid this many wide, in reading order: left and right
  /// stay in the row, up and down in the column. Without it they are one line,
  /// and both pairs of arrows step along it.
  columns?: number;
}

export interface BoardKeys<E extends HTMLElement> {
  ref: RefObject<E | null>;
  onKeyDown: (event: KeyboardEvent<E>) => void;
  onFocus: (event: FocusEvent<E>) => void;
}

const STEP = new Map<string, [dx: number, dy: number]>([
  ['ArrowLeft', [-1, 0]], ['ArrowRight', [1, 0]], ['ArrowUp', [0, -1]], ['ArrowDown', [0, 1]],
]);

function buttons(box: HTMLElement): HTMLElement[] {
  return Array.from(box.querySelectorAll<HTMLElement>('button'));
}

// `:disabled` also covers a button the board wrapper's fieldset disables.
const enabled = (button: HTMLElement | undefined) => button !== undefined && !button.matches(':disabled');

/// The next enabled button from `from` in the direction of the arrow, or null
/// at the edge: a skipped disabled button is a taken cell or an empty pile.
export function arrowTarget(count: number, isEnabled: (index: number) => boolean, from: number, key: string, columns?: number): number | null {
  const step = STEP.get(key);
  if (step === undefined) return null;
  const [dx, dy] = step;
  const delta = columns === undefined ? dx + dy : dx + dy * columns;
  const row = (index: number) => columns === undefined ? 0 : Math.floor(index / columns);
  for (let index = from + delta; index >= 0 && index < count; index += delta) {
    if (dx !== 0 && row(index) !== row(from)) return null;
    if (isEnabled(index)) return index;
  }
  return null;
}

/// The enabled button nearest `index`, after it first on a tie. The button
/// at `index` may be gone: a turn's second step is removed with the turn.
export function nearestEnabled(count: number, isEnabled: (index: number) => boolean, from: number): number | null {
  const index = Math.min(from, count - 1);
  for (let distance = 0; distance < count; distance++) {
    if (index + distance < count && isEnabled(index + distance)) return index + distance;
    if (index - distance >= 0 && isEnabled(index - distance)) return index - distance;
  }
  return null;
}

/// Spread the result on the element that holds the board's buttons:
/// `<Box {...useBoardKeys({ active })}>`.
export function useBoardKeys<E extends HTMLElement = HTMLDivElement>({ active, columns }: BoardKeysOptions): BoardKeys<E> {
  const ref = useRef<E>(null);
  const lastFocused = useRef<number | null>(null);

  useEffect(() => {
    const box = ref.current;
    if (!active || box === null) return;
    const focused = document.activeElement;
    const lost = focused === null || focused === document.body || (box.contains(focused) && !enabled(focused as HTMLElement));
    if (!lost) return;
    const all = buttons(box);
    const target = nearestEnabled(all.length, index => enabled(all[index]), lastFocused.current ?? 0);
    if (target !== null) all[target].focus();
  });

  return {
    ref,
    onFocus: event => {
      const index = buttons(event.currentTarget).indexOf(event.target);
      if (index >= 0) lastFocused.current = index;
    },
    onKeyDown: event => {
      if (!STEP.has(event.key) || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const all = buttons(event.currentTarget);
      const from = all.indexOf(event.target as HTMLElement);
      if (from < 0) return;
      // At the board's edge too: the arrow would otherwise scroll the page.
      event.preventDefault();
      const target = arrowTarget(all.length, index => enabled(all[index]), from, event.key, columns);
      if (target !== null) all[target].focus();
    },
  };
}
