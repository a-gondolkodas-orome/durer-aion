import { createElement } from 'react';
import { translate, type TranslatableNode } from './translate';

// Games add English game by game, so a value may be a plain string, a fully
// translated pair, or a pair that only has Hungarian yet — and every one of
// those has to render something rather than blanking the UI.
describe('translate', () => {
  it('picks the requested language from a translated pair', () => {
    const texts = { hu: 'Kezdd te', en: 'You start' };

    expect(translate(texts, 'hu')).toBe('Kezdd te');
    expect(translate(texts, 'en')).toBe('You start');
  });

  it('falls back to Hungarian when the English side is missing', () => {
    expect(translate({ hu: 'Csak magyarul' }, 'en')).toBe('Csak magyarul');
  });

  it('falls back to Hungarian when the English side is explicitly undefined', () => {
    expect(translate({ hu: 'Csak magyarul', en: undefined }, 'en')).toBe('Csak magyarul');
  });

  it('returns a plain string unchanged, in either language', () => {
    expect(translate('12', 'hu')).toBe('12');
    expect(translate('12', 'en')).toBe('12');
  });

  it('returns null for a nullish value instead of throwing', () => {
    expect(translate(null, 'hu')).toBeNull();
    expect(translate(undefined, 'en')).toBeNull();
  });

  // An empty English string is a translation someone wrote, not a missing one:
  // `??` keeps it, where `||` would silently show Hungarian instead.
  it('keeps an empty English string rather than falling back', () => {
    expect(translate({ hu: 'Valami', en: '' }, 'en')).toBe('');
  });

  // The rule text of most games is JSX, so the same helper has to carry nodes.
  it('selects between React nodes the same way', () => {
    const hu = createElement('p', null, 'szabály');
    const en = createElement('p', null, 'rule');

    expect(translate({ hu, en }, 'en')).toBe(en);
    expect(translate({ hu, en }, 'hu')).toBe(hu);
    expect(translate({ hu }, 'en')).toBe(hu);
  });

  // isI18nLike keys off `hu` alone, so anything without it is a value to show
  // as it stands — including numbers and arrays a game may hand over.
  it('passes through values that are not translation objects', () => {
    expect(translate(42, 'hu')).toBe(42);
    expect(translate(['a', 'b'], 'hu')).toEqual(['a', 'b']);
  });

  it('passes through an object that has no hungarian side to key off', () => {
    const englishOnly = { en: 'only english' } as unknown as TranslatableNode;

    expect(translate(englishOnly, 'en')).toEqual({ en: 'only english' });
  });
});
