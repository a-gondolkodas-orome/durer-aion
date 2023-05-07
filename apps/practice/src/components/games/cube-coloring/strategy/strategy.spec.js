'use strict';

import { isNull } from "lodash-es";
import { getGameStateAfterAiMove, getGameStateAfterMove, isAllowedStep } from "./strategy";

describe('game end', () => {
  it('should declare game end and first as winner if all nodes are colored', () => {
    const board = ['red', 'blue', 'red', 'blue', 'green', 'red', 'green', 'red'];
    const res = getGameStateAfterMove(board);
    expect(res.isGameEnd).toBe(true);
    expect(res.hasFirstPlayerWon).toBe(true);
  });

  it('should declare game end and 2nd as winner if no remaining nodes are colorable', () => {
    const board = ['blue', 'red', 'blue', 'green', null, 'green', null, 'red'];
    const res = getGameStateAfterMove(board);
    expect(res.isGameEnd).toBe(true);
    expect(res.hasFirstPlayerWon).toBe(false);
  });

  it('should not declare game end until there are colorable nodes even if end is already determined', () => {
    const board = ['blue', 'red', null, 'green', null, 'green', null, 'red'];
    const res = getGameStateAfterMove(board);
    expect(res.isGameEnd).toBe(false);
  });
});

describe('allowed moves', () => {
  it('should not allow coloring an already colored node', () => {
    const board = Array(8).fill(null);
    board[4] = 'blue';
    expect(isAllowedStep(board, 4, 'blue')).toBe(false);
    expect(isAllowedStep(board, 3, 'blue')).toBe(true);
  });

  it('should not allow coloring a node which has neighbors in all colors', () => {
    const board = ['blue', 'red', null, 'green', null, 'green', null, 'red'];
    expect(isAllowedStep(board, 4, 'red')).toBe(false);
  });

  it('should not allow coloring a node with a color already used on neighbors but allow other color', () => {
    const board = ['blue', 'red', null, 'green', null, 'green', null, 'red'];
    expect(isAllowedStep(board, 2, 'red')).toBe(false);
    expect(isAllowedStep(board, 2, 'blue')).toBe(true);
  });
});

describe('cube coloring strategy', () => {
  it('should start with a piece on the main diagonal', () => {
    const board = Array(8).fill(null);
    const res = getGameStateAfterAiMove(board, false).board;
    expect(!isNull(res[2]) || !isNull(res[4])).toBe(true);
  });

  it('should place second piece on other end of diagonal if still empty', () => {
    const board = ['blue', null, 'red', null, null, null, null, null];
    const res = getGameStateAfterAiMove(board, false).board;
    expect(res[4]).toEqual('green');
  });

  it('should make a vertex uncolorable if possible as second', () => {
    const board = [null, null, 'blue', null, null, null, 'green', 'red'];
    const res = getGameStateAfterAiMove(board, true).board;
    expect(res[0]).toEqual('green');
  });

  it('should color opposing vertex with same color as second step', () => {
    const board = [null, 'red', null, null, null, null, null, null];
    const res = getGameStateAfterAiMove(board, true).board;
    expect(res[7]).toEqual('red');
  });
});
