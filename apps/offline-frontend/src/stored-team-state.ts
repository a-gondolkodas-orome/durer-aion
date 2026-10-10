import { LOCAL_STORAGE_TEAMSTATE, TeamModelDto, MatchStatus, FinishedMatchStatus, LiveGameResult, isPageState, relayResultsStorageKey, strategyResultsStorageKey } from "common-frontend";

// The one place the stored team state is parsed (#367): every read goes through
// this validation instead of trusting JSON.parse's `any`. Anything that does
// not match TeamModelDto — missing, corrupt, or hand-edited — reads as null,
// the same as no stored state at all.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// JSON.stringify turned the Date fields into ISO strings on write; reading
// revives them, so the returned value really is the TeamModelDto it claims.
function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string') {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const isCount = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0;

/// The home page's relay summary as game-report.ts saved it; anything
/// malformed reads as absent, which the home page shows as no summary.
function parseRelayResults(value: unknown): FinishedMatchStatus['relayResults'] {
  if (!Array.isArray(value) || !value.every(it =>
    isRecord(it) && isCount(it.maxPoints) && isCount(it.points) && isCount(it.tries))) {
    return undefined;
  }
  return value.map(it => ({ maxPoints: it.maxPoints, points: it.points, tries: it.tries }));
}

const isLiveGameResult = (value: unknown): value is LiveGameResult =>
  value === 'won' || value === 'lost' || value === 'unfinished';

function parseStrategyResults(value: unknown): FinishedMatchStatus['strategyResults'] {
  return Array.isArray(value) && value.every(isLiveGameResult) ? value : undefined;
}

/// What `JSON.parse` makes of a stored value, or undefined if there is none
/// or it is not JSON.
function readStoredJson(key: string): unknown {
  const stored = localStorage.getItem(key);
  if (stored === null) {
    return undefined;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return undefined;
  }
}

export const readStoredRelayResults = () => parseRelayResults(readStoredJson(relayResultsStorageKey()));
export const readStoredStrategyResults = () => parseStrategyResults(readStoredJson(strategyResultsStorageKey()));

function parseMatchStatus(value: unknown): MatchStatus | null {
  if (!isRecord(value)) {
    return null;
  }
  if (value.state === 'NOT STARTED') {
    return { state: 'NOT STARTED' };
  }
  if (value.state !== 'IN PROGRESS' && value.state !== 'FINISHED') {
    return null;
  }
  const startAt = parseDate(value.startAt);
  const endAt = parseDate(value.endAt);
  if (startAt === null || endAt === null || typeof value.matchID !== 'string') {
    return null;
  }
  if (value.state === 'IN PROGRESS') {
    return { state: 'IN PROGRESS', startAt, endAt, matchID: value.matchID };
  }
  if (typeof value.score !== 'number') {
    return null;
  }
  const finished: FinishedMatchStatus = { state: 'FINISHED', startAt, endAt, matchID: value.matchID, score: value.score };
  const relayResults = parseRelayResults(value.relayResults);
  const strategyResults = parseStrategyResults(value.strategyResults);
  return {
    ...finished,
    ...(relayResults && { relayResults }),
    ...(strategyResults && { strategyResults }),
  };
}

export function readStoredTeamState(): TeamModelDto | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  const stored = localStorage.getItem(LOCAL_STORAGE_TEAMSTATE);
  if (stored === null) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) {
    return null;
  }
  const { teamId, joinCode, teamName, category, credentials, email, pageState } = parsed;
  if (
    typeof teamId !== 'string' || typeof joinCode !== 'string' ||
    typeof teamName !== 'string' || typeof category !== 'string' ||
    typeof credentials !== 'string' || typeof email !== 'string' ||
    !isPageState(pageState)
  ) {
    return null;
  }
  const relayMatch = parseMatchStatus(parsed.relayMatch);
  const strategyMatch = parseMatchStatus(parsed.strategyMatch);
  if (relayMatch === null || strategyMatch === null) {
    return null;
  }
  return {
    teamId,
    joinCode,
    teamName,
    category,
    credentials,
    email,
    pageState,
    relayMatch,
    strategyMatch,
  };
}
