import type { CompetitionConfig, Problem, ProblemId, StrategyGameId, StrategyGameInfo } from 'schemas';
import { competitionShapeErrors, problemShapeErrors, validateCompetition, validateProblem } from 'schemas';
import type { CompetitionBank, ProblemBank } from './sources';

// A bundle is how competitions and problems move between servers, and into
// the database from a file: the two maps a `banks/*.ts` file exports, as JSON,
// with a header that says what the file is. So a bundle and a bank file are
// the same data, and either one can be made from the other.

const BUNDLE_FORMAT = 'durer-competitions';
const BUNDLE_VERSION = 1;

export interface Bundle {
  format: typeof BUNDLE_FORMAT;
  version: typeof BUNDLE_VERSION;
  competitions: CompetitionBank;
  problems: ProblemBank;
}

// Not the one in `schemas`: lint runs before `schemas` is built, and its
// narrowing would then change what the cast below needs.
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/// The bundle `value` is, or every way it is not one, as messages. Only its
/// shape is checked here; whether it keeps the rules is `validateBundle`'s.
export function readBundle(value: unknown): { bundle: Bundle } | { errors: string[] } {
  if (!isRecord(value)) return { errors: ['A fájl nem egy JSON objektum.'] };
  if (value.format !== BUNDLE_FORMAT) {
    return { errors: [`A fájl nem versenycsomag: a format mezője „${BUNDLE_FORMAT}” kell legyen.`] };
  }
  if (value.version !== BUNDLE_VERSION) {
    return { errors: [`A versenycsomag ${String(value.version)}. változatát nem ismerjük, csak a ${BUNDLE_VERSION}.-et.`] };
  }
  const errors: string[] = [];
  const unknown = Object.keys(value).filter(key => !['format', 'version', 'competitions', 'problems'].includes(key));
  if (unknown.length > 0) errors.push(`Ismeretlen mező a versenycsomagban: ${unknown.join(', ')}`);
  const { competitions, problems } = value;
  if (!isRecord(competitions)) errors.push('A competitions mező nem objektum.');
  if (!isRecord(problems)) errors.push('A problems mező nem objektum.');
  if (!isRecord(competitions) || !isRecord(problems)) return { errors };
  if (Object.keys(competitions).length === 0 && Object.keys(problems).length === 0) {
    errors.push('A versenycsomag üres: nincs benne sem verseny, sem feladat.');
  }
  errors.push(
    ...Object.entries(problems).flatMap(([id, body]) => problemShapeErrors(id, body)),
    ...Object.entries(competitions).flatMap(([id, body]) => competitionShapeErrors(id, body)),
  );
  if (errors.length > 0) return { errors };
  return { bundle: value as unknown as Bundle };
}

/// The bundle of `competitions` and every problem their relays use, taken
/// from `problems`, so that it stands alone: it imports on a server that
/// holds none of them. Competitions keep the order given, and problems the
/// order their relays first use them in.
export function bundleOf(
  competitions: readonly CompetitionConfig[],
  problems: ReadonlyMap<ProblemId, Problem>,
): Bundle {
  return {
    format: BUNDLE_FORMAT,
    version: BUNDLE_VERSION,
    competitions: Object.fromEntries(competitions.map(({ id, ...body }) => [id, body])),
    problems: Object.fromEntries(relayProblemIds(competitions).map((problemId) => {
      const problem = problems.get(problemId);
      if (problem === undefined) throw new Error(`A relay uses the problem ${problemId}, which is missing`);
      const { id, ...body } = problem;
      return [id, body];
    })),
  };
}

/// The ids of `bundle`'s competitions and problems that `held` holds just as
/// the bundle has them: an exported bundle carries in-code ones, and those
/// need no writing.
export function heldAlike(
  bundle: Bundle,
  held: { competitions: ReadonlyMap<string, object>, problems: ReadonlyMap<string, object> },
): Set<string> {
  const alike = (bodies: Record<string, object>, holder: ReadonlyMap<string, object>) =>
    Object.entries(bodies).flatMap(([id, body]) => {
      const inCode = holder.get(id);
      return inCode !== undefined && sameBody(body, inCode) ? [id] : [];
    });
  return new Set([...alike(bundle.competitions, held.competitions), ...alike(bundle.problems, held.problems)]);
}

/// Whether two competitions, or two problems, say the same, whatever order
/// their fields were written in and whichever carries its id.
function sameBody(a: object, b: object): boolean {
  // JSON leaves out a field set to undefined, which an id then is.
  return canonical({ ...a, id: undefined }) === canonical({ ...b, id: undefined });
}

/// JSON with every object's keys in order.
function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) => isRecord(item)
    ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
    : item);
}

/// The problems the relays of `competitions` use, each once, in the order
/// they are first used.
export function relayProblemIds(competitions: readonly Pick<CompetitionConfig, 'relay'>[]): ProblemId[] {
  return [...new Set(competitions.flatMap(({ relay }) => relay?.problems.map(({ problemId }) => problemId) ?? []))];
}

/// The problems of `bundle`'s relays that it does not hold itself: a bundle
/// may build on problems the server already has.
export function problemsReferredFrom(bundle: Bundle): ProblemId[] {
  return relayProblemIds(Object.values(bundle.competitions)).filter(id => !(id in bundle.problems));
}

/// Every way `bundle` breaks the rules, as messages; none means it is valid.
/// `problems` are those of `problemsReferredFrom` that the server has, and
/// the strategy games are the `game` package's `strategyGames`, as
/// `validateRegistry` takes them.
export function validateBundle(
  bundle: Bundle,
  problems: ReadonlyMap<ProblemId, Problem>,
  strategyGames: Readonly<Record<StrategyGameId, StrategyGameInfo>>,
): string[] {
  const own = Object.entries(bundle.problems).map(([id, body]): Problem => ({ ...body, id }));
  const references = {
    problems: new Map([...problems, ...own.map(problem => [problem.id, problem] as const)]),
    strategyGames: new Map(Object.entries(strategyGames)),
  };
  const errors = [
    ...own.flatMap(validateProblem),
    ...Object.entries(bundle.competitions)
      .map(([id, body]): CompetitionConfig => ({ ...body, id }))
      .flatMap(competition => validateCompetition(competition, references)),
  ];
  // As `validateRegistry` says: an id names one thing wherever it is read.
  for (const id of Object.keys(bundle.problems)) {
    if (id in bundle.competitions) errors.push(`${id} egy feladat és egy verseny azonosítója is`);
  }
  return errors;
}
