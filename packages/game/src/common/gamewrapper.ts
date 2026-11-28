import { Ctx, FnContext, Game, MoveFn, MoveMap, PhaseConfig, PlayerID } from 'boardgame.io';
import { INVALID_MOVE, TurnOrder } from 'boardgame.io/core';
import { timestampMoves, type MoveLogMetadata } from './timestamp';
import { currentPlayer, GameStateMixin, GameType, GUESSER_PLAYER, isDifficulty, isOwnGameState, JUDGE_PLAYER, PlayerIDType, recordFinish, recordWinner } from './types';

/// What boardgame.io hands a move. The wrapper's own moves read and write only
/// the mixin, so they name that as their state: a move whose context is the
/// mixin fits a game whose state is the mixin plus anything else.
type MoveContext = FnContext<GameStateMixin> & { playerID: PlayerID };

/// Each of these writes to the draft rather than returning a new state — the
/// two ways boardgame.io accepts a move's result, and the only one that keeps
/// the game's own half of the state typed.
function chooseRole({ G }: MoveContext, firstPlayer: PlayerIDType): void {
  G.firstPlayer = firstPlayer;
}

function chooseNewGameType({ G, playerID, events }: MoveContext, difficulty: unknown) {
  if (playerID !== GUESSER_PLAYER || !isDifficulty(difficulty)) {
    return INVALID_MOVE;
  };
  G.difficulty = difficulty;
  G.firstPlayer = null;
  G.winner = null;
  G.numberOfTries = G.numberOfTries + (difficulty === "live" ? 1 : 0);
  events.endTurn();
};

/// In a practice game, before a role is chosen, the team may ask for another
/// opening: the bot answers in `startNewGame` as it does for every new game,
/// whose turn order then skips the team's choice of difficulty.
function newStartingPosition({ G, playerID, events }: MoveContext) {
  if (playerID !== GUESSER_PLAYER || G.difficulty !== "test") {
    return INVALID_MOVE;
  };
  events.setPhase(PHASE.startNewGame);
};

/// The team concedes the game it is playing (#595), on its own turn: scored as
/// the bot's win, so a live one is a loss like any other, and the phase's
/// `endIf` takes the match to the next game. The bot never concedes.
function giveUp({ G, playerID }: MoveContext) {
  if (playerID !== GUESSER_PLAYER) {
    return INVALID_MOVE;
  };
  recordWinner(G, JUDGE_PLAYER);
};

/// The only source of a game's opening position: the bot sends it, typed on
/// its side by `startingPositionMove`.
function setStartingPosition({ G, playerID, events }: MoveContext, startingPosition: unknown) {
  if (playerID !== JUDGE_PLAYER || !isOwnGameState(startingPosition)) {
    return INVALID_MOVE;
  };
  events.endTurn();
  // The position is the game's own half of the state, which this move is
  // deliberately blind to — the judge (the bot) is the one that knows it.
  Object.assign(G, startingPosition);
};

/// How much of a failure's reason the match log keeps: a strategy's error
/// message can be of any length, and the log is stored with the match.
export const BOT_FAILURE_REASON_MAX_LENGTH = 500;

/// What a bot failure adds to its entry in the match log, beside the time.
export interface BotFailureLogMetadata extends MoveLogMetadata {
  botFailure: string;
}

/// The server's note that the bot's strategy failed: what failed, in the
/// match's own log for the organisers, and with `stuck`, that nothing was
/// played in its place, which the team's board then says. Only the server
/// sends it, as the judge; docs/ARCHITECTURE.md says when.
function noteBotFailure({ G, playerID, log }: MoveContext, reason: unknown, stuck: unknown) {
  if (playerID !== JUDGE_PLAYER || typeof reason !== 'string' || typeof stuck !== 'boolean') {
    return INVALID_MOVE;
  };
  log.setMetadata({
    time: new Date().toISOString(),
    botFailure: reason.slice(0, BOT_FAILURE_REASON_MAX_LENGTH),
  } satisfies BotFailureLogMetadata);
  if (stuck) G.botStuck = true;
}

/// A note is not a step of the game, so it may come in the middle of a turn
/// of several moves without using one up.
const botFailureNote = { move: noteBotFailure, noLimit: true };

/// Wraps each move the bot may play so that the bot playing one is not stuck
/// any more: a strategy fixed and redeployed frees the match it stalled. A
/// refused move leaves the flag, since boardgame.io discards its draft.
function clearingBotStuck<G extends GameStateMixin>(moves: MoveMap<G>): MoveMap<G> {
  const clearing = (move: MoveFn<G>): MoveFn<G> => (context, ...args) => {
    if (context.playerID === JUDGE_PLAYER) delete context.G.botStuck;
    return move(context, ...args);
  };
  return Object.fromEntries(Object.entries(moves).map(([name, move]) => [
    name,
    typeof move === 'function' ? clearing(move) : { ...move, move: clearing(move.move) },
  ]));
}

export const STRATEGY_DEFAULT_DURATION_MINUTES = 30;

/// How long past its end a match stays open, in milliseconds, so that a team
/// clicking as the clock hits zero does not lose the move to the round trip.
/// The first move after that is still applied, and then ends the match. The
/// bot's answer is held to the same allowance.
export const LATE_MOVE_GRACE_MS = 10 * 1000;

function isPastGrace(G: GameStateMixin) {
  return Date.now() - new Date(G.end).getTime() > LATE_MOVE_GRACE_MS;
}

// This is *very important*, so as not to spam
export function isMakeMovePayloadReadOnly(payload_type: string) {
  return payload_type === "getTime";
}


function getTime({ G, playerID }: MoveContext) {
  if (playerID !== GUESSER_PLAYER) {
    return INVALID_MOVE;
  }
  G.millisecondsRemaining = new Date(G.end).getTime() - new Date().getTime();
}

/// boardgame.io counts a move against the turn's move limit unless the move
/// says otherwise, and a clock poll is not a step of the game.
const clockPoll = { move: getTime, noLimit: true };

/// What the wrapper reports after each step and at the end of a match; hosts
/// accept a superset of this shape (the offline frontend's SendGameDataParams).
/// The match's move log is not in here: a move context carries boardgame.io's
/// log *plugin*, not the log's entries. Those are boardgame.io's own to keep,
/// with each move's time added by timestampMoves. The live round reads them
/// with `GET /game/admin/:matchId/logs`, the dry run from the local master
/// (apps/offline-frontend/src/bgio-log.ts).
export interface StrategyReport<T_SpecificGameState> {
  component: "strategy";
  phase: "step" | "end";
  G: T_SpecificGameState & GameStateMixin;
  ctx: Ctx;
}

export interface StrategyOptions {
  durationMinutes?: number;
}

/// What the server starts a strategy match with: the competition's duration
/// as it stands then.
/// The phases gameWrapper runs every strategy game through. `ctx.phase` is a
/// plain string to boardgame.io, so whatever reads it compares it with these
/// rather than with a literal of its own.
export const PHASE = {
  startNewGame: "startNewGame",
  chooseRole: "chooseRole",
  play: "play",
} as const;

export type StrategyPhase = (typeof PHASE)[keyof typeof PHASE];

export interface StrategySetupData {
  durationMinutes: number;
}

/// `game` is a game's own definition, which has no name, plus the name its
/// host gives the match (`WrappableGame` says why).
export function gameWrapper<T_SpecificGameState>(game: GameType<T_SpecificGameState> & { name?: string },
                                                 sendStrategyFunction: (_report: StrategyReport<T_SpecificGameState>) => void = () => undefined,
                                                 { durationMinutes = STRATEGY_DEFAULT_DURATION_MINUTES }: StrategyOptions = {},
                                                ): Game<T_SpecificGameState & GameStateMixin> {
  /// The team ends its strategy round for good (#111), on its own turn in any
  /// phase. It keeps the points it has, which are 0: a second win in a row
  /// would have ended the match already. A game being played is lost with it.
  /// The play phase's `onEnd` reports the end; outside it, nothing would.
  function abandonMatch({ G, ctx, playerID, events }: MoveContext) {
    if (playerID !== GUESSER_PLAYER) {
      return INVALID_MOVE;
    };
    G.abandoned = true;
    if (ctx.phase === PHASE.play) {
      recordWinner(G, JUDGE_PLAYER);
    } else {
      sendStrategyFunction({ component: "strategy", phase: "end", G: G as T_SpecificGameState & GameStateMixin, ctx });
    }
    events.endGame();
  };

  const myGameWrapper: Game<T_SpecificGameState & GameStateMixin, Record<string, unknown>, StrategySetupData | undefined> = {
    setup: (_context, setupData) => {
      const durationMs = (setupData?.durationMinutes ?? durationMinutes) * 60 * 1000;
      // One clock read, so that end - start is the duration exactly.
      const now = Date.now();
      return {
        ...game.setup(),
        millisecondsRemaining: durationMs,
        start: new Date(now).toISOString(),
        end: new Date(now + durationMs).toISOString(),
        firstPlayer: null,
        difficulty: null,
        winner: null,
        numberOfTries: 0,
        numberOfLoss: 0,
        winningStreak: 0,
        points: 0,
        liveResults: [],
      };
    },
    turn: {
      minMoves: 1,
      maxMoves: 1,
    },
    name: game.name,
    onEnd: ({ G }) => recordFinish(G),
    minPlayers: 2,
    maxPlayers: 2,
    phases: {
      [PHASE.startNewGame]: {
        moves: { ...timestampMoves(clearingBotStuck({ chooseNewGameType, setStartingPosition, abandonMatch })), getTime: clockPoll, noteBotFailure: botFailureNote },
        next: PHASE.chooseRole,
        // The team picks the difficulty, the bot answers with the position,
        // and the phase ends with that one round of turns. Coming back for
        // another opening of the same practice game (`newStartingPosition`),
        // the round is the bot's turn alone: only then is a mode chosen with
        // no game decided, since every game played to its end has a winner.
        turn: {
          order: {
            ...TurnOrder.ONCE,
            first: ({ G }) => G.difficulty != null && G.winner === null ? 1 : 0,
          },
        },
        start: true,
      },
      [PHASE.chooseRole]: {
        moves: { ...timestampMoves({ chooseRole, newStartingPosition, abandonMatch }), getTime: clockPoll },
        endIf: ({ G }) => { return G.firstPlayer !== null },
        next: PHASE.play,
        turn: {
          order: TurnOrder.RESET,
        },
      },
      [PHASE.play]: {
        moves: { ...timestampMoves(clearingBotStuck({ ...game.moves, giveUp, abandonMatch })), getTime: clockPoll, noteBotFailure: botFailureNote },
        endIf: ({ G }) => { return G.winner !== null },
        next: PHASE.startNewGame,
        turn: {
          order: {
            first: ({ G }) => {
              return G.firstPlayer === GUESSER_PLAYER ? 0 : 1;
            },
            next: ({ ctx }) => {
              return (ctx.playOrderPos + 1) % ctx.numPlayers;
            },
          },
          ...(!("turn" in game) && {
            minMoves: 1,
            maxMoves: 1
          }),
          ...game.turn,
          // The end-of-time rule for every strategy game, in this phase only.
          // boardgame.io runs these hooks after the move. The team's clock poll
          // is a move too, so a team still on the page ends a match it has run
          // out of by asking for the time.
          onMove: (context) => {
            game.turn?.onMove?.(context);
            if (context.playerID === GUESSER_PLAYER && isPastGrace(context.G)) context.events.endGame();
          },
          onEnd: ({ G, ctx, events, random, log }) => {
            // boardgame.io attaches `playerID` to `turn.onMove` and to nothing
            // else: `EndTurn` calls this hook with the state alone. The player
            // whose turn is ending is still the current one, since bgio
            // advances the order only after this returns.
            const playerID = currentPlayer(ctx);
            game.turn?.onEnd?.({ G, ctx, playerID, events, log, random });
            if (playerID === JUDGE_PLAYER && isPastGrace(G)) events.endGame();
            sendStrategyFunction({ component: "strategy", phase: "step", G: G, ctx: ctx });
          },
        },
        onEnd: ({ G, ctx }) => {
          // A game with no winner yet is one the time ran out in, ended by a
          // move past the allowance: the team's, its clock poll or the bot's.
          // A match the server closes on time has no entry for it. A second win in a row ends the match from
          // inside the move, and boardgame.io still ends this phase first.
          if (G.difficulty === "live") {
            // No game ends in a draw, so one with a winner is won or lost.
            G.liveResults.push(G.winner === null ? "unfinished" : G.winner === GUESSER_PLAYER ? "won" : "lost");
          }
          sendStrategyFunction({ component: "strategy", phase: "end", G: G, ctx: ctx });
        }
      },
      // Exactly the phases PHASE names, each passing to another of them, so
      // the map and the constant cannot drift apart.
    } satisfies Record<StrategyPhase, PhaseConfig<T_SpecificGameState & GameStateMixin> & { next?: StrategyPhase }>,
    // boardgame.io types playerID as a plain string.
    ai: {
      enumerate: (G, ctx, playerID) =>
        game.possibleMoves(G, ctx, playerID as PlayerIDType),
    }
  };

  return myGameWrapper;
};
