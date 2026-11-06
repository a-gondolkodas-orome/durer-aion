import { describe, expect, it } from "vitest";
import { strategyNames } from "game";
import { competitionGames } from "./games";
import { relayNames } from "./server/common";

describe("competitionGames", () => {
  const names = competitionGames.map(({ game }) => game.name);

  // The server keys its bots by game name, so a repeated name would leave
  // one of the two games playing the other's bot.
  it("names each game once", () => {
    expect(new Set(names).size).toBe(names.length);
  });

  // The start routes look a team's game up by these names (team_manage.ts),
  // and a name with no game answers 404 when the team presses Start.
  it("hosts every game a team can start", () => {
    expect([...names].sort()).toEqual(
      [...Object.values(relayNames), ...Object.values(strategyNames)].sort()
    );
  });
});
