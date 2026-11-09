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

/// The entries of several banks by id, with their ids put back. An id in two
/// banks is an error, where spreading them into one object would keep the last
/// silently.
export function fromBanks<T>(banks: readonly Record<string, T>[]): Map<string, T & { id: string }> {
  const all = new Map<string, T & { id: string }>();
  for (const bank of banks) {
    for (const [id, entry] of Object.entries(bank)) {
      if (all.has(id)) throw new Error(`Two banks hold the id ${id}`);
      all.set(id, { id, ...entry });
    }
  }
  return all;
}

/// A `ProblemSource` over problems held in code.
export function inCodeProblemSource(problems: ReadonlyMap<ProblemId, Problem>): ProblemSource {
  return {
    getProblems(ids: readonly ProblemId[]) {
      const found = new Map<ProblemId, Problem>();
      for (const id of ids) {
        const problem = problems.get(id);
        if (problem !== undefined) found.set(id, problem);
      }
      return Promise.resolve(found);
    },
  };
}

/// A `CompetitionSource` over competitions held in code.
export function inCodeCompetitionSource(competitions: ReadonlyMap<CompetitionId, CompetitionConfig>): CompetitionSource {
  return {
    getCompetition(id: CompetitionId) {
      return Promise.resolve(competitions.get(id));
    },
    listCompetitions() {
      return Promise.resolve([...competitions.values()]);
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
