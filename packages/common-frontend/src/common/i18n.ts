import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from '../../public/locales/en/translation.json';
import huTranslation from '../../public/locales/hu/translation.json';

// Registered before `init`, so the language set there reaches `<html lang>` too,
// not only a later switch. `index.html` carries the value until then.
i18next.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

void i18next
  .use(initReactI18next)
  .init({
    debug: process.env.NODE_ENV === 'development',
    load: 'languageOnly',
    supportedLngs: ['en', 'hu'],
    fallbackLng: 'hu',
    fallbackNS: 'translation',
    defaultNS: 'translation',
    resources: {
      en: {
        translation: enTranslation,
      },
      hu: {
        translation: huTranslation,
      }
    },
    interpolation: {
      escapeValue: false,
    }
  })

export default i18next;
