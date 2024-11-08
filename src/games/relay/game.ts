import { Game, TurnConfig } from "boardgame.io";
import { INVALID_MOVE, TurnOrder } from "boardgame.io/core";
import { sendDataRelayEnd } from "../../common/sendData";
import { PlayerIDType } from "../../common/types";

const { guesserPlayer, judgePlayer } = PlayerIDType;

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

function parseGameState(json: string): MyGameState {
  const parsed = JSON.parse(json);

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('relay: game_state_from_json: Invalid JSON: not an object');
  }
  return parsed as MyGameState;
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
      currentProblemMaxPoints: 3, // TODO: get from the problem list, TODO: rename this function to currentProblemAvailablePoints
      numberOfTry: 0,
      milisecondsRemaining: 1000 * lengthOfCompetition,
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
          if (process.env.REACT_APP_WHICH_VERSION === "a") {
            if (playerID !== guesserPlayer || G.numberOfTry !== 0) {
              return INVALID_MOVE;
            }
            events.endTurn();
          }

          const phase = localStorage.getItem("RelayGamePhase");
          const gameStateJSON = localStorage.getItem("RelayGameState");
          if (phase === null || gameStateJSON === null) {
            events.endTurn();
            return;
          }

          let state;
          try { // if the json is bad, continue as if we didnt even have it
            state = parseGameState(gameStateJSON);
          } catch {
            events.endTurn();
            console.error("could not load game phase from json, invalid json");
            return;
          }

          events.setPhase(phase);
          state.milisecondsRemaining = Date.parse(state.end) - Date.now();
          return state;
        },
        firstProblem({ G, ctx, playerID, events }, problemText: string, nextProblemMaxPoints: number, url: string) {
          if (playerID !== judgePlayer) {
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
          if(playerID === guesserPlayer) {
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
            return ctx.currentPlayer === guesserPlayer ? 1 : 0;
          }
        },
        onMove: ({G, ctx, playerID, events }) => {
          if(playerID === guesserPlayer) {
            let currentTime = new Date();
            if(currentTime.getTime() - new Date(G.end).getTime() > 1000*10){
              // Do not accept any answer if the time is over since more than 10 seconds
              events.endGame();
            }
          }
        },
        onEnd: ({G, ctx, playerID, events}) => {
          if (ctx.currentPlayer === judgePlayer && process.env.REACT_APP_WHICH_VERSION === "b") {
            const stateJSON = JSON.stringify(G);
            console.log("G ", G);
            localStorage.setItem("RelayGamePhase", ctx.phase);
            localStorage.setItem("RelayGameState", stateJSON);
          }

          if (ctx.currentPlayer.toString() === judgePlayer) {
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
          if (playerID !== judgePlayer || G.answer === null) {
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
            if (isOfflineMode()) {
              localStorage.setItem("RelayPoints", G.points.toString());
            }
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
          if (playerID !== judgePlayer || G.answer === null) {
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
          if (playerID !== guesserPlayer || !Number.isInteger(answer) || answer < 0 || answer > 9999) {
            return INVALID_MOVE;
          }
          G.answer = answer;
          events.endTurn();
        },
        endGame({ G, ctx, playerID, events }, correctnessPreviousAnswer: boolean) {
          if (playerID !== judgePlayer || G.answer === null) {
            return INVALID_MOVE;
          }
          G.previousAnswers[G.currentProblem].push({answer: G.answer, date: new Date().toISOString()});
          G.correctnessPreviousAnswer = correctnessPreviousAnswer;
          if (correctnessPreviousAnswer) {
            G.points += G.currentProblemMaxPoints;
            if (isOfflineMode()) {
              localStorage.setItem("RelayPoints", G.points.toString());
              sendDataRelayEnd(null, G, ctx);
            }
            G.previousPoints[G.currentProblem] = G.currentProblemMaxPoints;
          } else {
            G.previousPoints[G.currentProblem] = 0;
          }
            events.endGame();
        },
        getTime({ G, ctx, playerID, events }) {
          if (playerID !== guesserPlayer) {
            return INVALID_MOVE;
          }
          G.milisecondsRemaining = new Date(G.end).getTime() - new Date().getTime();
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
