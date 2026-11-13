import { dryRunCompetition } from "./rehearsed-round";
import { teamData } from "./teamData";

// A test team whose competition the round does not have could not log in.
test.each(teamData)("$teamname enters a competition of the rehearsed round", ({ competitionId }) => {
  expect(dryRunCompetition(competitionId)).toBeDefined();
});

test("every test team has a join code of its own", () => {
  expect(new Set(teamData.map(team => team.join_code)).size).toBe(teamData.length);
});
