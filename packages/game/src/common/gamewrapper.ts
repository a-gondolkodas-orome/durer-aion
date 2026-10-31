import { Ctx, FnContext, Game, PlayerID } from 'boardgame.io';
import { INVALID_MOVE, TurnOrder } from 'boardgame.io/core';
import { timestampMoves } from './timestamp';
import { currentPlayer, GameStateMixin, GameType, GUESSER_PLAYER, isDifficulty, JUDGE_PLAYER, PlayerIDType } from './types';

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

function setStartingPosition({ G, playerID, events }: MoveContext, startingPosition: Record<string, unknown>) {
  if (playerID !== JUDGE_PLAYER) {
    return INVALID_MOVE;
  };
  events.endTurn();
  // The position is the game's own half of the state, which this move is
  // deliberately blind to — the judge (the bot) is the one that knows it.
  Object.assign(G, startingPosition);
};

const lengthOfCompetition = 30 * 60; // seconds

/// How late a move may still be taken, in milliseconds, so that a team clicking
/// as the clock hits zero does not lose the move to the round trip. The same
/// allowance applies when the bot's turn ends: a shorter one there would end the
/// match while a move the team had just been granted was still on screen.
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

export function gameWrapper<T_SpecificGameState>(game: GameType<T_SpecificGameState>,
                                                 sendStrategyFunction: (_report: StrategyReport<T_SpecificGameState>) => void = () => undefined,
                                                ): Game<T_SpecificGameState & GameStateMixin> {
  const myGameWrapper: Game<T_SpecificGameState & GameStateMixin> = {
    setup: () => ({
      ...game.setup(),
      millisecondsRemaining: 1000 * lengthOfCompetition,
      start: new Date().toISOString(),
      end: new Date(Date.now() + 1000 * lengthOfCompetition).toISOString(),
      firstPlayer: null,
      difficulty: null,
      winner: null,
      numberOfTries: 0,
      numberOfLoss: 0,
      winningStreak: 0,
      points: 0,
      liveResults: [],
    }),
    turn: {
      minMoves: 1,
      maxMoves: 1,
    },
    name: game.name,
    minPlayers: 2,
    maxPlayers: 2,
    phases: {
      startNewGame: {
        moves: { ...timestampMoves({ chooseNewGameType, setStartingPosition }), getTime: clockPoll },
        endIf: ({ G }) => { return G.difficulty !== null && G.winner === null && 'startingPosition' in game },
        next: "chooseRole",
        turn: {
          order: TurnOrder.ONCE,
        },
        start: true,
      },
      chooseRole: {
        moves: { ...timestampMoves({ chooseRole }), getTime: clockPoll },
        endIf: ({ G }) => { return G.firstPlayer !== null },
        next: "play",
        turn: {
          order: TurnOrder.RESET,
        },
      },
      play: {
        moves: { ...timestampMoves(game.moves ?? {}), getTime: clockPoll },
        endIf: ({ G }) => { return G.winner !== null },
        next: "startNewGame",
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
          // The end-of-time rule for every strategy game. The team's clock poll
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
          // A game with no winner yet is one the time ran out in. That is
          // recorded only when the team's page ends the match, by asking for
          // the time after the deadline; a match the server closes on time
          // has no entry for it. A second win in a row ends the match from
          // inside the move, and boardgame.io still ends this phase first.
          if (G.difficulty === "live") {
            // No game ends in a draw, so one with a winner is won or lost.
            G.liveResults.push(G.winner === null ? "unfinished" : G.winner === GUESSER_PLAYER ? "won" : "lost");
          }
          sendStrategyFunction({ component: "strategy", phase: "end", G: G, ctx: ctx });
        }
      },
    },
    // boardgame.io types playerID as a plain string.
    ai: {
      enumerate: (G, ctx, playerID) =>
        game.possibleMoves(G, ctx, playerID as PlayerIDType),
    }
  };

  return myGameWrapper;
};
