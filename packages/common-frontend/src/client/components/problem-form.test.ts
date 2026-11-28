import type { Problem } from 'schemas';
import { problemChanges, problemForm, problemFromForm } from './problem-form';

const problem: Problem = {
  id: '10iqp4vy6b--csomag-kockak', answer: 27,
  content: { hu: { problemText: 'Hány?', imageUrl: 'https://durerinfo.hu/kocka.png', help2: 'Rétegenként.' } },
};

test('gives back the problem it was filled from', () => {
  expect(problemFromForm(problemForm(problem), problem)).toEqual({ problem });
});

test('keeps the hints it does not edit, unless their language is left out', () => {
  const form = problemForm(problem);
  form.content.hu.problemText = 'Hány kocka?';
  expect(problemFromForm(form, problem)).toEqual({
    problem: { ...problem, content: { hu: { ...problem.content.hu, problemText: 'Hány kocka?' } } },
  });
  form.content.hu = { problemText: '', imageUrl: '' };
  form.content.en.problemText = 'How many?';
  expect(problemFromForm(form, problem)).toEqual({ problem: { ...problem, content: { en: { problemText: 'How many?' } } } });
});

test('sends a language with an image but no text, for the validator to name', () => {
  const form = problemForm(problem);
  form.content.en.imageUrl = 'https://durerinfo.hu/cube.png';
  expect(problemFromForm(form, problem)).toEqual({
    problem: { ...problem, content: { ...problem.content, en: { problemText: '', imageUrl: 'https://durerinfo.hu/cube.png' } } },
  });
});

test('refuses an answer that is no whole number', () => {
  expect(problemFromForm({ ...problemForm(problem), answer: '2.5' }, problem)).toEqual({ answerError: 'Egész számot írj ide.' });
});

test('lists the changes field by field, a language added or taken away included', () => {
  const after: Problem = { ...problem, answer: 28, content: { en: { problemText: 'How many?' } } };
  expect(problemChanges(problem, after)).toEqual([
    { name: 'Válasz', before: '27', after: '28' },
    { name: 'Szöveg (LaTeX) (magyar)', before: 'Hány?', after: '' },
    { name: 'Kép címe (magyar)', before: 'https://durerinfo.hu/kocka.png', after: '' },
    { name: 'Második segítség (magyar)', before: 'Rétegenként.', after: '' },
    { name: 'Szöveg (LaTeX) (angol)', before: '', after: 'How many?' },
  ]);
});
