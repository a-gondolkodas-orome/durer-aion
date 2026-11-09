import type { CompetitionBank, ProblemBank } from '../src/sources';

// Edition 5's final, relay only, as the relay practice site serves it: one
// competition per category, and the problems their relays use, each written
// once. Released, so the practice site may import it.

export const competitions: CompetitionBank = {
  'olwrsuyal9--05-final-a': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'tc2y3npa1d--szomszedos-paratlan-szam', points: 3 },
        { problemId: 'n0829tam2g--feladat', points: 3 },
        { problemId: 'z70mhgiz4g--hetfon-reggel-bogar', points: 3 },
        { problemId: '9o83ugnhfn--legkisebb-szamot-aminek', points: 4 },
        { problemId: 'tnbneynce2--kis-peti-szorzast', points: 4 },
        { problemId: 'wcn3jkki6k--diak-jar-iskolaba', points: 4 },
        { problemId: 'nz3jfm22ks--kalozkapitany-borton-hazaterve', points: 4 },
        { problemId: 'jy1j854ydc--jatekorszagban-mano-tarsasjatekozott', points: 5 },
        { problemId: 'oyd1flg3b6--villamosvonal-mindket-vegallomasarol', points: 5 },
        { problemId: 'l8uifirqa7--vadaszaton-csak-nyulakat', points: 5 },
        { problemId: 'hpx6ec9w79--szocske-ugral-szamegyenesen', points: 6 },
        { problemId: '1ri08m7y9l--darabos-kartyapakliban-tol', points: 6 },
        { problemId: 'oauxm6a7g5--osszeadasban-azonos-betuk', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 5, round: 'final', category: 'A' },
  },
  'xte4u7n3sk--05-final-b': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'ij91fgzukd--elvegeznenk-kovetkezo-szorzast', points: 3 },
        { problemId: '3g4863gcnt--hetfeju-sarkanyok-haromfeju', points: 3 },
        { problemId: 'jy1j854ydc--jatekorszagban-mano-tarsasjatekozott', points: 3 },
        { problemId: 'oyd1flg3b6--villamosvonal-mindket-vegallomasarol', points: 4 },
        { problemId: 'awcax4wxbs--andras-bela-lerajzolt', points: 4 },
        { problemId: 'oschmq7bc1--eredetileg-feher-kocka', points: 4 },
        { problemId: '9722ees3o9--vettem-tabla-csokit', points: 4 },
        { problemId: 'ar7a2tyh9j--valaki-leirta-szamokat', points: 5 },
        { problemId: '78oedqc0ss--szocske-ugral-sikon', points: 5 },
        { problemId: '3g73969w2l--varos-durer-rajongoklubjai', points: 5 },
        { problemId: 'o8k9omgs5w--iluska-nagyon-sokat', points: 6 },
        { problemId: '0w5p4splau--derekszogu-haromszog-atfogojahoz', points: 6 },
        { problemId: '9jxllodsoz--tabla-minel-kevesebb', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 5, round: 'final', category: 'B' },
  },
  '5km5p9nezn--05-final-c': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: '3g4863gcnt--hetfeju-sarkanyok-haromfeju', points: 3 },
        { problemId: 'ar7a2tyh9j--valaki-leirta-szamokat', points: 3 },
        { problemId: 'o8k9omgs5w--iluska-nagyon-sokat', points: 3 },
        { problemId: 'mta2zbcdqe--durer-fogott-termeszetes', points: 4 },
        { problemId: '0w5p4splau--derekszogu-haromszog-atfogojahoz', points: 4 },
        { problemId: '0jbf6g5h7m--rozoga-dobokockank-amelyrol', points: 4 },
        { problemId: 'jan80yfadg--varos-durer-rajongoklubjai', points: 4 },
        { problemId: 'qcy2aixvp4--szamot-magikusnak-nevezunk', points: 5 },
        { problemId: '0233kvrd0j--egysegkockabol-osszeraktunk-kockat', points: 5 },
        { problemId: 'ec1fs6tir6--szocske-ugral-sikon', points: 5 },
        { problemId: 'w312k5m9jn--tabla-minel-kevesebb', points: 6 },
        { problemId: '39hbwcbmkn--darab-kulsore-teljesen', points: 6 },
        { problemId: 'em8mi5dfce--negyzet-oldalhossza-egyseg', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 5, round: 'final', category: 'C' },
  },
  'yl107tp18h--05-final-d': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'g55kk1hyhz--durer-szervezo-focizni', points: 3 },
        { problemId: 'ar7a2tyh9j--valaki-leirta-szamokat', points: 3 },
        { problemId: 'mta2zbcdqe--durer-fogott-termeszetes', points: 3 },
        { problemId: 't1jkw9o3gl--varosban-buszjaratnak-megalloja', points: 4 },
        { problemId: '0w5p4splau--derekszogu-haromszog-atfogojahoz', points: 4 },
        { problemId: '0jbf6g5h7m--rozoga-dobokockank-amelyrol', points: 4 },
        { problemId: '85nebq56t7--varos-durer-rajongoklubjai', points: 4 },
        { problemId: 'qcy2aixvp4--szamot-magikusnak-nevezunk', points: 5 },
        { problemId: '0233kvrd0j--egysegkockabol-osszeraktunk-kockat', points: 5 },
        { problemId: '2mob8ipgq7--tabla-minel-kevesebb', points: 5 },
        { problemId: 'o8ot71lg3d--nagy-korben-kis', points: 6 },
        { problemId: '39hbwcbmkn--darab-kulsore-teljesen', points: 6 },
        { problemId: 'gb79fsi94b--kulonbozo-termeszetes-szam', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 5, round: 'final', category: 'D' },
  },
};

export const problems: ProblemBank = {
  'tc2y3npa1d--szomszedos-paratlan-szam': {
    answer: 4,
    content: {
      hu: {
        problemText: "<p>Két szomszédos páratlan szám közül a nagyobbik háromszorosa a kisebbiknek. Mennyi az összegük?</p>",
        help1: "Ha a két páratlan szám túl nagy lenne, akkor a hányadosuk túl kicsi lenne.",
        help2: "A két szám különbsége 2, ami a kisebb szám háromszorosa mínusz a kisebb szám.",
      },
    },
  },
  'n0829tam2g--feladat': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>1 - 2 + 3 - 4 + 5 - 6 + \\(\\ldots\\) + 19 - 20 + 21 = ?</p>",
        help1: "Csoportosítsátok a műveleteket!",
        help2: "1 - 2 = 3 - 4 = 5 - 6 = &hellip; = 19 - 20",
      },
    },
  },
  'z70mhgiz4g--hetfon-reggel-bogar': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>Hétfőn reggel egy bogár elkezd felmászni egy kiszáradt fatörzsre. Minden nap folyamán 2 métert mászik felfele, de minden éjszaka visszacsúszik fél métert. Hány méter magas a fatörzs, ha éppen vasárnap estére ér fel a tetejére?</p>",
        help1: "Hány métert halad felfelé 2 nap leforgása alatt?",
        help2: "Vasárnap estig háromszor telik el két teljes nap hétfő reggel óta, plusz vasárnap még felmászik a bogár két métert.",
      },
    },
  },
  '9o83ugnhfn--legkisebb-szamot-aminek': {
    answer: 2899,
    content: {
      hu: {
        problemText: "<p>Keressük meg a legkisebb pozitív egész számot, aminek a számjegyeinek szorzata 1296.</p>",
        help1: "A legkisebb megfelelő számban a számjegyek amennyire lehet, nagyok, illetve növekvő sorrendben vannak.",
        help2: "1296=2&times;2&times;2&times;2&times;3&times;3&times;3&times;3.",
      },
    },
  },
  'tnbneynce2--kis-peti-szorzast': {
    answer: 36,
    content: {
      hu: {
        problemText: "<p>A kis Peti egy szorzást kapott matekházinak: a 123-at kellett megszoroznia egy olyan kétjegyű számmal, amelynek a második jegye kétszer akkora, mint az első. Sajnos azonban még a szorzás elvégzése előtt, Peti véletlenül felcserélte a kétjegyű szám jegyeit, így eredményül 3321-gyel nagyobbat kapott, mint ha a helyes szorzást végezte volna el. Melyik kétjegyű számmal kellett volna szoroznia Petinek?</p>",
        help1: "Hányszorosa a 123-nak 3321?",
        help2: "A 27 páratlan szám, így a kétjegyű szám egyik jegye páratlan.",
      },
    },
  },
  'wcn3jkki6k--diak-jar-iskolaba': {
    answer: 25,
    content: {
      hu: {
        problemText: "<p>600 diák jár egy iskolába, ahol minden osztály 30 fős. Minden diáknak 5 órája van egy nap, és minden tanár 4 órát tart naponta. Minden órán egy teljes osztály és egy tanár van jelen. Hány tanár van az iskolában?</p>",
        help1: "Hány osztály van az iskolában?",
        help2: "Hány tanóra zajlik le összesen egy nap alatt?",
      },
    },
  },
  'nz3jfm22ks--kalozkapitany-borton-hazaterve': {
    answer: 24,
    content: {
      hu: {
        problemText: "<p>A kalózkapitány 6 év börtön után hazatérve a következőket mondja: ötször annyi idős voltam, mint a fiam, amikor börtönbe kerültem; de most csak háromszor olyan idős vagyok. Hány éves volt a kapitány, amikor a fia született?</p>",
        help1: "Jelöljétek valamilyen változóval (betűvel) a fiú életkorát akkor, amikor a kapitány börtönbe került!",
        help2: "A hat év börtön alatt a kapitány és a fia is pontosan 6 évet idősödött.",
      },
    },
  },
  'jy1j854ydc--jatekorszagban-mano-tarsasjatekozott': {
    answer: 52,
    content: {
      hu: {
        problemText: "<p>Játékországban három manó társasjátékozott. Összesen 3 játszmát játszottak. Minden játszma végén a vesztes a saját csokoládéjából megkétszerezte a többiek csokoládéját. Mindenki egyszer vesztett. A játék végén mindenkinek 32 darab csokoládéja lett. Hány darab csokoládéja volt a játszma elején annak, akinek a legtöbbje volt?</p>",
        help1: "Gondolkozzatok visszafelé!",
        help2: "Mennyi csokijuk volt a manóknak a 2. kör után? (Kettejük csokimennyisége megkétszereződött, úgy lett egyenként 32 csokijuk.)",
      },
    },
  },
  'oyd1flg3b6--villamosvonal-mindket-vegallomasarol': {
    answer: 13,
    content: {
      hu: {
        problemText: "<p>Egy villamosvonal mindkét végállomásáról kétperces időközönként, pontosan egyszerre indulnak a szerelvények. Az út az egyik végállomástól a másikig éppen 13 percig tart. Ha az egyik irányban végigmegyünk a vonalon, hány villamossal találkozunk szembe az út során?</p><p><i>Azokat a villamosokat, amelyekkel valamelyik végállomáson találkozunk, nem számoljuk.</i></p>",
        help1: "Hány villamos halad adott pillanatban az úton az egyik állomás felől a másik felé?",
        help2: "Hány villamos indul el a célállomás felől azalatt, amíg a villamosunk átér a célállomásra?<br>Hány perc az eltérés a legelső és a legutolsó olyan villamos indulása között, amelyekkel az út során találkozunk?",
      },
    },
  },
  'l8uifirqa7--vadaszaton-csak-nyulakat': {
    answer: 28,
    content: {
      hu: {
        problemText: "<p>Egy vadászaton csak nyulakat és fácánokat lőttek. Az elejtett állatoknak összesen 46 fejük és 128 lábuk volt. Hány fácánt lőttek a vadászaton?</p>",
        help1: "Hány lába lenne a lelőtt állatoknak összesen, ha mind fácán volna?",
        help2: "Ha <em>k</em> darab nyulat lőttek le, akkor pontosan 2<em>k</em>-val több lába van a lelőtt vadaknak, mint ha mind fácán lenne.",
      },
    },
  },
  'hpx6ec9w79--szocske-ugral-szamegyenesen': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>Egy szöcske ugrál a számegyenesen. A 0-ról indul, majd minden ugrással egy szomszédos egész számra ugrik át. Hányféle helyen lehet a szöcske a 10. ugrása után?</p>",
        help1: "Vizsgáljátok meg, hogy hányféle helyre juthat kevesebb ugrás esetén!",
        help2: "Páros sok ugrás esetén csak páros számokra érkezhet.",
      },
    },
  },
  '1ri08m7y9l--darabos-kartyapakliban-tol': {
    answer: 60,
    content: {
      hu: {
        problemText: "<p>Egy 10 darabos kártyapakliban 1-től 10-ig vannak számozva a kártyák. Öt ember között szétosztjuk a kártyákat, mindenkinek két lap jut. Az első négy ember elárulta, mennyi a náluk levő lapokon a számok összege: 5, 10, 12, 12. Az ötödik embernél levő számoknak mi a szorzata?</p>",
        help1: "Mennyi a kártyákra írt számok összege?",
        help2: "Vizsgáljátok meg, hogy ha az ötödik ember egyik lapja a 9-es, akkor a többiek melyik lapokat kaphatták!",
      },
    },
  },
  'oauxm6a7g5--osszeadasban-azonos-betuk': {
    answer: 9567,
    content: {
      hu: {
        problemText: "<p>Az alábbi összeadásban az azonos betűk azonos, a különböző betűk különböző számjegyeket jelölnek:</p><p><center>\\(\\overline{ABCD} + \\overline{EFGB} = \\overline{EFCBH}\\)</center></p><p>Mennyi az \\(ABCD\\)-vel jelölt négyjegyű szám értéke?</p>",
        help1: "Két négyjegyű szám összege kisebb 20000-nél, ami megköti <em>E</em> lehetséges értékeit.",
        help2: "Így az egyik szám kisebb mint 2000, tehát <em>F</em><2. Keressétek meg, hogy hol vannak tízes átlépések, és figyeljetek arra, hogy a különböző betűk különböző számjegyeket jelentenek!",
      },
    },
  },
  'ij91fgzukd--elvegeznenk-kovetkezo-szorzast': {
    answer: 15,
    content: {
      hu: {
        problemText: "<p>Ha elvégeznénk a következő szorzást, hány 0 lenne a kapott szám végén?</p><p><center>\\(1^1\\cdot2^2\\cdot3^3\\cdot4^4\\cdot5^5\\cdot6^6\\cdot7^7\\cdot8^8\\cdot9^9\\cdot10^{10}\\)</center> </p>",
        help1: "Pontosan annyi 0 van egy szám végén, ahányadik hatványa a 10-nek még pont osztja.",
        help2: "A 10 prímtényezős felbontása 10=2&sdot;5. Melyikből van kevesebb: 2-es vagy 5-ös prímtényezőből?",
      },
    },
  },
  '3g4863gcnt--hetfeju-sarkanyok-haromfeju': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>A hétfejű sárkányok és a háromfejű sárkányok találkozót tartanak. A találkozón megjelent 29 sárkánynak összesen 131 feje van. Hány hétfejű sárkány jelent meg a találkozón?</p>",
        help1: "Hány feje lenne a sárkányoknak összesen, ha mindnek 3 feje lenne?",
        help2: "Ha <em>k</em> darab hétfejű sárkány van, akkor a sárkányoknak 4<em>k</em>-val van több feje összesen, mint ha mindegyiknek 3 feje lenne.",
      },
    },
  },
  'awcax4wxbs--andras-bela-lerajzolt': {
    answer: 132,
    content: {
      hu: {
        problemText: "<p>András és Béla is lerajzolt egy-egy olyan téglalapot, amelynek az oldalai cm-ben mérve pozitív egészek, és a kerülete 50 cm. Ha András a lehető legkisebb területű, Béla pedig a lehető legnagyobb területű ilyen téglalapot rajzolta le, akkor hány cm<sup>2</sup>-rel nagyobb területű Béla téglalapja Andrásénál?</p>",
        help1: "Vezessetek be változót egy ilyen téglalap valamelyik oldalának hosszára!",
        help2: "Adott kerületű téglalapok közül annak nagyobb a területe, amelyiknek kisebb a hosszabb és rövidebb oldalai hossza közti különbség.",
      },
    },
  },
  'oschmq7bc1--eredetileg-feher-kocka': {
    answer: 3,
    content: {
      hu: {
        problemText: "<p>Egy eredetileg fehér kocka két lapját pirosra, egy másikat pedig kékre színezzük. Hányféle különböző színes kockát kaphatunk meg így?<br><i>Két színes kockát akkor tekintünk különbözőnek, ha forgatással nem vihetők egymásba.</i></p>",
        help1: "A színezés után feltehető, hogy a kocka felső lapja a kék lap.",
        help2: "A kék lappal lesz szomszédos piros lap, így feltehető, hogy az egyik adott, kék lappal szomszédos lapot színeztük pirosra. Hol lehet a harmadik piros lap?",
      },
    },
  },
  '9722ees3o9--vettem-tabla-csokit': {
    answer: 48,
    content: {
      hu: {
        problemText: "<p>Vettem egy tábla csokit. Megettem azokat a kockákat, amelyek a tábla valamelyik szélén voltak, így pont az összes kocka fele maradt meg. Legalább hány kockából állt a csoki eredetileg?<br><i>A tábla csokinkban négyzetrácsszerűen helyezkednek el a csokikockák.</i></p>",
        help1: "Paraméterezzétek a feladatot! (Hány kiskockaoldal hosszúak a tábla csoki oldalai?)",
        help2: "Például ha a megmaradó téglalap <em>a&times;b</em> méretű, akkor az eredeti csoki mérete egyrészt <em>(a+2)&times;(b+2)</em>, másrészt a maradék kétszerese.<br>Figyeljetek arra, hogy az eredetileg meglevő csokikockák száma a kérdés!",
      },
    },
  },
  'ar7a2tyh9j--valaki-leirta-szamokat': {
    answer: 0,
    content: {
      hu: {
        problemText: "<p>Valaki leírta az egész számokat egymás mögé (elválasztójel, illetve szünet nélkül) 1-től 2012-ig. Melyik számjegy áll a 2012-edik helyen?</p>",
        help1: "9 darab egyjegyű számot írunk le.",
        help2: "Válasszátok szét a leírt számokat aszerint, hogy hány jegyűek! Melyik háromjegyű szám számjegyét keressük?",
      },
    },
  },
  '78oedqc0ss--szocske-ugral-sikon': {
    answer: 121,
    content: {
      hu: {
        problemText: "<p>Egy szöcske ugrál a síkon. Az origóból indul, és minden ugrásával egy szomszédos rácspontra ugrik vízszintesen vagy függőlegesen. Hányféle helyen lehet a szöcske a 10. ugrása után?</p>",
        help1: "Vizsgáljátok meg, hogy mely pontokba juthat kevesebb ugrással, és színezzétek ezeket a pontokat!",
        help2: "Mekkora az a négyzet, amelyik éppen az elérhető pontokat határolja?",
      },
    },
  },
  '3g73969w2l--varos-durer-rajongoklubjai': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>Négy város Dürer rajongóklubjai körmérkőzéses focibajnokságot rendeztek. Az alábbi táblázatban láthatjátok a torna végeredményét. Az első oszlopban a városok nevei; a második oszlopban az elért pontszámok (fociban a győzelemért 3, a döntetlenért 1, a vereségért 0 pontot adnak); az utolsó oszlopban pedig a csapatok által a teljes torna során rúgott, illetve kapott gólok száma látható (kötőjellel elválasztva). Hány gól esett a Miskolc-Nürnberg mérkőzésen?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/5_D_B_10.png",
        help1: "A táblázat alapján döntsétek el, hogy melyik mérkőzéseken lett döntetlen az eredmény, illetve ha volt nyertes, akkor ki nyert!",
        help2: "Hány gól esett a mérkőzéseken összesen?",
      },
    },
  },
  'o8k9omgs5w--iluska-nagyon-sokat': {
    answer: 957,
    content: {
      hu: {
        problemText: "<p>Iluska nagyon sokat telefonál a barátnőivel. Hogy ne legyen túl sok a telefonszámlája, telefonálás közben gyakran ránéz a faliórára. Legutóbb, amikor Juliskát hívta, a következőre lett figyelmes: amikor Juliska felvette a telefont, pontosan 3 óra volt: a nagymutató és a kismutató éppen merőleges volt egymásra. Amikor letette a telefont, érdekes módon szintén éppen derékszöget zárt be a két mutató.</p><p>Legalább mennyibe került Juliskának ez a telefonhívás, ha 29 Ft a percdíja?<br><i>(Szolgáltatója perc alapon számláz, azaz a beszélgetés minden megkezdett percét ki kell fizetnie. Feltehtejük továbbá, hogy Iluska falióráján a mutatók folyamatosan, egyenletes sebességgel mozognak.)</i></p>",
        help1: "Rajzoljatok egy órát, és gondoljátok át, hogy legközelebb körülbelül mikor lesz a két mutató merőleges egymásra!",
        help2: "Bekövetkezik az óramutatók adott állása fél órán belül? Percenként hány fokot fordul a nagymutató?",
      },
    },
  },
  '0w5p4splau--derekszogu-haromszog-atfogojahoz': {
    answer: 15,
    content: {
      hu: {
        problemText: "<p>Egy derékszögű háromszög átfogójához tartozó magasságának a hossza negyede az átfogó hosszának. Hány fokos a háromszög legkisebb szöge?</p>",
        help1: "Ábrázoljátok a háromszöget, majd húzzatok be az ábrán egy megfelelő szakaszt!",
        help2: "A behúzandó szakasz az átló felezőpontját a derékszögű csúccsal összekötő szakasz. Keressetek szép háromszögeket az ábrán!",
      },
    },
  },
  '9jxllodsoz--tabla-minel-kevesebb': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>Egy \\(7\\times7\\)-es tábla minél kevesebb mezejét szeretnénk kiszínezni úgy, hogy már ne tudjuk lerakni az ábrán látható keresztet csupa színezetlen mezőre. Hány mezőt kell mindenképpen kiszínezni?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/5_D_B_13.png",
        help1: "Ha a kereszt le van rakva a táblára, akkor a közepe a belső 5&times;5-ös részben van.",
        help2: "A tábla középső 5&times;5-ös négyzetébe igen, de a középső 3&times;3-as négyzetbe már nem tartozó kisnégyzetek közül legalább hányat kell kiszínezni? Próbálkozzatok az 5&times;5-ös négyzet sarkaival vagy a sarkokkal szomszédos négyzetekből indulva.",
      },
    },
  },
  'mta2zbcdqe--durer-fogott-termeszetes': {
    answer: 6,
    content: {
      hu: {
        problemText: "<p>Dürer fogott egy természetes számot. Felírta a jegyeit fordított sorrendben is, és az így kapott két szám nagyobbikából kivonta a kisebbiket. A különbséget megszorozta egy tetszőleges 0-tól különböző számmal. A kapott számból letörölt egy számjegyet, így éppen a születési dátumát kapta: 14710521. Hányas számjegyet törölt le Dürer?</p>",
        help1: "Egy szám és a fordítottjának számjegyösszege megegyezik.",
        help2: "Mikor osztható egy szám 9-cel?",
      },
    },
  },
  '0jbf6g5h7m--rozoga-dobokockank-amelyrol': {
    answer: 31,
    content: {
      hu: {
        problemText: "<p>Van egy rozoga dobókockánk, amelyről minden dobáskor véletlenszerűen leesik valamelyik pötty. Kiszámoljuk, hogy mennyi a valószínűsége, hogy ha dobunk egyet a kockával, a tetején páros sok pötty lesz (úgy, hogy addigra már pontosan egy pötty leesik). Ha a törtet a legegyszerűbb alakra hozzuk, mi a számláló és a nevező összege?</p>",
        help1: "Hány pötty van összesen a dobókockán eredetileg?",
        help2: "Válasszátok szét a lehetséges eseteket aszerint, hogy hányast dobnánk, ha nem esne le a kockáról pötty!",
      },
    },
  },
  'jan80yfadg--varos-durer-rajongoklubjai': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>Négy város Dürer rajongóklubjai körmérkőzéses focibajnokságot rendeztek. Az alábbi táblázatban láthatjátok a torna végeredményét. Az első oszlopban a városok nevei; a második oszlopban az elért pontszámok (fociban a győzelemért 3, a döntetlenért 1, a vereségért 0 pontot adnak); az utolsó oszlopban pedig a csapatok által a teljes torna során rúgott, illetve kapott gólok száma látható (kötőjellel elválasztva). Hány gól esett a Miskolc-Nürnberg mérkőzésen?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/5_D_C_7.png",
        help1: "A táblázat alapján döntsétek el, hogy melyik mérkőzéseken lett döntetlen az eredmény, illetve ha volt nyertes, akkor ki nyert!",
        help2: "Hány gól esett a mérkőzéseken összesen? Mi lett az Ajtós-Velence meccs eredménye?",
      },
    },
  },
  'qcy2aixvp4--szamot-magikusnak-nevezunk': {
    answer: 30,
    content: {
      hu: {
        problemText: "<p>Egy \\(n\\) pozitív egész számot mágikusnak nevezünk, ha teljesül a következő: minden \\(n\\)-nél kisebb, \\(n\\)-hez relatív prím pozitív egész szám prím. Melyik a legnagyobb kétjegyű mágikus szám?</p>",
        help1: "Ha egy szám 4-nél nagyobb és mágikus, akkor kettővel osztható.",
        help2: "Ha egy szám 9-nél nagyobb és mágikus, akkor 3-mal osztható, és így tovább.",
      },
    },
  },
  '0233kvrd0j--egysegkockabol-osszeraktunk-kockat': {
    answer: 14,
    content: {
      hu: {
        problemText: "<p>27 egységkockából összeraktunk egy \\(3\\times3 \\times3\\)-as kockát. Legfeljebb hány kis kockát lehet elvenni az építményből úgy, hogy a maradék olyan összefüggő test legyen, amelynek felszíne nem kisebb a nagy kocka felszínénél?<br><i>Összefüggőségen lapösszefüggőséget értünk, vagyis hogy a maradék testben bármely kis kockától bármelyik másikig eljuthatunk lapszomszédos kockákon keresztül.</i></p>",
        help1: "Mekkora a felszíne az eredeti kockának?",
        help2: "Gondolkozzatok úgy, hogy egyesével rakhattok le kockákat egy 3&times;3&times;3-as rácsba, ahol a következő kockát mindig úgy rakhatjátok le, hogy az egyetlen lapban érintkezzen egy már addig lerakott kockával!",
      },
    },
  },
  'ec1fs6tir6--szocske-ugral-sikon': {
    answer: 210,
    content: {
      hu: {
        problemText: "<p>Egy szöcske ugrál a síkon. Az origóból indul, és minden ugrásával egy szomszédos rácspontra ugrik vízszintesen vagy függőlegesen. Hányféleképpen juthat el az \\((1,1)\\) pontba pontosan 6 ugrással, ha közben sosem ugrik a bal félsíkra?<br><i>Az \\(y\\) tengelyen lévő pontokra rá szabad ugrania.</i></p>",
        help1: "A szöcske páratlan sok ugrást fog végezni vízszintesen és függőlegesen is. Koncentráljatok külön-külön a kétféle irányra!",
        help2: "Válasszátok esetekre a lehetséges ugrássorozatokat aszerint, hogy a szöcske hányat ugrik vízszintesen!<br><i>Például 3 vízszintes ugrással kétféleképpen tud (összességében) eggyel jobbra kerülni.</i>",
      },
    },
  },
  'w312k5m9jn--tabla-minel-kevesebb': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>Egy \\(7\\times7\\)-es tábla minél kevesebb mezejét szeretnénk kiszínezni úgy, hogy már ne tudjuk lerakni az ábrán látható keresztet csupa színezetlen mezőre. Hány mezőt kell mindenképpen kiszínezni?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/5_D_C_11.png",
        help1: "Ha a kereszt le van rakva a táblára, akkor a közepe a belső 5&times;5-ös részben van.",
        help2: "A tábla középső 5&times;5-ös négyzetébe igen, de a középső 3&times;3-as négyzetbe már nem tartozó kisnégyzetek közül legalább hányat kell kiszínezni? Próbálkozzatok az 5&times;5-ös négyzet sarkaival vagy a sarkokkal szomszédos négyzetekből indulva.",
      },
    },
  },
  '39hbwcbmkn--darab-kulsore-teljesen': {
    answer: 3016,
    content: {
      hu: {
        problemText: "<p>Van 2012 darab külsőre teljesen egyforma, de csupa különböző súlyú golyónk, és egy olyan kétkarú mérlegünk, amelynek a serpenyőibe egyszerre csak 1-1 golyó fér. Szeretnénk kiválasztani a legkönnyebb és a legnehezebb golyót úgy, hogy összesen a lehető legkevesebb mérést végezzük a mérleggel. Hány mérésre van szükségünk ahhoz, hogy ezeket biztosan megtaláljuk?</p>",
        help1: "Ha csak a legkisebb (vagy csak a legnagyobb) tömegű golyót szeretnénk megtalálni, ahhoz hány mérést kell elvégeznünk?",
        help2: "Ha egy golyó egy mérésen a könnyebbiknek bizonyul, az már nem lehet a legnehezebb golyó, illetve fordítva.",
      },
    },
  },
  'em8mi5dfce--negyzet-oldalhossza-egyseg': {
    answer: 18,
    content: {
      hu: {
        problemText: "<p>Az \\(ABCD\\) négyzet oldalhossza 12 egység. A négyzet belsejében fekszik az \\(M\\) és az \\(N\\) pont úgy, hogy az \\(MN\\) egyenes nem halad át a négyzet egyik csúcsán sem. Határozzuk meg a legkisebb \\(k\\) értéket, amelyre igaz, hogy \\(M\\) és \\(N\\) tetszőleges választása esetén igaz, hogy {\\(A\\), \\(B\\), \\(C\\), \\(D\\), \\(M\\), \\(N\\)} halmazból kiválasztható úgy 3 csúcs, hogy az általuk meghatározott háromszög területe legfeljebb \\(k\\) négyzetegység!</p>",
        help1: "Nézzétek meg, mi történik néhány lehetséges pontelhelyezés esetén!",
        help2: "Ha már megtaláltátok a szerintetek megfelelő <em>k</em>-t,  a bizonyításhoz gondoljátok át, hogy {A, B, C, D}-ből két pontot kiválasztva, azok milyen helyeket zárnak ki <em>M</em>, illetve <em>N</em>-re!",
      },
    },
  },
  'g55kk1hyhz--durer-szervezo-focizni': {
    answer: 10,
    content: {
      hu: {
        problemText: "<p>Hat Dürer szervező focizni szeretne. Hányféleképpen lehet két háromfős csapatra osztani a hat szervezőt?</p>",
        help1: "Hányféleképpen lehet 3 szervezőt kiválasztani a 6 közül?",
        help2: "Két egyforma létszámú csapat keletkezik.",
      },
    },
  },
  't1jkw9o3gl--varosban-buszjaratnak-megalloja': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>Egy városban minden buszjáratnak 3 megállója van, bármely két megálló között van buszjárat, és bármely két buszjáratnak pontosan 1 közös megállója van. Tudjuk továbbá, hogy nincsen olyan buszjárat, amely az összes megállót érintené. Hány buszjárat van a városban?</p>",
        help1: "Legalább két buszjárat van a városban. Vegyétek fel egyesével az új buszjáratokat a szabályok szerint.",
        help2: "Mi a helyzet akkor, ha valamelyik megálló legalább négy járatnak is megállója? Mennyi a maximum, ha minden megállóban legfeljebb három járat találkozik?",
      },
    },
  },
  '85nebq56t7--varos-durer-rajongoklubjai': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>Négy város Dürer rajongóklubjai körmérkőzéses focibajnokságot rendeztek. Az alábbi táblázatban láthatjátok a torna végeredményét. Az első oszlopban a városok nevei; a második oszlopban az elért pontszámok (fociban a győzelemért 3, a döntetlenért 1, a vereségért 0 pontot adnak); az utolsó oszlopban pedig a csapatok által a teljes torna során rúgott, illetve kapott gólok száma látható (kötőjellel elválasztva). Hány gól esett a Miskolc-Nürnberg mérkőzésen?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/5_D_D_7.png",
        help1: "A táblázat alapján döntsétek el, hogy melyik mérkőzéseken lett döntetlen az eredmény, illetve ha volt nyertes, akkor ki nyert!",
        help2: "Hány gól esett a mérkőzéseken összesen? Hogyan oszlanak meg a miskolci csapat góljai?",
      },
    },
  },
  '2mob8ipgq7--tabla-minel-kevesebb': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>Egy \\(7\\times7\\)-es tábla minél kevesebb mezejét szeretnénk kiszínezni úgy, hogy már ne tudjuk lerakni az ábrán látható keresztet csupa színezetlen mezőre. Hány mezőt kell mindenképpen kiszínezni?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/5_D_D_10.png",
        help1: "Ha a kereszt le van rakva a táblára, akkor a közepe a belső 5&times;5-ös részben van.",
        help2: "A tábla középső 5&times;5-ös négyzetébe igen, de a középső 3&times;3-as négyzetbe már nem tartozó kisnégyzetek közül legalább hányat kell kiszínezni? Próbálkozzatok az 5&times;5-ös négyzet sarkaival vagy a sarkokkal szomszédos négyzetekből indulva.",
      },
    },
  },
  'o8ot71lg3d--nagy-korben-kis': {
    answer: 8,
    content: {
      hu: {
        problemText: "<p>Az ábrán a nagy körben egy kis kör és egy négyzet érinti egymást. A kis kör érinti a nagy kört és a négyzet függőleges egyeneseinek felfele való meghosszabbítását is. Mennyi &#945; tangense?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/5_D_D_11.png",
        help1: "Paraméterezzétek az ábrát a négyzet oldalhosszával, illetve a nagy kör sugarával!",
        help2: "Használjátok a Pitagorasz-tételt, illetve a kerületi- és középponti szögek tételét!",
      },
    },
  },
  'gb79fsi94b--kulonbozo-termeszetes-szam': {
    answer: 30,
    content: {
      hu: {
        problemText: "<p>Legyen \\(a\\) és \\(b\\) két olyan különböző természetes szám, amelyek számtani-, mértani- és harmonikus közepe is egész. Határozzátok meg \\(|a-b|\\) lehetséges legkisebb értékét!</p>",
        help1: "Írjátok fel <em>a</em>-t és <em>b</em>-t <em>k&times;c</em>, illetve <em>k&times;d</em> alakban, ahol <em>k</em> a legnagyobb közös osztójuk. Mit mond ekkor az a feltétel, hogy a mértani közepük egész?",
        help2: "Válasszátok szét az eseteket aszerint, hogy van-e <em>c</em> és <em>d</em> között páros szám. Mikor egyszerűsíthető a harmonikus közép mint tört?",
      },
    },
  },
};
