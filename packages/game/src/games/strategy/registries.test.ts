import { isLocalized } from "schemas";
import { strategyClientFor } from "./strategy-client";
import { MyGameWrappers, strategyGameClients, strategyGames } from "./strategy-games";

// A competition is checked against `strategyGames.languages` alone
// (validateRegistry), so a description given per language must have each of
// them. One given once serves every language.
test.each(Object.entries(strategyGames))("%s has a description in each of its languages", (gameId, { languages }) => {
  const { description } = strategyClientFor(gameId as keyof typeof strategyGames);
  const given = isLocalized(description) ? Object.keys(description) : languages;
  expect([...given].sort()).toStrictEqual([...languages].sort());
});

test.each(Object.entries(strategyGames))("%s names its roles in each of its languages, if it names them", (gameId, { languages }) => {
  const { roleLabels = [] } = MyGameWrappers[gameId as keyof typeof MyGameWrappers]();
  for (const label of roleLabels) {
    const given = isLocalized(label) ? Object.keys(label) : languages;
    expect([...given].sort()).toStrictEqual([...languages].sort());
  }
});

// The gate serves the folder strategyGameClients names (#643): it must be the
// one the `game/client` registry plays the id with.
test.each(Object.entries(strategyGameClients))("%s is played by its folder's client.tsx", async (gameId, entry) => {
  const { strategyClient } = await import(`./${entry.folder}/client.tsx`) as { strategyClient: (variant?: string) => unknown };
  const variant = "variant" in entry ? entry.variant : undefined;
  expect(strategyClient(variant)).toMatchObject({ description: strategyClientFor(gameId as keyof typeof strategyGames).description });
});
