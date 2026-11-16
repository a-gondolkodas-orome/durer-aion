/**
 * Why the server refused a request, as the body of every 4xx it answers:
 * `{ code, message }`. The code is what a client reads; the message is English
 * for whoever reads the response by hand, and no client shows it.
 *
 * A code is a promise to the clients: rename one only together with the
 * frontend's translation of it (`error.api.<code>`).
 */
export const API_ERROR_CODES = [
  // 400
  "INVALID_BODY",
  "INVALID_START_WINDOW",
  "NO_FILE",
  "MULTIPLE_FILES",
  "NOT_TSV",
  // 401
  "NOT_LOGGED_IN",
  // 403
  "START_NOT_ALLOWED",
  "NO_SUCH_MATCH",
  "COMPETITION_NOT_STARTED",
  "COMPETITION_OVER",
  "VIEW_NOT_ALLOWED",
  "MATCH_IN_PROGRESS",
  // 404
  "UNKNOWN_JOIN_CODE",
  "TEAM_NOT_FOUND",
  "MATCH_NOT_FOUND",
  "GAME_NOT_FOUND",
  "COMPETITION_NOT_FOUND",
  // 409
  "STALE_MATCH_ID",
  "MATCH_FINISHED",
  // 415
  "JSON_REQUIRED",
  // 429
  "TOO_MANY_ATTEMPTS",
] as const;

export type ApiErrorCode = typeof API_ERROR_CODES[number];

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
}

export function isApiErrorBody(body: unknown): body is ApiErrorBody {
  if (typeof body !== "object" || body === null) return false;
  const { code, message } = body as Record<string, unknown>;
  return typeof message === "string"
    && (API_ERROR_CODES as readonly unknown[]).includes(code);
}
