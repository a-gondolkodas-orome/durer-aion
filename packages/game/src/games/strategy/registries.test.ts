import { readdirSync } from "node:fs";
import { isLocalized } from "schemas";
import { strategyClientFor } from "./strategy-client";
import { MyGameWrappers, strategyGameClients, strategyGames } from "./strategy-games";
import type { StrategyGameKey } from "./strategy-games";

const gameIds = Object.keys(strategyGames) as StrategyGameKey[];

// A competition is checked against `strategyGames.languages` alone
// (validateRegistry), so a description given per language must have each of
// them. One given once serves every language.
test.each(gameIds)("%s has a description in each of its languages", gameId => {
  const { description } = strategyClientFor(gameId);
  const given = isLocalized(description) ? Object.keys(description) : strategyGames[gameId].languages;
  expect([...given].sort()).toStrictEqual([...strategyGames[gameId].languages].sort());
});

test.each(gameIds)("%s names its roles in each of its languages, if it names them", gameId => {
  const { roleLabels = [] } = MyGameWrappers[gameId]();
  for (const label of roleLabels) {
    const given = isLocalized(label) ? Object.keys(label) : strategyGames[gameId].languages;
    expect([...given].sort()).toStrictEqual([...strategyGames[gameId].languages].sort());
  }
});

// The live round is to serve a game's client.tsx alone (#643), so each game
// folder has one, and the folder a game id names is the one whose client.tsx
// the `game/client` registry plays it with: the same game, in the same variant.
const folders = readdirSync(new URL(".", import.meta.url), { withFileTypes: true })
  .filter(entry => entry.isDirectory()).map(entry => entry.name);

test.each(folders)("%s has a client.tsx", folder => {
  expect(readdirSync(new URL(`./${folder}/`, import.meta.url))).toContain("client.tsx");
});

test.each(gameIds)("%s is played with its folder's client, in its variant", async gameId => {
  const { folder, variant } = { variant: undefined, ...strategyGameClients[gameId] };
  const { strategyClient } = await import(`./${folder}/client.tsx`) as { strategyClient: (variant?: string) => unknown };
  const fromFolder = strategyClient(variant) as ReturnType<typeof strategyClientFor>;
  const fromRegistry = strategyClientFor(gameId);
  expect(fromFolder.board).toBe(fromRegistry.board);
  expect(fromFolder.description).toBe(fromRegistry.description);
  expect(fromFolder.game.setup()).toStrictEqual(fromRegistry.game.setup());
  expect(fromFolder.game.roleLabels).toStrictEqual(fromRegistry.game.roleLabels);
  expect(fromRegistry.game.setup()).toStrictEqual(MyGameWrappers[gameId]().setup());
});
