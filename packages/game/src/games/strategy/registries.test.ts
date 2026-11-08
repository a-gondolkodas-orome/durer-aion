import { strategyDescriptions } from "./strategy-client";
import { strategyGames } from "./strategy-games";

// A competition is checked against `strategyGames.languages` alone
// (validateRegistry), so a language listed there must have its description.
test.each(Object.entries(strategyGames))("%s has a description in each of its languages", (gameId, { languages }) => {
  const descriptions = strategyDescriptions[gameId as keyof typeof strategyDescriptions];
  expect(Object.keys(descriptions).sort()).toStrictEqual([...languages].sort());
});
