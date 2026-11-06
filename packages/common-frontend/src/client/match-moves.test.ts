import { expect, test } from "vitest";
import { Client } from "boardgame.io/client";
import { gameWrapper, GameRelay, MyGameWrappers } from "game";
import { asRelayMoves, asStrategyWrapperMoves } from "./match-moves";

// A move renamed in the game fails here, not mid-round.
test("the relay game's own client has the relay moves", () => {
  const client = Client({ game: GameRelay, numPlayers: 2 });
  expect(() => asRelayMoves(client.moves)).not.toThrow();
});

test("a wrapped strategy game's client has the wrapper's moves", () => {
  const client = Client({ game: gameWrapper(MyGameWrappers.C()), numPlayers: 2 });
  expect(() => asStrategyWrapperMoves(client.moves)).not.toThrow();
});

test("a missing move is named", () => {
  expect(() => asRelayMoves({ getTime: () => undefined }))
    .toThrow("the board is missing the move(s): submitAnswer, startGame");
});
