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
    errors.push(`az opensAt („${opensAt}”) nem időzónával megadott ISO 8601 időpont`);
  }
  if (closesAt !== undefined) {
    const closes = parseInstant(closesAt);
    if (closes === undefined) {
      errors.push(`a closesAt („${closesAt}”) nem időzónával megadott ISO 8601 időpont`);
    } else if (opens !== undefined && closes <= opens) {
      errors.push('a closesAt nem az opensAt utáni');
    }
  }
  return errors;
}

const MALFORMED_ID = 'az azonosító nem <10 karakter a [0-9a-z] közül>--<slug> alakú';

function isPositiveInteger(value: number) {
  return Number.isSafeInteger(value) && value > 0;
}

/// `what` names the label with its article, as a sentence's subject.
function validateLabel(label: LocalizedLabel, where: string, what = 'a felirat'): string[] {
  const errors: string[] = [];
  const languages = Object.keys(label);
  if (languages.length === 0) {
    errors.push(`${where}: ${what} egyik nyelven sincs megadva`);
  }
  for (const language of languages) {
    if (!isLanguage(language)) {
      errors.push(`${where}: ${what} ismeretlen nyelven is meg van adva: „${language}”`);
    } else if (label[language]?.trim() === '') {
      errors.push(`${where}: ${what} üres (${language})`);
    }
  }
  return errors;
}

/// Every way the problem breaks the rules `Problem` states, as messages; none
/// means it is valid.
export function validateProblem(problem: Problem): string[] {
  const errors: string[] = [];
  const where = `feladat ${problem.id}`;
  if (!isEntityId(problem.id)) {
    errors.push(`${where}: ${MALFORMED_ID}`);
  }

  if (!Number.isSafeInteger(problem.answer)) {
    errors.push(`${where}: a válasz (${problem.answer}) nem egész szám`);
  }

  const languages = Object.keys(problem.content);
  if (languages.length === 0) {
    errors.push(`${where}: egyik nyelven sincs szövege`);
  }
  for (const language of languages) {
    if (!isLanguage(language)) {
      errors.push(`${where}: ismeretlen nyelven is van szövege: „${language}”`);
    } else if (problem.content[language]?.problemText.trim() === '') {
      errors.push(`${where}: a szövege üres (${language})`);
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
  const where = `verseny ${competition.id}`;
  if (!isEntityId(competition.id)) {
    errors.push(`${where}: ${MALFORMED_ID}`);
  }

  if (competition.languages.length === 0) {
    errors.push(`${where}: nincs megadva nyelve`);
  }
  for (const language of competition.languages) {
    if (!isLanguage(language)) {
      errors.push(`${where}: nem támogatott nyelv: „${String(language)}”`);
    }
  }
  if (new Set(competition.languages).size !== competition.languages.length) {
    errors.push(`${where}: egy nyelvet kétszer is felsorol`);
  }

  if (competition.startWindow !== undefined) {
    errors.push(...validateStartWindow(competition.startWindow).map(error => `${where}: ${error}`));
  }

  if (competition.advancingPoints !== undefined && !isPositiveInteger(competition.advancingPoints)) {
    errors.push(`${where}: a továbbjutási ponthatár (${competition.advancingPoints}) nem pozitív egész szám`);
  }

  const { finishMessage } = competition;
  if (finishMessage !== undefined) {
    errors.push(...validateLabel(finishMessage, where, 'a záróüzenet'));
    if (Object.keys(finishMessage).length > 0 && !competition.languages.some(language => finishMessage[language] !== undefined)) {
      errors.push(`${where}: a záróüzenet a verseny egyik nyelvén sincs megadva`);
    }
  }

  const { metadata } = competition;
  if (metadata.kind === 'competition') {
    if (!isPositiveInteger(metadata.edition)) {
      errors.push(`${where}: a kiadás (${metadata.edition}) nem pozitív egész szám`);
    }
    if (!(ROUNDS as readonly string[]).includes(metadata.round)) {
      errors.push(`${where}: a forduló („${metadata.round}”) nem ezek egyike: ${ROUNDS.join(', ')}`);
    }
    if (metadata.category.trim() === '') {
      errors.push(`${where}: a kategória üres`);
    }
    if (metadata.label !== undefined) {
      errors.push(...validateLabel(metadata.label, where));
    }
  } else {
    errors.push(...validateLabel(metadata.label, where));
  }

  if (competition.relay === undefined && competition.strategy === undefined) {
    errors.push(`${where}: sem váltója, sem stratégiás játéka nincs`);
  }

  if (competition.relay !== undefined) {
    const { durationMinutes, problems } = competition.relay;
    if (!isPositiveInteger(durationMinutes)) {
      errors.push(`${where}: a váltó hossza (${durationMinutes}) nem pozitív egész számú perc`);
    }
    if (problems.length === 0) {
      errors.push(`${where}: a váltóban nincs feladat`);
    }
    const seen = new Set<ProblemId>();
    problems.forEach(({ problemId, points }, index) => {
      const at = `${where}: a váltó ${index + 1}. feladata (${problemId})`;
      if (seen.has(problemId)) {
        errors.push(`${at} korábban már szerepel a váltóban`);
      }
      seen.add(problemId);
      if (!isPositiveInteger(points)) {
        errors.push(`${at}: a pontértéke (${points}) nem pozitív egész szám`);
      }
      const problem = references.problems.get(problemId);
      if (problem === undefined) {
        errors.push(`${at} nem létezik`);
        return;
      }
      if (!competition.languages.some(language => problem.content[language] !== undefined)) {
        errors.push(`${at} a verseny egyik nyelvén sincs meg`);
      }
    });
  }

  if (competition.strategy !== undefined) {
    const { durationMinutes, gameId } = competition.strategy;
    if (!isPositiveInteger(durationMinutes)) {
      errors.push(`${where}: a stratégiás játék hossza (${durationMinutes}) nem pozitív egész számú perc`);
    }
    const game = references.strategyGames.get(gameId);
    if (game === undefined) {
      errors.push(`${where}: nincs ilyen stratégiás játék: ${gameId}`);
    } else {
      if (!competition.languages.some(language => game.languages.includes(language))) {
        errors.push(`${where}: a stratégiás játék (${gameId}) a verseny egyik nyelvén sincs meg`);
      }
    }
  }

  return errors;
}
