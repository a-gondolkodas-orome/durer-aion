import { isApiErrorBody, type ApiErrorCode } from "schemas";

/**
 * An error to show a team or an organiser, carrying a translation key rather
 * than the text: the data layer stays free of i18next, and the message is
 * translated where it is shown, in the language chosen by then. `errorMessage`
 * below is the one way to show it.
 */
export class I18nError extends Error {
  readonly i18nKey: string;
  readonly params?: Record<string, unknown>;
  /** The server's, when the server refused the request. */
  readonly code?: ApiErrorCode;

  constructor(i18nKey: string, options: ErrorOptions & { params?: Record<string, unknown>, code?: ApiErrorCode } = {}) {
    super(i18nKey, { cause: options.cause });
    this.name = "I18nError";
    this.i18nKey = i18nKey;
    this.params = options.params;
    this.code = options.code;
  }
}

// A marker, not a translation: it returns the key as written, and its name is
// what lets `npm run i18n:check` see each key below as used.
const t = (key: string) => key;

/** What each server code is shown as. Codes only a broken client can cause
 *  are an unexpected error to whoever sees them. */
const API_ERROR_KEYS: Record<ApiErrorCode, string> = {
  JOIN_INVALID_BODY: t("error.unexpected"),
  INVALID_START_WINDOW: t("error.invalidStartWindow"),
  IMPORT_NO_FILE: t("error.importNoFile"),
  IMPORT_MULTIPLE_FILES: t("error.importMultipleFiles"),
  IMPORT_NOT_TSV: t("error.importNotTsv"),
  NOT_LOGGED_IN: t("error.notLoggedIn"),
  START_NOT_ALLOWED: t("error.startNotAllowed"),
  NO_SUCH_MATCH: t("error.noSuchMatch"),
  COMPETITION_NOT_STARTED: t("error.competitionNotStarted"),
  COMPETITION_OVER: t("error.competitionOver"),
  VIEW_NOT_ALLOWED: t("error.viewNotAllowed"),
  MATCH_IN_PROGRESS: t("error.matchInProgress"),
  COMPETITION_IN_CODE: t("error.competitionInCode"),
  UNKNOWN_JOIN_CODE: t("login.error.wrongid"),
  TEAM_NOT_FOUND: t("error.teamNotFound"),
  MATCH_NOT_FOUND: t("error.matchNotFound"),
  GAME_NOT_FOUND: t("error.gameNotFound"),
  COMPETITION_NOT_FOUND: t("error.competitionNotFound"),
  STALE_MATCH_ID: t("error.staleMatchId"),
  MATCH_FINISHED: t("error.matchFinished"),
  JSON_REQUIRED: t("error.unexpected"),
  TOO_MANY_ATTEMPTS: t("login.error.tooManyAttempts"),
};

/** The server's refusal, from the body of its answer; null for a body that
 *  carries no code this client knows. */
export function apiRefusal(body: unknown, cause?: unknown): I18nError | null {
  if (!isApiErrorBody(body)) return null;
  return new I18nError(API_ERROR_KEYS[body.code], { cause, code: body.code });
}

/** A translation function: react-i18next's `t`, or i18next's own. */
export type Translate = (key: string, params?: Record<string, unknown>) => string;

/** The text to show for a failure: its own message when it carries one,
 *  otherwise the unexpected error's. */
export function errorMessage(e: unknown, t: Translate): string {
  return e instanceof I18nError ? t(e.i18nKey, e.params) : t("error.unexpected");
}
