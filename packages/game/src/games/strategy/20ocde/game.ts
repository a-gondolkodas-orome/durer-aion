import type { Ctx } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { JUDGE_PLAYER, otherPlayer, strategyPoints } from '../../../common/types';
import type { GameStateMixin, GameType, PlayerIDType } from '../../../common/types';

export const BOARD_SIZE = 5;
export type Mark = 'O' | 'X';
export type Category = 'C' | 'D' | 'E';

export interface MyGameState {
  cells: (Mark | null)[];
  category?: Category;
  lastMachineMove?: number[];
  /// The X's placed so far in the current turn. A team places its two one at a
  /// time, each a move of its own, so the first is kept here until the second
  /// ends the turn. Online state may come from a server without it.
  xsThisTurn?: number[];
}

type Position = MyGameState & Partial<Pick<GameStateMixin, 'firstPlayer' | 'winner'>>;

export function startingPosition(category: Category = 'E'): MyGameState {
  return { cells: Array<Mark | null>(BOARD_SIZE * BOARD_SIZE).fill(null), category, lastMachineMove: [], xsThisTurn: [] };
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

/// How many marks the player to move may still place this turn: one O, or the
/// X's left of its two.
function marksLeft(G: Position, currentPlayer: string): number {
  return markForPlayer(G, currentPlayer) === 'O' ? 1 : 2 - (G.xsThisTurn?.length ?? 0);
}

/// Some or all of the marks left this turn. A single X is legal on its own: the
/// turn then waits for the second.
export function isLegalPlacement(G: Position, ctx: Pick<Ctx, 'phase' | 'currentPlayer'>, indices: unknown): indices is number[] {
  if (ctx.phase !== 'play' || G.firstPlayer == null || G.winner != null) return false;
  if (!Array.isArray(indices) || indices.length === 0 || indices.length > marksLeft(G, ctx.currentPlayer)) return false;
  if (!indices.every((index: unknown) => typeof index === 'number'
    && Number.isInteger(index) && index >= 0 && index < G.cells.length && G.cells[index] === null)) return false;
  return new Set(indices).size === indices.length;
}

/// Whether placing these ends the turn: all of its marks, a line of X's, or the
/// last empty cell.
function endsTurn(G: Position, currentPlayer: string, indices: number[]): boolean {
  if (indices.length === marksLeft(G, currentPlayer)) return true;
  const next = [...G.cells];
  for (const index of indices) next[index] = markForPlayer(G, currentPlayer);
  return winningLine(next).length > 0 || next.every(cell => cell !== null);
}

/// The placements that finish the turn: the bots play a turn as one move, so
/// they are asked only for those.
export function possibleMoves(G: Position, ctx: Ctx): { move: string; args: [number[]] }[] {
  const empty = G.cells.flatMap((cell, index) => cell === null ? [index] : []);
  const choices: number[][] = empty.map(index => [index]);
  if (marksLeft(G, ctx.currentPlayer) === 2) {
    for (let i = 0; i < empty.length; i++) {
      for (let j = i + 1; j < empty.length; j++) choices.push([empty[i], empty[j]]);
    }
  }
  return choices.filter(indices => isLegalPlacement(G, ctx, indices) && endsTurn(G, ctx.currentPlayer, indices))
    .map(indices => ({ move: 'placeMarks', args: [indices] }));
}

/// The team's next step on its turn: one O, or two X's one at a time.
export function getPlayerStepDescription({ G, ctx }: { G: Position, ctx: Pick<Ctx, 'currentPlayer'> }): string {
  if (markForPlayer(G, ctx.currentPlayer) === 'O') return 'Tegyetek egy kört egy üres mezőre!';
  return G.xsThisTurn?.length === 1 ? 'Tegyétek le a második X-et!' : 'Tegyétek le az első X-et!';
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
    // The roles name each side's mark, which the first player's depends on by
    // category.
    roleLabels: category === 'C' ? ['Kezdő (2 X)', 'Második (1 O)'] : ['Kezdő (1 O)', 'Második (2 X)'],
    getPlayerStepDescription,
    // The game ends each turn itself, after one O or two X's.
    turn: { minMoves: 1 },
    moves: {
      placeMarks: ({ G, ctx, events }, indices: unknown) => {
        if (!isLegalPlacement(G, ctx, indices) || G.firstPlayer === null) return INVALID_MOVE;
        const mark = markForPlayer(G, ctx.currentPlayer);
        const turnEnds = endsTurn(G, ctx.currentPlayer, indices);
        const placed: number[] = [];
        for (const index of indices) {
          G.cells[index] = mark;
          placed.push(index);
          if (mark === 'X' && winningLine(G.cells).length > 0) break;
        }
        if (ctx.currentPlayer === JUDGE_PLAYER) G.lastMachineMove = placed;
        G.xsThisTurn = turnEnds ? [] : [...G.xsThisTurn ?? [], ...placed];
        const oPlayer = markForPlayer(G, G.firstPlayer) === 'O' ? G.firstPlayer : otherPlayer(G.firstPlayer);
        const winner = winningLine(G.cells).length > 0
          ? otherPlayer(oPlayer)
          : G.cells.every(cell => cell !== null) ? oPlayer : null;
        if (winner !== null && scoreRound(G, winner)) {
          events.endGame();
          return;
        }
        if (turnEnds) events.endTurn();
      },
    },
  };
}
