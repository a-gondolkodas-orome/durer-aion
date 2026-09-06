import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as http from "node:http";
import type { AddressInfo } from "node:net";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import type { TeamsRepository } from "./db";
import type { TeamModel } from "./model";
import { requireAdmin } from "./admin_session";
import { configureTeamsRouter } from "./router";
import { JOIN_ATTEMPT_LIMIT, clientKey, rateLimit } from "./rate_limit";

type LimitedCtx = Parameters<ReturnType<typeof rateLimit>>[0];

// One client is a whole IPv6 prefix, not one address; the parsing that decides
// which addresses land in the same bucket is `ip-address`'.
describe("clientKey", () => {
  it("keeps an IPv4 address whole", () => {
    expect(clientKey("192.0.2.7")).toBe("192.0.2.7");
    expect(clientKey("192.0.2.8")).not.toBe(clientKey("192.0.2.7"));
  });

  // What a dual-stack socket reports with no proxy in front of it.
  it("reads an IPv4-mapped address as that IPv4 address", () => {
    expect(clientKey("::ffff:192.0.2.7")).toBe("192.0.2.7");
  });

  // A subscriber is handed a prefix, so counting per address would hand one
  // client as many buckets as it cares to use.
  it("gives one bucket to an IPv6 prefix", () => {
    const key = clientKey("2001:db8:1:2:3:4:5:6");
    expect(key).toBe("2001:db8:1::/56");
    expect(clientKey("2001:db8:1:2:ffff:ffff:ffff:ffff")).toBe(key);
    expect(clientKey("2001:db8:1:3::1")).toBe(key);
  });

  it("keeps separate prefixes apart", () => {
    expect(clientKey("2001:db8:2::1")).not.toBe(clientKey("2001:db8:1::1"));
  });

  // Every spelling that reaches a different key is a bucket the same client
  // did not have to spend, and an address has more spellings than one would
  // think: hex case is not one of them, and `::` stands wherever it likes.
  it("reads one address the same however it is spelled", () => {
    const key = clientKey("2001:db8:1:2::1");
    expect(clientKey("2001:DB8:1:2::1")).toBe(key);
    expect(clientKey("2001:db8:1:2:0:0:0:1")).toBe(key);
    expect(clientKey("2001:0db8:0001:0002:0000:0000:0000:0001")).toBe(key);
  });
});

describe("rateLimit", () => {
  // The library counts against the real clock, so the two tests that care
  // about time move it rather than wait.
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function fakeCtx(ip = "192.0.2.7") {
    return { ip, status: 404, body: undefined, set: vi.fn() } as unknown as LimitedCtx;
  }

  /** A route that answers with `status`, as the next middleware in line. */
  const answering = (ctx: LimitedCtx, status: number) => () => {
    ctx.status = status;
    return Promise.resolve();
  };

  it("lets an attempt through and passes the route's answer back", async () => {
    const limit = rateLimit({ limit: 2, windowSeconds: 60 });
    const ctx = fakeCtx();

    await limit(ctx, answering(ctx, 204));

    expect(ctx.status).toBe(204);
    expect(ctx.set).not.toHaveBeenCalled();
  });

  it("refuses the attempt after the limit, and says how long for", async () => {
    const limit = rateLimit({ limit: 2, windowSeconds: 60 });
    const route = vi.fn();

    for (let i = 0; i < 2; i++) {
      const ctx = fakeCtx();
      await limit(ctx, answering(ctx, 404));
    }
    vi.advanceTimersByTime(15_000);
    const ctx = fakeCtx();
    await limit(ctx, route);

    expect(ctx.status).toBe(429);
    expect(route).not.toHaveBeenCalled();
    expect(ctx.set).toHaveBeenCalledWith("Retry-After", "45");
  });

  // The limit is on guessing, not on logging in: a school behind one NAT
  // address must not lock its next team out by getting the code right.
  it("charges nothing for an attempt that succeeded", async () => {
    const limit = rateLimit({ limit: 2, windowSeconds: 60 });

    for (let i = 0; i < 20; i++) {
      const ctx = fakeCtx();
      await limit(ctx, answering(ctx, 204));
      expect(ctx.status).toBe(204);
    }
  });

  // The join route answers a missing code by throwing, which is the failure
  // the whole limit is about.
  it("charges an attempt whose route threw", async () => {
    const limit = rateLimit({ limit: 1, windowSeconds: 60 });
    const boom = new Error("Team not found!");

    await expect(limit(fakeCtx(), () => Promise.reject(boom))).rejects.toBe(boom);
    const ctx = fakeCtx();
    await limit(ctx, () => Promise.reject(boom));

    expect(ctx.status).toBe(429);
  });

  // Charging only once a guess has been answered would let a client send its
  // whole burst before any of them counted.
  it("counts guesses sent at once, not only the ones already answered", async () => {
    const limit = rateLimit({ limit: 2, windowSeconds: 60 });
    let release = () => { /* replaced below */ };
    const held = new Promise<void>(resolve => { release = resolve; });
    const entered = vi.fn();
    const attempts = Array.from({ length: 5 }, () => fakeCtx());

    const answers = Promise.all(attempts.map(ctx => limit(ctx, async () => {
      entered();
      await held;
      ctx.status = 404;
    })));
    release();
    await answers;

    expect(entered).toHaveBeenCalledTimes(2);
    expect(attempts.filter(ctx => ctx.status === 429)).toHaveLength(3);
  });

  it("gives the client its attempts back in the next window", async () => {
    const limit = rateLimit({ limit: 1, windowSeconds: 60 });

    const spent = fakeCtx();
    await limit(spent, answering(spent, 404));
    vi.advanceTimersByTime(60_000);
    const ctx = fakeCtx();
    await limit(ctx, answering(ctx, 404));

    expect(ctx.status).toBe(404);
  });

  it("counts each client separately", async () => {
    const limit = rateLimit({ limit: 1, windowSeconds: 60 });

    const spent = fakeCtx("192.0.2.7");
    await limit(spent, answering(spent, 404));
    const other = fakeCtx("192.0.2.8");
    await limit(other, answering(other, 404));

    expect(other.status).toBe(404);
  });

  it("keeps one route's budget out of another's", async () => {
    const first = rateLimit({ limit: 1, windowSeconds: 60 });
    const second = rateLimit({ limit: 1, windowSeconds: 60 });

    const spent = fakeCtx();
    await first(spent, answering(spent, 404));
    const ctx = fakeCtx();
    await second(ctx, answering(ctx, 404));

    expect(ctx.status).toBe(404);
  });
});

// The join code is a team's whole login, and this route is the only place an
// unauthenticated client gets to guess at one.
describe("POST /team/join over HTTP", () => {
  const servers: http.Server[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map(server => new Promise(resolve => server.close(resolve))));
  });

  async function serve(teams: TeamsRepository) {
    const app = new Koa<Koa.DefaultState, Server.AppCtx>();
    // The 404s below are the point of the test, and koa logs every error.
    app.silent = true;
    const router = new Router<Koa.DefaultState, Server.AppCtx>();
    configureTeamsRouter(router, teams, [], requireAdmin("unused-here"));
    app.use(router.routes());
    const handle = app.callback();
    const server = http.createServer((req, res) => { void handle(req, res); }).listen(0, "127.0.0.1");
    servers.push(server);
    await new Promise(resolve => server.once("listening", resolve));
    const { port } = server.address() as AddressInfo;
    return (code: string) => fetch(`http://127.0.0.1:${port}/team/join`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
    });
  }

  it("stops guessing at the limit, without looking the guess up", async () => {
    const teams = { getTeam: vi.fn().mockResolvedValue(null) } as unknown as TeamsRepository;
    const request = await serve(teams);

    for (let i = 0; i < JOIN_ATTEMPT_LIMIT; i++) {
      expect((await request(`000-0000-${`${i}`.padStart(3, "0")}`)).status).toBe(404);
    }
    const refused = await request("000-0000-999");

    expect(refused.status).toBe(429);
    expect(refused.headers.get("retry-after")).toMatch(/^\d+$/);
    expect(teams.getTeam).toHaveBeenCalledTimes(JOIN_ATTEMPT_LIMIT);
  });

  it("lets a team log in however often it gets the code right", async () => {
    const team = { teamId: "8eae8669-125c-42e5-8b49-89afbac31679" } as TeamModel;
    const request = await serve({ getTeam: vi.fn().mockResolvedValue(team) } as unknown as TeamsRepository);

    for (let i = 0; i < JOIN_ATTEMPT_LIMIT + 5; i++) {
      expect((await request("000-0000-000")).status).toBe(204);
    }
  });
});
