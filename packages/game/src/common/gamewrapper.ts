import { Ctx, DefaultPluginAPIs, FnContext, Game, PlayerID } from 'boardgame.io';
import { INVALID_MOVE, TurnOrder } from 'boardgame.io/core';
import { GameStateMixin, GameType, GUESSER_PLAYER, JUDGE_PLAYER, PlayerIDType } from './types';

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

function chooseNewGameType({ G, playerID, events }: MoveContext, difficulty: string) {
  if (playerID !== GUESSER_PLAYER) {
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

/// What the wrapper reports after each step and at the end of a match; hosts
/// accept a superset of this shape (the offline frontend's SendGameDataParams).
/// `log` is boardgame.io's log *plugin*, which is what a move context carries —
/// not the match's log entries.
export interface StrategyReport<T_SpecificGameState> {
  component: "strategy";
  phase: "step" | "end";
  G: T_SpecificGameState & GameStateMixin;
  ctx: Ctx;
  log?: DefaultPluginAPIs['log'];
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
        moves: { chooseNewGameType, setStartingPosition, getTime },
        endIf: ({ G }) => { return G.difficulty !== null && G.winner === null && 'startingPosition' in game },
        next: "chooseRole",
        turn: {
          order: TurnOrder.ONCE,
        },
        start: true,
      },
      chooseRole: {
        moves: { chooseRole, getTime },
        endIf: ({ G }) => { return G.firstPlayer !== null },
        next: "play",
        turn: {
          order: TurnOrder.RESET,
        },
      },
      play: {
        moves: { ...game.moves, getTime },
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
          onEnd: ({G, ctx, playerID, events, random, log}) => {
            if (game.turn?.onEnd !== undefined) {
              game.turn.onEnd({G, ctx, playerID, events, log, random});
            }
            sendStrategyFunction({component: "strategy", phase: "step", G: G, ctx: ctx, log: log});
          },
        },
        onEnd: ({G, ctx}) => {
          sendStrategyFunction({component: "strategy", phase: "end", G: G, ctx: ctx});
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
