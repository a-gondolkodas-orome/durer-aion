import { Game } from "boardgame.io";
import { INVALID_MOVE, TurnOrder } from "boardgame.io/core";
import { sendDataRelayEnd } from "../../common/sendData";
import { GUESSER_PLAYER, JUDGE_PLAYER, otherPlayer, PlayerIDType } from "../../common/types";
import { IS_OFFLINE_MODE } from "../../client/utils/util";
import { setupLocalStorageGameState } from "../../common/localStorage";

type Answer = {
  answer: number;
  date: string;
}

export interface MyGameState {
  currentProblem: number;
  problemText: string;
  answer: number | null;
  points: number;
  correctnessPreviousAnswer: boolean | null;
  previousAnswers: Array<Array<Answer>>;
  previousPoints: Array<number>;
  currentProblemMaxPoints: number;
  numberOfTry: number;
  millisecondsRemaining: number;
  start: string;
  end: string;
  url: string;
}

const lengthOfCompetition = 60 * 60; // seconds

const GameRelayBase: Game<MyGameState> = {
  name: "relay",
  setup: () => {
    return {
      currentProblem: 0,
      problemText: "", // TODO: get from the problem list
      answer: null,
      points: 0,
      correctnessPreviousAnswer: null,
      previousAnswers: [[]],
      previousPoints: [],
      currentProblemMaxPoints: 3, // TODO: get from the problem list, TODO: rename this function to currentProblemAvailablePoints
      numberOfTry: 0,
      millisecondsRemaining: 1000 * lengthOfCompetition,
      start: new Date().toISOString(),
      end: new Date(Date.now() + 1000 * lengthOfCompetition).toISOString(),
      url: "",
    };
  },
  phases:
  {
    startNewGame: {
      moves: {
        startGame: ({ G, ctx, playerID, events }) => {
          if (playerID !== GUESSER_PLAYER || G.numberOfTry !== 0) {
            return INVALID_MOVE;
          }
          events.endTurn();
        },
        firstProblem({ G, ctx, playerID, events }, problemText: string, nextProblemMaxPoints: number, url: string) {
          if (playerID !== JUDGE_PLAYER) {
            // He is not the bot OR G.answer is null (and it is not the first question)
            return INVALID_MOVE;
          }
          G.url = url;
          G.problemText = problemText;
          G.numberOfTry = 1;
          events.endTurn();
        },
      },
      turn: {
        order: TurnOrder.ONCE,
        onMove: ({G, ctx, playerID, events }) => {
          if(playerID === GUESSER_PLAYER) {
            let currentTime = new Date();
            if(currentTime.getTime() - new Date(G.end).getTime() > 1000*10){
              // Do not accept any answer if the time is over since more than 10 seconds
              events.endGame();
            }
          }
        }
      },
      start: true,
      next: "play",
    },
    play: {
      turn: {
        order: {
          first: () => {
            return 0;
          },
          next: ({ctx}) => {
            return Number(otherPlayer(ctx.currentPlayer as PlayerIDType));
          }
        },
        onMove: ({G, ctx, playerID, events }) => {
          if(playerID === GUESSER_PLAYER) {
            let currentTime = new Date();
            if(currentTime.getTime() - new Date(G.end).getTime() > 1000*10){
              // Do not accept any answer if the time is over since more than 10 seconds
              events.endGame();
            }
          }
        },
        onEnd: ({G, ctx, playerID, events}) => {
          if (ctx.currentPlayer.toString() === JUDGE_PLAYER) {
            let currentTime = new Date();
            if (currentTime.getTime() - new Date(G.end).getTime() >= 0) {
              // Do not accept any answer if the time is over
              events.endGame();
            }
          }
        }
      },
      moves: {
        newProblem({ G, ctx, playerID, events }, problemText: string, nextProblemMaxPoints: number, correctnessPreviousAnswer: boolean, url: string) {
          if (playerID !== JUDGE_PLAYER || G.answer === null) {
            // He is not the bot OR G.answer is null (and it is not the first question)
            return INVALID_MOVE;
          }
          G.url = url;
          G.previousAnswers[G.currentProblem].push({answer: G.answer, date: new Date().toISOString()});
          G.problemText = problemText;
          G.previousAnswers.push(Array(0));
          G.correctnessPreviousAnswer = correctnessPreviousAnswer;
          if (correctnessPreviousAnswer) {
            G.points += G.currentProblemMaxPoints;
            G.previousPoints[G.currentProblem] = G.currentProblemMaxPoints;
          } else {
            G.previousPoints[G.currentProblem] = 0;
          }
          G.currentProblemMaxPoints = nextProblemMaxPoints;
          G.answer = null;
          G.currentProblem++;
          G.numberOfTry = 1;
          events.endTurn();
        },
        nextTry({ G, ctx, playerID, events }, maxPoints: number) {
          if (playerID !== JUDGE_PLAYER || G.answer === null) {
            return INVALID_MOVE;
          }
          G.previousAnswers[G.currentProblem].push({answer: G.answer, date: new Date().toISOString()});
          G.answer = null;
          G.correctnessPreviousAnswer = false;
          G.numberOfTry++;
          G.currentProblemMaxPoints = maxPoints;
          events.endTurn();
        },
        submitAnswer({ G, ctx, playerID, events }, answer: number) {
          if (playerID !== GUESSER_PLAYER || !Number.isInteger(answer) || answer < 0 || answer > 9999) {
            return INVALID_MOVE;
          }
          G.answer = answer;
          events.endTurn();
        },
        endGame({ G, ctx, playerID, events }, correctnessPreviousAnswer: boolean) {
          if (playerID !== JUDGE_PLAYER || G.answer === null) {
            return INVALID_MOVE;
          }
          G.previousAnswers[G.currentProblem].push({answer: G.answer, date: new Date().toISOString()});
          G.correctnessPreviousAnswer = correctnessPreviousAnswer;
          if (correctnessPreviousAnswer) {
            G.points += G.currentProblemMaxPoints;
            if (IS_OFFLINE_MODE) {
              sendDataRelayEnd(null, G, ctx);
            }
            G.previousPoints[G.currentProblem] = G.currentProblemMaxPoints;
          } else {
            G.previousPoints[G.currentProblem] = 0;
          }
            events.endGame();
        },
        getTime({ G, ctx, playerID, events }) {
          if (playerID !== GUESSER_PLAYER) {
            return INVALID_MOVE;
          }
          G.millisecondsRemaining = new Date(G.end).getTime() - new Date().getTime();
        }
      },
    },
  },

  ai: {
    enumerate: (G, ctx, playerID) => {
      return [];
    }
  }
}

export const GameRelay = IS_OFFLINE_MODE ? 
  setupLocalStorageGameState(GameRelayBase) : 
  GameRelayBase;
