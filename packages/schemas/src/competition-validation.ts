import {
  CompetitionConfig,
  isEntityId,
  isLanguage,
  Language,
  LocalizedLabel,
  Problem,
  ProblemId,
  ROUNDS,
  StartWindow,
  StrategyGameId,
} from './competition';

/// What a competition needs to know of a registered strategy game.
export interface StrategyGameInfo {
  languages: readonly Language[];
}

/// What a competition's references are checked against.
export interface CompetitionReferences {
  problems: ReadonlyMap<ProblemId, Problem>;
  strategyGames: ReadonlyMap<StrategyGameId, StrategyGameInfo>;
}

/// Every rule a validator below checks, with the values its finding names.
/// A code is a promise to the admin page, which translates it
/// (`validation-finding.ts`): rename one only together with its translation.
/// One code per rule, wherever the rule applies: a malformed id is the same
/// finding on a problem and on a competition.
export interface ValidationParams {
  OPENS_AT_INVALID: { value: string };
  CLOSES_AT_INVALID: { value: string };
  CLOSES_NOT_AFTER_OPENS: Record<never, never>;
  MALFORMED_ID: Record<never, never>;
  ID_NAMES_BOTH: { id: string };
  ANSWER_NOT_INTEGER: { answer: number };
  NO_CONTENT: Record<never, never>;
  CONTENT_UNKNOWN_LANGUAGE: { language: string };
  TEXT_EMPTY: { language: string };
  NO_LANGUAGE: Record<never, never>;
  UNSUPPORTED_LANGUAGE: { language: string };
  LANGUAGE_TWICE: Record<never, never>;
  ADVANCING_POINTS_NOT_POSITIVE: { points: number };
  FINISH_MESSAGE_IN_NO_LANGUAGE: Record<never, never>;
  FINISH_MESSAGE_UNKNOWN_LANGUAGE: { language: string };
  FINISH_MESSAGE_EMPTY: { language: string };
  FINISH_MESSAGE_NOT_IN_LANGUAGES: Record<never, never>;
  EDITION_NOT_POSITIVE: { edition: number };
  UNKNOWN_ROUND: { round: string };
  CATEGORY_EMPTY: Record<never, never>;
  LABEL_IN_NO_LANGUAGE: Record<never, never>;
  LABEL_UNKNOWN_LANGUAGE: { language: string };
  LABEL_EMPTY: { language: string };
  NO_MATCH: Record<never, never>;
  RELAY_DURATION_NOT_POSITIVE: { minutes: number };
  RELAY_EMPTY: Record<never, never>;
  RELAY_PROBLEM_REPEATED: Record<never, never>;
  RELAY_POINTS_NOT_POSITIVE: { points: number };
  RELAY_PROBLEM_MISSING: Record<never, never>;
  RELAY_PROBLEM_NOT_IN_LANGUAGES: Record<never, never>;
  STRATEGY_DURATION_NOT_POSITIVE: { minutes: number };
  STRATEGY_GAME_UNKNOWN: { gameId: string };
  STRATEGY_GAME_NOT_IN_LANGUAGES: { gameId: string };
}

export type ValidationCode = keyof ValidationParams;

/// What a finding is about. A relay problem's findings name its place in the
/// relay, 0-based, since the same problem may be refused at two places.
export type ValidationSubject =
  | { kind: 'problem', id: string }
  | { kind: 'competition', id: string, relayProblem?: { index: number, problemId: ProblemId } };

/// One way something breaks the rules. A start window checked on its own, and
/// an id clash between a problem and a competition, have no subject.
export type ValidationFinding = {
  [C in ValidationCode]: { code: C, subject?: ValidationSubject, params: ValidationParams[C] }
}[ValidationCode];

/// A finding of the given code; `params` may be left out where it has none.
function finding<C extends ValidationCode>(
  code: C, subject?: ValidationSubject, ...[params]: Record<never, never> extends ValidationParams[C] ? [ValidationParams[C]?] : [ValidationParams[C]]
): ValidationFinding {
  // TypeScript cannot narrow the union by a generic `C`; the signature above
  // is what ties `params` to `code`.
  return { code, ...(subject !== undefined && { subject }), params: params ?? {} } as ValidationFinding;
}

// The English the developers read: at server start, in the log, in a refusal's
// `message`. A relay problem's subject reads as the start of the sentence.
const ENGLISH: { [C in ValidationCode]: (params: ValidationParams[C]) => string } = {
  OPENS_AT_INVALID: ({ value }) => `opensAt "${value}" is not an ISO 8601 time with an offset`,
  CLOSES_AT_INVALID: ({ value }) => `closesAt "${value}" is not an ISO 8601 time with an offset`,
  CLOSES_NOT_AFTER_OPENS: () => 'closesAt is not after opensAt',
  MALFORMED_ID: () => 'the id is not of the form <10 characters of [0-9a-z]>--<slug>',
  ID_NAMES_BOTH: ({ id }) => `${id} names both a problem and a competition`,
  ANSWER_NOT_INTEGER: ({ answer }) => `the answer ${answer} is not an integer`,
  NO_CONTENT: () => 'has no content in any language',
  CONTENT_UNKNOWN_LANGUAGE: ({ language }) => `has content in the unknown language "${language}"`,
  TEXT_EMPTY: ({ language }) => `its ${language} text is empty`,
  NO_LANGUAGE: () => 'has no language',
  UNSUPPORTED_LANGUAGE: ({ language }) => `the language "${language}" is not one of the supported ones`,
  LANGUAGE_TWICE: () => 'names a language twice',
  ADVANCING_POINTS_NOT_POSITIVE: ({ points }) => `the advancing points ${points} are not a positive integer`,
  FINISH_MESSAGE_IN_NO_LANGUAGE: () => 'the finish message is in no language',
  FINISH_MESSAGE_UNKNOWN_LANGUAGE: ({ language }) => `the finish message is in the unknown language "${language}"`,
  FINISH_MESSAGE_EMPTY: ({ language }) => `the ${language} finish message is empty`,
  FINISH_MESSAGE_NOT_IN_LANGUAGES: () => 'the finish message is in none of the competition\'s languages',
  EDITION_NOT_POSITIVE: ({ edition }) => `the edition ${edition} is not a positive integer`,
  UNKNOWN_ROUND: ({ round }) => `the round "${round}" is not one of ${ROUNDS.join(', ')}`,
  CATEGORY_EMPTY: () => 'the category is empty',
  LABEL_IN_NO_LANGUAGE: () => 'the label is in no language',
  LABEL_UNKNOWN_LANGUAGE: ({ language }) => `the label is in the unknown language "${language}"`,
  LABEL_EMPTY: ({ language }) => `the ${language} label is empty`,
  NO_MATCH: () => 'has neither a relay nor a strategy game',
  RELAY_DURATION_NOT_POSITIVE: ({ minutes }) => `the relay's duration ${minutes} is not a positive whole number of minutes`,
  RELAY_EMPTY: () => 'the relay has no problems',
  RELAY_PROBLEM_REPEATED: () => 'is already in the relay',
  RELAY_POINTS_NOT_POSITIVE: ({ points }) => `is worth ${points} points, not a positive integer`,
  RELAY_PROBLEM_MISSING: () => 'does not exist',
  RELAY_PROBLEM_NOT_IN_LANGUAGES: () => 'is in none of the competition\'s languages',
  STRATEGY_DURATION_NOT_POSITIVE: ({ minutes }) =>
    `the strategy game's duration ${minutes} is not a positive whole number of minutes`,
  STRATEGY_GAME_UNKNOWN: ({ gameId }) => `the strategy game ${gameId} is not registered`,
  STRATEGY_GAME_NOT_IN_LANGUAGES: ({ gameId }) => `the strategy game ${gameId} is in none of the competition's languages`,
};

/// The finding in English, for developers; the admin page translates the code.
export function formatFinding({ code, subject, params }: ValidationFinding): string {
  // Destructuring loses the link between `code` and `params`; a finding's
  // type keeps it, so `ENGLISH[code]` is always given its own params.
  const text = (ENGLISH[code] as (params: ValidationFinding['params']) => string)(params);
  if (subject === undefined) return text;
  if (subject.kind === 'problem') return `problem ${subject.id}: ${text}`;
  const { relayProblem } = subject;
  return relayProblem === undefined
    ? `competition ${subject.id}: ${text}`
    : `competition ${subject.id}: relay problem ${relayProblem.index + 1} (${relayProblem.problemId}) ${text}`;
}

// An offset is required: without one `Date.parse` reads the time in the local
// zone of whichever machine parses it.
const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

function parseInstant(value: string): number | undefined {
  if (!ISO_WITH_OFFSET.test(value)) return undefined;
  const time = Date.parse(value);
  return Number.isNaN(time) ? undefined : time;
}

/// Every way the window breaks the rules `StartWindow` states; none means it
/// is valid. A team's own window is held to the same rules.
export function validateStartWindow({ opensAt, closesAt }: StartWindow, subject?: ValidationSubject): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  const opens = parseInstant(opensAt);
  if (opens === undefined) {
    findings.push(finding('OPENS_AT_INVALID', subject, { value: opensAt }));
  }
  if (closesAt !== undefined) {
    const closes = parseInstant(closesAt);
    if (closes === undefined) {
      findings.push(finding('CLOSES_AT_INVALID', subject, { value: closesAt }));
    } else if (opens !== undefined && closes <= opens) {
      findings.push(finding('CLOSES_NOT_AFTER_OPENS', subject));
    }
  }
  return findings;
}

function isPositiveInteger(value: number) {
  return Number.isSafeInteger(value) && value > 0;
}

const LABEL_CODES = {
  label: { none: 'LABEL_IN_NO_LANGUAGE', unknown: 'LABEL_UNKNOWN_LANGUAGE', empty: 'LABEL_EMPTY' },
  finishMessage: { none: 'FINISH_MESSAGE_IN_NO_LANGUAGE', unknown: 'FINISH_MESSAGE_UNKNOWN_LANGUAGE', empty: 'FINISH_MESSAGE_EMPTY' },
} as const;

function validateLabel(label: LocalizedLabel, subject: ValidationSubject, which: keyof typeof LABEL_CODES): ValidationFinding[] {
  const codes = LABEL_CODES[which];
  const findings: ValidationFinding[] = [];
  const languages = Object.keys(label);
  if (languages.length === 0) {
    findings.push(finding(codes.none, subject));
  }
  for (const language of languages) {
    if (!isLanguage(language)) {
      findings.push(finding(codes.unknown, subject, { language }));
    } else if (label[language]?.trim() === '') {
      findings.push(finding(codes.empty, subject, { language }));
    }
  }
  return findings;
}

/// Every way the problem breaks the rules `Problem` states; none means it is
/// valid.
export function validateProblem(problem: Problem): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  const subject: ValidationSubject = { kind: 'problem', id: problem.id };
  if (!isEntityId(problem.id)) {
    findings.push(finding('MALFORMED_ID', subject));
  }

  if (!Number.isSafeInteger(problem.answer)) {
    findings.push(finding('ANSWER_NOT_INTEGER', subject, { answer: problem.answer }));
  }

  const languages = Object.keys(problem.content);
  if (languages.length === 0) {
    findings.push(finding('NO_CONTENT', subject));
  }
  for (const language of languages) {
    if (!isLanguage(language)) {
      findings.push(finding('CONTENT_UNKNOWN_LANGUAGE', subject, { language }));
    } else if (problem.content[language]?.problemText.trim() === '') {
      findings.push(finding('TEXT_EMPTY', subject, { language }));
    }
  }

  return findings;
}

/// Every way the competition breaks the rules `CompetitionConfig` states, or
/// refers to something `references` does not have; none means it is valid. A
/// relay problem or a strategy game needs only one of the competition's
/// languages, since a team is shown another one where its own is missing; it
/// may not be in none of them. The problems it refers to are checked by
/// `validateProblem`, not here: a problem shared between competitions is
/// reported once that way.
export function validateCompetition(competition: CompetitionConfig, references: CompetitionReferences): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  const subject: ValidationSubject = { kind: 'competition', id: competition.id };
  if (!isEntityId(competition.id)) {
    findings.push(finding('MALFORMED_ID', subject));
  }

  if (competition.languages.length === 0) {
    findings.push(finding('NO_LANGUAGE', subject));
  }
  for (const language of competition.languages) {
    if (!isLanguage(language)) {
      findings.push(finding('UNSUPPORTED_LANGUAGE', subject, { language: String(language) }));
    }
  }
  if (new Set(competition.languages).size !== competition.languages.length) {
    findings.push(finding('LANGUAGE_TWICE', subject));
  }

  if (competition.startWindow !== undefined) {
    findings.push(...validateStartWindow(competition.startWindow, subject));
  }

  if (competition.advancingPoints !== undefined && !isPositiveInteger(competition.advancingPoints)) {
    findings.push(finding('ADVANCING_POINTS_NOT_POSITIVE', subject, { points: competition.advancingPoints }));
  }

  const { finishMessage } = competition;
  if (finishMessage !== undefined) {
    findings.push(...validateLabel(finishMessage, subject, 'finishMessage'));
    if (Object.keys(finishMessage).length > 0 && !competition.languages.some(language => finishMessage[language] !== undefined)) {
      findings.push(finding('FINISH_MESSAGE_NOT_IN_LANGUAGES', subject));
    }
  }

  const { metadata } = competition;
  if (metadata.kind === 'competition') {
    if (!isPositiveInteger(metadata.edition)) {
      findings.push(finding('EDITION_NOT_POSITIVE', subject, { edition: metadata.edition }));
    }
    if (!(ROUNDS as readonly string[]).includes(metadata.round)) {
      findings.push(finding('UNKNOWN_ROUND', subject, { round: metadata.round }));
    }
    if (metadata.category.trim() === '') {
      findings.push(finding('CATEGORY_EMPTY', subject));
    }
    if (metadata.label !== undefined) {
      findings.push(...validateLabel(metadata.label, subject, 'label'));
    }
  } else {
    findings.push(...validateLabel(metadata.label, subject, 'label'));
  }

  if (competition.relay === undefined && competition.strategy === undefined) {
    findings.push(finding('NO_MATCH', subject));
  }

  if (competition.relay !== undefined) {
    const { durationMinutes, problems } = competition.relay;
    if (!isPositiveInteger(durationMinutes)) {
      findings.push(finding('RELAY_DURATION_NOT_POSITIVE', subject, { minutes: durationMinutes }));
    }
    if (problems.length === 0) {
      findings.push(finding('RELAY_EMPTY', subject));
    }
    const seen = new Set<ProblemId>();
    problems.forEach(({ problemId, points }, index) => {
      const at: ValidationSubject = { ...subject, relayProblem: { index, problemId } };
      if (seen.has(problemId)) {
        findings.push(finding('RELAY_PROBLEM_REPEATED', at));
      }
      seen.add(problemId);
      if (!isPositiveInteger(points)) {
        findings.push(finding('RELAY_POINTS_NOT_POSITIVE', at, { points }));
      }
      const problem = references.problems.get(problemId);
      if (problem === undefined) {
        findings.push(finding('RELAY_PROBLEM_MISSING', at));
        return;
      }
      if (!competition.languages.some(language => problem.content[language] !== undefined)) {
        findings.push(finding('RELAY_PROBLEM_NOT_IN_LANGUAGES', at));
      }
    });
  }

  if (competition.strategy !== undefined) {
    const { durationMinutes, gameId } = competition.strategy;
    if (!isPositiveInteger(durationMinutes)) {
      findings.push(finding('STRATEGY_DURATION_NOT_POSITIVE', subject, { minutes: durationMinutes }));
    }
    const game = references.strategyGames.get(gameId);
    if (game === undefined) {
      findings.push(finding('STRATEGY_GAME_UNKNOWN', subject, { gameId }));
    } else if (!competition.languages.some(language => game.languages.includes(language))) {
      findings.push(finding('STRATEGY_GAME_NOT_IN_LANGUAGES', subject, { gameId }));
    }
  }

  return findings;
}
