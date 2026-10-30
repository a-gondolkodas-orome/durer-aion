import type { Ctx } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { GUESSER_PLAYER, JUDGE_PLAYER, LATE_MOVE_GRACE_MS, otherPlayer, strategyPoints } from '../../../common/types';
import type { GameStateMixin, GameType, PlayerIDType } from '../../../common/types';

export const BOARD_SIZE = 5;
export type Mark = 'O' | 'X';
export type Category = 'C' | 'D' | 'E';

export interface MyGameState {
  cells: (Mark | null)[];
  category?: Category;
  lastMachineMove?: number[];
}

type Position = MyGameState & Partial<Pick<GameStateMixin, 'firstPlayer' | 'winner'>>;

export function startingPosition(category: Category = 'E'): MyGameState {
  return { cells: Array<Mark | null>(BOARD_SIZE * BOARD_SIZE).fill(null), category, lastMachineMove: [] };
}

export function markForPlayer(G: Position, playerID: string): Mark {
  const firstMark = G.category === 'C' ? 'X' : 'O';
  return playerID === G.firstPlayer ? firstMark : firstMark === 'X' ? 'O' : 'X';
}

export function winningLine(cells: MyGameState['cells']): number[] {
  for (let i = 0; i < BOARD_SIZE; i++) {
    const row = Array.from({ length: BOARD_SIZE }, (_, j) => i * BOARD_SIZE + j);
    const column = Array.from({ length: BOARD_SIZE }, (_, j) => j * BOARD_SIZE + i);
    if (row.every(index => cells[index] === 'X')) return row;
    if (column.every(index => cells[index] === 'X')) return column;
  }
  return [];
}

export function isLegalPlacement(G: Position, ctx: Pick<Ctx, 'phase' | 'currentPlayer'>, indices: unknown): indices is number[] {
  if (ctx.phase !== 'play' || G.firstPlayer == null || G.winner != null) return false;
  if (!Array.isArray(indices) || indices.length === 0 || indices.length > 2) return false;
  if (!indices.every((index: unknown) => typeof index === 'number'
    && Number.isInteger(index) && index >= 0 && index < G.cells.length && G.cells[index] === null)) return false;
  if (new Set(indices).size !== indices.length) return false;
  if (markForPlayer(G, ctx.currentPlayer) === 'O') return indices.length === 1;
  if (indices.length === 2) return true;
  if (G.cells.filter(cell => cell === null).length === 1) return true;

  // A line completed by the first X ends the game before a second is needed.
  const next = [...G.cells];
  next[indices[0] as number] = 'X';
  return winningLine(next).length > 0;
}

export function possibleMoves(G: Position, ctx: Ctx): { move: string; args: [number[]] }[] {
  const empty = G.cells.flatMap((cell, index) => cell === null ? [index] : []);
  const choices: number[][] = empty.map(index => [index]);
  if (markForPlayer(G, ctx.currentPlayer) === 'X') {
    for (let i = 0; i < empty.length; i++) {
      for (let j = i + 1; j < empty.length; j++) choices.push([empty[i], empty[j]]);
    }
  }
  return choices.filter(indices => isLegalPlacement(G, ctx, indices))
    .map(indices => ({ move: 'placeMarks', args: [indices] }));
}

function scoreRound(G: GameStateMixin, winner: PlayerIDType): boolean {
  G.winner = winner;
  if (G.difficulty !== 'live') return false;
  if (winner === JUDGE_PLAYER) {
    G.winningStreak = 0;
    G.numberOfLoss += 1;
  } else {
    G.winningStreak += 1;
    if (G.winningStreak >= 2) {
      G.points = strategyPoints(G.numberOfLoss);
      return true;
    }
  }
  return false;
}

export function MyGameWrapper(category: Category): GameType<MyGameState> {
  return {
    name: `20o${category.toLowerCase()}`,
    setup: () => startingPosition(category),
    possibleMoves,
    moves: {
      placeMarks: ({ G, ctx, events }, indices: unknown) => {
        if (!isLegalPlacement(G, ctx, indices) || G.firstPlayer === null) return INVALID_MOVE;
        const mark = markForPlayer(G, ctx.currentPlayer);
        const placed: number[] = [];
        for (const index of indices) {
          G.cells[index] = mark;
          placed.push(index);
          if (mark === 'X' && winningLine(G.cells).length > 0) break;
        }
        if (ctx.currentPlayer === JUDGE_PLAYER) G.lastMachineMove = placed;
        const oPlayer = markForPlayer(G, G.firstPlayer) === 'O' ? G.firstPlayer : otherPlayer(G.firstPlayer);
        const winner = winningLine(G.cells).length > 0
          ? otherPlayer(oPlayer)
          : G.cells.every(cell => cell !== null) ? oPlayer : null;
        if (winner !== null && scoreRound(G, winner)) {
          events.endGame();
          return;
        }
        events.endTurn();
      },
    },
    turn: {
      // Turns end in placeMarks, so the wrapper's getTime poll consumes no turn.
      onMove: ({ G, playerID, events }) => {
        if (playerID === GUESSER_PLAYER && Date.now() - new Date(G.end).getTime() > LATE_MOVE_GRACE_MS) events.endGame();
      },
      onEnd: ({ G, playerID, events }) => {
        if (playerID === JUDGE_PLAYER && Date.now() - new Date(G.end).getTime() > LATE_MOVE_GRACE_MS) events.endGame();
      },
    },
  };
}
