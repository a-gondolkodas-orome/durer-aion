import { Game } from "boardgame.io";
import { INVALID_MOVE } from "boardgame.io/core";

export interface MyGameState {
  currentProblem: number;
  problemText: string;
  answer: number | null;
  points: number;
  correctnessPreviousAnswer: boolean | null;
  previousAnswers: Array<Array<number>>;
  previousPoints: Array<number>;
  currentProblemMaxPoints: number;
  numberOfTry: number;
}

export const GameRelay: Game<MyGameState> = {
  setup: () => ({
    currentProblem: 0,
    problemText: "1+1?", // TODO: get from the problem list
    answer: null,
    points: 0,
    correctnessPreviousAnswer: null,
    previousAnswers: [[]],
    previousPoints: [],
    currentProblemMaxPoints: 3, // TODO: get from the problem list
    numberOfTry: 1,
  }),

  moves: {
    newProblem({ G, ctx, playerID }, problemText: string, nextProblemMaxPoints: number, correctnessPreviousAnswer: boolean, previousAnswers: string) {
      if (playerID !== "1" || G.answer === null) {
        // He is not the bot OR G.answer is null (and it is not the first question)
        return INVALID_MOVE;
      }
      G.previousAnswers[G.currentProblem].push(G.answer);
      G.problemText = problemText;
      G.previousAnswers.push(Array(0));
      G.correctnessPreviousAnswer = correctnessPreviousAnswer;
      if (correctnessPreviousAnswer) {
        G.previousPoints[G.currentProblem] = G.currentProblemMaxPoints;
      } else {
        G.previousPoints[G.currentProblem] = 0;
      }
      G.currentProblemMaxPoints = nextProblemMaxPoints;
      G.answer = null;
      G.currentProblem++;
      G.numberOfTry = 1;
    },
    nextTry({ G, ctx, playerID }, maxPoints: number) {
      if (playerID !== "1" || G.answer === null) {
        return INVALID_MOVE;
      }
      G.previousAnswers[G.currentProblem].push(G.answer);
      G.answer = null;
      G.correctnessPreviousAnswer = false;
      G.numberOfTry++;
      G.currentProblemMaxPoints = maxPoints;
    },
    submitAnswer({ G, ctx, playerID }, answer: number) {
      if (playerID !== "0" || !Number.isInteger(answer) || answer < 0 || answer > 9999) {
        return INVALID_MOVE;
      }
      G.answer = answer;
    }
  },
  turn: {
    minMoves: 1,
    maxMoves: 1,
  },
  ai: {
    enumerate: (G, ctx, playerID) => {
      return [];
    }
  }
}
