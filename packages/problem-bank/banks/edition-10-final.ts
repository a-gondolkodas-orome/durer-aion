import type { CompetitionBank, ProblemBank } from '../src/sources';

// Edition 10's final, relay only, as the relay practice site serves it: one
// competition per category, and the problems their relays use, each written
// once. Released, so the practice site may import it.

export const competitions: CompetitionBank = {
  'cuwkeyj1mk--10-final-a': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'xs9ozhmq38--anna-leirta-romai', points: 3 },
        { problemId: 'dj8cw7pzoa--elhataroztam-megmerem-messze', points: 3 },
        { problemId: 'l41j4e4j4f--aladar-elfelejtette-borondjenek', points: 3 },
        { problemId: 't1t6pg23lh--albrecht-durer-gimnazium', points: 3 },
        { problemId: 'wkmg9xwfz9--fos-osztaly-osztalykirandulas', points: 4 },
        { problemId: 'pomc5g1bis--juhasznak-nyaja-vette', points: 4 },
        { problemId: 'z92a6tpv5g--haromjegyu-szam-amelyet', points: 4 },
        { problemId: 'r9v8pt5ex9--negyzetet-lathato-modon', points: 4 },
        { problemId: '7oraqcrsee--sorozat-elso-eleme', points: 5 },
        { problemId: '3x0falmc6r--kovacs-nagypapa-akinek', points: 5 },
        { problemId: 'hspkm5aivi--kocka-oldalara-raragasztottunk', points: 5 },
        { problemId: 'ldwt8aqnz3--szambol-hatfele-paronkenti', points: 5 },
        { problemId: 'keo6c72wdn--haromszoget-hatarolnak-vonalai', points: 6 },
        { problemId: '6ovol79lq3--durer-kreativ-nevkitalalo', points: 6 },
        { problemId: '2dd7cdskeb--balazs-apukaja-gyerekei', points: 6 },
        { problemId: 'panqyu8mxr--albrechtke-teglalap-alaku', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 10, round: 'final', category: 'A' },
  },
  '5r6cvs3584--10-final-b': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'xs9ozhmq38--anna-leirta-romai', points: 3 },
        { problemId: '5iqqy831xh--albrecht-durer-gimnazium', points: 3 },
        { problemId: 'wkmg9xwfz9--fos-osztaly-osztalykirandulas', points: 3 },
        { problemId: 'mjtfwtmkcd--legnagyobb-haromjegyu-szam', points: 3 },
        { problemId: 'ynlss4hyae--albrecht-durer-ujabb', points: 4 },
        { problemId: '7oraqcrsee--sorozat-elso-eleme', points: 4 },
        { problemId: 'ldwt8aqnz3--szambol-hatfele-paronkenti', points: 4 },
        { problemId: '0iby8al18d--kepen-szabalyos-haromszog', points: 4 },
        { problemId: 'v67rorbvwj--jelolje-legkisebb-szamot', points: 5 },
        { problemId: 'fzj4pl7xfu--szabalyos-otszog-oldalara', points: 5 },
        { problemId: '3qnv2i3hyb--kockabol-elevel-parhuzamosan', points: 5 },
        { problemId: 'rq8nvb0o4h--haromszoget-hatarolnak-vonalai', points: 5 },
        { problemId: '3wlybxmqez--durer-kreativ-nevkitalalo', points: 6 },
        { problemId: 'panqyu8mxr--albrechtke-teglalap-alaku', points: 6 },
        { problemId: '42mtsrxy9f--fokos-szoge-konvex', points: 6 },
        { problemId: '5cwqrsdwru--mezojet-szinezhetjuk-tablazatnak', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 10, round: 'final', category: 'B' },
  },
  'p5rdmaw615--10-final-c': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'xs9ozhmq38--anna-leirta-romai', points: 3 },
        { problemId: '8st7vqxv7g--maradek-ketjegyu-szamot', points: 3 },
        { problemId: '4r0iz1eo9y--albrecht-durer-gimnazium', points: 3 },
        { problemId: 'emykbzsxwt--szabalyos-otszog-oldalara', points: 3 },
        { problemId: 'phijaihbdn--kozos-vegallomasukrol-villamos', points: 4 },
        { problemId: 'y9mg16kkcd--homoruszoge-szognek-homoruszognek', points: 4 },
        { problemId: 'obllzm4f7d--szorzat-legnagyobb-erteke', points: 4 },
        { problemId: 'niwpqfzgsj--teglatestet-epiteni-darab', points: 4 },
        { problemId: 'xgkx2k8wi5--kijelolunk-pontot-papirlapon', points: 5 },
        { problemId: 'same1ov1p3--kockabol-elevel-parhuzamosan', points: 5 },
        { problemId: '5cwqrsdwru--mezojet-szinezhetjuk-tablazatnak', points: 5 },
        { problemId: 'qphc30qyou--hangya-setal-pontbol', points: 5 },
        { problemId: '555dx38o0w--haromszog-csucsanal-derekszog', points: 6 },
        { problemId: 'e09jlov20f--legkisebb-oldalu-szabalyos', points: 6 },
        { problemId: 'r31tqhhfcr--legnagyobb-szam-amelyre', points: 6 },
        { problemId: '5i3rzrtoa9--nehany-telepules-egyenes', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 10, round: 'final', category: 'C' },
  },
  '4vmajkiien--10-final-c-plus': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'phijaihbdn--kozos-vegallomasukrol-villamos', points: 3 },
        { problemId: 'y9mg16kkcd--homoruszoge-szognek-homoruszognek', points: 3 },
        { problemId: 'obllzm4f7d--szorzat-legnagyobb-erteke', points: 3 },
        { problemId: 'niwpqfzgsj--teglatestet-epiteni-darab', points: 3 },
        { problemId: 'xgkx2k8wi5--kijelolunk-pontot-papirlapon', points: 4 },
        { problemId: 'yy4eotwuv1--kockabol-elevel-parhuzamosan', points: 4 },
        { problemId: '5cwqrsdwru--mezojet-szinezhetjuk-tablazatnak', points: 4 },
        { problemId: '18sweiiwog--hangya-setal-pontbol', points: 4 },
        { problemId: 'yk0hzbpbos--haromszog-csucsanal-derekszog', points: 5 },
        { problemId: 'x503l9bk5t--legkisebb-oldalu-szabalyos', points: 5 },
        { problemId: 'r31tqhhfcr--legnagyobb-szam-amelyre', points: 5 },
        { problemId: '84tedxzybx--nehany-telepules-egyenes', points: 5 },
        { problemId: 'nnfb5auosq--sakktabla-mezejeben-erme', points: 6 },
        { problemId: 'dhdss204qz--haromszogben-nel-derekszog', points: 6 },
        { problemId: '7sq8iumi8x--szamoknak-nemures-reszhalmazat', points: 6 },
        { problemId: 'zfiiek6474--ulnek-kerek-asztal', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 10, round: 'final', category: 'C+' },
  },
  'wp2hq2fuc1--10-final-d': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'xs9ozhmq38--anna-leirta-romai', points: 3 },
        { problemId: 'sgm4n2buik--auto-kilometeren-ketszer', points: 3 },
        { problemId: '1qytv93cl4--albrecht-durer-gimnazium', points: 3 },
        { problemId: 'ldwt8aqnz3--szambol-hatfele-paronkenti', points: 3 },
        { problemId: 'dwdu63ei2x--durer-kreativ-nevkitalalo', points: 4 },
        { problemId: 'tjm8bpghzp--legnagyobb-szam-melyre', points: 4 },
        { problemId: 'jawkvkfgz5--hangya-setal-pontbol', points: 4 },
        { problemId: 'kn5jp8js9q--egyenes-hasab-alaku', points: 4 },
        { problemId: 'vvua7597oz--haromszog-csucsanal-derekszog', points: 5 },
        { problemId: 'oidekf7b9r--legkisebb-szam-melyre', points: 5 },
        { problemId: 'r31tqhhfcr--legnagyobb-szam-amelyre', points: 5 },
        { problemId: '7cytrjnqmy--sakktablara-pakolunk-kep', points: 5 },
        { problemId: '70jgjgrgpl--tablazat-mezoibe-ketszer', points: 6 },
        { problemId: 'rwhhtijgdd--sakktabla-mezejeben-erme', points: 6 },
        { problemId: 'sh884l4s0k--haromszogben-nel-derekszog', points: 6 },
        { problemId: 'bx6m4x17c1--nehany-ember-sorban', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 10, round: 'final', category: 'D' },
  },
  'jvt4qcgb8i--10-final-d-plus': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'y0wj1ckgki--durer-kreativ-nevkitalalo', points: 3 },
        { problemId: 'tjm8bpghzp--legnagyobb-szam-melyre', points: 3 },
        { problemId: 'h5rq7l1ilg--hangya-setal-pontbol', points: 3 },
        { problemId: 'kn5jp8js9q--egyenes-hasab-alaku', points: 3 },
        { problemId: 'ei92mgrgt5--haromszog-csucsanal-derekszog', points: 4 },
        { problemId: 'oidekf7b9r--legkisebb-szam-melyre', points: 4 },
        { problemId: 'r31tqhhfcr--legnagyobb-szam-amelyre', points: 4 },
        { problemId: 'n3fflaelva--sakktablara-pakolunk-kep', points: 4 },
        { problemId: '70jgjgrgpl--tablazat-mezoibe-ketszer', points: 5 },
        { problemId: 'rwhhtijgdd--sakktabla-mezejeben-erme', points: 5 },
        { problemId: 'sh884l4s0k--haromszogben-nel-derekszog', points: 5 },
        { problemId: '8porbxeajk--nehany-ember-sorban', points: 5 },
        { problemId: '8qipfaoflm--egyenes-folyo-partjan', points: 6 },
        { problemId: 'e43478aju3--valos-szamok-melyekre', points: 6 },
        { problemId: 'yj5r51e1h1--ulnek-kerek-asztal', points: 6 },
        { problemId: '4cp2bq5j3q--feladat', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 10, round: 'final', category: 'D+' },
  },
};

export const problems: ProblemBank = {
  'xs9ozhmq38--anna-leirta-romai': {
    answer: 15,
    content: {
      hu: {
        problemText: "<p>Anna leírta a római számokat 1-től 30-ig növekvő sorrendben. Béla is leírta ugyanezeket a római számokat, de ő ábécé-sorrendben. Hány helyen egyezik meg a két sorrend?</p>",
        help1: "1 és 10 között hány helyen egyezik meg a sorrend?",
        help2: "1 és 10 között 5 helyen egyezik meg a sorrend (1, 2, 3, 4, 10)",
      },
    },
  },
  'dj8cw7pzoa--elhataroztam-megmerem-messze': {
    answer: 3000,
    content: {
      hu: {
        problemText: "<p>Elhatároztam, hogy megmérem, hogy milyen messze lakom az iskolától. Egyenlő lépésekkel mentem reggel, az út első felében kettesével, a második felében azonban hármasával számoltam a lépéseket. 250-nel több kettős lépést számoltam, mint hármasat. Hány lépésre lakom az iskolától?</p>",
        help1: "Hány hármas lépés alatt tudom behozni a plusz 250 kettes lépést?",
        help2: "500 hármas lépés kellett megtennem.",
      },
    },
  },
  'l41j4e4j4f--aladar-elfelejtette-borondjenek': {
    answer: 7456,
    content: {
      hu: {
        problemText: "<p>Aladár elfelejtette a bőröndjének kódját, csak ezekre a számjegyekre emlékszik belőle: \\(\\overline{32x45y}\\). Az még eszébe jutott, hogy a szám osztható volt 72-vel. Mi volt a kód utolsó 4 számjegye?</p>",
        help1: "A szám osztható 8-cal (emiatt a szám utolsó három számjegyéből álló számnak is oszthatónak kell lennie 8-cal).",
        help2: "A szám osztható 9-cel, tehát a számjegyek összegének is oszthatónak kell lennie kilenccel.",
      },
    },
  },
  't1t6pg23lh--albrecht-durer-gimnazium': {
    answer: 9,
    content: {
      hu: {
        problemText: "<p>Az Albrecht Dürer Gimnázium 5.D osztályában a fiúk közül hárman (Bálint, Gábor, Dani), a lányok közül ketten (Zsuzsi és Magdi) szeretik a matekot. Hányféleképpen alakulhat meg az osztály Dürer-csapata, ha a csapatnak három matekot szerető diákból kell állnia és kell, hogy legyen benne legalább egy lány (más megkötés nincs és a csapaton belüli sorrend nem számít)?</p>",
        help1: "Bonts szét esetekre, a lányok száma szerint.",
        help2: "Ha egy lány van, akkor az vagy Zsuzsi, vagy Magdi (2 lehetőség). És ekkor 1 fiú marad ki (ez 3 lehetőség). Megmaradt még az az eset, amikor 2 lány van a csapatban.",
      },
    },
  },
  'wkmg9xwfz9--fos-osztaly-osztalykirandulas': {
    answer: 1,
    content: {
      hu: {
        problemText: "<p>Egy 30 fős osztály az osztálykirándulás alkalmával elment palacsintázni. Mindenki legalább egy palacsintát rendelt az alábbi háromféle közül: kakaós, lekváros és túrós. 14-en kértek túrósat, 15-en kakaósat és 9-en lekvárosat. Pontosan kétféle palacsintát 6 diák evett. Hányan ettek mindhárom fajta palacsintából?</p>",
        help1: "Ábrázold a lehetőségeket halmazokkal.",
        help2: "Vizsgáld meg a lehetőségeket. Mi a helyzet, ha 0, 1, 2, ... diák evett mindhárom palacsintából?",
      },
    },
  },
  'pomc5g1bis--juhasznak-nyaja-vette': {
    answer: 59,
    content: {
      hu: {
        problemText: "<p>Egy juhásznak van egy nyája. Azt vette észre, hogy ha hatosával állítja sorokba őket, akkor 5, ha ötösével, akkor 4, ha négyesével, akkor 3, ha hármasával, akkor 2 bárány marad ki. Adjátok meg azt a legkisebb számot, ahány báránya lehet a juhásznak.</p>",
        help1: "Mi lenne, ha a juhász kölcsönkérne egy bárányt?",
        help2: "Keress minél kisebb olyan számot, ami osztható 6, 5, 4, 3 számok mindegyikével.",
      },
    },
  },
  'z92a6tpv5g--haromjegyu-szam-amelyet': {
    answer: 105,
    content: {
      hu: {
        problemText: "<p>Melyik az a háromjegyű szám, amelyet számjegyei összegével akár növelünk, akár csökkentünk, csupa azonos számjegyből álló számot kapunk?</p>",
        help1: "A növelt és csökkentett számok egyike nem háromjegyű",
        help2: "A csökkentett szám a 99.",
      },
    },
  },
  'r9v8pt5ex9--negyzetet-lathato-modon': {
    answer: 64,
    content: {
      hu: {
        problemText: "<p>Egy négyzetet az ábrán látható módon feldaraboltunk: minden egyenes vagy a nagy négyzet oldalaival, vagy annak átlóival párhuzamos. Hány négyzetcentiméter a nagy négyzet területe, ha a fekete színűé 8 cm<sup>2</sup>?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_A_8.png",
        help1: "A nagy négyzetet az átlói 4 egyenlő területű háromszögre bontják.",
        help2: "A fekete négyzetet ketté tudjuk vágni, hogy a darabokból kirakjuk az alsó háromszöget.",
      },
    },
  },
  '7oraqcrsee--sorozat-elso-eleme': {
    answer: 6,
    content: {
      hu: {
        problemText: "<p>Egy sorozat első eleme 76 és minden további elemet a következő szabály szerint kapunk: ha az utolsó tag páros volt, akkor azt elosztjuk kettővel, ha pedig páratlan, akkor megszorozzuk öttel és hozzáadunk egyet. Mi az így kapott sorozat 2017. eleme?</p>",
        help1: "Hogyan kezdődik a sorozat? Írd fel az első néhány elemét.",
        help2: "A sorozat tagjai ismétlődni fognak.",
      },
    },
  },
  '3x0falmc6r--kovacs-nagypapa-akinek': {
    answer: 64,
    content: {
      hu: {
        problemText: "<p>Kovács nagypapa, akinek életkora 50 és 70 esztendő közé esik, a következőt mesélte barátainak: <i>„Mindegyik gyerekemnek annyi gyereke van, mint ahány testvére; gyermekeim és unokáim száma pedig együttvéve annyi, mint életéveimnek száma.”</i> Hány éves a nagypapa?</p>",
        help1: "Ha x gyereke van a nagypapának, akkor hány unokája van?",
        help2: "Az unokák száma x*x lesz.",
      },
    },
  },
  'hspkm5aivi--kocka-oldalara-raragasztottunk': {
    answer: 30,
    content: {
      hu: {
        problemText: "<p>Egy kocka minden oldalára ráragasztottunk egy ugyanakkora kockát. Mekkora az így létrejött test felszíne négyzetdeciméterben, ha a térfogata 7 dm<sup>3</sup>?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_A_11.png",
        help1: "Mekkora egy kocka térfogata?",
        help2: "Egy kocka hozzáragasztása mennyivel növeli meg a felszínt?",
      },
    },
  },
  'ldwt8aqnz3--szambol-hatfele-paronkenti': {
    answer: 24,
    content: {
      hu: {
        problemText: "<p>Négy egész számból mind a hatféle páronkénti szorzatot kiszámítottuk. A hat szorzat közül ötnek az értéke: 20, 30, 40, 50, 60. Mennyi a hatodik szorzat értéke?</p>",
        help1: "3 párba rendezhetjük a számokat úgy, hogy azok szorzata azonos legyen.",
        help2: "A hatodik szorzat a második legkisebb",
      },
    },
  },
  'keo6c72wdn--haromszoget-hatarolnak-vonalai': {
    answer: 35,
    content: {
      hu: {
        problemText: "<p>Hány háromszöget határolnak az ábra vonalai?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_A_13.png",
        help1: "Hány olyan háromszög van, amelynek pontosan egy oldala egyezik meg az ötszögével?",
        help2: "Egy külső oldalhoz 3 különböző háromszöget rajzolhatunk. Ezenkívül milyen típusú háromszögek lehetnek? (külső csúcsok száma szerint)",
      },
    },
  },
  '6ovol79lq3--durer-kreativ-nevkitalalo': {
    answer: 3,
    content: {
      hu: {
        problemText: "<p>Az ábrán a Dürer Kreatív Névkitaláló Kft. irodájának alaprajza látható. A pontok oszlopokat jelölnek, melyek segítségével 16 egyforma négyzet alakú mezőre fel lehet osztani az irodát. Minden ilyen mezőben egy ember dolgozik. Néhány szomszédos oszlop közé kelet-nyugati vagy észak-déli irányú falakat is építettek, bár ezeket (az iroda külső falán kívül) az ábrán nem jelöltük. Egy mezőn ülő ember északi, déli, nyugati, illetve keleti irányban látja az összes kollégáját, kivéve ha valahol falat építettek kettőjük közé. Néhány mezőre rá is írtuk, hogy az ott ülő hány munkatársát látja. Milyen számot írhattunk a kérdőjeles mezőre?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_A_14.png",
        help1: "A 6-os mező oszlopában és sorában nem lehetnek falak.",
        help2: "A baloldali oszlop két 4-ese közt sem lehetnek falak. Érdemes egyesével megnézni a mezőket, hogy hol vannak/nincsenek falak.",
      },
    },
  },
  '2dd7cdskeb--balazs-apukaja-gyerekei': {
    answer: 2304,
    content: {
      hu: {
        problemText: "<p>Balázs apukája a gyerekei kérésére a kertben a téglalap alakú homokozót négyzet alakúra építi át. A homokozó eredeti oldalainak mérete: 3,6 m és 4,8 m. Apukájuk úgy alakítja át négyzetté, hogy az egyik oldalát kétszer annyival változtatja meg, mint a másikat. Az így létrehozhatóak közül a legrövidebb oldalú négyzetet választotta.</p><p>Hány köbdeciméter homokot kell hozatnia, ha 40 cm mélységű homokréteget szeretne, és a régi homokot mind lecserélik?</p>",
        help1: "Növelni és csökkenteni is lehet az oldalhosszakat.",
        help2: "Ha csökkentjük, akkor 1.2, ill. 2.4 m-rel kell csökkentenünk, hogy négyzetet kapjunk.",
      },
    },
  },
  'panqyu8mxr--albrechtke-teglalap-alaku': {
    answer: 170,
    content: {
      hu: {
        problemText: "<p>Albrechtke téglalap alakú szobáját \\(68\\cdot119 = 8092\\) négyzetalakú járólappal fedték le. Albrechtke megrajzolta a padlón a szobája egyik átlóját. Hány járólapon megy keresztül ez a vonal, ha azok a járólapok nem számítanak, amelyek csak egy pontban érintkeznek vele?</p>",
        help1: "Először elég egy 4×7-es téglalapot megvizsgálni.",
        help2: "Hány függőleges, hány vízszintes járólap oldalon megy át az átló?",
      },
    },
  },
  '5iqqy831xh--albrecht-durer-gimnazium': {
    answer: 19,
    content: {
      hu: {
        problemText: "<p>Az Albrecht Dürer Gimnázium 7.D osztályában a fiúk közül hárman (Bálint, Gábor és Dani), és a lányok közül is hárman (Zsuzsi, Ildi és Magdi) szeretik a matekot. Hányféleképpen alakulhat meg az osztály Dürer-csapata, ha a csapatnak három matekot szerető diákból kell állnia és kell, hogy legyen benne legalább egy lány?<br><i>Más megkötés nincs, és a csapaton belüli sorrend nem számít</i></p>",
        help1: "Bonts szét esetekre, a lányok száma szerint.",
        help2: "Ha egy lány van, akkor az vagy Zsuzsi, vagy Magdi (3 lehetőség). És ekkor 1 fiú marad ki (ez 3 lehetőség). Még két eset marad: ha 2 vagy 3 lány lehet.",
      },
    },
  },
  'mjtfwtmkcd--legnagyobb-haromjegyu-szam': {
    answer: 105,
    content: {
      hu: {
        problemText: "<p>Melyik az a legnagyobb háromjegyű szám, amelyet számjegyei összegével akár növelünk, akár csökkentünk, csupa azonos számjegyből álló számot kapunk?</p>",
        help1: "A növelt és csökkentett számok egyike nem háromjegyű",
        help2: "A csökkentett szám a 99.",
      },
    },
  },
  'ynlss4hyae--albrecht-durer-ujabb': {
    answer: 28,
    content: {
      hu: {
        problemText: "<p>Albrecht Dürer újabb üvegablakot tervez a nürnbergi Lorenzkirche számára. Az ábrán látható a tervrajz, melyen minden kis négyzet egységnyi területű (tehát az egész ablaktábla éppen 100 egységnyi területű). Hány egységnyi a szürke rész területe?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_B_5.png",
        help1: "A részek területét külön határozzuk meg, érdemes téglalapokba írni őket.",
        help2: "A külső rész területe köré egy 2×4-es téglalap írható. A leeső részeket ki tudjuk számolni.",
      },
    },
  },
  '0iby8al18d--kepen-szabalyos-haromszog': {
    answer: 42,
    content: {
      hu: {
        problemText: "<p>A képen egy szabályos háromszög, egy szabályos hétszög és egy szürke szabályos sokszög találkozik. Hány oldalú a szürke szabályos sokszög?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_B_8.png",
        help1: "Egy hétszög belső szöge 5/7*180, egy háromszögé 1/3*180.",
        help2: "A keresett sokszög külső szöge 1/21*180 fok.",
      },
    },
  },
  'v67rorbvwj--jelolje-legkisebb-szamot': {
    answer: 14,
    content: {
      hu: {
        problemText: "<p>Jelölje \\(P\\) a legkisebb számot, amelyhez van négy különböző pozitív egész szám, amelyek szorzata 162 és összege \\(P\\). Hasonlóan jelölje \\(Q\\) a legnagyobb számot, amelyhez van 4 különböző pozitív egész szám, amelyek szorzata 162 és összege \\(Q\\). Mennyi \\(Q - P\\)?</p>",
        help1: "Mindkét négyesben szerepel az 1 és a 3.",
        help2: "P=1+3+6+9",
      },
    },
  },
  'fzj4pl7xfu--szabalyos-otszog-oldalara': {
    answer: 111,
    content: {
      hu: {
        problemText: "<p>Az \\(ABCDE\\) szabályos ötszög \\(DE\\) oldalára kifelé megszerkesztettük az \\(EDX\\) szabályos háromszöget. Valamint a \\(BC\\) oldalára kifelé megszerkesztettük a \\(CBPQ\\) négyzetet. Hány fokos a \\(PAX\\) szög?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_B_10.png",
        help1: "Keress egyenlőszárú háromszögeket.",
        help2: "Az EAX és a PAB háromszögek egyenlőszárúak.",
      },
    },
  },
  '3qnv2i3hyb--kockabol-elevel-parhuzamosan': {
    answer: 288,
    content: {
      hu: {
        problemText: "<p>Egy kockából minden élével párhuzamosan kivágtunk egy-egy négyzet alapú hasábot az ábrán látható módon. A hasáb alapjának (a négyzetnek) oldalhossza harmada a\r kocka élhosszának. Mekkora az így kapott test felszíne dm<sup>2</sup>-ben, ha a térfogata 160 dm<sup>3</sup>?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_B_11.png",
        help1: "Egy 3×3×3-as kockából vettünk ki 7 kiskockát. Milyen hosszú egy kiskocka éle?",
        help2: "Mennyivel növeli a felszínt egy lapközép kiskocka kivétele?",
      },
    },
  },
  'rq8nvb0o4h--haromszoget-hatarolnak-vonalai': {
    answer: 35,
    content: {
      hu: {
        problemText: "<p>Hány háromszöget határolnak az ábra vonalai?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_B_12.png",
        help1: "Hány olyan háromszög van, amelynek pontosan egy oldala egyezik meg az ötszögével?",
        help2: "Egy külső oldalhoz 3 különböző háromszöget rajzolhatunk. Ezenkívül milyen típusú háromszögek lehetnek? (külső csúcsok száma szerint)",
      },
    },
  },
  '3wlybxmqez--durer-kreativ-nevkitalalo': {
    answer: 3,
    content: {
      hu: {
        problemText: "<p>Az ábrán a Dürer Kreatív Névkitaláló Kft. irodájának alaprajza látható. A pontok oszlopokat jelölnek, melyek segítségével 16 egyforma négyzet alakú mezőre fel lehet osztani az irodát. Minden ilyen mezőben egy ember dolgozik. Néhány szomszédos oszlop közé kelet-nyugati vagy észak-déli irányú falakat is építettek, bár ezeket (az iroda külső falán kívül) az ábrán nem jelöltük. Egy mezőn ülő ember északi, déli, nyugati, illetve keleti irányban látja az összes kollégáját, kivéve ha valahol falat építettek kettőjük közé. Néhány mezőre rá is írtuk, hogy az ott ülő hány munkatársát látja. Milyen számot írhattunk a kérdőjeles mezőre?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_B_13.png",
        help1: "A 6-os mező oszlopában és sorában nem lehetnek falak.",
        help2: "A baloldali oszlop két 4-ese közt sem lehetnek falak. Érdemes egyesével megnézni a mezőket, hogy hol vannak/nincsenek falak.",
      },
    },
  },
  '42mtsrxy9f--fokos-szoge-konvex': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>Legfeljebb hány 150 fokos szöge lehet egy konvex 2017-szögnek?</p>",
        help1: "Egy konvex sokszög külső szögeinek összege 360 fok.",
        help2: "Egy 150 fokos szöghöz tartozó külső szög 30 fok. Ne felejtsd el, hogy a nem 150 fokos szögeknek is van külső szöge.",
      },
    },
  },
  '5cwqrsdwru--mezojet-szinezhetjuk-tablazatnak': {
    answer: 21,
    content: {
      hu: {
        problemText: "<p>Legfeljebb hány mezőjét színezhetjük be egy \\(7\\times7\\)-es táblázatnak, ha azt szeretnénk, hogy ne legyen négy olyan mező beszínezve, melyek középpontjai a táblázat oldalaival párhuzamos oldalú téglalapot alkotnak?</p>",
        help1: "Ha 5 mező van beszínezve egy sorban, akkor legfeljebb hány mezőt színezhetünk be? És, ha 4?",
        help2: "Az optimális konstrukcióban minden sorból ugyanannyit választunk ki.",
      },
    },
  },
  '8st7vqxv7g--maradek-ketjegyu-szamot': {
    answer: 15,
    content: {
      hu: {
        problemText: "<p>Mennyi lehet legfeljebb a maradék, ha egy kétjegyű számot elosztunk számjegyei összegével?</p>",
        help1: "A számjegyek összege legfeljebb 18 lehet.",
        help2: "Vizsgáld meg azokat a kétjegyű számokat, amelyek számjegyösszege nagy (pl.: 98, 97, 89, 88, 79, ...).",
      },
    },
  },
  '4r0iz1eo9y--albrecht-durer-gimnazium': {
    answer: 52,
    content: {
      hu: {
        problemText: "<p>Az Albrecht Dürer Gimnázium 9.c osztályában a fiúk és a lányok közül négyen-négyen szeretik a matekot. Hányféleképpen alakulhat meg az osztály Dürer-csapata, ha a csapatnak három matekot szerető diákból kell állnia és kell legyen benne legalább egy lány?<br><i>Más megkötés nincs és a csapaton belüli sorrend nem számít.</i></p>",
        help1: "Bonts szét esetekre, a lányok száma szerint.",
        help2: "Ha 1 lány van, akkor őt négyféleképpen választhatjuk ki (4 lehetőség). A fiúk közül pedig 4×3/2 féleképpen választhatjuk ki (ez 6 lehetőség). Megmaradt még az a két eset, amikor 2, ill. 3 lány van a csapatban.",
      },
    },
  },
  'emykbzsxwt--szabalyos-otszog-oldalara': {
    answer: 111,
    content: {
      hu: {
        problemText: "<p>Az \\(ABCDE\\) szabályos ötszög \\(DE\\) oldalára kifelé megszerkesztettük az \\(EDX\\) szabályos háromszöget. Valamint a \\(BC\\) oldalára kifelé megszerkesztettük a \\(CBPQ\\) négyzetet. Hány fokos a \\(PAX\\) szög?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_C_4.png",
        help1: "Keress egyenlőszárú háromszögeket.",
        help2: "Az EAX és a PAB háromszögek egyenlőszárúak.",
      },
    },
  },
  'phijaihbdn--kozos-vegallomasukrol-villamos': {
    answer: 180,
    content: {
      hu: {
        problemText: "<p>Közös végállomásukról az 1-es villamos 6 percenként, a 2-es villamos 10 percenként, a 3-as villamos 15 percenként indul. Átlagosan hány másodpercenként indul villamos a végállomásról?</p>",
        help1: "Egy óra alatt hány villamos indul a végállomásról?",
        help2: "Egy óra alatt 10-szer indul az 1-es, 6-szor indul a 2-es és 4-szer indul a 3-as villamos.",
      },
    },
  },
  'y9mg16kkcd--homoruszoge-szognek-homoruszognek': {
    answer: 1468,
    content: {
      hu: {
        problemText: "<p>Hány homorúszöge lehet legfeljebb egy 1471-szögnek? (homorúszögnek nevezzük a 180 foknál nagyobb szöget)</p>",
        help1: "A helyes válasz nagyobb, mint 1400.",
        help2: "Az optimális konstrukció egy háromszög módosításával megkapható.",
      },
    },
  },
  'obllzm4f7d--szorzat-legnagyobb-erteke': {
    answer: 32,
    content: {
      hu: {
        problemText: "<p>Mennyi az \\(ab\\) szorzat lehetséges legnagyobb értéke, ha \\(a\\) és \\(b\\) pozitív egész számok és \\(\\frac2a+\\frac3b=1\\)?</p>",
        help1: "Szorozd be ab-vel, majd rendezd egy oldalra.",
        help2: "Ha 6-ot hozzáadsz, akkor szorzattá is alakíthatod a kifejezést.",
      },
    },
  },
  'niwpqfzgsj--teglatestet-epiteni-darab': {
    answer: 10,
    content: {
      hu: {
        problemText: "<p>Hányféle téglatestet lehet építeni 20 darab \\(3\\times1\\times1\\)-es téglatestből?<br><i>Két téglatest különböző, ha oldalhosszai mások, és az nem számít, hogy hogyan építjük össze a kis téglatestekből.</i></p>",
        help1: "Hány olyan téglatest van, amelynek 60 a térfogata?",
        help2: "Sorold fel a téglatesteket (pl.: 1, 1, 60 oldalú legyen az első). Minden 60 egység térfogatú téglatest kirakható ezekből az elemekből.",
      },
    },
  },
  'xgkx2k8wi5--kijelolunk-pontot-papirlapon': {
    answer: 29,
    content: {
      hu: {
        problemText: "<p>Kijelölünk 10 pontot egy papírlapon. Ezután egy lépésben össze kell kötnünk két pontot egy görbe vonallal, és rajzolnunk kell egy új pontot a vonalra. Két szabály van: egy pontból legfeljebb három vonal indulhat és két vonal nem metszheti egymást. Legfeljebb hány lépésünk lehet?</p>",
        help1: "2 pont esetén hány lépésünk lehet?",
        help2: "2 pont esetén 5 lépést tudunk tenni, de ekkor még marad egy pont, amelyből csak 2 vonal indul ki.",
      },
    },
  },
  'same1ov1p3--kockabol-elevel-parhuzamosan': {
    answer: 288,
    content: {
      hu: {
        problemText: "<p>Egy kockából minden élével párhuzamosan kivágtunk egy-egy négyzet alapú hasábot az ábrán látható módon. A hasáb alapjának (a négyzetnek) oldalhossza harmada a kocka élhosszának. Mekkora az így kapott test felszíne dm<sup>2</sup>-ben, ha a térfogata 160 dm<sup>3</sup>?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_C_10.png",
        help1: "Egy 3×3×3-as kockából vettünk ki 7 kiskockát. Milyen hosszú egy kiskocka éle?",
        help2: "Mennyivel növeli a felszínt egy lapközép kiskocka kivétele?",
      },
    },
  },
  'qphc30qyou--hangya-setal-pontbol': {
    answer: 94,
    content: {
      hu: {
        problemText: "<p>Egy hangya sétál az ábrán. Az 1-es pontból indul, és mindig csak a nyílnak megfelelő irányban halad. Bármelyik vonalon 1 percig tart végigmennie. Ha egy pontba érkezik, és ezelőtt páratlan számú alkalommal járt itt, akkor egyenesen továbbmegy az eggyel nagyobb sorszámú pontba. Ellenben, ha ezelőtt páros számú alkalommal járt itt, akkor visszamegy az 1-es pontba. Kivétel ez alól az 1-es pont, ahonnan mindig továbbmegy a 2-esbe, és a 7-es pont, ahol befejezi a sétáját. Hány percig sétál a hangya?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_C_12.png",
        help1: "Hogyan indul a sétája? Hogyan néz ki az első 10 lépés?",
        help2: "Hány perc alatt jut el a 2, 3, 4 mezőkre? Észreveszel valamilyen szabályosságot?",
      },
    },
  },
  '555dx38o0w--haromszog-csucsanal-derekszog': {
    answer: 338,
    content: {
      hu: {
        problemText: "<p>Az \\(ABC\\) háromszög \\(C\\) csúcsánál derékszög van. Állítsunk egy \\(BADE\\) négyzetet az átfogóra. Messe a \\(C\\) csúcsnál lévő szögfelező \\(BA\\)-t \\(F\\)-ben és \\(ED\\)-t \\(G\\)-ben. Ha \\(CA=24\\) és \\(CB=10\\), mennyi az \\(ADGF\\) négyszög területe?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_C_13.png",
        help1: "Egészítsd ki az ábrát.",
        help2: "A derékszögű háromszöget a négyzet oldalaira másolva egy nagyobb négyzetet kapsz. Ezt a négyzetet hol metszi a szögfelező?",
      },
    },
  },
  'e09jlov20f--legkisebb-oldalu-szabalyos': {
    answer: 12,
    content: {
      hu: {
        problemText: "<p>Melyik a legkisebb \\(n\\), hogy egy \\(n\\) cm oldalú szabályos háromszög kirakható az alábbi alakzat néhány példányából? Az alakzat kis háromszögeinek oldala 1 cm.</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_C_14.png",
        help1: "Hány kis háromszögből áll egy n cm oldalú háromszög?",
        help2: "A 6 oldalú háromszög nem rakható ki ezekből az idomokból.",
      },
    },
  },
  'r31tqhhfcr--legnagyobb-szam-amelyre': {
    answer: 8,
    content: {
      hu: {
        problemText: "<p>Melyik az a legnagyobb \\(n\\) egész szám, amelyre igaz, hogy egy szabályos \\(n\\)-szög csúcsait ki lehet színezni pirosra és kékre úgy, hogy ne legyen olyan egyenlő szárú háromszög, amelynek mindhárom csúcsa ugyanolyan színű?</p>",
        help1: "Pl. egy hétszögben lennie kell egyszínű (pl. piros) oldal. Az ezzel szomszédos csúcsoknak kéknek kell lenni. Ekkor viszont biztosan lesz egyszínű egyenlőszárú háromszög.",
        help2: "Egy szabályos 16-szögben biztosan lesz egyenlőszárú háromszög.",
      },
    },
  },
  '5i3rzrtoa9--nehany-telepules-egyenes': {
    answer: 210,
    content: {
      hu: {
        problemText: "<p>Néhány település van egy egyenes folyó két partján. Az egyik oldalon 7 település van sorban a parton, míg a másik oldalon 5. Szeretnénk egyenes hidakat építeni, melyek egy-egy települést kötnek össze a két partról. A hidak nem kereszteződhetnek, és el kell tudnunk jutni bármelyik településből bármelyik másikba csak ezen hidak segítségével. A települések között csak hidakon közlekedhetünk. Hányféle elrendezésben építhetjük meg a hidakat?</p>",
        help1: "Kisebb számokra vizsgáld meg a feladat (2-2, 2-3, 3-3 város). Felfedezel valamilyen szabályszerűséget?",
        help2: "A két felső város között mindenképpen kell hidat építeni. Ezt a hidat elkezdhetjük lefelé mozgatni. Így a hidak végpontjai végigvándorolnak a városokon. A 10 város közül mikor kerülnek sorra balparti városok? Elő tudjuk ezt írni?",
      },
    },
  },
  'yy4eotwuv1--kockabol-elevel-parhuzamosan': {
    answer: 288,
    content: {
      hu: {
        problemText: "<p>Egy kockából minden élével párhuzamosan kivágtunk egy-egy négyzet alapú hasábot az ábrán látható módon. A hasáb alapjának (a négyzetnek) oldalhossza harmada a kocka élhosszának. Mekkora az így kapott test felszíne dm<sup>2</sup>-ben, ha a térfogata 160 dm<sup>3</sup>?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_Cp_6.png",
        help1: "Egy 3×3×3-as kockából vettünk ki 7 kiskockát. Milyen hosszú egy kiskocka éle?",
        help2: "Mennyivel növeli a felszínt egy lapközép kiskocka kivétele?",
      },
    },
  },
  '18sweiiwog--hangya-setal-pontbol': {
    answer: 94,
    content: {
      hu: {
        problemText: "<p>Egy hangya sétál az ábrán. Az 1-es pontból indul, és mindig csak a nyílnak megfelelő irányban halad. Bármelyik vonalon 1 percig tart végigmennie. Ha egy pontba érkezik, és ezelőtt páratlan számú alkalommal járt itt, akkor egyenesen továbbmegy az eggyel nagyobb sorszámú pontba. Ellenben, ha ezelőtt páros számú alkalommal járt itt, akkor visszamegy az 1-es pontba. Kivétel ez alól az 1-es pont, ahonnan mindig továbbmegy a 2-esbe, és a 7-es pont, ahol befejezi a sétáját. Hány percig sétál a hangya?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_Cp_8.png",
        help1: "Hogyan indul a sétája? Hogyan néz ki az első 10 lépés?",
        help2: "Hány perc alatt jut el a 2, 3, 4 mezőkre? Észreveszel valamilyen szabályosságot?",
      },
    },
  },
  'yk0hzbpbos--haromszog-csucsanal-derekszog': {
    answer: 338,
    content: {
      hu: {
        problemText: "<p>Az \\(ABC\\) háromszög \\(C\\) csúcsánál derékszög van. Állítsunk egy \\(BADE\\) négyzetet az átfogóra. Messe a \\(C\\) csúcsnál lévő szögfelező \\(BA\\)-t \\(F\\)-ben és \\(ED\\)-t \\(G\\)-ben. Ha \\(CA=24\\) és \\(CB=10\\), mennyi az \\(ADGF\\) négyszög területe?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_Cp_9.png",
        help1: "Egészítsd ki az ábrát.",
        help2: "A derékszögű háromszöget a négyzet oldalaira másolva egy nagyobb négyzetet kapsz. Ezt a négyzetet hol metszi a szögfelező?",
      },
    },
  },
  'x503l9bk5t--legkisebb-oldalu-szabalyos': {
    answer: 12,
    content: {
      hu: {
        problemText: "<p>Melyik a legkisebb \\(n\\), hogy egy \\(n\\) cm oldalú szabályos háromszög kirakható az alábbi alakzat néhány példányából? Az alakzat kis háromszögeinek oldala 1 cm.</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_Cp_10.png",
        help1: "Hány kis háromszögből áll egy n cm oldalú háromszög?",
        help2: "A 6 oldalú háromszög nem rakható ki ezekből az idomokból.",
      },
    },
  },
  '84tedxzybx--nehany-telepules-egyenes': {
    answer: 210,
    content: {
      hu: {
        problemText: "<p>Néhány település van egy egyenes folyó két partján. Az egyik oldalon 7 település van sorban a parton, míg a másik oldalon 5. Szeretnénk egyenes hidakat építeni, melyek egy-egy települést kötnek össze a két partról. A hidak nem kereszteződhetnek, és el kell tudnunk jutni bármelyik településből bármelyik másikba csak ezen hidak segítségével. A települések között csak hidakon közlekedhetünk. Hányféle elrendezésben építhetjük meg a hidakat?</p>",
        help1: "Kisebb számokra vizsgáld meg a feladatot (2-2, 2-3, 3-3 város). Felfedezel valamilyen szabályszerűséget?",
        help2: "A két felső város között mindenképpen kell hidat építeni. Ezt a hidat elkezdhetjük lefelé mozgatni. Így a hidak végpontjai végigvándorolnak a városokon. A 10 város közül mikor kerülnek sorra balparti városok? Elő tudjuk ezt írni?",
      },
    },
  },
  'nnfb5auosq--sakktabla-mezejeben-erme': {
    answer: 576,
    content: {
      hu: {
        problemText: "<p>Egy \\(99\\times99\\)-es sakktábla minden mezejében van egy érme, kezdetben írással felfelé. Egy lépésben kiválaszthatunk egy sorban vagy egy oszlopban négy egymás melletti mezőt, majd az azokon lévő négy érmét megfordítjuk. Hány olyan mező van, melyre elérhető véges sok lépésen belül, hogy csak azon az egy mezőn legyen írás, az összes többin fej?</p>",
        help1: "Színezéses indoklással találd meg, hogy mely mezők lehetnek elhagyhatók.",
        help2: "Két irányból is csinálj színezést, mik hagyhatók el mindkettő szerint? Keress konstrukciót.",
      },
    },
  },
  'dhdss204qz--haromszogben-nel-derekszog': {
    answer: 80,
    content: {
      hu: {
        problemText: "<p>Az \\(ABC\\) háromszögben \\(C\\)-nél derékszög van, \\(AC=6\\), \\(BC=8\\). Az \\(AB\\) oldal belsején van a \\(D\\) pont felvéve \\(A\\)-tól \\(\\frac{30}{11}\\) távolságra. A \\(P\\) pont az \\(ABC\\) körül írt körének \\(C\\)-től különböző metszéspontja a \\(CD\\) egyenessel. Mekkora a \\(CP\\) távolság négyzete?</p>",
        help1: "CAD és CBD területeinek arányából állapíts meg valamit a szinuszokról.",
        help2: "Addíciós képlettel add meg,, hogy mennyi a CP-hez tartozó kerületi szög szinusza.",
      },
    },
  },
  '7sq8iumi8x--szamoknak-nemures-reszhalmazat': {
    answer: 2601,
    content: {
      hu: {
        problemText: "<p>Az 1, 2, \\(\\ldots\\), 101 számoknak legfeljebb hány olyan nemüres részhalmazát választhatjuk ki, hogy bármelyik két részhalmaz metszete néhány egymást követő szám (az is jó, ha egy darab szám a metszet)?</p>",
        help1: "Nézd meg a halmazok legkisebb és legnagyobb elemeit.",
        help2: "Két halmaznak nem lehet ugyanaz a legkisebb és legnagyobb eleme, de nem is érhet az egyik véget a másik kezdete előtt.",
      },
    },
  },
  'zfiiek6474--ulnek-kerek-asztal': {
    answer: 408,
    content: {
      hu: {
        problemText: "<p>2010-en ülnek egy kerek asztal körül. Andrásnak adunk egy cukrot. Majd elindulunk és az Andrástól jobbra ülő 1. embernek is adunk egy cukrot, majd az (1+2).-nak is adunk egy cukrot, majd az (1+2+3).-nak is adunk egy cukrot, ..., végül az (1+2+...+2009). embernek is adunk egy cukrot. Hányan kaptak összesen cukrot?</p>",
        help1: "Hány (n^2-n)/2 alakú szám van mod 2010? Hozzuk ezt valahogy négyzetes alakra.",
        help2: "(n^2-n)/2=((2n-1)^2-1)/8",
      },
    },
  },
  'sgm4n2buik--auto-kilometeren-ketszer': {
    answer: 960,
    content: {
      hu: {
        problemText: "<p>Egy autó 100 kilométeren kétszer annyit fogyaszt, ha 120 km/h-val megy, mint ha 30 km/h-val menne. Ha 120-szal két órát tud menni egy tank benzinnel, akkor 30-cal hány percenként kell megállnia tankolni?</p>",
        help1: "30 km/h-val feleakkora a fogyasztás, ezért 30 km/h-val haladva kétszer akkora távot tud megtenni egy autó.",
        help2: "Kétszer akkora távot, negyedakkora sebességgel hány perc alatt tesz meg az autó?",
      },
    },
  },
  '1qytv93cl4--albrecht-durer-gimnazium': {
    answer: 1020,
    content: {
      hu: {
        problemText: "<p>Az Albrecht Dürer Gimnázium 11.D osztályában a fiúk és a lányok közül is tízen-tízen szeretik a matekot. Hányféleképpen alakulhat meg az osztály Dürer-csapata, ha a csapatnak három matekot szerető diákból kell állnia, és kell, hogy legyen benne legalább egy lány?<br><i>Más megkötés nincs, és a csapaton belüli sorrend nem számít.</i></p>",
        help1: "Bonts szét esetekre, a lányok száma szerint.",
        help2: "Ha 1 lány van, akkor őt tízféleképpen választhatjuk ki (10 lehetőség). A fiúk közül pedig 10×9/2 féleképpen választhatjuk ki (ez 45 lehetőség). Megmaradt még az a két eset, amikor 2, ill. 3 lány van a csapatban.",
      },
    },
  },
  'dwdu63ei2x--durer-kreativ-nevkitalalo': {
    answer: 3,
    content: {
      hu: {
        problemText: "<p>Az ábrán a Dürer Kreatív Névkitaláló Kft. irodájának alaprajza látható. A pontok oszlopokat jelölnek, melyek segítségével 16 egyforma négyzet alakú mezőre fel lehet osztani az irodát. Minden ilyen mezőben egy ember dolgozik. Néhány szomszédos oszlop közé kelet-nyugati vagy észak-déli irányú falakat is építettek, bár ezeket (az iroda külső falán kívül) az ábrán nem jelöltük. Egy mezőn ülő ember északi, déli, nyugati, illetve keleti irányban látja az összes kollégáját, kivéve ha valahol falat építettek kettőjük közé. Néhány mezőre rá is írtuk, hogy az ott ülő hány munkatársát látja. Milyen számot írhattunk a kérdőjeles mezőre?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_D_5.png",
        help1: "A 6-os mező oszlopában és sorában nem lehetnek falak.",
        help2: "A baloldali oszlop két 4-ese közt sem lehetnek falak. Érdemes egyesével megnézni a mezőket, hogy hol vannak/nincsenek falak.",
      },
    },
  },
  'tjm8bpghzp--legnagyobb-szam-melyre': {
    answer: 334,
    content: {
      hu: {
        problemText: "<p>Melyik az a legnagyobb \\(n\\) egész szám, melyre bármilyen pozitív egész \\(k\\) esetén \\(2016^n\\) osztja a \\(k(k + 1)(k + 2)\\cdots(k + 2015)\\) szorzatot?</p>",
        help1: "Bontsd prímtényezőkre a 2016-ot. 2016 szomszédos egész szorzata mindig osztható 2016!-sal.",
        help2: "Határozd meg a 2, 3, 7 kitevőit a 2016! szorzatban.",
      },
    },
  },
  'jawkvkfgz5--hangya-setal-pontbol': {
    answer: 94,
    content: {
      hu: {
        problemText: "<p>Egy hangya sétál az ábrán. Az 1-es pontból indul, és mindig csak a nyílnak megfelelő irányban halad. Bármelyik vonalon 1 percig tart végigmennie. Ha egy pontba érkezik, és ezelőtt páratlan számú alkalommal járt itt, akkor egyenesen továbbmegy az eggyel nagyobb sorszámú pontba. Ellenben, ha ezelőtt páros számú alkalommal járt itt, akkor visszamegy az 1-es pontba. Kivétel ez alól az 1-es pont, ahonnan mindig továbbmegy a 2-esbe, és a 7-es pont, ahol befejezi a sétáját. Hány percig sétál a hangya? </p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_D_7.png",
        help1: "Hogyan indul a sétája? Hogyan néz ki az első 10 lépés?",
        help2: "Hány perc alatt jut el a 2, 3, 4 mezőkre? Észreveszel valamilyen szabályosságot?",
      },
    },
  },
  'kn5jp8js9q--egyenes-hasab-alaku': {
    answer: 16,
    content: {
      hu: {
        problemText: "<p>Egy egyenes hasáb alakú vödör alapjának területe 450 cm<sup>2</sup>. A vödörbe valamennyi vizet töltünk, majd ebbe egy téglatestet állítunk, amelynek van 18 cm-es és 20 cm-es éle is, a harmadik élhosszat nem ismerjük. Ha a 18 cm-es él áll függőlegesen, akkor 12 cm a vízszint. Ha a 20 cm-es él áll függőlegesen, akkor 10 cm a vízszint. Hány cm magas a vízszint, ha a harmadik él áll függőlegesen?<br><i>A téglatest bármely lapjával beleállítható a vödörbe.</i></p>",
        help1: "Jelöld el az ismeretlen élhosszt. A víz térfogata a vízszint változásától függetlenül állandó.",
        help2: "A víz térfogata állandó: 450*12-20*12*x= 450*10-10*18*x. Ebből a harmadik él hosszára 15 cm-t kapunk. Milyen magasan áll ekkor a víz?",
      },
    },
  },
  'vvua7597oz--haromszog-csucsanal-derekszog': {
    answer: 338,
    content: {
      hu: {
        problemText: "<p>Az \\(ABC\\) háromszög \\(C\\) csúcsánál derékszög van. Állítsunk egy \\(BADE\\) négyzetet az átfogóra. Messe a \\(C\\) csúcsnál levő szögfelező \\(BA\\)-t \\(F\\)-ben és \\(ED\\)-t \\(G\\)-ben. Ha \\(CA=24\\) és \\(CB=10\\), mennyi az \\(ADGF\\) négyszög területe?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_D_9.png",
        help1: "Egészítsd ki az ábrát.",
        help2: "A derékszögű háromszöget a négyzet oldalaira másolva egy nagyobb négyzetet kapsz. Ezt a négyzetet hol metszi a szögfelező?",
      },
    },
  },
  'oidekf7b9r--legkisebb-szam-melyre': {
    answer: 4033,
    content: {
      hu: {
        problemText: "<p>Melyik az a legkisebb pozitív egész \\(k\\) szám, melyre teljesül, hogy ha akárhogyan is van megadva véges sok (nem feltétlenül különböző) szám a [0, 1] intervallumból, melyek összege 2017, akkor szét lehet osztani ezeket a számokat \\(k\\) (esetleg üres) csoportba, hogy minden csoportban legfeljebb 1 legyen az összeg?</p>",
        help1: "2017-tel gondold meg kisebb számmal a hasonló kérdést.",
        help2: "Ha az összeg 3 lenne, akkor k=5 lenne az érték. Egy példa, amihez kell 5 csoport: 0.6, 0.6, 0.6, 0.6, 0.6.",
      },
    },
  },
  '7cytrjnqmy--sakktablara-pakolunk-kep': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>Egy \\(8\\times8\\)-as sakktáblára pakolunk [KÉP] alakú triminókat átfedés nélkül. Mennyi a lehető legkevesebb triminó, amit feltehetünk úgy, hogy többet már ne lehessen feltenni?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_D_12.png",
        help1: "Minden 2×2-es mezőben kell lennie legalább két lefedett mezőnek.",
        help2: "Érdemes a 2. és 7. sort teljesen lefedni.",
      },
    },
  },
  '70jgjgrgpl--tablazat-mezoibe-ketszer': {
    answer: 289,
    content: {
      hu: {
        problemText: "<p>Egy \\(2017\\times1729\\)-es táblázat mezőibe kétszer beírtuk 1-től \\(2017\\cdot1729\\)-ig az egész számokat nagyság szerinti sorrendben. Először soronként felülről lefelé és azon belül soronként balról jobbra, másodszor pedig oszloponként balról jobbra és azon belül oszloponként felülről lefelé. Hány mezőbe került ugyanaz a szám a két kitöltés során?</p>",
        help1: "Milyen szám kerül az a. sor b. oszlopába az egyik, ill. a másik kitöltés szerint? (Érdemes 0. sorral, oszloppal kezdeni.)",
        help2: "Hány megoldása van az előző segítség alapján felírható egyenletnek?",
      },
    },
  },
  'rwhhtijgdd--sakktabla-mezejeben-erme': {
    answer: 576,
    content: {
      hu: {
        problemText: "<p>Egy \\(99\\times99\\)-es sakktábla minden mezejében van egy érme, kezdetben írással felfelé. Egy lépésben kiválaszthatunk egy sorban vagy egy oszlopban négy egymás melletti mezőt, majd az azokon lévő négy érmét megfordítjuk. Hány olyan mező van, melyre elérhető véges sok lépésen belül, hogy csak azon az egy mezőn legyen írás, az összes többin pedig fej?</p>",
        help1: "Vizsgád meg a kérdést kisebb téglalapokra.",
        help2: "Pl. egy 7×7-esen. Miért segít ez? A felső becsléshez érdemes kiszínezni a mezőket.",
      },
    },
  },
  'sh884l4s0k--haromszogben-nel-derekszog': {
    answer: 80,
    content: {
      hu: {
        problemText: "<p>Az \\(ABC\\) háromszögben \\(C\\)-nél derékszög van, \\(AC=6\\), \\(BC=8\\). Az \\(AB\\) oldal belsején van a \\(D\\) pont felvéve \\(A\\)-tól /]\\frac{30}{11}/] távolságra. A \\(P\\) pont az \\(ABC\\) háromszög körül írt körének \\(C\\)-től különböző metszéspontja a \\(CD\\) egyenessel. Mekkora a \\(CP\\) távolság négyzete?</p>",
        help1: "Kösd össze a C csúcsot a kör középpontjával. Az így létrejövő háromszögben a CP egyenesnek kitüntetett szerepe van.",
        help2: "Vetítsd le a P pontot BC oldalra. Hova esik a vetület?",
      },
    },
  },
  'bx6m4x17c1--nehany-ember-sorban': {
    answer: 22,
    content: {
      hu: {
        problemText: "<p>Néhány ember sorban áll a buszmegállóban. Öt egymás mögött állót sorban megkérdeztünk, és ezeket mondták: </p><p><ol type=\"1\"> <li>Mögöttem kétszer annyi lány áll, mint előttem.</li> <li>Mögöttem ugyanannyi lány áll, mint amennyi fiú előttem.</li> <li>A közvetlen mögöttem álló két ember különböző nemű.</li> <li>Mögöttem ugyanannyi fiú áll, mint amennyi lány előttem.</li> <li>Előttem és utánam ugyanannyi fiú áll.</li> </ol></p><p>Legfeljebb hányan állhatnak a buszmegállóban?  </p>",
        help1: "Nevezd el az összes létező dolgot egy-egy változóval, és írd fel az egyenleteket.",
        help2: "Add össze az egyenleteket úgy, hogy az ötös előtt és után álló fiúk és lányok számát jelző változók egy kivételével kiessenek.",
      },
    },
  },
  'y0wj1ckgki--durer-kreativ-nevkitalalo': {
    answer: 3,
    content: {
      hu: {
        problemText: "<p>Az ábrán a Dürer Kreatív Névkitaláló Kft. irodájának alaprajza látható. A pontok oszlopokat jelölnek, melyek segítségével 16 egyforma négyzet alakú mezőre fel lehet osztani az irodát. Minden ilyen mezőben egy ember dolgozik. Néhány szomszédos oszlop közé kelet-nyugati vagy észak-déli irányú falakat is építettek, bár ezeket (az iroda külső falán kívül) az ábrán nem jelöltük. Egy mezőn ülő ember északi, déli, nyugati, illetve keleti irányban látja az összes kollégáját, kivéve ha valahol falat építettek kettőjük közé. Néhány mezőre rá is írtuk, hogy az ott ülő hány munkatársát látja. Milyen számot írhattunk a kérdőjeles mezőre?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_Dp_1.png",
        help1: "A 6-os mező oszlopában és sorában nem lehetnek falak.",
        help2: "A baloldali oszlop két 4-ese közt sem lehetnek falak. Érdemes egyesével megnézni a mezőket, hogy hol vannak/nincsenek falak.",
      },
    },
  },
  'h5rq7l1ilg--hangya-setal-pontbol': {
    answer: 94,
    content: {
      hu: {
        problemText: "<p>Egy hangya sétál az ábrán. Az 1-es pontból indul, és mindig csak a nyílnak megfelelő irányban halad. Bármelyik vonalon 1 percig tart végigmennie. Ha egy pontba érkezik, és ezelőtt páratlan számú alkalommal járt itt, akkor egyenesen továbbmegy az eggyel nagyobb sorszámú pontba. Ellenben, ha ezelőtt páros számú alkalommal járt itt, akkor visszamegy az 1-es pontba. Kivétel ez alól az 1-es pont, ahonnan mindig továbbmegy a 2-esbe, és a 7-es pont, ahol befejezi a sétáját. Hány percig sétál a hangya? </p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_Dp_3.png",
        help1: "Hogyan indul a sétája? Hogyan néz ki az első 10 lépés?",
        help2: "Hány perc alatt jut el a 2, 3, 4 mezőkre? Észreveszel valamilyen szabályosságot?",
      },
    },
  },
  'ei92mgrgt5--haromszog-csucsanal-derekszog': {
    answer: 338,
    content: {
      hu: {
        problemText: "<p>Az \\(ABC\\) háromszög \\(C\\) csúcsánál derékszög van. Állítsunk egy \\(BADE\\) négyzetet az átfogóra. Messe a \\(C\\) csúcsnál levő szögfelező \\(BA\\)-t \\(F\\)-ben és \\(ED\\)-t \\(G\\)-ben. Ha \\(CA=24\\) és \\(CB=10\\), mennyi az \\(ADGF\\) négyszög területe?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_Dp_5.png",
        help1: "Egészítsd ki az ábrát.",
        help2: "A derékszögű háromszöget a négyzet oldalaira másolva egy nagyobb négyzetet kapsz. Ezt a négyzetet hol metszi a szögfelező?",
      },
    },
  },
  'n3fflaelva--sakktablara-pakolunk-kep': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>Egy \\(8\\times8\\)-as sakktáblára pakolunk [KÉP] alakú triminókat átfedés nélkül. Mennyi a lehető legkevesebb triminó, amit feltehetünk úgy, hogy többet már ne lehessen feltenni?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_D_Dp_8.png",
        help1: "Minden 2×2-es mezőben kell lennie legalább két lefedett mezőnek.",
        help2: "Érdemes a 2. és 7. sort teljesen lefedni.",
      },
    },
  },
  '8porbxeajk--nehany-ember-sorban': {
    answer: 22,
    content: {
      hu: {
        problemText: "<p>Néhány ember sorban áll a buszmegállóban. Öt egymás mögött állót sorban megkérdeztünk, és ezeket mondták: </p><p><ol type=\"1\"> <li>Mögöttem kétszer annyi lány áll, mint előttem.</li> <li>Mögöttem ugyanannyi lány áll, mint amennyi fiú előttem.</li> <li>A közvetlen mögöttem álló két ember különböző nemű.</li> <li>Mögöttem ugyanannyi fiú áll, mint amennyi lány előttem.</li> <li>Előttem és utánam ugyanannyi fiú áll.</li> </ol></p><p>Legfeljebb hányan állhatnak a buszmegállóban?  </p>",
        help1: "bla1",
        help2: "bla2",
      },
    },
  },
  '8qipfaoflm--egyenes-folyo-partjan': {
    answer: 8008,
    content: {
      hu: {
        problemText: "<p>Egy egyenes folyó két partján található néhány település. Az egyik oldalon 11 van sorban a parton, míg a másik oldalon 7. Szeretnénk egyenes hidakat építeni, melyek egy-egy települést kötnek össze a két partról. A hidak nem keresztezhetik egymást, és el kell tudnunk jutni bármelyik településből bármelyik másikba csak ezen hidak segítségével. A települések között csak hidakon közlekedhetünk. Hányféle elrendezésben építhetjük meg a hidakat?</p>",
        help1: "bla1",
        help2: "bla2",
      },
    },
  },
  'e43478aju3--valos-szamok-melyekre': {
    answer: 2379,
    content: {
      hu: {
        problemText: "<p>Legyenek \\(x_1\\), \\(x_2\\), . . . , \\(x_10\\) valós számok, melyekre \\(0\\leq x_i ≤\\leq i\\) (\\(i =\\) 1, 2, \\(\\ldots\\), 10). Ekkor mi az alábbi kifejezés maximális értéke? </p><p><center>\\(x_1^3 + x_2^3 + \\dots+ x_{10}^3 - (x_1x_2x_3 + x_2x_3x_4 +\\dots+ x_{10}x_1x_2)\\)</center></p>",
        help1: "bla1",
        help2: "bla2",
      },
    },
  },
  'yj5r51e1h1--ulnek-kerek-asztal': {
    answer: 408,
    content: {
      hu: {
        problemText: "<p>2010-en ülnek egy kerek asztal körül. Andrásnak adunk egy cukrot. Majd elindulunk és az Andrástól jobbra ülő 1. embernek is adunk egy cukrot, majd az (1+2).-nak is adunk egy cukrot, majd az (1+2+3).-nak is adunk egy cukrot, ..., végül az (1+2+...+2009). embernek is adunk egy cukrot. Hányan kaptak összesen cukrot?</p>",
        help1: "bla1",
        help2: "bla2",
      },
    },
  },
  '4cp2bq5j3q--feladat': {
    answer: 420,
    content: {
      hu: {
        problemText: "<p>Hány olyan \\(0<n<3^8\\) egész szám van, melyre teljesül, hogy a \\(0/leq k\\leq\\frac{n}3\\) egész számok közül pontosan 216 olyan van, melyre \\(rac{n!}{(n-3k)!·k!·3^{k+1}}\\) nem egész?</p>",
        help1: "bla1",
        help2: "bla2",
      },
    },
  },
};
