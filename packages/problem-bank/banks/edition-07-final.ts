import type { CompetitionBank, ProblemBank } from '../src/sources';

// Edition 7's final, relay only, as the relay practice site serves it: one
// competition per category, and the problems their relays use, each written
// once. Released, so the practice site may import it.

export const competitions: CompetitionBank = {
  'pyy0ajnbqk--07-final-a': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: '57e6xqa61x--albertnek-lany-fiu', points: 3 },
        { problemId: 'vgop66u1l2--albert-letra-kozepso', points: 3 },
        { problemId: 'ng1p9zahvb--albert-aki-altalanos', points: 3 },
        { problemId: 'dxokk7ilmz--szobaban-ketfele-szek', points: 3 },
        { problemId: 'ijq23p8bnh--nagyapa-szolt-unokaihoz', points: 4 },
        { problemId: '7xaln2ewq5--anti-hangya-lathato', points: 4 },
        { problemId: 'j24w5y4n5i--nehany-tojassal-kimentem', points: 4 },
        { problemId: '1ed4hpb6ki--albertfalva-ajtos-vezeto', points: 4 },
        { problemId: '7ldsi627t5--szamokat-beirni-feher', points: 5 },
        { problemId: '1t6cjkvk46--kifejezes-erteke', points: 5 },
        { problemId: 'i4ns1ho4oh--toltsuk-tablazat-ures', points: 5 },
        { problemId: 'ycbobpdoyg--szamitogep-kinyomtatta-novekvo', points: 5 },
        { problemId: 'lpq5vpdxx4--hurkolt-sokszoget-kesziteni', points: 6 },
        { problemId: 'fnatnfi6li--kaput-furcsa-zar', points: 6 },
        { problemId: '86awe37hxl--mal-oszthato-szam', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 7, round: 'final', category: 'A' },
  },
  'hv9jl6i3ym--07-final-b': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: '5kbagwurbw--futopalya-menten-egyenlo', points: 3 },
        { problemId: 'dtvlro93lp--kifejezes-erteke', points: 3 },
        { problemId: '8ny7ggwk9y--sikban-pont-egymastol', points: 3 },
        { problemId: 'n8fnyrzc0k--nehany-tojassal-kimentem', points: 3 },
        { problemId: 'hkqcptfzy1--altalatok-valasztott-szamjegy', points: 4 },
        { problemId: 'nb795ljtsu--albertfalva-ajtos-vezeto', points: 4 },
        { problemId: '2jzedzxxo3--ovodasok-meter-hosszu', points: 4 },
        { problemId: 'qee2fnht7c--teglatest-felszine-oldallapjainak', points: 4 },
        { problemId: 'ebooz2cfun--legkisebb-primszam-amelyik', points: 4 },
        { problemId: 'pdkcfm2ocl--szamitogep-kinyomtatta-novekvo', points: 5 },
        { problemId: 'yak7ztqhu3--haromszogben-jelolje-oldal', points: 5 },
        { problemId: 'tte7zf8vw1--hurkolt-sokszoget-kesziteni', points: 5 },
        { problemId: 'qla32mhjrr--kaput-furcsa-zar', points: 6 },
        { problemId: 'omb53my7vo--paratlan-egeszek-novekvo', points: 6 },
        { problemId: 'dklxb62k5n--tel-oszthato-hetjegyu', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 7, round: 'final', category: 'B' },
  },
  'r0ztthwwxb--07-final-c': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: '5kbagwurbw--futopalya-menten-egyenlo', points: 3 },
        { problemId: '8ny7ggwk9y--sikban-pont-egymastol', points: 3 },
        { problemId: 'f9okngas5m--biciklista-kiszamolta-teker', points: 3 },
        { problemId: 'lxzqmdumvy--tanar-kijavitotta-matekdolgozatokat', points: 3 },
        { problemId: 'ib0cnx5h8p--kerdesbol-allo-teszt', points: 4 },
        { problemId: 'g5i8bzcu3o--durer-egyenes-folyo', points: 4 },
        { problemId: 'yf3fp7egys--konvex-negyszog-oldalanak', points: 4 },
        { problemId: 'tfhpzmb3ak--szabalyos-agu-csillag', points: 4 },
        { problemId: '6kyoikfh0k--sorozat-elso-eleme', points: 4 },
        { problemId: 'dklxb62k5n--tel-oszthato-hetjegyu', points: 5 },
        { problemId: 'l7id1ad0z4--lathato-kor-atmeroje', points: 5 },
        { problemId: '1mtcl2yl61--erteket-kaphatunk-kulonbozo', points: 5 },
        { problemId: 'ba3v9q1w3y--valos-szamokrol-kovetkezoket', points: 6 },
        { problemId: 'n3if5q5ee2--feher-fekete-szinu', points: 6 },
        { problemId: '0sn5uoi8mq--szamokat-sorba-rakni', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 7, round: 'final', category: 'C' },
  },
};

export const problems: ProblemBank = {
  '57e6xqa61x--albertnek-lany-fiu': {
    answer: 23,
    content: {
      hu: {
        problemText: "<p>Albertnek 12 lány és 10 fiú osztálytársa van. Hány tanuló jár ebbe az osztályba?</p>",
        help1: "Albert is az osztály tagja.",
        help2: "Albert nem számolta magát, amikor az osztálytársait számolta.",
      },
    },
  },
  'vgop66u1l2--albert-letra-kozepso': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>Albert egy létra középső fokán áll. Lefele mászik három fokot, majd felfele öt fokot, végül lefelé hét fokot. Ekkor éppen a legalsó létrafokon áll. Hány foka van a létrának összesen? </p>",
        help1: "Gondolkodjatok visszafelé!",
        help2: "Például amikor végül lefelé hét lépcsőfokot mászott, és az első lépcsőfokra jutott, akkor a nyolcadik lépcsőfokról jött.",
      },
    },
  },
  'ng1p9zahvb--albert-aki-altalanos': {
    answer: 9,
    content: {
      hu: {
        problemText: "<p>Albert, aki általános iskolás, érdekes felfedezést tesz a születésnapján: <i>„Édesapám életkorát ma ugyanazzal a két számjeggyel lehet leírni, mint születésemkor.” </i> Hány éves Albert?</p>",
        help1: "Próbáljátok ki az apuka egy életkorát, például mi történne, ha az apuka 32 éves volt, amikor Albert született? És ha 35? (Vigyázat: Figyelmesen olvassátok el a kérdést!)",
        help2: "Cseréljétek fel minél több kétjegyű szám számjegyeit, a különbség mindig osztható egy bizonyos számmal, de vajon melyik ez?",
      },
    },
  },
  'dxokk7ilmz--szobaban-ketfele-szek': {
    answer: 6,
    content: {
      hu: {
        problemText: "<p>Egy szobában kétféle szék van: háromlábú suszterszék és négylábú karosszék. Minden széken ül egy gyerek. Így összesen 34 lábat tudunk megszámolni. Hány gyerek van a szobában?</p>",
        help1: "Hány láb tartozik egy székhez, amelyiken egy gyerek is ül?",
        help2: "Mi történne, ha csak háromlábú suszterszék lenne a szobában, és ha kicserélnénk néhányat négylábú karosszékre?",
      },
    },
  },
  'ijq23p8bnh--nagyapa-szolt-unokaihoz': {
    answer: 28,
    content: {
      hu: {
        problemText: "<p>Nagyapa így szólt unokáihoz: <i>„Ha minden unokámnak hét aranyat adnék, 24 aranyam maradna, de 32 arany hiányzik ahhoz, hogy mindegyiknek kilencet tudjak adni.”</i> Hány unokája van a nagyapának?</p>",
        help1: "Ha nagyapa először mindenkinek odaadja a 7 aranyat, majd szerez 32 aranyat, akkor a maradék aranyát hogy oszthatja szét?",
        help2: "MIndenkinek két aranyat ad a maradék 24-ből és a szerzett 32-ből.",
      },
    },
  },
  '7xaln2ewq5--anti-hangya-lathato': {
    answer: 8,
    content: {
      hu: {
        problemText: "<p>Anti, a hangya, az ábrán látható kocka A-val jelölt csúcsában lakik. Anti csak a kocka élein hajlandó közlekedni: egy élen pont egy óra alatt tud végigmenni. Szeretne körutazást tenni a kockán, melynek során az összes csúcsot bejárja.  Legalább hány óra szükséges egy ilyen körutazáshoz (a végén vissza is kell érnie a lakhelyére)?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/7_D_A_6.png",
        help1: "Minden csúcsba legalább egyszer eljut, megteheti-e ezt úgy, hogy csak az A csúcsban jár kétszer?",
        help2: "Az felső lap bejárása után hogyan járja be az alsó lapot?",
      },
    },
  },
  'j24w5y4n5i--nehany-tojassal-kimentem': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>Néhány tojással kimentem a piacra. Először eladtam egy idős hölgynek a tojásaim felét meg még fél tojást. Aztán jött egy úriember, aki megvette a megmaradt tojásaim felét és még egy fél tojást. Végül egy kislány vette meg a maradék felét és még fél tojást. A kislány vásárlása után nem maradt tojásom. Hány tojással indultam el reggel a piacra?<br><i>Egyetlen tojást sem törtem el a nap folyamán.</i></p>",
        help1: "Gondolkozzatok visszafelé!",
        help2: "Próbáljátok ki konkrét számokkal, ha 12 tojásom lett volna kezdetben, mi történt volna, és ha 11?",
      },
    },
  },
  '1ed4hpb6ki--albertfalva-ajtos-vezeto': {
    answer: 49,
    content: {
      hu: {
        problemText: "<p>Az Albertfalva és Ajtós között vezető országút mentén kilométerenként egy-egy oszlopot helyeztek el. Minden oszlopon két egész szám áll, ezek az oszlopnak Albertfalvától illetve Ajtóstól mért távolságát mutatják, kilométerben. Mindegyik oszlopra igaz, hogy a rajta szereplő számjegyek összege 13. Hány kilométerre van egymástól Albertfalva és Ajtós?</p>",
        help1: "Mikor romolhat el a számjegyek összege?",
        help2: "Mi történik, amikor az egyik szám a tízes helyiértéken is változik? Hogyan lehetne ezt kijavítani?",
      },
    },
  },
  '7ldsi627t5--szamokat-beirni-feher': {
    answer: 16,
    content: {
      hu: {
        problemText: "<p>Hányféleképpen lehet az 1, 2, 3, 4, 5 számokat beírni a fehér négyzetek helyére, ha mindegyik számot fel kell használnunk?</p><p><center>&#9633 &gt &#9633 &lt  &#9633  &gt &#9633 &lt  &#9633 </center></p>",
        help1: "Hová kerülhet az egyes?",
        help2: "A szimmetria segíti a számolást.",
      },
    },
  },
  '1t6cjkvk46--kifejezes-erteke': {
    answer: 1007,
    content: {
      hu: {
        problemText: "<p>Mennyi az alábbi kifejezés értéke?</p><p><center>\\((2+4+6+\\dots+2012+2014)-(1+3+5+\\dots+2011+2013)\\)</center></p>",
        help1: "Csoportosítsátok ügyesen a kifejezés tagjait.",
        help2: "Például: 2-1=1, 4-3=1 stb.",
      },
    },
  },
  'i4ns1ho4oh--toltsuk-tablazat-ures': {
    answer: 54,
    content: {
      hu: {
        problemText: "<p>Töltsük ki a táblázat üres mezőit pozitív egész számokkal úgy, hogy teljesüljön a következő állítás: akárhogyan is választunk ki a táblázatból három számot úgy, hogy mindegyik oszlopból és mindegyik sorból csak egyet válasszunk, a szorzat mindig ugyanaz lesz. <br> Mennyi a beírandó négy szám összege?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/7_D_A_11.png",
        help1: "Mik lehetnek a szorzat prímosztói?",
        help2: "Például a 21 osztható héttel, így a szorzatoknak is azoknak kell lenniük. Hogyan lehetne ezt elérni?",
      },
    },
  },
  'ycbobpdoyg--szamitogep-kinyomtatta-novekvo': {
    answer: 3371,
    content: {
      hu: {
        problemText: "<p>Egy számítógép kinyomtatta növekvő sorrendben az összes olyan négyjegyű számot, aminek mindegyik számjegye különböző. Hányadik a sorban a 7614?</p>",
        help1: "Érdemes esetekre bontani, például 7000-ig hány ilyen szám van?",
        help2: "Majd 7000 és 7600 között érdemese vizsgálódni. (Például olyan háromjegyű szám, amelyik 4-essel kezdődik és minden számjegye különböző: 9&sdot;8 van, mert a tízesek helyén nem állhat négyes, az egyesek helyén nem állhat négyes és a tízes helyiértéken levő számjegy.)",
      },
    },
  },
  'lpq5vpdxx4--hurkolt-sokszoget-kesziteni': {
    answer: 6,
    content: {
      hu: {
        problemText: "<p>Egy olyan hurkolt sokszöget szeretnénk készíteni, amelynek mindegyik oldala pontosan egy másik oldalát metszi; és egyetlen oldala sem megy át a végeitől különböző csúcson. Legkevesebb hány oldala kell legyen egy ilyen hurkolt sokszögnek?<br><i>Az alábbi ábra egy olyan hurkolt hétszöget mutat be, ami sajnos nem felel meg a feltételeknek, mert van egy oldala – a legalsó – amely egyetlen másik oldalt sem metsz.</i> </p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/7_D_A_13.png",
        help1: "Az oldalak száma lehet-e páratlan?",
        help2: "Elég-e négy oldal?",
      },
    },
  },
  'fnatnfi6li--kaput-furcsa-zar': {
    answer: 144,
    content: {
      hu: {
        problemText: "<p>Egy kaput furcsa zár őriz. Annak, aki be akar jutni, a mellékelt rajz vonalain kell végigvezetni mutatóujját úgy, hogy a hét csomópont közti tíz szakasz mindegyikét pontosan egyszer járja végig egyetlen folytonos vonalban, tehát az ujj elemelése nélkül. A sok lehetőség közül csak az egyik nyitja az ajtót. Ha mindenképpen be szeretnénk menni, legrosszabb esetben hányszor kell próbálkoznunk? </p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/7_D_A_14.png",
        help1: "Melyik csomópontból indulhat és melyikbe érkezhet a mutatóujja?",
        help2: "A szimmetria segít az esetek leszámolásában.",
      },
    },
  },
  '86awe37hxl--mal-oszthato-szam': {
    answer: 335,
    content: {
      hu: {
        problemText: "<p>Hány 13-mal osztható szám van a 7, 77, 777, 7777, \\(\\ldots\\) számsorozat első 2014 tagja között?</p>",
        help1: "Bontsátok prímtényezőkre az 1001-et.",
        help2: "Ha egy szám nem osztható 13-mal és hozzáadunk egy 13-mal oszthatót, akkor az eredmény osztható lesz-e 13-mal?",
      },
    },
  },
  '5kbagwurbw--futopalya-menten-egyenlo': {
    answer: 33,
    content: {
      hu: {
        problemText: "<p>Egy futópálya mentén egyenlő távolságokra 12 zászlót tűztek le. A verseny az első zászlótól indul, a cél a 12. zászlónál van. Az egyik futó a 6. zászlót 15 másodperc alatt érte el. Hány másodperc alatt futotta végig a pályát, ha végig egyenletes sebességgel haladt?</p>",
        help1: "A pályát a zászlók egyenlő részekre osztják, hány részt tett meg a hatodik zászlóig?",
        help2: "Mennyii idő alatt jut el egyik zászlótól a következőig? Összesen hány szakaszból áll a pálya?",
      },
    },
  },
  'dtvlro93lp--kifejezes-erteke': {
    answer: 1008,
    content: {
      hu: {
        problemText: "<p>Mennyi az alábbi kifejezés értéke?</p><p><center>\\(2-4+6-8+10-\\dots2010-2012+2014\\)</center></p>",
        help1: "Csoportosítsátok megfelelően az összeadandó számokat.",
        help2: "Párosítva az egymás utáni számokat, kényelmesen számolható. Kezdhetjük az összeadást akár 0-val is.",
      },
    },
  },
  '8ny7ggwk9y--sikban-pont-egymastol': {
    answer: 4,
    content: {
      hu: {
        problemText: "<p>Adott a síkban két pont, \\(A\\) és \\(B\\), egymástól 6 egység távolságra. Hány olyan egyenes van a síkban, amely az \\(A\\) ponttól 2, a \\(B\\) ponttól pedig 3 egység távolságra van?</p>",
        help1: "Hány olyan egyenes van amelyik metszi a szakaszt és jó?",
        help2: "Ezek az egyenesek valamilyen köröket érintenek, de melyek ezek a körök?",
      },
    },
  },
  'n8fnyrzc0k--nehany-tojassal-kimentem': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>Néhány tojással kimentem a piacra. Először eladtam egy idős hölgynek a tojásaim felét meg még fél tojást. Aztán jött egy úriember, aki megvette a megmaradt tojásaim felét és még egy fél tojást. Végül egy kislány vette meg a maradék felét és még fél tojást. A kislány vásárlása után nem maradt tojásom. Hány tojással indultam el reggel a piacra? </p><p><i>Egyetlen tojást sem törtem el a nap folyamán.</i></p>",
        help1: "Gondolkozzatok visszafelé!",
        help2: "Próbáljátok ki konkrét számokkal, ha 12 tojásom lett volna kezdetben, mi történt volna, és ha 11?",
      },
    },
  },
  'hkqcptfzy1--altalatok-valasztott-szamjegy': {
    answer: 6193,
    content: {
      hu: {
        problemText: "<p>1, 3, 4, 7 és egy általatok választott számjegy felhasználásával írjátok fel a lehető legnagyobb, 12-vel osztható ötjegyű számot. A kapott számot osszátok is el 12-vel. Mi lesz a hányados?</p>",
        help1: "Az utolsó néhány számjegyet nem tudjátok meghatározni? Mit érdemes előre írni?",
        help2: "A további jegyek kitalálásában szintén az oszthatóság segít, 12-vel melyek azok a számok, amelyek oszthatók?",
      },
    },
  },
  'nb795ljtsu--albertfalva-ajtos-vezeto': {
    answer: 49,
    content: {
      hu: {
        problemText: "<p>Albertfalva és Ajtós között vezető országút mentén kilométerenként egy-egy oszlopot helyeztek el. Minden oszlopon két szám áll, ezek az oszlopnak Albertfalvától illetve Ajtóstól való távolságát mutatják, kilométerben. Mindegyik oszlopra igaz, hogy a rajta szereplő számjegyek összege 13. Hány kilométerre van egymástól Albertfalva és Ajtós?</p>",
        help1: "Mikor romolhat el a számjegyek összege?",
        help2: "Mi történik, amikor az egyik szám a tízes helyiértéken is változik? Hogyan lehetne ezt kijavítani?",
      },
    },
  },
  '2jzedzxxo3--ovodasok-meter-hosszu': {
    answer: 9,
    content: {
      hu: {
        problemText: "<p>Óvodások 12 méter hosszú sorban sétálnak az utcán. A sor végén haladó óvónő egyszer csak előreszaladt, de ahogy a sor elejéhez ért, egyből sarkon fordult, és visszafutott a sor végére. Tudjuk, hogy az óvónő éppen háromszor olyan gyorsan futott, mint amilyen gyorsan a sor sétált. Hány méterrel jutott előrébb a sor az alatt az idő alatt, amíg az óvónő nem volt hátul?</p>",
        help1: "A sor és az óvónő egymáshoz viszonyított sebességét érdemes figyelni.",
        help2: "Amikor előre megy a tanárnő, akkor a sorral együtt  halad, így lassabban ér előre. Visszafelé gyorsabban, de hányszor lassabb vagy gyorsabb a két szakaszon?",
      },
    },
  },
  'qee2fnht7c--teglatest-felszine-oldallapjainak': {
    answer: 300,
    content: {
      hu: {
        problemText: "<p>Egy téglatest felszíne 280 cm<sup>2</sup> , oldallapjainak területe úgy aránylik egymáshoz, mint \\(3 : 5 : 6\\). Hány cm<sup>3</sup> a térfogata?</p>",
        help1: "Hogyan lehet megkapni az oldalak területéből a térfogatot?",
        help2: "Három különböző területű oldal szorzata mit ad?",
      },
    },
  },
  'ebooz2cfun--legkisebb-primszam-amelyik': {
    answer: 43,
    content: {
      hu: {
        problemText: "<p>Melyik a legkisebb prímszám, amelyik előáll két különböző prím összegeként is, három különböző prím összegeként is, négy különböző prím összegeként is, sőt még öt különböző prím összegeként is?</p>",
        help1: "Hogyan lehet egy prím két másik prím összege?",
        help2: "Öt különböző prím összegénél a legkisebb öt prím összege nem nagyobb.",
      },
    },
  },
  'pdkcfm2ocl--szamitogep-kinyomtatta-novekvo': {
    answer: 3478,
    content: {
      hu: {
        problemText: "<p>Egy számítógép kinyomtatta növekvő sorrendben az összes olyan négyjegyű számot, aminek mindegyik számjegye különböző. Hányadik a sorban a 7906?</p>",
        help1: "Érdemes esetekre bontani, például 7000-ig hány ilyen szám van?",
        help2: "Majd 7000 és 7900 között érdemese vizsgálódni.",
      },
    },
  },
  'yak7ztqhu3--haromszogben-jelolje-oldal': {
    answer: 300,
    content: {
      hu: {
        problemText: "<p>Az \\(ABC\\) háromszögben jelölje \\(D\\) az \\(AC\\) oldal felezőpontját és \\(E\\) a \\(BC\\) oldal \\(B\\)-hez közelebbi harmadolópontját. Az \\(AE\\) és a \\(BD\\) egyenesek metszéspontját jelölje \\(F\\). Ha a \\(BEF\\) háromszög területe 60 területegység, akkor mennyi a \\(CDFE\\) négyszög területe?</p>",
        help1: "A háromszög területe hogyan változik, ha az alapja kétszeresére, vagy háromszorosára nő?",
        help2: "Mekkora az AEB háromszög területe, ez hányad része az egész háromszög területének?",
      },
    },
  },
  'tte7zf8vw1--hurkolt-sokszoget-kesziteni': {
    answer: 6,
    content: {
      hu: {
        problemText: "<p>Egy olyan hurkolt sokszöget szeretnénk készíteni, amelynek mindegyik oldala pontosan egy másik oldalát metszi; és egyetlen oldala sem megy át a végeitől különböző csúcson. Legkevesebb hány oldala kell legyen egy ilyen hurkolt sokszögnek?<br><i>Az alábbi ábra egy olyan hurkolt hétszöget mutat be, ami sajnos nem felel meg a feltételeknek, mert van egy oldala – a legalsó – amely egyetlen másik oldalt sem metsz.</i></p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/7_D_B_12.png",
        help1: "Az oldalak száma lehet-e páratlan?",
        help2: "Elég-e négy oldal?",
      },
    },
  },
  'qla32mhjrr--kaput-furcsa-zar': {
    answer: 144,
    content: {
      hu: {
        problemText: "<p>Egy kaput furcsa zár őriz. Annak, aki be akar jutni, a mellékelt rajz vonalain kell végigvezetni mutatóujját úgy, hogy a hét csomópont közti tíz szakasz mindegyikét pontosan egyszer járja végig egyetlen folytonos vonalban, tehát az ujj elemelése nélkül. A sok lehetőség közül csak az egyik nyitja az ajtót. Ha mindenképpen be szeretnénk menni, legrosszabb esetben hányszor kell próbálkoznunk?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/7_D_B_13.png",
        help1: "Melyik csomópontból indulhat és melyikbe érkezhet a mutatóujja?",
        help2: "A szimmetria segít az esetek leszámolásában.",
      },
    },
  },
  'omb53my7vo--paratlan-egeszek-novekvo': {
    answer: 811,
    content: {
      hu: {
        problemText: "<p>A páratlan egészek növekvő méretű halmazokba vannak osztva az alábbi módon:</p><p><center>{1}, {3, 5}, {7, 9, 11}\\ {13, 15, 17, 19}, \\(\\ldots\\)</center> </p><p>Mi a legnagyobb eleme annak a halmaznak, amely a 777-et tartalmazza?</p>",
        help1: "Hányadik páratlan szám a 777?",
        help2: "Mennyi az első néhány szám összege? Például: 1+2+3+4=(1+4)+(2+3)=5+5=10",
      },
    },
  },
  'dklxb62k5n--tel-oszthato-hetjegyu': {
    answer: 32,
    content: {
      hu: {
        problemText: "<p>Hány olyan 7-tel osztható hétjegyű szám van, amiből kitörölve bármelyik számjegyét egy 7-tel osztható hatjegyű számot kapunk?</p>",
        help1: "Érdemes először kevesebb jegyű számokkal végiggondolni.",
        help2: "Mi történik, ha az első számjegyet töröljük? Ebből mire következtethetünk?",
      },
    },
  },
  'f9okngas5m--biciklista-kiszamolta-teker': {
    answer: 24,
    content: {
      hu: {
        problemText: "<p>Egy biciklista kiszámolta, hogy ha 30 km/h-val teker, akkor 11-re, ha 20 km/h-val, akkor délután 1-re ér célba. Mennyivel kell tekernie, ha pontosan délben szeretne befutni?</p>",
        help1: "Hány óra hosszat biciklizett volna, ha 11-re ér oda?",
        help2: "Írjatok fel két egyenletet a sebességre, ebből kiszámolható a menetidő és a távolság.",
      },
    },
  },
  'lxzqmdumvy--tanar-kijavitotta-matekdolgozatokat': {
    answer: 80,
    content: {
      hu: {
        problemText: "<p>Egy tanár kijavította a matekdolgozatokat, az eredmények 71, 76, 80, 82, 91 lettek. Valamilyen sorrendben számítógépbe írta a pontszámokat, és megfigyelte, hogy az első néhány pontszám átlaga mindig egész volt. Melyik pontszámot írta be utoljára?</p>",
        help1: "Számoljatok maradékokkal!",
        help2: "Hátulról érdemes kezdeni.",
      },
    },
  },
  'ib0cnx5h8p--kerdesbol-allo-teszt': {
    answer: 22,
    content: {
      hu: {
        problemText: "<p>Van egy 10 kérdésből álló teszt, ahol minden kérdésre igennel vagy nemmel lehet válaszolni. Akármilyen sorrendben adunk 5 igen és 5 nem választ, legalább 4 találatunk lesz. Hányféle lehet a teszt megoldókulcsa?</p>",
        help1: "Hány igaz lehet a helyes megoldások között?",
        help2: "Lehet-e például 6 igaz és 4 hamis? Próbáljátok minél rosszabb tesztet írni.",
      },
    },
  },
  'g5i8bzcu3o--durer-egyenes-folyo': {
    answer: 50,
    content: {
      hu: {
        problemText: "<p>Dürer egy egyenes folyó partján háromszög alakú telket szeretne bekeríteni. A feladat elvégzéséhez 20 méter kerítése van. A folyó felőli részhez nem kell kerítést felhasználnia, a folyó kellő védelmet nyújt. Hány négyzetméter lehet maximálisan a bekerített rész területe?</p>",
        help1: "A két kerítéses oldalt és a bezárt szögüket érdemes vizsgálni.",
        help2: "Adott két oldalhossz, mekkora bezárt szög esetén lesz a terület a legnagyobb?",
      },
    },
  },
  'yf3fp7egys--konvex-negyszog-oldalanak': {
    answer: 79,
    content: {
      hu: {
        problemText: "<p>Egy konvex négyszög három oldalának hossza 1, 4 és 8 egység, és a negyedik, leghosszabb oldal hosszát jelöljük \\(x\\)-szel. Mennyi \\(x^2\\), ha a négyszög átlói merőlegesek egymásra?</p>",
        help1: "Ha az átlók merőlegesek, akkor derékszögű háromszögeket kapunk.",
        help2: "Pitagorasz-tételt kell elég sokszor használni.",
      },
    },
  },
  'tfhpzmb3ak--szabalyos-agu-csillag': {
    answer: 60,
    content: {
      hu: {
        problemText: "<p>Mekkora a szabályos 9 ágú csillag ábrán jelölt külső szöge?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/7_D_C_8.png",
        help1: "Rajzoljatok egy egyszerűbb ábrát, amin csak néhány oldal szerepel.",
        help2: "Kerületi szögekkel számoljatok.",
      },
    },
  },
  '6kyoikfh0k--sorozat-elso-eleme': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>Egy sorozat első két eleme \\(a_1=1\\) és \\(a_2=2\\). A további elemeket mindig a két megelőző elemből számoljuk a következő módon: \\(a_{n+2}=\\)<b>szjö</b>\\((3\\cdot a_n+a_{n+1})\\), ahol <b>szjö</b>\\((x)\\) az \\(x\\) számjegyeinek összege. Például \\(a_3\\) értéke \\(3\\cdot a_1+a_2\\) számjegyeinek összege, vagyis 5. Mennyi \\(a_{2014}\\) értéke?</p>",
        help1: "Számoljátok ki az első néhány értéket!",
        help2: "Észrevettétek a mintázatot?",
      },
    },
  },
  'l7id1ad0z4--lathato-kor-atmeroje': {
    answer: 540,
    content: {
      hu: {
        problemText: "<p>Legyen \\(AB=30\\) az ábrán látható kör átmérője. Ha \\(CE=3EB\\), és \\(DC=2DA\\), akkor mennyi az \\(ABC\\) háromszög területe?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/7_D_C_11.png",
        help1: "Hogyan szerkesztenétek meg a C pontot?",
        help2: "Nagyítsátok a kört megfelelően.",
      },
    },
  },
  '1mtcl2yl61--erteket-kaphatunk-kulonbozo': {
    answer: 32,
    content: {
      hu: {
        problemText: "<p>Hányféle értéket kaphatunk az \\(1 : 2 : 3 : 5 : 7 : 11 : 13\\) különböző (értelmes) zárójelezéseivel?<br><i>Egy zárójelezésben minden formulabeli osztáshoz egy zárójelpár tartozik; a nyitó zárójel és a kettőspont közötti érték az osztandó, a kettőspont és a záró zárójel közötti rész az osztó. Például \\((((1 : 2) : ((3 : 5) : 7)) : (11 : 13))\\) egy megfelelő zárójelezés.</i></p>",
        help1: "Próbáljátok ki kisebb értékekre, például 1:2:3-ra vagy 1:2:3:5-re.",
        help2: "Az osztásokat elvégezve egy törtet kapunk, van-e olyan tényező, ami nem kerülhet a nevezőben? És olyan, ami a számlálóba?",
      },
    },
  },
  'ba3v9q1w3y--valos-szamokrol-kovetkezoket': {
    answer: 300,
    content: {
      hu: {
        problemText: "<p>Az \\(a\\), \\(b\\), \\(x\\), \\(y\\) \\(\\geq\\)0 valós számokról a következőket tudjuk:</p><p><ul style=\"list-style-type:none;\"><li>\\(ax\\leq 100\\)<li>\\(ay\\leq 100\\)<li>\\(bx\\leq 100\\)<li>\\(by\\leq50\\)</ul></p><p>Mennyi lehet legfeljebb \\(ax+ay+bx+by\\) értéke?</p>",
        help1: "<em>a</em> és <em>b</em>-t megszorozhatjuk bármilyen pozitív <em>s</em> számmal, <em>x</em> és <em>y</em>-ot pedig <em>1/s</em>-el, és ugyanolyan megoldást kapunk, így az általánosság megszorítása nélkül feltehetjük <em>b</em> értékét.",
        help2: "Tegyük fel, hogy <em>b=1</em>, és vizsgáljunk meg két esetet, ha <em>a<=2</em> és ha <em>a>=2</em>.",
      },
    },
  },
  'n3if5q5ee2--feher-fekete-szinu': {
    answer: 3472,
    content: {
      hu: {
        problemText: "<p>Egy fehér és egy fekete színű futót hányféleképpen helyezhetünk el a \\(8\\times8\\)-as sakktáblán, hogy ne üssék egymást?<br><i>A tábla elforgatásával egymásba vihető állások különbözőnek számítanak.</i></p>",
        help1: "Nézzetek eseteket az egyik futó elhelyezkedése szerint.",
        help2: "Érdemes a rossz elhelyezéseket számolni. Egy középen álló futó 14 helyet zár el a másik elől, egy szélen álló csak 8-at, mi a helyzet a többivel?",
      },
    },
  },
  '0sn5uoi8mq--szamokat-sorba-rakni': {
    answer: 1013,
    content: {
      hu: {
        problemText: "<p>Az 1, 2, 3, \\(\\ldots\\), 10 számokat hányféleképpen lehet sorba rakni úgy, hogy pontosan egyszer forduljon elő olyan, amikor egy szám után közvetlenül egy nála kisebb következik? <br><i>Például: 2, 5, 6, 9, 10, 1, 3, 4, 7, 8 egy lehetséges sorbarendezés.</i></p>",
        help1: "A jó sorozatok két hasonló részből állnak.",
        help2: "Az első növő szakasz elemeinek kiválasztása meghatározza az egész sorozatot.",
      },
    },
  },
};
