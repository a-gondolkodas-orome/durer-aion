import { teamStateStorageKey, TeamModelDto, MatchStatus } from "common-frontend";

// The one place the stored team state is parsed (#367): every read goes through
// this validation instead of trusting JSON.parse's `any`. Anything that does
// not match TeamModelDto — missing, corrupt, or hand-edited — reads as null,
// the same as no stored state at all.

const PAGE_STATES: readonly string[] = ['DISCLAIMER', 'HOME', 'RELAY', 'STRATEGY'] satisfies TeamModelDto['pageState'][];

function isPageState(value: unknown): value is TeamModelDto['pageState'] {
  return typeof value === 'string' && PAGE_STATES.includes(value);
}

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
  return { state: 'FINISHED', startAt, endAt, matchID: value.matchID, score: value.score };
}

export function readStoredTeamState(): TeamModelDto | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  const stored = localStorage.getItem(teamStateStorageKey());
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
