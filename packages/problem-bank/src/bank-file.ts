import type { CompetitionConfig, CompetitionId, Problem, ProblemId } from 'schemas';
import { competitionName } from 'schemas';
import type { Bundle } from './bundle';
import { sameBody } from './bundle';
import type { Bank } from './registry';

// A bundle made into a file under banks/: how a competition held in the
// database goes back into code (README § Adding a competition).

/// The bank a bundle makes, beside the banks `registry` holds: the
/// competitions and problems of the bundle the registry does not have. Those
/// it has as the bundle does are `leftOut`, since `createRegistry` refuses an
/// id two banks hold: a relay reuses older problems, and a bundle of every
/// competition on a server holds the in-code ones too. One the registry has in
/// another form is an error, and so is a bundle with no competition left.
export function bankFromBundle(
  bundle: Bundle,
  registry: { problems: ReadonlyMap<ProblemId, Problem>, competitions: ReadonlyMap<CompetitionId, CompetitionConfig> },
): { bank: Bank, leftOut: string[] } | { errors: string[] } {
  const errors: string[] = [];
  const leftOut: string[] = [];
  const notHeld = <T extends object>(kind: string, bodies: Record<string, T>, held: ReadonlyMap<string, object>) => {
    const kept: Record<string, T> = {};
    for (const [id, body] of Object.entries(bodies)) {
      const inCode = held.get(id);
      if (inCode === undefined) kept[id] = body;
      else if (sameBody(body, inCode)) leftOut.push(id);
      else errors.push(`The ${kind} ${id} is in code already, and differs from the bundle's`);
    }
    return kept;
  };
  const competitions = notHeld('competition', bundle.competitions, registry.competitions);
  const problems = notHeld('problem', bundle.problems, registry.problems);
  if (errors.length === 0 && Object.keys(competitions).length === 0) {
    errors.push('Every competition of the bundle is in code already');
  }
  if (errors.length > 0) return { errors };
  return { bank: { competitions, problems }, leftOut };
}

/// The source of a file under banks/ that exports `bank`. The literals are
/// JSON: valid TypeScript, which the banks' ESLint rules pass as it is.
export function bankFile(bank: Bank): string {
  const titles = Object.entries(bank.competitions).map(([id, { metadata }]) =>
    competitionName(metadata) ?? (metadata.kind === 'other' ? metadata.label.hu ?? metadata.label.en : undefined) ?? id);
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
