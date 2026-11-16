import type { Server } from "boardgame.io";
import { apiErrorBody, refuse } from "./api_error";

function fakeCtx() {
  const ctx = {
    status: 404,
    body: undefined as unknown,
    // Koa's `throw`, through http-errors: a 4xx is `expose`d, a 5xx is not.
    throw: (status: number, message: string, props?: object) => {
      throw Object.assign(new Error(message), { status, expose: status < 500, ...props });
    },
  };
  return ctx as typeof ctx & Server.AppCtx;
}

const run = (ctx: Server.AppCtx, route: () => void) =>
  apiErrorBody(ctx as Parameters<typeof apiErrorBody>[0], () => Promise.resolve(route()));

describe("apiErrorBody", () => {
  it("answers a refusal with its code and message", async () => {
    const ctx = fakeCtx();

    await run(ctx, () => refuse(ctx, 409, "MATCH_FINISHED", "Finished."));

    expect(ctx.status).toBe(409);
    expect(ctx.body).toStrictEqual({ code: "MATCH_FINISHED", message: "Finished." });
  });

  // koa's handler logs a 5xx and keeps its text from the client; answering it
  // here would do neither.
  it("leaves a server error to koa", async () => {
    const ctx = fakeCtx();

    await expect(run(ctx, () => ctx.throw(500, "Broken."))).rejects.toMatchObject({ status: 500 });
  });

  it("leaves an error without a code to koa", async () => {
    const ctx = fakeCtx();

    await expect(run(ctx, () => ctx.throw(400, "Bad JSON."))).rejects.toMatchObject({ status: 400 });
  });
});
