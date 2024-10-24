import { Ctx, Game } from 'boardgame.io';
import { INVALID_MOVE, TurnOrder } from 'boardgame.io/core';
import { GameStateMixin, GameType } from './types';
import { GasMeterRounded } from '@mui/icons-material';

const GUESSER_PLAYER = '0';
const JUDGE_PLAYER = '1';

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

type loadGameFn<T_SpecificGameState> = ({ G, playerID, events }:any) => any;

function loadGameState<T_SpecificGameState>({ events, ctx }:any) {
  console.log("loadGame");
  if (process.env.REACT_APP_WHICH_VERSION === "a") {
    return;
  }

  const phase = localStorage.getItem("StrategyPhase");
  const gameStateJSON = localStorage.getItem("StrategyGameState");
  if (phase === null || gameStateJSON === null) {
    return;
  }
  try { // if the json is bad, continue as if we didnt even have it
    let state = parseGameState<T_SpecificGameState>(gameStateJSON);
    console.log(state);
    events.setPhase(phase);
    if (phase === "startNewGame") {
      events.endPhase();
    }
    console.log("loadstate: CP: ", ctx.currentPlayer);
    events.endTurn();
    return state;
  } catch {
    console.error("could not load game phase from json, invalid json");
  }
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
    setup: () => ({ ...game.setup(), firstPlayer: null, difficulty: null, winner: null, numberOfTries: 0, numberOfLoss: 0, winningStreak: 0, points: 0}),
    turn: {
      minMoves: 1,
      maxMoves: 1,
    },
    name: game.name,
    minPlayers: 2,
    maxPlayers: 2,
    phases: {
      startNewGame: {
        moves: { chooseNewGameType, setStartingPosition, getTime, loadGameState: loadGameState as loadGameFn<T_SpecificGameState> },
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
            first: ({ G, ctx }) => G.firstPlayer === 0 ? 0 : 1,
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
            if (process.env.REACT_APP_WHICH_VERSION === "b" && ctx.currentPlayer === GUESSER_PLAYER) {
              console.log("asdfasdf");
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
