import type { Ctx } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { PHASE } from '../../../common/gamewrapper';
import { currentPlayer, JUDGE_PLAYER, recordWinner } from '../../../common/types';
import type { GameStateMixin, GameType } from '../../../common/types';

// The reference template (README § Creating a new game): the least a game
// needs. One pile; a turn takes 1, 3 or 4 tokens from it; whoever takes the
// last token wins. The bot draws each game's pile at random.

export const TAKES = [1, 3, 4] as const;
export const OPENING_RANGE = { min: 10, max: 20 } as const;

export interface MyGameState {
  pile: number;
  /// What the bot took on its last turn, for the board to show.
  lastJudgeTake: number | null;
}

type Position = MyGameState & Partial<Pick<GameStateMixin, 'firstPlayer' | 'winner'>>;

export function startingPosition(pile: number): MyGameState {
  return { pile, lastJudgeTake: null };
}

export function isLegalTake(G: Position, ctx: Pick<Ctx, 'phase'>, count: unknown): count is number {
  if (ctx.phase !== PHASE.play || G.firstPlayer == null || G.winner != null) return false;
  return TAKES.some(take => take === count) && (count as number) <= G.pile;
}

export function possibleMoves(G: Position, ctx: Pick<Ctx, 'phase'>): { move: string; args: [number] }[] {
  return TAKES.filter(count => isLegalTake(G, ctx, count)).map(count => ({ move: 'take', args: [count] }));
}

export function MyGameWrapper(): GameType<MyGameState> {
  return {
    // Never played: the bot's opening replaces it before the first move.
    setup: () => startingPosition(OPENING_RANGE.min),
    possibleMoves,
    startVaries: true,
    // The move ends the turn itself, as every game's does: a `turn` here
    // replaces the wrapper's one-move limit, so a copy that adds a hook keeps
    // working.
    turn: { minMoves: 1 },
    moves: {
      take: ({ G, ctx, events }, count: unknown) => {
        if (!isLegalTake(G, ctx, count)) return INVALID_MOVE;
        G.pile -= count;
        if (ctx.currentPlayer === JUDGE_PLAYER) G.lastJudgeTake = count;
        if (G.pile === 0 && recordWinner(G, currentPlayer(ctx))) {
          events.endGame();
          return;
        }
        events.endTurn();
      },
    },
  };
}
