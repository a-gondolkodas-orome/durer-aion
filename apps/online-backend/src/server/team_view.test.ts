import { describe, it, expect } from "vitest";
import { TeamModel } from "./model";
import { publicTeamView } from "./team_view";

const team = {
  teamId: "8eae8669-125c-42e5-8b49-89afbac31679",
  joinCode: "000-0000-000",
  teamName: "Csapat",
  category: "E",
  credentials: "secret-token",
  email: "team@example.com",
  other: "organiser notes",
  pageState: "HOME",
  relayMatch: { state: "NOT STARTED" },
  strategyMatch: { state: "NOT STARTED" },
  createdAt: new Date("2026-03-21T10:00:00Z"),
  updatedAt: new Date("2026-03-21T10:00:00Z"),
} as unknown as TeamModel;

// The team routes authenticate nobody: whatever this returns is readable by
// anyone who knows a team's GUID.
describe("publicTeamView", () => {
  it("keeps out the login code, the address and the organisers' notes", () => {
    expect(publicTeamView(team)).not.toHaveProperty("joinCode");
    expect(publicTeamView(team)).not.toHaveProperty("email");
    expect(publicTeamView(team)).not.toHaveProperty("other");
  });

  it("serves what the client plays with", () => {
    expect(publicTeamView(team)).toStrictEqual({
      teamId: "8eae8669-125c-42e5-8b49-89afbac31679",
      teamName: "Csapat",
      category: "E",
      credentials: "secret-token",
      pageState: "HOME",
      relayMatch: { state: "NOT STARTED" },
      strategyMatch: { state: "NOT STARTED" },
    });
  });
});
