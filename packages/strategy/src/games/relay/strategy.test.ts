import { describe, test, afterEach, expect, vi } from "vitest";
import { State } from "boardgame.io";
import { Client } from "boardgame.io/client";
import { GameRelay, MyGameState } from "game";
import { relayStrategy, Problem } from "./strategy";

const problemList: Problem[] = [
  { problemText: "first", answer: 120, points: 2 },
  { problemText: "second", answer: 384, points: 3 },
];

const stateWith = (G: Partial<MyGameState>): State<MyGameState> =>
  ({ G } as State<MyGameState>);

// Regression: the firstProblem payload carried a hardcoded 3 instead of the
// problem's own points, wrong for any set not starting with a 3-point problem.
describe("relayStrategy", () => {
  test("first problem carries its own points", () => {
    const [args, move] = relayStrategy(problemList)(
      stateWith({ numberOfTry: 0, currentProblem: 0 }),
      "1",
    );

    expect(move).toStrictEqual("firstProblem");
    expect(args).toStrictEqual(["first", 2, ""]);
  });

  test("advancing carries the next problem's points", () => {
    const [args, move] = relayStrategy(problemList)(
      stateWith({ numberOfTry: 1, currentProblem: 0, answer: 120, currentProblemMaxPoints: 2 }),
      "1",
    );

    expect(move).toStrictEqual("newProblem");
    expect(args).toStrictEqual(["second", 3, true, ""]);
  });
});

// The relay round as a team plays it: the bot serves a problem, the team
// answers, and the bot judges it and serves the next one. Nothing else covers
// the two halves working together — the three tries and their shrinking value
// are split between the strategy (which decides) and the game (which scores).
describe("a relay round against the bot", () => {
  const startRound = () => {
    const client = Client({ game: GameRelay, numPlayers: 2 });
    client.start();
    client.moves.startGame();
    letTheBotAnswer(client);
    return client;
  };

  /// The bot's turn, as the server plays it: ask the strategy, dispatch what it
  /// asks for.
  const letTheBotAnswer = (client: ReturnType<typeof Client>) => {
    const [args, move] = relayStrategy(problemList)(
      client.getState() as State<MyGameState>,
      "1",
    );
    (client.moves[move] as (..._args: unknown[]) => void)(...args);
  };

  test("the round opens with the first problem, worth its full points", () => {
    const client = startRound();

    expect(client.getState()?.G.problemText).toStrictEqual("first");
    expect(client.getState()?.G.currentProblemMaxPoints).toStrictEqual(2);
    expect(client.getState()?.G.numberOfTry).toStrictEqual(1);
  });

  test("a wrong answer buys another try, worth one point less", () => {
    const client = startRound();

    client.moves.submitAnswer(1);
    letTheBotAnswer(client);

    expect(client.getState()?.G.numberOfTry).toStrictEqual(2);
    expect(client.getState()?.G.currentProblemMaxPoints).toStrictEqual(1);
    expect(client.getState()?.G.correctnessPreviousAnswer).toBe(false);
    expect(client.getState()?.G.problemText).toStrictEqual("first");
  });

  test("a later correct answer scores what the problem is still worth", () => {
    const client = startRound();

    client.moves.submitAnswer(1);
    letTheBotAnswer(client);
    client.moves.submitAnswer(120);
    letTheBotAnswer(client);

    expect(client.getState()?.G.points).toStrictEqual(1);
    expect(client.getState()?.G.previousPoints[0]).toStrictEqual(1);
    expect(client.getState()?.G.problemText).toStrictEqual("second");
  });

  test("the third wrong answer closes the problem with nothing scored", () => {
    const client = startRound();

    for (const wrongAnswer of [1, 2, 3]) {
      client.moves.submitAnswer(wrongAnswer);
      letTheBotAnswer(client);
    }

    expect(client.getState()?.G.points).toStrictEqual(0);
    expect(client.getState()?.G.previousPoints[0]).toStrictEqual(0);
    expect(client.getState()?.G.previousAnswers[0].map((a) => a.answer)).toStrictEqual([1, 2, 3]);
    expect(client.getState()?.G.currentProblem).toStrictEqual(1);
    expect(client.getState()?.G.numberOfTry).toStrictEqual(1);
  });

  test("answering the last problem ends the round with the score kept", () => {
    const client = startRound();

    client.moves.submitAnswer(120);
    letTheBotAnswer(client);
    client.moves.submitAnswer(384);
    letTheBotAnswer(client);

    expect(client.getState()?.ctx.gameover).toBeDefined();
    expect(client.getState()?.G.points).toStrictEqual(5);
  });
});

describe("relay answers", () => {
  const startRound = () => {
    const client = Client({ game: GameRelay, numPlayers: 2 });
    client.start();
    client.moves.startGame();
    client.moves.firstProblem("first", 2, "");
    return client;
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // The answer boxes are the only thing a team types into, so what the round
  // accepts is decided here rather than in the form.
  test("only a whole number between 0 and 9999 is accepted", () => {
    // boardgame.io reports every move it rejects on the console, and the four
    // below are rejected on purpose, so the test takes those messages rather
    // than leaving them in the report.
    const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);

    for (const rejected of [-1, 10000, 1.5, Number.NaN]) {
      const client = startRound();
      client.moves.submitAnswer(rejected);
      expect(client.getState()?.G.answer).toBeNull();
    }
    expect(logged).toHaveBeenCalledTimes(4);

    const client = startRound();
    client.moves.submitAnswer(9999);
    expect(client.getState()?.G.answer).toStrictEqual(9999);
  });
});
