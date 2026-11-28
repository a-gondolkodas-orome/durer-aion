import { strategyGames } from 'game/strategy';
import type { CompetitionConfig, Language } from 'schemas';
import { competitionShapeErrors, isRecord, validateCompetition, validateStartWindow } from 'schemas';
import { Op, type Transaction } from 'sequelize';
import type { TeamsRepository } from './db';
import type { ContentSources } from './database_sources';
import { InvalidStoredProblemError } from './database_sources';
import { CompetitionModel, CompetitionWindowModel, TeamModel } from './model';

// Changing a competition on its admin page: the body is the competition
// whole. One held in the database is replaced by it once it keeps the rules
// and the locks; of one held in code only the start window changes.

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
 *  `{ competition }`, or, if it breaks the rules or a lock, does not; with
 *  `dryRun`, says what it would do and writes nothing. Undefined for an id
 *  no one holds.
 *
 *  One held in the database is replaced whole, and its window is the one the
 *  body gives: a window set for it apart, by an earlier admin page, is
 *  dropped. One held in code changes only with a deploy, its start window
 *  aside, which is stored apart from it (`setCompetitionWindow`); its own
 *  window given back takes that one away.
 *
 *  A stored competition is read as it is, unvalidated, so one the rules have
 *  since come to refuse can be mended here. The problems are read before the
 *  transaction opens, for the reason `importBundle` gives. */
export async function writeCompetition(
  teams: TeamsRepository,
  competitionId: string,
  value: unknown,
  { problemSource, competitions }: Pick<ContentSources, 'problemSource' | 'competitions'>,
  { dryRun }: { dryRun: boolean },
): Promise<CompetitionWriteReport | undefined> {
  const inCode = competitions.get(competitionId);
  const row = inCode === undefined ? await CompetitionModel.findByPk(competitionId) : null;
  const before: CompetitionConfig | undefined = inCode ?? (row === null ? undefined : { ...row.body, id: competitionId });
  if (before === undefined) return undefined;
  const report = (errors: string[], warnings: string[], started: boolean, written = false) =>
    ({ written, errors, warnings, started });

  const shape = readCompetitionBody(competitionId, value);
  if ('errors' in shape) return report(shape.errors, [], await hasStarted(competitionId));
  const after = shape.competition;

  if (inCode !== undefined) {
    const where = `verseny ${competitionId}`;
    const errors = [
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

  let errors: string[];
  try {
    const problems = await problemSource.getProblems(after.relay?.problems.map(({ problemId }) => problemId) ?? []);
    errors = validateCompetition(after, { problems, strategyGames: new Map(Object.entries(strategyGames)) });
  } catch (error) {
    if (!(error instanceof InvalidStoredProblemError)) throw error;
    errors = [`feladat ${error.problemId}: a váltó ezt a tárolt feladatot használja, de a tárolt feladat hibás`,
      ...error.errors];
  }

  return await teams.sequelize.transaction(async (transaction) => {
    const started = await hasStarted(competitionId, transaction);
    const allErrors = [...errors, ...(started ? lockErrors(before, after) : [])];
    const warnings = started ? ['Már indult csapat ebben a versenyben: a futó meccsek a régi beállításokkal mennek '
      + 'tovább, a változás az ezután indulókra érvényes.'] : [];
    if (allErrors.length > 0 || dryRun) return report(allErrors, warnings, started);
    const { id, ...body } = after;
    await CompetitionModel.update({ body }, { where: { id }, transaction });
    await CompetitionWindowModel.destroy({ where: { competitionId: id }, transaction });
    return report([], warnings, started, true);
  });
}

/** The competition `{ competition }` holds, checked for its shape and for
 *  keeping the id it is stored under. */
function readCompetitionBody(competitionId: string, value: unknown):
  { competition: CompetitionConfig } | { errors: string[] } {
  if (!isRecord(value) || !isRecord(value.competition)) {
    return { errors: ['A kérés nem egy { competition } objektum.'] };
  }
  const { id, ...body } = value.competition;
  if (id !== competitionId) {
    return { errors: [`verseny ${competitionId}: az azonosító nem változhat (a kérésben: ${String(id)})`] };
  }
  const errors = competitionShapeErrors(competitionId, body);
  if (errors.length > 0) return { errors };
  return { competition: { ...(body as Omit<CompetitionConfig, 'id'>), id: competitionId } };
}
