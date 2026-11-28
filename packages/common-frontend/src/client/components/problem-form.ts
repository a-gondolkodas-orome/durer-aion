import type { Language, Problem, ProblemContent } from 'schemas';
import { LANGUAGES } from 'schemas';

// The problem editor's form: the answer and each language's content as the
// fields hold them, text as typed. The validator on the server decides what
// is valid; the form only refuses an answer that is no whole number, which it
// cannot turn into a problem at all.
//
// The hints (`help1`, `help2`) are not edited: nothing shows them to a team.
// A language's stored ones are kept as they are.

/// The fields the editor shows.
const FIELDS = ['problemText', 'imageUrl'] as const satisfies readonly (keyof ProblemContent)[];

export type ContentForm = Record<typeof FIELDS[number], string>;

export interface ProblemForm {
  answer: string;
  content: Record<Language, ContentForm>;
}

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

/// The problem the form describes, `original` changed by it. An empty image
/// URL is left out, the way a bank leaves out what it has not; a text is kept
/// as typed, since LaTeX is whitespace-sensitive in places. A language with an
/// image but no text is sent with an empty one, for the validator to name. A
/// language left out takes its hints with it.
export function problemFromForm(form: ProblemForm, original: Problem): { problem: Problem } | { answerError: string } {
  const answer = form.answer.trim();
  if (!/^-?\d+$/.test(answer)) return { answerError: 'Egész számot írj ide.' };
  const content = Object.fromEntries(LANGUAGES.filter(language => hasContent(form.content[language])).map((language) => {
    const { problemText, imageUrl } = form.content[language];
    const { help1, help2 } = original.content[language] ?? {};
    return [language, {
      problemText,
      ...(imageUrl.trim() !== '' && { imageUrl: imageUrl.trim() }),
      ...(help1 !== undefined && { help1 }),
      ...(help2 !== undefined && { help2 }),
    }];
  }));
  return { problem: { id: original.id, answer: Number(answer), content } };
}

/// What the save changes, field by field, in the order the editor shows
/// them: the field's name, and its text before and after, '' for none. The
/// hints are among them, which a language left out takes away.
export function problemChanges(before: Problem, after: Problem): { name: string, before: string, after: string }[] {
  const changes: { name: string, before: string, after: string }[] = [];
  if (before.answer !== after.answer) changes.push({ name: 'Válasz', before: String(before.answer), after: String(after.answer) });
  for (const language of LANGUAGES) {
    for (const field of Object.keys(FIELD_NAMES) as (keyof ProblemContent)[]) {
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
