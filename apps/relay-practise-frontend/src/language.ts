import type { i18n } from 'i18next';

// Mirrors language-context.tsx by hand: same `?lang=`, key and order, so one
// stored choice serves both sites on their shared origin. Unlike there, a
// choice is not written into the URL.
const storageKey = 'lang';

type Language = 'hu' | 'en';

// `en-GB` → `en`; null for any other language.
const siteLanguage = (tag: string | null): Language | null => {
  const base = tag?.toLowerCase().split('-')[0];
  return base === 'hu' || base === 'en' ? base : null;
};

// Hungarian if listed anywhere, else English; null for an empty list.
const browserLanguage = (languages: readonly string[]): Language | null => {
  if (languages.length === 0) return null;
  return languages.some(tag => siteLanguage(tag) === 'hu') ? 'hu' : 'en';
};

// Called before the first render; bundled resources make the switch
// synchronous. Not stored: only a choice is.
export const openInPreferredLanguage = (i18next: i18n) =>
  i18next.changeLanguage(
    siteLanguage(new URLSearchParams(window.location.search).get('lang'))
      ?? siteLanguage(localStorage.getItem(storageKey))
      ?? browserLanguage(navigator.languages)
      ?? 'hu'
  );

// Also drops a `?lang=` the page opened with, which would outrank the choice
// on the relay's reloads.
export const rememberChosenLanguage = (lng: string) => {
  const language = siteLanguage(lng);
  if (language === null) return;
  localStorage.setItem(storageKey, language);
  const url = new URL(window.location.href);
  if (!url.searchParams.has('lang')) return;
  url.searchParams.delete('lang');
  window.history.replaceState(window.history.state, '', url);
};
