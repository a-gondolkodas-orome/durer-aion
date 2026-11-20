import { strategyGames } from 'game';
import type { Bundle, Registry } from 'problem-bank';
import {
  bundleOf,
  combinedCompetitionSource,
  combinedProblemSource,
  problemsReferredFrom,
  readBundle,
  sameBody,
  validateBundle,
  validatingCompetitionSource,
} from 'problem-bank';
import type { CompetitionSource, Problem, ProblemSource } from 'schemas';
import { validateProblem } from 'schemas';
import { Op } from 'sequelize';
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

/** Writes every competition and problem of the bundle `value` is to the
 *  database, or, if it is no bundle, or any of it breaks the rules or has an
 *  id the code or the database already holds, none of them. A problem the
 *  code holds as the bundle has it is no clash, and is not written: an
 *  exported bundle carries the in-code problems its relays use.
 *
 *  The problems the bundle builds on are read before the write's transaction
 *  opens: a read outside it would wait for the connection the transaction
 *  holds where the pool has one (test_database.ts). */
export async function importBundle(
  teams: TeamsRepository,
  value: unknown,
  { problemSource, competitions, problems }: ContentSources,
): Promise<BundleImportReport> {
  const refused = (errors: string[]) => ({ written: false, competitions: [], problems: [], errors });
  const read = readBundle(value);
  if ('errors' in read) return refused(read.errors);
  const { bundle } = read;
  const competitionIds = Object.keys(bundle.competitions);
  const inCodeAlike = new Set(Object.entries(bundle.problems).flatMap(([id, body]) => {
    const held = problems.get(id);
    return held !== undefined && sameBody(body, held) ? [id] : [];
  }));
  const problemIds = Object.keys(bundle.problems).filter(id => !inCodeAlike.has(id));
  const sortedIds = [...[...competitionIds].sort(), ...[...problemIds].sort()];
  // What of the bundle the id is first, then what already holds it.
  const clashes = (holders: ReadonlyMap<string, 'competition' | 'problem'>, where: string) =>
    sortedIds.flatMap((id) => {
      const holder = holders.get(id);
      if (holder === undefined) return [];
      const kind = id in bundle.competitions ? 'verseny' : 'feladat';
      return [`${kind} ${id}: ez az azonosító ${where} már egy ${holder === 'competition' ? 'versenyé' : 'feladaté'}`];
    });

  const inCode = new Map([
    ...[...problems.keys()].map(id => [id, 'problem'] as const),
    ...[...competitions.keys()].map(id => [id, 'competition'] as const),
  ]);
  const inCodeClashes = clashes(inCode, 'a kódban');
  if (inCodeClashes.length > 0) return refused(inCodeClashes);
  let referred: Map<string, Problem>;
  try {
    referred = await problemSource.getProblems(problemsReferredFrom(bundle));
  } catch (error) {
    // A relay of the bundle uses a stored problem that no longer keeps the
    // rules: the bundle cannot be played as it is, which is the report's to say.
    if (!(error instanceof InvalidStoredProblemError)) throw error;
    return refused([
      `feladat ${error.problemId}: a csomag ezt a már tárolt feladatot használja, de a tárolt feladat hibás`,
      ...error.errors,
    ]);
  }
  const errors = validateBundle(bundle, referred, strategyGames);
  if (errors.length > 0) return refused(errors);

  return await teams.sequelize.transaction(async (transaction) => {
    const ids = { [Op.in]: sortedIds };
    const inDatabase = new Map([
      ...(await ProblemModel.findAll({ attributes: ['id'], where: { id: ids }, transaction }))
        .map(({ id }) => [id, 'problem'] as const),
      ...(await CompetitionModel.findAll({ attributes: ['id'], where: { id: ids }, transaction }))
        .map(({ id }) => [id, 'competition'] as const),
    ]);
    const inDatabaseClashes = clashes(inDatabase, 'az adatbázisban');
    if (inDatabaseClashes.length > 0) return refused(inDatabaseClashes);
    const rows = <T>(bank: Record<string, T>, ids: readonly string[]) =>
      ids.map(id => ({ id, body: bank[id], createdBy: null }));
    await ProblemModel.bulkCreate(rows(bundle.problems, problemIds), { transaction });
    await CompetitionModel.bulkCreate(rows(bundle.competitions, competitionIds), { transaction });
    return { written: true, competitions: competitionIds, problems: problemIds, errors: [] };
  });
}

/** The bundle of the competitions `ids` names, in that order, or of every
 *  competition for none, with every problem their relays use: in code or in
 *  the database, a bundle stands alone. `missing` names the ids no competition
 *  has. */
export async function exportBundle(
  ids: readonly string[],
  { competitionSource, problemSource }: Pick<ContentSources, 'competitionSource' | 'problemSource'>,
): Promise<{ bundle: Bundle } | { missing: string[] }> {
  const found = ids.length === 0
    ? await competitionSource.listCompetitions()
    : await Promise.all([...new Set(ids)].map(async id => await competitionSource.getCompetition(id) ?? id));
  const missing = found.filter(competition => typeof competition === 'string');
  if (missing.length > 0) return { missing };
  const competitions = found.filter(competition => typeof competition !== 'string');
  const problemIds = competitions.flatMap(({ relay }) => relay?.problems.map(({ problemId }) => problemId) ?? []);
  return { bundle: bundleOf(competitions, await problemSource.getProblems([...new Set(problemIds)])) };
}
