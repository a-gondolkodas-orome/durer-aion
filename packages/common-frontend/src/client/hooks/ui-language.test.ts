import { competitionLanguage, loginLanguage } from './ui-language';

test('a competition held in one language is played in it, whatever was chosen', () => {
  expect(competitionLanguage(['en'], 'hu')).toBe('en');
  expect(competitionLanguage(['hu'], 'en')).toBe('hu');
});

test('a competition held in both is played in the one chosen', () => {
  expect(competitionLanguage(['hu', 'en'], 'en')).toBe('en');
  expect(competitionLanguage(['en', 'hu'], 'hu')).toBe('hu');
});

test('with no choice, or one that is no language, the competition\'s first language holds', () => {
  expect(competitionLanguage(['en', 'hu'], null)).toBe('en');
  expect(competitionLanguage(['hu', 'en'], 'de')).toBe('hu');
});

test('the login page follows a choice, and is Hungarian without one', () => {
  expect(loginLanguage('en')).toBe('en');
  expect(loginLanguage(null)).toBe('hu');
  expect(loginLanguage('de')).toBe('hu');
});
