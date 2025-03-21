import { Game } from "boardgame.io";
import { INVALID_MOVE, TurnOrder } from "boardgame.io/core";
import { sendDataRelayEnd } from "../../common/sendData";

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

function parse_game_state(json: string): MyGameState {
  const parsed = JSON.parse(json);
  
  // Validate the parsed object
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('relay: game_state_from_json: Invalid JSON: not an object');
  }

  // Type assertion to avoid repetitive type checks
  const state = parsed as MyGameState;

  return state;
}

const lengthOfCompetition = 60 * 60; // seconds

const GUESSER_PLAYER = '0';
const JUDGE_PLAYER = '1';

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
          let phase = localStorage.getItem("RelayGamePhase");
          let game_state_json = localStorage.getItem("RelayGameState");
          if (process.env.REACT_APP_WHICH_VERSION === "b" && phase !== null && game_state_json !== null) {
            try { // if the json is bad, continue as if we didnt even have it
              const state = parse_game_state(game_state_json);
              const newGame = {
                ...state,
                milisecondsRemaining: Date.parse(state.end) - Date.now(),
              };
              events.setPhase(phase);
              return newGame;
            } catch {
              console.error("could not load game phase from json, invalid json");
            }
          }
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
            if (process.env.REACT_APP_WHICH_VERSION === "b") {
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
            if (process.env.REACT_APP_WHICH_VERSION === "b") {
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
          if (playerID !== GUESSER_PLAYER) {
            return INVALID_MOVE;
          }
          G.milisecondsRemaining = new Date(G.end).getTime() - new Date().getTime();
        }
      },
    },
  },
  turn: {
    onMove: ({G, ctx, playerID, events }) => {
      if(playerID === GUESSER_PLAYER) {
        let currentTime = new Date();
        if(currentTime.getTime() - new Date(G.end).getTime() > 1000*10){
          // Do not accept any answer if the time is over since more than 10 seconds
          events.endGame();
        }
      }
    },
    onEnd: ({ G, ctx, events }) => {
      // playerID is not available here
      if (ctx.currentPlayer.toString() === GUESSER_PLAYER) {
        const state_str = JSON.stringify(G);
        localStorage.setItem("RelayGamePhase", ctx.phase);
        localStorage.setItem("RelayGameState", state_str);
      }
      if (ctx.currentPlayer.toString() === JUDGE_PLAYER) {
        let currentTime = new Date();
        if (currentTime.getTime() - new Date(G.end).getTime() >= 0) {
          // Do not accept any answer if the time is over
          events.endGame();
        }
      }
    },
  },

  ai: {
    enumerate: (G, ctx, playerID) => {
      return [];
    }
  }
}
