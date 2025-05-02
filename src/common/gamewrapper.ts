import { Ctx, Game } from 'boardgame.io';
import { INVALID_MOVE, TurnOrder } from 'boardgame.io/core';
import { GameStateMixin, GameType, GUESSER_PLAYER, JUDGE_PLAYER } from './types';
import { IS_OFFLINE_MODE } from '../client/utils/appMode';
import { isForOfStatement } from 'typescript';

function parseGameState<T_SpecificGameState>(json: string): T_SpecificGameState {
  const parsed = JSON.parse(json);

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('relay: game_state_from_json: Invalid JSON: not an object');
  }
  return parsed as T_SpecificGameState;
}

function chooseRole({ G, ctx, playerID }: any, firstPlayer: string):void { // TODO: type
  G.firstPlayer = firstPlayer;
}

function chooseNewGameType({ G, ctx, playerID, random, events }: any, difficulty: string) {
  if (playerID !== "0") {
    return INVALID_MOVE;
  };
  let newG = {
    ...G,
    difficulty: difficulty,
    firstPlayer: null,
    winner: null,
    numberOfTries: G.numberOfTries + (difficulty === "live" ? 1 : 0),
  }
  events.endTurn();
  return {
    ...newG,
  }
};

function setStartingPosition({ G, ctx, playerID, random, events }: any, startingPosition: any) { // TODO: type
  if (playerID !== "1") {
    return INVALID_MOVE;
  };
  events.endTurn();
  return {
    ...G,
    ...startingPosition,
  };
};

type loadGameFn = ({ G, playerID, events }:any) => any;

// called from a useeffect in boardwrapper.tsx
// state is saved in onEnd()
function loadGameState<T_SpecificGameState>({ events }:any) {
  if (!IS_OFFLINE_MODE) {
    return;
  }

  const phase = localStorage.getItem("StrategyPhase");
  const gameStateJSON = localStorage.getItem("StrategyGameState");
  if (phase === null || gameStateJSON === null) {
    return;
  }

  let state;
  try { // if the json is bad, continue as if we didnt even have it
    state = parseGameState<T_SpecificGameState & GameStateMixin>(gameStateJSON);
  } catch {
    localStorage.removeItem("StrategyPhase");
    localStorage.removeItem("StrategyGameState");
    console.error("could not load game phase from json, invalid json");
    return;
  }

  events.setPhase(phase);
  if (phase === "startNewGame") {
    events.endPhase();
  }
  state.milisecondsRemaining = new Date(state.end).getTime() - new Date().getTime();
  return state;
}

const lengthOfCompetition = 30 * 60; // seconds

// This is *very important*, so as not to spam
export function isMakeMovePayloadReadOnly(payload_type: string) {
  return payload_type === "getTime";
}

export function gameWrapper<T_SpecificGameState>(game: GameType<T_SpecificGameState>): Game<T_SpecificGameState & GameStateMixin> { // TODO: solve types
  return {
    setup: () => ({
      ...game.setup(),
      milisecondsRemaining: 1000 * lengthOfCompetition,
      start: new Date().toISOString(),
      end: new Date(Date.now() + 1000 * lengthOfCompetition).toISOString(),
      firstPlayer: null,
      difficulty: null,
      winner: null,
      numberOfTries: 0,
      numberOfLoss: 0,
      winningStreak: 0,
      points: 0
    }),
    turn: {
      minMoves: 1,
      maxMoves: 1,
    },
    name: game.name,
    minPlayers: 2,
    maxPlayers: 2,
    moves: {
      getTime({ G, ctx, playerID, events }) {
        if (playerID !== "0") {
          return INVALID_MOVE;
        }
        G.milisecondsRemaining = new Date(G.end).getTime() - new Date().getTime();
      }
    },
    phases: {
      startNewGame: {
        moves: { chooseNewGameType, setStartingPosition, loadGameState: loadGameState as loadGameFn },
        endIf: ({ G, ctx, playerID }) => { return G.difficulty !== null && G.winner === null && 'startingPosition' in game },
        next: "chooseRole",
        turn: {
          order: TurnOrder.ONCE,
        },
        start: true,
      },
      chooseRole: {
        moves: { chooseRole },
        endIf: ({ G, ctx, playerID }) => { return G.firstPlayer !== null },
        next: "play",
        turn: { order: TurnOrder.RESET }
      },
      play: {
        moves: { ...game.moves },
        endIf: ({ G, ctx, playerID }) => { return G.winner !== null },
        next: "startNewGame",
        turn: {
          order: {
            first: ({ G, ctx }) => {
              return G.firstPlayer === GUESSER_PLAYER ? 0 : 1;
            },
            next: ({ G, ctx }) => {
              return (ctx.playOrderPos + 1) % ctx.numPlayers
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

            if (IS_OFFLINE_MODE && ctx.currentPlayer === JUDGE_PLAYER) {
              G.firstPlayer = GUESSER_PLAYER;
              localStorage.setItem("StrategyGameState", JSON.stringify(G));
              localStorage.setItem("StrategyPhase", ctx.phase);
            }
          },
        },
      },
    },
    // conflict with boardgameio type, where id is string, instead of playerIDType
    ai: { enumerate: game.possibleMoves as (G:T_SpecificGameState,ctx:Ctx,playerID:string)=>any[] }
  };
};
