import type { CompetitionConfig, Language, Problem } from 'schemas';
import { isRecord, problemImageWarnings, problemShapeErrors, validateProblem } from 'schemas';
import { Op, type Transaction } from 'sequelize';
import type { TeamsRepository } from './db';
import type { ContentSources } from './database_sources';
import { type ProblemUse, problemUses } from './competition_view';
import { CompetitionModel, ProblemModel, TeamModel } from './model';

// Changing one problem on its admin page. A problem is shared by id, so the
// change reaches every relay using it, for the matches started after it: a
// match copies its problems when it starts (`relaySetup`).

/** A problem as its editor opens it: where it is held, every use a relay
 *  makes of it, and whether its answer is locked. */
export interface AdminProblemView {
  problem: Problem;
  storedIn: 'code' | 'database';
  uses: ProblemUse[];
  /** A team of a competition using the problem has started a match, so the
   *  answer no longer changes: teams of one round would be judged by two. */
  answerLocked: boolean;
}

/** What a write did, or, in a dry run, would do, as `CompetitionWriteReport`
 *  says; and the uses the change reaches. */
export interface ProblemWriteReport {
  written: boolean;
  errors: string[];
  warnings: string[];
  answerLocked: boolean;
  uses: ProblemUse[];
}

/** Every competition, those held in the database as they are stored,
 *  unvalidated: the source leaves out one it refuses, and a problem that has
 *  come to break the rules makes the competitions using it refused, which
 *  would hide them from the lock. */
async function everyCompetition(competitions: ContentSources['competitions'], transaction?: Transaction):
  Promise<CompetitionConfig[]> {
  const rows = await CompetitionModel.findAll({ order: [['id', 'ASC']], transaction });
  return [...competitions.values(), ...rows.map(({ id, body }) => ({ ...body, id }))];
}

/** Whether a team of any of the competitions has started either match: what
 *  `lockErrors` follows for a competition, here for every one using a problem. */
async function anyStarted(competitionIds: readonly string[], transaction?: Transaction): Promise<boolean> {
  if (competitionIds.length === 0) return false;
  const count = await TeamModel.count({
    where: {
      competitionId: { [Op.in]: [...competitionIds] },
      [Op.or]: [{ relayMatchID: { [Op.ne]: null } }, { strategyMatchID: { [Op.ne]: null } }],
    },
    transaction,
  });
  return count > 0;
}

/** The problem as stored, unvalidated, so one the rules have since come to
 *  refuse can be mended; undefined for an id no one holds. */
async function storedProblem(problemId: string, { problems }: Pick<ContentSources, 'problems'>, transaction?: Transaction):
  Promise<{ problem: Problem, storedIn: AdminProblemView['storedIn'] } | undefined> {
  const inCode = problems.get(problemId);
  if (inCode !== undefined) return { problem: inCode, storedIn: 'code' };
  const row = await ProblemModel.findByPk(problemId, { transaction });
  return row === null ? undefined : { problem: { ...row.body, id: problemId }, storedIn: 'database' };
}

async function usesAndLock(problemId: string, competitions: ContentSources['competitions'], transaction?: Transaction) {
  const uses = problemUses(await everyCompetition(competitions, transaction)).get(problemId) ?? [];
  return { uses, answerLocked: await anyStarted([...new Set(uses.map(({ competitionId }) => competitionId))], transaction) };
}

export async function adminProblemView(
  problemId: string,
  sources: Pick<ContentSources, 'problems' | 'competitions'>,
): Promise<AdminProblemView | undefined> {
  const stored = await storedProblem(problemId, sources);
  if (stored === undefined) return undefined;
  return { ...stored, ...await usesAndLock(problemId, sources.competitions) };
}

const LANGUAGE_NAMES: Record<Language, string> = { hu: 'magyar', en: 'angol' };

/** Replaces the problem `problemId` with the one `value` holds, as
 *  `{ problem }`, or, if it breaks the rules or the answer's lock, does not;
 *  with `dryRun`, says what it would do and writes nothing. Undefined for an
 *  id no one holds. One held in code changes only with a deploy.
 *
 *  Beside the problem's own rules, every competition using it must still have
 *  it in one of its languages, which `validateCompetition` asks of a relay. */
export async function writeProblem(
  teams: TeamsRepository,
  problemId: string,
  value: unknown,
  sources: Pick<ContentSources, 'problems' | 'competitions'>,
  { dryRun }: { dryRun: boolean },
): Promise<ProblemWriteReport | undefined> {
  return await teams.sequelize.transaction(async (transaction) => {
    const before = await storedProblem(problemId, sources, transaction);
    if (before === undefined) return undefined;
    const { uses, answerLocked } = await usesAndLock(problemId, sources.competitions, transaction);
    const report = (errors: string[], warnings: string[] = [], written = false) =>
      ({ written, errors, warnings, answerLocked, uses });
    const where = `feladat ${problemId}`;
    if (before.storedIn === 'code') return report([`${where}: a kódban tárolt feladat csak telepítéssel változik`]);

    const read = readProblemBody(problemId, value);
    if ('errors' in read) return report(read.errors);
    const after = read.problem;

    const competitions = new Map((await everyCompetition(sources.competitions, transaction)).map(each => [each.id, each]));
    const unseen = [...new Set(uses.map(({ competitionId }) => competitionId))].flatMap((competitionId) => {
      const competition = competitions.get(competitionId);
      return competition === undefined || competition.languages.some(language => after.content[language] !== undefined) ? []
        : [`${where}: nem maradna szövege a verseny nyelvén (${competition.languages.map(each => LANGUAGE_NAMES[each])
          .join(', ')}): ${competitionId}`];
    });
    const errors = [
      ...validateProblem(after),
      ...unseen,
      ...answerLocked && after.answer !== before.problem.answer
        ? [`${where}: a válasz nem változhat, mert már indult csapat egy versenyben, amely használja (marad: ${before.problem.answer})`]
        : [],
    ];
    const warnings = [
      ...problemImageWarnings(after),
      ...answerLocked ? ['Már indult csapat egy versenyben, amely ezt a feladatot használja: a futó meccsek a régi '
        + 'változattal mennek tovább, a javítás az ezután indulókra érvényes.'] : [],
    ];
    if (errors.length > 0 || dryRun) return report(errors, warnings);
    const { id, ...body } = after;
    await ProblemModel.update({ body }, { where: { id }, transaction });
    return report([], warnings, true);
  });
}

/** The problem `{ problem }` holds, checked for its shape and for keeping the
 *  id it is stored under. */
function readProblemBody(problemId: string, value: unknown): { problem: Problem } | { errors: string[] } {
  if (!isRecord(value) || !isRecord(value.problem)) return { errors: ['A kérés nem egy { problem } objektum.'] };
  const { id, ...body } = value.problem;
  if (id !== problemId) {
    return { errors: [`feladat ${problemId}: az azonosító nem változhat (a kérésben: ${String(id)})`] };
  }
  const errors = problemShapeErrors(problemId, body);
  if (errors.length > 0) return { errors };
  return { problem: { ...(body as Omit<Problem, 'id'>), id: problemId } };
}
