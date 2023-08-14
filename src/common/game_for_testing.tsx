import { Ctx } from "boardgame.io";
import { RandomAPI } from "boardgame.io/dist/types/src/plugins/random/random";
import { BruteForcedPlayerIDExtension, GameStateMixin, GameType, PlayerIDType, SetupFunction, StartingPositionFunction } from "./types";

type G = { data: string };

export function createGameWithMoveWithoutStartingPosition(setup: SetupFunction<G>,
  move: ({ G, ctx, playerID, random }: { G: G, ctx: Ctx, playerID: string, random: RandomAPI, }, ...args: any[]) => GameStateMixin & G
  ): GameType<G> {
  // Wraps move in a function so that it is registered as function (solves `invalid move object` error)
  const game: GameType<G> = {
    name: "stub-game",
    setup,
    moves: {
      move: (...args) =>  move(...args), // TODO make the as type here to work, so it can be used with the proper signature
    },
    possibleMoves: () => [],
  };
  return game;
}

export function createGameWithMove(setup: SetupFunction<G>, startingPosition: StartingPositionFunction<G>,
  move: ({ G, ctx, playerID, random }: { G: G, ctx: Ctx; playerID: string; random: RandomAPI; }, ...args: any[]) => GameStateMixin & G): GameType<G> {
  // Wraps move in a function so that it is registered as function (solves `invalid move object` error)
  const game: GameType<G> = {
    name: "stub-game",
    setup,
    startingPosition: (...args) => startingPosition(...args), // TODO make the as type here to work, so it can be used with the proper signature
    moves: {
      move: (...args) => move(...args),
    },
    possibleMoves: () => [],
  };
  return game;
}

export function createGameWithoutStartingPosition(setup: SetupFunction<G>): GameType<G> {
  // Wraps move in a function so that it is registered as function (solves `invalid move object` error)
  const game: GameType<G> = {
    name: "stub-game",
    setup,
    moves: {
      win: ({ G, events }) => {
        G.winner = '0';
        if (G.difficulty === "live") {
          if (G.winner === "0") {
            G.winningStreak = G.winningStreak + 1;
            if (G.winningStreak >= 2) {
              switch (G.numberOfLoss) {
                case 0:
                  G.points = 12;
                  break;
                case 1:
                  G.points = 9;
                  break;
                case 2:
                  G.points = 6;
                  break;
                case 3:
                  G.points = 4;
                  break;
                case 4:
                  G.points = 3;
                  break;
                default:
                  G.points = 2;
                  break;
              }
              events.endGame();
            }
          } else if (G.winner === "1") {
            G.winningStreak = 0;
            G.numberOfLoss += 1;
          }
        }
        events.endTurn();
      },
      lose: ({ G, events }) => {
        G.winner = '1';
        if (G.difficulty === "live") {
          if (G.winner === "1") {
            G.winningStreak = 0;
            G.numberOfLoss += 1;
          }
        }
        events.endTurn();
      },
    },
    possibleMoves: () => [],
  };
  return game;
}

