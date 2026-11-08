import type {
  CompetitionConfig,
  CompetitionId,
  CompetitionSource,
  Problem,
  ProblemId,
  ProblemSource,
  StrategyGameId,
  StrategyGameInfo,
} from 'schemas';
import { validateCompetition, validateProblem } from 'schemas';
import type { CompetitionBank, ProblemBank } from './sources';
import { fromBanks, inCodeCompetitionSource, inCodeProblemSource } from './sources';

/// What one file under banks/ exports: a round's competitions, or a practice
/// set, and the problems they bring with them. Either half may be empty: a
/// set can be made of problems another bank already holds.
export interface Bank {
  problems: ProblemBank;
  competitions: CompetitionBank;
}

/// The competitions and problems one app serves, with the sources over them.
export interface Registry {
  problems: ReadonlyMap<ProblemId, Problem>;
  competitions: ReadonlyMap<CompetitionId, CompetitionConfig>;
  problemSource: ProblemSource;
  competitionSource: CompetitionSource;
}

/// The registry of the given banks. An id two of them share is an error.
export function createRegistry(banks: readonly Bank[]): Registry {
  const problems = fromBanks(banks.map(bank => bank.problems));
  const competitions = fromBanks(banks.map(bank => bank.competitions));
  return {
    problems,
    competitions,
    problemSource: inCodeProblemSource(problems),
    competitionSource: inCodeCompetitionSource(competitions),
  };
}

/// Every way the registry breaks the rules, as messages; none means it is
/// valid. The strategy games are the `game` package's `strategyGames`, passed
/// in so that this package needs no game at run time.
export function validateRegistry(
  registry: Registry,
  strategyGames: Readonly<Record<StrategyGameId, StrategyGameInfo>>,
): string[] {
  const references = {
    problems: registry.problems,
    strategyGames: new Map(Object.entries(strategyGames)),
  };
  const errors = [
    ...[...registry.problems.values()].flatMap(validateProblem),
    ...[...registry.competitions.values()].flatMap(competition => validateCompetition(competition, references)),
  ];
  // A problem and a competition never share an id either: the format is the
  // same, and an id names one thing wherever it is read.
  for (const id of registry.problems.keys()) {
    if (registry.competitions.has(id)) errors.push(`${id} names both a problem and a competition`);
  }
  return errors;
}

/// `validateRegistry`, throwing every message at once. The server calls it as
/// it starts, so a registry that went out without CI stops the server rather
/// than a team's match.
export function assertValidRegistry(
  registry: Registry,
  strategyGames: Readonly<Record<StrategyGameId, StrategyGameInfo>>,
): void {
  const errors = validateRegistry(registry, strategyGames);
  if (errors.length > 0) {
    throw new Error(`The competition registry is invalid:\n${errors.map(error => `  - ${error}`).join('\n')}`);
  }
}
