import type { CompetitionBank, ProblemBank } from '../src/sources';

// Edition 10's local round, relay only, as the relay practice site serves it: one
// competition per category, and the problems their relays use, each written
// once. Released, so the practice site may import it.

export const competitions: CompetitionBank = {
  'k75yk8w78i--10-local-a': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'o1o7z6id3f--csapat-mindharom-tagja', points: 3 },
        { problemId: 'k6ldhjshoe--cukorkagyarban-harmasaval-csomagoljak', points: 3 },
        { problemId: '0i1m22krdz--csaladban-legkisebb-testvernek', points: 3 },
        { problemId: 'dayodk18hz--albrecht-vasarnap-kap', points: 3 },
        { problemId: 'mymwu47kzm--legkisebb-tal-oszthato', points: 4 },
        { problemId: 'yxnhn50hxi--lathato-sokszog-szomszedos', points: 4 },
        { problemId: '7uh3rq20j9--mikkamakka-vacskamati-aromo', points: 4 },
        { problemId: '1cb1vqzcgt--oxisz-szigetenek-orszaga', points: 4 },
        { problemId: 'ksnzozihql--konyvben-szam-felsoroltak', points: 5 },
        { problemId: '2k4ie1dt34--egyenes-pont-ketton', points: 5 },
        { problemId: '23eox7bdyt--kartyakevero-gepbe-betettunk', points: 5 },
        { problemId: 'zmkxa9ulh7--halaszto-henrik-kiraly', points: 5 },
        { problemId: 'cznpxrddfi--albrecht-durer-edesapjaval', points: 6 },
        { problemId: 'eqhl78z0w3--sorozat-csupa-eseket', points: 6 },
        { problemId: 's5d0rk2sb0--kor-mellekelt-lathato', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 10, round: 'local', category: 'A' },
  },
  'sviksw8sks--10-local-b': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'wr42eqe6zx--csapat-mindharom-tagja', points: 3 },
        { problemId: '0i1m22krdz--csaladban-legkisebb-testvernek', points: 3 },
        { problemId: 'mymwu47kzm--legkisebb-tal-oszthato', points: 3 },
        { problemId: 'lj8371ktce--oxisz-szigetenek-orszaga', points: 3 },
        { problemId: 'hv4g26dld8--mikkamakka-vacskamati-aromo', points: 4 },
        { problemId: 'dkg599ogdd--albrecht-durer-uvegablakot', points: 4 },
        { problemId: 'ksnzozihql--konyvben-szam-felsoroltak', points: 4 },
        { problemId: 'l7c8oyly1u--kepen-negyzet-szabalyos', points: 4 },
        { problemId: 'p8zxcg5muw--halaszto-henrik-kiraly', points: 5 },
        { problemId: 'med2chasis--kulonbozo-szam-szorzata', points: 5 },
        { problemId: 'u8lrz929yi--kiszinezni-lathato-alakzat', points: 5 },
        { problemId: 'go2dj8rrom--kartyakevero-gepbe-betettunk', points: 5 },
        { problemId: 'cjqhsd9qew--egyenes-pont-ketton', points: 6 },
        { problemId: 'l52j8hbdz4--kor-mellekelt-lathato', points: 6 },
        { problemId: 'iahvoex9kl--regi-ora-szamlapjarol', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 10, round: 'local', category: 'B' },
  },
};

export const problems: ProblemBank = {
  'o1o7z6id3f--csapat-mindharom-tagja': {
    answer: 75,
    content: {
      hu: {
        problemText: "<p>A csapat mindhárom tagja végezze el a következő műveletet! Gondoljon mindenki arra a számra, ahányadikán született. A gondolt számhoz adjon hozzá 13-at, szorozza meg 2-vel. Az eredményből vonja ki az eredmény számjegyeinek összegét. Az így kapott számnak mindenki vegye a számjegyeinek összegét, majd mindenki szorozza meg ezt a számot 2-vel és adjon ehhez 7-et. Mennyi a végezetül kapott három szám összege?</p>",
        help1: "Mindhárom csapattag ugyanazt az eredményt fogja kapni. Elég az egyiket végigszámolni.",
        help2: "Mivel minden nap ugyanazt az eredményt adja, érdemes pl. a 3-at választani.",
      },
    },
  },
  'k6ldhjshoe--cukorkagyarban-harmasaval-csomagoljak': {
    answer: 4,
    content: {
      hu: {
        problemText: "<p>Egy cukorkagyárban hármasával csomagolják zacskókba a cukorkákat. Egy dobozba három zacskót tesznek és egy ládába három doboz fér. Hány ládára van szükség, ha 100 szem cukrot szeretnénk becsomagolni?</p>",
        help1: "Egy ládában hány cukorka lehet legfeljebb?",
        help2: "Egy dobozba 9 cukorka fér el. Emiatt egy dobozban 27 cukorka lehet maximum.",
      },
    },
  },
  '0i1m22krdz--csaladban-legkisebb-testvernek': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>Egy családban a legkisebb testvérnek éppen annyi nővére van, mint bátyja. A legidősebb testvérnek pedig feleannyi húga van, mint öccse. Hányan vannak összesen testvérek?</p>",
        help1: "A legidősebb és a legfiatalabb testvérnek különböző neműnek kell lennie.",
        help2: "A legfiatalabb testvér fiú, a legidősebb lány.",
      },
    },
  },
  'dayodk18hz--albrecht-vasarnap-kap': {
    answer: 3140,
    content: {
      hu: {
        problemText: "<p>Albrecht minden vasárnap kap 1000 Ft zsebpénzt az apukájától. Semmi másra nem költ belőle, csak csokira: szerdánként délben vesz egy-egy egész tábla csokit, és az összes többi napon délben pedig egy-egy szelet csokit. Egy tábla csoki 280 Ft-ba, egy szelet csoki 120 Ft-ba kerül. Ha 2016. október 1-jén reggel 2500 Ft-ja volt Albrechtnek, akkor mennyi pénze lett október 31-én estére? (2016-ban október 1. szombatra esett).</p>",
        help1: "Szombattól szombatig hogyan változik Albrecht zsebpénze?",
        help2: "Október 29-én 2500 Ft-ja volt Albrechtnek.",
      },
    },
  },
  'mymwu47kzm--legkisebb-tal-oszthato': {
    answer: 288,
    content: {
      hu: {
        problemText: "<p>Melyik az a legkisebb 36-tal osztható pozitív egész szám, melyben csak páros számjegyek vannak?</p>",
        help1: "Mivel ekkor a szám kilenccel is osztható, ezért a jegyek összege legalább 18.",
        help2: "A szám néggyel is osztható, ezért a szám 88-ra végződik.",
      },
    },
  },
  'yxnhn50hxi--lathato-sokszog-szomszedos': {
    answer: 50,
    content: {
      hu: {
        problemText: "<p>Az ábrán látható sokszög szomszédos oldalai merőlegesek egymásra. Néhány oldal hosszát megadtuk egységben mérve. Hány egység a sokszög kerülete?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_H_A_6.png",
        help1: "Külön vizsgáld meg a függőleges és vízszintes szakaszokat.",
        help2: "A baloldali és a jobboldali függőleges szakaszok összege egyenlő. Hasonló igaz a vízszintesekre is.",
      },
    },
  },
  '7uh3rq20j9--mikkamakka-vacskamati-aromo': {
    answer: 12,
    content: {
      hu: {
        problemText: "<p>Mikkamakka, Vacskamati, Aromo és Dömdödöm moziba mennek autóval. Hányféleképpen ülhetnek be a négyszemélyes autóba, ha csak Mikkamakka és Aromo tud vezetni (tehát kettejük közül kell valakinek a kormányhoz ülnie)?</p>",
        help1: "Két esetre bonthatjuk a feladatot.",
        help2: "Ha pl. Aromo vezet, akkor mellette hányan ülhetnek? És a hátsó jobboldali ülésen?",
      },
    },
  },
  '1cb1vqzcgt--oxisz-szigetenek-orszaga': {
    answer: 2,
    content: {
      hu: {
        problemText: "<p>Óxisz szigetének 14 országa látható a térképen. Bergengócia (egy másik szigeten található ország) szeretné megszervezni saját külképviseletét Óxisz szigetén. Akkor tekinthető Bergengócia egy óxiszi országbeli külképviselete megoldottnak, ha az országban vagy annak valamely szomszédjában van Bergengóc Nagykövetség. Legkevesebb hány országban szükséges Bergengóc Nagykövetséget létesíteni, hogy Óxisz minden országának külképviselete megoldott legyen?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_H_A_8.png",
        help1: "Nem érdemes kiválasztani a legnagyobb országot.",
        help2: "A felső két országból a baloldalit érdemes kiválasztani.",
      },
    },
  },
  'ksnzozihql--konyvben-szam-felsoroltak': {
    answer: 36,
    content: {
      hu: {
        problemText: "<p>Egy könyvben egy-egy szám után felsorolták az összes osztóját is növekvő sorrendben. Például:<br><div align=\"center\">40 : 1, 2, 4, 5, 8, 10, 20, 40</div></p><p>Sajnos azonban Móricka összefirkálta az egyiket, így csak ez látszik:<br><div align=\"center\">♠ : 1, \u0004, \u0004, 4, \u0004, \u0004, \u0004, \u0004, \u0004</div></p><p>Mely szám állt a ♠ helyén, mielőtt Móricka összefirkálta volna?</p>",
        help1: "Ez a szám biztosan osztható 2-vel és 3-mal is. Az osztók párokba állíthatók, ahol a párok szorzata maga a szám (pl. 40-nél 2, 20 vagy éppen az 5, 8).",
        help2: "A szám 6-tal is osztható. Mi lehet ennek az osztónak a párja?",
      },
    },
  },
  '2k4ie1dt34--egyenes-pont-ketton': {
    answer: 12,
    content: {
      hu: {
        problemText: "<p>Hány olyan egyenes van, amely az alábbi kilenc pont közül pontosan kettőn megy át?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_H_A_10.png",
        help1: "Vizsgáld külön a pontokat típus szerint (csúcs, oldalközépső, középső).",
        help2: "Egy csúcson keresztül két ilyen egyenest húzhatunk.",
      },
    },
  },
  '23eox7bdyt--kartyakevero-gepbe-betettunk': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>Egy kártyakeverő gépbe betettünk 5 betűkártyát TOKAJ sorrendben. A gép mindig ugyanolyan módon keveri a lapokat, az első keverés után KATJO sorrendben adta vissza. Még hányszor kell bedobnunk a kártyákat a gépbe, hogy az eredeti szót visszakapjuk?</p>",
        help1: "Hány keverés után kerül vissza az T betű az első helyre?",
        help2: "Mit tudunk a többi betűről?",
      },
    },
  },
  'zmkxa9ulh7--halaszto-henrik-kiraly': {
    answer: 825,
    content: {
      hu: {
        problemText: "<p>Halasztó Henrik király a születésnapján elhatározta, hogy másnapra összehívja tanácsosait, ám estére meggondolta magát és elhalasztotta egy nappal a tanácskozást. Másnap este ismét úgy gondolta, hogy jobb lenne egy későbbi időpont, ezért most még két nappal későbbre tette az időpontot. Amikor hetedszerre halasztotta el a tanácskozás időpontját, a tanácsosok kiszámolták, hogy így pont 43-at kapnak, ha a találkozó hónapjának és napjának számát összeadják. Tudjuk, hogy a király mindig az előző halasztásánál kétszer olyan hosszú idővel halasztotta el a tanácskozást. Mennyit kapunk, ha Halasztó Henrik születésnapján a hónap sorszámának 100-szorosát és a napjának számát összeadjuk?</p>",
        help1: "Csak egy olyan nap van, ahol a nap és a hónap sorszámának összege 43.",
        help2: "Szilveszterkor volt a tanácskozás, előtte 1+2+...+64 nappal volt a tanácskozás.",
      },
    },
  },
  'cznpxrddfi--albrecht-durer-edesapjaval': {
    answer: 339,
    content: {
      hu: {
        problemText: "<p>Albrecht Dürer az édesapjával, idősebb Albrechttel játszik. Az öreg Albrecht az 1, 2, 3, 4, 5 számkártyákból egy háromjegyű és egy kétjegyű számot készít, fia pedig összeszorozza ezeket. Mennyi a két kirakott szám összege, ha a szorzatuk 7560?</p>",
        help1: "Az egyik számnak oszthatónak kell lennie 5-tel. A másiknak pedig 8-cal.",
        help2: "A háromjegyű szám végződik 5-re.",
      },
    },
  },
  'eqhl78z0w3--sorozat-csupa-eseket': {
    answer: 63,
    content: {
      hu: {
        problemText: "<p>A 2, 1, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1, ... sorozat csupa 2-eseket tartalmazó blokkokból és azokat elválasztó 1-esekből áll úgy, hogy a következő blokkban mindig eggyel több 2-es van, mint az előzőben. Hány 2-esből áll a sorozat 2016. számát tartalmazó blokk?</p>",
        help1: "Ha ez a sorozat egy 1-sel kezdődne, akkor mi lenne a számok összege? (az első néhány 1, 4, 9, 16).",
        help2: "Az összeg körülbelül a tagok számának a kétszerese. Tehát a 2016 tagnál legfeljebb 4032.",
      },
    },
  },
  's5d0rk2sb0--kor-mellekelt-lathato': {
    answer: 25,
    content: {
      hu: {
        problemText: "<p>Négy kör a mellékelt ábrán látható módon helyezkedik el. Írjátok be a körökön belül létrejött tíz tartományba a 0, 1, \\(\\ldots\\), 9 számokat úgy, hogy mindegyik pontosan egyszer szerepeljen és az egyes körökön belüli számok összege egyenlő legyen egymással. Legfeljebb mekkora lehet ez az összeg?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_H_A_15.png",
        help1: "Egy külső részbe írt szám egyenlő három másik összegével. Ha ezt mindhárom részre felírod, akkor kiderül, hogy a külsők összege legalább 15 (ezt javítani is lehet 18-ra). Ebből az összeg maximális értékére adhatunk egy (még nem pontos) becslést.",
        help2: "Ha a külső részek összege 18, akkor a középső köré 27 lenne. De ez nem lehet, mert a középső körben lévő számok összege ennél mindenképpen kisebb. Emiatt a 27 csökkenthető. Hol találkozik ez a két érték? Erre keressetek konstrukciót.",
      },
    },
  },
  'wr42eqe6zx--csapat-mindharom-tagja': {
    answer: 126,
    content: {
      hu: {
        problemText: "<p>A csapat mindhárom tagja végezze el a következő műveletet! Gondoljon mindenki arra a számra, ahányadikán született. A gondolt számhoz adjon hozzá 17-et, szorozza meg 2-vel. Az eredményből vonja ki az eredmény számjegyeinek összegét. Az így kapott számnak mindenki vegye a számjegyeinek összegét, majd mindenki szorozza meg ezt a számot 4-gyel és adjon ehhez 6-ot. Mennyi a végezetül kapott három szám összege?</p>",
        help1: "Mindhárom csapattag ugyanazt az eredményt fogja kapni. Elég az egyiket végigszámolni.",
        help2: "Mivel minden nap ugyanazt az eredményt adja, érdemes pl. a 3-at választani.",
      },
    },
  },
  'lj8371ktce--oxisz-szigetenek-orszaga': {
    answer: 2,
    content: {
      hu: {
        problemText: "<p>Óxisz szigetének 14 országa látható a térképen. Bergengócia (egy másik szigeten található ország) szeretné megszervezni saját külképviseletét Óxisz szigetén. Akkor tekinthető Bergengócia egy óxiszi országbeli külképviselete megoldottnak, ha az országban vagy annak valamely szomszédjában van Bergengóc Nagykövetség. Legkevesebb hány országban szükséges Bergengóc Nagykövetséget létesíteni, hogy Óxisz minden országának külképviselete megoldott legyen?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_H_B_4.png",
        help1: "Nem érdemes kiválasztani a legnagyobb országot.",
        help2: "A felső két országból a baloldalit érdemes kiválasztani.",
      },
    },
  },
  'hv4g26dld8--mikkamakka-vacskamati-aromo': {
    answer: 48,
    content: {
      hu: {
        problemText: "<p>Mikkamakka, Vacskamati, Aromo, Szigfrid és Dömdödöm moziba mennek autóval. Hányféleképpen ülhetnek be egy ötüléses autóba, ha csak Mikkamakka és Aromo tud vezetni (tehát kettejük közül kell valakinek a volánhoz ülnie)?</p>",
        help1: "Két esetre bonthatjuk a feladatot.",
        help2: "Ha pl. Aromo vezet, akkor mellette hányan ülhetnek? És a hátsó jobboldali ülésen?",
      },
    },
  },
  'dkg599ogdd--albrecht-durer-uvegablakot': {
    answer: 40,
    content: {
      hu: {
        problemText: "<p>Albrecht Dürer üvegablakot tervez a nürnbergi Lorenzkirche számára. Az ábrán látható a tervrajz, melyen minden kis négyzet egységnyi területű (tehát az egész ablaktábla épp 100 egységnyi területű). Hány egységnyi a szürke rész területe?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_H_B_6.png",
        help1: "Minden levél ugyanolyan területű. Egy levél felosztható háromszögekre.",
        help2: "Egy levél köré tudunk rajzolni egy 4×5-ös téglalapot.",
      },
    },
  },
  'l7c8oyly1u--kepen-negyzet-szabalyos': {
    answer: 12,
    content: {
      hu: {
        problemText: "<p>A képen egy négyzet, egy szabályos hatszög és egy szürke szabályos sokszög találkozik.</p><p>Hány oldalú a szürke szabályos sokszög?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_H_B_8.png",
        help1: "Egy négyzetnek 90, egy hatszögnek 120 fokos egy szöge.",
        help2: "A sokszög egy szöge 360-90-120=150 fok.",
      },
    },
  },
  'p8zxcg5muw--halaszto-henrik-kiraly': {
    answer: 825,
    content: {
      hu: {
        problemText: "<p>Halasztó Henrik király a születésnapján elhatározta, hogy másnapra összehívja tanácsosait, ám estére meggondolta magát és elhalasztotta egy nappal a tanácskozást. Másnap este ismét úgy gondolta, hogy jobb lenne egy későbbi időpont, ezért most még két nappal későbbre tette az időpontot. Amikor hetedszerre halasztotta el a tanácskozás időpontját, a tanácsosok kiszámolták, hogy így pont 43-at kapnak, ha a találkozó hónapjának és napjának számát összeadják. Tudjuk, hogy a király mindig az előző halasztásánál kétszer olyan hosszú idővel halasztotta el a tanácskozást.</p><p>Mennyit kapunk, ha Halasztó Henrik születésnapján a hónap sorszámának 100-szorosát és a\r napjának számát összeadjuk?</p>",
        help1: "Csak egy olyan nap van, ahol a nap és a hónap sorszámának összege 43.",
        help2: "Szilveszterkor volt a tanácskozás, előtte 1+2+...+64 nappal volt a tanácskozás.",
      },
    },
  },
  'med2chasis--kulonbozo-szam-szorzata': {
    answer: 23,
    content: {
      hu: {
        problemText: "<p>Négy különböző pozitív egész szám szorzata 128. Mennyi az összegük?</p>",
        help1: "Ezek a számok mindenképpen kettőhatványok.",
        help2: "A 128 a 2 hetedik hatványa.",
      },
    },
  },
  'u8lrz929yi--kiszinezni-lathato-alakzat': {
    answer: 6,
    content: {
      hu: {
        problemText: "<p>Hányféleképpen lehet kiszínezni az ábrán látható alakzat öt tartományát pirossal, sárgával és kékkel, az alábbi feltételek betartásával?</p><p><ul><li>Minden tartományt ki kell színezni;<li>Szomszédos tartományok nem lehetnek azonos színűek; <li>A forgatással egymásba vihető színezéseket nem tekintjük különbözőnek.</ul> </p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_H_B_11.png",
        help1: "Mindhárom színt használnunk kell. Lesz olyan szín, amellyel pontosan egy tartományt színezünk ki.",
        help2: "Ha piros tartományból van egy, akkor hányféle különböző színezés lehet?",
      },
    },
  },
  'go2dj8rrom--kartyakevero-gepbe-betettunk': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>Egy kártyakeverő gépbe betettünk hét betűkártyát MISKOLC sorrendben. A gép mindig ugyanolyan módon keveri a lapokat, az első keverés után CMLOSKI sorrendben adta vissza. Még hányszor kell bedobnunk a kártyákat a gépbe, hogy az eredeti szót visszakapjuk?</p>",
        help1: "Hány keverés után kerül vissza az M betű az első helyre?",
        help2: "Mit tudunk a többi betűről?",
      },
    },
  },
  'cjqhsd9qew--egyenes-pont-ketton': {
    answer: 48,
    content: {
      hu: {
        problemText: "<p>Hány olyan egyenes van, amely az alábbi 16 pont közül pontosan kettőn megy át?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_H_B_13.png",
        help1: "Nézzük meg az egy ponton átmenő egyeneseket.",
        help2: "Egy ponton mindenképpen 6 kétpontú egyenes megy át.",
      },
    },
  },
  'l52j8hbdz4--kor-mellekelt-lathato': {
    answer: 25,
    content: {
      hu: {
        problemText: "<p>Négy kör a mellékelt ábrán látható módon helyezkedik el. Írjátok be a körökön belül létrejött tíz tartományba a 0, 1, \\(\\ldots\\), 9 számokat úgy, hogy mindegyik pontosan egyszer szerepeljen és az egyes körökön belüli számok összege egyenlő legyen egymással. Legfeljebb mekkora lehet ez az összeg?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/10_H_B_14.png",
        help1: "Egy külső részbe írt szám egyenlő három másik összegével. Ha ezt mindhárom részre felírod, akkor kiderül, hogy a külsők összege legalább 15 (ezt javítani is lehet 18-ra). Ebből az összeg maximális értékére adhatunk egy (még nem pontos) becslést.",
        help2: "Ha a külső részek összege 18, akkor a középső köré 27 lenne. De ez nem lehet, mert a középső körben lévő számok összege ennél mindenképpen kisebb. Emiatt a 27 csökkenthető. Hol találkozik ez a két érték? Erre keressetek konstrukciót.",
      },
    },
  },
  'iahvoex9kl--regi-ora-szamlapjarol': {
    answer: 2880,
    content: {
      hu: {
        problemText: "<p>Egy régi óra számlapjáról leestek a számok, csak a 12-es, az 1-es és a 3-as maradt a helyén. Visszaragasztottam a többi kilenc számot is, de össze-vissza sorrendben. Ezután minden szomszédpárra kiszámoltam a két szám különbségét, majd összeadtam ezt a 12 számot, így 72-t kaptam. Hányféleképpen ragaszthattam vissza a számokat? <br><i>A számok az eredeti helyükre is visszakerülhetnek.</i></p>",
        help1: "Mi a lehető legnagyobb különbség, és ezt mikor érhetjük el?",
        help2: "Hányféleképpen lehet visszaragasztani a nagyobb és kisebb számokat felváltva?",
      },
    },
  },
};
