import { describe, it, expect } from 'vitest';
import { makeCtx, type GameMoves, type StrategyArgs } from '../../game-factory';
import {
  type Board,
  type Cell,
  RED,
  BLUE,
  applyMove,
  legalMoves,
  majorityWinner,
  startCells
} from './helpers';
import { solveForN } from './solver';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';

type Strategy = (args: StrategyArgs<Board>) => void;

// Run one strategy for `player` on `cells` and return the resulting cells.
const decide = (strategy: Strategy, cells: Cell[], player: number): Cell[] => {
  const board: Board = { cells };
  let result: Cell[] = cells;
  const capture = (next: Cell[]) => {
    result = next;
    return { nextBoard: { cells: next } };
  };
  const moves: GameMoves<Board> = {
    moveDisc: (b: Board, from: number, to: number) =>
      capture(applyMove(b.cells, player, { type: 'move', from, to })),
    placeDisc: (b: Board, at: number) => capture(applyMove(b.cells, player, { type: 'place', to: at })),
    pass: (b: Board) => capture([...b.cells])
  };
  const ctx = makeCtx({ currentPlayer: player, isClientMoveAllowed: true, phase: 'play' });
  strategy({ board, ctx, moves });
  return result;
};

// Play a full game; returns { winner, plies }.
const playGame = (
  n: number,
  strategies: [Strategy, Strategy]
): { winner: number; plies: number } => {
  let cells = startCells(n);
  let player = RED;
  for (let plies = 1; plies <= 200; plies++) {
    cells = decide(strategies[player], cells, player);
    const winner = majorityWinner(cells);
    if (winner !== null) return { winner, plies };
    player = 1 - player;
  }
  return { winner: BLUE, plies: 200 }; // 200-ply cap: blue wins
};

describe('recolouring-discs bot', () => {
  it('never loses (and wins via majority, not the cap) from the winning role vs a random opponent', () => {
    for (const n of [7, 8]) {
      const winningRole = solveForN(n).winnerAt(startCells(n), RED);
      const strategies: [Strategy, Strategy] = winningRole === RED
        ? [smartBotStrategy, randomBotStrategy]
        : [randomBotStrategy, smartBotStrategy];
      for (let game = 0; game < 40; game++) {
        const { winner, plies } = playGame(n, strategies);
        expect(winner).toBe(winningRole);
        expect(plies).toBeLessThan(200);
      }
    }
  });

  it('the winning role wins in smart-vs-smart play', () => {
    for (const n of [7, 8]) {
      const winningRole = solveForN(n).winnerAt(startCells(n), RED);
      for (let game = 0; game < 10; game++) {
        expect(playGame(n, [smartBotStrategy, smartBotStrategy]).winner).toBe(winningRole);
      }
    }
  });

  it('the smart bot always makes a legal move', () => {
    for (const n of [7, 8]) {
      const cells = startCells(n);
      const legal = legalMoves(cells, RED).map(m => JSON.stringify(applyMove(cells, RED, m)));
      const chosen = JSON.stringify(decide(smartBotStrategy, cells, RED));
      expect(legal).toContain(chosen);
    }
  });
});
