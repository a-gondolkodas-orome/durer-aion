import type {
  CompetitionConfig,
  CompetitionId,
  CompetitionSource,
  Problem,
  ProblemId,
  ProblemSource,
  StrategyGameId,
  StrategyGameInfo,
  ValidationFinding,
} from 'schemas';
import { formatFinding, validateCompetition, validateProblem } from 'schemas';
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

/// Every way the registry breaks the rules; none means it is valid. The
/// strategy games are the `game` package's `strategyGames`, passed in so that
/// this package needs no game at run time.
export function validateRegistry(
  registry: Registry,
  strategyGames: Readonly<Record<StrategyGameId, StrategyGameInfo>>,
): ValidationFinding[] {
  const references = {
    problems: registry.problems,
    strategyGames: new Map(Object.entries(strategyGames)),
  };
  const findings: ValidationFinding[] = [
    ...[...registry.problems.values()].flatMap(validateProblem),
    ...[...registry.competitions.values()].flatMap(competition => validateCompetition(competition, references)),
  ];
  // A problem and a competition never share an id either: the format is the
  // same, and an id names one thing wherever it is read.
  for (const id of registry.problems.keys()) {
    if (registry.competitions.has(id)) findings.push({ code: 'ID_NAMES_BOTH', params: { id } });
  }
  return findings;
}

function bulleted(findings: readonly ValidationFinding[]): string {
  return findings.map(finding => `  - ${formatFinding(finding)}`).join('\n');
}

/// `validateRegistry`, throwing every finding at once, in English. The server
/// calls it as it starts, so a registry that went out without CI stops the
/// server rather than a team's match.
export function assertValidRegistry(
  registry: Registry,
  strategyGames: Readonly<Record<StrategyGameId, StrategyGameInfo>>,
): void {
  const findings = validateRegistry(registry, strategyGames);
  if (findings.length > 0) {
    throw new Error(`The competition registry is invalid:\n${bulleted(findings)}`);
  }
}

/// `competitions`, refusing a competition it hands out that breaks the rules
/// or refers to a problem `problems` does not have or a strategy game not in
/// `strategyGames`. The registry is checked whole at start; this is for a
/// competition a source starts handing out after it.
///
/// `getCompetition` rejects an invalid competition. `listCompetitions` leaves
/// it out and logs it, so one bad competition does not take the admin page's
/// list, or a whole team import, down with it.
export function validatingCompetitionSource(
  competitions: CompetitionSource,
  problems: ProblemSource,
  strategyGames: Readonly<Record<StrategyGameId, StrategyGameInfo>>,
): CompetitionSource {
  const games = new Map(Object.entries(strategyGames));
  async function validated(competition: CompetitionConfig): Promise<CompetitionConfig> {
    const ids = competition.relay?.problems.map(({ problemId }) => problemId) ?? [];
    const findings = validateCompetition(competition, { problems: await problems.getProblems(ids), strategyGames: games });
    if (findings.length > 0) {
      throw new Error(`The competition ${competition.id} is invalid:\n${bulleted(findings)}`);
    }
    return competition;
  }
  return {
    async getCompetition(id) {
      const competition = await competitions.getCompetition(id);
      return competition === undefined ? undefined : validated(competition);
    },
    async listCompetitions() {
      const read = await Promise.allSettled((await competitions.listCompetitions()).map(validated));
      return read.flatMap(result => {
        if (result.status === 'fulfilled') return [result.value];
        console.error(result.reason instanceof Error ? result.reason.message : result.reason);
        return [];
      });
    },
  };
}
