import { BulkAddMinutesDto } from '../dto/TeamStateDto';

/** A fresh grant for one press of the button.
 *
 * The server records it against every match it moves and refuses to move a
 * match twice under the same one, so this is what makes sending the request
 * again safe — the case being a walk the server finished and the browser gave
 * up on. Short because it is appended to the team's notes, which has a length
 * the admin routes share with the organisers' own text.
 */
export function newGrant(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

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
 * It names every team that was left out, because not being able to tell which
 * is what made the old button dangerous to press again.
 */
export function bulkAddMinutesMessage(result: BulkAddMinutesDto, minutes: number): string {
  const parts = [`${result.extended.length} meccs kapott +${minutes} percet`];
  if (result.alreadyGranted.length > 0) {
    parts.push(`${result.alreadyGranted.length} már megkapta`);
  }
  if (result.problems.length > 0) {
    const named = result.problems
      .map(problem => `${problem.teamName} (${REASONS[problem.reason] ?? problem.reason})`)
      .join(', ');
    parts.push(`${result.problems.length} sikertelen: ${named}`);
  }
  return parts.join(', ');
}

/** How loudly to report it: everything moved, some of it, or none of it. */
export function bulkAddMinutesVariant(result: BulkAddMinutesDto): 'success' | 'warning' | 'error' {
  if (result.problems.length === 0) return 'success';
  return result.extended.length + result.alreadyGranted.length > 0 ? 'warning' : 'error';
}
