import { describe, it, expect } from 'vitest';
import { playBotMove } from '../../../test-utils';
import { isFlipAllowed, isRemovalAllowed, moves as gameMoves, smartBotStrategy } from './discs-flip-or-remove';

// board[0] = blue discs, board[1] = red discs.
type Board = [number, number];

describe('isRemovalAllowed', () => {
  it('accepts taking one or two blue discs', () => {
    expect(isRemovalAllowed([3, 4], 1)).toBe(true);
    expect(isRemovalAllowed([3, 4], 2)).toBe(true);
  });

  it('refuses any other count', () => {
    expect(isRemovalAllowed([3, 4], 0)).toBe(false);
    expect(isRemovalAllowed([3, 4], 3)).toBe(false);
    expect(isRemovalAllowed([3, 4], -1)).toBe(false);
  });

  it('refuses taking more blue discs than there are', () => {
    expect(isRemovalAllowed([1, 4], 2)).toBe(false);
    expect(isRemovalAllowed([1, 4], 1)).toBe(true);
    expect(isRemovalAllowed([0, 4], 1)).toBe(false);
  });
});

describe('isFlipAllowed', () => {
  it('accepts flipping one or two red discs', () => {
    expect(isFlipAllowed([3, 4], 1)).toBe(true);
    expect(isFlipAllowed([3, 4], 2)).toBe(true);
  });

  it('refuses flipping more red discs than there are', () => {
    expect(isFlipAllowed([3, 1], 2)).toBe(false);
    expect(isFlipAllowed([3, 1], 1)).toBe(true);
    expect(isFlipAllowed([3, 0], 1)).toBe(false);
  });

  it('counts each pile separately — a full blue pile does not license a red flip', () => {
    expect(isFlipAllowed([9, 0], 1)).toBe(false);
    expect(isRemovalAllowed([0, 9], 1)).toBe(false);
  });
});

// Exhaustive optimality check for both variants (max 6 and max 10 discs).
// Moves: remove 1-2 blue, or flip 1-2 red into blue.
// A player who cannot move (board [0,0]) loses. We verify against an
// independent minimax over the whole reachable state space that the bot,
// whenever the mover can win, always moves to a losing-for-opponent position.

const key = ([b, r]: Board) => `${b},${r}`;

const legalMoves = ([blue, red]: Board): Board[] => {
  const next: Board[] = [];
  if (blue >= 1) next.push([blue - 1, red]);
  if (blue >= 2) next.push([blue - 2, red]);
  if (red >= 1) next.push([blue + 1, red - 1]);
  if (red >= 2) next.push([blue + 2, red - 2]);
  return next;
};

const moverWinsMemo = new Map<string, boolean>();
const moverWins = (board: Board): boolean => {
  const k = key(board);
  const cached = moverWinsMemo.get(k);
  if (cached !== undefined) return cached;
  moverWinsMemo.set(k, false); // guard against cycles (there are none: total is non-increasing)
  const wins = legalMoves(board).some(m => !moverWins(m));
  moverWinsMemo.set(k, wins);
  return wins;
};

const botCandidates = (board: Board): Board[] => {
  const seen = new Map<string, Board>();
  for (let i = 0; i < 40; i++) {
    const next = playBotMove(smartBotStrategy, gameMoves, board);
    seen.set(key(next), next);
  }
  return [...seen.values()];
};

describe('discs-flip-or-remove smart bot is optimal for both variants', () => {
  for (const max of [6, 10]) {
    it(`plays optimally across every position with up to ${max} discs`, () => {
      for (let blue = 0; blue <= max; blue++) {
        for (let red = 0; red + blue <= max; red++) {
          const board: Board = [blue, red];

          // The game value is exactly "blue is not a multiple of 3".
          expect(moverWins(board), `game value at ${key(board)}`).toBe(blue % 3 !== 0);

          if (!moverWins(board)) continue; // bot on the losing side: no win to protect
          for (const next of botCandidates(board)) {
            const isLegal = legalMoves(board).some(m => key(m) === key(next));
            expect(isLegal, `${key(next)} legal from ${key(board)}`).toBe(true);
            expect(moverWins(next), `bot blundered from ${key(board)} to ${key(next)}`).toBe(false);
          }
        }
      }
    });
  }
});
