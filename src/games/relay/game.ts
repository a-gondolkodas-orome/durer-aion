import { Game } from "boardgame.io";
import { INVALID_MOVE } from "boardgame.io/core";

export interface MyGameState {
  numberOfProblem: number;
  problemText: string;
  answer: number | null;
  points: number;
  correctnessPreviousAnswer: boolean | null;
  previousAnswers: Array<Array<number>>;
  previousPoints: Array<number>;
  currentProblemMaxPoints: number;
}

export const GameRelay: Game<MyGameState> = {
  setup: () => ({
    numberOfProblem: 0,
    problemText: "1+1?",
    answer: null,
    points: 0,
    correctnessPreviousAnswer: null,
    previousAnswers: Array.from(Array(9), () => new Array(0)),
    previousPoints: [],
    currentProblemMaxPoints: 0,
  }),

  moves: {
    newProblem({ G, ctx, playerID }, problemText: string, nextProblemMaxPoints: number, correctnessPreviousAnswer: boolean) {
      if (playerID !== "1" || G.answer === null) {
        // He is not the bot OR G.answer is null
        return INVALID_MOVE;
      }
      G.problemText = problemText;
      G.previousAnswers[G.numberOfProblem].push(G.answer);
      G.correctnessPreviousAnswer = correctnessPreviousAnswer;
      if (correctnessPreviousAnswer) {
        G.previousPoints[G.numberOfProblem] = G.currentProblemMaxPoints;
      } else {
        G.previousPoints[G.numberOfProblem] = 0;
      }
      G.currentProblemMaxPoints = nextProblemMaxPoints;
      G.previousAnswers[G.numberOfProblem].push(G.answer);
      G.answer = null;
      G.numberOfProblem++;
    },
    nextTry({ G, ctx, playerID }) {
      if (playerID !== "1" || G.answer === null) {
        return INVALID_MOVE;
      }
      G.answer = null;
      G.correctnessPreviousAnswer = false;
      G.currentProblemMaxPoints--;
    },
    submitAnswer({ G, ctx, playerID }, answer: number) {
      if (playerID !== "0" || !Number.isInteger(answer) || answer < 0 || answer > 9999) {
        return INVALID_MOVE;
      }
      G.answer = answer;
      G.previousAnswers[G.numberOfProblem].push(G.answer);
    }
  },
  turn: {
    minMoves: 1,
    maxMoves: 1,
  },
}
