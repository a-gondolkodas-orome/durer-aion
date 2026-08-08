import { smartBotStrategy } from './bot-strategy';
import { CARDS, generateStartBoard, moves, type Board, type Card } from './gameplay';
import { botNextMoveArgs, makeCtx, moveValidator } from 'test-utils';

const smartBotRemoval = (board: Board, currentPlayer: number): Card =>
  botNextMoveArgs(smartBotStrategy({ board, ctx: makeCtx({ currentPlayer }) }))[0];

const remove = (board: Board, player: number, card: Card) =>
  moves.removeCard.apply(board, { ctx: makeCtx({ currentPlayer: player }) }, card);

// Asking the move's own validator about every card in the game — rather than
// reading the opponent hand directly — keeps the search below exploring exactly
// the game the player plays.
const takeableCards = (board: Board, player: number): Card[] => {
  const isTakeable = moveValidator(moves.removeCard, makeCtx({ currentPlayer: player }));
  return CARDS.filter(card => isTakeable(board, card));
};

// Winner under optimal play from `board` with `player` to move. Four moves at
// three choices each, so a plain memoised search covers the whole game.
const memo = new Map<string, number>();
const optimalWinner = (board: Board, player: number): number => {
  const key = `${JSON.stringify(board)}|${player}`;
  const cached = memo.get(key);
  if (cached !== undefined) return cached;

  // if no move wins for the mover, the opponent takes it
  let winner = 1 - player;
  for (const card of takeableCards(board, player)) {
    const outcome = remove(board, player, card);
    const result = outcome.gameEnd
      ? outcome.gameEnd.winnerIndex
      : optimalWinner(outcome.nextBoard, 1 - player);
    if (result === player) { winner = player; break; }
  }
  memo.set(key, winner);
  return winner;
};

const START = generateStartBoard();

// Every position reachable from the start, paired with the player to move.
const reachablePositions = (): { board: Board; player: number }[] => {
  const seen = new Map<string, { board: Board; player: number }>();
  const visit = (board: Board, player: number) => {
    const key = `${JSON.stringify(board)}|${player}`;
    if (seen.has(key)) return;
    seen.set(key, { board, player });
    for (const card of takeableCards(board, player)) {
      const outcome = remove(board, player, card);
      if (!outcome.gameEnd) visit(outcome.nextBoard, 1 - player);
    }
  };
  visit(START, 0);
  return [...seen.values()];
};

describe('smartBotStrategy', () => {
  it('as a second player remove useless piece in first step', () => {
    expect(smartBotRemoval([['rock', 'paper', 'scissor'], ['rock', 'scissor']], 1)).toEqual('rock');
    expect(smartBotRemoval([['rock', 'paper', 'scissor'], ['rock', 'paper']], 1)).toEqual('paper');
    expect(smartBotRemoval([['rock', 'paper', 'scissor'], ['paper', 'scissor']], 1)).toEqual('scissor');
  });

  it('as a second player remove useless piece in second step', () => {
    expect(smartBotRemoval([['paper', 'scissor'], ['scissor']], 1)).toEqual('scissor');
  });

  it('as a first player remove a piece that you cannot beat if possible', () => {
    expect(smartBotRemoval([['rock', 'scissor'], ['rock', 'scissor']], 0)).toEqual('rock');
  });

  it('as a first player remove a piece that can still beat you if possible', () => {
    expect(smartBotRemoval([['rock', 'paper'], ['rock', 'scissor']], 0)).toEqual('scissor');
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
