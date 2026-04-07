import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import Languagedetector from 'i18next-browser-languagedetector';
import enTranslation from '../../public/locales/en/translation.json';
import huTranslation from '../../public/locales/hu/translation.json';


i18next
  .use(Languagedetector)
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
      },
    },
    interpolation: {
      escapeValue: false,
    }
  })

export default i18next;