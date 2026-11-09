import { Ctx, FnContext, Game, PlayerID } from "boardgame.io";
import { INVALID_MOVE, TurnOrder } from "boardgame.io/core";
import type { Localizable, RelayProblemResult } from "schemas";
import { timestampMoves } from "../../common/timestamp";
import { GUESSER_PLAYER, JUDGE_PLAYER, otherPlayer, PlayerIDType } from "../../common/types";

interface Answer {
  answer: number;
  date: string;
}

export interface MyGameState {
  currentProblem: number;
  // The current problem, the same in every language or in each of its own,
  // which the board picks from by the team's: a team can switch language
  // mid-match.
  problemText: Localizable<string>;
  answer: number | null;
  points: number;
  correctnessPreviousAnswer: boolean | null;
  previousAnswers: Answer[][];
  previousPoints: number[];
  // What a correct answer earns now: the judge lowers it after each wrong try.
  currentProblemAvailablePoints: number;
  // Every problem's max points, in order: what each problem is worth on its
  // first try, and what the end tables show for problems not reached yet.
  maxPointsList: number[];
  numberOfTry: number;
  millisecondsRemaining: number;
  start: string;
  end: string;
  // Empty, or absent in a language, where the problem has no image.
  imageUrl: Localizable<string>;
}

// The judge's moves' arguments, one tuple per move.
export type RelayMoveArgs =
  | [problemText: Localizable<string>, maxPointsList: number[], imageUrl: Localizable<string>] // firstProblem
  | [problemText: Localizable<string>, correctnessPreviousAnswer: boolean, imageUrl: Localizable<string>] // newProblem
  | [availablePoints: number] // nextTry
  | [correctnessPreviousAnswer: boolean]; // endGame

const secondsBetween = (from: string, to: string) =>
  Math.round((new Date(to).getTime() - new Date(from).getTime()) / 1000);

/**
 * Every problem of the set as the match stands, the ones not reached included.
 * A problem's first try is timed from the previous problem's last answer —
 * when it appeared — and each later try from the answer before it.
 */
export function relayProblemResults(G: Pick<MyGameState, "start" | "maxPointsList" | "previousPoints" | "previousAnswers">): RelayProblemResult[] {
  let shownAt = G.start;
  return G.maxPointsList.map((maxPoints, idx) => ({
    maxPoints,
    points: G.previousPoints[idx] ?? 0,
    trySeconds: (G.previousAnswers[idx] ?? []).map(it => {
      const seconds = secondsBetween(shownAt, it.date);
      shownAt = it.date;
      return seconds;
    }),
  }));
}

export const RELAY_DEFAULT_DURATION_MINUTES = 60;

// How many answers a problem takes at most. The game does not enforce it: the
// judge does, by serving the next problem after the last wrong one, which is
// also the only way to give a problem up.
export const RELAY_MAX_TRIES = 3;

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

/// A clock poll, not a step of the match, so it stays out of timestampMoves.
function getTime({ G, playerID }: FnContext<MyGameState> & { playerID: PlayerID }) {
  if (playerID !== GUESSER_PLAYER) {
    return INVALID_MOVE;
  }
  G.millisecondsRemaining = new Date(G.end).getTime() - new Date().getTime();
}

export interface RelayOptions {
  durationMinutes?: number;
}

export function RelayWrapper(
  sendRelayFunction: (_report: RelayReport) => void = () => undefined,
  { durationMinutes = RELAY_DEFAULT_DURATION_MINUTES }: RelayOptions = {},
): Game<MyGameState> {
  const durationMs = durationMinutes * 60 * 1000;
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
        currentProblemAvailablePoints: 0,
        maxPointsList: [],
        numberOfTry: 0,
        millisecondsRemaining: durationMs,
        start: new Date().toISOString(),
        end: new Date(Date.now() + durationMs).toISOString(),
        imageUrl: "",
      };
    },
    phases:
    {
      startNewGame: {
        moves: timestampMoves<MyGameState>({
          startGame: ({ G, _ctx, playerID, events }) => {
            if (playerID !== GUESSER_PLAYER || G.numberOfTry !== 0) {
              return INVALID_MOVE;
            }
            events.endTurn();
          },
          firstProblem({ G, _ctx, playerID, events }, problemText: Localizable<string>, maxPointsList: number[], imageUrl: Localizable<string>) {
            if (playerID !== JUDGE_PLAYER) {
              // Only the judge serves problems
              return INVALID_MOVE;
            }
            G.imageUrl = imageUrl;
            G.problemText = problemText;
            G.maxPointsList = maxPointsList;
            G.currentProblemAvailablePoints = maxPointsList[G.currentProblem];
            G.numberOfTry = 1;
            events.endTurn();
          },
        }),
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
        moves: { getTime, ...timestampMoves<MyGameState>({
          newProblem({ G, _ctx, playerID, events }, problemText: Localizable<string>, correctnessPreviousAnswer: boolean, imageUrl: Localizable<string>) {
            if (playerID !== JUDGE_PLAYER || G.answer === null) {
              // Only the judge serves problems, and only once an answer is in
              return INVALID_MOVE;
            }
            G.imageUrl = imageUrl;
            G.previousAnswers[G.currentProblem].push({ answer: G.answer, date: new Date().toISOString() });
            G.problemText = problemText;
            G.previousAnswers.push(Array(0));
            G.correctnessPreviousAnswer = correctnessPreviousAnswer;
            if (correctnessPreviousAnswer) {
              G.points += G.currentProblemAvailablePoints;
              G.previousPoints[G.currentProblem] = G.currentProblemAvailablePoints;
            } else {
              G.previousPoints[G.currentProblem] = 0;
            }
            G.answer = null;
            G.currentProblem++;
            G.currentProblemAvailablePoints = G.maxPointsList[G.currentProblem];
            G.numberOfTry = 1;
            events.endTurn();
          },
          nextTry({ G, _ctx, playerID, events }, availablePoints: number) {
            if (playerID !== JUDGE_PLAYER || G.answer === null) {
              return INVALID_MOVE;
            }
            G.previousAnswers[G.currentProblem].push({ answer: G.answer, date: new Date().toISOString() });
            G.answer = null;
            G.correctnessPreviousAnswer = false;
            G.numberOfTry++;
            G.currentProblemAvailablePoints = availablePoints;
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
              G.points += G.currentProblemAvailablePoints;
              G.previousPoints[G.currentProblem] = G.currentProblemAvailablePoints;
            } else {
              G.previousPoints[G.currentProblem] = 0;
            }
              events.endGame();
          },
        }) },
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
