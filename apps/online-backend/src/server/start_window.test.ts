import type { CompetitionConfig } from "schemas";
import { readStartWindowBody, teamStartWindow, withCompetitionWindows } from "./start_window";

const competition = { startWindow: { opensAt: "2026-10-20T15:00:00+02:00" } };

describe("teamStartWindow", () => {
  it("is the team's own window where it has one", () => {
    expect(teamStartWindow({ startOpensAt: "2026-10-21T15:00+02:00", startClosesAt: null }, competition))
      .toStrictEqual({ opensAt: "2026-10-21T15:00+02:00" });
  });

  it("is the competition's otherwise, and none without either", () => {
    expect(teamStartWindow({ startOpensAt: null, startClosesAt: null }, competition)).toBe(competition.startWindow);
    expect(teamStartWindow({ startOpensAt: null, startClosesAt: null }, {})).toBeUndefined();
  });
});

describe("withCompetitionWindows", () => {
  const inCode = { id: "a", startWindow: { opensAt: "2026-10-20T15:00+02:00" } } as CompetitionConfig;
  const without = { id: "b" } as CompetitionConfig;
  const competitions = new Map([["a", inCode], ["b", without]]);
  const set = { opensAt: "2026-10-21T15:00+02:00", closesAt: "2026-10-21T21:00+02:00" };

  it("puts a window set on the admin page in place of the config's, or of none", () => {
    const result = withCompetitionWindows(competitions, new Map([["a", set], ["b", set]]));
    expect(result.get("a")?.startWindow).toBe(set);
    expect(result.get("b")?.startWindow).toBe(set);
  });

  it("leaves a competition with none set as its config has it", () => {
    expect(withCompetitionWindows(competitions, new Map([["b", set]])).get("a")).toBe(inCode);
    expect(withCompetitionWindows(competitions, new Map())).toBe(competitions);
  });
});

describe("readStartWindowBody", () => {
  it("reads a window, with or without an end", () => {
    expect(readStartWindowBody({ opensAt: "2026-10-21T15:00+02:00", closesAt: "2026-10-21T21:00+02:00" }))
      .toStrictEqual({ opensAt: "2026-10-21T15:00+02:00", closesAt: "2026-10-21T21:00+02:00" });
    expect(readStartWindowBody({ opensAt: "2026-10-21T15:00+02:00" }))
      .toStrictEqual({ opensAt: "2026-10-21T15:00+02:00" });
  });

  it("reads a null opensAt as no window", () => {
    expect(readStartWindowBody({ opensAt: null })).toBeNull();
  });

  it.each([
    ["an end alone", { opensAt: null, closesAt: "2026-10-21T21:00+02:00" }],
    ["a time with no offset", { opensAt: "2026-10-21T15:00" }],
    ["a window closing before it opens", { opensAt: "2026-10-21T15:00+02:00", closesAt: "2026-10-21T14:00+02:00" }],
    ["a number", { opensAt: 5 }],
  ])("refuses %s", (_, body) => {
    expect(readStartWindowBody(body)).toHaveProperty("refused");
  });
});
