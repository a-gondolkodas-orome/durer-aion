import { describe, test, expect, afterEach, vi } from "vitest";
import { Client } from "boardgame.io/client";
import { gameWrapper } from "../../../common/gamewrapper";
import { GUESSER_PLAYER, LATE_MOVE_GRACE_MS } from "../../../common/types";
import { MyGameWrapper } from "./game";

// The deadline the match carries, and the moment the wrapper stamps it from.
const START = new Date("2026-03-21T18:00:00.000Z");
const END = new Date(START.getTime() + 30 * 60 * 1000);

afterEach(() => {
  vi.useRealTimers();
});

/// A match in the play phase with the team to move, opened at `START`.
function playing() {
  vi.useFakeTimers();
  vi.setSystemTime(START);
  const client = Client({ game: gameWrapper(MyGameWrapper("E")), numPlayers: 2 });
  client.start();
  client.moves.chooseNewGameType("live");
  client.moves.setStartingPosition({ stonesLeft: 5, stonesRight: 5 });
  client.moves.chooseRole(GUESSER_PLAYER);
  return client;
}

const at = (msPastTheEnd: number) => vi.setSystemTime(new Date(END.getTime() + msPastTheEnd));

describe("the stones deadline", () => {
  test("the play phase is reached with the team to move", () => {
    const client = playing();

    expect(client.getState()?.ctx.phase).toStrictEqual("play");
    expect(client.getState()?.ctx.currentPlayer).toStrictEqual(GUESSER_PLAYER);
  });

  // A team that clicks as the clock hits zero should not lose the move to the
  // round trip.
  test("a move just after the end is still taken", () => {
    const client = playing();

    at(LATE_MOVE_GRACE_MS - 1000);
    client.moves.takeStone(false);

    expect(client.getState()?.ctx.gameover).toBeUndefined();
    expect(client.getState()?.G.stonesRight).toStrictEqual(4);
  });

  test("a move past the allowance ends the match", () => {
    const client = playing();

    at(LATE_MOVE_GRACE_MS + 1000);
    client.moves.takeStone(false);

    expect(client.getState()?.ctx.gameover).toBe(true);
  });

  // The guard this file is really about: `turn.onEnd` was handed an undefined
  // `playerID`, so `playerID === JUDGE_PLAYER` never matched and the match was
  // left open until the team happened to move again.
  test("the judge's turn ending past the allowance ends the match", () => {
    const client = playing();
    at(LATE_MOVE_GRACE_MS - 1000);
    client.moves.takeStone(false); // taken, and hands the turn to the judge

    at(LATE_MOVE_GRACE_MS + 1000);
    // The judge's own move, so `turn.onMove`'s guard — which only looks at the
    // team — cannot be what ends this: only the turn end can.
    client.moves.takeStone(false);

    expect(client.getState()?.ctx.gameover).toBe(true);
  });

  // The allowance is the same at both moments: a match must not close while a
  // move it has just taken is still on screen.
  test("the judge's turn ending within the allowance leaves the match open", () => {
    const client = playing();
    at(1000);
    client.moves.takeStone(false);

    at(2000);
    client.moves.takeStone(false);

    expect(client.getState()?.ctx.gameover).toBeUndefined();
  });
});
