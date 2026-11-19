import { strategyGames } from 'game';
import type { Bundle, Registry } from 'problem-bank';
import {
  combinedCompetitionSource,
  combinedProblemSource,
  problemsReferredFrom,
  validateBundle,
  validatingCompetitionSource,
} from 'problem-bank';
import type { CompetitionSource, Problem, ProblemSource } from 'schemas';
import { validateProblem } from 'schemas';
import { Op, UniqueConstraintError } from 'sequelize';
import type { TeamsRepository } from './db';
import { CompetitionModel, ProblemModel } from './model';

// The competitions and problems held in the database, beside the ones held in
// code. The models are initialised by `TeamsRepository`, with the rest.

/** A stored problem that breaks the rules, as `databaseProblemSource` finds
 *  it on reading: its message names the problem and lists the validator's
 *  findings. */
export class InvalidStoredProblemError extends Error {
  constructor(readonly problemId: string, readonly errors: string[]) {
    super(`A feladat hibás: ${problemId}\n${errors.map(error => `  - ${error}`).join('\n')}`);
  }
}

/** A `ProblemSource` over the Problems table. A problem that breaks the rules
 *  is an error, so the competition that uses it is refused as an invalid one
 *  is (`validatingCompetitionSource`). */
export function databaseProblemSource(): ProblemSource {
  return {
    async getProblems(ids) {
      const rows = await ProblemModel.findAll({ where: { id: { [Op.in]: [...ids] } } });
      return new Map(rows.map(({ id, body }) => {
        const problem: Problem = { ...body, id };
        const errors = validateProblem(problem);
        if (errors.length > 0) throw new InvalidStoredProblemError(id, errors);
        return [id, problem];
      }));
    },
  };
}

/** A `CompetitionSource` over the Competitions table, validated by the caller
 *  as every source is (`validatingCompetitionSource`). */
export function databaseCompetitionSource(): CompetitionSource {
  return {
    async getCompetition(id) {
      const row = await CompetitionModel.findByPk(id);
      return row === null ? undefined : { ...row.body, id };
    },
    async listCompetitions() {
      const rows = await CompetitionModel.findAll({ order: [['id', 'ASC']] });
      return rows.map(({ id, body }) => ({ ...body, id }));
    },
  };
}

/** Refuses an id that both the code and the database hold, naming each one.
 *  Which of the two a team would be served is not a question to answer at
 *  run time: an organiser decides it, by giving one of them a new id. */
export async function assertNoIdInCodeAndDatabase(registry: Registry): Promise<void> {
  const inCode = new Set([...registry.problems.keys(), ...registry.competitions.keys()]);
  const inDatabase = [
    ...await ProblemModel.findAll({ attributes: ['id'] }),
    ...await CompetitionModel.findAll({ attributes: ['id'] }),
  ].map(({ id }) => id);
  const both = [...new Set(inDatabase.filter(id => inCode.has(id)))].sort();
  if (both.length > 0) {
    throw new Error(`Ezek az azonosítók a kódban és az adatbázisban is szerepelnek: ${both.join(', ')}`);
  }
}

/** Where the backend reads competitions and problems from, and which of them
 *  are held in code: an id there is never written to the database. */
export type ContentSources = Pick<Registry, 'competitionSource' | 'problemSource' | 'competitions' | 'problems'>;

/** The sources the backend reads competitions and problems through: the
 *  registry's and the database's together, the competitions validated as they
 *  are read. Creates the tables if they are missing, and refuses an id both
 *  hold, so a composition root calls this before serving anything. */
export async function openContentSources(teams: TeamsRepository, registry: Registry): Promise<ContentSources> {
  await teams.connect();
  await assertNoIdInCodeAndDatabase(registry);
  const problemSource = combinedProblemSource([registry.problemSource, databaseProblemSource()]);
  const competitionSource = validatingCompetitionSource(
    combinedCompetitionSource([registry.competitionSource, databaseCompetitionSource()]),
    problemSource,
    strategyGames,
  );
  return { competitionSource, problemSource, competitions: registry.competitions, problems: registry.problems };
}

/** What a bundle import did: every competition and problem written, or none
 *  and the reasons, one Hungarian line each, naming what it is about. */
export interface BundleImportReport {
  written: boolean;
  competitions: string[];
  problems: string[];
  errors: string[];
}

/** Writes every competition and problem of `bundle` to the database, or, if
 *  any of them breaks the rules or has an id the code or the database already
 *  holds, none of them.
 *
 *  The validation reads the problems the bundle builds on before the write's
 *  transaction opens, since a read outside it would wait for the connection
 *  the transaction holds where the pool has one (test_database.ts). The ids
 *  are checked inside it, and an id another import writes after that check is
 *  refused by the primary key. A problem and a competition two imports give
 *  the same new id at the same moment are not, which only two organisers
 *  importing at once with a hand-made clash would reach. */
export async function importBundle(
  teams: TeamsRepository,
  bundle: Bundle,
  { problemSource, competitions, problems }: ContentSources,
): Promise<BundleImportReport> {
  const competitionIds = Object.keys(bundle.competitions);
  const problemIds = Object.keys(bundle.problems);
  const refused = (errors: string[]) => ({ written: false, competitions: [], problems: [], errors });

  const inCode = [...competitionIds, ...problemIds].filter(id => competitions.has(id) || problems.has(id));
  if (inCode.length > 0) {
    return refused(inCode.sort().map(id => `${id}: ez az azonosító már szerepel a kódban`));
  }
  let referred: Map<string, Problem>;
  try {
    referred = await problemSource.getProblems(problemsReferredFrom(bundle));
  } catch (error) {
    // A relay of the bundle uses a stored problem that no longer keeps the
    // rules: the bundle cannot be played as it is, which is the report's to say.
    if (!(error instanceof InvalidStoredProblemError)) throw error;
    return refused([
      `${error.problemId}: a csomag ezt a már tárolt feladatot használja, de a tárolt feladat hibás`,
      ...error.errors,
    ]);
  }
  const errors = validateBundle(bundle, referred, strategyGames);
  if (errors.length > 0) return refused(errors);

  try {
    return await teams.sequelize.transaction(async (transaction) => {
      const ids = { [Op.in]: [...competitionIds, ...problemIds] };
      const inDatabase = [
        ...await CompetitionModel.findAll({ attributes: ['id'], where: { id: ids }, transaction }),
        ...await ProblemModel.findAll({ attributes: ['id'], where: { id: ids }, transaction }),
      ].map(({ id }) => id);
      if (inDatabase.length > 0) {
        return refused([...new Set(inDatabase)].sort().map(id => `${id}: ez az azonosító már szerepel az adatbázisban`));
      }
      const rows = <T>(bank: Record<string, T>) => Object.entries(bank).map(([id, body]) => ({ id, body, createdBy: null }));
      await ProblemModel.bulkCreate(rows(bundle.problems), { transaction });
      await CompetitionModel.bulkCreate(rows(bundle.competitions), { transaction });
      return { written: true, competitions: competitionIds, problems: problemIds, errors: [] };
    });
  } catch (error) {
    // Another import wrote the id after the check above; the transaction was
    // rolled back by the throw.
    if (!(error instanceof UniqueConstraintError)) throw error;
    return refused(error.errors.map(({ value }) => `${String(value)}: ez az azonosító közben bekerült az adatbázisba`));
  }
}
