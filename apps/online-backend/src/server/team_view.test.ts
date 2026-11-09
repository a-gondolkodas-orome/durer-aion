import { TeamModel } from "./model";
import { publicTeamView } from "./team_view";
import type { TeamMatches } from "./match_status";

const team = {
  teamId: "8eae8669-125c-42e5-8b49-89afbac31679",
  joinCode: "000-0000-000",
  teamName: "Csapat",
  competitionId: "wkr6zml6mu--20-online-e",
  category: "E",
  credentials: "secret-token",
  email: "team@example.com",
  other: "organiser notes",
  pageState: "HOME",
  relayMatchID: null,
  strategyMatchID: null,
  createdAt: new Date("2026-03-21T10:00:00Z"),
  updatedAt: new Date("2026-03-21T10:00:00Z"),
} as unknown as TeamModel;

const matches: TeamMatches = { relayMatch: { state: "NOT STARTED" }, strategyMatch: { state: "NOT STARTED" } };

// Whatever this returns is readable by any script on the page.
describe("publicTeamView", () => {
  it("keeps out the login code, the address and the organisers' notes", () => {
    expect(publicTeamView(team, matches)).not.toHaveProperty("joinCode");
    expect(publicTeamView(team, matches)).not.toHaveProperty("email");
    expect(publicTeamView(team, matches)).not.toHaveProperty("other");
  });

  // Regression: the GUID is the session cookie's value, and a browser sets
  // cookies of its own — so serving it here would hand the session to any
  // script on the page. boardgame.io discloses the same GUID once a match
  // exists (issue #434), so this narrows the window rather than closing it.
  it("keeps out the GUID, which is the session itself", () => {
    expect(publicTeamView(team, matches)).not.toHaveProperty("teamId");
  });

  // The relay's problems carry their answers.
  it("serves the competition without its problems", () => {
    expect(JSON.stringify(publicTeamView(team, matches))).not.toContain("problemId");
  });

  it("serves no competition for a row naming one the server does not have", () => {
    expect(publicTeamView({ ...team, competitionId: "gone" } as TeamModel, matches).competition).toBeNull();
  });

  it("serves what the client plays with", () => {
    expect(publicTeamView(team, matches)).toStrictEqual({
      teamName: "Csapat",
      category: "E",
      competition: {
        id: "wkr6zml6mu--20-online-e",
        languages: ["hu"],
        relay: { durationMinutes: 60 },
        strategy: { durationMinutes: 30, gameId: "20o-e" },
        metadata: { kind: "competition", edition: 20, round: "online", category: "E" },
      },
      credentials: "secret-token",
      pageState: "HOME",
      relayMatch: { state: "NOT STARTED" },
      strategyMatch: { state: "NOT STARTED" },
    });
  });
});
