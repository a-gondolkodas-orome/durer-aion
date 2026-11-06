// @vitest-environment jsdom
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { BoardProps } from 'boardgame.io/react';
import { GUESSER_PLAYER, JUDGE_PLAYER } from '../../../common/types';
import type { GameStateMixin } from '../../../common/types';
import { MyBoard } from './board';
import type { MyGameState } from './game';

/// A finished game in category E: the second player, X, filled the top row.
function renderFinished(firstPlayer: typeof GUESSER_PLAYER | typeof JUDGE_PLAYER) {
  const xPlayer = firstPlayer === GUESSER_PLAYER ? JUDGE_PLAYER : GUESSER_PLAYER;
  const cells = Array(25).fill(null);
  for (let i = 0; i < 5; i++) cells[i] = 'X';
  cells[5] = 'O';
  const props = {
    G: { cells, category: 'E', firstPlayer, winner: xPlayer } as unknown as MyGameState & GameStateMixin,
    ctx: { phase: 'startNewGame', turn: 9, currentPlayer: GUESSER_PLAYER },
    moves: {},
    isActive: true,
    playerID: GUESSER_PLAYER,
    matchID: 'm',
    log: [],
  } as unknown as BoardProps<MyGameState & GameStateMixin>;
  render(<MyBoard {...props} />);
}

const firstCellColour = () =>
  getComputedStyle(screen.getByRole('button', { name: /^1\. sor, 1\. oszlop/ })).backgroundColor;

// The theme's own colour is green in the dry run, so the bot's winning line
// used to read as the team's win.
describe('the winning line', () => {
  test('is green when the team made it', () => {
    renderFinished(JUDGE_PLAYER);
    expect(firstCellColour()).toBe('rgb(27, 94, 32)');
  });

  test('is red when the bot made it', () => {
    renderFinished(GUESSER_PLAYER);
    expect(firstCellColour()).toBe('rgb(142, 27, 16)');
  });
});
