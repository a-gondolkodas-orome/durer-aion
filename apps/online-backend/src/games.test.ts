import { registry } from "problem-bank/all";
import { relayGameName, strategyGameName } from "schemas";
import { competitionGames } from "./games";

describe("competitionGames", () => {
  const games = competitionGames(registry);
  const names = games.map(({ game }) => game.name);

  // The server keys its bots by game name, so a repeated name would leave
  // one of the two games playing the other's bot.
  it("names each game once", () => {
    expect(new Set(names).size).toBe(names.length);
  });

  // The start routes look a team's game up by these names (team_manage.ts),
  // and a name with no game answers 404 when the team presses Start.
  it("hosts every match of every competition", () => {
    const expected = [...registry.competitions.values()].flatMap(({ id, relay, strategy }) => [
      ...(relay ? [relayGameName(id)] : []),
      ...(strategy ? [strategyGameName(id)] : []),
    ]);
    expect([...names].sort()).toEqual(expected.sort());
  });

  // The setup reads the clock twice, for the start and for the end, so a
  // millisecond ticking between the two reads would add to the duration.
  it("gives each match its competition's duration", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    onTestFinished(() => { vi.useRealTimers(); });
    const competition = registry.competitions.get("mkhi1nnoim--20-online-c");
    if (competition === undefined) throw new Error("edition XX's online C is not registered");
    const { id, relay, strategy } = competition;
    const setupOf = (name: string) => games.find(({ game }) => game.name === name)?.game.setup?.({} as never);
    const minutes = (G: { start: string, end: string }) =>
      (new Date(G.end).getTime() - new Date(G.start).getTime()) / 60_000;

    expect(minutes(setupOf(relayGameName(id)) as { start: string, end: string })).toBe(relay?.durationMinutes);
    expect(minutes(setupOf(strategyGameName(id)) as { start: string, end: string })).toBe(strategy?.durationMinutes);
  });
});
