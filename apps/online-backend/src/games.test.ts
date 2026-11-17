import { registry } from "problem-bank/all";
import { RELAY_GAME_NAME, strategyGameName } from "schemas";
import { hostedGames } from "./games";

describe("hostedGames", () => {
  const games = hostedGames();
  const names = games.map(({ game }) => game.name);

  // The server keys its bots by game name, so a repeated name would leave
  // one of the two games playing the other's bot.
  it("names each game once", () => {
    expect(new Set(names).size).toBe(names.length);
  });

  // The start routes look a team's game up by these names (team_manage.ts),
  // and a name with no game answers 404 when the team presses Start.
  it("hosts every match of every competition", () => {
    const expected = [...registry.competitions.values()].flatMap(({ relay, strategy }) => [
      ...(relay ? [RELAY_GAME_NAME] : []),
      ...(strategy ? [strategyGameName(strategy.gameId)] : []),
    ]);
    expect(names).toEqual(expect.arrayContaining(expected));
  });

  // The setup reads the clock twice, for the start and for the end, so a
  // millisecond ticking between the two reads would add to the duration.
  it("gives each match the duration it is set up with", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    onTestFinished(() => { vi.useRealTimers(); });
    const setupOf = (name: string, durationMinutes: number) => games.find(({ game }) => game.name === name)
      ?.game.setup?.({} as never, { durationMinutes, judge: [] }) as { start: string, end: string };
    const minutes = (G: { start: string, end: string }) =>
      (new Date(G.end).getTime() - new Date(G.start).getTime()) / 60_000;

    expect(minutes(setupOf(RELAY_GAME_NAME, 45))).toBe(45);
    expect(minutes(setupOf(strategyGameName("20o-c"), 25))).toBe(25);
  });
});
