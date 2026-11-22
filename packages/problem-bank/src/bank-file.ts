import type { CompetitionConfig, CompetitionId, Problem, ProblemId } from 'schemas';
import { competitionTitle } from 'schemas';
import type { Bundle } from './bundle';
import { problemsReferredFrom } from './bundle';
import type { Bank } from './registry';

// A bundle made into a file under banks/ (README § In the database, and back
// into code).

/// The bank a bundle makes beside `registry`, or why it makes none: an id the
/// registry holds already, since `createRegistry` refuses an id two banks
/// hold, a relay problem neither holds, or no competition.
export function bankFromBundle(
  bundle: Bundle,
  registry: { problems: ReadonlyMap<ProblemId, Problem>, competitions: ReadonlyMap<CompetitionId, CompetitionConfig> },
): { bank: Bank } | { errors: string[] } {
  const errors = [
    ...Object.keys(bundle.competitions).filter(id => registry.competitions.has(id))
      .map(id => `The competition ${id} is in code already`),
    ...Object.keys(bundle.problems).filter(id => registry.problems.has(id))
      .map(id => `The problem ${id} is in code already`),
    ...problemsReferredFrom(bundle).filter(id => !registry.problems.has(id))
      .map(id => `A relay uses the problem ${id}, which neither the bundle nor the code holds`),
  ];
  if (Object.keys(bundle.competitions).length === 0) errors.push('The bundle holds no competition');
  if (errors.length > 0) return { errors };
  return { bank: { competitions: bundle.competitions, problems: bundle.problems } };
}

/// The source of a file under banks/ that exports `bank`. The literals are
/// JSON: valid TypeScript, which the banks' ESLint rules pass as it is.
export function bankFile(bank: Bank): string {
  const titles = Object.entries(bank.competitions).map(([id, { metadata }]) => competitionTitle({ id, metadata }));
  return [
    "import type { CompetitionBank, ProblemBank } from '../src/sources';",
    '',
    `// ${titles.join(', ')}: made from a bundle exported from the database,`,
    '// with the problems it held that no other bank holds.',
    '',
    `export const competitions: CompetitionBank = ${JSON.stringify(bank.competitions, null, 2)};`,
    '',
    `export const problems: ProblemBank = ${JSON.stringify(bank.problems, null, 2)};`,
    '',
  ].join('\n');
}
