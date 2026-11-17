import { createRegistry } from "problem-bank";
import * as rehearsedRound from "problem-bank/banks/edition-20-online";
import * as reference from "problem-bank/banks/reference";
import { referenceTeams } from "./reference-teams";
import { teamData } from "./teamData";

// A test team whose competition its build's round does not have could not log
// in. The two builds' rounds are rehearsed-round.ts's two banks.
describe.each([
  ["the rehearsed round", teamData, rehearsedRound],
  ["the reference competitions", referenceTeams, reference],
])("%s", (_, teams, bank) => {
  const { competitions } = createRegistry([bank]);

  test.each(teams)("$teamname enters a competition of the round", ({ competitionId }) => {
    expect(competitions.has(competitionId)).toBe(true);
  });
});

test("every test team has a join code of its own, across both builds", () => {
  const codes = [...teamData, ...referenceTeams].map(team => team.join_code);
  expect(new Set(codes).size).toBe(codes.length);
});
