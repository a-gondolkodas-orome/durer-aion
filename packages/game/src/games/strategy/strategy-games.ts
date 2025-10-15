import {
  strategyWrapper as stonesStrategy,
  MyBoard as StonesBoard,
  MyGameWrapper as StonesGameWrapper,
  MyGameState as StonesGameState
} from "./stones";
import {
  strategyWrapper as Strategy19ocd,
  MyBoard as Board19ocd,
  MyGameWrapper as GameWrapper19ocd,
  MyGameState as GameState19ocd
} from "./19ocd";

export type MyGameStateC = GameState19ocd;
export type MyGameStateD = GameState19ocd;
export type MyGameStateE = StonesGameState;
export { descriptionC, descriptionD } from "./19ocd";
export { descriptionE } from "./stones";

export const StrategyWrappers = {
  C: () => Strategy19ocd("C"),
  D: () => Strategy19ocd("D"),
  E: () => stonesStrategy("E"),
}

export function MyBoardWrapper(category: "C" | "D" | "E") {
  switch (category) {
    case "C":
      return Board19ocd;
    case "D":
      return Board19ocd;
    case "E":
      return StonesBoard;
  }
}

export const MyGameWrappers = {
  C: () => GameWrapper19ocd("C"),
  D: () => GameWrapper19ocd("D"),
  E: () => StonesGameWrapper("E"),
}

export const strategyNames = {
  // need to be unique even if the game is the same
  // should also match up with the name defined in game.ts
  C: "19oc",
  D: "19od",
  E: "stones_e",
}