import type { CompetitionId, StrategyGameId, StrategyGameInfo } from 'schemas';
import { competitionTitle } from 'schemas';
import type { Bundle } from './bundle';
import type { Bank, Registry } from './registry';
import { createRegistry, validateRegistry } from './registry';
import type { CompetitionBank } from './sources';

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

/// The bank that the competitions `ids` of `bundle` make beside `banks`, with
/// the bundle's problems their relays use and no other, or why it makes none:
/// an id the bundle does not hold, a problem `banks` hold otherwise than the
/// bundle does, or anything the registry of `banks` and the new bank breaks,
/// as the server would find it at start. The export does not validate, so this
/// is where a stored competition the rules have come to refuse is caught,
/// before it is a file. A problem `banks` hold as the bundle does is left to
/// them, as when the competitions of one round are banked one at a time.
/// `strategyGames` is the `game` package's.
export function bankFromBundle(
  bundle: Bundle,
  ids: readonly CompetitionId[],
  banks: readonly Bank[],
  strategyGames: Readonly<Record<StrategyGameId, StrategyGameInfo>>,
): { bank: Bank } | { errors: string[] } {
  if (ids.length === 0) return { errors: ['No competition is named'] };
  const missing = ids.filter(id => !(id in bundle.competitions));
  if (missing.length > 0) {
    return { errors: missing.map(id => `The bundle holds no competition ${id}`) };
  }
  const inCode = createRegistry(banks).problems;
  const competitions: CompetitionBank = Object.fromEntries(ids.map(id => [id, bundle.competitions[id]]));
  const used = new Set(Object.values(competitions)
    .flatMap(competition => competition.relay?.problems.map(({ problemId }) => problemId) ?? []));
  const usedProblems = Object.entries(bundle.problems).filter(([id]) => used.has(id));
  const differing = usedProblems.filter(([id, body]) => {
    const held = inCode.get(id);
    return held !== undefined && !sameJson(held, { ...body, id });
  }).map(([id]) => `The problem ${id} is in code already, and differs there`);
  if (differing.length > 0) return { errors: differing };
  const bank: Bank = { competitions, problems: Object.fromEntries(usedProblems.filter(([id]) => !inCode.has(id))) };
  let registry: Registry;
  try {
    registry = createRegistry([...banks, bank]);
  } catch (error) {
    return { errors: [error instanceof Error ? error.message : String(error)] };
  }
  const invalid = validateRegistry(registry, strategyGames);
  return invalid.length > 0 ? { errors: invalid } : { bank };
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
