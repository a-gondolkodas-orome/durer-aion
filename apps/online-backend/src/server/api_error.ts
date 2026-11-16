import type * as Router from '@koa/router';
import type { DefaultState } from 'koa';
import type { Server } from 'boardgame.io';
import { API_ERROR_CODES, type ApiErrorBody, type ApiErrorCode } from 'schemas';

/** Refuses the request: `apiErrorBody` answers it as `{ code, message }`. */
export function refuse(ctx: Server.AppCtx, status: number, code: ApiErrorCode, message: string): never {
  // `ctx.throw` always throws, but boardgame.io's context types it as `any`.
  throw ctx.throw(status, message, { code });
}

/** The same answer, written rather than thrown, for a route that must keep a
 *  header koa's own error handler would drop (`team_session.ts`, `rate_limit.ts`). */
export function writeRefusal(ctx: Server.AppCtx, status: number, code: ApiErrorCode, message: string) {
  ctx.status = status;
  ctx.body = { code, message } satisfies ApiErrorBody;
}

function isRefusal(err: unknown): err is Error & { status: number, code: ApiErrorCode } {
  if (!(err instanceof Error)) return false;
  const { expose, status, code } = err as Error & Record<string, unknown>;
  return expose === true && typeof status === 'number'
    && (API_ERROR_CODES as readonly unknown[]).includes(code);
}

/**
 * Answers a `refuse` as `{ code, message }` JSON. Anything else thrown goes on
 * to koa's own handler as before: a 5xx is logged and its text kept from the
 * client, and a 4xx without a code (koa-body's, boardgame.io's) stays plain text.
 *
 * Caught here, a refusal keeps the headers set before it — the cookie
 * `requireTeam` refreshes, say — where koa's handler would drop them.
 */
export const apiErrorBody: Router.Middleware<DefaultState, Server.AppCtx> = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    if (!isRefusal(err)) throw err;
    writeRefusal(ctx, err.status, err.code, err.message);
  }
};
