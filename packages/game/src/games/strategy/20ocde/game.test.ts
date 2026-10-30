import { describe, test, expect, afterEach, vi } from "vitest";
import { Client } from "boardgame.io/client";
import { gameWrapper } from "../../../common/gamewrapper";
import { GUESSER_PLAYER, LATE_MOVE_GRACE_MS } from "../../../common/types";
import { MyGameWrapper, startingPosition } from "./game";

// The moment the wrapper stamps the match from, and the deadline it carries.
const START = new Date("2026-03-21T18:00:00.000Z");
const END = new Date(START.getTime() + 30 * 60 * 1000);

afterEach(() => {
  vi.useRealTimers();
});

/// A live match in the play phase with the team to move, opened at `START`.
function playing() {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(START);
  const client = Client({ game: gameWrapper(MyGameWrapper("E")), numPlayers: 2 });
  client.start();
  client.moves.chooseNewGameType("live");
  client.moves.setStartingPosition(startingPosition("E"));
  client.moves.chooseRole(GUESSER_PLAYER);
  return client;
}

const at = (msPastTheEnd: number) => vi.setSystemTime(new Date(END.getTime() + msPastTheEnd));

describe("the 20ocde deadline", () => {
  test("a team's move within the allowance is taken", () => {
    const client = playing();

    at(LATE_MOVE_GRACE_MS - 1000);
    client.moves.placeMarks([0]);

    expect(client.getState()?.ctx.gameover).toBeUndefined();
    expect(client.getState()?.G.cells[0]).toStrictEqual("O");
  });

  test("a team's move past the allowance ends the match", () => {
    const client = playing();

    at(LATE_MOVE_GRACE_MS + 1000);
    client.moves.placeMarks([0]);

    expect(client.getState()?.ctx.gameover).toBe(true);
  });

  // Only the end of the judge's turn can end this match: `turn.onMove` looks at
  // the team's moves alone.
  test("the bot answering past the allowance ends the match", () => {
    const client = playing();
    at(LATE_MOVE_GRACE_MS - 1000);
    client.moves.placeMarks([0]);

    at(LATE_MOVE_GRACE_MS + 1000);
    client.moves.placeMarks([1, 2]);

    expect(client.getState()?.ctx.gameover).toBe(true);
  });

  // A match must not close while a move it has just taken is still on screen.
  test("the bot answering within the allowance leaves the match open", () => {
    const client = playing();
    at(1000);
    client.moves.placeMarks([0]);

    at(2000);
    client.moves.placeMarks([1, 2]);

    expect(client.getState()?.ctx.gameover).toBeUndefined();
    expect(client.getState()?.ctx.currentPlayer).toStrictEqual(GUESSER_PLAYER);
  });
});
