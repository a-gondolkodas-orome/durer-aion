import type { CompetitionBank, ProblemBank } from '../src/sources';

// Edition 4's final, relay only, as the relay practice site serves it: one
// competition per category, and the problems their relays use, each written
// once. Released, so the practice site may import it.
//
// Some relays here use a problem first set in an earlier round, which keeps
// it: edition-02-final.ts.

export const competitions: CompetitionBank = {
  '4wgxbrn0t4--04-final-b': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'dbll6qmtyh--durer-versenyen-feladat', points: 3 },
        { problemId: '92w6jj0tv5--teve-halad-sivatagban', points: 3 },
        { problemId: '5pb8sttto1--racspontot-valaszthatunk-sikon', points: 3 },
        { problemId: 'tpsooqvob3--osztoinak-szorzata-szamjegyeinek', points: 4 },
        { problemId: 'iigkeop88c--szamok-halmazanak-reszhalmaza', points: 4 },
        { problemId: '6zj8tpyrvf--reka-regina-piacon', points: 4 },
        { problemId: 'eji1x3eww2--kata-kati-katalin', points: 4 },
        { problemId: 'o2smpe5m1c--moho-mihalynak-negyszogol', points: 5 },
        { problemId: 'dw57jpz2zn--tal-kezdodo-millional', points: 5 },
        { problemId: '910003uoar--kockat-raktunk-ossze', points: 5 },
        { problemId: 'egex97maqw--bandita-all-teren', points: 6 },
        { problemId: 'v7alra6bcj--sikbeli-koordinatarendszer-pontjain', points: 6 },
        { problemId: 'gir7mznmdn--kiralyt-tablara-elhelyezni', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 4, round: 'final', category: 'B' },
  },
  '67pc1pame2--04-final-c': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'eji1x3eww2--kata-kati-katalin', points: 3 },
        { problemId: '8e3vy16aid--lathato-haromszog-oldalai', points: 3 },
        { problemId: '92w6jj0tv5--teve-halad-sivatagban', points: 3 },
        { problemId: 'kex2qon77g--szaz-valos-szam', points: 4 },
        { problemId: '1950u9dn8h--osszeg-szamjegye-tizedesvesszo', points: 4 },
        { problemId: 'jazozaxrk5--bolha-ugral-vegtelen', points: 4 },
        { problemId: 'wnwig9f20h--tal-kezdodo-millional', points: 4 },
        { problemId: 'egex97maqw--bandita-all-teren', points: 5 },
        { problemId: 'jptdyu639s--haza-megye-lakosai', points: 5 },
        { problemId: 'n2dktkvdkb--novekvo-sorozat-azokat', points: 5 },
        { problemId: '910003uoar--kockat-raktunk-ossze', points: 6 },
        { problemId: 'kowsu1df2k--maximum-kiralyt-tablara', points: 6 },
        { problemId: 'si5rbq73lt--love-kulcsa-tarsasag', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 4, round: 'final', category: 'C' },
  },
  'oft89akwjn--04-final-d': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'zh1xtecxup--attento-redaz-azzal', points: 3 },
        { problemId: 'z2u2hjt80q--igaz', points: 3 },
        { problemId: 'xmu62615td--lathato-haromszog-oldalai', points: 3 },
        { problemId: 'n2dktkvdkb--novekvo-sorozat-azokat', points: 4 },
        { problemId: 'dbsh5ss3ns--egysegkockakbol-teglatestet-epitettunk', points: 4 },
        { problemId: '1tbpybk3p9--szaz-valos-szam', points: 4 },
        { problemId: '7rwkz9ala6--haza-megye-lakosai', points: 4 },
        { problemId: '1387ej0hxd--albrecht-durer-szerkesztett', points: 5 },
        { problemId: '47iv1pl7rq--negyzet-oldalhossza-oldal', points: 5 },
        { problemId: 'kowsu1df2k--maximum-kiralyt-tablara', points: 5 },
        { problemId: 'ko9sjskobd--trap-pista-azzal', points: 6 },
        { problemId: '7w4hcl9hm2--bot-aniko-kertjet', points: 6 },
        { problemId: 'si5rbq73lt--love-kulcsa-tarsasag', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 4, round: 'final', category: 'D' },
  },
};

export const problems: ProblemBank = {
  'dbll6qmtyh--durer-versenyen-feladat': {
    answer: 0,
    content: {
      hu: {
        problemText: "<p>Az Ál-Dürer Versenyen három feladat volt. Minden versenyző legalább egy feladatot megoldott. Az első feladatot 14, másodikat 27, a harmadikat pedig 20 versenyző oldotta meg. A 40 versenyzőből 21-en oldottak meg legalább két feladatot. Hányan oldották meg mind a három feladatot?</p>",
        help1: "Számoljátok össze másképpen is, hogy hány ember oldott meg legalább egy feladatot! Rajzoljatok halmazábrát!",
        help2: "Azok száma, akik megoldottak legalább egy feladatot, az az egyes feladatokat megoldók számainak összege, mínusz a legalább kettőt megoldóak száma, plusz a három feladatot megoldók száma.",
      },
    },
  },
  '92w6jj0tv5--teve-halad-sivatagban': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>Négy teve halad a sivatagban egymás mögött. Hányféle sorrendben mehetnek másnap, ha egyikük sem akarja megint egész nap ugyanazt a feneket bámulni?</p>",
        help1: "Az a kérdés, hogy az 1, 2, 3, 4 számokat hányféle sorrendben lehet úgy leírni, hogy a kapott négyjegyű számban ne szerepeljen sehol a 12, a 23 és a 34.",
        help2: "Az 1, 2, 3, 4 számokat összesen 24-féle sorrendben lehet leírni, ezeket mind ki kell próbálnotok.<br>Például az 1-essel kezdődőek:<ul><li>1234: rossz<li>1243: rossz<li>1324: jó<li>1342: rossz<li>1423: rossz<li>1432: jó.</ul>",
      },
    },
  },
  '5pb8sttto1--racspontot-valaszthatunk-sikon': {
    answer: 4,
    content: {
      hu: {
        problemText: "<p>Legfeljebb hány rácspontot választhatunk ki a síkon úgy, hogy semelyik két kiválasztott rácspont által meghatározott szakasz felezőpontja ne essen rácspontra?</p>",
        help1: "Két rácspont által meghatározott szakasz felezőpontjának a koordinátái egész/2 alakúak.",
        help2: "Két egész szám összege akkor páros, ha a két szám paritása megegyezik.",
      },
    },
  },
  'tpsooqvob3--osztoinak-szorzata-szamjegyeinek': {
    answer: 1,
    content: {
      hu: {
        problemText: "<p>Legyen \\(A\\) a 100 osztóinak a szorzata. Mennyi \\(A\\) számjegyeinek az összege?</p>",
        help1: "Egy számot 10-el szorozva, nem változik a jegyösszege.",
        help2: "A 100 osztói a 10 kivételével párba állíthatóak úgy, hogy a szorzatuk 100 legyen.",
      },
    },
  },
  'iigkeop88c--szamok-halmazanak-reszhalmaza': {
    answer: 76,
    content: {
      hu: {
        problemText: "<p>Az {1, 2, \\(\\ldots\\), 100} számok halmazának egy \\(H\\) részhalmaza olyan tulajdonságú, hogy \\(H\\) egyik elemének a háromszorosa sincs benne \\(H\\)-ban. Legfeljebb hány eleme lehet \\(H\\)-nak?</p>",
        help1: "Rendezzétek a számokat aszerint csoportokba, hogy a 3-nak legfeljebb hányadik hatványa osztja őket!",
        help2: "A megoldás azon számok száma a halmazban, amelyekben a 3 páros kitevőn szerepel.",
      },
    },
  },
  '6zj8tpyrvf--reka-regina-piacon': {
    answer: 16,
    content: {
      hu: {
        problemText: "<p>Réka és Regina a piacon mindketten vettek répát és retket. Réka és Regina összesen ugyanannyi répát vett, mint retket. Réka répáinak száma megegyezik Regina zöldségeinek számával. Regina 8 répát vett. Hány retket vett Réka?</p>",
        help1: "Jelöljétek változókkal, hogy ki hány dolgot vett, és írjatok fel egyenleteket!",
        help2: "Réka 8-cal több répát vett, mint ahány retket Regina vett. Ez alapján Réka mennyivel vett többet retekből, mint Regina répából?",
      },
    },
  },
  'eji1x3eww2--kata-kati-katalin': {
    answer: 2,
    content: {
      hu: {
        problemText: "<p>Kata, Kati és Katalin gondolt egy-egy számra. Hogyha Kata számát összeszorozzuk Kati számával, és hozzáadjuk Katalin számát, kettőt kapunk. Hogyha Kati számát összeszorozzuk Katalin számával, és hozzáadjuk Kata számát, szintén kettőt kapunk. Sőt, ha Katalin számát összeszorozzuk Kata számával, és hozzáadjuk Kati számát, akkor is kettőt kapunk. Hányféle számhármasra gondolhattak a hölgyek?</p>",
        help1: "Írjatok fel három egyenletet, és páronként vonjátok ki őket egymásból!",
        help2: "Ha a gondolt számok <em>x</em>, <em>y</em> és <em>z</em>, akkor az <em>xy+z=2</em> és <em>xz+y=2</em> egyenleteket egymásból kivonva, szorzattá alakítás után azt kapjuk, hogy <em>x=1</em> vagy <em>y=z</em>. Ugyanez úgy is működik, ha a három betűt felcserélgetjük egymással!",
      },
    },
  },
  'o2smpe5m1c--moho-mihalynak-negyszogol': {
    answer: 50,
    content: {
      hu: {
        problemText: "<p>Mohó Mihálynak egy 8 négyszögöl területű telke van, amely háromszög alakú. Csúcsai rendre az \\(A\\), \\(B\\) és \\(C\\) pontok. Mihály tükrözte telke minden oldalfelező pontját a vele szemközti csúcsra, ezzel kibővítve azt. Új telkének csúcsai a tükrözés eredményei. Hány négyszögölre növekedett Mihály telkének területe?</p>",
        help1: "Az új háromszög (telek) hasonló lesz a régi telekhez.",
        help2: "Mi a hasonlóság középpontja és aránya?<br><i>Az adott oldalközépponthoz tartozó szemközti új csúcs, a régi csúcs, illetve a régi telek súlypontja egy egyenesre esnek.</i>",
      },
    },
  },
  'dw57jpz2zn--tal-kezdodo-millional': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>Hány olyan 6-tal kezdődő, 15 milliónál kisebb pozitív egész szám van, aminek az elejéről a hatost letörölve, pontosan \\(\\frac1{25}\\)-ödére csökken az értéke?</p>",
        help1: "Vonjátok ki az eredeti számból a 6-os levágásával kapott számot! Ez a szám hányszorosa a levágás után megmaradt számnak?",
        help2: "Ha egy szám megfelelő, és a 10-szerese is kisebb mint 15 millió, akkor a tízszerese is megfelelő.",
      },
    },
  },
  '910003uoar--kockat-raktunk-ossze': {
    answer: 100,
    content: {
      hu: {
        problemText: "<p>Egy \\(10\\times10\\times10\\)-es kockát raktunk össze üvegkockákból. Legalább hány kiskockát kell kicserélni fakockákra, ha azt szeretnénk, hogy a nagy kocka szemből, oldalról és felülről is átlátszatlan legyen?</p>",
        help1: "Nézzétek meg kisebb kockarácsra a szükséges fakockák számát.",
        help2: "Ahhoz, hogy egy 1&times;10&times;10-es részét ne lássuk a kockának oldalról, legalább hány fakockára van szükségünk?",
      },
    },
  },
  'egex97maqw--bandita-all-teren': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>Tíz bandita áll a téren. Bármely kettőjük között különböző a távolság. Pontban éjfélkor mindannyian a legközelebbi (másik) banditára lőnek. Legfeljebb hányan maradhatnak állva? </p>",
        help1: "Lehetséges-e, hogy kilencen maradnak állva? Vegyétek figyelembe, hogy a távolságok között van legkisebb.",
        help2: "Próbáljátok megfelelően elrendezni a két legközelebbi banditán kívüli 8 banditát! Lehetséges-e, hogy ők mind a nyolcan állva maradnak?",
      },
    },
  },
  'v7alra6bcj--sikbeli-koordinatarendszer-pontjain': {
    answer: 4,
    content: {
      hu: {
        problemText: "<p>A síkbeli koordinátarendszer \\((0,0)\\), \\((0,1)\\) és \\((1,0)\\) pontjain egy-egy bolha ül. Egy lépésben egy bolha átugorhatja egy társát (ilyenkor a másik bolhára vett tükörképén landol). Legkevesebb hány ugrással érheti el valamelyik bolha a \\((4,4)\\) pontot?</p>",
        help1: "A nem origóból induló bolhák eljuthatnak-e a (4,4) pontba?",
        help2: "Az origóból induló bolhának legalább kétszer kell ugrania.",
      },
    },
  },
  'gir7mznmdn--kiralyt-tablara-elhelyezni': {
    answer: 16,
    content: {
      hu: {
        problemText: "<p>Legfeljebb hány királyt lehet egy \\(6\\times6\\)-os táblára úgy elhelyezni, hogy mindegyik legfeljebb egy másikat üssön?</p>",
        help1: "Nézzétek meg a feladatot kisebb négyzetrácsra.",
        help2: "Egy 3&times;3-as négyzetre legfeljebb négy királyt lehet így elhelyezni.",
      },
    },
  },
  '8e3vy16aid--lathato-haromszog-oldalai': {
    answer: 8,
    content: {
      hu: {
        problemText: "<p>Az ábrán látható háromszög oldalai \\(AB=6\\) cm, \\(BC=3\\) cm, valamint \\(AC=5\\) cm. Az \\(ED\\) szakasz érinti a háromszög beírt körét. Hány cm az \\(ADE\\) háromszög kerülete?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/4_D_C_2.png",
        help1: "Egy pontból a körhöz húzott két érintőszakasz egyenlő hosszú.",
        help2: "Jelöljétek az ábrán a kör érintési pontjait, és nevezzétek el betűkkel az összes kis szakaszt. Az előző segítség miatt lesznek olyan betűk, amelyeket két helyre is be tudtok írni.",
      },
    },
  },
  'kex2qon77g--szaz-valos-szam': {
    answer: 99,
    content: {
      hu: {
        problemText: "<p>Adott száz valós szám, amelyek összege pozitív. A száz számból képezhető 4950 darab kéttagú összeg közül legalább hány lesz biztosan pozitív?</p>",
        help1: "Keressetek konstrukciót, ahol minél kevesebb pozitív pár van! Vizsgáljátok meg kevesebb számra, ha száz szám túl sok.",
        help2: "Legyenek a számaink <em>a<sub>1</sub>, a<sub>2</sub>, ..., a <sub>100</sub></em>. Fix <em>k</em>-kra legalább hány darab pozitív összeg kell, hogy legyen az <em>a<sub>n</sub>+a<sub>n+k</sub></em> alakú összegek között?",
      },
    },
  },
  '1950u9dn8h--osszeg-szamjegye-tizedesvesszo': {
    answer: 9,
    content: {
      hu: {
        problemText: "<p>Mi az alábbi összeg 2010. számjegye a tizedesvessző után?</p><p><br><center>\\(/[rac1{2!}+\\frac2{3!}+\\frac3{4!}+\\dots+\\frac{2010}{2011!}\\)</center></p>",
        help1: "Fejezzétek ki az első <em>n</em> tört összegét!",
        help2: "Milyen kicsi az 1/2011! tört?",
      },
    },
  },
  'jazozaxrk5--bolha-ugral-vegtelen': {
    answer: 90,
    content: {
      hu: {
        problemText: "<p>Egy bolha ugrál egy végtelen hosszú pálcán. Minden ugrásakor 10 cm-t ugrik balra vagy jobbra. Hányféleképpen juthat el 10 ugrással a kiindulási helyétől pontosan 60 cm-re (tetszőleges irányban)?</p>",
        help1: "Valójában csak az számít, hogy hányat ugrik balra és hányat jobbra.",
        help2: "Az ugrássorozatok száma ismétléses permutációval megkapható.",
      },
    },
  },
  'wnwig9f20h--tal-kezdodo-millional': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>Hány olyan 6-tal kezdődő, 15 milliónál kisebb pozitív egész szám van, aminek az elejéről a hatost letörölve, pontosan \\(\\frac1{25}\\)-ödére csökken az értéke?</p>",
        help1: "A szám 25-tel osztható kell, hogy legyen.",
        help2: "Ha egy szám megfelelő, és a 10-szerese is kisebb mint 15 millió, akkor a tízszerese is megfelelő.",
      },
    },
  },
  'jptdyu639s--haza-megye-lakosai': {
    answer: 161,
    content: {
      hu: {
        problemText: "<p>Haza Megye lakosai a következő ábra szerinti elrendezésben laknak. A főút hányadik kilométeréhez kell tenni a megyei kocsmát, hogy a lakosonkénti átlagos kocsma-távolság a lehető legkisebb legyen?<br><i>A lakosokat nem különböztetjük meg kocsmázási szokás szempontjából. Az útszakaszok mellett található számok a szakaszok hosszát jelölik, a távolságmérés a 0-ás kilométerkőtől indul.</i></p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/4_D_C_9.png",
        help1: "Képzeletben kezdjetek el kilométerenként mozgatni a kocsmát a főúton! Hol fogjátok elérni a legalacsonyabb átlagot?",
        help2: "Addig érdemes mozgatnotok a kocsmát, amíg a kocsmából az egyik irányba elindulva több lakos van az úton, mint a másik irányba.",
      },
    },
  },
  'n2dktkvdkb--novekvo-sorozat-azokat': {
    answer: 981,
    content: {
      hu: {
        problemText: "<p>Az 1, 3, 4, 9, 10, 12, 13, \\(\\ldots\\) növekvő sorozat azokat és csak azokat a számokat tartalmazza, amelyek vagy 3-hatványok, vagy felírhatók különböző 3-hatványok összegeként. Mennyi a sorozat 100. eleme?</p>",
        help1: "Milyen alakúak ezek a számok hármas számrendszerben?",
        help2: "Használj más számrendszert azt eldönteni, hogy melyik a 100. ilyen szám!",
      },
    },
  },
  'kowsu1df2k--maximum-kiralyt-tablara': {
    answer: 16,
    content: {
      hu: {
        problemText: "<p>Maximum hány királyt lehet egy \\(6\\times6\\)-os táblára úgy elhelyezni, hogy mindegyik legfeljebb egy másikat üssön?</p>",
        help1: "Nézzétek meg a feladatot kisebb négyzetrácsra.",
        help2: "Egy 3&times;3-as részre legfeljebb négy királyt lehet így elhelyezni.",
      },
    },
  },
  'si5rbq73lt--love-kulcsa-tarsasag': {
    answer: 8,
    content: {
      hu: {
        problemText: "<p>A Lóvé Kulcsa Társaság mind a 70 tagja rendelkezik egy kulccsomóval. Tudjuk, hogyha bármelyikük elveszti kulcscsomóját, azt nem tudja helyettesíteni egy másik tag kulcscsomójával (lesz olyan kulcs, ami hiányzik). Összesen legalább hányféle kulcsa van a társaság tagjainak?</p>",
        help1: "Használjátok a Sperner-tételt!",
        help2: "Ha a társaságnak összesen <em>n</em>-féle kulcsa lenne, akkor a társaságnak legfeljebb hány ember lehetne tagja úgy, hogy a feladat feltétele teljesüljön?<br>(<em>n</em> kulcs esetén a kulcsok halmazának legfeljebb hány részhalmazát választhatjuk ki úgy, hogy közülük semelyik kettő ne tartalmazza egymást? Nézzétek meg kis <em>n</em>-ekre, majd általánosítsatok!)",
      },
    },
  },
  'zh1xtecxup--attento-redaz-azzal': {
    answer: 100,
    content: {
      hu: {
        problemText: "<p>Áttentő Redáz azzal játszik, hogy két barna, három zöld és négy kék szemgolyót helyez egymás mellé egy sorban, és rettentőmód figyel arra, hogy a két barna egymás mellett legyen, de zöld és barna ne kerülhessen egymás mellé. Hányféleképpen rendezheti el a szemgolyókat, ha tudjuk, hogy az azonos színű szemgolyókat nem tudja megkülönböztetni?</p>",
        help1: "A barna szemgolyók egymás mellett vannak, és mellettük kizárólag kék(ek) lehetnek.",
        help2: "Bontsátok esetekre a lehetséges elrendezéseket a barna szemgolyók helyei szerint.",
      },
    },
  },
  'z2u2hjt80q--igaz': {
    answer: 12,
    content: {
      hu: {
        problemText: "<p>Minden pozitív \\(x\\), \\(y\\)-ra igaz, hogy \\(2x^2+18y^2\\geq kxy\\). Legfeljebb mekkora lehet \\(k\\)?</p>",
        help1: "Próbáljatok meg teljes négyzetet kialakítani a bal oldalon!",
        help2: "Használjátok (x-3y)<sup>2</sup>-et!",
      },
    },
  },
  'xmu62615td--lathato-haromszog-oldalai': {
    answer: 8,
    content: {
      hu: {
        problemText: "<p>Az ábrán látható háromszög oldalai \\(AB=6\\) cm, \\(BC=3\\) cm, valamint \\(AC=5\\) cm. Az \\(ED\\) szakasz érinti a háromszög beírt körét. Hány cm az \\(ADE\\) háromszög kerülete?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/4_D_D_3.png",
        help1: "Egy pontból a körhöz húzott két érintőszakasz egyenlő hosszú.",
        help2: "Jelöljétek az ábrán a kör érintési pontjait, és nevezzétek el betűkkel az összes kis szakaszt. Az előző segítség miatt lesznek olyan betűk, amelyeket két helyre is be tudtok írni.",
      },
    },
  },
  'dbsh5ss3ns--egysegkockakbol-teglatestet-epitettunk': {
    answer: 4150,
    content: {
      hu: {
        problemText: "<p>Egységkockákból egy \\(2010\\times1474\\times825\\\\)-ös téglatestet építettünk, majd összekötöttük két szemközti csúcsát. Hány olyan kiskocka van, amelynek a belsejébe egy megadott testátló belemetsz?</p>",
        help1: "Hányszor fordul elő, hogy a két csúcskockát összekötő egyenes belső kis kockák csúcsán megy át?",
        help2: "És hogy belső kis kockák éleit metszi?<br>(Esetleg vizsgáljátok meg kis téglalapokra, hogy az ő átlójuk hány kisnégyzetükbe metsz bele!)",
      },
    },
  },
  '7rwkz9ala6--haza-megye-lakosai': {
    answer: 161,
    content: {
      hu: {
        problemText: "<p>Haza Megye lakosai a következő ábra szerinti elrendezésben laknak. A főút hányadik kilométeréhez kell tenni a megyei kocsmát, hogy a lakosonkénti átlagos kocsma-távolság a lehető legkisebb legyen?<br><i>A lakosokat nem különböztetjük meg kocsmázási szokás szempontjából. Az útszakaszok mellett található számok a szakaszok hosszát jelölik, a távolságmérés a 0-ás kilométerkőtől indul.</i></p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/4_D_D_7.png",
        help1: "Képzeletben kezdjetek el kilométerenként mozgatni a kocsmát a főúton! Hol fogjátok elérni a legalacsonyabb átlagot?",
        help2: "Addig érdemes mozgatnotok a kocsmát, amíg a kocsmából az egyik irányba elindulva több lakos van az úton, mint a másik irányba.",
      },
    },
  },
  '1387ej0hxd--albrecht-durer-szerkesztett': {
    answer: 28,
    content: {
      hu: {
        problemText: "<p>Albrecht Dürer szerkesztett egy szabályos kilencszöget, amelynek oldalhossza 28 fikarc. Hány fikarc lesz a leghosszabb és legrövidebb átlójának hosszának a különbsége?</p>",
        help1: "Vegyétek fel egy ábrán a megfelelő átlókat, illetve a kérdezett hosszat. Ne bonyolítsátok túl az ábrát!",
        help2: "Számoljatok szögeket, és keressetek egyenlőszárú háromszöge(ke)t!",
      },
    },
  },
  '47iv1pl7rq--negyzet-oldalhossza-oldal': {
    answer: 105,
    content: {
      hu: {
        problemText: "<p>Az alábbi négyzet oldalhossza 30. \\(E\\) a \\(CD\\) oldal felezőpontja, \\(F\\) a \\(DA\\) oldal felezőpontja. \\(BD\\), \\(BE\\) és \\(CF\\) mind szakasz. Mekkora a szürkített négyszög területe?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/4_D_D_9.png",
        help1: "Keressetek hasonló sokszögeket az ábrán (akár új szakaszok berajzolásával is)!",
        help2: "Milyen arányban osztja egymást <em>BD</em> és <em>CF</em>? <em>BE</em> egyenese milyen háromszöget vág le a <em>CDF</em> háromszögből, és ennek a területe hányadrésze <em>CDF</em> területének?",
      },
    },
  },
  'ko9sjskobd--trap-pista-azzal': {
    answer: 1728,
    content: {
      hu: {
        problemText: "<p>Trap Pista azzal tölti szabadidejét, hogy megalkotja az Orbitális Sajtkockát kis, azonos méretű edami, gouda és feta sajtkockákból. Modzar Ella az egész Orbitális Sajtkockát elfogyasztva, tökéletes ízlelőbimbóira támaszkodva megállapítja: „A sajt \\(\\frac{13}{72}\\) része edami, \\(\\frac{25}{48}\\) része gouda.” Tudjuk továbbá, hogy az Orbitális Sajtkocka legfeljebb 1000 feta sajtkockát tartalmaz. Hány sajtkockából áll az Orbitális Sajtkocka?</p>",
        help1: "Hozzátok közös nevezőre a két törtet!",
        help2: "Az előbbi törtek nevezőjét vizsgálva, minimum hány kiskockaél hosszúak az Orbitális Sajtkocka élei?",
      },
    },
  },
  '7w4hcl9hm2--bot-aniko-kertjet': {
    answer: 4,
    content: {
      hu: {
        problemText: "<p>Bot Anikó \\(8\\times8\\) m-es kertjét próbálja dekorálni. Ezt úgy teszi, hogy 21 darab \\(3\\times1\\) m-es betonlapot fektet le úgy, hogy egy \\(1\\times1\\) m-es terület marad szabadon kedvenc virágjának. Hányféle helyen lehet Bot Anikó kedvenc virága?</p>",
        help1: "Keressetek lehetséges elrendezéseket!",
        help2: "Színezzétek a kert 1&times;1 m-es mezőit három színnel úgy, hogy egy 3&times;1 m-es betonlapot tetszőleges helyre lerakva, az pontosan egyet-egyet fedjen mindhárom színű mezőből!",
      },
    },
  },
};
