import type { i18n } from 'i18next';

// The strategy practice site's convention, language-context.tsx, kept by hand:
// the same `?lang=` parameter, the same localStorage key and the same order.
// The two sites share an origin, so one stored choice serves both. Unlike
// there, a choice is not written back into the URL.
const storageKey = 'lang';

type Language = 'hu' | 'en';

// `en-GB` read as `en`; null for a language the site does not have.
const siteLanguage = (tag: string | null): Language | null => {
  const base = tag?.toLowerCase().split('-')[0];
  return base === 'hu' || base === 'en' ? base : null;
};

// Hungarian if the browser lists it anywhere, else English; an empty list says nothing.
const browserLanguage = (languages: readonly string[]): Language | null => {
  if (languages.length === 0) return null;
  return languages.some(tag => tag.toLowerCase().split('-')[0] === 'hu') ? 'hu' : 'en';
};

// Before the first render: the resources are bundled, so the switch is
// synchronous and no frame shows the old language. Not stored — only a choice
// is, since a stored language outranks the browser's.
export const openInPreferredLanguage = (i18next: i18n) =>
  i18next.changeLanguage(
    siteLanguage(new URLSearchParams(window.location.search).get('lang'))
      ?? siteLanguage(localStorage.getItem(storageKey))
      ?? browserLanguage(navigator.languages)
      ?? 'hu'
  );

// The header dropdown's choice.
export const rememberChosenLanguage = (lng: string) => {
  const language = siteLanguage(lng);
  if (language !== null) localStorage.setItem(storageKey, language);
};
