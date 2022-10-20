import { Game } from "boardgame.io";
import { INVALID_MOVE, TurnOrder } from "boardgame.io/core";
import { useTeamState } from "../../client/hooks/user-hooks";
import { sendDataRelayEnd, sendDataRelayStart, sendDataRelayStep } from "../../common/sendData";

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
  milisecondsRemaining: number;
  start: string;
  end: string;
  url: string;
}

const lengthOfCompetition = 60 * 60; // seconds

export const GameRelay: Game<MyGameState> = {
  setup: () => {
    return {
    currentProblem: 0,
    problemText: "", // TODO: get from the problem list
    answer: null,
    points: 0,
    correctnessPreviousAnswer: null,
    previousAnswers: [[]],
    previousPoints: [],
    currentProblemMaxPoints: 3, // TODO: get from the problem list
    numberOfTry: 0,
    milisecondsRemaining: 1000 * lengthOfCompetition,
    start: new Date().toISOString(),
    end: new Date(Date.now() + 1000 * lengthOfCompetition).toISOString(),
    url: "",
  }},
  phases:
  {
    startNewGame: {
      moves: {
        startGame: ({ G, ctx, playerID, events }) => {
          if (playerID !== "0" || G.numberOfTry !== 0) {
            return INVALID_MOVE;
          }
          events.endTurn();
        },
        firstProblem({ G, ctx, playerID, events }, problemText: string, nextProblemMaxPoints: number, url: string) {
          if (playerID !== "1") {
            // He is not the bot OR G.answer is null (and it is not the first question)
            return INVALID_MOVE;
          }
          G.url = url;
          G.problemText = problemText;
          G.numberOfTry = 1;
          events.endTurn();
          console.log("end")
        },
      },
      turn: {  
        order: TurnOrder.ONCE,
        onMove: ({G, ctx, playerID, events }) => {
          console.log("onMove")
          if(playerID === "0") {
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
      moves: {
        newProblem({ G, ctx, playerID, events }, problemText: string, nextProblemMaxPoints: number, correctnessPreviousAnswer: boolean, url: string) {
          if (playerID !== "1" || G.answer === null) {
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
          if (playerID !== "1" || G.answer === null) {
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
          if (playerID !== "0" || !Number.isInteger(answer) || answer < 0 || answer > 9999) {
            return INVALID_MOVE;
          }
          G.answer = answer;
          events.endTurn();
        },
        endGame({ G, ctx, playerID, events }) {
          if (playerID !== "1") {
            return INVALID_MOVE;
          }
            events.endGame();
        },
        getTime({ G, ctx, playerID, events }) {
          if (playerID !== "0") {
            return INVALID_MOVE;
          }
          G.milisecondsRemaining = new Date(G.end).getTime() - new Date().getTime();
        }
      },
      turn: {
        onMove: ({G, ctx, playerID, events }) => {
          console.log("onMove")
          if(playerID === "0") {
            let currentTime = new Date();
            if(currentTime.getTime() - new Date(G.end).getTime() > 1000*10){
              // Do not accept any answer if the time is over since more than 10 seconds
              events.endGame();
            }
          }
        },    
      }
    },
    turn: {
      onEnd: ({ G, ctx, playerID, events }) => {
        if (playerID === "1") {
          let currentTime = new Date();
          if (currentTime.getTime() - new Date(G.end).getTime() <= 0) {
            console.log("onEnd")
            // Do not accept any answer if the time is over
            events.endGame();
          }
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
