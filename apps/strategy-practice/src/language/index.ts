// The language barrel, reached as `language` (a path alias): the provider that
// owns the chosen language, its hook and the selector. Text itself is
// i18next's, through react-i18next; see i18n.ts.
export { LanguageProvider, useLanguage } from './language-context';
export { LanguageSelector } from './language-selector';
