import type { CompetitionConfig } from "schemas";
import { readStartWindowBody, teamStartWindow, withCompetitionWindow } from "./start_window";

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

describe("withCompetitionWindow", () => {
  const inCode = { id: "a", startWindow: { opensAt: "2026-10-20T15:00+02:00" } } as CompetitionConfig;
  const without = { id: "b" } as CompetitionConfig;
  const set = { opensAt: "2026-10-21T15:00+02:00", closesAt: "2026-10-21T21:00+02:00" };

  it("puts a window set on the admin page in place of the config's, or of none", () => {
    const windows = new Map([["a", set], ["b", set]]);
    expect(withCompetitionWindow(inCode, windows)?.startWindow).toBe(set);
    expect(withCompetitionWindow(without, windows)?.startWindow).toBe(set);
  });

  it("leaves a competition with none set as its config has it", () => {
    expect(withCompetitionWindow(inCode, new Map([["b", set]]))).toBe(inCode);
    expect(withCompetitionWindow(undefined, new Map([["a", set]]))).toBeUndefined();
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

  it("refuses a window the validator rejects in English, not with its Hungarian messages", () => {
    expect(readStartWindowBody({ opensAt: "2026-10-21T15:00" })).toStrictEqual({
      refused: "opensAt and closesAt are ISO 8601 times with an offset, closesAt after opensAt.",
    });
  });
});
