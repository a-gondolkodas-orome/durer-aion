import type { Problem, ProblemId, RelayConfig } from 'schemas';
import type { AdminProblemSearchResultDto } from '../dto/TeamStateDto';
import { ENTITY_SLUG_PATTERN, randomIdPart } from 'schemas';
import { type ProblemForm, problemForm, problemFromForm } from './problem-form';

// The relay's problems as the edit page composes them: in play order, each
// one's points as typed, and the problems the relay brings that nothing holds
// yet — one added as new, or a copy of a shared one, which replaces it in this
// relay only. Those are written with the competition, on its Save. A problem
// picked from those already held joins by its id (ProblemPicker.tsx). As
// elsewhere, the server validates; the form refuses only what it cannot turn
// into a relay.

/** A problem the relay brings. Its id is `random--slug`: the random part
 *  stays, the slug is editable until the save. */
export interface CreatedProblemForm {
  random: string;
  slug: string;
  problem: ProblemForm;
  /** The problem it is a copy of, whose hints it keeps. */
  copyOf?: Problem;
}

export interface RelayEntryForm {
  /** Stays with the entry as it moves. */
  key: string;
  points: string;
  /** The problem a held entry refers to; undefined for a created one. */
  problemId?: ProblemId;
  /** A held problem picked on this page, which the competition's own
   *  `relayProblems` do not carry. */
  picked?: AdminProblemSearchResultDto;
  created?: CreatedProblemForm;
}

export type EntryErrors = Partial<Record<'points' | 'slug' | 'answer', string>>;

export function relayForm(relay: RelayConfig | undefined): RelayEntryForm[] {
  return (relay?.problems ?? []).map(({ problemId, points }, index) => ({
    key: `${index}:${problemId}`, points: String(points), problemId,
  }));
}

export function entryProblemId(entry: RelayEntryForm): ProblemId {
  if (entry.created === undefined) return entry.problemId ?? '';
  return `${entry.created.random}--${entry.created.slug.trim()}`;
}

/** A new, empty problem, with `points` to start from. */
export function newEntry(points: string, random = randomIdPart()): RelayEntryForm {
  return {
    key: `új:${random}`, points,
    created: { random, slug: '', problem: { ...problemForm({ id: '', answer: 0, content: {} }), answer: '' } },
  };
}

/** Problems picked from those already held, each at `points`. */
export function pickedEntries(picked: readonly AdminProblemSearchResultDto[], points: string): RelayEntryForm[] {
  return picked.map(each => ({ key: `választott:${each.problem.id}`, points, problemId: each.problem.id, picked: each }));
}

/** A copy of `problem` in place of `entry`: the same content under a new id
 *  with the same slug, the points kept. */
export function copyEntry(entry: RelayEntryForm, problem: Problem, random = randomIdPart()): RelayEntryForm {
  return {
    key: `új:${random}`, points: entry.points,
    created: { random, slug: problem.id.split('--').slice(1).join('--'), problem: problemForm(problem), copyOf: problem },
  };
}

export function move<T>(entries: readonly T[], index: number, by: -1 | 1): T[] {
  const to = index + by;
  if (to < 0 || to >= entries.length) return [...entries];
  const moved = [...entries];
  [moved[index], moved[to]] = [moved[to], moved[index]];
  return moved;
}

const NOT_A_NUMBER = 'Egész számot írj ide.';

/** The relay's problems and the problems it brings, or what of an entry the
 *  form cannot read, by the entry's key. */
export function relayFromForm(entries: readonly RelayEntryForm[]):
  { problems: RelayConfig['problems'], created: Problem[] } | { errors: Record<string, EntryErrors> } {
  const errors: Record<string, EntryErrors> = {};
  const problems: RelayConfig['problems'] = [];
  const created: Problem[] = [];
  for (const entry of entries) {
    const entryErrors: EntryErrors = {};
    const points = entry.points.trim();
    if (!/^-?\d+$/.test(points)) entryErrors.points = NOT_A_NUMBER;
    const problemId = entryProblemId(entry);
    if (entry.created !== undefined) {
      const { slug, problem, copyOf } = entry.created;
      if (!ENTITY_SLUG_PATTERN.test(slug.trim())) {
        entryErrors.slug = 'Kisbetűk és számok, a szavak között egy-egy kötőjel, ékezet nélkül.';
      }
      const read = problemFromForm(problem, { ...copyOf ?? { answer: 0, content: {} }, id: problemId });
      if ('answerError' in read) entryErrors.answer = read.answerError;
      else created.push(read.problem);
    }
    if (Object.keys(entryErrors).length > 0) errors[entry.key] = entryErrors;
    else problems.push({ problemId, points: Number(points) });
  }
  return Object.keys(errors).length > 0 ? { errors } : { problems, created };
}

