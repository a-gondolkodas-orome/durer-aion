import { Ctx, Game } from 'boardgame.io';
import { INVALID_MOVE, TurnOrder } from 'boardgame.io/core';
import { GameStateMixin, GameType, PlayerIDType } from './types';

const { guesserPlayer: GUESSER_PLAYER, judgePlayer: JUDGE_PLAYER } = PlayerIDType;

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
  console.log("loadGame");
  if (process.env.REACT_APP_WHICH_VERSION === "a") {
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
  state.gameStateLoadedFromStorage = true;
  return state;
}

function getTime({ G, ctx, playerID, events }:any){
  if (playerID !== "0") {
    return INVALID_MOVE;
  };
  G.milisecondsRemaining = new Date(G.end).getTime() - new Date().getTime();
};

// This is *very important*, so as not to spam
export function isMakeMovePayloadReadOnly(payload_type: string) {
  return payload_type === "getTime";
}

export function gameWrapper<T_SpecificGameState>(game: GameType<T_SpecificGameState>): Game<T_SpecificGameState & GameStateMixin> { // TODO: solve types
  return {
    setup: () => ({ ...game.setup(), gameStateLoadedFromStorage: false, firstPlayer: null, difficulty: null, winner: null, numberOfTries: 0, numberOfLoss: 0, winningStreak: 0, points: 0}),
    turn: {
      minMoves: 1,
      maxMoves: 1,
    },
    name: game.name,
    minPlayers: 2,
    maxPlayers: 2,
    phases: {
      startNewGame: {
        moves: { chooseNewGameType, setStartingPosition, getTime, loadGameState: loadGameState as loadGameFn },
        endIf: ({ G, ctx, playerID }) => { return G.difficulty !== null && G.winner === null && 'startingPosition' in game },
        next: "chooseRole",
        turn: {
          order: TurnOrder.ONCE,
        },
        start: true,
      },
      chooseRole: {
        moves: { chooseRole, getTime },
        endIf: ({ G, ctx, playerID }) => { return G.firstPlayer !== null },
        next: "play",
        turn: { order: TurnOrder.RESET }
      },
      play: {
        moves: { ...game.moves, getTime },
        endIf: ({ G, ctx, playerID }) => { return G.winner !== null },
        next: "startNewGame",
        turn: {
          order: {
            first: ({ G, ctx }) => {
              if (G.gameStateLoadedFromStorage) {
                return 0; // game state is saved at the end of the judge's turn
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

            console.log("onEnd", ctx.currentPlayer, process.env.REACT_APP_WHICH_VERSION);
            if (process.env.REACT_APP_WHICH_VERSION === "b" && ctx.currentPlayer === JUDGE_PLAYER) {
              console.log("saving game state");
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
