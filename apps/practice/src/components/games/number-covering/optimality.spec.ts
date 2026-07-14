import { describe, it, expect } from 'vitest';
import { mapValues, range } from 'lodash';
import { dummyEvents, makeCtx, type GameMoves } from '../../game-factory';
import { moves as gameMoves, smartBotStrategy, COVERED } from './number-covering';

// Exhaustive optimality check for both variants (numbers 1..8 and 1..10).
// The smart bot is board-driven, so a single test proves it for either range.
// We build an independent minimax solver, then verify that on the side that
// wins with perfect play the bot NEVER lets the win slip against any opponent
// line — every reachable terminal is a bot win.

type Board = number[];

const buildBoard = (remaining: number[], n: number): Board =>
  range(1, n + 1).map(v => (remaining.includes(v) ? v : COVERED));

const remainingOf = (board: Board): number[] =>
  board.filter(v => v !== COVERED).sort((a, b) => a - b);

const cover = (remaining: number[], v: number) => remaining.filter(x => x !== v);

// winner index (0 = first player, 1 = second) with `toMove` to move.
const winnerMemo = new Map<string, 0 | 1>();
const solve = (remaining: number[], toMove: 0 | 1): 0 | 1 => {
  if (remaining.length === 2) return ((remaining[0] + remaining[1]) % 2) as 0 | 1;
  const key = `${remaining.join(',')}:${toMove}`;
  const cached = winnerMemo.get(key);
  if (cached !== undefined) return cached;
  const other = (1 - toMove) as 0 | 1;
  let result: 0 | 1 = other;
  for (const v of remaining) {
    if (solve(cover(remaining, v), other) === toMove) { result = toMove; break; }
  }
  winnerMemo.set(key, result);
  return result;
};

// Drive the real smart bot once and return the board after its move.
const driveBot = (board: Board, chosenRoleIndex: 0 | 1): Board => {
  let captured: Board = board;
  const ctx = makeCtx({ chosenRoleIndex, currentPlayer: 1 - chosenRoleIndex });
  const wrapped = mapValues(gameMoves, fn => (b: Board, ...args: unknown[]) => {
    const res = (fn as (...a: unknown[]) => { nextBoard: Board })(b, { ctx, events: dummyEvents }, ...args);
    captured = res.nextBoard;
    return res;
  }) as unknown as GameMoves<Board>;
  smartBotStrategy({ board, ctx, moves: wrapped });
  return captured;
};

// Collect every distinct move the (randomised) bot can make from a position.
const botCandidates = (remaining: number[], n: number, humanRole: 0 | 1): number[][] => {
  const seen = new Map<string, number[]>();
  for (let i = 0; i < 40; i++) {
    const next = remainingOf(driveBot(buildBoard(remaining, n), humanRole));
    seen.set(next.join(','), next);
  }
  return [...seen.values()];
};

describe('number-covering smart bot is optimal for both variants', () => {
  for (const n of [8, 10]) {
    it(`plays 1..${n} perfectly whenever it is on the winning side`, () => {
      const start = range(1, n + 1);
      const botSide = solve(start, 0); // player 0 moves first
      const humanRole = (1 - botSide) as 0 | 1;

      const visited = new Set<string>();
      const walk = (remaining: number[], toMove: 0 | 1) => {
        if (remaining.length === 2) {
          expect((remaining[0] + remaining[1]) % 2, `losing terminal ${remaining}`).toBe(botSide);
          return;
        }
        const key = `${remaining.join(',')}:${toMove}`;
        if (visited.has(key)) return;
        visited.add(key);
        const other = (1 - toMove) as 0 | 1;
        if (toMove === botSide) {
          for (const next of botCandidates(remaining, n, humanRole)) {
            expect(next.length, 'bot makes exactly one legal move').toBe(remaining.length - 1);
            expect(solve(next, other), `bot blundered from ${remaining} to ${next}`).toBe(botSide);
            walk(next, other);
          }
        } else {
          for (const v of remaining) walk(cover(remaining, v), other);
        }
      };
      walk(start, 0);
    });
  }
});
