import type { CompetitionId, StrategyGameId, StrategyGameInfo } from 'schemas';
import type { Bundle } from './bundle';
import type { Bank, Registry } from './registry';
import { createRegistry, validateRegistry } from './registry';
import type { CompetitionBank } from './sources';

// A bundle made into a file under banks/ (README § In the database, and back
// into code).

/// The bank that the competitions `ids` of `bundle` make beside `banks`, with
/// the bundle's problems their relays use and no other, or why it makes none:
/// an id the bundle does not hold, or anything the registry of `banks` and the
/// new bank breaks, as the server would find it at start — an id both hold
/// among it, so a round's competitions that share a problem are banked in one
/// run. The export does not validate, so this is where a stored competition
/// the rules have come to refuse is caught, before it is a file.
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
  const competitions: CompetitionBank = Object.fromEntries(ids.map(id => [id, bundle.competitions[id]]));
  const used = new Set(Object.values(competitions)
    .flatMap(competition => competition.relay?.problems.map(({ problemId }) => problemId) ?? []));
  const bank: Bank = { competitions, problems: Object.fromEntries(Object.entries(bundle.problems).filter(([id]) => used.has(id))) };
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
  return [
    "import type { CompetitionBank, ProblemBank } from '../src/sources';",
    '',
    '// TODO: which round this is. Made from a bundle exported from the database,',
    '// with the problems its relays use.',
    '',
    `export const competitions: CompetitionBank = ${JSON.stringify(bank.competitions, null, 2)};`,
    '',
    `export const problems: ProblemBank = ${JSON.stringify(bank.problems, null, 2)};`,
    '',
  ].join('\n');
}
