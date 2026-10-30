import { expect, test } from "vitest";
import { Client } from "boardgame.io/client";
import { gameWrapper, GameRelay, MyGameWrappers } from "game";
import { asMatchTimeMoves, asRelayMoves } from "./match-moves";

// What the narrowing is for: a move renamed in the game fails here rather than
// as a call to `undefined` in the middle of a round.
test("the relay game's own client has the relay moves", () => {
  const client = Client({ game: GameRelay, numPlayers: 2 });
  expect(() => asRelayMoves(client.moves)).not.toThrow();
});

test("a wrapped strategy game's client has the clock move", () => {
  const client = Client({ game: gameWrapper(MyGameWrappers.C()), numPlayers: 2 });
  expect(() => asMatchTimeMoves(client.moves)).not.toThrow();
});

test("a missing move is named", () => {
  expect(() => asRelayMoves({ getTime: () => undefined }))
    .toThrow("the board is missing the move(s): submitAnswer, startGame");
});
