import type { CompetitionBank, ProblemBank } from '../src/sources';

// Edition 12's local round, relay only, as the relay practice site serves it: one
// competition per category, and the problems their relays use, each written
// once. Released, so the practice site may import it.

export const competitions: CompetitionBank = {
  'u3dfpsf6u9--12-local-a': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: '14epphicog--csillag', points: 3 },
        { problemId: 'egemobhrtz--nagymama-palacsintat-sutott', points: 3 },
        { problemId: '5s0orlsmsz--amerikaban-hasznalatos-urmertekeket', points: 3 },
        { problemId: 'hc2wrcytgl--kepen-urallomas-tervrajza', points: 3 },
        { problemId: 'aero9hngy0--albrecht-macska-epp', points: 4 },
        { problemId: 'uyohlg0uc4--kepen-nurnberg-reszenek', points: 4 },
        { problemId: '7y9mnqxgok--transz-oxisz-vasutvonalon', points: 4 },
        { problemId: '9j26tefv2d--kovetkezo-muveletsor-erteket', points: 4 },
        { problemId: 'm2qk3vcr7w--hanyszor-leszurni-korzot', points: 5 },
        { problemId: 'rpq5mimj1s--asztalom-tetejere-allitom', points: 5 },
        { problemId: '8b1r8jjznt--metszespontja-otszognek-kornek', points: 5 },
        { problemId: 'zlu8jbzr4b--lord-hesketh-gazdag', points: 5 },
        { problemId: 'xs83rwssov--kivalasztani-szamok-kivalasztottak', points: 6 },
        { problemId: 'utc6hprszh--szabalyos-hetszog-lathato', points: 6 },
        { problemId: 'g0uel30lvp--lathato-tablazat-mezojebe', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 12, round: 'local', category: 'A' },
  },
  '5aoxpqqc6p--12-local-b': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'ngqgtvdl9f--lathato-csillagok-szamabol', points: 3 },
        { problemId: 'i4agoz04lf--albrecht-macska-epp', points: 3 },
        { problemId: 'v6pr7pxyyi--amerikaban-hasznalatos-urmertekeket', points: 3 },
        { problemId: 'f4iayzq0h1--kepen-nurnberg-reszenek', points: 3 },
        { problemId: 'ilygcrdmwy--hanyszor-leszurni-korzot', points: 4 },
        { problemId: 'riola2z91o--transz-oxisz-vasutvonalon', points: 4 },
        { problemId: 'vke5ndiv4w--kovetkezo-muveletsor-erteket', points: 4 },
        { problemId: 'fgem2icy7h--asztalom-tetejere-allitom', points: 4 },
        { problemId: 'ht0c5oja0c--negyzet-lathato-legnagyobb', points: 5 },
        { problemId: 'lustyi55cq--metszespontja-hetszognek-kornek', points: 5 },
        { problemId: '7c7fy7uehw--lord-hesketh-gazdag', points: 5 },
        { problemId: '7f2jrzsn6a--kivalasztani-szamok-kivalasztottak', points: 5 },
        { problemId: 'xtjrxv7jv9--szabalyos-kilencszog-lathato', points: 6 },
        { problemId: 'ynj0btixb9--bolondos-baldvin-kiraly', points: 6 },
        { problemId: 'fuhlf24723--lathato-tablazat-mezojebe', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 12, round: 'local', category: 'B' },
  },
};

export const problems: ProblemBank = {
  '14epphicog--csillag': {
    answer: 54,
    content: {
      hu: {
        problemText: "<p>Hány csillag van az ábrán?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_H_A_1.png",
        help1: "Nézzétek soronként!",
        help2: "A legtöbb sorban 6 csillag van.",
      },
    },
  },
  'egemobhrtz--nagymama-palacsintat-sutott': {
    answer: 32,
    content: {
      hu: {
        problemText: "<p>Nagymama palacsintát sütött unokáinak. Anna három palacsintát evett, Bori kettővel többet, mint Anna. Cézár pont annyi palacsintát evett, mint a két lány együttvéve. Amikor nagymama elrakta a maradékot, megállapította, hogy pont ugyanannyi palacsinta maradt meg, mint ahányat megettek az unokák.</p><p>Hány palacsintát sütött összesen Nagymama, ha ő maga nem evett meg egyet sem?</p>",
        help1: "Cézár 8 palacsintát evett meg.",
        help2: "Nagymama éppen kétszer annyi palacsintát sütött, mint amennyit a három unokája összesen megevett.",
      },
    },
  },
  '5s0orlsmsz--amerikaban-hasznalatos-urmertekeket': {
    answer: 16,
    content: {
      hu: {
        problemText: "<p>Az Amerikában használatos űrmértékeket az alábbi szabályok szerint lehet átváltani egymásra:</p><p><br><center>2 pint = 1 quart</center><br><center>1 gallon = 8 pint</center><br><center>1 quart = 32 uncia</center><br><center>1 cup = 8 uncia<br>Hány cup folyadék egyenlő egy gallonnal?</p>",
        help1: "1 gallon = 4 quart.",
        help2: "1 quart = 4 cup.",
      },
    },
  },
  'hc2wrcytgl--kepen-urallomas-tervrajza': {
    answer: 8,
    content: {
      hu: {
        problemText: "<p>A képen egy űrállomás tervrajza látható. A körök kabinokat jelölnek, közöttük csövek jelentenek összeköttetéseket.</p><p>Az űrállomáson lakó űrhajósok számára a következő szabályokat írták elő:</p><p><ul><li> Űrhajós csak kabinban lakhat (csőben nem), egy kabinban egyszerre csak egy űrhajós fér el.<li>A megfelelő oxigénellátás érdekében szomszédos (azaz csővel közvetlenül összekötött) kabinokban sem lakhat egyszerre űrhajós.</ul> Legfeljebb hány űrhajós lakhat az űrállomáson?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_H_A_4.png",
        help1: "Színezzétek ki sakktáblaszerűen az űrállomás kabinjait!",
        help2: "Az a legjobb, ha csak az egyik színű kabinokba költöznek be, de azok közül az összesbe.",
      },
    },
  },
  'aero9hngy0--albrecht-macska-epp': {
    answer: 17,
    content: {
      hu: {
        problemText: "<p>Albrecht macska épp egy létra középső fokán üldögél. Úgy jutott ide, hogy miután felmászott a nyolcadik létrafokra, meghallotta, hogy Bodri kutya lent ugat, ezért lejjebb mászott három fokot, hogy lássa, miért ugat. Ezután ugrott felfelé két nagyot, majd visszanézve megállapította, hogy mindkét ugrásával egy-egy fok fölött ugrott át. Ekkor döntött úgy, hogy megpihen. Hány fokos a létra?</p>",
        help1: "Kíváncsiságában az ötödik fokig mászott le, majd kettőket ugrott felfelé.",
        help2: "Az ugrások után a kilencedik fokon ül, ami a középső.",
      },
    },
  },
  'uyohlg0uc4--kepen-nurnberg-reszenek': {
    answer: 13,
    content: {
      hu: {
        problemText: "<p>A képen Nürnberg egy részének térképe látható, minden egyenes szakasz egy-egy utcát jelöl. Dürer festőműhelye az M-mel, lakása az L-lel jelölt kereszteződésnél található.</p><p>Dürer nagyon kedvel errefelé sétálni, ezért egyik nap úgy ment haza, hogy közben minél több utcát járhasson végig. Ha egy utcába bement, akkor azon végig is sétált. Egyetlen utcát sem járt végig egynél többször, de többször is járhatott ugyanazon kereszteződésben.</p><p>Legfeljebb hány utcán sétálhatott végig? </p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_H_A_6.png",
        help1: "Ha egy kereszteződésben 4 út találkozik, Dürer maximum kétszer járhatott ott.",
        help2: "Ha pedig egy kereszteződésben 3 út találkozik, ott legfeljebb csak egyszer járhatott.",
      },
    },
  },
  '7y9mnqxgok--transz-oxisz-vasutvonalon': {
    answer: 14,
    content: {
      hu: {
        problemText: "<p>A Transz-Óxisz Vasútvonalon közlekedő szerelvényeknek a következő előírásokat kell teljesíteniük:</p><p><ul><li> Bármely két másodosztályú ülőkocsi között kell legyen legalább egy elsőosztályú ülőkocsi.</p><p>- Bármely két elsőosztályú ülőkocsi között kell legyen legalább egy hálókocsi.<li> Bármely két hálókocsi között kell legyen legalább egy étkezőkocsi.<li> Legfeljebb két étkezőkocsi lehet egy szerelvényben. </ul> Legfeljebb hány kocsiból állhat egy ilyen vasúti szerelvény, ha a mozdonyokat és a felsoroltaktól különböző típusú kocsikat nem számoljuk?</p>",
        help1: "Legfeljebb 3 hálókocsi lehet a vonatban.",
        help2: "Legfeljebb 4 elsőosztályú kocsi lehet a vonatban.",
      },
    },
  },
  '9j26tefv2d--kovetkezo-muveletsor-erteket': {
    answer: 315,
    content: {
      hu: {
        problemText: "<p>A következő műveletsor értékét szerettem volna számológéppel kiszámítani: \\(17 \\cdot 5 + 13 \\cdot 6 + 23 \\cdot 4\\) </p><p>De nem 255-öt kaptam eredményül, mert a feladatban szereplő kilenc számjegy egyike helyett véletlenül a nála eggyel nagyobbat ütöttem be a számológépebe.</p><p>Mi a lehetséges legnagyobb eredmény, amit megkaphattam?</p>",
        help1: "Érdemes a jó és az elütött eredmény különbségét néznetek!",
        help2: "Ha például rögtön az első jegyet ütnék el, 50-nel nagyobb számot kapnánk.",
      },
    },
  },
  'm2qk3vcr7w--hanyszor-leszurni-korzot': {
    answer: 16,
    content: {
      hu: {
        problemText: "<p>Legalább hányszor kell leszúrni a körzőt a képen látható alakzat megrajzolásához?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_H_A_9.png",
        help1: "A körzőt csak metszéspontba érdemes leszúrni.",
        help2: "Az összes metszéspontba le kell szúrni a körzőt.",
      },
    },
  },
  'rpq5mimj1s--asztalom-tetejere-allitom': {
    answer: 80,
    content: {
      hu: {
        problemText: "<p>Ha az asztalom tetejére állítom a macskámat, akkor a földön álló teknősöm fejéhez képest a macska feje 105 cm-rel van feljebb. Ha a teknőst állítom az asztal tetejére, és a macskát hagyom a földön, akkor 55 cm-rel van magasabban a teknős feje.</p><p>Hány cm magas az asztalom?</p>",
        help1: "Rajzoljatok ábrát mindkét esethez!",
        help2: "Mi a helyzet például akkor, ha a teknős 10 cm magas?",
      },
    },
  },
  '8b1r8jjznt--metszespontja-otszognek-kornek': {
    answer: 10,
    content: {
      hu: {
        problemText: "<p>Legfeljebb hány metszéspontja lehet egy ötszögnek és egy körnek?</p>",
        help1: "Legfeljebb hány metszéspontja lehet egy körnek és egy egyenesnek?",
        help2: "Legfeljebb hány metszéspontja lehet a körnek az ötszög egy oldalával?",
      },
    },
  },
  'zlu8jbzr4b--lord-hesketh-gazdag': {
    answer: 1996,
    content: {
      hu: {
        problemText: "<p>Lord Hesketh egy gazdag, de bohókás autógyűjtő. Az első autóját még 1968. november 16-án vásárolta. Ezután mindig a következő szabály szerint bővítette gyűjteményét: amint a legutóbb vásárolt autója annyi éves lett, mint ahány autója éppen volt, másnap rögtön vett egy új példányt a gyűjteményébe.</p><p>Melyik évben vette meg az első Rolls Royce-ját, ha a kedvenc Jaguarja 13 éves volt akkor?</p><p><i>Lord Hesketh csak vadonatúj autókat vásárol és az autói életkorát mindig a megvásárlásuktól számolja.</i></p>",
        help1: "Írjátok fel, hogy amikor a lord új autót vett, melyik kocsija hány éves volt!<br><i>Például a legelső autója éppen 1+2 = 3 éves volt akkor, amikor megvette a harmadikat, és 1+2+3 = 6 éves akkor, amikor a negyediket vette.</i>",
        help2: "Kedvenc Jaguárja a 6. autója volt.",
      },
    },
  },
  'xs83rwssov--kivalasztani-szamok-kivalasztottak': {
    answer: 43,
    content: {
      hu: {
        problemText: "<p>Legfeljebb hányat lehet kiválasztani az \\(1, 2, \\ldots, 64\\) számok közül úgy, hogy ne legyen a kiválasztottak közt két olyan szám, amelyek közül az egyik kétszerese a másiknak?</p>",
        help1: "Legfeljebb hány számot lehet kiválasztani az 1, 2, 4, 8, 16, 32 és a 64 közül?",
        help2: "Válasszátok ki a páratlan számokat! Továbbá a 4-gyel osztható, de 8-cal nem osztható számokat. Meg a 16-tal osztható, de 32-vel nem oszthatóakat. És a 64-et is.",
      },
    },
  },
  'utc6hprszh--szabalyos-hetszog-lathato': {
    answer: 14,
    content: {
      hu: {
        problemText: "<p>Az ábrán egy szabályos hétszög látható a középpontjával.</p><p>Hány olyan háromszög van, amelynek a csúcsai a hétszög csúcsai közül valók és a háromszög tartalmazza a hétszög középpontját?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_H_A_14.png",
        help1: "Ha találtatok egy jó háromszöget, akkor az elforgatásával is jó háromszögeket kaptok.",
        help2: "Nézzétek meg, hogy mi lehet, ha a háromszög legrövidebb oldala olyan hosszú, mint az <em>AB</em> oldal, és mi lehet, ha olyan hosszú, mint az <em>AC</em> oldal. Lehet-e olyan hosszú, mint <em>AD</em>?",
      },
    },
  },
  'g0uel30lvp--lathato-tablazat-mezojebe': {
    answer: 42,
    content: {
      hu: {
        problemText: "<p>Az ábrán látható táblázat kilenc mezőjébe szeretnénk beírni az \\(1, 2,\\dots, 9\\) számokat úgy, hogy minden sorban balról jobbra és minden oszlopban fentről lefelé növekvő sorrendben kövessék egymást a számok. </p><p>Hányféleképpen tehetjük ezt meg, ha minden számot pontosan egyszer használunk fel?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_H_A_15.png",
        help1: "A bal felső sarokba mindenképpen az 1 kerül, a jobb alsóba pedig a 9.",
        help2: "A kettes két helyre kerülhet. Kezdjétek el vizsgálni az eseteket! Hova kerülhet ezek után a 3-as, a 4-es és a többi szám?",
      },
    },
  },
  'ngqgtvdl9f--lathato-csillagok-szamabol': {
    answer: 35,
    content: {
      hu: {
        problemText: "<p>Az ábrán látható csillagok számából kivontam a karikák számát.  Mennyit kaptam eredményül?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_H_B_1.png",
        help1: "Nézzétek soronként!",
        help2: "A legtöbb sorban 6 csillag van.",
      },
    },
  },
  'i4agoz04lf--albrecht-macska-epp': {
    answer: 15,
    content: {
      hu: {
        problemText: "<p>Albrecht macska épp egy létra középső fokán üldögél. Úgy jutott ide, hogy miután felmászott a tizedik létrafokra, meghallotta, hogy Bodri kutya ugat a szomszédban, ezért feljebb mászott még négy fokot, hogy lássa, miért ugat. Ezután ugrott lefelé két nagyot, majd visszanézve megállapította, hogy mindkét ugrásával két-két fok fölött ugrott át. Ekkor döntött úgy, hogy megpihen. Hány fokos a létra?</p>",
        help1: "Lefelé kétszer 3 foknyit ugrott.",
        help2: "Az ugrások után a nyolcadik fokon ül, ami a középső.",
      },
    },
  },
  'v6pr7pxyyi--amerikaban-hasznalatos-urmertekeket': {
    answer: 768,
    content: {
      hu: {
        problemText: "<p>Az Amerikában használatos űrmértékeket az alábbi szabályok szerint lehet átváltani egymásra:</p><p><center>1 gallon  =  8 pint</center><br><center>1 quart  =  2 pint</center><br><center>1 quart  =  32 folyékony uncia</center><br><center>1 cup  =  8 folyékony uncia</center><br><center>1 cup  =  16 evőkanál</center><br><center>1 evőkanál  =  3 teáskanál</center></p><p>Hány teáskanálnyi folyadék egyenlő 1 gallonnal?</p>",
        help1: "1 gallon = 4 quart.",
        help2: "1 quart = 4 cup, és így tovább.",
      },
    },
  },
  'f4iayzq0h1--kepen-nurnberg-reszenek': {
    answer: 15,
    content: {
      hu: {
        problemText: "<p>A képen Nürnberg egy részének térképe látható, minden egyenes szakasz egy-egy utcát jelöl. Dürer festőműhelye az M-mel, lakása az L-lel jelölt kereszteződésnél található.<br>Dürer nagyon kedvel errefelé sétálni, ezért egyik nap úgy ment haza, hogy közben minél több utcát járhasson végig. Ha egy utcába bement, akkor azon végig is sétált. Egyetlen utcát sem járt végig egynél többször, de többször is járhatott ugyanabban a kereszteződésben.</p><p>Legfeljebb hány utcán sétálhatott végig?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_H_B_4.png",
        help1: "Ha egy kereszteződésben 4 út találkozik, Dürer maximum kétszer járhatott ott.",
        help2: "Ha pedig egy kereszteződésben 3 út találkozik, ott legfeljebb csak egyszer járhatott.",
      },
    },
  },
  'ilygcrdmwy--hanyszor-leszurni-korzot': {
    answer: 19,
    content: {
      hu: {
        problemText: "<p>Legalább hányszor kell leszúrni a körzőt a képen látható alakzat megrajzolásához?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_H_B_5.png",
        help1: "A körzőt csak metszéspontba érdemes leszúrni.",
        help2: "Az összes metszéspontba le kell szúrni a körzőt.",
      },
    },
  },
  'riola2z91o--transz-oxisz-vasutvonalon': {
    answer: 15,
    content: {
      hu: {
        problemText: "<p>A Transz-Óxisz Vasútvonalon közlekedő szerelvényeknek a következő előírásokat kell teljesíteniük:<ul><li> Bármely két elsőosztályú ülőkocsi között kell legyen legalább két másodosztályú ülőkocsi.<li> Bármely két másodosztályú ülőkocsi között kell legyen legalább egy hálókocsi.<li> Bármely két hálókocsi között kell legyen legalább egy étkezőkocsi.<li> Legfeljebb három étkezőkocsi lehet egy szerelvényben.</ul> </p><p> Legfeljebb hány kocsiból állhat egy ilyen vasúti szerelvény, ha a mozdonyokat és a felsoroltaktól különböző típusú kocsikat nem számoljuk?</p>",
        help1: "Legfeljebb 4 hálókocsi lehet a vonatban.",
        help2: "Legfeljebb 5 másodosztályú kocsi lehet a vonatban.",
      },
    },
  },
  'vke5ndiv4w--kovetkezo-muveletsor-erteket': {
    answer: 192,
    content: {
      hu: {
        problemText: "<p>A következő műveletsor értékét szerettem volna számológéppel kiszámítani: </p><p><center>\\((11 + 2)\\cdot5 + 41-3\\cdot2 + 21\\cdot2\\),</center></p><p>de nem 142-t kaptam eredményül, mert a feladatban szereplő tizenegy számjegy valamelyike helyett véletlenül a nála eggyel nagyobbat ütöttem be a számológépebe. Mi a legnagyobb lehetséges eredmény, amit így megkaphattam?</p>",
        help1: "Érdemes a jó és az elütött eredmény különbségét néznetek!",
        help2: "Ha például rögtön az első jegyet ütnék el, 50-nel nagyobb számot kapnánk.",
      },
    },
  },
  'fgem2icy7h--asztalom-tetejere-allitom': {
    answer: 90,
    content: {
      hu: {
        problemText: "<p>Ha az asztalom tetejére állítom a macskámat, akkor a földön álló teknősöm fejéhez képest a macska feje 115 cm-rel van feljebb. Ha a teknőst állítom az asztal tetejére, és a macskát hagyom a földön, akkor 65 cm-rel van magasabban a teknős feje. Hány cm magas az asztalom?</p>",
        help1: "Rajzoljatok ábrát mindkét esethez!",
        help2: "Mi a helyzet például akkor, ha a teknős 10 cm magas?",
      },
    },
  },
  'ht0c5oja0c--negyzet-lathato-legnagyobb': {
    answer: 40,
    content: {
      hu: {
        problemText: "<p>Az ábrán három négyzet látható. A legnagyobb négyzet oldalainak harmadolópontjait összekötve kaptuk meg az eggyel kisebb négyzetet, végül ennek oldalfelezőpontjait összekötve kaptuk meg a legkisebb négyzetet.</p><p>Ha a legnagyobb négyzet oldala 12 cm hosszú, akkor hány cm<sup>2</sup> a legkisebb négyzet területe?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_H_B_9.png",
        help1: "A közepes méretű négyzet területe kétszerese a kicsiének.",
        help2: "Mekkora a nagy négyzetből levágott kis háromszögek területe?",
      },
    },
  },
  'lustyi55cq--metszespontja-hetszognek-kornek': {
    answer: 14,
    content: {
      hu: {
        problemText: "<p>Legfeljebb hány metszéspontja lehet egy hétszögnek és egy körnek?</p>",
        help1: "Legfeljebb hány metszéspontja lehet egy körnek és egy egyenesnek?",
        help2: "Legfeljebb hány metszéspontja lehet a körnek a hétszög egy oldalával?",
      },
    },
  },
  '7c7fy7uehw--lord-hesketh-gazdag': {
    answer: 2004,
    content: {
      hu: {
        problemText: "<p>Lord Hesketh egy gazdag, de bohókás autógyűjtő. Az első autóját még 1968. november 16-án vásárolta. Ezután mindig a következő szabály szerint bővítette gyűjteményét: amint a legutóbb vásárolt autója annyi éves lett, mint ahány autója éppen volt, másnap rögtön vett egy új példányt a gyűjteményébe.</p><p>Melyik évben vette meg az első Aston Martinját, ha a kedvenc Jaguarja 26 éves volt akkor?<br><i>Lord Hesketh csak vadonatúj autókat vásárol és az autói életkorát mindig a megvásárlásuktól számolja.</i></p>",
        help1: "Írjátok fel, hogy amikor a lord új autót vett, melyik kocsija hány éves volt!<br><i>Például a legelső autója éppen 1+2 = 3 éves volt akkor, amikor megvette a harmadikat, és 1+2+3 = 6 éves akkor, amikor a negyediket vette.</i>",
        help2: "Kedvenc Jaguárja az 5. autója volt.",
      },
    },
  },
  '7f2jrzsn6a--kivalasztani-szamok-kivalasztottak': {
    answer: 85,
    content: {
      hu: {
        problemText: "<p>Legfeljebb hányat lehet kiválasztani az \\(1, 2, \\ldots, 128\\) számok közül úgy, hogy ne legyen a kiválasztottak közt két olyan szám, amelyek közül az egyik kétszerese a másiknak?</p>",
        help1: "Legfeljebb hány számot lehet kiválasztani az 1, 2, 4, 8, 16, 32, 64 és a 128 közül?",
        help2: "Válasszátok ki a páratlan számokat! Továbbá a 4-gyel osztható, de 8-cal nem osztható számokat. Meg a 16-tal osztható, de 32-vel nem oszthatóakat. Végül a 64-et is.",
      },
    },
  },
  'xtjrxv7jv9--szabalyos-kilencszog-lathato': {
    answer: 30,
    content: {
      hu: {
        problemText: "<p>Az ábrán egy szabályos kilencszög látható a középpontjával.</p><p>Hány olyan háromszög van, amelynek a csúcsai a kilencszög csúcsai közül valók és a háromszög tartalmazza a kilencszög középpontját?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_H_B_13.png",
        help1: "Ha találtatok egy jó háromszöget, akkor azt elforgatva is jó háromszöget kaptok.",
        help2: "Nézzétek meg, hogy mi lehet, ha a háromszög legrövidebb oldala olyan hosszú, mint az <em>AB</em> oldal, és mi lehet, ha olyan hosszú, mint az <em>AC</em> oldal. Lehet-e olyan hosszú, mint <em>AD</em>?",
      },
    },
  },
  'ynj0btixb9--bolondos-baldvin-kiraly': {
    answer: 6,
    content: {
      hu: {
        problemText: "<p>Bolondos Baldvin király három új típusú pénzérmét vezetett be Bergengóciában: a 7 krajcárost, a 11 krajcárost és a 13 krajcárost. Hányféleképpen lehet pontosan 100 krajcárt kifizetni ezekkel az új érmékkel?</p>",
        help1: "Bontsátok esetekre a feladatot aszerint, hogy hány 13-as van. Vagyis, hogy hányféleképpen lehet csak 7-esekkel és 11-esekkel kifizetni 100, 87, 74, 61, 48, 35, 22, illetve 9 krajcárt.",
        help2: "Például 100-at ki lehet fizetni 8 darab 7-essel és 4 darab 11-essel, a 35-öt 5 darab 7-essel, de 48-at sehogy sem lehet kifizetni 7-esekkel és 11-esekkel.",
      },
    },
  },
  'fuhlf24723--lathato-tablazat-mezojebe': {
    answer: 42,
    content: {
      hu: {
        problemText: "<p>Az ábrán látható táblázat kilenc mezőjébe szeretnénk beírni az \\(1, 2, \\ldots, 9\\) számokat úgy, hogy minden sorban balról jobbra és minden oszlopban fentről lefelé növekvő sorrendben kövessék egymást a számok.</p><p>Hányféleképpen tehetjük ezt meg, ha minden számot pontosan egyszer használunk fel?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/12_H_B_15.png",
        help1: "A bal felső sarokba mindenképpen az 1 kerül, a jobb alsóba pedig a 9.",
        help2: "A kettes két helyre kerülhet. Kezdjétek el vizsgálni az eseteket! Hova kerülhet ezek után a 3-as, a 4-es és a többi szám?",
      },
    },
  },
};
