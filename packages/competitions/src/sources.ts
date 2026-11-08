import type {
  CompetitionConfig,
  CompetitionId,
  CompetitionSource,
  Problem,
  ProblemId,
  ProblemSource,
  RelayConfig,
} from 'schemas';

/// Problems as the code holds them: keyed by id, so a file states each id once
/// and the compiler refuses one written twice in it.
export type ProblemBank = Record<ProblemId, Omit<Problem, 'id'>>;

/// Competitions as the code holds them, keyed by id like `ProblemBank`.
export type CompetitionBank = Record<CompetitionId, Omit<CompetitionConfig, 'id'>>;

/// The entries of several banks with their ids put back. An id in two banks is
/// an error, where spreading them into one object would keep the last silently.
export function fromBanks<T>(banks: readonly Record<string, T>[]): (T & { id: string })[] {
  const seen = new Set<string>();
  return banks.flatMap(bank => Object.entries(bank).map(([id, entry]) => {
    if (seen.has(id)) throw new Error(`Two banks hold the id ${id}`);
    seen.add(id);
    return { id, ...entry };
  }));
}

function byId<T extends { id: string }>(items: readonly T[], kind: string): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    if (map.has(item.id)) throw new Error(`Two ${kind}s share the id ${item.id}`);
    map.set(item.id, item);
  }
  return map;
}

/// A `ProblemSource` over problems held in code.
export function inCodeProblemSource(problems: readonly Problem[]): ProblemSource {
  const all = byId(problems, 'problem');
  return {
    getProblems(ids: readonly ProblemId[]) {
      const found = new Map<ProblemId, Problem>();
      for (const id of ids) {
        const problem = all.get(id);
        if (problem !== undefined) found.set(id, problem);
      }
      return Promise.resolve(found);
    },
  };
}

/// A `CompetitionSource` over competitions held in code.
export function inCodeCompetitionSource(competitions: readonly CompetitionConfig[]): CompetitionSource {
  const all = byId(competitions, 'competition');
  return {
    getCompetition(id: CompetitionId) {
      return Promise.resolve(all.get(id));
    },
    listCompetitions() {
      return Promise.resolve([...all.values()]);
    },
  };
}

/// One problem of a relay, in play order, with what it is worth there.
export interface RelayProblem {
  problem: Problem;
  points: number;
}

/// The relay's problems, fetched from the source. A problem the source does
/// not have is an error: the validator refuses such a relay, so reaching one
/// here means a competition went out unvalidated.
export async function resolveRelay(relay: RelayConfig, source: ProblemSource): Promise<RelayProblem[]> {
  const problems = await source.getProblems(relay.problems.map(({ problemId }) => problemId));
  return relay.problems.map(({ problemId, points }) => {
    const problem = problems.get(problemId);
    if (problem === undefined) throw new Error(`The relay refers to the problem ${problemId}, which does not exist`);
    return { problem, points };
  });
}
