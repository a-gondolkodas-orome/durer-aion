export const dictionary = {
  disclaimer: {
    start:
      "Az online fordulón a csapatoknak önállóan kell dolgozniuk, más emberektől nem kérhetnek segítséget" +
      " a versenyzési időszak végéig (21:30-ig). A mesterséges intelligencia használata is tilos.",
    progress: "Továbbjutás",
    progressDescription:
      "Azok a csapatok, amelyek az online forduló során a megszerezhető 52 pontból legalább 25 pontot " +
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
  },
  chooser: {
    finish: {
      title: "Vége a versenynek!",
      content: "Köszönjük a részvételeteket, reméljük, hogy tetszett nektek a verseny. Kíváncsiak vagyunk a fordulóval kapcsolatos véleményetekre, így kérjük, <a href=\"https://forms.gle/TQFC1N8vqRe1meyz8\" target=\"_blank\" rel=\"noopener noreferrer\">töltsétek ki ezt az űrlapot</a>. Várhatóan csütörtökig közzétesszük az eredményeket és a továbbjutó csapatok listáját, és erről emailben is fogunk nektek értesítést küldeni.",
      final: "Végső pontszám",
    },
    gameDescriptionHtml: `<p>Ebben a feladatban egy kétszemélyes stratégiás játékot játszhattok, ahol az egyik játékos Ti lesztek, a másik játékos pedig a gép. Győzzétek le a gépet <b>kétszer egymás után</b> ebben a játékban! A kezdő helyzet ismeretében Ti dönthetitek el, hogy a kezdő vagy a második játékos bőrébe szeretnétek bújni.</p>         
    <p>A sikeres teljesítésért az alábbiak szerint kaptok pontot:
      <ul>
        <li>Ha egyszer sem veszítetek, akkor 12 pontot kaptok.</li>
        <li>1, 2, 3, 4, illetve 5 vereség esetén a kapott pontszám 9-re, 6-ra, 4-re, 3-ra, illetve 2-re csökken.</li>
        <li>Ennél több vereség esetén is 2 pontot kaptok, ha sikerül teljesítenetek a játékot.</li>
        <li>Ha 30 perc alatt nem győzitek le kétszer egymás után a gépet, akkor 0 pontot kaptok.</li>
      </ul>
    </p>
    <p>
      Ha készen álltok, kattintsatok a lenti gombra és onnantól kezdve összesen 30 perc áll rendelkezésetekre.
    </p>`,
    relayDescription: "A váltófeladatok rövid szöveges feladatok, melyekre a válasz egy egész szám (legalább 0 és " + 
    "legfeljebb 9999). Minden váltófeladatra maximum 3 tippet adhattok le, egy-egy rossz tipp után az adott " +
    "feladatra megszerezhető pontszám 1-gyel csökken. Helyes tipp vagy három rossz tipp után megkapjátok a " +
    "következő feladatot. A váltófeladatokra összesen 60 perc áll rendelkezésre, és összesen 40 pont szerezhető " +
    "velük hibátlan teljesítés esetén. (Az egyes feladatokra kapható pontszám 3-tól 6-ig terjed.)",
    filledAt: "Kitöltve ekkor",
    achievedPoint: "Elért pont",
    start: "Kezdjük",
    result: "Eredmények",
  },
  relay: {
    endTable: {
      title: "A váltó befejeződött",
      task: "Feladat",
      point: "Pontszám",
      try: "próbálkozás",
      wrong: "Hibás válasz",
      all: "Összpontszám",
      pointsGained: "pontot szereztél",
      back: "Vissza a versenyhez",
    },
    badCategory: "ROSSZ KATEGÓRIA",
    remainingTime: "Hátralevő idő",
    name: "Váltófeladatok",
    guess: "Tipp:",
    send: "Küldés",
  },
  general: {
    task: "feladat",
    point: "pont",
  },
  header: {
    logout: "kilépés",
    subtitle: "Online forduló",
    title: "XVIII. Dürer Verseny",
  },
  login: {
    greeting: "Kedves Versenyző!",
    beforeTitle: "Üdvözlünk a",
    afterTitle: "online fordulójának felületén.",
    loginInstraction: "Belépéshez nézd meg az emailjeidet, és üsd be az ott található "+ process.env.REACT_APP_FEEDBACK_FORM_URL+" kódot ide:",
    fallback: "Ha nem találjátok az emailt, akkor írjatok nekünk a verseny [K] durerinfo [P] hu email címre.",
  },
  waitingRoom: {
    soon: "Az online forduló hamarosan kezdődik!",
    remainingStart: "Még",
    remainingEnd: "van hátra kezdésig!",
    instruction: "A verseny kezdetekor automatikusan átirányításra kerültök a verseny felületre.",
  },
  strategy: {
    notSupported: "NEM TÁMOGATOTT JÁTÉKÁLLAPOT",
    name: "Stratégiás játék",
    endTable: {
      all: "Összpontszám",
      gained: "Szerzett pontok",
      tries: "Próbálkozások száma"
    }
  },
  notFound: {
    message: "Ez az oldal nem található.",
    back: "Vissza a főoldalra", 
  },
  error: {
    unsuspected: "Váratlan hiba történt",
  },
  warnings: {
    timeNotMatch: "A számítógép órája nincs szinkronban a szerver órájával, a jelzett hátralevő idő nem tökéletes, az oldal újra töltése megoldhatja a problémát",
  }
};
