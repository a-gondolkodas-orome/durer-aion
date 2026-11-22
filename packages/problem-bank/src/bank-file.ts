import type { CompetitionConfig, CompetitionId, Problem, ProblemId } from 'schemas';
import { competitionTitle } from 'schemas';
import type { Bundle } from './bundle';
import { problemsReferredFrom } from './bundle';
import type { Bank } from './registry';
import type { CompetitionBank, ProblemBank } from './sources';

// A bundle made into a file under banks/ (README § In the database, and back
// into code).

/// The bank that the competitions `ids` of `bundle` make beside `registry`,
/// with the bundle's problems their relays use and no other, or why it makes
/// none: an id the bundle does not hold, an id the registry holds already,
/// since `createRegistry` refuses an id two banks hold, or a relay problem
/// neither holds. `referred` are the relays' problems the registry holds.
export function bankFromBundle(
  bundle: Bundle,
  ids: readonly CompetitionId[],
  registry: { problems: ReadonlyMap<ProblemId, Problem>, competitions: ReadonlyMap<CompetitionId, CompetitionConfig> },
): { bank: Bank, referred: ProblemId[] } | { errors: string[] } {
  if (ids.length === 0) return { errors: ['No competition is named'] };
  const missing = ids.filter(id => !(id in bundle.competitions));
  if (missing.length > 0) {
    return { errors: missing.map(id => `The bundle holds no competition ${id}`) };
  }
  const competitions: CompetitionBank = Object.fromEntries(ids.map(id => [id, bundle.competitions[id]]));
  const used = new Set(Object.values(competitions)
    .flatMap(competition => competition.relay?.problems.map(({ problemId }) => problemId) ?? []));
  const problems: ProblemBank = Object.fromEntries(Object.entries(bundle.problems).filter(([id]) => used.has(id)));
  const referred = problemsReferredFrom({ ...bundle, competitions, problems });
  const errors = [
    ...Object.keys(competitions).filter(id => registry.competitions.has(id))
      .map(id => `The competition ${id} is in code already`),
    ...Object.keys(problems).filter(id => registry.problems.has(id))
      .map(id => `The problem ${id} is in code already`),
    ...referred.filter(id => !registry.problems.has(id))
      .map(id => `A relay uses the problem ${id}, which neither the bundle nor the code holds`),
  ];
  if (errors.length > 0) return { errors };
  return { bank: { competitions, problems }, referred };
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
