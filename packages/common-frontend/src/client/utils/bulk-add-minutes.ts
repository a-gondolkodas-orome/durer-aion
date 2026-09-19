import { BulkAddMinutesDto } from '../dto/TeamStateDto';

/** A fresh grant for one extension.
 *
 * The server records it against every match it moves and refuses to move a
 * match twice under the same one, so this is what makes sending the request
 * again safe — the case being a walk the server finished and the browser gave
 * up on. That only works if the retry carries the grant the abandoned attempt
 * used, which is what {@link grantFor} is for. Short and hex because it is
 * appended to the team's notes, whose length the admin routes share with the
 * organisers' own text, and because the route only takes a grant that fits
 * there (`isGrant` in the backend's `add_minutes.ts`).
 */
function newGrant(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/** Where the grant of a walk that has not answered yet is kept. */
export const pendingGrantStorageKey = 'durer-bulk-add-minutes-grant';

/** How long an unanswered grant is still a retry of the same extension rather
 *  than a new one. Long enough to cover a walk that ran to the request timeout
 *  and an organiser deciding what to do about it; short enough that this
 *  morning's abandoned grant is not taken for this afternoon's. */
const PENDING_GRANT_TTL_MS = 30 * 60 * 1000;

interface PendingGrant {
  minutes: number;
  grant: string;
  /** When the attempt it belongs to was made, as `Date.now()`. */
  at: number;
}

const isPendingGrant = (value: unknown): value is PendingGrant =>
  typeof value === 'object' && value !== null
  && typeof (value as PendingGrant).minutes === 'number'
  && typeof (value as PendingGrant).grant === 'string'
  && typeof (value as PendingGrant).at === 'number';

/** The copy that answers when the browser refuses storage — a private window,
 *  or cookies turned off. It leaves the reload case unhandled, which is the
 *  best that can be done without somewhere to write. */
let inMemory: PendingGrant | null = null;

/** Whether the last write reached storage. A browser can refuse to write while
 *  still reading happily, and an empty read there means "nothing was ever
 *  written", not "nothing is pending" — so it is only in that case that the
 *  in-memory copy stands in. Where storage works it is the single answer, which
 *  is what lets a second tab see the first one's grant, and see it cleared. */
let storageDenied = false;

function readPending(): PendingGrant | null {
  try {
    const raw = window.localStorage.getItem(pendingGrantStorageKey);
    if (raw === null) return storageDenied ? inMemory : null;
    const parsed: unknown = JSON.parse(raw);
    return isPendingGrant(parsed) ? parsed : null;
  } catch {
    return inMemory;
  }
}

function writePending(pending: PendingGrant | null): void {
  inMemory = pending;
  try {
    if (pending === null) window.localStorage.removeItem(pendingGrantStorageKey);
    else window.localStorage.setItem(pendingGrantStorageKey, JSON.stringify(pending));
    storageDenied = false;
  } catch {
    storageDenied = true;
  }
}

/**
 * The grant to send for an extension of `minutes` — the one an unanswered walk
 * used, or a fresh one.
 *
 * In storage rather than in the page, because the walk can run for minutes and
 * what the grant has to survive is exactly the window in which the organiser
 * reloads, or opens the admin page in a second tab, having seen nothing happen.
 * A grant lost that way makes the next press a new extension, which moves every
 * match the abandoned walk already reached a second time — the thing the grant
 * exists to prevent. `sessionStorage` would not reach the second tab.
 *
 * A different number of minutes is a different intent, not the same one asked
 * for again, so it takes a new grant.
 */
export function grantFor(minutes: number, now = Date.now()): string {
  const pending = readPending();
  const unanswered = pending !== null
    && pending.minutes === minutes
    && now - pending.at < PENDING_GRANT_TTL_MS;
  const grant = unanswered ? pending.grant : newGrant();
  writePending({ minutes, grant, at: now });
  return grant;
}

/** The walk answered, so the next press means a second, deliberate extension. */
export function forgetGrant(): void {
  writePending(null);
}

/** How many of the teams left out are named before the line only counts them.
 *  A walk at the end of a round can leave out every match that has just
 *  finished, and a snackbar is one line. */
const NAMED_PROBLEMS = 10;

/** Why the server left a match alone, in the organiser's language. An unknown
 *  code is shown as it came rather than swallowed: a reason added server-side
 *  should read oddly here, not disappear. */
const REASONS: Record<string, string> = {
  'match-not-found': 'nincs ilyen meccs',
  'team-not-found': 'nincs meg a csapat',
  'other-match-running': 'másik meccs fut',
  'no-match-running': 'nem fut meccs',
  'game-not-found': 'ismeretlen játék',
  error: 'hiba',
};

/** The one line the organiser reads afterwards.
 *
 * It names the teams that were left out, because not being able to tell which
 * is what made the old button dangerous to press again — up to
 * {@link NAMED_PROBLEMS} of them, and a count for the rest.
 */
export function bulkAddMinutesMessage(result: BulkAddMinutesDto, minutes: number): string {
  const parts = [`${result.extended.length} meccs kapott +${minutes} percet`];
  if (result.alreadyGranted.length > 0) {
    parts.push(`${result.alreadyGranted.length} már megkapta`);
  }
  if (result.problems.length > 0) {
    const named = result.problems
      .slice(0, NAMED_PROBLEMS)
      .map(problem => `${problem.teamName} (${REASONS[problem.reason] ?? problem.reason})`)
      .join(', ');
    const unnamed = result.problems.length - NAMED_PROBLEMS;
    parts.push(`${result.problems.length} sikertelen: ${named}`
      + (unnamed > 0 ? ` és még ${unnamed}` : ''));
  }
  return parts.join(', ');
}

/** How loudly to report it: everything moved, some of it, or none of it. */
export function bulkAddMinutesVariant(result: BulkAddMinutesDto): 'success' | 'warning' | 'error' {
  if (result.problems.length === 0) return 'success';
  return result.extended.length + result.alreadyGranted.length > 0 ? 'warning' : 'error';
}

/** What to say when the walk never answered.
 *
 * The grant is kept, so the same button is the retry and the matches already
 * moved will not move again. Saying so is the point: an organiser who reads
 * only the error goes looking for another way to give the time, and the walk
 * may well have finished on the server after the browser stopped waiting.
 */
export function bulkAddMinutesRetryMessage(error: string): string {
  return `${error} — nyomd meg újra, a már meghosszabbított meccsek nem kapnak kétszer időt.`;
}
