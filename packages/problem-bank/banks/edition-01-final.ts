import type { CompetitionBank, ProblemBank } from '../src/sources';

// Edition 1's final, relay only, as the relay practice site serves it: one
// competition per category, and the problems their relays use, each written
// once. Released, so the practice site may import it.

export const competitions: CompetitionBank = {
  'w2b34gqoin--01-final-b': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: '24r7yz8zlc--legkisebb-tal-oszthato', points: 3 },
        { problemId: 'o40ltaek31--jegyu-osztoinak-szorzata', points: 3 },
        { problemId: 'qa9c5hj3vp--szultan-szuletesnapja-alkalmabol', points: 3 },
        { problemId: '5okstsbmlk--primszamok-osszege-amelyekbol', points: 4 },
        { problemId: 'y7u0jthymm--maximum-huszart-elhelyezni', points: 4 },
        { problemId: 'o6oxotpqpg--kerekparos-egymas-fele', points: 4 },
        { problemId: 'sam2jq054c--felosztottuk-teret-sikokkal', points: 4 },
        { problemId: 'zqt7q90gf6--szam-legkisebb-erteke', points: 5 },
        { problemId: 'l1pj7juc6d--egyenes-reszre-osztja', points: 5 },
        { problemId: 'b4f4z65te8--kifejezes-erteke-kulonbozo', points: 5 },
        { problemId: '0jwbiordnf--szam-szamjegyeinek-osszege', points: 6 },
        { problemId: 'sv6j9z0vow--trapezt-atloi-haromszogre', points: 6 },
        { problemId: '8p9bstuips--sakktablan-mezot-befesteni', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 1, round: 'final', category: 'B' },
  },
  '6am5fsmne9--01-final-c': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'hrjdnnzfap--igaz', points: 3 },
        { problemId: 'idji234nss--tablara-babszemeket-teszunk', points: 3 },
        { problemId: 'a715juu5tr--szam-szamjegyeinek-osszege', points: 3 },
        { problemId: 'rdiqf1pabb--osztalyban-targyat-tanitanak', points: 4 },
        { problemId: '99qla7kdj3--metszespontja-konvex-nyolcszog', points: 4 },
        { problemId: '8y9y8zzp1d--trapezt-atloi-haromszogre', points: 4 },
        { problemId: 'ycs0wrajf6--jelolje-tizes-szamrendszerbeli', points: 4 },
        { problemId: 'r59le8hlrr--koron-pont-behuztuk', points: 5 },
        { problemId: 'fw7hegr6pk--reszhalmaza-amelyben-elemek', points: 5 },
        { problemId: '6wam4kgz1c--halmazbol-barhogyan-valasztunk', points: 5 },
        { problemId: '7bbjhku9ao--all-elo-negyzetszam', points: 6 },
        { problemId: '0n4yu4bw8h--sakktabla-szettort-csak', points: 6 },
        { problemId: 'd8bfrvu7gi--feladat', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 1, round: 'final', category: 'C' },
  },
  '6k1mw3k7hg--01-final-d': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'p8mx8ti0e6--csiga-maszik-meteres', points: 3 },
        { problemId: 'y7u0jthymm--maximum-huszart-elhelyezni', points: 3 },
        { problemId: 'g96dolhk73--utolso-szamjegye', points: 3 },
        { problemId: 'rdiqf1pabb--osztalyban-targyat-tanitanak', points: 4 },
        { problemId: 'p0m56xu96k--koron-pont-behuztuk', points: 4 },
        { problemId: '8y9y8zzp1d--trapezt-atloi-haromszogre', points: 4 },
        { problemId: 'qqa1nuqasb--valos-szamrol-csak', points: 4 },
        { problemId: 'iyywfjsp3s--feladat', points: 5 },
        { problemId: 'hrjdnnzfap--igaz', points: 5 },
        { problemId: '0n4yu4bw8h--sakktabla-szettort-csak', points: 5 },
        { problemId: '8fpfr56oum--toton-esemenynek-fele', points: 6 },
        { problemId: 'z23c9cf30q--halmazbol-elemet-kivalasztani', points: 6 },
        { problemId: 'b7wpbgc53j--gyermekeim-evekben-kifejezett', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 1, round: 'final', category: 'D' },
  },
};

export const problems: ProblemBank = {
  '24r7yz8zlc--legkisebb-tal-oszthato': {
    answer: 9,
    content: {
      hu: {
        problemText: "<p>Mennyi annak a legkisebb 36-tal osztható, pozitív egész számnak a számjegyösszege, amely csak 0 és 1 számjegyekből áll?</p>",
        help1: "Egy 36-tal osztható szám osztható 4-el és 9-cel is.",
        help2: "4-el akkor osztható egy szám, ha az utolsó két jegyéből alkotott kétjegyű szám osztható 4-gyel. Elevenítsétek fel a 9-cel való oszthatóságot is!",
      },
    },
  },
  'o40ltaek31--jegyu-osztoinak-szorzata': {
    answer: 9,
    content: {
      hu: {
        problemText: "<p>Hány jegyű a 100 pozitív osztóinak a szorzata?</p>",
        help1: "Párosítsátok a 100 osztóit!",
        help2: "Az <em>n</em> szám osztói párokba állíthatóak úgy, hogy a szorzatuk külön-külön <em>n</em> legyen.<br><i>Lehetséges hogy valamelyik osztót önmagával \"párosítjuk\".</i>",
      },
    },
  },
  'qa9c5hj3vp--szultan-szuletesnapja-alkalmabol': {
    answer: 31,
    content: {
      hu: {
        problemText: "<p>Egy szultán a születésnapja alkalmából néhány foglyot szabadon szeretne engedni. Az 1000 cellás börtönben 1000 őr van. Az első őr minden cellát kinyit. A második őr minden második cellát bezár. A harmadik minden harmadik cellát bezárja, ha nyitva volt, és kinyitja, ha zárva volt. A negyedik őr minden negyedik cellát bezárja, ha nyitva volt, és kinyitja, ha zárva volt. És így tovább, egészen az ezredik őrig. Azok a rabok szabadulnak a folyamat végén, akiknek a cellája nyitva van. Hány rab szabadul?</p>",
        help1: "Egy rab akkor szabadul, ha páratlan sok őr változtat a cellájának a nyitottságán.",
        help2: "Például az első és a negyedik rab kiszabadul, de a második nem.",
      },
    },
  },
  '5okstsbmlk--primszamok-osszege-amelyekbol': {
    answer: 23,
    content: {
      hu: {
        problemText: "<p>Mennyi azon prímszámok összege, amelyekből 14-et kivonva egy-egy prímszám négyzetét kapjuk?</p>",
        help1: "Keressetek megoldást kis prímszámok esetén!",
        help2: "Nézzétek meg, hogy hárommal osztva mennyi maradékot adhat egy négyzetszám.",
      },
    },
  },
  'y7u0jthymm--maximum-huszart-elhelyezni': {
    answer: 32,
    content: {
      hu: {
        problemText: "<p>Maximum hány huszárt lehet elhelyezni a sakktáblán úgy, hogy egyik se üsse semelyik másikat?</p>",
        help1: "Egy huszár csak a saját mezőjétől különböző színű mezőket lát.",
        help2: "Párosítsátok a mezőket úgy, hogy egy huszárt lehelyezve a pár egyik mezőjére, az lássa a másikat.",
      },
    },
  },
  'o6oxotpqpg--kerekparos-egymas-fele': {
    answer: 39,
    content: {
      hu: {
        problemText: "<p>Két kerékpáros egymás felé teker egy egyenes úton. Mindkettejük sebessége 10 km/h. Kezdetben 20 km-re vannak egymástól. Egyikőjüktől a másik felé elindul egy légy 39 km/h sebességgel. Mikor eléri a másik biciklistát, rögtön visszafordul. Ezt a lavírozást egészen a két biciklista találkozásáig teszi. Hány km-t tett meg a légy a találkozásig?</p>",
        help1: "A légy végig ugyanakkora sebességgel halad.",
        help2: "Mennyi ideig repül a légy?",
      },
    },
  },
  'sam2jq054c--felosztottuk-teret-sikokkal': {
    answer: 2,
    content: {
      hu: {
        problemText: "<p>Felosztottuk a teret síkokkal. A kapott térrészeket úgy szeretnénk kiszínezni, hogy a lapszomszédos térrészek különböző színűek legyenek. Mennyi a legkevesebb szín, amennyivel ezt minden lehetséges felosztásnál megtehetjük?</p>",
        help1: "Nézzétek meg, mennyi szín szükséges kevés sík esetén!",
        help2: "Nézzétek meg, mi történik, amikor egy újabb síkot helyeztek le!",
      },
    },
  },
  'zqt7q90gf6--szam-legkisebb-erteke': {
    answer: 3339,
    content: {
      hu: {
        problemText: "<p>Tudjuk, hogy \\(a|\\overline{abc9}\\), \\(b|\\overline{abc9}\\), \\(c|\\overline{abc9}\\), \\(9|\\overline{abc9}\\). Mennyi az \\(\\overline{abc9}\\) szám lehetséges legkisebb értéke?</p>",
        help1: "Egy szám akkor osztható 9-cel, ha a jegyösszege osztható 9-cel.",
        help2: "a, b, c egyike sem lehet se páros, se 5. Ha valamelyik 1, 3 vagy 9, akkor az nem korlátozza a megoldásokat, mert tudjuk, hogy a 9 osztja <em>abc9</em>-et.",
      },
    },
  },
  'l1pj7juc6d--egyenes-reszre-osztja': {
    answer: 5051,
    content: {
      hu: {
        problemText: "<p>100 egyenes legfeljebb hány részre osztja a síkot?</p>",
        help1: "Nézzétek meg, mi történik kevés egyenes esetén!",
        help2: "Mennyivel növeli a részek számát az <em>n</em>-edik egyenes?",
      },
    },
  },
  'b4f4z65te8--kifejezes-erteke-kulonbozo': {
    answer: 0,
    content: {
      hu: {
        problemText: "<p>Mennyi az alábbi kifejezés értéke, ha a különböző betűk különböző számjegyeket jelölnek?<br><center>\\(\\frac{A\\cdot L\\cdot B\\cdot E\\cdot R\\cdot T}{D\\cdot U\\cdot R\\cdot E\\cdot R}\\)</center></p>",
        help1: "Tízféle számjegy van.",
        help2: "Hányféle betű szerepel az ábrán?",
      },
    },
  },
  '0jwbiordnf--szam-szamjegyeinek-osszege': {
    answer: 9,
    content: {
      hu: {
        problemText: "<p>A \\(99^{99}\\) szám számjegyeinek összege <em>B</em>. <em>B</em> számjegyeinek összege <em>C</em>. Mennyi <em>C</em> számjegyeinek összege?</p>",
        help1: "Adjatok felső korlátot a szám számjegyeinek összegére, ha az legfeljebb <em>k</em> jegyű!",
        help2: "Mikor osztható egy szám 9-cel?",
      },
    },
  },
  'sv6j9z0vow--trapezt-atloi-haromszogre': {
    answer: 36,
    content: {
      hu: {
        problemText: "<p>Egy trapézt az átlói 4 háromszögre osztanak fel. Tudjuk, hogy két szemközti háromszög\r területe 1, illetve 25 egység. Hány egység a trapéz területe?</p>",
        help1: "A megadott területű háromszögek hasonlók.",
        help2: "Milyen arányban osztja az átlókat a metszéspontjuk? Vezessetek be rá egy változót, és fejezzétek ki vele az ismert és ismeretlen területű háromszögek területarányát!",
      },
    },
  },
  '8p9bstuips--sakktablan-mezot-befesteni': {
    answer: 57,
    content: {
      hu: {
        problemText: "<p>Egy sakktáblán legalább hány mezőt kell befesteni ahhoz, hogy biztosan legyen legalább egy teljesen befestett sor vagy oszlop?</p>",
        help1: "Keressetek ilyen \"maximális festéseket\" kis táblákon!",
        help2: "Ha egy sor vagy oszlop nincs teljesen befestve, van benne befestetlen mező.",
      },
    },
  },
  'hrjdnnzfap--igaz': {
    answer: 12,
    content: {
      hu: {
        problemText: "<p>Minden pozitív \\(x\\), \\(y\\)-ra igaz, hogy \\(2x^2+18y^2\\geq kxy\\). Legfeljebb mekkora lehet \\(k\\)?</p>",
        help1: "Próbáljatok meg teljes négyzetet kialakítani a bal oldalon!",
        help2: "Használjátok (x-3y)<sup>2</sup>-t!",
      },
    },
  },
  'idji234nss--tablara-babszemeket-teszunk': {
    answer: 98,
    content: {
      hu: {
        problemText: "<p>Egy \\(10\\times10\\)-es táblára babszemeket teszünk le. Ha olyan mezőre tettünk babot, amellyel élben szomszédos mezőn már van bab, akkor levesszük az egyik szomszédos babot. Ezt a lépést ismételgetve legfeljebb hány bab kerülhet a táblára?</p>",
        help1: "Először 2&times;2-es és 3&times;3-as táblákon vizsgáljátok meg a feladatot!<br>Ha csak egy mezőre nem kerül bab, akkor mi lehet az utolsó lépés?",
        help2: "A felső sor és a bal oldalsó oszlop kirakható babokkal. Ezután már csak egy 9&times;9-es táblázatot kell kitöltenetek.",
      },
    },
  },
  'a715juu5tr--szam-szamjegyeinek-osszege': {
    answer: 9,
    content: {
      hu: {
        problemText: "<p>A \\(99^{99}\\) szám számjegyeinek összege <em>B</em>. <em>B</em> számjegyeinek összege <em>C</em>. Mennyi <em>C</em> számjegyeinek összege?</p>",
        help1: "Legfeljebb mekkora lehet egy szám számjegyösszege a jegyei számának függvényében?",
        help2: "Egy szám pontosan akkor osztható 9-cel, ha a számjegyösszege is osztható 9-cel.",
      },
    },
  },
  'rdiqf1pabb--osztalyban-targyat-tanitanak': {
    answer: 20,
    content: {
      hu: {
        problemText: "<p>Egy osztályban 6 tárgyat tanítanak. Félévkor mindenki pontosan ugyanannyi tárgyból volt ötös, de nem volt két olyan diák, akiknél az ötössel teljesített tárgyak megegyeztek volna. Legfeljebb hányan járhatnak az osztályba?</p>",
        help1: "Feleltessétek meg a diákokat azon tárgyak halmazának, amelyekből ötöst kaptak!",
        help2: "Ha mindenki <em>k</em> tárgyból kapott ötöst, hányféle különböző tárgy <em>k</em>-as lehetséges?",
      },
    },
  },
  '99qla7kdj3--metszespontja-konvex-nyolcszog': {
    answer: 70,
    content: {
      hu: {
        problemText: "<p>Legfeljebb hány metszéspontja lehet egy konvex nyolcszög átlóinak a sokszög belsejében?</p>",
        help1: "Egy-egy metszéspont mely átlókhoz tartozik?",
        help2: "Mindegyik átlónak két-két végpontja van. Ez alapján miknek feleltethetők meg a metszéspontok?",
      },
    },
  },
  '8y9y8zzp1d--trapezt-atloi-haromszogre': {
    answer: 36,
    content: {
      hu: {
        problemText: "<p>Egy trapézt az átlói négy háromszögre osztanak fel. Tudjuk, hogy két szemközti háromszög területe 1, illetve 25 egység. Hány egység a trapéz területe?</p>",
        help1: "A megadott területű háromszögek hasonlók.",
        help2: "Milyen arányban osztja az átlókat a metszéspontjuk? Mekkora az ismert és ismeretlen területű háromszögek területaránya?",
      },
    },
  },
  'ycs0wrajf6--jelolje-tizes-szamrendszerbeli': {
    answer: 0,
    content: {
      hu: {
        problemText: "<p>Jelölje \\(B\\) azt a tízes számrendszerbeli számot, ahányféleképpen 127 különböző elemből ki tudunk választani 63-at. Hány 0-ra végződik \\(B\\)?</p>",
        help1: "127 elemből 63-at 127! / (63!&sdot;64!)-féleképpen lehet kiválasztani.",
        help2: "Számoljátok ki, hogy hányadik hatványon szerepel a 2 a 127!, a 63! illetve a 64! számok prímtényezős felbontásaiban!",
      },
    },
  },
  'r59le8hlrr--koron-pont-behuztuk': {
    answer: 31,
    content: {
      hu: {
        problemText: "<p>Adott egy körön hat pont. Behúztuk az általuk meghatározott összes húrt. Legfeljebb hány síkrész keletkezhetett a kör belsejében?</p>",
        help1: "Nézzétek meg, hogy hány síkrész keletkezik kevesebb pont esetén.",
        help2: "Hány új síkrész jöhet létre egy új pont felvételével?",
      },
    },
  },
  'fw7hegr6pk--reszhalmaza-amelyben-elemek': {
    answer: 3792,
    content: {
      hu: {
        problemText: "<p>\\(A\\)={1, 2, 3, 4, \\(\\ldots\\), 12}. Hány olyan részhalmaza van \\(A\\)-nak, amelyben az elemek szorzata osztható 6-tal?</p>",
        help1: "A megfelelő részhalmazok száma <em>A</em> részhalmazai számának és a nem megfelelő részhalmazok számának a különbsége.",
        help2: "Egy részhalmaz nem megfelelő, ha nem tartalmaz 3-mal osztható számot vagy páros számot.",
      },
    },
  },
  '6wam4kgz1c--halmazbol-barhogyan-valasztunk': {
    answer: 1005,
    content: {
      hu: {
        problemText: "<p>\\(A\\)={1, 2, 3, 4, \\(\\ldots\\), 2008}. Tudjuk, hogy az \\(A\\) halmazból bárhogyan is választunk ki \\(x\\) darab elemet, mindig található közöttük kettő, amelyek különbsége 4. Mennyi \\(x\\) minimális értéke?</p>",
        help1: "Osszátok fel <em>A</em>-t négy részre úgy, hogy az egyes részekben a számok néggyel való osztási maradéka egyenlő legyen!",
        help2: "Mennyi ugyanezen kérdésre a válasz a <em>B = {1, 5, 9, 13, 17, ... , 4k+1}</em> halmaz esetén?",
      },
    },
  },
  '7bbjhku9ao--all-elo-negyzetszam': {
    answer: 8,
    content: {
      hu: {
        problemText: "<p>Hányféleképpen áll elő az 1155 két négyzetszám különbségeként?</p>",
        help1: "Írjátok fel a feladat feltételét egy egyenlettel!",
        help2: "<em>a<sup>2</sup>-b<sup>2</sup> = (a-b)(a+b)</em>.",
      },
    },
  },
  '0n4yu4bw8h--sakktabla-szettort-csak': {
    answer: 128,
    content: {
      hu: {
        problemText: "<p>Egy \\(8\\times8\\)-as sakktábla széttört, csak a főátlóján lévő mezők és a velük élben szomszédosak maradtak meg. Hányféleképpen lehet eljutni az egyik sarokból a másikba, ha mindig csak élben szomszédos mezőkre léphetünk, és egy mezőn csak egyszer járhatunk?</p>",
        help1: "Nézzétek meg, hogy egy kisebb sakktáblán hányféleképpen lehetséges a sarkok közti eljutás a megadott módon!",
        help2: "A tábla minden mezőjét töltsétek ki azzal a számmal, ahányféleképpen egy adott sarokmezőről oda lehet jutni!",
      },
    },
  },
  'd8bfrvu7gi--feladat': {
    answer: 64,
    content: {
      hu: {
        problemText: "<p>\\(log_{10}\\left(9\\cdot11\\cdot101\\cdot10001\\cdot(10^8+1)\\cdot(10^{16}+1)\\cdot(10^{32}+1)+1\\right)\\)=?</p>",
        help1: "Mennyi 11&sdot;101&sdot;10001?",
        help2: "9&sdot;11&sdot;101&sdot;+1 = 10<sup>4</sup>",
      },
    },
  },
  'p8mx8ti0e6--csiga-maszik-meteres': {
    answer: 9,
    content: {
      hu: {
        problemText: "<p>Egy csiga mászik ki a 20 méteres gödörből. Nappal felmászik 5 métert, éjjel visszacsúszik 3-at. Ha reggel indul az aljáról, akkor hány nap alatt jut fel?</p>",
        help1: "Hány méterrel változik a magassága egy egész nap elteltével?",
        help2: "Hány méter magasan kell hogy legyen egy nap végén, hogy a következő nap felérjen a gödör tetejére?",
      },
    },
  },
  'g96dolhk73--utolso-szamjegye': {
    answer: 1,
    content: {
      hu: {
        problemText: "<p>Mi a \\(11^{10}\\) utolsó két számjegye?</p>",
        help1: "Nézzétek meg, mire végződnek a kisebb 11-hatványok!",
        help2: "Mitől függ két szám szorzatának az utolsó jegye?",
      },
    },
  },
  'p0m56xu96k--koron-pont-behuztuk': {
    answer: 31,
    content: {
      hu: {
        problemText: "<p>Adott egy körön hat pont. Behúztuk az általuk meghatározott összes húrt. Legfeljebb hány síkrész keletkezhetett a kör belsejében?</p>",
        help1: "Nézzétek meg, hány síkrész keletkezik kevesebb pont esetén.",
        help2: "Hány új síkrész jöhet létre egy új pont felvételével?",
      },
    },
  },
  'qqa1nuqasb--valos-szamrol-csak': {
    answer: 99,
    content: {
      hu: {
        problemText: "<p>100 valós számról csak annyit tudunk, hogy az összegük pozitív. A 100 számból képezhető 4950 darab kéttagú összegből legalább hány lesz biztosan pozitív?</p>",
        help1: "Keressetek konstrukciót, ahol minél kevesebb pozitív pár van, akár kevés számra!",
        help2: "Legyenek a számaink <em>a<sub>1</sub>, a<sub>2</sub>, ..., a <sub>100</sub></em>. Fix <em>k</em>-kra legalább hány darab pozitív összeg kell, hogy legyen az <em>a<sub>n</sub>+a<sub>n+k</sub></em> alakú összegek között?",
      },
    },
  },
  'iyywfjsp3s--feladat': {
    answer: 64,
    content: {
      hu: {
        problemText: "<p>\\(log_{10}\\left(9\\cdot11\\cdot101\\cdot10001\\cdot(10^8+1)\\cdot(10^{16}+1)\\cdot(10^{32}+1)+1\\right)\\)=?</p>",
        help1: "Végezzétek el a szorzásokat, először csak az első néhányat!",
        help2: "Mennyi 11&sdot;101&sdot;10001?",
      },
    },
  },
  '8fpfr56oum--toton-esemenynek-fele': {
    answer: 3,
    content: {
      hu: {
        problemText: "<p>A totón 14 eseménynek 3-féle kimenetele lehetséges (1, 2, X), ezekre kell tippelni. Hány totószelvényt kell kitölteni ahhoz, hogy biztosan legyen öttalálatos szelvényünk?</p>",
        help1: "Elég egy szelvényt feladnunk? Kettőt? Hármat? Négyet? Többet?",
        help2: "A 14-et három természetes szám összegeként felírva, mindenképp lesz olyan tag, amelyik legalább 5.",
      },
    },
  },
  'z23c9cf30q--halmazbol-elemet-kivalasztani': {
    answer: 1005,
    content: {
      hu: {
        problemText: "<p>\\(A\\) = {1, 2, 3, 4, \\(\\ldots\\), 2008}. Az \\(A\\) halmazból legalább hány elemet kell kiválasztani ahhoz, hogy legyen köztük két egymáshoz relatív prím?</p>",
        help1: "A páros számok nem relatív prímek.",
        help2: "Két egész szám, amelyek különbsége 1, relatív prímek.",
      },
    },
  },
  'b7wpbgc53j--gyermekeim-evekben-kifejezett': {
    answer: 3,
    content: {
      hu: {
        problemText: "<p>Gyermekeim években kifejezett életkorának szorzata 1664. A legfiatalabb legalább feleannyi idős, mint a legidősebb. Én 50 éves vagyok. Hány gyermekem van?</p>",
        help1: "Bontsátok prímtényezőire az 1664-et!",
        help2: "1664 = 2<sup>7</sup>&sdot;13, így a legidősebb gyerek legalább 13 éves.",
      },
    },
  },
};
