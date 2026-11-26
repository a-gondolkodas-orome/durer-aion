import type { CompetitionConfig, CompetitionId, CompetitionMetadata, Problem, ProblemId, StartWindow } from 'schemas';

// What the admin page is served of competitions: the Versenyek tab's row of
// each, and one competition whole, answers included, for its own page.

type StoredIn = 'code' | 'database';

/** One row of the Versenyek tab: a competition's id and metadata, nothing of
 *  its problems, and its start window — the one in force, and the one its
 *  config gives, which the admin page's replaces — and whether it is held in
 *  the code or in the database. */
export interface CompetitionSummary {
  id: CompetitionId;
  metadata: CompetitionMetadata;
  startWindow: StartWindow | null;
  configStartWindow: StartWindow | null;
  storedIn: StoredIn;
}

export function competitionSummary(
  { id, metadata, startWindow }: CompetitionConfig,
  windows: ReadonlyMap<CompetitionId, StartWindow>,
  inCode: ReadonlyMap<CompetitionId, unknown>,
): CompetitionSummary {
  return {
    id, metadata,
    startWindow: windows.get(id) ?? startWindow ?? null,
    configStartWindow: startWindow ?? null,
    storedIn: inCode.has(id) ? 'code' : 'database',
  };
}

/** One place a relay uses a problem: what a fix to the problem reaches. */
export interface ProblemUse {
  competitionId: CompetitionId;
  metadata: CompetitionMetadata;
  /** 1-based, in play order. */
  position: number;
  points: number;
}

/** Every use of each problem by the relays of `competitions`, in their
 *  order; a relay using a problem twice is two uses. */
export function problemUses(competitions: readonly CompetitionConfig[]): Map<ProblemId, ProblemUse[]> {
  const uses = new Map<ProblemId, ProblemUse[]>();
  for (const { id, metadata, relay } of competitions) {
    relay?.problems.forEach(({ problemId, points }, index) => {
      uses.set(problemId, [...uses.get(problemId) ?? [], { competitionId: id, metadata, position: index + 1, points }]);
    });
  }
  return uses;
}

/** One problem of the relay, in play order. */
export interface AdminRelayProblem {
  problem: Problem;
  points: number;
  storedIn: StoredIn;
  /** Every use of the problem, this one included. */
  uses: ProblemUse[];
}

/** A competition as its admin page shows it: the Versenyek tab's row of it,
 *  the config, and the relay's problems, answers included, which no team is
 *  ever served. */
export interface AdminCompetitionView extends CompetitionSummary {
  competition: CompetitionConfig;
  relayProblems: AdminRelayProblem[];
}

export function adminCompetitionView(
  summary: CompetitionSummary,
  competition: CompetitionConfig,
  problems: ReadonlyMap<ProblemId, Problem>,
  problemsInCode: ReadonlyMap<ProblemId, unknown>,
  uses: ReadonlyMap<ProblemId, ProblemUse[]>,
): AdminCompetitionView {
  return {
    ...summary,
    competition,
    relayProblems: (competition.relay?.problems ?? []).map(({ problemId, points }) => {
      // The source validates a competition as it reads it, and the validator
      // refuses a relay referring to a problem no one holds.
      const problem = problems.get(problemId);
      if (problem === undefined) throw new Error(`The relay refers to the problem ${problemId}, which does not exist`);
      return {
        problem, points,
        storedIn: problemsInCode.has(problemId) ? 'code' : 'database',
        uses: uses.get(problemId) ?? [],
      };
    }),
  };
}
