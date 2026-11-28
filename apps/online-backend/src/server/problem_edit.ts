import type { Language, Problem } from 'schemas';
import { isRecord, problemImageWarnings, problemShapeErrors, validateProblem } from 'schemas';
import type { Transaction } from 'sequelize';
import { hasStarted } from './competition_edit';
import { type ProblemUse, problemUses } from './competition_view';
import type { TeamsRepository } from './db';
import type { ContentSources } from './database_sources';
import { CompetitionModel, ProblemModel } from './model';

// Changing one problem on its admin page. The change reaches every relay
// using it, for the matches started after it (`relaySetup`).

type Sources = Pick<ContentSources, 'problems' | 'competitions'>;

export interface AdminProblemView {
  problem: Problem;
  storedIn: 'code' | 'database';
  uses: ProblemUse[];
  /** A team of a competition using the problem has started a match. */
  answerLocked: boolean;
}

export interface ProblemWriteReport extends Pick<AdminProblemView, 'uses' | 'answerLocked'> {
  written: boolean;
  errors: string[];
  warnings: string[];
}

const LANGUAGE_NAMES: Record<Language, string> = { hu: 'magyar', en: 'angol' };

/** The problem and what uses it, everything as stored, unvalidated: a
 *  problem the rules have come to refuse can be mended, and the competitions
 *  using it, which the source would leave out, still lock it. */
async function readStored(problemId: string, { problems, competitions }: Sources, transaction?: Transaction) {
  const row = problems.has(problemId) ? null : await ProblemModel.findByPk(problemId, { transaction });
  const problem = problems.get(problemId) ?? (row === null ? undefined : { ...row.body, id: problemId });
  if (problem === undefined) return undefined;
  const rows = await CompetitionModel.findAll({ order: [['id', 'ASC']], transaction });
  const using = [...competitions.values(), ...rows.map(({ id, body }) => ({ ...body, id }))]
    .filter(({ relay }) => relay?.problems.some(each => each.problemId === problemId));
  return {
    problem,
    storedIn: problems.has(problemId) ? 'code' as const : 'database' as const,
    using,
    uses: problemUses(using).get(problemId) ?? [],
    answerLocked: using.length > 0 && await hasStarted(using.map(({ id }) => id), transaction),
  };
}

export async function adminProblemView(problemId: string, sources: Sources): Promise<AdminProblemView | undefined> {
  const stored = await readStored(problemId, sources);
  return stored && { problem: stored.problem, storedIn: stored.storedIn, uses: stored.uses, answerLocked: stored.answerLocked };
}

/** Replaces a database problem with the one `value` holds, as `{ problem }`,
 *  unless it breaks the rules, leaves a competition using it with no text in
 *  its languages, or changes a locked answer; with `dryRun`, writes nothing.
 *  Undefined for an id no one holds. */
export async function writeProblem(
  teams: TeamsRepository, problemId: string, value: unknown, sources: Sources, { dryRun }: { dryRun: boolean },
): Promise<ProblemWriteReport | undefined> {
  return await teams.sequelize.transaction(async (transaction) => {
    const stored = await readStored(problemId, sources, transaction);
    if (stored === undefined) return undefined;
    const { uses, answerLocked } = stored;
    const report = (errors: string[], warnings: string[] = [], written = false) =>
      ({ written, errors, warnings, answerLocked, uses });
    const where = `feladat ${problemId}`;
    if (stored.storedIn === 'code') return report([`${where}: a kódban tárolt feladat csak telepítéssel változik`]);

    const read = readProblemBody(problemId, value);
    if ('errors' in read) return report(read.errors);
    const after = read.problem;
    const errors = [
      ...validateProblem(after),
      ...stored.using.filter(({ languages }) => !languages.some(language => after.content[language] !== undefined))
        .map(({ id, languages }) =>
          `${where}: nem maradna szövege a verseny nyelvén (${languages.map(each => LANGUAGE_NAMES[each]).join(', ')}): ${id}`),
      ...answerLocked && after.answer !== stored.problem.answer
        ? [`${where}: a válasz nem változhat, mert már indult csapat egy versenyben, amely használja (marad: ${stored.problem.answer})`]
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

function readProblemBody(problemId: string, value: unknown): { problem: Problem } | { errors: string[] } {
  if (!isRecord(value) || !isRecord(value.problem)) return { errors: ['A kérés nem egy { problem } objektum.'] };
  const { id, ...body } = value.problem;
  if (id !== problemId) {
    return { errors: [`feladat ${problemId}: az azonosító nem változhat (a kérésben: ${String(id)})`] };
  }
  const errors = problemShapeErrors(problemId, body);
  return errors.length > 0 ? { errors } : { problem: { ...(body as Omit<Problem, 'id'>), id: problemId } };
}
