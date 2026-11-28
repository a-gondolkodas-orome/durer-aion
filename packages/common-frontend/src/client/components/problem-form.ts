import type { Language, Problem, ProblemContent } from 'schemas';
import { LANGUAGES } from 'schemas';

// The problem editor's form: the answer and each language's content as the
// fields hold them, text as typed. The validator on the server decides what
// is valid; the form only refuses an answer that is no whole number, which it
// cannot turn into a problem at all.

export type ContentForm = Record<keyof ProblemContent, string>;

export interface ProblemForm {
  answer: string;
  content: Record<Language, ContentForm>;
}

const FIELDS = ['problemText', 'imageUrl', 'help1', 'help2'] as const satisfies readonly (keyof ProblemContent)[];

export function problemForm(problem: Problem): ProblemForm {
  return {
    answer: String(problem.answer),
    content: Object.fromEntries(LANGUAGES.map(language => [language,
      Object.fromEntries(FIELDS.map(field => [field, problem.content[language]?.[field] ?? '']))])) as
      Record<Language, ContentForm>,
  };
}

/// Whether the form gives the language any content: one with every field
/// empty is left out of the problem, and a team sees another language there.
export function hasContent(form: ContentForm): boolean {
  return FIELDS.some(field => form[field].trim() !== '');
}

/// The problem the form describes, its id `id`. An empty optional field is
/// left out, the way a bank leaves out what it has not; a text is kept as
/// typed, since LaTeX is whitespace-sensitive in places. A language with
/// content but no text is sent with an empty one, for the validator to name.
export function problemFromForm(form: ProblemForm, id: string): { problem: Problem } | { answerError: string } {
  const answer = form.answer.trim();
  if (!/^-?\d+$/.test(answer)) return { answerError: 'Egész számot írj ide.' };
  const content = Object.fromEntries(LANGUAGES.filter(language => hasContent(form.content[language])).map((language) => {
    const { problemText, ...optional } = form.content[language];
    const given = Object.entries(optional).map(([field, value]) => [field, value.trim()]).filter(([, value]) => value !== '');
    return [language, { problemText, ...Object.fromEntries(given) }];
  }));
  return { problem: { id, answer: Number(answer), content } };
}

/// What the save changes, field by field, in the order the editor shows
/// them: the field's name, and its text before and after, '' for none.
export function problemChanges(before: Problem, after: Problem): { name: string, before: string, after: string }[] {
  const changes: { name: string, before: string, after: string }[] = [];
  if (before.answer !== after.answer) changes.push({ name: 'Válasz', before: String(before.answer), after: String(after.answer) });
  for (const language of LANGUAGES) {
    for (const field of FIELDS) {
      const was = before.content[language]?.[field] ?? '';
      const is = after.content[language]?.[field] ?? '';
      if (was !== is) changes.push({ name: `${FIELD_NAMES[field]} (${LANGUAGE_NAMES[language]})`, before: was, after: is });
    }
  }
  return changes;
}

export const LANGUAGE_NAMES: Record<Language, string> = { hu: 'magyar', en: 'angol' };

export const FIELD_NAMES: Record<keyof ProblemContent, string> = {
  problemText: 'Szöveg (LaTeX)',
  imageUrl: 'Kép címe',
  help1: 'Első segítség',
  help2: 'Második segítség',
};
