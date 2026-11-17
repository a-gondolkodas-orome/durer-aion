import type { ValidationCode, ValidationFinding, ValidationSubject } from "schemas";
import type { Translate } from "./i18n-error";

// A marker, not a translation: it returns the key as written, and its name is
// what lets `npm run i18n:check` see each key below as used.
const t = (key: string) => key;

/** What each validator finding is shown as. */
const VALIDATION_KEYS: Record<ValidationCode, string> = {
  OPENS_AT_INVALID: t("validation.opensAtInvalid"),
  CLOSES_AT_INVALID: t("validation.closesAtInvalid"),
  CLOSES_NOT_AFTER_OPENS: t("validation.closesNotAfterOpens"),
  MALFORMED_ID: t("validation.malformedId"),
  ID_NAMES_BOTH: t("validation.idNamesBoth"),
  ANSWER_NOT_INTEGER: t("validation.answerNotInteger"),
  NO_CONTENT: t("validation.noContent"),
  CONTENT_UNKNOWN_LANGUAGE: t("validation.contentUnknownLanguage"),
  TEXT_EMPTY: t("validation.textEmpty"),
  NO_LANGUAGE: t("validation.noLanguage"),
  UNSUPPORTED_LANGUAGE: t("validation.unsupportedLanguage"),
  LANGUAGE_TWICE: t("validation.languageTwice"),
  ADVANCING_POINTS_NOT_POSITIVE: t("validation.advancingPointsNotPositive"),
  FINISH_MESSAGE_IN_NO_LANGUAGE: t("validation.finishMessageInNoLanguage"),
  FINISH_MESSAGE_UNKNOWN_LANGUAGE: t("validation.finishMessageUnknownLanguage"),
  FINISH_MESSAGE_EMPTY: t("validation.finishMessageEmpty"),
  FINISH_MESSAGE_NOT_IN_LANGUAGES: t("validation.finishMessageNotInLanguages"),
  EDITION_NOT_POSITIVE: t("validation.editionNotPositive"),
  UNKNOWN_ROUND: t("validation.unknownRound"),
  CATEGORY_EMPTY: t("validation.categoryEmpty"),
  LABEL_IN_NO_LANGUAGE: t("validation.labelInNoLanguage"),
  LABEL_UNKNOWN_LANGUAGE: t("validation.labelUnknownLanguage"),
  LABEL_EMPTY: t("validation.labelEmpty"),
  NO_MATCH: t("validation.noMatch"),
  RELAY_DURATION_NOT_POSITIVE: t("validation.relayDurationNotPositive"),
  RELAY_EMPTY: t("validation.relayEmpty"),
  RELAY_PROBLEM_REPEATED: t("validation.relayProblemRepeated"),
  RELAY_POINTS_NOT_POSITIVE: t("validation.relayPointsNotPositive"),
  RELAY_PROBLEM_MISSING: t("validation.relayProblemMissing"),
  RELAY_PROBLEM_NOT_IN_LANGUAGES: t("validation.relayProblemNotInLanguages"),
  STRATEGY_DURATION_NOT_POSITIVE: t("validation.strategyDurationNotPositive"),
  STRATEGY_GAME_UNKNOWN: t("validation.strategyGameUnknown"),
  STRATEGY_GAME_NOT_IN_LANGUAGES: t("validation.strategyGameNotInLanguages"),
};

function subjectText(subject: ValidationSubject, translate: Translate): string {
  if (subject.kind === "problem") return translate(t("validation.subject.problem"), { id: subject.id });
  const { relayProblem } = subject;
  return relayProblem === undefined
    ? translate(t("validation.subject.competition"), { id: subject.id })
    : translate(t("validation.subject.relayProblem"),
      { id: subject.id, position: relayProblem.index + 1, problemId: relayProblem.problemId });
}

/** The finding to show an organiser: what it is about, then what is wrong. */
export function findingMessage({ code, subject, params }: ValidationFinding, translate: Translate): string {
  const text = translate(VALIDATION_KEYS[code], params);
  return subject === undefined ? text : `${subjectText(subject, translate)}: ${text}`;
}
