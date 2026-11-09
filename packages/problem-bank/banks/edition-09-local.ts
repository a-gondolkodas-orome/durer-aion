import type { CompetitionBank, ProblemBank } from '../src/sources';

// Edition 9's local round, relay only, as the relay practice site serves it: one
// competition per category, and the problems their relays use, each written
// once. Released, so the practice site may import it.

export const competitions: CompetitionBank = {
  'tvzhj3b2vq--09-local-a': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: '36uztndo0a--nevenincs-kiralynak-derek', points: 3 },
        { problemId: '5w8nutgr8q--ajtosi-foutca-menten', points: 3 },
        { problemId: 'vb1mkvrm4l--szamokat-allitjuk-parba', points: 3 },
        { problemId: 'zk0pyvmmfu--pompom-ismerose-radirpok', points: 3 },
        { problemId: 'jt1hoc18on--gondoltam-szamra-kivontam', points: 4 },
        { problemId: 'wdlyy84z8f--focistanak-haromfele-szinu', points: 4 },
        { problemId: 'asm6irwc4y--babonas-szallodatulajdonos-egyesevel', points: 4 },
        { problemId: 'ix0ndv3fxk--ugyesne-estere-vendegeket', points: 4 },
        { problemId: 'xulwltjp3g--szobaban-ember-lovagok', points: 5 },
        { problemId: 'hwyhe399wl--konyv-elso-szamozott', points: 5 },
        { problemId: '2nr97t8vk4--berci-dedapja-januar', points: 5 },
        { problemId: 'bznii0rkf0--lathato-nagy-negyzet', points: 5 },
        { problemId: 'sgduv4pr87--negyzetet-hatarolnak-vonalai', points: 6 },
        { problemId: 'ty1llpzn67--ird-szamokat-ures', points: 6 },
        { problemId: 'c8u38nopii--albrecht-fuzetebe-irogatva', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 9, round: 'local', category: 'A' },
  },
  'y7ev80b2v8--09-local-b': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'i96hwzkwkw--ajtosi-foutca-menten', points: 3 },
        { problemId: 'k7q9i629e1--gondoltam-szamra-hozzaadtam', points: 3 },
        { problemId: 'yfsh4pchyq--szam-szorzata-legnagyobb', points: 3 },
        { problemId: 'bex6mf9pis--babonas-szallodatulajdonos-egyesevel', points: 3 },
        { problemId: '2nr97t8vk4--berci-dedapja-januar', points: 4 },
        { problemId: 'wjl97jewkp--negyzet-teglalap-kerulete', points: 4 },
        { problemId: 'wrvqlaeipt--szamok-szorzat-erteke', points: 4 },
        { problemId: '3nswy8gcsd--egyik-durer-szervezo', points: 4 },
        { problemId: '8hggictfcd--lathato-szabalyos-haromszog', points: 5 },
        { problemId: '1nznaqe8q8--kovetkezo-tagu-sorozat', points: 5 },
        { problemId: '9sqi7zg5ec--ird-szamokat-ures', points: 5 },
        { problemId: '6oro0s733y--albrecht-kedvenc-szama', points: 5 },
        { problemId: '6jswq3r798--kor-menten-szam', points: 6 },
        { problemId: 'cr4alyc2if--albrecht-fuzetebe-irogatva', points: 6 },
        { problemId: '4z80oj8pc2--varosok-ugyanazon-folyo', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 9, round: 'local', category: 'B' },
  },
};

export const problems: ProblemBank = {
  '36uztndo0a--nevenincs-kiralynak-derek': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>Nevenincs királynak 4 derék fia van, mindegyik fiúnak egy leánytestvére (édestestvére). Ha a király minden gyermekének egyenlő részt akar adni, hányfelé kell elosztania a birodalmát?</p>",
        help1: "A fiúk is mindannyian testvérek. Mindegyikőjüknek egy lánytestvére van",
        help2: "Fiúból 4 van, lányból 1",
      },
    },
  },
  '5w8nutgr8q--ajtosi-foutca-menten': {
    answer: 15,
    content: {
      hu: {
        problemText: "<p>Az ajtósi főutca mentén 15 villanyoszlop áll egyenlő távolságokra egymástól. Albrecht az első villanyoszloptól elfutott az utolsóig, így összesen 210 métert tett meg. Hány méter van két szomszédos villanyoszlop között?</p>",
        help1: "Ha 15 villanyoszlop van, egyforma távolságokra, akkor a az elsőtől a másodikig 1 szakaszt fut le, az elsőtől a harmadikig 2 szakaszt stb., az elsőtől a tizenötödikig 14 szakaszt fut le",
        help2: "A villanyoszlopok 14 egyenlő részre osztják a 210 métert.",
      },
    },
  },
  'vb1mkvrm4l--szamokat-allitjuk-parba': {
    answer: 20,
    content: {
      hu: {
        problemText: "<p>A 10, 20, 35, 30, 45, 25, 5 és 50 számokat úgy állítjuk párba, hogy minden párban ugyanannyi a két szám összege. Melyik szám a 35 párja?</p>",
        help1: "Mennyi lesz egy párban a számok összege?",
        help2: "A legnagyobb szám a legkisebbel áll párban.",
      },
    },
  },
  'zk0pyvmmfu--pompom-ismerose-radirpok': {
    answer: 13,
    content: {
      hu: {
        problemText: "<p>Pompom ismerőse, Radírpók megtámadta a városka toronyóráját. Először a 2-es számot radírozta le az óra számlapjáról, majd az óra járásával megegyező irányban haladva, minden harmadik, még épen maradt jelzést. Amikor Pompom rávette, hogy hagyja abba, akkor már csak két szám maradt meg. Mennyi a két megmaradt szám összege?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/9_H_A_4.png",
        help1: "Csináljátok Radírpók után a folyamatot!",
        help2: "Próbáljátok meg még egyszer!",
      },
    },
  },
  'jt1hoc18on--gondoltam-szamra-kivontam': {
    answer: 17,
    content: {
      hu: {
        problemText: "<p>Gondoltam egy számra. Kivontam belőle 9-et, majd megszoroztam 9-cel. Ezután hozzáadtam 9-et és végül elosztottam 9-cel. Eredményül 9-et kaptam. Melyik számra gondoltam az elején?</p>",
        help1: "Gondolkodjunk visszafelé!",
        help2: "Ha a kiinduló szám x, akkor mit kapunk a végén?",
      },
    },
  },
  'wdlyy84z8f--focistanak-haromfele-szinu': {
    answer: 18,
    content: {
      hu: {
        problemText: "<p>Egy focistának háromféle színű (piros, kék, sárga) meze, háromféle színű (barna, zöld, fekete) nadrágja és kétféle (szürke, fehér) lábszárvédője van. Hányféleképpen tud felöltözni az edzésekre?<br><i>Két öltözet akkor számít különbözőnek, ha a mez, a nadrág vagy a lábszárvédő színe eltér.</i></p>",
        help1: "Hányféle nadrág-lábszárvédő összeállítás van?",
        help2: "Ezek mindegyikéhez 3-féle mez tartozik, tehát 3-szor kell megszámolni.",
      },
    },
  },
  'asm6irwc4y--babonas-szallodatulajdonos-egyesevel': {
    answer: 114,
    content: {
      hu: {
        problemText: "<p>Egy babonás szállodatulajdonos egyesével megszámozta a szálloda 100 szobáját. 1-től kezdte a számozást, azonban kihagyta azokat a sorszámokat, amelyek oszthatóak voltak 13- mal, vagy a számjegyösszegük 13 volt. Hányas sorszámot kapott a legutolsó szoba?</p>",
        help1: "Melyik szobákat hagyta ki a számozásnál?",
        help2: "100-nál nagyobb számokat is kihagyhatott.",
      },
    },
  },
  'ix0ndv3fxk--ugyesne-estere-vendegeket': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>Ügyesné estére vendégeket vár. Először 25 szendvicset készített. Kiszámította, hogy minden vendég elvehet kettőt, de három már nem jutna mindenkinek. Gondolta, hogy ha készít még 10 szendvicset, akkor mindenkinek jut három, de négy már nem mindenkinek. Ez még mindig kevésnek tűnt. Végül összesen 52 szendvicset készített. Így minden vendégnek jutott négy szendvics, de öt már nem. Hány vendéget várt Ügyesné?<br><i>Ügyesné diétát tart, este már semmit nem eszik.</i></p>",
        help1: "Milyen korlátok közé eshet a vendégek számának 2-szerese, 3-szorosa, 4-szerese, 5-szöröse?",
        help2: "Próbáljátok ki, melyik szám felel meg a korlátoknak!",
      },
    },
  },
  'xulwltjp3g--szobaban-ember-lovagok': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>Egy szobában 11 ember ül, lovagok és lókötők vegyesen. A lovagok mindig igazat mondanak, a lókötők mindig hazudnak. Arra a kérdésre, hogy hány lókötő van köztük, sorban a következő számokat válaszolták: 7, 9, 7, 9, 6, 5, 7, 4, 0, 9, 7.</p><p>Hány lókötő van közöttük, ha tudjuk, hogy lovag is van a szobában?</p>",
        help1: "A lovagok mind azonos számot mondtak, és a lókötők ezt nem mondhatták.",
        help2: "Olyan választ kell keresni, hogy az ilyen válaszok száma és a válasz értékének összege 11 legyen.",
      },
    },
  },
  'hwyhe399wl--konyv-elso-szamozott': {
    answer: 216,
    content: {
      hu: {
        problemText: "<p>Egy könyv első számozott oldala a 2. oldal, utána már minden oldal számozva van. Mi az utolsó oldalon látható szám, ha összesen 539 számjegyet használtak fel az oldalak sorszámozására?</p>",
        help1: "Csoportosítsátok az oldalszámokat számjegyek száma szerint!",
        help2: "8 db egyjegyű és 90 db kétjegyű mellett hány háromjegyű számot használtak?",
      },
    },
  },
  '2nr97t8vk4--berci-dedapja-januar': {
    answer: 1892,
    content: {
      hu: {
        problemText: "<p>Berci dédapja január 1-én született a 19. század második felében. Berci azt meséli, hogy dédapja, az \\(x^2\\) . évben éppen \\(x\\) éves volt (\\(x\\) egész szám). Melyik évben született Berci dédapja?</p>",
        help1: "Milyen négyzetszámok vannak 1850 és 2015 között?",
        help2: "Ezek közül melyik felel meg a feltételnek, és mi lehetett a születési év?",
      },
    },
  },
  'bznii0rkf0--lathato-nagy-negyzet': {
    answer: 12,
    content: {
      hu: {
        problemText: "<p>Az ábrán látható nagy négyzet oldala 5 egység hosszú, az oldalait öt-öt egyenlő részre osztottuk. Hány négyzetegység a szürkére festett négyszög területe?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/9_H_A_12.png",
        help1: "Bontsátok háromszögekre az ábrát (esetleg átfedéssel)!",
        help2: "Minden háromszög egy téglalap felét tölti ki.",
      },
    },
  },
  'sgduv4pr87--negyzetet-hatarolnak-vonalai': {
    answer: 67,
    content: {
      hu: {
        problemText: "<p>Hány négyzetet határolnak az ábra vonalai?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/9_H_A_13.png",
        help1: "Csoportosítsátok a négyzeteket méret szerint!",
        help2: "Számoljátok össze eszerint a négyzeteket!",
      },
    },
  },
  'ty1llpzn67--ird-szamokat-ures': {
    answer: 208,
    content: {
      hu: {
        problemText: "<p>Írd be a 2, 4, 6, 8, 12, 14 és 21 számokat az üres mezőkbe úgy, hogy mind a négy szakaszon ugyanannyi legyen a három ráírt szám szorzata. Mennyi a jobb alsó körbe írt szám 100-szorosának és a jobb felső körbe írt számnak az összege?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/9_H_A_14.png",
        help1: "Prímtényezők szerint nézzétek meg, mit hova írhatunk!",
        help2: "A 7-tel osztható 2 szám helye egyértelmű, mert a 21 osztható 3-mal is.",
      },
    },
  },
  'c8u38nopii--albrecht-fuzetebe-irogatva': {
    answer: 792,
    content: {
      hu: {
        problemText: "<p>Albrecht a füzetébe írogatva észrevette, hogy 132 = 13 + 12 + 21 + 23 + 31 + 32, azaz egy csupa különböző számjegyekből álló háromjegyű szám számjegyeiből az összes lehetséges módon kialakítva a különböző számjegyeket tartalmazó kétjegyű számokat, majd ezeknek a kétjegyű számoknak az összegét véve éppen az eredeti háromjegyű számot kapta. Albrecht ezt nagyon érdekesnek találta, ezért megkereste az összes ilyen háromjegyű számot. Mennyi ezen számok összege?</p>",
        help1: "Az abc számból milyen kétjegyű számok képezhetők?",
        help2: "Írjátok fel a kívánt egyenlőséget, és oldjátok meg számjegyekre!",
      },
    },
  },
  'i96hwzkwkw--ajtosi-foutca-menten': {
    answer: 30,
    content: {
      hu: {
        problemText: "<p>Az ajtósi főutca mentén 15 villanyoszlop áll egyenlő távolságokra egymástól. Albrecht az első villanyoszloptól elfutott az utolsóig, így összesen 420 métert tett meg. Hány méter van két szomszédos villanyoszlop között?</p>",
        help1: "Ha 15 villanyoszlop van, egyforma távolságokra, akkor a az elsőtől a másodikig 1 szakaszt fut le, az elsőtől a harmadikig 2 szakaszt stb., az elsőtől a tizenötödikig 14 szakaszt fut le",
        help2: "A villanyoszlopok 14 egyenlő részre osztják a 420 métert.",
      },
    },
  },
  'k7q9i629e1--gondoltam-szamra-hozzaadtam': {
    answer: 1,
    content: {
      hu: {
        problemText: "<p>Gondoltam egy számra. Hozzáadtam 9-et, majd megszoroztam 9-cel. Ezután kivontam 9-et és végül elosztottam 9-cel. Eredményül 9-et kaptam. Melyik számra gondoltam az elején?</p>",
        help1: "Gondolkodjunk visszafelé!",
        help2: "Ha a kiinduló szám x, akkor mit kapunk a végén?",
      },
    },
  },
  'yfsh4pchyq--szam-szorzata-legnagyobb': {
    answer: 20,
    content: {
      hu: {
        problemText: "<p>Három pozitív egész szám szorzata 112. A legnagyobb közülük 7-szerese a legkisebbnek. Mennyi a keresett három szám összege?</p>",
        help1: "Mit tudunk felírni, ha a legkisebb szám x, és a középső y?",
        help2: "Mikor lesz a lehetőségek közül x a legkisebb és 7x a legnagyobb?",
      },
    },
  },
  'bex6mf9pis--babonas-szallodatulajdonos-egyesevel': {
    answer: 114,
    content: {
      hu: {
        problemText: "<p>Egy babonás szállodatulajdonos egyesével megszámozta a szálloda 100 szobáját. 1-től kezdte a számozást, azonban kihagyta azokat a sorszámokat, amelyek oszthatóak voltak 13-mal, vagy a számjegyeösszegük 13 volt. Hányas sorszámot kapott a legutolsó szoba?</p>",
        help1: "Melyik szobákat hagyta ki a számozásnál?",
        help2: "100-nál nagyobb számokat is kihagyhatott.",
      },
    },
  },
  'wjl97jewkp--negyzet-teglalap-kerulete': {
    answer: 441,
    content: {
      hu: {
        problemText: "<p>Egy nem négyzet téglalap kerülete 140 cm. A téglalapot 2 párhuzamos egyenessel 3 egybevágó téglalapra bontjuk. A 3 darabból az eredeti téglalap területével megegyező területű négyzetet állítottunk össze. Hány cm<sup>2</sup> ez a terület?</p>",
        help1: "Készítsetek ábrát!",
        help2: "A négyzet úgy áll elő, hogy a 3 egymás melletti darabot egymásra rakjuk.",
      },
    },
  },
  'wrvqlaeipt--szamok-szorzat-erteke': {
    answer: 90,
    content: {
      hu: {
        problemText: "<p>\\(w\\), \\(x\\) és \\(y\\) pozitív egész számok. Mennyi az \\(w\\cdot x\\cdot y\\) szorzat értéke, ha teljesül a következő egyenlet? </p><p> <center>\\(\\frac{97}{19}=w+\\frac1{x+\\frac1y}\\)</center></p>",
        help1: "Milyen határok közé esik az összeg második tagja?",
        help2: "w=5, mert a második tag 0 és 1 közötti, hasonlóan számítható x is",
      },
    },
  },
  '3nswy8gcsd--egyik-durer-szervezo': {
    answer: 2021,
    content: {
      hu: {
        problemText: "<p>Az egyik Dürer szervező 1993.12.30.-án született, ami csütörtökre esett. Melyik lesz a 2016 utáni első év, amelyben csütörtökre esni a születésnapja?</p>",
        help1: "Hány nappal esik arrébb évente a születésnap?",
        help2: "Hány szökőév volt az eltelt idő alatt?",
      },
    },
  },
  '8hggictfcd--lathato-szabalyos-haromszog': {
    answer: 40,
    content: {
      hu: {
        problemText: "<p>Az ábrán látható \\(ABC\\) szabályos háromszög területe 120 egység. \\(D\\), \\(E\\) és \\(F\\) harmadolópontok. Hány egység a szürke háromszög területe?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/9_H_B_9.png",
        help1: "Hány egység a fehér rész területe?",
        help2: "Az AEF háromszög alapja 2/3-szorosára változik, magassága 1/3-szorosára változik.",
      },
    },
  },
  '1nznaqe8q8--kovetkezo-tagu-sorozat': {
    answer: 76,
    content: {
      hu: {
        problemText: "<p>Adott a következő 100 tagú sorozat: \\(1^1\\) , \\(1^2\\) , \\(1^3\\) , . . . , \\(1^10\\) , \\(2^1\\) , \\(2^2\\) , . . . , \\(2^10\\) , \\(3^1\\) , \\(3^2\\) , . . . , \\(10^9\\) , \\(10^10\\) Hány különböző szám található ebben a sorozatban?</p>",
        help1: "Melyik számok egyezhetnek meg?",
        help2: "A 2-hatványok és a 3-hatványok közül melyik hányszor szerepel?",
      },
    },
  },
  '9sqi7zg5ec--ird-szamokat-ures': {
    answer: 208,
    content: {
      hu: {
        problemText: "<p>Írd be a 2, 4, 6, 8, 12, 14 és 21 számokat az üres mezőkbe úgy, hogy mind a négy szakaszon ugyanannyi legyen a három ráírt szám szorzata. Mennyi a jobb alsó körbe írt szám 100-szorosának és a jobb felső körbe írt számnak az összege?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/9_H_B_11.png",
        help1: "Prímtényezők szerint nézzétek meg, mit hova írhatunk!",
        help2: "A 7-tel osztható 2 szám helye egyértelmű, mert a 21 osztható 3-mal is.",
      },
    },
  },
  '6oro0s733y--albrecht-kedvenc-szama': {
    answer: 64,
    content: {
      hu: {
        problemText: "<p>Albrecht kedvenc száma a 857304000, azaz nyolcszázötvenhétmillió-háromszáznégyezer. Hány négyzetszám van az osztói között?</p>",
        help1: "Írjátok fel a prímtényezős felbontását a számnak!",
        help2: "Azok a négyzetszám osztók, amelyekben minden prímtényező kitevője páros.",
      },
    },
  },
  '6jswq3r798--kor-menten-szam': {
    answer: 997,
    content: {
      hu: {
        problemText: "<p>Egy kör mentén 999 szám áll, mindegyik 1 vagy -1. Tekintem a 8 szomszédos számból álló csoportokat, minden csoportban összeszorzom a benne szereplő számokat. Az így kapott 999 darab szorzatot összeadom. Mennyi az így kapott összeg legkisebb lehetséges értéke?<br><i>A válasz egy negatív szám, a válaszmezőbe az abszolútértékét írjátok.</i></p>",
        help1: "El tudjuk-e érni, hogy minden szorzat negatív legyen?",
        help2: "El tudjuk-e érni, hogy 1 kivételével minden szorzat negatív legyen?",
      },
    },
  },
  'cr4alyc2if--albrecht-fuzetebe-irogatva': {
    answer: 792,
    content: {
      hu: {
        problemText: "<p>Albrecht a füzetébe írogatva, észrevette, hogy 132 = 13 + 12 + 21 + 23 + 31 + 32, azaz egy csupa különböző számjegyekből álló háromjegyű szám számjegyeiből az összes lehetséges módon kialakítva a különböző számjegyeket tartalmazó kétjegyű számokat, majd ezeknek a kétjegyű számoknak az összegét véve éppen az eredeti háromjegyű számot kapta. Albrecht ezt nagyon érdekesnek találta, ezért megkereste az összes ilyen háromjegyű számot.</p>",
        help1: "Az abc számból milyen kétjegyű számok képezhetők?",
        help2: "Írjátok fel a kívánt egyenlőséget, és oldjátok meg számjegyekre!",
      },
    },
  },
  '4z80oj8pc2--varosok-ugyanazon-folyo': {
    answer: 25,
    content: {
      hu: {
        problemText: "<p>\\(A\\) és \\(B\\) városok ugyanazon folyó mentén fekszenek, egymástól több, mint két órányi evezésre. Egyik nap a kajakos klub tíz tagja a következő módon evez a folyón: 8-kor, negyed 9-kor, fél 9-kor, háromnegyed 9-kor és 9-kor is elindul egy kajakos \\(A\\)-ból \\(B\\) felé; egy másik pedig \\(B\\)-ből \\(A\\) felé. Ha két kajak szembetalálkozik, akkor evezőseik kezet fognak, majd mindkét hajó megfordul, és elindul az eddigi haladási irányával ellentétes irányban. Ha egy kajak \\(A\\)-ba vagy \\(B\\)-be ér, azonnal kiköt. Mire a nap lemegy, mind a tíz hajó kikötött.</p><p>Hány kézfogás történt összesen?</p>",
        help1: "Tekinthetjük úgy, hogy nem fordulnak meg a kajakosok, csak elmennek egymás mellett.",
        help2: "Ekkor a találkozások száma ugyanaz lesz, mint eredetileg a kézfogások száma.",
      },
    },
  },
};
