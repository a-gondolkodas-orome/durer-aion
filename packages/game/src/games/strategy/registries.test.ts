import { isLocalized, type Localizable } from "schemas";
import { strategyPresentations } from "./strategy-client";
import { strategyGames } from "./strategy-games";

// A competition is checked against `strategyGames.languages` alone
// (validateRegistry), so a text given per language must have each of them. One
// given once serves every language.
const languagesOf = (text: Localizable<unknown>, languages: readonly string[]) =>
  [...(isLocalized(text) ? Object.keys(text) : languages)].sort();

test.each(Object.entries(strategyGames))("%s has its rules in each of its languages", (gameId, { languages }) => {
  const { rules } = strategyPresentations[gameId as keyof typeof strategyPresentations];
  expect(languagesOf(rules, languages)).toStrictEqual([...languages].sort());
});

test.each(Object.entries(strategyGames))("%s names its roles in each of its languages, if it names them", (gameId, { languages }) => {
  const presentation: { roleLabels?: readonly Localizable<string>[] } = strategyPresentations[gameId as keyof typeof strategyPresentations];
  for (const label of presentation.roleLabels ?? []) {
    expect(languagesOf(label, languages)).toStrictEqual([...languages].sort());
  }
});
