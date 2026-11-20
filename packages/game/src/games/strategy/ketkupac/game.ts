import type { Ctx } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { PHASE } from '../../../common/gamewrapper';
import { currentPlayer, JUDGE_PLAYER, recordWinner } from '../../../common/types';
import type { GameStateMixin, GameType } from '../../../common/types';

// A reference game (README § Creating a new game): two piles, and a turn of two
// steps — choose a pile, then take from it. The first player takes 1–3 tokens
// at a time, the second 1–4; whoever takes the last token wins.

export const OPENING_PILES: readonly [number, number] = [3, 6];
export const PILE_COUNT = OPENING_PILES.length;

export interface MyGameState {
  piles: number[];
  /// The pile the player to move chose as the first step of its turn. The
  /// second step, taking, empties it again.
  selectedPile: number | null;
  /// What the bot took on its last turn, for the board to show.
  lastJudgeTake: { pile: number; count: number } | null;
}

type Position = MyGameState & Partial<Pick<GameStateMixin, 'firstPlayer' | 'winner'>>;

export function startingPosition(): MyGameState {
  return { piles: [...OPENING_PILES], selectedPile: null, lastJudgeTake: null };
}

/// The most tokens the player may take in one turn: the first player 3, the
/// second 4.
export function maxTake(G: Position, playerID: string): number {
  return playerID === G.firstPlayer ? 3 : 4;
}

function isPlaying(G: Position, ctx: Pick<Ctx, 'phase'>): boolean {
  return ctx.phase === PHASE.play && G.firstPlayer != null && G.winner == null;
}

function isPile(G: Position, pile: unknown): pile is number {
  return typeof pile === 'number' && Number.isInteger(pile) && pile >= 0 && pile < G.piles.length && G.piles[pile] > 0;
}

/// The first step: a pile with tokens in it. The team may change its mind
/// before taking.
export function isLegalSelection(G: Position, ctx: Pick<Ctx, 'phase'>, pile: unknown): pile is number {
  return isPlaying(G, ctx) && isPile(G, pile);
}

/// The second step, or the whole turn at once when no pile is chosen: the
/// chosen pile, if one is chosen, and as many tokens as the player may take.
export function isLegalTake(G: Position, ctx: Pick<Ctx, 'phase' | 'currentPlayer'>, pile: unknown, count: unknown): boolean {
  if (!isPlaying(G, ctx) || !isPile(G, pile)) return false;
  if (G.selectedPile != null && G.selectedPile !== pile) return false;
  return typeof count === 'number' && Number.isInteger(count)
    && count >= 1 && count <= Math.min(maxTake(G, ctx.currentPlayer), G.piles[pile]);
}

/// Every take, each a whole turn: what the bot picks from for a random move.
/// Its strategy names the two steps instead, as a team plays them.
export function possibleMoves(G: Position, ctx: Pick<Ctx, 'phase' | 'currentPlayer'>): { move: string; args: [number, number] }[] {
  return G.piles.flatMap((size, pile) =>
    Array.from({ length: Math.min(size, maxTake(G, ctx.currentPlayer)) }, (_, i) => ({ move: 'take', args: [pile, i + 1] as [number, number] })))
    .filter(({ args: [pile, count] }) => isLegalTake(G, ctx, pile, count));
}

export function getPlayerStepDescription({ G, ctx }: { G: Position, ctx: Pick<Ctx, 'currentPlayer'> }): string {
  if (G.selectedPile == null) return 'Válasszatok egy kupacot!';
  const most = Math.min(maxTake(G, ctx.currentPlayer), G.piles[G.selectedPile]);
  return most === 1
    ? `Vegyétek el az utolsó korongot a(z) ${G.selectedPile + 1}. kupacból!`
    : `Vegyetek el 1–${most} korongot a(z) ${G.selectedPile + 1}. kupacból!`;
}

export function MyGameWrapper(): GameType<MyGameState> {
  return {
    setup: startingPosition,
    possibleMoves,
    roleLabels: ['Kezdő (1–3 korong)', 'Második (1–4 korong)'],
    getPlayerStepDescription,
    // A turn is one take, after any number of selections.
    turn: { minMoves: 1 },
    moves: {
      selectPile: ({ G, ctx }, pile: unknown) => {
        if (!isLegalSelection(G, ctx, pile)) return INVALID_MOVE;
        G.selectedPile = pile;
      },
      take: ({ G, ctx, events }, pile: unknown, count: unknown) => {
        if (!isLegalTake(G, ctx, pile, count)) return INVALID_MOVE;
        const [from, taken] = [pile as number, count as number];
        G.piles[from] -= taken;
        G.selectedPile = null;
        if (ctx.currentPlayer === JUDGE_PLAYER) G.lastJudgeTake = { pile: from, count: taken };
        if (G.piles.every(size => size === 0) && recordWinner(G, currentPlayer(ctx))) {
          events.endGame();
          return;
        }
        events.endTurn();
      },
    },
  };
}
