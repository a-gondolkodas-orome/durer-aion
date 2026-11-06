// The client half of the registries — see strategy-games.ts. The frontends
// import this through the `game/client` entry; the server never does.
import { MyBoard as Board20ocde } from "./20ocde/board";

export { descriptionC, descriptionD, descriptionE } from "./20ocde/main";

const boards = {
  C: Board20ocde,
  D: Board20ocde,
  E: Board20ocde,
};

// Generic over the category so the caller keeps the board's own state type: a
// plain "C" | "D" | "E" parameter would widen the result to a union of boards,
// which no single game's client can accept.
export function MyBoardWrapper<T_Category extends keyof typeof boards>(category: T_Category): (typeof boards)[T_Category] {
  return boards[category];
}
