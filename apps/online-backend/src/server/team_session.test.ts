import { describe, it, expect, vi } from "vitest";
import type { TeamsRepository } from "./db";
import type { TeamModel } from "./model";
import { TEAM_COOKIE, TEAM_COOKIE_PATH, clearTeamCookie, requireTeam, setTeamCookie } from "./team_session";

const GUID = "8eae8669-125c-42e5-8b49-89afbac31679";

type TeamCtx = Parameters<ReturnType<typeof requireTeam>>[0];

function fakeCtx(cookie?: string) {
  const set = vi.fn();
  const ctx = {
    cookies: { get: () => cookie, set },
    state: {},
    throw: (status: number, message: string) => {
      throw new Error(`${status} ${message}`);
    },
  } as unknown as TeamCtx;
  return { ctx, set };
}

const teamsWith = (team: TeamModel | null) =>
  ({ getTeam: vi.fn().mockResolvedValue(team) }) as unknown as TeamsRepository;

// The cookie carries the team's whole access control: the flags are the point.
describe("setTeamCookie", () => {
  it("is unreadable to scripts, held back from other sites and scoped to the team routes", () => {
    const { ctx, set } = fakeCtx();

    setTeamCookie(ctx, GUID);

    expect(set).toHaveBeenCalledTimes(1);
    const [name, value, options] = set.mock.calls[0];
    expect(name).toBe(TEAM_COOKIE);
    expect(value).toBe(GUID);
    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", path: TEAM_COOKIE_PATH });
    expect(options.maxAge).toBeGreaterThan(0);
  });

  // Forcing `secure` throws over plain HTTP, and the docker stack is served
  // over plain HTTP at localhost; koa sets the flag itself behind TLS.
  it("leaves the secure flag to the connection", () => {
    const { ctx, set } = fakeCtx();

    setTeamCookie(ctx, GUID);

    expect(set.mock.calls[0][2]).not.toHaveProperty("secure");
  });
});

describe("clearTeamCookie", () => {
  it("expires the cookie under the path it was set on", () => {
    const { ctx, set } = fakeCtx(GUID);

    clearTeamCookie(ctx);

    expect(set).toHaveBeenCalledWith(TEAM_COOKIE, null, expect.objectContaining({ path: TEAM_COOKIE_PATH }));
  });
});

describe("requireTeam", () => {
  const team = { teamId: GUID } as TeamModel;

  it("answers 401 to a request with no cookie", async () => {
    const { ctx } = fakeCtx();
    const next = vi.fn();

    await expect(requireTeam(teamsWith(team))(ctx, next)).rejects.toThrow("401");
    expect(next).not.toHaveBeenCalled();
  });

  it("answers 401 to a cookie naming no team, and expires it", async () => {
    const { ctx, set } = fakeCtx(GUID);
    const next = vi.fn();

    await expect(requireTeam(teamsWith(null))(ctx, next)).rejects.toThrow("401");
    expect(next).not.toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith(TEAM_COOKIE, null, expect.anything());
  });

  it("hands the cookie's team to the route", async () => {
    const { ctx } = fakeCtx(GUID);
    const next = vi.fn();
    const teams = teamsWith(team);

    await requireTeam(teams)(ctx, next);

    expect(teams.getTeam).toHaveBeenCalledWith({ teamId: GUID });
    expect(ctx.state.team).toBe(team);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
