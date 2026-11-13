// A competition is what a join code is valid for: an optional relay and an
// optional strategy game, the languages it is held in, and when its matches
// may start. Category, round and the like are metadata, which the platform
// shows and never acts on. Where competitions and problems are stored is the
// sources' business (`CompetitionSource`, `ProblemSource`), not this model's.

export const LANGUAGES = ['hu', 'en'] as const;
export type Language = typeof LANGUAGES[number];

export function isLanguage(value: unknown): value is Language {
  return (LANGUAGES as readonly unknown[]).includes(value);
}

/// The id of a competition or a problem: ten random characters, `--`, then a
/// slug for people to recognise it by, e.g. `k3x9q2m7ab--hatszog-terulet`.
///
/// The slug is a hint, not data: nothing parses it, and the whole id stays as
/// it is once something refers to it, slug included. That is what keeps a year,
/// a category or a round out of anything the platform depends on.
export const ENTITY_ID_PATTERN = /^[0-9a-z]{10}--[a-z0-9]+(-[a-z0-9]+)*$/;

export function isEntityId(value: unknown): value is string {
  return typeof value === 'string' && ENTITY_ID_PATTERN.test(value);
}

export type CompetitionId = string;
export type ProblemId = string;

/// A key of the strategy-game registry. It names a game together with its
/// variant: `19o-c` and `19o-d` are the same game from different starting
/// positions.
export type StrategyGameId = string;

/// What a problem says in one language.
export interface ProblemContent {
  problemText: string;
  imageUrl?: string;
  help1?: string;
  help2?: string;
}

/// One problem, which any number of relays may use. Its points belong to the
/// relay, so a shared problem can be worth different points in two of them.
///
/// It has content in at least one language. A team is shown its own language
/// where the problem has it and another one where it does not, field by field:
/// `localizeProblem` is that rule. So an image the same in both languages is
/// given once.
export interface Problem {
  id: ProblemId;
  /// An integer, and the same in every language.
  answer: number;
  content: Partial<Record<Language, ProblemContent>>;
}

/// The problem's content as a team with the given language sees it. Each field
/// comes from the team's language if the problem has it there, else from the
/// first of the other languages, in `LANGUAGES` order, that has it.
export function localizeProblem(problem: Problem, language: Language): ProblemContent {
  const blocks = [language, ...LANGUAGES.filter(other => other !== language)]
    .map(each => problem.content[each])
    .filter(block => block !== undefined);
  if (blocks.length === 0) {
    throw new Error(`Problem ${problem.id} has content in no language`);
  }
  const first = <K extends keyof ProblemContent>(field: K) =>
    blocks.find(block => block[field] !== undefined)?.[field];
  return {
    problemText: blocks[0].problemText,
    imageUrl: first('imageUrl'),
    help1: first('help1'),
    help2: first('help2'),
  };
}

export interface RelayConfig {
  durationMinutes: number;
  /// In play order.
  problems: { problemId: ProblemId; points: number }[];
}

export interface StrategyConfig {
  durationMinutes: number;
  gameId: StrategyGameId;
}

/// When a team may start either match. A team can have a window of its own in
/// place of its competition's, for a testing code or a team writing late.
/// Without a `closesAt` it stays open from `opensAt` on. ISO 8601 with an
/// explicit offset, since the server and the dry run need not share a time zone.
export interface StartWindow {
  opensAt: string;
  closesAt?: string;
}

/// Where `now` falls against a start window: before it opens, while a match
/// may start, or after it has closed. `closesAt` is the first moment no match
/// may start. Without a window a match may start at any time.
export type StartWindowState = 'not-open-yet' | 'open' | 'closed';

export function startWindowState(window: StartWindow | undefined, now: Date): StartWindowState {
  if (window === undefined) return 'open';
  if (now.getTime() < Date.parse(window.opensAt)) return 'not-open-yet';
  if (window.closesAt !== undefined && now.getTime() >= Date.parse(window.closesAt)) return 'closed';
  return 'open';
}

export const ROUNDS = ['online', 'local', 'final'] as const;
export type Round = typeof ROUNDS[number];

/// One value per language, any of them missing.
export type Localized<T> = Partial<Record<Language, T>>;

/// A value the same in every language, or one per language. The plain form
/// is for whoever writes for one language only and need not know of the other.
export type Localizable<T> = T | Localized<T>;

/// Whether a value is the per-language form: a plain object keyed by
/// languages alone. A React element or an array is a plain value.
export function isLocalized<T>(value: Localizable<T>): value is Localized<T> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return (prototype === Object.prototype || prototype === null) && Object.keys(value).every(isLanguage);
}

/// A plain value as it is; else the value in the given language, or in the
/// first of the others, in `LANGUAGES` order, that has one.
export function inLanguage<T>(value: Localizable<T>, language: Language): T | undefined {
  if (!isLocalized(value)) return value;
  return [language, ...LANGUAGES.filter(other => other !== language)]
    .map(each => value[each])
    .find(each => each !== undefined);
}

/// A name in at least one language, shown in another one where the reader's
/// is missing.
export type LocalizedLabel = Localized<string>;

export function localizeLabel(label: LocalizedLabel, language: Language): string | undefined {
  return inLanguage<string>(label, language);
}

/// For teams and admins to orient themselves by. The platform decides nothing
/// from it. A `competition` is one round of one edition of the Dürer, in one
/// category; anything else, such as a practice set built around a topic, is
/// `other`, and its label is all it is listed by.
export type CompetitionMetadata =
  | {
    kind: 'competition';
    /// The Dürer's number, e.g. 19; `editionSchoolYear` says when that was.
    edition: number;
    round: Round;
    /// Free text, e.g. `C`, `E+`.
    category: string;
    label?: LocalizedLabel;
  }
  | {
    kind: 'other';
    label: LocalizedLabel;
  };

/// The school year an edition is held in, the way teachers and students name
/// it and the strategy practice site's catalogue writes it: `07/08` for the
/// first, `26/27` for the twentieth. All of an edition's rounds share it, the
/// autumn ones and the final alike.
export function editionSchoolYear(edition: number): string {
  const twoDigits = (year: number) => String(year % 100).padStart(2, '0');
  return `${twoDigits(edition + 2006)}/${twoDigits(edition + 2007)}`;
}

// The words a round goes by in a competition's name: its own, and the admin
// page's Hungarian one.
const ROUND_WORDS: Record<string, Round> = {
  online: 'online', internetes: 'online',
  local: 'local', helyi: 'local',
  final: 'final', 'döntő': 'final', donto: 'final',
};

/// How people name one round of one edition in one category, e.g.
/// `20 online C`: the team import takes it in place of the id. Only a
/// `competition` has one; anything else goes by its id.
export function competitionName(metadata: CompetitionMetadata): string | undefined {
  return metadata.kind === 'competition' ? `${metadata.edition} ${metadata.round} ${metadata.category}` : undefined;
}

/// Whether `text` names the competition with this metadata, the way
/// `competitionName` writes it or close to it: any case and spacing, a dot
/// after the edition (`20.`), and the round in Hungarian too (`internetes`,
/// `helyi`, `döntő`).
export function namesCompetition(text: string, metadata: CompetitionMetadata): boolean {
  if (metadata.kind !== 'competition') return false;
  const match = /^(\d+)\.?\s+(\S+)\s+(.+)$/u.exec(text.trim().toLowerCase());
  if (match === null) return false;
  const [, edition, round, category] = match;
  return Number(edition) === metadata.edition
    && ROUND_WORDS[round] === metadata.round
    && category.replace(/\s+/gu, ' ') === metadata.category.trim().toLowerCase();
}

export interface CompetitionConfig {
  id: CompetitionId;
  /// One language is fixed; with both, the team chooses and can switch at any
  /// time. Something missing in the team's language is shown in another one.
  languages: Language[];
  /// Without one, matches may start at any time.
  startWindow?: StartWindow;
  /// At least one of the two.
  relay?: RelayConfig;
  strategy?: StrategyConfig;
  metadata: CompetitionMetadata;
}

/// Where problems come from. An id it does not know is missing from the map.
export interface ProblemSource {
  getProblems(ids: readonly ProblemId[]): Promise<Map<ProblemId, Problem>>;
}

export interface CompetitionSource {
  getCompetition(id: CompetitionId): Promise<CompetitionConfig | undefined>;
  listCompetitions(): Promise<CompetitionConfig[]>;
}

/// The boardgame.io game a competition's relay is registered under, the same
/// on the server and in the client that connects to it.
export function relayGameName(competitionId: CompetitionId): string {
  return `relay--${competitionId}`;
}

/// The strategy match's, as `relayGameName`.
export function strategyGameName(competitionId: CompetitionId): string {
  return `strategy--${competitionId}`;
}

/// What a team is served of its competition: everything but the relay's
/// problems, whose answers the client must never see. Their points are not
/// secret, and the home screen tells them.
export interface PublicCompetition {
  id: CompetitionId;
  languages: Language[];
  relay?: {
    durationMinutes: number;
    /// Each problem's points, in play order; so its length is the number of problems.
    problemPoints: number[];
  };
  strategy?: StrategyConfig;
  metadata: CompetitionMetadata;
}

/// Listed field by field rather than copied with the problems deleted, so a
/// field added to the config later stays private until someone decides
/// otherwise.
export function publicCompetition(competition: CompetitionConfig): PublicCompetition {
  const { id, languages, relay, strategy, metadata } = competition;
  return {
    id,
    languages,
    ...(relay !== undefined && {
      relay: { durationMinutes: relay.durationMinutes, problemPoints: relay.problems.map(problem => problem.points) },
    }),
    ...(strategy !== undefined && { strategy: { durationMinutes: strategy.durationMinutes, gameId: strategy.gameId } }),
    metadata,
  };
}
