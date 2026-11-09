import type { CompetitionBank, ProblemBank } from '../src/sources';

// Edition 2's final, relay only, as the relay practice site serves it: one
// competition per category, and the problems their relays use, each written
// once. Released, so the practice site may import it.

export const competitions: CompetitionBank = {
  'khdxtg0pdf--02-final-b': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: '1826q69qp6--kiskockabol-allo-feher', points: 3 },
        { problemId: 'fah38v0ubj--tucsok-felizgatta-magat', points: 3 },
        { problemId: 'edz9ebah97--durerek-telke-kornyeken', points: 3 },
        { problemId: 'v0c9js9aa4--hajo-kapitany-egyutt', points: 4 },
        { problemId: '3pdw4wryxk--egyseg-teruletu-konvex', points: 4 },
        { problemId: '5vi1czpisu--egyenes-faagon-egymastol', points: 4 },
        { problemId: 'k2i5zrzvai--orszag-varosai-kozt', points: 4 },
        { problemId: 'udtx4f7tuw--szigeten-lovagok-mindig', points: 5 },
        { problemId: 's21xfbnxq2--kifejezes-erteke', points: 5 },
        { problemId: 'qitycwjeip--szamok-kitoroljuk-azokat', points: 5 },
        { problemId: 'ha75edrimd--tablazat-negyzetet-pirosra', points: 6 },
        { problemId: 'v8jsemtoui--osszes-osztojanak-osszeget', points: 6 },
        { problemId: 'w2s6o5dm4w--irjuk-szamokat-tol', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 2, round: 'final', category: 'B' },
  },
  '0f2sb1p6ac--02-final-c': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'gvoan55m0w--szo-anagrammainak-nevezzuk', points: 3 },
        { problemId: 'zenq9bwky9--egyseg-teruletu-konvex', points: 3 },
        { problemId: 'sm0r8zjz95--napoleon-huszart-vezet', points: 3 },
        { problemId: 'xfh37nuby8--orszag-varosai-repulojaratok', points: 4 },
        { problemId: 'y4mwkn5ovy--durer-urasag-elment', points: 4 },
        { problemId: 'lghyxdk46t--szamjegyeinek-szama-osszeg', points: 4 },
        { problemId: 'a912sh7xqd--haromszog-amelynek-oldalai', points: 4 },
        { problemId: '311uzvcoas--hatarozzuk-darab-kilences', points: 5 },
        { problemId: 'nft3f6a57s--sikon-pont-semelyik', points: 5 },
        { problemId: 'w2s6o5dm4w--irjuk-szamokat-tol', points: 5 },
        { problemId: 'wlsja86ujf--legkisebb-hatjegyu-negyzetszam', points: 6 },
        { problemId: 'v9v60opt26--jelolje-szam-szamjegyeinek', points: 6 },
        { problemId: 'x94hyio385--tabla-csokoladet-elosztani', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 2, round: 'final', category: 'C' },
  },
  'g3j0ii7mck--02-final-d': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'irza806sx0--ketszer-egymas-dobunk', points: 3 },
        { problemId: 'zeo3j1i6ly--szo-anagrammainak-nevezzuk', points: 3 },
        { problemId: 'b6r78kahq9--napoleon-huszart-vezet', points: 3 },
        { problemId: 'ye3p8t4zgj--kifejezes-erteke', points: 4 },
        { problemId: 'hgotfz17ol--hajo-kapitany-egyutt', points: 4 },
        { problemId: 'df3dalk1e0--legnagyobb-melyre', points: 4 },
        { problemId: 'dw07c1n7j3--sikon-pont-semelyik', points: 4 },
        { problemId: 'etfuuh3a2k--kovetkezo-egyenlet-gyokeinek', points: 5 },
        { problemId: '1tbpybk3p9--szaz-valos-szam', points: 5 },
        { problemId: 'eszo25szst--csodaorszagban-kovetkezo-penzermek', points: 5 },
        { problemId: 'x94hyio385--tabla-csokoladet-elosztani', points: 6 },
        { problemId: 'binz6eqzqa--valosak-kifejezes-minimuma', points: 6 },
        { problemId: 'j1j425ymx4--kovetkezo-egyenlet-gyokei', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 2, round: 'final', category: 'D' },
  },
};

export const problems: ProblemBank = {
  '1826q69qp6--kiskockabol-allo-feher': {
    answer: 8,
    content: {
      hu: {
        problemText: "<p>Adott egy \\(2\\times2\\times2\\)-es, 8 kiskockából álló fehér kocka. A felületén a kiskockák lapjai közül néhányat feketére festhetünk. Legfeljebb hány kis négyzet lehet fekete, ha két élszomszédos négyzet közül legfeljebb egyet festhetünk be?</p>",
        help1: "Nézzük meg, mi történik az egyes kiskockákkal a színezés során.",
        help2: "Mindegyik kiskocka sarokkocka.",
      },
    },
  },
  'fah38v0ubj--tucsok-felizgatta-magat': {
    answer: 1,
    content: {
      hu: {
        problemText: "<p>A Tücsök úgy felizgatta magát a Hangya viselkedésén, hogy ugrálni kezdett egy kör mentén. A kör mentén 5 pontra ugorhat, ezek negatív körüljárási irányban 1-től 5-ig számozottak. Az 5. pontból indul, és ha páratlan számú ponton áll, akkor egyet ugrik negatív körüljárás szerint, ha pedig páros számú ponton, akkor kettőt. Hol lesz a századik ugrás után?</p>",
        help1: "Ugráljunk együtt a tücsökkel, írjuk le merre járt!",
        help2: "Nincs semmi mintázat a leírt számokban?",
      },
    },
  },
  'edz9ebah97--durerek-telke-kornyeken': {
    answer: 27,
    content: {
      hu: {
        problemText: "<p>Dürerék telke környékén 15 libalegelőt kerítettek el, így összesen 16 egymáshoz csatlakozó téglalap alakú telek jött létre az ábra szerint. Ezek közül hétnek a területét ismerjük, ezeket az ábrán feltüntettük. Mekkora volt Dürerék telke?</p><p><i>Az ábra nem méretarányos.</i></p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/2_D_B_3.png",
        help1: "Próbáljátok kifejezni a többi területtel. A megadott területeken kívül nincs szükség másra.",
        help2: "Bizonyos legelők területeinek a szorzata megegyezik... Na de melyikeké? Ne feledd a téglalapok területképletét.<br><i>(Sőt, úgy is lehet gondolkodni, hogy bizonyos téglalapok kerületeinek az összege egyezik meg más téglalapok kerületösszegével.)</i>",
      },
    },
  },
  'v0c9js9aa4--hajo-kapitany-egyutt': {
    answer: 36,
    content: {
      hu: {
        problemText: "<p>A hajó és a kapitány együtt 84 évesek. A hajó ma kétszer annyi idős, mint a kapitány volt akkor, amikor a hajó annyi idős volt, mint a kapitány most. Hány éves a kapitány?</p>",
        help1: "Írjatok fel egyenleteket, vagy készítsetek táblázatot a kapitány és a hajó koráról! Fejezzétek ki a hajó életkorát a bonyolultabb egyenletből, és helyettesítsétek be az egyszerűbbe.",
        help2: "Ha a hajó most <em>h</em> éves, a kapitány <em>k</em>, akkor hány év telt el azóta, hogy a hajó <em>k</em> éves volt?",
      },
    },
  },
  '3pdw4wryxk--egyseg-teruletu-konvex': {
    answer: 6,
    content: {
      hu: {
        problemText: "<p>Egy 24 egység területű konvex négyszöget az átlói háromszögekre bontják, melyek közül két szomszédosnak a területe 3, illetve 5 egység. Mekkora a másik két háromszög közül a kisebbik területe?</p>",
        help1: "Gondoljátok át, hogyan lehet kiszámolni egy háromszög területét. Mit mondhatunk ekkor a feladatbeli háromszögek területeinek arányáról?",
        help2: "A két ismeretlen területű háromszögnek mekkora a területe összesen? Hogy viszonyul a területeik aránya a megadottakéhoz?",
      },
    },
  },
  '5vi1czpisu--egyenes-faagon-egymastol': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>Egy egyenes faágon egymástól egységnyi távolságra levő tizenkét hangya egységnyi sebességgel indul el. Ha két hangya találkozik, mindkettő megfordul és ugyanakkora sebességgel folytatja útját. Mennyi idő alatt esik le biztosan az összes hangya a tizenegy egység hosszú faágról?</p>",
        help1: "Mi történne, ha nem fordulnának meg?",
        help2: "Lényegében semmi sem változott, ugye?",
      },
    },
  },
  'k2i5zrzvai--orszag-varosai-kozt': {
    answer: 10,
    content: {
      hu: {
        problemText: "<p>Egy ország városai közt repülőjáratok közlekednek, minden városból legfeljebb három járat indul ki. Emellett minden városból el lehet jutni bármelyik másikba legfeljebb egy átszállással. Legfeljebb hány város lehet az országban?</p><p><i>Ha egy városból indul ki egy másikba repülőjárat, akkor az ellentétes irányba is van repülőjárat.</i></p>",
        help1: "Rajzold le a városokat egy tetszőleges városból indulva. Így legfeljebb mekkora távolságra juthatunk el?",
        help2: "Vajon be lehet-e fejezni ezt ügyesen? Minden alsó szinten levő csúcsból még két él indulhat ki!",
      },
    },
  },
  'udtx4f7tuw--szigeten-lovagok-mindig': {
    answer: 70,
    content: {
      hu: {
        problemText: "<p>Egy szigeten a lovagok mindig igazat mondanak, a lókötők mindig hazudnak. A szigetnek száz lakosa és három felekezete van: a Napimádók, a Holdimádók és a Földimádók. Minden lakos, akár lovag, akár lókötő, pontosan egy felekezethez tartozik. Egy felmérés alkalmával minden lakosnak meg kellett válaszolnia a következő három kérdés mindegyikét: Te Napimádó vagy? Te Holdimádó vagy? Te Földimádó vagy? Az első kérdésre hatvan, a másodikra negyven, a harmadikra harminc IGEN válasz érkezett. Hány lovag él a szigeten?</p>",
        help1: "Egy Holdimádó lókötő hány kérdésre válaszol igennel? És egy Holdimádó lovag?",
        help2: "Ne feledjétek, mindenki pontosan egy felekezethez tartozik. A felmérés során kiket számoltak többször? (Azaz összesen hány igen válasz érkezett?)",
      },
    },
  },
  's21xfbnxq2--kifejezes-erteke': {
    answer: 5050,
    content: {
      hu: {
        problemText: "<p>Mennyi az alábbi kifejezés értéke:</p><p>\\(100^2 - 99^2 + 98^2 - ... + 2^2 - 1^2\\)?</p>",
        help1: "Vajon melyik azonosság segíthet egyszerűbb alakra hozni a kifejezést?",
        help2: "Valóban, <em>a<sup>2</sup>-b<sup>2</sup> = (a-b)(a+b)</em> segít. Érdemes lehet ezek után <em>a+b</em>-t külön kiírni, majd a legkisebb és legnagyobb tagokat párosítani. Így nem lesz olyan nehéz az összeadás.",
      },
    },
  },
  'qitycwjeip--szamok-kitoroljuk-azokat': {
    answer: 3783,
    content: {
      hu: {
        problemText: "<p>A pozitív egész számok közül kitöröljük azokat, amelyek tartalmazzák az egyes számjegyet. Az így kapott új listában mi áll a 2009. helyen?</p>",
        help1: "Érdemes külön vizsgálni, hogy 100 vagy 1000 szám közül mennyi marad ki. Például 200-tól 299-ig.",
        help2: "Haladjunk a cél felé, egyre finomítva a becslést. Például a keresett szám nagyobb 3000-nél, de már 5000-nél kisebb. Na de mennyivel?",
      },
    },
  },
  'ha75edrimd--tablazat-negyzetet-pirosra': {
    answer: 12,
    content: {
      hu: {
        problemText: "<p>Egy \\(3 \\times 3\\)-as táblázat minden négyzetét pirosra, kékre vagy zöldre festjük. Hányféleképpen tehetjük ezt meg, ha azt akarjuk, hogy minden sorban és minden oszlopban mindhárom szín előforduljon?</p>",
        help1: "Hányféleképpen lehet kitölteni az első sort?",
        help2: "Ha az első sort már kitöltöttük, hogyan folytathatjuk tovább? Például a második sorban hová kerülhet a bal felső saroknak megfelelő színű mező?",
      },
    },
  },
  'v8jsemtoui--osszes-osztojanak-osszeget': {
    answer: 840,
    content: {
      hu: {
        problemText: "<p>A 840 összes pozitív osztójának összegét elosztjuk ugyanezen osztók reciprokainak összegével. Mit kapunk eredményül?</p>",
        help1: "A 840 osztói sorra 1, 2, 3, 4, 5, 6, 7, 8, 10, ..., 420, 840. Ekkor a válasz (1+2+3+4+5+6+7+8+10+....+420+840) /(1/1+1/2+1/3+1/4+1/5+1/6+1/7+1/8+1/10+...+1/420+1/840).",
        help2: "A 840 osztói párokba állíthatóak úgy, hogy a szorzatuk pont 840 legyen.",
      },
    },
  },
  'w2s6o5dm4w--irjuk-szamokat-tol': {
    answer: 2,
    content: {
      hu: {
        problemText: "<p>Írjuk fel a számokat 1-től 9-ig egy kör kerületére úgy, hogy semelyik két szomszédos szám összege se legyen többszöröse a 3, 5, 7 számok egyikének sem! Mi lesz a 9-es kisebbik szomszédja?</p>",
        help1: "Nézzétek végig, hogy melyik szám mellé mi kerülhet.",
        help2: "Érdemes megvizsgálni, hogy mi lehet a 9 kicsi szomszédja, és ennek milyen lehetséges további szomszédai vannak.",
      },
    },
  },
  'gvoan55m0w--szo-anagrammainak-nevezzuk': {
    answer: 60,
    content: {
      hu: {
        problemText: "<p>Egy szó anagrammáinak nevezzük az olyan, nem feltétlenül értelmes szavakat, amelyeket az eredeti szó betűinek felcserélésével kaphatunk. Hány anagrammája van a DÜRER szónak?</p>",
        help1: "Hányféleképpen rakhatnánk sorrendbe a betűket? Hányféleképpen tehetnénk meg ezt, ha csupa különböző betű lenne?",
        help2: "Az R-ek tetszőleges sorrendben lehetnek (nincs köztük különbség), így osztani kell a lehetséges sorrendjeik számával.",
      },
    },
  },
  'zenq9bwky9--egyseg-teruletu-konvex': {
    answer: 6,
    content: {
      hu: {
        problemText: "<p>Egy 24 egység területű konvex négyszöget az átlói háromszögekre bontanak, amelyek közül két szomszédosnak a területe 3 illetve 5. Mekkora a másik két háromszög közül a kisebbik területe?</p>",
        help1: "Gondoljátok át, hogyan lehet kiszámolni egy háromszög területét. Mit mondhatunk ekkor a feladatbeli háromszögek területeinek arányáról?",
        help2: "A két ismeretlen területű háromszögnek mekkora a területe összesen? Hogy  viszonyul területeik aránya a megadottakéhoz?",
      },
    },
  },
  'sm0r8zjz95--napoleon-huszart-vezet': {
    answer: 110,
    content: {
      hu: {
        problemText: "<p>Napóleon \\(n\\) huszárt vezet a majlandi csatába. Ha 10-esével osztja őket egy osztagba, akkor éppen eggyel több teljes létszámú csoportot tud kiállítani, mintha 11-esével osztaná fel huszárjait. Hányféle értéke lehet \\(n\\)-nek a pozitív egész számok körében?</p>",
        help1: "Vizsgáljátok meg a megoldásokat <em>n</em><110-re, valamint <em>n</em>&ge;110-re, vagy pedig írjatok fel egyenleteket.",
        help2: "Gyűjtsétek össze a megoldásokat! Milyen összefüggés fedezhető fel a 110-nél kisebb és a legalább akkora megoldások között?",
      },
    },
  },
  'xfh37nuby8--orszag-varosai-repulojaratok': {
    answer: 10,
    content: {
      hu: {
        problemText: "<p>Egy ország városai között repülőjáratok közlekednek, minden városból legfeljebb három járat indul ki. Emellett minden városból el lehet jutni bármelyik másikba legfeljebb egy átszállással. Legfeljebb hány város lehet az országban?</p><p><i>Ha egy városból indul ki egy másikba repülőjárat, akkor az ellentétes irányba is van repülőjárat.</i></p>",
        help1: "Rajzoljátok le a városokat egy tetszőleges városból indulva. Így legfeljebb mekkora távolságra juthatunk el?",
        help2: "Vajon be lehet-e fejezni ezt ügyesen? Minden alsó szinten levő csúcsból még két él indulhat ki!",
      },
    },
  },
  'y4mwkn5ovy--durer-urasag-elment': {
    answer: 252,
    content: {
      hu: {
        problemText: "<p>Dürer uraság elment egy vásárba, és hogy meghatározza az árát egy festménynek, vett két pozitív egész számot, kivonta a nagyobbikból a kisebbiket és a különbséget hozzáadta a két szám összegéhez. Az eredményhez hozzáadta még a két szám szorzatát és a hányadosukat is, így 343-at kapott. Az árussal kialkudta, hogy a festmény ára az eredeti két szám szorzata legyen. Milyen árat szabott meg Dürer uraság?</p>",
        help1: "A két szám hányadosa is egész szám.",
        help2: "A 343 egyenlő 7<sup>3</sup>-nal.",
      },
    },
  },
  'lghyxdk46t--szamjegyeinek-szama-osszeg': {
    answer: 2010,
    content: {
      hu: {
        problemText: "<p>A \\(2^{2009}\\) számjegyeinek száma \\(x\\), az \\(5^2009\\) számjegyeinek száma pedig \\(y\\). Mennyi az \\(x+y\\) összeg?</p>",
        help1: "Mennyi a két szám szorzata?",
        help2: "Próbáljátok meg nagyságrendileg becsülni a számokat.",
      },
    },
  },
  'a912sh7xqd--haromszog-amelynek-oldalai': {
    answer: 4,
    content: {
      hu: {
        problemText: "<p>Adott egy háromszög, amelynek oldalai (méterben mérve) egymást követő egész számok. Ennek a háromszögnek a középső oldalához tartozó magassága két olyan részre osztja a középső oldalt, amelyek különbsége \\(x\\).</p><p>Hány méter hosszú \\(x\\)?</p>",
        help1: "Egy derékszögű háromszög oldalai között mi a kapcsolat?",
        help2: "Két, ügyesen felírt Pitagorasz-tételt kell átalakítani.",
      },
    },
  },
  '311uzvcoas--hatarozzuk-darab-kilences': {
    answer: 3600,
    content: {
      hu: {
        problemText: "<p>Határozzuk meg a 200 darab kilences számjegyből álló szám köbében a számjegyek összegét!</p>",
        help1: "Egy csupa kilencesekből álló szám az majdnem tízhatvány. Érdemes ilyen alakban gondolkodni, vagy pedig kisebb eseteket megvizsgálni.",
        help2: "A (10<sup>200</sup>-1)<sup>3</sup> kifejezést bontsátok ki, azután végezzétek el a kivonásokat és az összeadásokat a szokásos módon. Az egyes számjegyekből mennyit tartalmaz a kapott szám?",
      },
    },
  },
  'nft3f6a57s--sikon-pont-semelyik': {
    answer: 140,
    content: {
      hu: {
        problemText: "<p>Adott a síkon hét pont, semelyik három sincs egy egyenesen. Behúzzuk az általuk alkotott szakaszok felezőmerőlegeseit. A sík minden pontját, ahol legalább két felezőmerőleges találkozik, pirosra festjük. Legfeljebb hány piros pont keletkezhet?</p>",
        help1: "Mit mondhatunk három pont által meghatározott szakaszfelező merőlegesek metszéspontjáról?",
        help2: "Valóban, csak a háromszögeket kell megszámolni! Hét pontból hányféleképpen választható ki három?",
      },
    },
  },
  'wlsja86ujf--legkisebb-hatjegyu-negyzetszam': {
    answer: 213,
    content: {
      hu: {
        problemText: "<p>Melyik a legkisebb olyan hatjegyű négyzetszám első három jegye, amely 444-re végződik?</p>",
        help1: "Hány jegyű a hatjegyű szám gyöke? Milyen számjegyre végződhet?",
        help2: "Mi szükséges ezentúl ahhoz, hogy a 100-as maradék 44 legyen? Írjátok fel algebrailag! <i>(Például a 12-re vagy a 88-ra végződő számok ilyenek.)</i><br>Ez alapján milyen számjegy állhat a négyzetgyök százas helyiértékén az egyes esetekben?",
      },
    },
  },
  'v9v60opt26--jelolje-szam-szamjegyeinek': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>Jelölje \\(\\mathcal{S}(n)\\) az \\(n\\) szám számjegyeinek összegét. Mennyi \\([\\mathcal{S}([\\mathcal{S}([\\mathcal{S}(2^{2009}))\\)?</p>",
        help1: "Becsüljétek meg, hogy milyen gyorsan csökken a számjegyek száma! Hány jegye lehet a 2<sup>2009</sup>-nek?<br>Ismertek-e olyan tulajdonságot, amely egy számra és a számjegyeinek összegére is igaz?",
        help2: "Gondoljatok az oszthatósági szabályokra!",
      },
    },
  },
  'x94hyio385--tabla-csokoladet-elosztani': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>Kilenc tábla csokoládét szeretnénk elosztani igazságosan \\(n\\geq2\\) gyerek között. Hány különböző \\(n\\) értékre lehet megvalósítani az elosztást úgy, hogy minden csokoládét legfeljebb egyszer törhetünk ketté?</p>",
        help1: "Lehetséges-e 18-nál több gyerek esetén igazságosan elosztani a csokikat? Mi a helyzet legfeljebb 9 gyerek esetén?",
        help2: "Vizsgáljátok meg a feladatot például <em>n</em>=12-re, 14-re, illetve 11-re! Legalább mekkoráknak kell lennie a törések során keletkező legkisebb daraboknak?",
      },
    },
  },
  'irza806sx0--ketszer-egymas-dobunk': {
    answer: 17,
    content: {
      hu: {
        problemText: "<p>Kétszer egymás után dobunk egy hatoldalú szabályos dobókockával. Annak a valószínűsége, hogy a második dobásunk határozottan nagyobb, mint az első, \\(\\frac{p}q\\). Mennyi a \\(p+q\\) összeg (\\(p\\) és \\(q\\) pozitív egészek és relatív prímek)?</p>",
        help1: "Számoljátok meg a kedvező eseteket! Ügyeljetek a kapott tört egyszerűsítésére.",
        help2: "Bontsátok esetekre a megoldásokat az első dobás szerint! <i>Például ha először 1-est dobtunk, akkor a második dobás 5-féle lehet.</i>",
      },
    },
  },
  'zeo3j1i6ly--szo-anagrammainak-nevezzuk': {
    answer: 60,
    content: {
      hu: {
        problemText: "<p>Egy szó anagrammáinak nevezzük az olyan, nem feltétlenül értelmes szavakat, amelyeket az eredeti szó betűinek felcserélésével kaphatunk. Hány anagrammája van a DÜRER szónak?</p>",
        help1: "Hányféleképpen rakhattok sorba öt különböző betűt?",
        help2: "Az <em>R</em>-ek tetszőleges sorrendben lehetnek (nincs köztük különbség).",
      },
    },
  },
  'b6r78kahq9--napoleon-huszart-vezet': {
    answer: 110,
    content: {
      hu: {
        problemText: "<p>Napóleon \\(n\\) huszárt vezet a majlandi csatába. Ha 10-esével osztja őket egy osztagba, akkor éppen eggyel több teljes létszámú csoportot tud kiállítani, mintha 11-esével osztaná fel huszárjait. Hányféle értéke lehet \\(n\\)-nek a pozitív egész számok körében?<br><i>Lehetséges, hogy lesznek az osztagokból kimaradó huszárok is.</i></p>",
        help1: "Vizsgáljátok meg a megoldásokat <em>n</em><110-re, valamint 110&le;<em>n</em><220 esetén!<br>(Vagy pedig írjatok fel egyenleteket a 10-es és 11-es maradékokra!)",
        help2: "<em>n</em><220 esetén legfeljebb eggyel több 10-es csoport tud kialakulni, mint 11-es.<br>Ha <em>n</em><110, akkor mi az összefüggés <em>n</em> és <em>n</em>+110 huszár esete között?",
      },
    },
  },
  'ye3p8t4zgj--kifejezes-erteke': {
    answer: 5050,
    content: {
      hu: {
        problemText: "<p>Mennyi az alábbi kifejezés értéke: \\(100^2-99^2+98^2-\\dots+2^2-1^2\\)?</p>",
        help1: "Vajon melyik azonosság segíthet egyszerűbb alakra hozni a kifejezést?",
        help2: "Valóban, <em>a<sup>2</sup>-b<sup>2</sup> = (a-b)(a+b)</em> segít, ami után már csak összegezni kell a megmaradó (a+b) alakú tagokat.",
      },
    },
  },
  'hgotfz17ol--hajo-kapitany-egyutt': {
    answer: 36,
    content: {
      hu: {
        problemText: "<p>A hajó és a kapitány együtt 84 évesek. A hajó ma kétszer annyi idős, mint a kapitány volt akkor, amikor a hajó annyi idős volt, mint a kapitány most. Hány éves a kapitány?</p>",
        help1: "Vezessetek be változókat, és írjatok fel egyenleteket, vagy pedig készítsetek táblázatot a kapitány és a hajó koráról!",
        help2: "Ha a hajó most <em>h</em> éves, és a kapitány <em>k</em>, akkor hány év telt el azóta, hogy a hajó <em>k</em> éves volt?",
      },
    },
  },
  'df3dalk1e0--legnagyobb-melyre': {
    answer: 666,
    content: {
      hu: {
        problemText: "<p>Melyik a legnagyobb \\(n\\) pozitív egész, melyre \\(n\\cdot(\\sqrt{1000004}-\\sqrt{1000001})<1\\)?</p>",
        help1: "Egy jól ismert algebrai azonosság a hasznotokra válhat.",
        help2: "Gyöktelenítsétek a számlálót, azután becsüljétek a nevezőt!",
      },
    },
  },
  'dw07c1n7j3--sikon-pont-semelyik': {
    answer: 140,
    content: {
      hu: {
        problemText: "<p>Adott a síkon hét pont, semelyik három sincs egy egyenesen. Behúzzuk az általuk alkotott szakaszok felezőmerőlegeseit. A sík minden pontját, ahol legalább két felezőmerőleges találkozik, pirosra festjük. Legfeljebb hány piros pont keletkezhet?</p>",
        help1: "Hány egyenest húztunk be? Hány háromszöget határoznak meg a pontok?",
        help2: "Mit mondhatunk három pont által meghatározott szakaszfelező merőlegesek metszéspontjáról? Háromszögenként hányszor számoltuk feleslegesen?",
      },
    },
  },
  'etfuuh3a2k--kovetkezo-egyenlet-gyokeinek': {
    answer: 4,
    content: {
      hu: {
        problemText: "<p>Mennyi a következő egyenlet pozitív gyökeinek összege?</p><p><center>\\(2x^4-3x^3-16x^2-3x+2=0\\)</center></p>",
        help1: "Az egyenlet mindkét oldalát leosztva <em>x<sup>2</sup></em>-tel egy, az <em>x</em> kitevőiben szimmetrikus kifejezést kaptok.",
        help2: "Fejezzétek ki a kapott egyenlet bal oldalát (<em>y = x+1/x</em>) függvényében! Ha megoldjátok az egyenletet <em>y</em>-ra, akkor megkaphatjátok a megfelelő megoldásokat <em>x</em>-re is.",
      },
    },
  },
  '1tbpybk3p9--szaz-valos-szam': {
    answer: 99,
    content: {
      hu: {
        problemText: "<p>Adott száz valós szám, amelyek összege pozitív. A száz számból képezhető 4950 darab kéttagú összeg közül legalább hány lesz biztosan pozitív?</p>",
        help1: "Keressetek konstrukciót, ahol minél kevesebb pozitív pár van, akár kevés számra!",
        help2: "Legyenek a számaink <em>a<sub>1</sub>, a<sub>2</sub>, ..., a <sub>100</sub></em>. Fix <em>k</em>-kra legalább hány darab pozitív összeg kell, hogy legyen az <em>a<sub>n</sub>+a<sub>n+k</sub></em> alakú összegek között?",
      },
    },
  },
  'eszo25szst--csodaorszagban-kovetkezo-penzermek': {
    answer: 36,
    content: {
      hu: {
        problemText: "<p>Csodaországban a következő pénzérmék használatosak: 1, 2, 4, 8, valamint 16 fityinges érmék. Hányféleképpen lehet kifizetni 16 fityinget, ha bármely használatos pénzérméből akármennyi rendelkezésre áll?</p>",
        help1: "Válogassátok szét az eseteket aszerint, hogy hány fityinges a legnagyobb érme, amit felhasználtok a fizetéshez!",
        help2: "Egy-egy lehetséges fizetéshez csökkenő sorrendben írjátok fel a felhasználandó érméket. Érdemes táblázatot is készítenetek.",
      },
    },
  },
  'binz6eqzqa--valosak-kifejezes-minimuma': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>Legyenek \\(x\\), \\(y\\)valósak. Mennyi az alábbi kifejezés minimuma:</p><p><center>\\(\\sqrt{(x+3)^2+(y-1)^2}+\\sqrt{(x-1)^2+(y+2)^2}\\)?</center></p>",
        help1: "A képletek hasonlítanak valamire, amit koordinátageometriából ismerünk!",
        help2: "Két távolság összegét kell minimalizálni. A kérdés az, hogy mely két ponttól vett távolságokról van szó.",
      },
    },
  },
  'j1j425ymx4--kovetkezo-egyenlet-gyokei': {
    answer: 242,
    content: {
      hu: {
        problemText: "<p>Mennyi a következő egyenlet gyökei negyedik hatványainak összege:</p><p><center>\\(x^3-11x+13=0\\)?</center></p>",
        help1: "Írjátok fel az egyenletet gyöktényezős alakban (ismeretlen gyökökkel), végezzétek el a szorzást, és hasonlítsátok össze a két polinom együtthatóit! (Ezzel a Viète-formulákat kapjátok.)",
        help2: "A gyökök negyedik hatványainak összege a kapott képletekből kifejezhetők.<br>(A Newton-Girard-formulák és az elemi szimmetrikus polinomok jól használhatóak.)",
      },
    },
  },
};
