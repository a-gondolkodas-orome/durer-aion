import { Ctx } from "boardgame.io";
import { RandomAPI } from "boardgame.io/dist/types/src/plugins/random/random";
import { GameStateMixin, GameType, SetupFunction, StartingPositionFunction } from "./types";

type G = { data: string };

export function createGameWithMove(setup: SetupFunction<G>, startingPosition: StartingPositionFunction<G>,
  move: ({ G, ctx, playerID, random }: { G: G, ctx: Ctx; playerID: string; random: RandomAPI; }, ...args: any[]) => GameStateMixin & G): GameType<G> {
  // Wraps move in a function so that it is registered as function (solves `invalid move object` error)
  const game: GameType<G> = {
    name: "stub-game",
    setup,
    startingPosition,
    moves: {
      move: ({ G, ctx, playerID, random }, ...args) => { return move({ G, ctx, playerID, random }, ...args) },
    },
    possibleMoves: () => [null, "move"],
  };
  return game;
}

export function createGame(setup: SetupFunction<G>, startingPosition: StartingPositionFunction<G>): GameType<G> {
  // Wraps move in a function so that it is registered as function (solves `invalid move object` error)
  const game: GameType<G> = {
    name: "stub-game",
    setup,
    startingPosition,
    moves: {
      win: (G) => { G.winner = '0'; },
      lose: (G) => { G.winner = '1'; },
    },
    possibleMoves: () => [null, "move"],
  };
  return game;
}

