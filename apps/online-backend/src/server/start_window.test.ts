import { readTeamStartWindow, teamStartWindow } from "./start_window";

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

describe("readTeamStartWindow", () => {
  it("reads a window, with or without an end", () => {
    expect(readTeamStartWindow({ opensAt: "2026-10-21T15:00+02:00", closesAt: "2026-10-21T21:00+02:00" }))
      .toStrictEqual({ opensAt: "2026-10-21T15:00+02:00", closesAt: "2026-10-21T21:00+02:00" });
    expect(readTeamStartWindow({ opensAt: "2026-10-21T15:00+02:00" }))
      .toStrictEqual({ opensAt: "2026-10-21T15:00+02:00", closesAt: null });
  });

  it("reads a null opensAt as clearing the window", () => {
    expect(readTeamStartWindow({ opensAt: null })).toStrictEqual({ opensAt: null, closesAt: null });
  });

  it.each([
    ["an end alone", { opensAt: null, closesAt: "2026-10-21T21:00+02:00" }],
    ["a time with no offset", { opensAt: "2026-10-21T15:00" }],
    ["a window closing before it opens", { opensAt: "2026-10-21T15:00+02:00", closesAt: "2026-10-21T14:00+02:00" }],
    ["a number", { opensAt: 5 }],
  ])("refuses %s", (_, body) => {
    expect(readTeamStartWindow(body)).toHaveProperty("refused");
  });
});
