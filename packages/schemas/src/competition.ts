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

/// When a team may start either match; teams can be exempt from it one by one.
/// Without a `closesAt` it stays open from `opensAt` on. ISO 8601 with an
/// explicit offset, since the server and the dry run need not share a time zone.
export interface StartWindow {
  opensAt: string;
  closesAt?: string;
}

export const ROUNDS = ['online', 'local', 'final'] as const;
export type Round = typeof ROUNDS[number];

/// A name in at least one language, shown in another one where the reader's
/// is missing.
export type LocalizedLabel = Partial<Record<Language, string>>;

/// The label in the given language, else in the first of the others, in
/// `LANGUAGES` order, that has it.
export function localizeLabel(label: LocalizedLabel, language: Language): string | undefined {
  return [language, ...LANGUAGES.filter(other => other !== language)]
    .map(each => label[each])
    .find(text => text !== undefined);
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
