import type {
  CompetitionConfig,
  CompetitionId,
  CompetitionSource,
  Problem,
  ProblemId,
  ProblemSource,
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

/// One `ProblemSource` serving the problems of all of `sources`. An id two of
/// them return is an error rather than either one's problem: the server refuses
/// to start with an id in both the code and the database, so reaching one here
/// means a source started handing it out since.
export function combinedProblemSource(sources: readonly ProblemSource[]): ProblemSource {
  return {
    async getProblems(ids) {
      const found = new Map<ProblemId, Problem>();
      for (const problems of await Promise.all(sources.map(source => source.getProblems(ids)))) {
        for (const [id, problem] of problems) {
          if (found.has(id)) throw new Error(`Two sources hold the problem ${id}`);
          found.set(id, problem);
        }
      }
      return found;
    },
  };
}

/// One `CompetitionSource` serving the competitions of all of `sources`, with
/// an id two of them hold an error, as in `combinedProblemSource`.
///
/// `getCompetition` rejects such an id. `listCompetitions` leaves every copy
/// of it out and logs it, as `validatingCompetitionSource` does an invalid
/// competition, so one clash does not take the admin page's list, or a whole
/// team import, down with it.
export function combinedCompetitionSource(sources: readonly CompetitionSource[]): CompetitionSource {
  return {
    async getCompetition(id) {
      const found = (await Promise.all(sources.map(source => source.getCompetition(id))))
        .filter(competition => competition !== undefined);
      if (found.length > 1) throw new Error(`Two sources hold the competition ${id}`);
      return found[0];
    },
    async listCompetitions() {
      const all = (await Promise.all(sources.map(source => source.listCompetitions()))).flat();
      const seen = new Set<CompetitionId>();
      const twice = new Set<CompetitionId>();
      for (const { id } of all) {
        if (seen.has(id)) twice.add(id);
        seen.add(id);
      }
      for (const id of twice) console.error(`Two sources hold the competition ${id}`);
      return all.filter(({ id }) => !twice.has(id));
    },
  };
}
