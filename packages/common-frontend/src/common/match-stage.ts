import type { Ctx } from "boardgame.io";
import { GUESSER_PLAYER, JUDGE_PLAYER, PHASE } from "game";
import type { GameStateMixin } from "game";

/// Where a strategy match stands, as the board wrapper words it: one status
/// line and one row of buttons for each. `boardWrapper` picks the text; this
/// decides which.
export type MatchStage =
  // Two live wins in a row end the match; anything else ending it is the
  // clock, which may cut a game short.
  | { kind: 'ended', by: 'liveWon' } | { kind: 'ended', by: 'time', unfinished: boolean }
  // Before the first game: no mode chosen yet.
  | { kind: 'intro' }
  // Between games with no result to show, as while the bot places the next
  // opening.
  | { kind: 'nextGame', botStarting: boolean }
  // Between games, the last one's result.
  | { kind: 'result', practice: boolean, won: boolean }
  | { kind: 'chooseRole' }
  | { kind: 'play', teamToMove: boolean };

/// `finished` is the board's clock as well as the game's own end, so the
/// caller works it out.
export function matchStage(G: GameStateMixin, ctx: Pick<Ctx, 'phase' | 'currentPlayer'>, finished: boolean): MatchStage {
  if (finished) {
    if (G.winningStreak >= 2) return { kind: 'ended', by: 'liveWon' };
    return { kind: 'ended', by: 'time', unfinished: ctx.phase === PHASE.play || ctx.phase === PHASE.chooseRole };
  }
  // The judge is the bot, so its turn is a wait rather than a move to offer.
  // It takes one outside `play` too: it sets the opening position of each new
  // game.
  const judgeToMove = ctx.currentPlayer === JUDGE_PLAYER;
  if (ctx.phase === PHASE.startNewGame) {
    // `difficulty` and `winner` outlive the game they describe until the next
    // one is chosen, so between games they are the last game's mode and result.
    if (G.difficulty == null) return { kind: 'intro' };
    if (judgeToMove || G.winner === null) return { kind: 'nextGame', botStarting: judgeToMove };
    return { kind: 'result', practice: G.difficulty === 'test', won: G.winner === GUESSER_PLAYER };
  }
  if (ctx.phase === PHASE.chooseRole) return { kind: 'chooseRole' };
  return { kind: 'play', teamToMove: !judgeToMove };
}

/// Whether the team may act: its turn, in any phase, before the match ends.
export function isTeamToMove(ctx: Pick<Ctx, 'currentPlayer'>, finished: boolean): boolean {
  return ctx.currentPlayer !== JUDGE_PLAYER && !finished;
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
    case 'ended': case 'result': case 'chooseRole': return 'locked';
    case 'intro': case 'nextGame': return 'empty';
    case 'play': return stage.teamToMove ? 'live' : 'waiting';
  }
}

/// The role the team chose, for the chip at the board's edge: only while a
/// game is played, when the board is what the team reads.
export function chosenRole(stage: MatchStage, G: Pick<GameStateMixin, 'firstPlayer'>): 'first' | 'second' | null {
  if (stage.kind !== 'play' || G.firstPlayer == null) return null;
  return G.firstPlayer === GUESSER_PLAYER ? 'first' : 'second';
}
