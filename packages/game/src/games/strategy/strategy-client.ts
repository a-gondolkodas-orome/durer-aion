// The client half of the registries — see strategy-games.ts. The frontends
// import this through the `game/client` entry; the server never does.
import { MyBoard as StonesBoard } from "./stones/board";
import { MyBoard as Board19ocd } from "./19ocd/board";

export { descriptionC, descriptionD } from "./19ocd/main";
export { descriptionE } from "./stones/main";

const boards = {
  C: Board19ocd,
  D: Board19ocd,
  E: StonesBoard,
};

// Generic over the category so the caller keeps the board's own state type: a
// plain "C" | "D" | "E" parameter would widen the result to a union of boards,
// which no single game's client can accept.
export function MyBoardWrapper<T_Category extends keyof typeof boards>(category: T_Category): (typeof boards)[T_Category] {
  return boards[category];
}
