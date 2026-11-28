import { strategyGames } from 'game/strategy';
import type { CompetitionConfig, Language, Problem } from 'schemas';
import {
  competitionShapeErrors, isRecord, problemImageWarnings, problemShapeErrors, validateCompetition, validateProblem,
  validateStartWindow,
} from 'schemas';
import { Op, type Transaction } from 'sequelize';
import type { TeamsRepository } from './db';
import type { ContentSources } from './database_sources';
import { InvalidStoredProblemError } from './database_sources';
import { CompetitionModel, CompetitionWindowModel, ProblemModel, TeamModel } from './model';

// Creating and changing a competition on its admin page: the body is the
// competition whole, with the new problems its relay brings. A new one is
// written to the database, and one held there is replaced by it, once it
// keeps the rules and the locks, the new problems with it; of one held in
// code only the start window changes.

/** What an edit did, or, in a dry run, would do: written or not, and why not,
 *  one Hungarian line each. `started` says whether a team of the competition
 *  has started a match, which is what the locks follow. */
export interface CompetitionWriteReport {
  written: boolean;
  errors: string[];
  warnings: string[];
  started: boolean;
}

const LANGUAGE_NAMES: Record<Language, string> = { hu: 'A magyar', en: 'Az angol' };

// Field by field: the database stores the body as JSONB, which orders an
// object's keys its own way.
const relayEntries = (relay: CompetitionConfig['relay']) =>
  (relay?.problems ?? []).map(({ problemId, points }) => `${problemId}:${points}`).join(',');
const sameWindow = (before: CompetitionConfig['startWindow'], after: CompetitionConfig['startWindow']) =>
  before?.opensAt === after?.opensAt && before?.closesAt === after?.closesAt;

/** What of `before` a team that has started a match holds `after` to: the
 *  languages it may have chosen, and the matches it has, or can still start,
 *  with the relay's problems in their order and points. A started match keeps
 *  the setup it was created with (`games.ts`), so a duration or the strategy
 *  game's id may change: what changes reaches the matches started after it,
 *  and the placeholder game (#815) is replaced so. */
export function lockErrors(before: CompetitionConfig, after: CompetitionConfig): string[] {
  const errors: string[] = [];
  const lock = 'már indult csapat ebben a versenyben';
  for (const language of before.languages.filter(each => !after.languages.includes(each))) {
    errors.push(`${LANGUAGE_NAMES[language]} nyelv nem vehető el: ${lock}.`);
  }
  for (const [match, name] of [['relay', 'A váltó'], ['strategy', 'A stratégiás játék']] as const) {
    if (before[match] !== undefined && after[match] === undefined) errors.push(`${name} nem vehető el: ${lock}.`);
    if (before[match] === undefined && after[match] !== undefined) errors.push(`${name} nem adható hozzá: ${lock}.`);
  }
  if (before.relay !== undefined && after.relay !== undefined && relayEntries(before.relay) !== relayEntries(after.relay)) {
    errors.push(`A váltó feladatai, sorrendjük és pontjuk nem változhat: ${lock}.`);
  }
  return errors;
}

/** Whether a team of any of the competitions has started either match. */
export async function hasStarted(competitionIds: string | string[], transaction?: Transaction): Promise<boolean> {
  const count = await TeamModel.count({
    where: {
      competitionId: competitionIds,
      [Op.or]: [{ relayMatchID: { [Op.ne]: null } }, { strategyMatchID: { [Op.ne]: null } }],
    },
    transaction,
  });
  return count > 0;
}

/** The competition as JSON with every object's keys sorted: two configs
 *  compare equal whatever order their keys were written in. */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_, each: unknown) => isRecord(each) && !Array.isArray(each)
    ? Object.fromEntries(Object.entries(each).sort(([a], [b]) => a.localeCompare(b)))
    : each);
}

/** Replaces the competition `competitionId` with the one `value` holds, as
 *  `{ competition, problems? }`, or, if it breaks the rules or a lock, does
 *  not; with `dryRun`, says what it would do and writes nothing. Undefined for
 *  an id no one holds.
 *
 *  `problems` are new ones, which the relay uses and nothing holds yet: a
 *  problem added in the relay's editor, or a copy of a shared one. They are
 *  written in the same transaction, or not at all. A problem already held is
 *  changed in its own editor (`writeProblem`), never here.
 *
 *  One held in the database is replaced whole, and its window is the one the
 *  body gives: a window set for it apart, by an earlier admin page, is
 *  dropped. One held in code changes only with a deploy, its start window
 *  aside, which is stored apart from it (`setCompetitionWindow`); its own
 *  window given back takes that one away.
 *
 *  A stored competition is read as it is, unvalidated, so one the rules have
 *  since come to refuse can be mended here. */
export async function writeCompetition(
  teams: TeamsRepository,
  competitionId: string,
  value: unknown,
  sources: Pick<ContentSources, 'problemSource' | 'competitions' | 'problems'>,
  { dryRun }: { dryRun: boolean },
): Promise<CompetitionWriteReport | undefined> {
  const inCode = sources.competitions.get(competitionId);
  const row = inCode === undefined ? await CompetitionModel.findByPk(competitionId) : null;
  const before: CompetitionConfig | undefined = inCode ?? (row === null ? undefined : { ...row.body, id: competitionId });
  if (before === undefined) return undefined;
  const report = (errors: string[], warnings: string[], started: boolean, written = false) =>
    ({ written, errors, warnings, started });

  const shape = readCompetitionBody(competitionId, value);
  if ('errors' in shape) return report(shape.errors, [], await hasStarted(competitionId));
  const after = shape.competition;
  const newProblems = shape.problems;

  if (inCode !== undefined) {
    const where = `verseny ${competitionId}`;
    const errors = [
      ...newProblems.length === 0 ? [] : [`${where}: a kódban tárolt verseny váltójához nem adható új feladat`],
      ...canonical({ ...inCode, startWindow: undefined }) === canonical({ ...after, startWindow: undefined }) ? []
        : [`${where}: a kódban tárolt versenynek csak az indítási ablaka változhat, a többi csak telepítéssel`],
      ...after.startWindow === undefined
        ? inCode.startWindow === undefined ? [] : [`${where}: a kódban tárolt verseny indítási ablaka nem hagyható üresen`]
        : validateStartWindow(after.startWindow).map(error => `${where}: ${error}`),
    ];
    const started = await hasStarted(competitionId);
    if (errors.length > 0 || dryRun) return report(errors, [], started);
    await teams.setCompetitionWindow(competitionId,
      sameWindow(inCode.startWindow, after.startWindow) ? null : after.startWindow ?? null);
    return report([], [], started, true);
  }

  const errors = await contentErrors(after, newProblems, sources);

  return await teams.sequelize.transaction(async (transaction) => {
    const started = await hasStarted(competitionId, transaction);
    const allErrors = [
      ...errors,
      ...await takenInDatabase('feladat', newProblems.map(({ id }) => id), transaction),
      ...(started ? lockErrors(before, after) : []),
    ];
    const warnings = [
      ...started ? ['Már indult csapat ebben a versenyben: a futó meccsek a régi beállításokkal mennek '
        + 'tovább, a változás az ezután indulókra érvényes.'] : [],
      ...newProblems.flatMap(problemImageWarnings),
    ];
    if (allErrors.length > 0 || dryRun) return report(allErrors, warnings, started);
    const { id, ...body } = after;
    await ProblemModel.bulkCreate(newProblems.map(({ id, ...problem }) => ({ id, body: problem, createdBy: null })),
      { transaction });
    await CompetitionModel.update({ body }, { where: { id }, transaction });
    await CompetitionWindowModel.destroy({ where: { competitionId: id }, transaction });
    return report([], warnings, started, true);
  });
}

/** What keeps `competition` and the new problems its relay brings from being
 *  written, the database aside: the rules, a new problem the relay does not
 *  use, and an id the code holds. The problems are read before a transaction
 *  opens, for the reason `importBundle` gives. */
async function contentErrors(
  competition: CompetitionConfig,
  newProblems: Problem[],
  { problemSource, competitions, problems: problemsInCode }: Pick<ContentSources, 'problemSource' | 'competitions' | 'problems'>,
): Promise<string[]> {
  const newIds = new Set(newProblems.map(({ id }) => id));
  const used = new Set(competition.relay?.problems.map(({ problemId }) => problemId) ?? []);
  const errors: string[] = [
    ...newProblems.flatMap(validateProblem),
    ...newProblems.filter(({ id }) => !used.has(id)).map(({ id }) => `feladat ${id}: új feladat, de a váltó nem használja`),
    ...newProblems.filter(({ id }) => problemsInCode.has(id) || competitions.has(id)).map(({ id }) =>
      `feladat ${id}: ez az azonosító a kódban már egy ${problemsInCode.has(id) ? 'feladaté' : 'versenyé'}`),
  ];
  try {
    const problems = new Map([
      ...await problemSource.getProblems([...used].filter(id => !newIds.has(id))),
      ...newProblems.map(problem => [problem.id, problem] as const),
    ]);
    return [...errors,
      ...validateCompetition(competition, { problems, strategyGames: new Map(Object.entries(strategyGames)) })];
  } catch (error) {
    if (!(error instanceof InvalidStoredProblemError)) throw error;
    return [...errors,
      `feladat ${error.problemId}: a váltó ezt a tárolt feladatot használja, de a tárolt feladat hibás`, ...error.errors];
  }
}

/** One line for each of `ids` the database already holds, as a problem or a
 *  competition: ids are one namespace, as in a bundle (`importBundle`). */
async function takenInDatabase(kind: 'verseny' | 'feladat', ids: string[], transaction: Transaction): Promise<string[]> {
  if (ids.length === 0) return [];
  const byId = { attributes: ['id'], where: { id: ids }, order: [['id', 'ASC']] as [string, string][], transaction };
  return [
    ...(await ProblemModel.findAll(byId)).map(({ id }) => `${kind} ${id}: ez az azonosító az adatbázisban már egy feladaté`),
    ...(await CompetitionModel.findAll(byId)).map(({ id }) => `${kind} ${id}: ez az azonosító az adatbázisban már egy versenyé`),
  ];
}

/** Creates the competition `value` holds, as `{ competition, problems? }`,
 *  with the new problems its relay brings, in the database; or, if it breaks
 *  the rules or its id or a problem's is taken, does not. With `dryRun`, says
 *  what it would do and writes nothing. No team can have started one yet, so
 *  no lock applies. */
export async function createCompetition(
  teams: TeamsRepository,
  value: unknown,
  sources: Pick<ContentSources, 'problemSource' | 'competitions' | 'problems'>,
  { dryRun }: { dryRun: boolean },
): Promise<CompetitionWriteReport> {
  const report = (errors: string[], warnings: string[], written = false) => ({ written, errors, warnings, started: false });
  const id = isRecord(value) && isRecord(value.competition) ? value.competition.id : undefined;
  if (typeof id !== 'string') return report(['A kérésben a verseny azonosítója nem szöveg.'], []);
  const shape = readCompetitionBody(id, value);
  if ('errors' in shape) return report(shape.errors, []);
  const { competition, problems: newProblems } = shape;
  const errors = [
    ...sources.competitions.has(id) || sources.problems.has(id)
      ? [`verseny ${id}: ez az azonosító a kódban már egy ${sources.competitions.has(id) ? 'versenyé' : 'feladaté'}`] : [],
    ...newProblems.some(problem => problem.id === id) ? [`verseny ${id}: egy új feladat is ezt az azonosítót kapná`] : [],
    ...await contentErrors(competition, newProblems, sources),
  ];
  return await teams.sequelize.transaction(async (transaction) => {
    const allErrors = [
      ...errors,
      ...await takenInDatabase('verseny', [id], transaction),
      ...await takenInDatabase('feladat', newProblems.map(problem => problem.id), transaction),
    ];
    const warnings = newProblems.flatMap(problemImageWarnings);
    if (allErrors.length > 0 || dryRun) return report(allErrors, warnings);
    const { id: competitionId, ...body } = competition;
    await ProblemModel.bulkCreate(newProblems.map(({ id: problemId, ...problem }) => ({ id: problemId, body: problem, createdBy: null })),
      { transaction });
    await CompetitionModel.create({ id: competitionId, body, createdBy: null }, { transaction });
    return report([], warnings, true);
  });
}

/** The competition `{ competition, problems? }` holds, checked for its shape
 *  and for keeping the id it is stored under, and the new problems, checked
 *  for theirs. */
function readCompetitionBody(competitionId: string, value: unknown):
  { competition: CompetitionConfig, problems: Problem[] } | { errors: string[] } {
  if (!isRecord(value) || !isRecord(value.competition)
    || !(value.problems === undefined || (Array.isArray(value.problems) && value.problems.every(isRecord)))) {
    return { errors: ['A kérés nem egy { competition, problems } objektum.'] };
  }
  const { id, ...body } = value.competition;
  if (id !== competitionId) {
    return { errors: [`verseny ${competitionId}: az azonosító nem változhat (a kérésben: ${String(id)})`] };
  }
  const problems = value.problems ?? [];
  const errors = [
    ...competitionShapeErrors(competitionId, body),
    ...problems.flatMap(({ id: problemId, ...problem }) => typeof problemId === 'string'
      ? problemShapeErrors(problemId, problem) : [`feladat ${String(problemId)}: az azonosítója nem szöveg`]),
  ];
  const ids = problems.map(({ id: problemId }) => problemId);
  errors.push(...[...new Set(ids.filter((each, index) => ids.indexOf(each) !== index))]
    .map(each => `feladat ${String(each)}: kétszer is szerepel az új feladatok között`));
  if (errors.length > 0) return { errors };
  return {
    competition: { ...(body as Omit<CompetitionConfig, 'id'>), id: competitionId },
    problems: problems as unknown as Problem[],
  };
}
