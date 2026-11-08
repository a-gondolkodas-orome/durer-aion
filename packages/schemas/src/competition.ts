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

/// A text in whichever of the languages it exists in.
export type Localized = Partial<Record<Language, string>>;

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

/// One problem, which any number of relays may use. Its points belong to the
/// relay, so a shared problem can be worth different points in two of them.
///
/// It has text in at least one language, and an image or hint only in a
/// language it has text in. An image, when there is one, is given for every
/// language with text, even where the link is the same: a missing translated
/// image is then an error rather than a silent fallback.
export interface Problem {
  id: ProblemId;
  problemText: Localized;
  /// An integer, and the same in every language.
  answer: number;
  url?: Localized;
  help1?: Localized;
  help2?: Localized;
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

/// For teams and admins to orient themselves by. The platform decides nothing
/// from it.
export interface CompetitionMetadata {
  category?: string;
  label?: string;
  round?: 'online' | 'local' | 'final';
}

export interface CompetitionConfig {
  id: CompetitionId;
  /// One language is fixed; with both, the team chooses and can switch at any
  /// time.
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
