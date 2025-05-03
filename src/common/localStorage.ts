import { Game } from "boardgame.io";
import { IS_OFFLINE_MODE } from "../client/utils/util";
import { GameStateTimer, GUESSER_PLAYER } from "./types";

function parseGameState<T_SpecificGameState>(json: string): T_SpecificGameState {
  const parsed = JSON.parse(json);
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('strategy: game_state_from_json: Invalid JSON: not an object');
  }
  return parsed as T_SpecificGameState;
}

function saveGameState({ G, ctx }: any, gameName: string) {
  if (!IS_OFFLINE_MODE) {
    return;
  }
  localStorage.setItem(gameName + "GameState", JSON.stringify(G));
  localStorage.setItem(gameName + "Phase", ctx.phase);
}

function loadGameStateFromLocalStorage<T_SpecificGameState>(gameName: string): { savedG?: T_SpecificGameState & GameStateTimer, savedPhase?: string } {
  const savedPhase = localStorage.getItem(gameName + "Phase");
  const gameStateJSON = localStorage.getItem(gameName + "GameState");
  if (savedPhase === null || gameStateJSON === null) {
    return {};
  }

  let savedG;
  try { // if the json is bad, continue as if we didnt even have it
    savedG = parseGameState<T_SpecificGameState & GameStateTimer>(gameStateJSON);
  } catch {
    localStorage.removeItem(gameName + "Phase");;
    localStorage.removeItem(gameName + "GameState");;
    console.error("could not load game phase from json, invalid json");
    return {};
  }

  savedG.millisecondsRemaining = new Date(savedG.end).getTime() - new Date().getTime();
  return { savedG, savedPhase };
}

export function setupLocalStorageGameState<T_SpecificGameState>(myGameWrapper: Game<T_SpecificGameState & GameStateTimer>) {
  const gameName = myGameWrapper.name;
  if (!gameName) {
    throw new Error("Gamename is not defined. Local storage game state save is not possible.");
  }
  const { savedG, savedPhase } = loadGameStateFromLocalStorage(gameName);

  // Save the game state to localStorage for onBegin guesser's turn
  for (const phaseName in myGameWrapper.phases) {
    const originalOnBeginTurn = myGameWrapper.phases[phaseName].turn?.onBegin;
    myGameWrapper.phases[phaseName].turn = {
      ...myGameWrapper.phases[phaseName].turn,
      onBegin: (state) => {
        if (originalOnBeginTurn) {
          originalOnBeginTurn(state);
        }
        if (state.ctx.currentPlayer === GUESSER_PLAYER) {
          saveGameState(state, gameName);
        }
      },
    }
  }

  if (!myGameWrapper.phases || !savedPhase) {
    return myGameWrapper; // No loaded state.
  }

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
  myGameWrapper.phases[savedPhase].start = true;

  // Guesser player starts the turn (even if the phase turn order specifies otherwise)
  const originalTurnOrder = myGameWrapper.phases[savedPhase].turn;
  let forceFirstPlayer = true;
  if (originalTurnOrder?.order?.first) {
    myGameWrapper.phases[savedPhase].turn = {
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
  return myGameWrapper;
}
