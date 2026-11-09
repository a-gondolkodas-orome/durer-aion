import { isLocalized } from "schemas";
import { strategyDescriptions } from "./strategy-client";
import { strategyGames } from "./strategy-games";

// A competition is checked against `strategyGames.languages` alone
// (validateRegistry), so a description given per language must have each of
// them. One given once serves every language.
test.each(Object.entries(strategyGames))("%s has a description in each of its languages", (gameId, { languages }) => {
  const description = strategyDescriptions[gameId as keyof typeof strategyDescriptions];
  const given = isLocalized(description) ? Object.keys(description) : languages;
  expect([...given].sort()).toStrictEqual([...languages].sort());
});
