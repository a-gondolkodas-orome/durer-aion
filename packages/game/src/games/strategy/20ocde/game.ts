import type { Ctx } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { PHASE } from '../../../common/gamewrapper';
import { JUDGE_PLAYER, otherPlayer, recordWinner } from '../../../common/types';
import type { GameStateMixin, GameType } from '../../../common/types';

export const BOARD_SIZE = 5;
export type Mark = 'O' | 'X';
export type Category = 'C' | 'D' | 'E';

export interface MyGameState {
  cells: (Mark | null)[];
  category?: Category;
  /// The bot's marks of its latest turn, which the board highlights.
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

/// A mark on an empty cell, for whoever is to move.
export function isLegalPlacement(G: Position, ctx: Pick<Ctx, 'phase'>, index: unknown): index is number {
  if (ctx.phase !== PHASE.play || G.firstPlayer == null || G.winner != null) return false;
  return typeof index === 'number' && Number.isInteger(index) && index >= 0 && index < G.cells.length
    && G.cells[index] === null;
}

/// Every placement: the X player's is one of its two.
export function possibleMoves(G: Position, ctx: Ctx): { move: string; args: [number] }[] {
  return G.cells.flatMap((_, index) => isLegalPlacement(G, ctx, index) ? [{ move: 'placeMark', args: [index] as [number] }] : []);
}

/// The team's next step on its turn: one O, or two X's one at a time.
export function getPlayerStepDescription({ G, ctx }: { G: Position, ctx: Pick<Ctx, 'currentPlayer'> }): string {
  if (markForPlayer(G, ctx.currentPlayer) === 'O') return 'Tegyetek egy kört egy üres mezőre!';
  return G.xsThisTurn?.length === 1 ? 'Tegyétek le a második X-et!' : 'Tegyétek le az első X-et!';
}

export function MyGameWrapper(category: Category): GameType<MyGameState> {
  return {
    setup: () => startingPosition(category),
    possibleMoves,
    // The roles name each side's mark, which the first player's depends on by
    // category.
    roleLabels: category === 'C' ? ['Kezdő (2 X)', 'Második (1 O)'] : ['Kezdő (1 O)', 'Második (2 X)'],
    getPlayerStepDescription,
    // The game ends each turn itself, after one O or two X's.
    turn: { minMoves: 1 },
    moves: {
      placeMark: ({ G, ctx, events }, index: unknown) => {
        if (!isLegalPlacement(G, ctx, index) || G.firstPlayer === null) return INVALID_MOVE;
        const lastOfTurn = marksLeft(G, ctx.currentPlayer) === 1;
        G.cells[index] = markForPlayer(G, ctx.currentPlayer);
        // A line of X's, or the last empty cell, ends the turn early.
        const turnEnds = lastOfTurn || winningLine(G.cells).length > 0 || G.cells.every(cell => cell !== null);
        const placed = [...G.xsThisTurn ?? [], index];
        if (ctx.currentPlayer === JUDGE_PLAYER) G.lastMachineMove = placed;
        G.xsThisTurn = turnEnds ? [] : placed;
        const oPlayer = markForPlayer(G, G.firstPlayer) === 'O' ? G.firstPlayer : otherPlayer(G.firstPlayer);
        const winner = winningLine(G.cells).length > 0
          ? otherPlayer(oPlayer)
          : G.cells.every(cell => cell !== null) ? oPlayer : null;
        if (winner !== null && recordWinner(G, winner)) {
          events.endGame();
          return;
        }
        if (turnEnds) events.endTurn();
      },
    },
  };
}
