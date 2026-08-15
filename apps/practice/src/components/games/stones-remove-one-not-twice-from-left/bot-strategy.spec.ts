import { runMatch } from 'strategy-game-factory';
import { botNextMoveArgs, makeCtx, moveValidator } from 'test-utils';
import { type Board, hasNoLegalMove, moves } from './gameplay';
import { isWinningForMover, randomBotStrategy, smartBotStrategy } from './bot-strategy';

type Bot = typeof smartBotStrategy

const board = (
  piles: [number, number], leftRestriction: [boolean, boolean] = [false, false]
): Board => ({ piles, leftRestriction });

const play = (startBoard: Board, strategies: [Bot, Bot]) =>
  runMatch({ gameplay: { moves }, strategies, startBoard });

// Both restriction flags change the position, so a sweep has to vary them, not
// just the pile sizes. A position the player to move is stuck in is left out:
// the game ends there, so no bot is ever asked about one.
const positionsUpTo = (max: number): Board[] => {
  const positions: Board[] = [];
  for (let left = 0; left <= max; left++) {
    for (let right = 0; right <= max; right++) {
      for (const mover of [false, true]) {
        for (const opponent of [false, true]) {
          const position = board([left, right], [mover, opponent]);
          if (!hasNoLegalMove(position, 0)) positions.push(position);
        }
      }
    }
  }
  return positions;
};

const namedPile = (bot: Bot, position: Board, player = 0): number =>
  botNextMoveArgs(bot({ board: position, ctx: makeCtx({ currentPlayer: player }) }))[0];

describe('isWinningForMover', () => {
  // The closed-form solution of a fresh position (nobody barred from the left),
  // worked out separately so the search is graded against something other than
  // itself. With an even left pile the mover wins exactly on an odd right pile —
  // the plain parity argument. With an odd left pile they win exactly when the
  // right pile's parity agrees with whether it still reaches past the left one.
  const winsOnFreshBoard = (left: number, right: number): boolean =>
    left % 2 === 0 ? right % 2 === 1 : (right >= left - 1) === (right % 2 === 0);

  it('agrees with the closed form on every fresh board', () => {
    for (let left = 0; left <= 24; left++) {
      for (let right = 0; right <= 24; right++) {
        expect({ left, right, winning: isWinningForMover(board([left, right]), 0) })
          .toEqual({ left, right, winning: winsOnFreshBoard(left, right) });
      }
    }
  });

  it('reads a position off the restrictions, not off the seat numbers', () => {
    for (const position of positionsUpTo(6)) {
      const swapped = board(position.piles, [
        position.leftRestriction[1], position.leftRestriction[0]
      ]);
      expect(isWinningForMover(swapped, 1)).toBe(isWinningForMover(position, 0));
    }
  });

  it('calls both piles empty a loss, and the last stone a win', () => {
    expect(isWinningForMover(board([0, 0]), 0)).toBe(false);
    expect(isWinningForMover(board([0, 1]), 0)).toBe(true);
    expect(isWinningForMover(board([1, 0]), 0)).toBe(true);
    // barred from the left with nothing on the right: stuck, so lost
    expect(isWinningForMover(board([1, 0], [true, false]), 0)).toBe(false);
  });

  // Equal odd piles are lost on a fresh board, but not once the opponent has
  // just taken from the left: they cannot take from it again, so emptying the
  // right pile strands them. An earlier parity-based bot read both cases the
  // same way and threw the win away.
  it('turns equal odd piles into a win once the opponent is barred from the left', () => {
    for (const n of [1, 3, 5, 7, 9]) {
      expect(isWinningForMover(board([n, n]), 0)).toBe(false);
      expect(isWinningForMover(board([n, n], [false, true]), 0)).toBe(true);
    }
  });
});

describe('smartBotStrategy', () => {
  it('only ever names a legal move, from either seat', () => {
    for (const position of positionsUpTo(7)) {
      for (const player of [0, 1]) {
        const seated = board(position.piles, player === 0
          ? position.leftRestriction
          : [position.leftRestriction[1], position.leftRestriction[0]]);
        const isLegal = moveValidator(moves.removeStone, makeCtx({ currentPlayer: player }));
        expect(isLegal(seated, namedPile(smartBotStrategy, seated, player))).toBe(true);
      }
    }
  });

  it('takes the right pile when equal odd piles leave the opponent barred', () => {
    for (const n of [3, 5, 7]) {
      expect(namedPile(smartBotStrategy, board([n, n], [false, true]))).toBe(1);
    }
  });

  it('wins from every winning position against a bot playing at random', () => {
    for (const position of positionsUpTo(5).filter(p => isWinningForMover(p, 0))) {
      for (let trial = 0; trial < 10; trial++) {
        expect({ position, winner: play(position, [smartBotStrategy, randomBotStrategy]).winnerIndex })
          .toEqual({ position, winner: 0 });
      }
    }
  });

  it('wins as the replier from every losing position, against a bot playing at random', () => {
    for (const position of positionsUpTo(5).filter(p => !isWinningForMover(p, 0))) {
      for (let trial = 0; trial < 10; trial++) {
        expect({ position, winner: play(position, [randomBotStrategy, smartBotStrategy]).winnerIndex })
          .toEqual({ position, winner: 1 });
      }
    }
  });

  // The bot cannot be beaten by another optimal bot either, so the side the
  // search calls winning is the side that actually wins a played-out game.
  it('hands the win to the side the search names, in optimal-vs-optimal play', () => {
    for (const position of positionsUpTo(6)) {
      const { winnerIndex } = play(position, [smartBotStrategy, smartBotStrategy]);
      expect({ position, moverWins: isWinningForMover(position, 0) })
        .toEqual({ position, moverWins: winnerIndex === 0 });
    }
  });
});

describe('randomBotStrategy', () => {
  it('only ever names a legal move', () => {
    for (const position of positionsUpTo(7)) {
      const isLegal = moveValidator(moves.removeStone, makeCtx({ currentPlayer: 0 }));
      for (let trial = 0; trial < 5; trial++) {
        expect(isLegal(position, namedPile(randomBotStrategy, position))).toBe(true);
      }
    }
  });

  it('reaches for both piles when both are open', () => {
    const open = board([3, 3]);
    const named = new Set(
      Array.from({ length: 40 }, () => namedPile(randomBotStrategy, open))
    );
    expect([...named].sort()).toEqual([0, 1]);
  });
});
