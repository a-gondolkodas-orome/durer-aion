import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

// Every file under src/locales/<language>/<namespace>.json, gathered at build
// time: a new namespace needs its two files and nothing else. The layout is the
// one i18n Ally and `npm run i18n:check` read, see .vscode/settings.json.
const files = import.meta.glob<Record<string, unknown>>(
  '../locales/*/*.json',
  { eager: true, import: 'default' }
);

const resources: Record<string, Record<string, Record<string, unknown>>> = {};
for (const [path, bundle] of Object.entries(files)) {
  const [, language, namespace] = /\/locales\/([^/]+)\/([^/]+)\.json$/.exec(path)!;
  (resources[language] ??= {})[namespace] = bundle;
}

// Synchronous on purpose: the resources are bundled, so the first render can
// already read them, and a spec rendering one component needs no awaiting.
// The language here is only the starting one; `LanguageProvider` owns it.
void i18next
  .use(initReactI18next)
  .init({
    initAsync: false,
    resources,
    lng: 'hu',
    fallbackLng: 'hu',
    supportedLngs: ['hu', 'en'],
    interpolation: { escapeValue: false },
    react: {
      // Lets a translation carry these tags as they are, `<b>…</b>`, with no
      // `components` prop at the call site. Only tags without attributes qualify.
      transKeepBasicHtmlNodesFor: ['br', 'b', 'strong', 'i', 'em', 'p', 'code']
    }
  });

export default i18next;
