import type { CompetitionId } from 'schemas';
import { competitionTitle } from 'schemas';
import type { Bundle } from './bundle';
import { problemsReferredFrom } from './bundle';
import type { Bank, Registry } from './registry';
import type { CompetitionBank, ProblemBank } from './sources';

// A bundle made into a file under banks/ (README § In the database, and back
// into code).

/// Whether two JSON values are the same, whatever order their keys are in:
/// PostgreSQL's jsonb does not keep the order they were written in.
function sameJson(a: unknown, b: unknown): boolean {
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const aKeys = Object.keys(a);
  const bValues = b as Record<string, unknown>;
  return aKeys.length === Object.keys(b).length
    && aKeys.every(key => key in b && sameJson((a as Record<string, unknown>)[key], bValues[key]));
}

/// The bank that the competitions `ids` of `bundle` make beside `registry`,
/// with the bundle's problems their relays use and no other, or why it makes
/// none: an id the bundle does not hold, a competition the registry holds
/// already, since `createRegistry` refuses an id two banks hold, a problem
/// the registry holds otherwise than the bundle does, or a relay problem
/// neither holds. A problem the registry holds as the bundle does is left to
/// it, as when the competitions of one round are banked one at a time.
export function bankFromBundle(
  bundle: Bundle,
  ids: readonly CompetitionId[],
  registry: Pick<Registry, 'competitions' | 'problems'>,
): { bank: Bank } | { errors: string[] } {
  if (ids.length === 0) return { errors: ['No competition is named'] };
  const missing = ids.filter(id => !(id in bundle.competitions));
  if (missing.length > 0) {
    return { errors: missing.map(id => `The bundle holds no competition ${id}`) };
  }
  const competitions: CompetitionBank = Object.fromEntries(ids.map(id => [id, bundle.competitions[id]]));
  const used = new Set(Object.values(competitions)
    .flatMap(competition => competition.relay?.problems.map(({ problemId }) => problemId) ?? []));
  const usedProblems = Object.entries(bundle.problems).filter(([id]) => used.has(id));
  const differing = usedProblems.filter(([id, body]) => {
    const held = registry.problems.get(id);
    return held !== undefined && !sameJson(held, { ...body, id });
  }).map(([id]) => id);
  const problems: ProblemBank = Object.fromEntries(usedProblems.filter(([id]) => !registry.problems.has(id)));
  const referred = problemsReferredFrom({ ...bundle, competitions, problems });
  const errors = [
    ...Object.keys(competitions).filter(id => registry.competitions.has(id))
      .map(id => `The competition ${id} is in code already`),
    ...differing.map(id => `The problem ${id} is in code already, and differs there`),
    ...referred.filter(id => !registry.problems.has(id))
      .map(id => `A relay uses the problem ${id}, which neither the bundle nor the code holds`),
  ];
  if (errors.length > 0) return { errors };
  return { bank: { competitions, problems } };
}

/// The source of a file under banks/ that exports `bank`. The literals are
/// JSON: valid TypeScript, which the banks' ESLint rules pass as it is.
export function bankFile(bank: Bank): string {
  const titles = Object.entries(bank.competitions).map(([id, { metadata }]) => competitionTitle({ id, metadata }));
  return [
    "import type { CompetitionBank, ProblemBank } from '../src/sources';",
    '',
    `// ${titles.join(', ')}: made from a bundle exported from the database,`,
    '// with the problems their relays use that no other bank holds.',
    '',
    `export const competitions: CompetitionBank = ${JSON.stringify(bank.competitions, null, 2)};`,
    '',
    `export const problems: ProblemBank = ${JSON.stringify(bank.problems, null, 2)};`,
    '',
  ].join('\n');
}
