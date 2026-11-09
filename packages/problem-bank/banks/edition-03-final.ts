import type { CompetitionBank, ProblemBank } from '../src/sources';

// Edition 3's final, relay only, as the relay practice site serves it: one
// competition per category, and the problems their relays use, each written
// once. Released, so the practice site may import it.

export const competitions: CompetitionBank = {
  '2aacema4xc--03-final-b': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: '59xwxdsymm--lathato-szogeket-fokokban', points: 3 },
        { problemId: 'sgvpz7zo83--adjuk-legnagyobb-primszamot', points: 3 },
        { problemId: 'anmbxkmxe0--hajo-sullyedni-kezd', points: 3 },
        { problemId: 'x99xw7xcxg--egyenes-lathato-modon', points: 4 },
        { problemId: '4b9t9quqxy--lappfoldon-fizetoeszkoz-ukk', points: 4 },
        { problemId: '7k3aw1ouo8--tetraeder-eleit-piros', points: 4 },
        { problemId: 'apzm9vw42l--majdnem-ures-orsorol', points: 4 },
        { problemId: '1bsy52uwle--egysegsugaru-kort-korokkel', points: 5 },
        { problemId: 'dgs7yf7gfn--durer-kedvenc-kecskejet', points: 5 },
        { problemId: 'v2s62uynk7--pont-teglalap-belsejeben', points: 5 },
        { problemId: 'nsyyqw65s6--szamot-szuperprimnek-nevezunk', points: 6 },
        { problemId: 'u1i1ltzdga--durer-hintojat-huzza', points: 6 },
        { problemId: 'ply0byefsa--szamok-melyek-egyenlet', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 3, round: 'final', category: 'B' },
  },
  '9hxguwf0l8--03-final-c': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'mvkeln390b--egyenes-lathato-modon', points: 3 },
        { problemId: 'ply0byefsa--szamok-melyek-egyenlet', points: 3 },
        { problemId: 'lzf2iddnpj--tomor-kocka-lapjat', points: 3 },
        { problemId: 'd08nutx3bs--tetraeder-eleit-piros', points: 4 },
        { problemId: '7p8llld2qe--lathato-haromszog-oldalai', points: 4 },
        { problemId: 'ucb4ocdeuw--megoldasa-egeszek-koreben', points: 4 },
        { problemId: '8bx1ob2kcq--pont-teglalap-belsejeben', points: 4 },
        { problemId: 'c50gqnlr9s--negyzetet-reszekre-felbontani', points: 5 },
        { problemId: 'idvhehgr61--durer-rendezgeti-konyvtara', points: 5 },
        { problemId: 'cy4czrdtgd--teglalap-kis-negyzetre', points: 5 },
        { problemId: 'hp31cusae0--szabalyos-hatszog-alapu', points: 6 },
        { problemId: 'uq0fvgl3ul--legnagyobb-szam-irhato', points: 6 },
        { problemId: '7z46m2b2nz--szabalyos-dodekaedernek-nehany', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 3, round: 'final', category: 'C' },
  },
  '8ruekrq6sb--03-final-d': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'anmbxkmxe0--hajo-sullyedni-kezd', points: 3 },
        { problemId: 'vrpem1q42b--tomor-kocka-lapjat', points: 3 },
        { problemId: '99v0pt77p4--szamot-paronkent-osszeadtunk', points: 3 },
        { problemId: 'ynaj3t5mta--tablazat-sora-oszlopa', points: 4 },
        { problemId: '9hjhmvsbxt--durer-kedvenc-kecskejet', points: 4 },
        { problemId: 'enrbfb3rt8--teglalap-kis-negyzetre', points: 4 },
        { problemId: '7z46m2b2nz--szabalyos-dodekaedernek-nehany', points: 4 },
        { problemId: 'yczbob190b--megoldasa-egeszek-koreben', points: 5 },
        { problemId: 'idvhehgr61--durer-rendezgeti-konyvtara', points: 5 },
        { problemId: '2mbskp3w9f--tizes-szamrendszerbeli-alakjaban', points: 5 },
        { problemId: 'liwsf8dhvj--csodarab-lathato-modon', points: 6 },
        { problemId: 'wjgopcu049--legnagyobb-szam-irhato', points: 6 },
        { problemId: 'nbsda4ubbx--sakktablan-mezot-kijelolni', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 3, round: 'final', category: 'D' },
  },
};

export const problems: ProblemBank = {
  '59xwxdsymm--lathato-szogeket-fokokban': {
    answer: 12,
    content: {
      hu: {
        problemText: "<p>Az ábrán látható szögeket fokokban mérjük. Mekkora \\(x\\) értéke?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/3_D_B_1.png",
        help1: "Egy háromszög szögösszege 180 fok.",
        help2: "Egy szög csúcsszöge azonos nagyságú a szöggel. Illetve felírhatjátok az ötszög belső szögeinek összegéit is.",
      },
    },
  },
  'sgvpz7zo83--adjuk-legnagyobb-primszamot': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>Adjuk meg a legnagyobb olyan prímszámot, amely egyszerre összege és különbsége két prímszámnak!</p>",
        help1: "Vizsgáljátok meg, ez milyen kis prímszámokra teljesül!",
        help2: "Milyen paritásúak a 2-nél nagyobb prímszámok?",
      },
    },
  },
  'anmbxkmxe0--hajo-sullyedni-kezd': {
    answer: 13,
    content: {
      hu: {
        problemText: "<p>Egy hajó süllyedni kezd. A mentőcsónakba 5 ember fér be, és 5 perc alatt éri el a legközelebbi szigetet. Maximum hány ember menekülhet meg, ha a hajó 21 perc alatt süllyed el?</p><p><i>A mentőcsónakban, ha mozog, legalább egy ember kell hogy legyen.</i></p>",
        help1: "Egy oda-vissza úttal legfeljebb hány embert tudnak a szigetre szállítani?",
        help2: "A 21. perc végéig nem szükséges, hogy a szigetre érjen a mentőcsónak.",
      },
    },
  },
  'x99xw7xcxg--egyenes-lathato-modon': {
    answer: 540,
    content: {
      hu: {
        problemText: "<p>Négy egyenes az ábrán látható módon metszi egymást. A szögeket fokokban mérjük. Mennyi \\(x+y+z+w\\) értéke?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/3_D_B_4.png",
        help1: "Számoljatok szögeket! Egy szög és a kiegészítő szögének összege 180&deg;.",
        help2: "Egy háromszög szögösszege 180&deg;.",
      },
    },
  },
  '4b9t9quqxy--lappfoldon-fizetoeszkoz-ukk': {
    answer: 12,
    content: {
      hu: {
        problemText: "<p>Lappföldön három fizetőeszköz van: ukk, mukk és fukk. Két ukk és egy mukk, az egy fukk. Ellenben 4 ukk az egy fukk és 2 mukk. Hány mukk 3 fukk?</p>",
        help1: "Hány mukk két ukk?",
        help2: "Ejtsétek ki a két feltételből valamelyik változót, például a fukkok számát!",
      },
    },
  },
  '7k3aw1ouo8--tetraeder-eleit-piros': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>Egy tetraéder éleit piros és kék színekkel színezzük. Két színezést azonosnak tekintünk, ha a kétféleképpen színezett tetraéderek egymásba vihetők (egybevágók). Hányféleképpen színezhetünk?</p>",
        help1: "Rajzoljátok le a tetraéder élhálóját, és próbálkozzatok esetszétválasztással!",
        help2: "Válogassátok szét a színezéseket aszerint, hogy hány kék él van!",
      },
    },
  },
  'apzm9vw42l--majdnem-ures-orsorol': {
    answer: 24,
    content: {
      hu: {
        problemText: "<p>Egy majdnem üres orsóról húzzuk le a cérnát az ábrán látható módon. A belső henger sugara 5 cm, a kerekeké 10 cm. Mekkora távot tett meg az orsó, ha pontosan 12 cm cérnát húztunk le róla?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/3_D_B_7.png",
        help1: "Jelöljétek meg azt a megfelelő pontot mindkét hengeren, ahol a kis hengerről éppen felszabadul a cérna, ezenkívül jelöljétek meg a nagy henger egyik felső pontját.",
        help2: "Hányszorosa a kis tengelyen lévő két megjelölt pont távolsága a nagy hengeren megjelölt pontok távolságának?",
      },
    },
  },
  '1bsy52uwle--egysegsugaru-kort-korokkel': {
    answer: 3,
    content: {
      hu: {
        problemText: "<p>Egy egységsugarú \\(K\\) kört egységsugarú körökkel szeretnénk hézagmentesen lefedni úgy, hogy \\(K\\) középpontja ne essen azok belsejébe (a körvonalukra eshet). A körök egymásba lóghatnak. Legalább hány körre lesz szükségünk \\(K\\)-t leszámítva?</p>",
        help1: "Elég egy kör lefedni <em>K</em>-t a megadott módon? Két kör?",
        help2: "Vizsgáljátok azt, hogy a fedő körök <em>K</em> körvonalának legfeljebb hányadrészét fedik külön-külön!",
      },
    },
  },
  'dgs7yf7gfn--durer-kedvenc-kecskejet': {
    answer: 310,
    content: {
      hu: {
        problemText: "<p>Dürer kedvenc kecskéjét a ház sarkához kötötte legelni. A ház oldalai 14 m és 18 m, a kötél hossza 20 m. \\(k\\pi\\) \\(m^2\\) füvet tud lelegelni a jószág. Mekkora \\(k\\) értéke?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/3_D_B_9.png",
        help1: "A lelegelhető fű területe néhány, a ház sarkaiból kifelé rajzolható körcikk összterületével egyezik meg.",
        help2: "Egy kör területe a kör sugarának a négyzete szorozva &pi;-vel.",
      },
    },
  },
  'v2s62uynk7--pont-teglalap-belsejeben': {
    answer: 18,
    content: {
      hu: {
        problemText: "<p>Adott egy \\(P\\) pont az \\(ABCD\\) téglalap belsejében. \\(PA=3\\), \\(PD=4\\) és \\(PC=5\\). Mekkora \\(PB\\) hosszának a négyzete?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/3_D_B_10.png",
        help1: "Húzzatok be az ábrán az oldalakra merőleges szakaszokat P-ből!",
        help2: "Használjátok a Pitagorasz-tételt!",
      },
    },
  },
  'nsyyqw65s6--szamot-szuperprimnek-nevezunk': {
    answer: 29,
    content: {
      hu: {
        problemText: "<p>Egy számot szuperprímnek nevezünk, ha az első jegye prím, az első két jegyének összege is prím, az első három jegyének az összege is prím és így tovább. Melyik a legnagyobb szuperprím szám, amely csupa különböző számjegyből áll? Add meg számjegyei összegét.<br><em>(pótfeladat)</em></p>",
        help1: "Először érdemes minél több számjegyből álló számot találni. Mely számjegyek szerepelhetnek a legnagyobb szuperprímben? Van-e benne 2-es?",
        help2: "A legnagyobb szám 29-cel kezdődik. Innen hogyan folytatódik?",
      },
    },
  },
  'u1i1ltzdga--durer-hintojat-huzza': {
    answer: 120,
    content: {
      hu: {
        problemText: "<p>Dürer hintóját 4 ló húzza. Az elöl húzó két ló 100 km, míg a hátsó két állat 150 km alatt fárad el. Ha Dürer ügyesen cseréli a lovait, akkor maximum hány km-t tud megtenni a fogattal?</p>",
        help1: "Paraméterezzétek a feladatot! Hogy ha egy ló elöl megy <em>x</em> km-t, akkor hányadrészét használja fel az energiájának?",
        help2: "A feladat a lovakban szimmetrikus, így feltehető, hogy egy ló ugyanannyit húzza a kocsit elöl, mint hátul.",
      },
    },
  },
  'ply0byefsa--szamok-melyek-egyenlet': {
    answer: 56,
    content: {
      hu: {
        problemText: "<p>\\(x\\) és \\(y\\) olyan egész számok, melyek az alábbi négy egyenlet közül hármat kielégítenek, ám mind a négyet már nem.</p><p><ul><li>\\(x+y=63\\)<li>\\(x-y=47\\)<li>\\(xy=392\\)<li>\\(\\frac{x}{y}=8\\)</ul></p><p>Mennyi \\(x\\) értéke?</p>",
        help1: "Lehetséges hogy az első két állítás igaz?",
        help2: "Ha az első két állítás nem mind igaz, akkor a másik kettő biztosan igaz.",
      },
    },
  },
  'mvkeln390b--egyenes-lathato-modon': {
    answer: 540,
    content: {
      hu: {
        problemText: "<p>Négy egyenes az ábrán látható módon metszi egymást. A szögeket fokokban mérjük. Mennyi \\(x+y+z+w\\) értéke?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/3_D_C_1.png",
        help1: "Számoljatok szögeket! Egy szög és a kiegészítő szögének összege 180&deg;.",
        help2: "Egy háromszög szögösszege 180&deg;.",
      },
    },
  },
  'lzf2iddnpj--tomor-kocka-lapjat': {
    answer: 54,
    content: {
      hu: {
        problemText: "<p>Egy tömör kocka minden lapját négyfelé osztjuk az ábrán látható módon. Hány lehetséges útvonalon juthatunk el a vonalakon \\(P\\)-ből \\(Q\\)-ba, ha minden lépésben közelítenünk kell \\(Q\\) felé?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/3_D_C_3.png",
        help1: "Egy megfelelő <em>PQ</em> út során mindhárom irányba pont kettőt-kettőt kell lépnünk.",
        help2: "Sorban írjátok oda a vonalak mindegyik csomópontjához, hogy hányféleképpen lehet odajutni <em>P</em>-ből!",
      },
    },
  },
  'd08nutx3bs--tetraeder-eleit-piros': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>Egy tetraéder éleit piros és kék színekkel színezzük. Két színezést azonosnak tekintünk, ha a kétféleképpen színezett tetraéderek egybevágósági transzformációval egymásba vihetők. Hányféleképpen színezhetünk?</p>",
        help1: "Rajzoljátok le a tetraéder élhálóját, és próbálkozzatok esetszétválasztással!",
        help2: "Válogassátok szét a színezéseket aszerint, hogy hány kék él van!",
      },
    },
  },
  '7p8llld2qe--lathato-haromszog-oldalai': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>Az ábrán látható háromszög oldalai 8, 9 és 13 egység hosszúak. A körök érintik egymást, és a középpontjaik a háromszög csúcsai. Mekkora a legnagyobb kör sugara?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/3_D_C_5.png",
        help1: "A legnagyobb sugarú körrel szemközti oldal hossza a két rövidebb sugár összege.",
        help2: "A félkerület hossza a három sugár összege.",
      },
    },
  },
  'ucb4ocdeuw--megoldasa-egeszek-koreben': {
    answer: 4851,
    content: {
      hu: {
        problemText: "<p>Hány megoldása van a pozitív egészek körében az \\(x+y+z=100\\) egyenletnek?</p>",
        help1: "Legfeljebb mennyi lehet <em>x</em> értéke?",
        help2: "Válogassátok szét a megoldásokat <em>x</em> értéke szerint! Például <em>x=10</em> esetén hány megoldás van?",
      },
    },
  },
  '8bx1ob2kcq--pont-teglalap-belsejeben': {
    answer: 18,
    content: {
      hu: {
        problemText: "<p>Adott egy \\(P\\) pont az \\(ABCD\\) téglalap belsejében. \\(PA=3\\), \\(PD=4\\) és \\(PC=5\\). Mekkora \\(PB\\) hosszának négyzete?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/3_D_C_7.png",
        help1: "Húzzatok be az ábrán az oldalakra merőleges szakaszokat!",
        help2: "Használjátok a Pitagorasz-tételt!",
      },
    },
  },
  'c50gqnlr9s--negyzetet-reszekre-felbontani': {
    answer: 21,
    content: {
      hu: {
        problemText: "<p>Hányféleképpen lehet egy \\(3\\times3\\)-as négyzetet \\(2\\times1\\)-es vagy \\(1\\times1\\)-es részekre felbontani?</p><p><i>Két felbontást csak akkor tekintünk különbözőnek, ha forgatással és tükrözéssel nem vihetőek egymásba. Egy felbontás során a keletkező kisebb téglalapoknak hézagmentesen, átfedés nélkül kell kitölteniük a \\(3\\times3\\)-as négyzetet.</i></p>",
        help1: "Bontsátok esetekre a megoldásokat! Lehet aszerint is, hogy mekkora kisebb téglalap fedi a 3&times;3-as négyzet középső kisnégyzetét, vagy aszerint is, hogy hány darab 2&times;1-es dominót használtok fel egy-egy lefedéshez.",
        help2: "Figyeljetek oda a 2&times;1-es téglalapok állására! Például egy 2&times;3-as téglalap például kétféleképpen is fedhető (az egybevágóság erejéig).<br> Két dominót négyféleképpen tudunk úgy lerakni, hogy egyik se fedje a középső kisnégyzetet.",
      },
    },
  },
  'idvhehgr61--durer-rendezgeti-konyvtara': {
    answer: 512,
    content: {
      hu: {
        problemText: "<p>Dürer rendezgeti a könyvtára egyik polcán egymás mellett álló 10 kötetét. Balról jobbra halad a polcon, először eldönti, hogy kicseréli-e az első két könyvet. Majd ugyanígy dönt a 2. és a 3. helyen álló könyv cseréjéről, és így tovább, míg a polc végére nem ér. Tehát összesen maximum 9 cserét hajt végre. Hányféle kezdő állapot lehetséges, amiből ilyen módon ügyes rendezéssel megkapható a helyes ABC-sorrend?</p>",
        help1: "Ha az adott (például 3.) cserét végrehajtja egy <em>x</em> cserélgetésben, de egy másik, <em>y</em> cserélgetés során nem, akkor a két cserélgetés eredménye nem lehet azonos.",
        help2: "Gondolkodjatok visszafelé! Ábécé sorrendből indulva, hátulról kezdve cserélgetve a szomszédos könyveket, hányféle sorrendet kaphat Dürer?",
      },
    },
  },
  'cy4czrdtgd--teglalap-kis-negyzetre': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>A \\(PQRS\\) téglalap 9 kis négyzetre van osztva, az ábrán látható módon. Minden négyzet különböző oldalhosszúságú, a legkisebb négyzet oldala 2 egység hosszú. Hány egység hosszú a második legkisebb négyzet oldala?</p><p><i>Az négyzetek az ábrán nem méretarányosak.</i></p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/3_D_C_10.png",
        help1: "Paraméterezzétek valamelyik négyzet oldalát!",
        help2: "Egy paraméterrel az egész ábra paraméterezhető, és egy négyzet két oldalát kiszámolhatjátok vele kétféleképpen is.",
      },
    },
  },
  'hp31cusae0--szabalyos-hatszog-alapu': {
    answer: 3360,
    content: {
      hu: {
        problemText: "<p>Adott egy szabályos hatszög alapú egyenes hasáb. A lapokra a ráírjuk a természetes számokat egytől nyolcig (mindegyiket pontosan egyszer). Hányféleképpen tehetjük ezt meg, feltéve, hogy a forgatással egymásba vihető számozásokat azonosnak tekintjük?</p>",
        help1: "Bontsátok esetekre!",
        help2: "Aszerint bontsátok esetekre a lehetséges felírásokat, hogy mely két szám kerül a hasáb aljára illetve tetejére!",
      },
    },
  },
  'uq0fvgl3ul--legnagyobb-szam-irhato': {
    answer: 31,
    content: {
      hu: {
        problemText: "<p>Melyik az a legnagyobb pozitív egész szám, ami nem írható fel \\(5x+9y\\) alakban, ahol \\(x\\) és \\(y\\) nemnegatív egészek?</p>",
        help1: "Vizsgáljátok 5-ös maradékosztályok szerint a számokat!",
        help2: "Az egyes maradékosztályokban melyik a legkisebb szám, amelyik éppen előáll a megadott alakban?",
      },
    },
  },
  '7z46m2b2nz--szabalyos-dodekaedernek-nehany': {
    answer: 9,
    content: {
      hu: {
        problemText: "<p>Egy szabályos dodekaédernek néhány élét kitöröljük. A megmaradt élekből álló hálózat már bejárható úgy, hogy valamennyi élen pontosan egyszer haladunk át. Legalább hány élet töröltünk?</p>",
        help1: "Ahhoz, hogy egy gráfban legyen minden élet bejáró séta, szükséges hogy a gráf összefüggő legyen.",
        help2: "Ahhoz, hogy egy gráfban legyen minden élet bejáró séta, az is szükséges, hogy a gráfban legfeljebb kettő páratlan fokú csúcs legyen.",
      },
    },
  },
  'vrpem1q42b--tomor-kocka-lapjat': {
    answer: 54,
    content: {
      hu: {
        problemText: "<p>Egy tömör kocka minden lapját négyfelé osztjuk az ábrán látható módon. Hány lehetséges útvonalon juthatunk el a vonalakon \\(P\\)-ből \\(Q\\)-ba, ha minden lépésben közelítenünk kell \\(Q\\) felé?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/3_D_D_2.png",
        help1: "Egy megfelelő <em>PQ</em> út során mindhárom irányba pont kettőt-kettőt kell lépnünk.",
        help2: "Sorban írjátok oda a vonalak mindegyik csomópontjához, hogy hányféleképpen lehet odajutni <em>P</em>-ből!",
      },
    },
  },
  '99v0pt77p4--szamot-paronkent-osszeadtunk': {
    answer: 220,
    content: {
      hu: {
        problemText: "<p>Három pozitív egész számot páronként összeadtunk az összes lehetséges módon. A három eredmény 125, 147, ill. 168 lett. Mennyi a három szám összege?</p><p><em>(pótfeladat)</em></p>",
        help1: "Egy szám hány összegben szerepel?",
        help2: "Minden szám pontosan két összegben szerepel.",
      },
    },
  },
  'ynaj3t5mta--tablazat-sora-oszlopa': {
    answer: 1500,
    content: {
      hu: {
        problemText: "<p>Egy \\(10\\times20\\)-as táblázat minden sora és minden oszlopa számtani sorozatot alkot. A négy sarokban lévő szám összege 30. Mennyi az összes szám összege?</p>",
        help1: "Csoportosítsátok ügyesen a táblázat mezőit! Vagy írjátok fel, hogy milyen számok szerepelnek a táblázat szélső soraiban, illetve oszlopaiban!",
        help2: "Egy számtani sorozatban a számok összege az első és az utolsó tag átlaga, szorozva a tagok számával.",
      },
    },
  },
  '9hjhmvsbxt--durer-kedvenc-kecskejet': {
    answer: 310,
    content: {
      hu: {
        problemText: "<p>Dürer kedvenc kecskéjét a ház sarkához kötötte legelni. A ház oldalai 14 m és 18 m hosszúak, a kötél hossza 20 m. A jószág pontosan \\(k\\pi\\) \\(m^2\\) füvet tud lelegelni. Mekkora \\(k\\) értéke?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/3_D_D_5.png",
        help1: "A terület, amit le tud legelni a kecske, néhány, a ház sarkaiból kifelé rajzolható körcikk uniója.",
        help2: "Egy kör területe a sugarának a négyzete szorozva &pi;-vel.",
      },
    },
  },
  'enrbfb3rt8--teglalap-kis-negyzetre': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>A \\(PQRS\\) téglalap 9 kis négyzetre van osztva, az ábrán látható módon. Minden négyzet különböző oldalhosszúságú, a legkisebb négyzet oldala 2 egység hosszú. Hány egység hosszú a második legkisebb négyzet oldala?</p><p><i>Az négyzetek az ábrán nem méretarányosak.</i></p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/3_D_D_6.png",
        help1: "Paraméterezzétek valamelyik négyzet oldalát!",
        help2: "Egy paraméterrel az egész ábra paraméterezhető, és egy négyzet két oldalát kiszámolhatjátok vele kétféleképpen is.",
      },
    },
  },
  'yczbob190b--megoldasa-egeszek-koreben': {
    answer: 4851,
    content: {
      hu: {
        problemText: "<p>Hány megoldása van a pozitív egészek körében az \\(x+y+z=100\\) egyenletnek?</p>",
        help1: "Legfeljebb mennyi lehet <em>x</em> értéke?<br>(És hányféleképpen osztható szét 97 alma három tetszőleges részre, két körte segítségével?)",
        help2: "Számoljátok össze a megoldásokat <em>x</em> lehetséges értékei szerint!",
      },
    },
  },
  '2mbskp3w9f--tizes-szamrendszerbeli-alakjaban': {
    answer: 6000,
    content: {
      hu: {
        problemText: "<p>A \\(11^{100}-1\\) tízes számrendszerbeli alakjában mi az utolsó négy számjegy?</p>",
        help1: "Egy összeg utolsó négy számjegye csak az összeg tagjainak az utolsó négy számjegyétől függ.",
        help2: "Használjátok a binomiális tételt!",
      },
    },
  },
  'liwsf8dhvj--csodarab-lathato-modon': {
    answer: 1200,
    content: {
      hu: {
        problemText: "<p>Egy csődarab az ábrán látható módon derékszögben megtörik. A méretei szintén az ábrán láthatóak. A külső felülete \\(k\\pi\\) cm\\(^2\\) . Mennyi \\(k\\) értéke?</p><p><i>A két körlemez, ami az ábrán határolja a csődarabot, nem számít bele a cső felületébe.</i></p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/3_D_D_11.png",
        help1: "A csődarabunk kiegyenesíthető egy hengerré, a törés egyenese mentén elforgatva az egyik felét.",
        help2: "Egy hengerpalást felszíne a sugár és a magasság szorzatának a 2&pi;-szerese.",
      },
    },
  },
  'wjgopcu049--legnagyobb-szam-irhato': {
    answer: 287,
    content: {
      hu: {
        problemText: "<p>Melyik az a legnagyobb pozitív egész szám, ami nem írható fel \\(17x + 19y\\) alakban, ahol \\(x\\) és \\(y\\) nemnegatív egészek?</p>",
        help1: "Vizsgáljátok 17-es maradékosztályok szerint a számokat!",
        help2: "Az egyes maradékosztályokban melyik a legkisebb szám, amelyik éppen előáll a megadott alakban?",
      },
    },
  },
  'nbsda4ubbx--sakktablan-mezot-kijelolni': {
    answer: 21,
    content: {
      hu: {
        problemText: "<p>Egy \\(7\\times7\\)-es sakktáblán legfeljebb hány mezőt lehet kijelölni úgy, hogy ne legyen négy olyan közöttük, amelyek egy, a tábla oldalaival párhuzamos állású téglalap négy csúcsát alkotják?</p>",
        help1: "Próbálkozzatok esetszétválasztással! Vagy van olyan sor/oszlop, amelyben van legalább 4 kijelölt mező, vagy minden sorban és oszlopban legfeljebb 3 mező van kijelölve.",
        help2: "Egy hételemű halmaz háromelemű részhalmazai közül legfeljebb hány választható ki úgy, hogy a kiválasztottaknak páronként legfeljebb egy közös elemük legyen?<br>A felső becsléshez pedig célszerű néhány kisebb téglalapra felosztani a táblát.",
      },
    },
  },
};
