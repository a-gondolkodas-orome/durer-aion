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

// An offset is required: without one `Date.parse` reads the time in the local
// zone of whichever machine parses it.
const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

function parseInstant(value: string): number | undefined {
  if (!ISO_WITH_OFFSET.test(value)) return undefined;
  const time = Date.parse(value);
  return Number.isNaN(time) ? undefined : time;
}

/// Every way the window breaks the rules `StartWindow` states, as messages;
/// none means it is valid. A team's own window is held to the same rules.
export function validateStartWindow({ opensAt, closesAt }: StartWindow): string[] {
  const errors: string[] = [];
  const opens = parseInstant(opensAt);
  if (opens === undefined) {
    errors.push(`opensAt "${opensAt}" is not an ISO 8601 time with an offset`);
  }
  if (closesAt !== undefined) {
    const closes = parseInstant(closesAt);
    if (closes === undefined) {
      errors.push(`closesAt "${closesAt}" is not an ISO 8601 time with an offset`);
    } else if (opens !== undefined && closes <= opens) {
      errors.push('closesAt is not after opensAt');
    }
  }
  return errors;
}

function isPositiveInteger(value: number) {
  return Number.isSafeInteger(value) && value > 0;
}

function validateLabel(label: LocalizedLabel, where: string): string[] {
  const errors: string[] = [];
  const languages = Object.keys(label);
  if (languages.length === 0) {
    errors.push(`${where}: the label is in no language`);
  }
  for (const language of languages) {
    if (!isLanguage(language)) {
      errors.push(`${where}: the label is in the unknown language "${language}"`);
    } else if (label[language]?.trim() === '') {
      errors.push(`${where}: the ${language} label is empty`);
    }
  }
  return errors;
}

/// Every way the problem breaks the rules `Problem` states, as messages; none
/// means it is valid.
export function validateProblem(problem: Problem): string[] {
  const errors: string[] = [];
  const where = `problem ${problem.id}`;
  if (!isEntityId(problem.id)) {
    errors.push(`${where}: the id is not of the form <10 characters of [0-9a-z]>--<slug>`);
  }

  if (!Number.isSafeInteger(problem.answer)) {
    errors.push(`${where}: the answer ${problem.answer} is not an integer`);
  }

  const languages = Object.keys(problem.content);
  if (languages.length === 0) {
    errors.push(`${where}: has no content in any language`);
  }
  for (const language of languages) {
    if (!isLanguage(language)) {
      errors.push(`${where}: has content in the unknown language "${language}"`);
    } else if (problem.content[language]?.problemText.trim() === '') {
      errors.push(`${where}: its ${language} text is empty`);
    }
  }

  return errors;
}

/// Every way the competition breaks the rules `CompetitionConfig` states, or
/// refers to something `references` does not have, as messages; none means it
/// is valid. A relay problem or a strategy game needs only one of the
/// competition's languages, since a team is shown another one where its own is
/// missing; it may not be in none of them. The problems it refers to are checked by `validateProblem`, not
/// here: a problem shared between competitions is reported once that way.
export function validateCompetition(competition: CompetitionConfig, references: CompetitionReferences): string[] {
  const errors: string[] = [];
  const where = `competition ${competition.id}`;
  if (!isEntityId(competition.id)) {
    errors.push(`${where}: the id is not of the form <10 characters of [0-9a-z]>--<slug>`);
  }

  if (competition.languages.length === 0) {
    errors.push(`${where}: has no language`);
  }
  for (const language of competition.languages) {
    if (!isLanguage(language)) {
      errors.push(`${where}: the language "${String(language)}" is not one of the supported ones`);
    }
  }
  if (new Set(competition.languages).size !== competition.languages.length) {
    errors.push(`${where}: names a language twice`);
  }

  if (competition.startWindow !== undefined) {
    errors.push(...validateStartWindow(competition.startWindow).map(error => `${where}: ${error}`));
  }

  const { metadata } = competition;
  if (metadata.kind === 'competition') {
    if (!isPositiveInteger(metadata.edition)) {
      errors.push(`${where}: the edition ${metadata.edition} is not a positive integer`);
    }
    if (!(ROUNDS as readonly string[]).includes(metadata.round)) {
      errors.push(`${where}: the round "${metadata.round}" is not one of ${ROUNDS.join(', ')}`);
    }
    if (metadata.category.trim() === '') {
      errors.push(`${where}: the category is empty`);
    }
    if (metadata.label !== undefined) {
      errors.push(...validateLabel(metadata.label, where));
    }
  } else {
    errors.push(...validateLabel(metadata.label, where));
  }

  if (competition.relay === undefined && competition.strategy === undefined) {
    errors.push(`${where}: has neither a relay nor a strategy game`);
  }

  if (competition.relay !== undefined) {
    const { durationMinutes, problems } = competition.relay;
    if (!isPositiveInteger(durationMinutes)) {
      errors.push(`${where}: the relay's duration ${durationMinutes} is not a positive whole number of minutes`);
    }
    if (problems.length === 0) {
      errors.push(`${where}: the relay has no problems`);
    }
    const seen = new Set<ProblemId>();
    problems.forEach(({ problemId, points }, index) => {
      const at = `${where}: relay problem ${index + 1} (${problemId})`;
      if (seen.has(problemId)) {
        errors.push(`${at} is already in the relay`);
      }
      seen.add(problemId);
      if (!isPositiveInteger(points)) {
        errors.push(`${at} is worth ${points} points, not a positive integer`);
      }
      const problem = references.problems.get(problemId);
      if (problem === undefined) {
        errors.push(`${at} does not exist`);
        return;
      }
      if (!competition.languages.some(language => problem.content[language] !== undefined)) {
        errors.push(`${at} is in none of the competition's languages`);
      }
    });
  }

  if (competition.strategy !== undefined) {
    const { durationMinutes, gameId } = competition.strategy;
    if (!isPositiveInteger(durationMinutes)) {
      errors.push(`${where}: the strategy game's duration ${durationMinutes} is not a positive whole number of minutes`);
    }
    const game = references.strategyGames.get(gameId);
    if (game === undefined) {
      errors.push(`${where}: the strategy game ${gameId} is not registered`);
    } else {
      if (!competition.languages.some(language => game.languages.includes(language))) {
        errors.push(`${where}: the strategy game ${gameId} is in none of the competition's languages`);
      }
    }
  }

  return errors;
}
