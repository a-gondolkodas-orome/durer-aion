import { Ctx, Game } from "boardgame.io";

import { GameStateTimer, GUESSER_PLAYER } from "./types";
import { IS_OFFLINE_MODE } from "../client/utils/util";


function parseJSON<T_ParsedData>(json: string): T_ParsedData {
  const parsed = JSON.parse(json);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(`Invalid JSON: not an object. Received: ${json}`);
  }
  return parsed as T_ParsedData;
}


function saveGameState({ G, ctx }: any, gameName: string) {
  if (!IS_OFFLINE_MODE) {
    return;
  }
  localStorage.setItem(gameName + "GameState", JSON.stringify(G));
  localStorage.setItem(gameName + "ctx", JSON.stringify(ctx));
}


function loadGameStateFromLocalStorage<T_SpecificGameState>(gameName: string): { savedG: T_SpecificGameState & GameStateTimer, savedctx: Ctx} | undefined {
  const ctxJSON = localStorage.getItem(gameName + "ctx");
  const gameStateJSON = localStorage.getItem(gameName + "GameState");
  if (ctxJSON === null || gameStateJSON === null) {
    return;
  }

  let savedG, savedctx;
  try { // if the json is bad, continue as if we didnt even have it
    savedG = parseJSON<T_SpecificGameState & GameStateTimer>(gameStateJSON);
    savedctx = parseJSON<Ctx>(ctxJSON);
  } catch (error) {
    localStorage.removeItem(gameName + "ctx");
    localStorage.removeItem(gameName + "GameState");
    console.error(error);
    return;
  }

  savedG.millisecondsRemaining = new Date(savedG.end).getTime() - new Date().getTime();
  return { savedG, savedctx };
}


function injectFuncOnBeginTurn(myGameWrapper: any, newFunction: any) {
  for (const phaseName in myGameWrapper.phases) {
    const originalOnBeginTurn = myGameWrapper.phases[phaseName].turn?.onBegin;
    myGameWrapper.phases[phaseName] = {
      ...myGameWrapper.phases[phaseName],
      turn: {
        ...myGameWrapper.phases[phaseName].turn,
        onBegin: (state: any) => {
          if (originalOnBeginTurn) {
            originalOnBeginTurn(state);
          }
          newFunction(state);
        },
      },
    }
  }
  return myGameWrapper;
}


export function setupLocalStorageGameState<T_SpecificGameState>(myGameWrapper: Game<T_SpecificGameState & GameStateTimer>) {
  const gameName = myGameWrapper.name;
  if (!gameName) {
    throw new Error("'name' is not defined in the game. LocalStorage save is not supported without game name.");
  }
  if (!myGameWrapper.phases) {
    throw new Error("Limitation: LocalStorage save is not supported in games without phases.");
  }

  // Save the game state to localStorage for onBegin guesser's turn
  myGameWrapper = injectFuncOnBeginTurn(myGameWrapper, (state: any) => {
    if (state.ctx.currentPlayer === GUESSER_PLAYER) {
      saveGameState(state, gameName);
    }
  });

  // Save the game state to localStorage for onEnd of game
  // NOT FINISHED THIS PART

  const savedStates = loadGameStateFromLocalStorage<T_SpecificGameState>(gameName);
  if (!myGameWrapper.phases || !savedStates) {
    return myGameWrapper; // No loaded state.
  }
  const { savedG, savedctx } = savedStates;

  // Initialize game state with the loaded one.
  const originalSetup = myGameWrapper.setup;
  myGameWrapper.setup = (context) => ({
    ...originalSetup!(context),
    ...savedG
  });

  // Set all phases start to false by default. Then set phase from localStorage to true.
  for (const phaseName in myGameWrapper.phases) {
    if (myGameWrapper.phases[phaseName]) {
      myGameWrapper.phases[phaseName].start = false;
    }
  }
  myGameWrapper.phases[savedctx.phase].start = true;
  
  // Guesser player starts the turn (even if the phase turn order specifies otherwise)
  const originalTurnOrder = myGameWrapper.phases[savedctx.phase].turn;
  let forceFirstPlayer = true;
  if (originalTurnOrder?.order?.first) {
    myGameWrapper.phases[savedctx.phase].turn = {
      ...originalTurnOrder,
      order: {
        first: (state) => {
          if (forceFirstPlayer) {
            forceFirstPlayer = false;
            return Number(GUESSER_PLAYER);
          }
          return originalTurnOrder.order!.first!(state);
        },
        next: (state) => {
          return originalTurnOrder.order!.next!(state);
        },
      }
    }
  }

  // End game if the game ended in the saved state
  if (savedctx.gameover) {
    myGameWrapper = injectFuncOnBeginTurn(myGameWrapper, (state: any) => {
      state.events.endGame();
    });
  }
  
  return myGameWrapper;
}
