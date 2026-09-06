import React, { createContext, useContext } from 'react';
import type { Language } from '../i18n';

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
}

// Default 'hu' with a no-op setter: a tree with no provider — a spec rendering
// one component on its own — reads the site default rather than crashing.
// eslint-disable-next-line @typescript-eslint/no-empty-function
const LanguageContext = createContext<LanguageContextValue>({ language: 'hu', setLanguage: () => {} });

// Controlled on purpose: where the language *lives* differs per host — practice
// keeps it in the URL and localStorage through react-router, a competition
// frontend will keep it wherever its shell does — and a router must not enter
// this package (practice is on react-router 8, the competition frontends on
// react-router-dom 6; a peer dependency here could not satisfy both). The host
// owns the state; this only hands it down to `useLanguage`/`useTranslation`.
export const LanguageProvider = (
  { language, setLanguage, children }: LanguageContextValue & { children: React.ReactNode }
) => (
  <LanguageContext.Provider value={{ language, setLanguage }}>
    {children}
  </LanguageContext.Provider>
);

export const useLanguage = () => useContext(LanguageContext);
