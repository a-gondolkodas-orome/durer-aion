import { describe, it, expect } from 'vitest';
import { type BotStrategy } from 'strategy-game-factory';
import { botNextMove, makeCtx } from 'test-utils';
import {
  type Board,
  type Cell,
  type Move,
  RED,
  BLUE,
  applyMove,
  legalMoves,
  majorityWinner,
  startCells
} from './gameplay';
import { solveForN } from './solver';
import { smartBotStrategy, randomBotStrategy } from './bot-strategy';

// Run one strategy for `player` on `cells` and return the resulting cells.
const decide = (strategy: BotStrategy<Board>, cells: Cell[], player: number): Cell[] => {
  const ctx = makeCtx({ currentPlayer: player, isClientMoveAllowed: true, phase: 'play' });
  const { move, args = [] } = botNextMove(strategy({ board: { cells }, ctx }));
  if (move === 'pass') return [...cells];
  const asMove: Move = move === 'moveDisc'
    ? { type: 'move', from: args[0] as number, to: args[1] as number }
    : { type: 'place', to: args[0] as number };
  return applyMove(cells, player, asMove);
};

// Play a full game; returns { winner, plies }.
const playGame = (
  n: number,
  strategies: [BotStrategy<Board>, BotStrategy<Board>]
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
      const strategies: [BotStrategy<Board>, BotStrategy<Board>] = winningRole === RED
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
