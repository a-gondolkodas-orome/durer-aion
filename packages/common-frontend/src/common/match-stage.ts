import type { Ctx } from "boardgame.io";
import { GUESSER_PLAYER, JUDGE_PLAYER, PHASE } from "game";
import type { GameStateMixin } from "game";

/// Where a strategy match stands, as the board wrapper words it: one status
/// line and one row of buttons for each. `boardWrapper` picks the text; this
/// decides which.
export type MatchStage =
  // Two live wins in a row end the match; anything else ending it is the
  // clock, which may cut a game short.
  | { kind: 'ended', by: 'liveWon' }
  | { kind: 'ended', by: 'time', unfinished: boolean }
  // The bot failed to move and the server played nothing in its place, so
  // the match waits on it until an organiser steps in or a fixed bot moves.
  | { kind: 'stuck' }
  // Until then the team may act on its own turn, in any phase. The judge is
  // the bot, so its turn is a wait rather than a move to offer; it takes one
  // outside `play` too, to set the opening position of each new game.
  | ({ teamToMove: boolean } & (
    // Before the first game: no mode chosen yet.
    | { kind: 'intro' }
    // Between games with no result to show, as while the bot places the
    // next opening.
    | { kind: 'nextGame' }
    // Between games, the last one's result.
    | { kind: 'result', practice: boolean, won: boolean }
    | { kind: 'chooseRole' }
    | { kind: 'play' }
  ));

/// `finished` is the board's clock as well as the game's own end, so the
/// caller works it out.
export function matchStage(G: GameStateMixin, ctx: Pick<Ctx, 'phase' | 'currentPlayer'>, finished: boolean): MatchStage {
  if (finished) {
    if (G.winningStreak >= 2) return { kind: 'ended', by: 'liveWon' };
    return { kind: 'ended', by: 'time', unfinished: ctx.phase === PHASE.play || ctx.phase === PHASE.chooseRole };
  }
  if (G.botStuck === true) return { kind: 'stuck' };
  const teamToMove = ctx.currentPlayer !== JUDGE_PLAYER;
  if (ctx.phase === PHASE.startNewGame) {
    // `difficulty` and `winner` outlive the game they describe until the next
    // one is chosen, so between games they are the last game's mode and result.
    if (G.difficulty == null) return { kind: 'intro', teamToMove };
    if (!teamToMove || G.winner === null) return { kind: 'nextGame', teamToMove };
    return { kind: 'result', teamToMove, practice: G.difficulty === 'test', won: G.winner === GUESSER_PLAYER };
  }
  if (ctx.phase === PHASE.chooseRole) return { kind: 'chooseRole', teamToMove };
  return { kind: 'play', teamToMove };
}

/// What the board area shows. `empty` has no position worth reading: no game
/// yet, or the bot still placing the next one. `locked` has one the team needs
/// to see but may not move on: the role depends on the opening position, and a
/// finished game's is its result. `waiting` is the bot's turn, which only
/// ignores clicks: the bot answers within a state update or two, so fading the
/// board on each of its moves would flash it every turn.
export type BoardState = 'empty' | 'locked' | 'live' | 'waiting';

export function boardState(stage: MatchStage): BoardState {
  switch (stage.kind) {
    case 'ended': case 'stuck': case 'result': case 'chooseRole': return 'locked';
    case 'intro': case 'nextGame': return 'empty';
    case 'play': return stage.teamToMove ? 'live' : 'waiting';
  }
}

/// The role the team chose, named by `labels` (the first player's, then the
/// second's), for the chip at the board's edge: only while a game is played,
/// when the board is what the team reads.
export function chosenRole<L>(stage: MatchStage, G: Pick<GameStateMixin, 'firstPlayer'>, labels: readonly [L, L]): L | null {
  if (stage.kind !== 'play' || G.firstPlayer == null) return null;
  return G.firstPlayer === GUESSER_PLAYER ? labels[0] : labels[1];
}
