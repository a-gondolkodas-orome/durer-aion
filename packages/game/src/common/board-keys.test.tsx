// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { arrowTarget, nearestEnabled, useBoardKeys } from './board-keys';

afterEach(cleanup);

const allEnabled = () => true;

describe('arrowTarget', () => {
  test('steps along a line with either pair of arrows, and stops at its ends', () => {
    expect(arrowTarget(3, allEnabled, 0, 'ArrowRight')).toBe(1);
    expect(arrowTarget(3, allEnabled, 1, 'ArrowUp')).toBe(0);
    expect(arrowTarget(3, allEnabled, 2, 'ArrowDown')).toBeNull();
    expect(arrowTarget(3, allEnabled, 0, 'Enter')).toBeNull();
  });

  test('skips a disabled button', () => {
    expect(arrowTarget(3, index => index !== 1, 0, 'ArrowRight')).toBe(2);
    expect(arrowTarget(3, index => index === 0, 0, 'ArrowRight')).toBeNull();
  });

  // A 3 × 3 grid: 0 1 2 / 3 4 5 / 6 7 8.
  test('keeps left and right in the row, up and down in the column, of a grid', () => {
    expect(arrowTarget(9, allEnabled, 2, 'ArrowRight', 3)).toBeNull();
    expect(arrowTarget(9, allEnabled, 3, 'ArrowLeft', 3)).toBeNull();
    expect(arrowTarget(9, allEnabled, 1, 'ArrowDown', 3)).toBe(4);
    expect(arrowTarget(9, index => index !== 4, 1, 'ArrowDown', 3)).toBe(7);
    expect(arrowTarget(9, allEnabled, 1, 'ArrowUp', 3)).toBeNull();
  });
});

test('nearestEnabled looks after the button first, then before it', () => {
  expect(nearestEnabled(5, index => index === 1 || index === 3, 2)).toBe(3);
  expect(nearestEnabled(5, index => index === 1, 4)).toBe(1);
  expect(nearestEnabled(5, () => false, 2)).toBeNull();
  // The take buttons below two piles are gone once the take is made.
  expect(nearestEnabled(2, () => true, 3)).toBe(1);
});

function Board({ active }: { active: boolean }) {
  const keys = useBoardKeys({ active });
  return (
    <div {...keys}>
      {['a', 'b', 'c'].map(name => <button key={name} disabled={!active}>{name}</button>)}
    </div>
  );
}

describe('useBoardKeys', () => {
  test('moves focus with the arrows', () => {
    render(<Board active/>);
    screen.getByText('a').focus();
    fireEvent.keyDown(screen.getByText('a'), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(screen.getByText('b'));
  });

  test("gives focus back to the button that had it once the bot's turn is over", () => {
    const { rerender } = render(<Board active/>);
    screen.getByText('b').focus();
    rerender(<Board active={false}/>);
    // A browser blurs a button as it is disabled; jsdom does not.
    screen.getByText('b').blur();
    rerender(<Board active/>);
    expect(document.activeElement).toBe(screen.getByText('b'));
  });

  test('leaves focus where it is outside the board', () => {
    const { rerender } = render(<><input aria-label="elsewhere"/><Board active={false}/></>);
    screen.getByLabelText('elsewhere').focus();
    rerender(<><input aria-label="elsewhere"/><Board active/></>);
    expect(document.activeElement).toBe(screen.getByLabelText('elsewhere'));
  });
});
