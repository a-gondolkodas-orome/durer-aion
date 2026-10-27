import { Ctx } from "boardgame.io";
import { GameStateMixin, GameType, GUESSER_PLAYER, JUDGE_PLAYER, RandomAPI, SetupFunction, StartingPositionFunction, strategyPoints } from "./types";

interface G { data: string }

export function createGameWithMoveWithoutStartingPosition(setup: SetupFunction<G>,
  move: ({ G, ctx, playerID, random }: { G: G, ctx: Ctx; playerID: string; random: RandomAPI; }, ...args: unknown[]) => GameStateMixin & G): GameType<G> {
  // Wraps move in a function so that it is registered as function (solves `invalid move object` error)
  const game: GameType<G> = {
    name: "stub-game",
    setup,
    moves: {
      move: (...args) => move(...args),
    },
    possibleMoves: () => [{ move: "move" }],
  };
  return game;
}

// The variant for a game that defines `startingPosition`. Neither game in this repo
// does, so only a year's private game exercises it.
export function createGameWithMove(setup: SetupFunction<G>, startingPosition: StartingPositionFunction<G>,
  move: ({ G, ctx, playerID, random }: { G: G, ctx: Ctx; playerID: string; random: RandomAPI; }, ...args: unknown[]) => GameStateMixin & G): GameType<G> {
  // Wraps move in a function so that it is registered as function (solves `invalid move object` error)
  const game: GameType<G> = {
    name: "stub-game",
    setup,
    startingPosition: (...args) => startingPosition(...args),
    moves: {
      move: (...args) => move(...args),
    },
    possibleMoves: () => [{ move: "move" }],
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
        G.winner = GUESSER_PLAYER;
        if (G.difficulty === "live") {
          if (G.winner === "0") {
            G.winningStreak = G.winningStreak + 1;
            if (G.winningStreak >= 2) {
              G.points = strategyPoints(G.numberOfLoss);
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
        G.winner = JUDGE_PLAYER;
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

