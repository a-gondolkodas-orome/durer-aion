import { isLocalized } from "schemas";
import { strategyClientFor } from "./strategy-client";
import { MyGameWrappers, strategyGameFolders, strategyGames } from "./strategy-games";

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

// The gate serves the folder strategyGameFolders names (#643): its client.tsx
// must play the id as the `game/client` registry does.
test.each(Object.entries(strategyGameFolders))("%s is played by %s/client.tsx", async (gameId, folder) => {
  type Client = ReturnType<typeof strategyClientFor>;
  const { strategyClient } = await import(`./${folder}/client.tsx`) as { strategyClient: (gameId: string) => Client };
  const served = strategyClient(gameId);
  const registered = strategyClientFor(gameId as keyof typeof strategyGames);
  expect(served.description).toBe(registered.description);
  expect(served.game.setup()).toStrictEqual(registered.game.setup());
});
