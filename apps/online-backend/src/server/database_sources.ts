import { strategyGames } from 'game';
import type { Registry } from 'problem-bank';
import { combinedCompetitionSource, combinedProblemSource, validatingCompetitionSource } from 'problem-bank';
import type { CompetitionSource, Problem, ProblemSource } from 'schemas';
import { validateProblem } from 'schemas';
import { Op } from 'sequelize';
import type { TeamsRepository } from './db';
import { CompetitionModel, ProblemModel } from './model';

// The competitions and problems held in the database, beside the ones held in
// code. The models are initialised by `TeamsRepository`, with the rest.

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
        if (errors.length > 0) {
          throw new Error(`A feladat hibás: ${id}\n${errors.map(error => `  - ${error}`).join('\n')}`);
        }
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
    throw new Error(`A kódban és az adatbázisban is szerepel: ${both.join(', ')}`);
  }
}

/** The sources the backend reads competitions and problems through: the
 *  registry's and the database's together, the competitions validated as they
 *  are read. Creates the tables if they are missing, and refuses an id both
 *  hold, so a composition root calls this before serving anything. */
export async function openContentSources(teams: TeamsRepository, registry: Registry): Promise<{
  competitionSource: CompetitionSource;
  problemSource: ProblemSource;
}> {
  await teams.connect();
  await assertNoIdInCodeAndDatabase(registry);
  const problemSource = combinedProblemSource([registry.problemSource, databaseProblemSource()]);
  const competitionSource = validatingCompetitionSource(
    combinedCompetitionSource([registry.competitionSource, databaseCompetitionSource()]),
    problemSource,
    strategyGames,
  );
  return { competitionSource, problemSource };
}
