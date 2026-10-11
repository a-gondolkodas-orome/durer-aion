import React, { createContext, useContext, useState, useEffect, useLayoutEffect } from 'react';
import { useSearchParams } from 'react-router';
import i18next from './i18n';

export type Language = 'hu' | 'en'

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
}

// Default 'hu' with a no-op setter: a tree with no provider — a spec rendering
// one component on its own — reads the site default rather than crashing.
// eslint-disable-next-line @typescript-eslint/no-empty-function
const LanguageContext = createContext<LanguageContextValue>({ language: 'hu', setLanguage: () => {} });

export const useLanguage = () => useContext(LanguageContext);

// The browser's preference, for a visitor who has not chosen. Hungarian if the
// browser lists it anywhere: the audience is overwhelmingly Hungarian, often with
// an English browser. Otherwise English, which someone reading neither language
// is likelier to manage. An empty list says nothing, and the caller's default holds.
export const browserLanguage = (languages: readonly string[]): Language | null => {
  if (languages.length === 0) return null;
  return languages.some(tag => tag.toLowerCase().split('-')[0] === 'hu') ? 'hu' : 'en';
};

// The language lives in the URL (`?lang=`) and localStorage; this owns it,
// hands it down, and has i18next follow it.
export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [language, setLanguageState] = useState<Language>(
    () => (searchParams.get('lang') ?? localStorage.getItem('lang')
      ?? browserLanguage(navigator.languages) ?? 'hu') as Language
  );

  // When the URL ?lang= param changes (e.g. direct link or back/forward),
  // sync it into state. Ignore navigations that drop the param entirely
  // (those happen on Link clicks and should keep the in-memory language).
  //
  // Unlike the move-scoped and per-key state elsewhere, this is not derivable:
  // the URL is only *one* of two inputs (the other being setLanguage, which
  // writes both state and the URL), and the effect also writes localStorage.
  // Deriving during render would mean choosing a winner between them on every
  // render and doing IO there, so the effect stays and the rule is suppressed
  // here rather than repo-wide. `language` is excluded from the deps on
  // purpose: re-running when it changes would fight the setLanguage path.
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    const langFromUrl = searchParams.get('lang') as Language | null;
    if (langFromUrl !== null && langFromUrl !== language) {
      setLanguageState(langFromUrl);
      localStorage.setItem('lang', langFromUrl);
    }
  }, [searchParams]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  // i18next follows this state rather than owning it. A layout effect runs
  // before the browser paints, so no frame shows the two systems disagreeing.
  useLayoutEffect(() => {
    if (i18next.language !== language) void i18next.changeLanguage(language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    // Stored even when it is the default: a stored choice is what outranks the
    // browser's language, so Hungarian picked in an English browser has to stick.
    localStorage.setItem('lang', lang);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (lang === 'hu') next.delete('lang');
        else next.set('lang', lang);
        return next;
      },
      { replace: true }
    );
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
