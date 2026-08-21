// The language barrel, reached as `language` (a path alias). The resolution
// half — the context, `translate` and `useTranslation` — lives in the engine's
// React client (`engine/react`), where a competition frontend gets it too; the
// stateful URL/localStorage provider and the selector are this app's, since
// both ride its router and its chrome.
export { LanguageProvider } from './language-context';
export { LanguageSelector } from './language-selector';
export { useLanguage, useTranslation, translate } from 'engine/react';
export type { I18nString, I18nNode, Language, Translatable, TranslatableNode } from 'engine';
