import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import Languagedetector from 'i18next-browser-languagedetector'

i18next
  .use(initReactI18next)
  .use(Languagedetector)
  .init({
    debug: true,
    fallbackLng: 'en',
    fallbackNS: 'translation',
    resources: {
      en: {
        disclaimer: {
          welcome: 'Dear Team <1>{{tname}}</1>, we welcome you in the online round!',
          category: 'Your category: <1>{{category}}</1>',
          start: 
            "In the online round, teams have to work on their own, they mustn't ask for help from other people" +
            " until the the competition lasts (until 21:30). The usage of artificial intelligence is forbidden too.",
          progress: "Advancing to next rounds",
          progressDescription:
            "The teams who earn at least {{minpoints}} points from the {{maxpoints}} points that can be maximally earned," +
            "will proceed to the regional round. (We" +
            ") ",
          interface: "The interface",
          interfaceDescription:
            "The interface can be filled in using your PCs or phones as well. You can even log in from multiple devices.",
          interfaceDescriptionBHTML:
            "A felület mobilon és gépen is kitölthető. Kérünk bennetek, hogy <b>legfeljebb 1 eszközről</b> töltsétek ki az online fordulót, továbbá <b>ne frissítsétek le az oldalt</b> a verseny során.<br>" +
            "<small>(Ha mégis frissítitek az oldalt, akkor a verseny újraindul (de az eddigi eredményeitek megmaradnak). Ekkor - minél gyorsabban - menjetek vissza ahhoz a feladathoz, ahol jártatok. " +
            "Figyeljetek arra, hogy bár az időzítő újraindul a frissítés után, de így is csak az időben beérkezett válaszokat fogjuk figyelembe venni.)</small>",
          continue: "Continue to the competition",
        }
      },
      hu: {
        disclaimer: {
          welcomme: 'Kedves <1>{{tname}}</1> csapat, üdvözlünk az online fordulón!',
          category: 'Kategóriátok: <1>{{category}}</1>',
          start: 
            "Az online fordulón a csapatoknak önállóan kell dolgozniuk, más emberektől nem kérhetnek segítséget" +
            " a versenyzési időszak végéig (21:30-ig). A mesterséges intelligencia használata is tilos.",
          progress: "Továbbjutás",
          progressDescription:
            "Azok a csapatok, amelyek az online forduló során a megszerezhető {{maxpoints}} pontból legalább {{minpoints}} pontot " +
            "elérnek, továbbjutnak a helyi fordulóba. (Fenntartjuk a jogot, hogy a ponthatárt esetleg csökkentsük, " +
            "növelni biztosan nem fogjuk.) Az online fordulón szerzett pontszám nem számít bele a további eredményekbe.",
          interface: "A felület",
          interfaceDescription:
            "A felület mobilon és gépen is kitölthető, egyszerre akár több eszközzel is bejelentkezhettek.",
          interfaceDescriptionBHTML:
            "A felület mobilon és gépen is kitölthető. Kérünk bennetek, hogy <b>legfeljebb 1 eszközről</b> töltsétek ki az online fordulót, továbbá <b>ne frissítsétek le az oldalt</b> a verseny során.<br>" +
            "<small>(Ha mégis frissítitek az oldalt, akkor a verseny újraindul (de az eddigi eredményeitek megmaradnak). Ekkor - minél gyorsabban - menjetek vissza ahhoz a feladathoz, ahol jártatok. " +
            "Figyeljetek arra, hogy bár az időzítő újraindul a frissítés után, de így is csak az időben beérkezett válaszokat fogjuk figyelembe venni.)</small>",
          continue: "Tovább a versenyhez",
        }
      }
    }
  })

export default i18next;