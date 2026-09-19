// @vitest-environment jsdom
import React from 'react';
import { test, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { BoardProps } from 'boardgame.io/react';
import { MyBoard } from './board';
import type { MyGameState } from './game';

/// Pins that a cell reacts only to a move the rules accept (issue #4): the
/// wrapper around the board settles whose turn it is, this board which of its
/// cells are still a legal move.

const removeNumber = vi.fn();

beforeEach(() => {
  removeNumber.mockClear();
});

// Numbers 1..8 on the table but 3, after a 2 was taken: 4, 6 and 8 are its
// multiples, 1 its divisor; 5 and 7 are neither.
const renderBoard = () => {
  const G: MyGameState = {
    numbersOnTable: [true, false, false, true, true, true, true, true],
    previousMove: 2,
  };
  // The board reads only `G` and `moves`.
  const props = { G, moves: { removeNumber } } as unknown as BoardProps<MyGameState>;
  return render(<MyBoard {...props} />);
};

test('a legal cell sends the move', () => {
  const { getByText } = renderBoard();
  fireEvent.click(getByText('4'));
  expect(removeNumber).toHaveBeenCalledWith(4);
  expect(getByText('4')).toHaveStyle({ cursor: 'pointer' });
});

test('a number already taken is inert', () => {
  const { getByText } = renderBoard();
  fireEvent.click(getByText('3'));
  expect(removeNumber).not.toHaveBeenCalled();
  expect(getByText('3')).toHaveStyle({ pointerEvents: 'none' });
});

test('a number neither dividing nor divisible by the last move is inert', () => {
  const { getByText } = renderBoard();
  fireEvent.click(getByText('5'));
  expect(removeNumber).not.toHaveBeenCalled();
  expect(getByText('5')).toHaveStyle({ cursor: 'default' });
});
