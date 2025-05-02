import { Ctx, Game } from 'boardgame.io';
import { INVALID_MOVE, TurnOrder } from 'boardgame.io/core';
import { GameStateMixin, GameType, GUESSER_PLAYER, JUDGE_PLAYER } from './types';
import { IS_OFFLINE_MODE, parseGameState, saveGameState } from '../client/utils/util';

function chooseRole({ G, ctx, playerID }: any, firstPlayer: string):void { // TODO: type
  G.firstPlayer = firstPlayer;
}

function chooseNewGameType({ G, ctx, playerID, random, events }: any, difficulty: string) {
  if (playerID !== GUESSER_PLAYER) {
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
  if (playerID !== JUDGE_PLAYER) {
    return INVALID_MOVE;
  };
  events.endTurn();
  return {
    ...G,
    ...startingPosition,
  };
};

type loadGameFn = ({ G, playerID, events }:any) => any;
let loadingPhase = false;

// called from a useeffect in boardwrapper.tsx
// state is saved in onEnd()
function loadGameState<T_SpecificGameState>({ events }:any) {
  if (!IS_OFFLINE_MODE) {
    return;
  }
  const phase = localStorage.getItem("StrategyPhase");
  const gameStateJSON = localStorage.getItem("StrategyGameState");
  console.log(gameStateJSON)
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

  console.log("setting phase");
  if (phase !== "startNewGame") {
    // This avoids an infinity loop on onBegin event on startNewGame phase.
    events.setPhase(phase);
    //events.endTurn({ next: GUESSER_PLAYER })
  }
  if (phase === "play"){
    loadingPhase = true;
  }
  console.log("loaded game phase", phase);
  // if (phase === "startNewGame") {
  //   events.endPhase();
  // }
  state.millisecondsRemaining = new Date(state.end).getTime() - new Date().getTime();
  return state;
}

const lengthOfCompetition = 30 * 60; // seconds

// This is *very important*, so as not to spam
export function isMakeMovePayloadReadOnly(payload_type: string) {
  return payload_type === "getTime";
}

function getTime({ G, ctx, playerID, events }: any) {
  console.log("getTime");
  // saveGameState({G, ctx, playerID, events})
  if (playerID !== GUESSER_PLAYER) {
    return INVALID_MOVE;
  }
  G.milisecondsRemaining = new Date(G.end).getTime() - new Date().getTime();
}

export function gameWrapper<T_SpecificGameState>(game: GameType<T_SpecificGameState>): Game<T_SpecificGameState & GameStateMixin> { // TODO: solve types
  return {
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
      points: 0
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
        moves: { chooseNewGameType, setStartingPosition, loadGameState: loadGameState as loadGameFn, getTime },
        endIf: ({ G, ctx, playerID }) => { return G.difficulty !== null && G.winner === null && 'startingPosition' in game },
        next: "chooseRole",
        turn: {
          order: TurnOrder.ONCE,
          onEnd: ({G, ctx}) => {
            console.log("StartNewGame saveGame");
            saveGameState(G, ctx, "Strategy");
          },
          onBegin: loadGameState,
        },
        start: true,
      },
      chooseRole: {
        moves: { chooseRole, getTime },
        endIf: ({ G, ctx, playerID }) => { return G.firstPlayer !== null },
        next: "play",
        turn: {
          order: TurnOrder.RESET,
          onBegin: ({G, ctx}) => {
            console.log("chooseRole.turn.onBegin saveGame");
            saveGameState(G, ctx, "Strategy");
          }
        }
      },
      play: {
        moves: { ...game.moves, getTime },
        endIf: ({ G, ctx, playerID }) => { return G.winner !== null },
        next: "startNewGame",
        turn: {
          order: {
            first: ({ G, ctx }) => {
              console.log("loadingPhase1", loadingPhase)
              if (loadingPhase){
                loadingPhase = false;
                console.log("loadingPhase2", loadingPhase)
                return Number(GUESSER_PLAYER);
              }
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

            if (ctx.currentPlayer === JUDGE_PLAYER) {
              console.log("saveGameState judge end");
              saveGameState(G, ctx, "Strategy");
            }
          },
        },
        onBegin: ({G, ctx, playerID, events, random, log}) => {
          console.log("saveGameState on play phase Begin");
          saveGameState(G, ctx, "Strategy");
        }
      },
    },
    // conflict with boardgameio type, where id is string, instead of playerIDType
    ai: { enumerate: game.possibleMoves as (G:T_SpecificGameState,ctx:Ctx,playerID:string)=>any[] }
  };
};
