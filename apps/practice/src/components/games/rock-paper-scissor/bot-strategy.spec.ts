import { smartBotStrategy } from './bot-strategy';
import { moves, type Board } from './gameplay';
import { botNextMoveArgs, makeCtx } from 'test-utils';

const smartBotRemoval = (board: Board, currentPlayer: number): number =>
  botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx({ currentPlayer }) }))[0];

const START: Board = [['rock', 'paper', 'scissor'], ['rock', 'paper', 'scissor']];

const remove = (board: Board, player: number, idx: number) =>
  moves.removeSymbol.apply(board, { ctx: makeCtx({ currentPlayer: player }) }, idx);

const takeableIndices = (board: Board, player: number): number[] =>
  [0, 1, 2].filter(idx => board[1 - player][idx] !== null);

// Winner under optimal play from `board` with `player` to move. Four moves at
// three choices each, so a plain memoised search covers the whole game.
const memo = new Map<string, number>();
const optimalWinner = (board: Board, player: number): number => {
  const key = `${JSON.stringify(board)}|${player}`;
  const cached = memo.get(key);
  if (cached !== undefined) return cached;

  // if no move wins for the mover, the opponent takes it
  let winner = 1 - player;
  for (const idx of takeableIndices(board, player)) {
    const outcome = remove(board, player, idx);
    const result = outcome.gameEnd
      ? outcome.gameEnd.winnerIndex
      : optimalWinner(outcome.nextBoard, 1 - player);
    if (result === player) { winner = player; break; }
  }
  memo.set(key, winner);
  return winner;
};

// Every position reachable from the start, paired with the player to move.
const reachablePositions = (): { board: Board; player: number }[] => {
  const seen = new Map<string, { board: Board; player: number }>();
  const visit = (board: Board, player: number) => {
    const key = `${JSON.stringify(board)}|${player}`;
    if (seen.has(key)) return;
    seen.set(key, { board, player });
    for (const idx of takeableIndices(board, player)) {
      const outcome = remove(board, player, idx);
      if (!outcome.gameEnd) visit(outcome.nextBoard, 1 - player);
    }
  };
  visit(START, 0);
  return [...seen.values()];
};

describe('smartBotStrategy', () => {
  it('as a second player remove useless piece in first step', () => {
    expect(
      smartBotRemoval([['rock', 'paper', 'scissor'], ['rock', null, 'scissor']], 1)
    ).toEqual(0);
    expect(
      smartBotRemoval([['rock', 'paper', 'scissor'], ['rock', 'paper', null]], 1)
    ).toEqual(1);
    expect(
      smartBotRemoval([['rock', 'paper', 'scissor'], [null, 'paper', 'scissor']], 1)
    ).toEqual(2);
  });

  it('as a second player remove useless piece in second step', () => {
    expect(
      smartBotRemoval([[null, 'paper', 'scissor'], [null, null, 'scissor']], 1)
    ).toEqual(2);
  });

  it('as a first player remove a piece that you cannot beat if possible', () => {
    expect(
      smartBotRemoval([['rock', null, 'scissor'], ['rock', null, 'scissor']], 0)
    ).toEqual(0);
  });

  it('as a first player remove a piece that can still beat you if possible', () => {
    expect(
      smartBotRemoval([['rock', 'paper', null], ['rock', null, 'scissor']], 0)
    ).toEqual(2);
  });

  // The second player picks the first player's surviving card last, and a tie
  // goes to the first player, so the second player is the one with a forced win.
  it('is the second player who wins the whole game with optimal play', () => {
    expect(optimalWinner(START, 0)).toBe(1);
  });

  it('never throws away a win, from any position either role can reach', () => {
    for (const { board, player } of reachablePositions()) {
      if (optimalWinner(board, player) !== player) continue;
      const outcome = remove(board, player, smartBotRemoval(board, player));
      const result = outcome.gameEnd
        ? outcome.gameEnd.winnerIndex
        : optimalWinner(outcome.nextBoard, 1 - player);
      expect(result, `${JSON.stringify(board)}, player ${player}`).toBe(player);
    }
  });
});
