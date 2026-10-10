import { Ctx, Game } from "boardgame.io";
import { INVALID_MOVE, TurnOrder } from "boardgame.io/core";
import { GUESSER_PLAYER, JUDGE_PLAYER, otherPlayer, PlayerIDType } from "../../common/types";

interface Answer {
  answer: number;
  date: string;
}

export interface MyGameState {
  currentProblem: number;
  problemText: string;
  answer: number | null;
  points: number;
  correctnessPreviousAnswer: boolean | null;
  previousAnswers: Answer[][];
  previousPoints: number[];
  currentProblemMaxPoints: number;
  // Every problem's max points, in order: what each problem is worth on its
  // first try, and what the end tables show for problems not reached yet.
  maxPointsList: number[];
  numberOfTry: number;
  millisecondsRemaining: number;
  start: string;
  end: string;
  url: string;
}

const lengthOfCompetition = 60 * 60; // seconds

// What the wrapper reports after each answered step and when the play phase
// ends; hosts accept a superset of this shape (the offline frontend's
// SendGameDataParams).
export interface RelayStepReport {
  component: "relay";
  phase: "step";
  answer: number;
  G: MyGameState;
  ctx: Ctx;
}

export interface RelayEndReport {
  component: "relay";
  phase: "end";
  G: MyGameState;
  ctx: Ctx;
}

export type RelayReport = RelayStepReport | RelayEndReport;

export function RelayWrapper(sendRelayFunction: (_report: RelayReport) => void = () => undefined): Game<MyGameState> {
  const GameRelay: Game<MyGameState> = {
    name: "relay",
    setup: () => {
      return {
        currentProblem: 0,
        // The judge's firstProblem move fills in the problem fields: the game
        // does not hold the problem bank, which the live client must not ship.
        problemText: "",
        answer: null,
        points: 0,
        correctnessPreviousAnswer: null,
        previousAnswers: [[]],
        previousPoints: [],
        currentProblemMaxPoints: 0,
        maxPointsList: [],
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
          startGame: ({ G, _ctx, playerID, events }) => {
            if (playerID !== GUESSER_PLAYER || G.numberOfTry !== 0) {
              return INVALID_MOVE;
            }
            events.endTurn();
          },
          firstProblem({ G, _ctx, playerID, events }, problemText: string, maxPointsList: number[], url: string) {
            if (playerID !== JUDGE_PLAYER) {
              // He is not the bot OR G.answer is null (and it is not the first question)
              return INVALID_MOVE;
            }
            G.url = url;
            G.problemText = problemText;
            G.maxPointsList = maxPointsList;
            G.currentProblemMaxPoints = maxPointsList[G.currentProblem];
            G.numberOfTry = 1;
            events.endTurn();
          },
        },
        turn: {
          order: TurnOrder.ONCE,
          onMove: ({ G, _ctx, playerID, events }) => {
            if (playerID === GUESSER_PLAYER) {
              const currentTime = new Date();
              if (currentTime.getTime() - new Date(G.end).getTime() > 1000 * 10) {
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
            next: ({ ctx }) => {
              return Number(otherPlayer(ctx.currentPlayer as PlayerIDType));
            }
          },
          onMove: ({ G, ctx, playerID, events }) => {
            if (playerID === GUESSER_PLAYER) {
              const currentTime = new Date();
              // Only submitAnswer leaves G.answer set; a clock poll doesn't. Reported
              // here, not in the move, because under `Local` a move runs on the
              // client and the master, a turn hook only on the master.
              if (G.answer !== null) {
                sendRelayFunction({ component: "relay", phase: "step", answer: G.answer, G: G, ctx: ctx });
              }
              if (currentTime.getTime() - new Date(G.end).getTime() > 1000 * 10) {
                // Do not accept any answer if the time is over since more than 10 seconds
                events.endGame();
              }
            }
          },
          onEnd: ({ G, ctx, _playerID, events }) => {
            if (ctx.currentPlayer === JUDGE_PLAYER) {
              const currentTime = new Date();
              if (currentTime.getTime() - new Date(G.end).getTime() >= 0) {
                events.endGame();
              }
            }
          }
        },
        onEnd: ({ G, ctx, _playerID, _events, _random, _log }) => {
          sendRelayFunction({ component: "relay", phase: "end", G: G, ctx: ctx });
        },
        moves: {
          newProblem({ G, _ctx, playerID, events }, problemText: string, correctnessPreviousAnswer: boolean, url: string) {
            if (playerID !== JUDGE_PLAYER || G.answer === null) {
              // He is not the bot OR G.answer is null (and it is not the first question)
              return INVALID_MOVE;
            }
            G.url = url;
            G.previousAnswers[G.currentProblem].push({ answer: G.answer, date: new Date().toISOString() });
            G.problemText = problemText;
            G.previousAnswers.push(Array(0));
            G.correctnessPreviousAnswer = correctnessPreviousAnswer;
            if (correctnessPreviousAnswer) {
              G.points += G.currentProblemMaxPoints;
              G.previousPoints[G.currentProblem] = G.currentProblemMaxPoints;
            } else {
              G.previousPoints[G.currentProblem] = 0;
            }
            G.answer = null;
            G.currentProblem++;
            G.currentProblemMaxPoints = G.maxPointsList[G.currentProblem];
            G.numberOfTry = 1;
            events.endTurn();
          },
          nextTry({ G, _ctx, playerID, events }, maxPoints: number) {
            if (playerID !== JUDGE_PLAYER || G.answer === null) {
              return INVALID_MOVE;
            }
            G.previousAnswers[G.currentProblem].push({ answer: G.answer, date: new Date().toISOString() });
            G.answer = null;
            G.correctnessPreviousAnswer = false;
            G.numberOfTry++;
            G.currentProblemMaxPoints = maxPoints;
            events.endTurn();
          },
          submitAnswer({ G, _ctx, playerID, events }, answer: number) {
            if (playerID !== GUESSER_PLAYER || !Number.isInteger(answer) || answer < 0 || answer > 9999) {
              return INVALID_MOVE;
            }
            G.answer = answer;
            events.endTurn();
          },
          endGame({ G, _ctx, playerID, events }, correctnessPreviousAnswer: boolean) {
            if (playerID !== JUDGE_PLAYER || G.answer === null) {
              return INVALID_MOVE;
            }
            G.previousAnswers[G.currentProblem].push({ answer: G.answer, date: new Date().toISOString() });
            G.correctnessPreviousAnswer = correctnessPreviousAnswer;
            if (correctnessPreviousAnswer) {
              G.points += G.currentProblemMaxPoints;
              G.previousPoints[G.currentProblem] = G.currentProblemMaxPoints;
            } else {
              G.previousPoints[G.currentProblem] = 0;
            }
              events.endGame();
          },
          getTime({ G, _ctx, playerID, _events }) {
            if (playerID !== GUESSER_PLAYER) {
              return INVALID_MOVE;
            }
            G.millisecondsRemaining = new Date(G.end).getTime() - new Date().getTime();
          }
        },
      },
    },

    ai: {
      enumerate: (_G, _ctx, _playerID) => {
        return [];
      }
    }
  }

  return GameRelay;
}

export const GameRelay = RelayWrapper();
