// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18nextModule from 'i18next';
import { openInPreferredLanguage, rememberChosenLanguage } from './language';

// A fresh instance per test, set up as common-frontend's i18n.ts sets up the
// shared one.
const makeI18n = async () => {
  const i18n = i18nextModule.createInstance();
  await i18n.init({
    supportedLngs: ['en', 'hu'],
    fallbackLng: 'hu',
    load: 'languageOnly',
    resources: { en: { translation: {} }, hu: { translation: {} } },
  });
  return i18n;
};

const open = async (url: string) => {
  window.history.replaceState(null, '', url);
  const i18n = await makeI18n();
  await openInPreferredLanguage(i18n);
  return i18n;
};

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['hu-HU']);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('openInPreferredLanguage', () => {
  // The bug in #219: every load forced Hungarian, so a reload lost English.
  it('opens in the language chosen before a reload', async () => {
    await open('/valto/');
    rememberChosenLanguage('en');

    window.history.replaceState(null, '', '/valto/');
    const after = await open('/valto/');
    expect(after.language).toBe('en');
  });

  it('opens a link in the language it names', async () => {
    localStorage.setItem('lang', 'hu');
    const i18n = await open('/valto/?lang=en');
    expect(i18n.language).toBe('en');
  });

  it('follows the browser without storing what it implied', async () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-GB']);
    const i18n = await open('/valto/');
    expect(i18n.language).toBe('en');
    expect(localStorage.getItem('lang')).toBeNull();
  });

  it('stores nothing when the language is switched in code', async () => {
    const i18n = await open('/valto/');
    await i18n.changeLanguage('en');
    expect(localStorage.getItem('lang')).toBeNull();
    expect(window.location.search).toBe('');
  });
});

describe('rememberChosenLanguage', () => {
  it('stores the choice and leaves the URL alone', () => {
    window.history.replaceState(null, '', '/valto/?x=1');
    rememberChosenLanguage('en');
    expect(localStorage.getItem('lang')).toBe('en');
    expect(window.location.search).toBe('?x=1');
  });

  // Stored even though it is the default: the stored choice outranks the
  // browser, so Hungarian picked in an English browser has to stick.
  it('keeps Hungarian chosen in an English browser', async () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-GB']);
    await open('/valto/');
    rememberChosenLanguage('hu');

    const after = await open('/valto/');
    expect(after.language).toBe('hu');
  });

  it('ignores a language the site does not have', () => {
    rememberChosenLanguage('fr');
    expect(localStorage.getItem('lang')).toBeNull();
  });
});
