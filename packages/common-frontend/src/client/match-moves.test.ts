import { beforeEach, describe, expect, test, vi } from "vitest";
import { Client } from "boardgame.io/client";
import { GameRelay } from "game";
import { asMatchTimeMoves, asRelayMoves, MatchMoveDispatch } from "./match-moves";

// Uninitialised, i18next's `t` answers with nothing at all, which would make the
// assertions below read `Error: undefined`; the apps initialise it, a unit test
// has no reason to.
vi.mock("i18next", () => ({ default: { t: (key: string) => key } }));

class Repo extends MatchMoveDispatch { }

const online = { isMultiplayer: true, isConnected: true };
const dropped = { isMultiplayer: true, isConnected: false };
// What boardgame.io reports for a build with no transport: it leaves
// `isConnected` false because there is no socket to have connected.
const local = { isMultiplayer: false, isConnected: false };

let repo: Repo;
let moves: { submitAnswer: ReturnType<typeof vi.fn>, startGame: ReturnType<typeof vi.fn>, getTime: ReturnType<typeof vi.fn> };

beforeEach(() => {
  repo = new Repo();
  moves = { submitAnswer: vi.fn(), startGame: vi.fn(), getTime: vi.fn() };
});

describe("narrowing a board's moves", () => {
  // The point of the narrowing: rename a move in the game and this fails here,
  // rather than calling `undefined` in the middle of a round.
  test("the relay game's own client satisfies the relay moves", () => {
    const client = Client({ game: GameRelay, numPlayers: 2 });
    client.start();

    expect(() => asRelayMoves(client.moves)).not.toThrow();
    expect(() => asMatchTimeMoves(client.moves)).not.toThrow();
  });

  test("a missing move is named", () => {
    expect(() => asRelayMoves({ getTime: () => undefined }))
      .toThrow("the board is missing the move(s): submitAnswer, startGame");
  });

  test("the timer narrowing asks only for the timer move", () => {
    expect(() => asMatchTimeMoves({ getTime: () => undefined })).not.toThrow();
  });
});

describe("submitting an answer", () => {
  test("dispatches the move and resolves while the socket is up", async () => {
    await expect(repo.submitRelayAnswer(120, moves, online)).resolves.toBeUndefined();

    expect(moves.submitAnswer.mock.calls).toStrictEqual([[120]]);
  });

  // The failure PR #372 left silent: boardgame.io hands the move to a bare
  // `socket.emit` with no acknowledgement, so with the socket down socket.io
  // buffers it and drops it if the reconnect fails.
  test("rejects when the socket is down, having dispatched anyway", async () => {
    await expect(repo.submitRelayAnswer(120, moves, dropped)).rejects.toThrow("error.disconnected");

    expect(moves.submitAnswer.mock.calls).toStrictEqual([[120]]);
  });

  test("a build with no socket is not warned about one", async () => {
    await expect(repo.submitRelayAnswer(120, moves, local)).resolves.toBeUndefined();
  });

  // Regression: the repository's promise is the caller's only error channel,
  // so a move that throws has to arrive through it rather than past it.
  test("a throwing move rejects rather than escaping the call", async () => {
    moves.submitAnswer.mockImplementation(() => { throw new Error("boom"); });

    await expect(repo.submitRelayAnswer(120, moves, online)).rejects.toThrow("boom");
  });
});

describe("the other two actions", () => {
  test("starting the match warns about a dropped socket too", async () => {
    await expect(repo.startRelayGame(moves, dropped)).rejects.toThrow("error.disconnected");

    expect(moves.startGame.mock.calls).toStrictEqual([[]]);
  });

  // The timer poll comes round again a second later, so warning about it would
  // bury the warnings that matter.
  test("the timer sync never warns about the connection", async () => {
    await expect(repo.syncMatchTime(moves)).resolves.toBeUndefined();

    expect(moves.getTime.mock.calls).toStrictEqual([[]]);
  });

  test("the timer sync still reports a throwing move", async () => {
    moves.getTime.mockImplementation(() => { throw new Error("boom"); });

    await expect(repo.syncMatchTime(moves)).rejects.toThrow("boom");
  });
});
