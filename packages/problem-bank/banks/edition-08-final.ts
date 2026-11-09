import type { CompetitionBank, ProblemBank } from '../src/sources';

// Edition 8's final, relay only, as the relay practice site serves it: one
// competition per category, and the problems their relays use, each written
// once. Released, so the practice site may import it.

export const competitions: CompetitionBank = {
  'eewtetfejl--08-final-a': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: '1t0dxrbnme--albrecht-szobas-kollegium', points: 3 },
        { problemId: 'dmzb5py6by--anna-eves-huga', points: 3 },
        { problemId: '1kv0zw8a91--tavasszal-ultettem-nehany', points: 3 },
        { problemId: 'adez0puufj--gondoltam-ketjegyu-szamot', points: 3 },
        { problemId: 'v0suwfxlft--teglalapot-hatarolnak-vonalai', points: 4 },
        { problemId: 'sc6v10qpct--szam-amelynek-felet', points: 4 },
        { problemId: 'wtupoqzfht--anna-bea-cili', points: 4 },
        { problemId: 'rd3alnpr7y--viragarusnal-tobbfele-osszeallitasban', points: 4 },
        { problemId: 'za0kvnxtnb--haromjegyu-szam-amiben', points: 5 },
        { problemId: '54lto3z4hj--negyzet-terulete-negyzetmeter', points: 5 },
        { problemId: 'sbboiqs5tx--legkisebb-szam-melyet', points: 5 },
        { problemId: 'aukljsgwwr--egymast-koveto-szam', points: 5 },
        { problemId: 'ypwppvcrxz--legnagyobb-negyjegyu-szam', points: 6 },
        { problemId: 'wzq38tydtg--nel-kisebb-szam', points: 6 },
        { problemId: '5lolkpefb8--elso-fold-mars', points: 6 },
        { problemId: 'fobwuhlb5k--otjegyu-szamot-csupa', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 8, round: 'final', category: 'A' },
  },
  'cpeit5hvuu--08-final-b': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'lql8670sge--albrecht-szobas-kollegium', points: 3 },
        { problemId: 'ka5l4zxbmj--kulonbozo-szamot-valasztunk', points: 3 },
        { problemId: 'xa000s6muq--kulonbozo-szinu-filctollam', points: 3 },
        { problemId: 'wtupoqzfht--anna-bea-cili', points: 3 },
        { problemId: 'hyt9tpx22u--negyzet-oldalai-egyseg', points: 4 },
        { problemId: 'hb171sbowo--legnagyobb-szam-eredmenyul', points: 4 },
        { problemId: 'i2o090cpqx--szuletesnapja-lucanak-leonak', points: 4 },
        { problemId: 'ypwppvcrxz--legnagyobb-negyjegyu-szam', points: 4 },
        { problemId: 'aga3u9xkmh--felirtam-egymast-koveto', points: 5 },
        { problemId: '1h1w9fz28r--moricka-nagymamaja-ketkaru', points: 5 },
        { problemId: '8ek3zs1a9p--rajzoltam-haromszoget-oldalegyenesuk', points: 5 },
        { problemId: '0ha2ik8e7w--abc-egyenlo-szaru', points: 5 },
        { problemId: 'ps32ose6yw--teglatest-alaku-szoba', points: 6 },
        { problemId: '2ghe509qxa--albertnek-feher-kiskockaja', points: 6 },
        { problemId: 'fobwuhlb5k--otjegyu-szamot-csupa', points: 6 },
        { problemId: 'xe04ttf0k2--kacskaringos-krikszkrakszok-magukat', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 8, round: 'final', category: 'B' },
  },
  'qslfctgd7d--08-final-c': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'mlgrqzra1k--albrecht-szobas-kollegium', points: 3 },
        { problemId: 'np3fgwnca0--tolmacs-mindenki-idegen', points: 3 },
        { problemId: 'af3pgwf3qu--kulonbozo-erteket-vehet', points: 3 },
        { problemId: '1zc5tfn7to--rajzoltam-haromszoget-oldalegyenesuk', points: 3 },
        { problemId: 'noiyv1g2d2--egyenlet-megoldasait-primek', points: 4 },
        { problemId: 'qovqbs1eo9--ajtosi-gyerekek-anna', points: 4 },
        { problemId: 'o47itv7wu0--szamokra-teljesul-min', points: 4 },
        { problemId: 'yuvyu9qozt--reszre-osztjak-sikot', points: 4 },
        { problemId: 'k4pq2jyotz--durernek-edenye-melyek', points: 5 },
        { problemId: '0h83oxhnbb--oldalhosszusagu-szabalyos-haromszoget', points: 5 },
        { problemId: '0vvyqri6kc--kbol-ekbol-allo', points: 5 },
        { problemId: '4ngxqn0eha--nemnegativ-valos-szamok', points: 5 },
        { problemId: 'n34pasdw42--kacskaringos-krikszkrakszok-magukat', points: 6 },
        { problemId: 'v2hdew6c1x--egysegnyi-sugaru-korok', points: 6 },
        { problemId: 'gvqpwjr0db--reszre-osztja-teret', points: 6 },
        { problemId: 'bprc8m5cqi--durer-hintojaba-befogva', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 8, round: 'final', category: 'C' },
  },
  'xk5almiba6--08-final-d': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'ur6qyro34s--kupacunk-bennuk-kavics', points: 3 },
        { problemId: 'idx9f3dhrf--faluban-ketfele-szamrendszert', points: 3 },
        { problemId: 'uoo5mdmicj--osszuk-osszes-haromjegyu', points: 3 },
        { problemId: 'vxqmvub18b--tol-kiszineztuk-szamokat', points: 3 },
        { problemId: 'p4pawexoyb--teglalap-atlojara-merolegeseket', points: 4 },
        { problemId: '04pazo8uta--sorozatra-fennall-tovabba', points: 4 },
        { problemId: 'wrtdsjo2wn--osszeszoroztunk-egymast-koveto', points: 4 },
        { problemId: 'r61wjn79ky--elemu-halmaznak-kivalasztjuk', points: 4 },
        { problemId: '6vw5miijar--egyenesek-metszespontja-hajlasszoguk', points: 5 },
        { problemId: 'v6wjkjlz2c--darab-esbol-allo', points: 5 },
        { problemId: 'orkc89yey1--lathato-kis-szakaszokat', points: 5 },
        { problemId: 'su2lbs0qx9--trapez-alapja-egyseg', points: 5 },
        { problemId: 'rgmiya7apd--tegyuk-valaki-tototippet', points: 6 },
        { problemId: 'qahmlyq9ab--egysegnegyzet-oldalat-feloszottuk', points: 6 },
        { problemId: 'dkry9455pb--osztalytars-bizonyitvanyosztas-megallapitotta', points: 6 },
        { problemId: 'ou0dud34e2--tetraeder-csucsat-tukrozve', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 8, round: 'final', category: 'D' },
  },
};

export const problems: ProblemBank = {
  '1t0dxrbnme--albrecht-szobas-kollegium': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>Albrecht egy 120 szobás kollégium legfelső emeletén lakik. Az épületben – az alagsort nem számítva – mindegyik szinten pontosan 20 szoba van. Hányadik emeleten lakik Albrecht?</p>",
        help1: "Hány szintes az épület?",
        help2: "A földszint nem emelet.",
      },
    },
  },
  'dmzb5py6by--anna-eves-huga': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>Anna 15 éves, húga Johanna pedig 7, így kettőjük életkorának összege épp 22. Hány év múlva lesz kettőjük életkorának összege éppen kétszer ennyi?</p>",
        help1: "Hány év múlva lesz az életkoruk összege 44?",
        help2: "Egy év alatt az életkoruk összege 2-vel nő.",
      },
    },
  },
  '1kv0zw8a91--tavasszal-ultettem-nehany': {
    answer: 21,
    content: {
      hu: {
        problemText: "<p>Tavasszal ültettem néhány virágot a kiskertembe. Géza szerint 3 nárciszt és 12 tulipánt, Béla szerint 9 nárciszt és 7 tulipánt, Anna szerint pedig 8 nárciszt és 12 tulipánt. Mindhárom gyerek pontosan az egyik számra emlékezett jól, tehát vagy a nárciszok vagy a tulipánok számára. Hány virágot ültettem összesen?</p>",
        help1: "Hány tulipánt ültettem?",
        help2: "Lehetséges, hogy nem 12 tulipánt ültettem?",
      },
    },
  },
  'adez0puufj--gondoltam-ketjegyu-szamot': {
    answer: 73,
    content: {
      hu: {
        problemText: "<p>Gondoltam egy kétjegyű számot. Felcseréltem a számjegyeit, majd a kapott számhoz hozzáadtam 15-öt. Az összegnek a felét vettem, végül a keletkezett szám jegyeit felcseréltem. Vajon melyik számra gondoltam, ha a végén 62-t kaptam?</p>",
        help1: "Gondolkozzatok visszafelé!",
        help2: "Amikor felezünk, 26-ot kell kapjunk.",
      },
    },
  },
  'v0suwfxlft--teglalapot-hatarolnak-vonalai': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>Hány téglalapot határolnak az alábbi ábra vonalai?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/8_D_A_5.png",
        help1: "Hány \"nagy\" téglalap van?",
        help2: "Van az ábrán téglalap a \"nagyok\" és a \"kicsiken\" kívül?",
      },
    },
  },
  'sc6v10qpct--szam-amelynek-felet': {
    answer: 32,
    content: {
      hu: {
        problemText: "<p>Melyik az a pozitív szám, amelynek a felét és a negyedét összeszorozva a szám négyszeresét kapjuk?</p>",
        help1: "Jelöljétek a számot <em>a</em>-val, és írjátok fel az egyenletet ami a feladat feltételét jelenti!",
        help2: "Az egyenlet <em>a/2 &sdot; a/4=4&sdot;a</em>.",
      },
    },
  },
  'wtupoqzfht--anna-bea-cili': {
    answer: 4,
    content: {
      hu: {
        problemText: "<p>Anna, Bea, Cili és Dóra moziba mennek. A jegyeik négy egymás melletti helyre szólnak. Anna és Bea mindenképpen egymás mellett akarnak ülni, Cili és Dóra pedig semmiképpen sem, mert átmenetileg összezördültek. Hányféleképpen ülhettek le a lányok a négy egymás melletti helyre ilyen feltételekkel?</p>",
        help1: "Ülhet Anna a szélső helyek egyikére?",
        help2: "És Bea?",
      },
    },
  },
  'rd3alnpr7y--viragarusnal-tobbfele-osszeallitasban': {
    answer: 280,
    content: {
      hu: {
        problemText: "<p>Egy virágárusnál többféle összeállításban kaphatók a csokrok. Egy-egy csokor ára úgy adódik, hogy a benne lévő virágok árát összeadják. (Az egyforma virágokért azonos összeget kell fizetni.) Az egy nárciszból, két rózsából és egy tulipánból álló csomagért 210 Ft-ot, az egy tulipánból, egy rózsából és két nárciszból állóért 190 Ft-ot kell fizetni, a két rózsából és két tulipánból álló csokor 240 Ft-ba kerül. Mennyit kell fizetnünk, ha mi egy olyan csokrot szeretnénk vásárolni, amelyben két rózsa, három nárcisz és egy tulipán van?</p>",
        help1: "A harmadik csokor ára miatt egy rózsa és egy tulipán árát összeadva 120 Ft-ot kapunk.",
        help2: "Az első segítség és a második csokor miatt két szál nárcisz 70 Ft-ba kerül.",
      },
    },
  },
  'za0kvnxtnb--haromjegyu-szam-amiben': {
    answer: 450,
    content: {
      hu: {
        problemText: "<p>Hány olyan háromjegyű szám van, amiben a páros számjegyek száma páratlan?</p>",
        help1: "Ha az első két jegyét meghatározzuk egy háromjegyű számnak, akkor hányféle lehet a harmadik jegye, ha tudjuk, hogy páros sok páros számjegye van?",
        help2: "Állítsátok párba a háromjegyű számokat úgy, hogy az egyes párokban különböző a paritása a páros számjegyeknek!",
      },
    },
  },
  '54lto3z4hj--negyzet-terulete-negyzetmeter': {
    answer: 8,
    content: {
      hu: {
        problemText: "<p>Az \\(ABCD\\) négyzet területe 16 négyzetméter. \\(F\\), \\(G\\) és \\(H\\) a négyzet oldalainak felezőpontjai. Hány négyzetméter a szürkére festett \\(AFGH\\) négyszög területe?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/8_D_A_10.png",
        help1: "Számoljátok ki, hogy a fehér háromszögek területe hanyadrészét alkotják a négyzetnek!",
        help2: "A két kisebb háromszög területe a négyzet területének nyolcada.",
      },
    },
  },
  'sbboiqs5tx--legkisebb-szam-melyet': {
    answer: 99,
    content: {
      hu: {
        problemText: "<p>Mi a legkisebb pozitív egész szám, melyet a 40305 számhoz adva palindrom számot kapunk?<br><i>Palindromnak nevezzük azokat a számokat, melyek számjegyeit fordított sorrendben olvasva az eredeti számot kapjuk vissza.</i></p>",
        help1: "Milyen számjegyre kell végződjön a hozzáadandó szám, hogy az összeg 4-re végződjön?",
        help2: "Lehet-e 90-nél kisebb a hozzáadandó?",
      },
    },
  },
  'aukljsgwwr--egymast-koveto-szam': {
    answer: 63,
    content: {
      hu: {
        problemText: "<p>Három egymást követő pozitív egész szám szorzata 9240. Mennyi az összegük?</p>",
        help1: "Lehet-e a középső szám legfeljebb 10?",
        help2: "Lehet-e a középső szám legfeljebb 20?",
      },
    },
  },
  'ypwppvcrxz--legnagyobb-negyjegyu-szam': {
    answer: 9864,
    content: {
      hu: {
        problemText: "<p>Melyik az a legnagyobb négyjegyű szám, amelynek minden számjegye különböző és a számjegyeinek mindegyike osztja a négyjegyű számot?</p>",
        help1: "Kezdődhet a szám 9-es számjeggyel?",
        help2: "Folytatódhat a szám 8-assal a százas helyiértéken?",
      },
    },
  },
  'wzq38tydtg--nel-kisebb-szam': {
    answer: 667,
    content: {
      hu: {
        problemText: "<p>Hány olyan 1000-nél kisebb pozitív egész szám van, amely nem osztható sem 5-tel, sem 6-tal?</p>",
        help1: "Hány olyan 1000-nél kisebb szám van, amelyik osztható 5-tel? És amelyik 6-tal?",
        help2: "És olyan, ami 5-tel és 6-tal is osztható?",
      },
    },
  },
  '5lolkpefb8--elso-fold-mars': {
    answer: 236,
    content: {
      hu: {
        problemText: "<p>Az első Föld-Mars találkozón kiderült, hogy a marslakók lába épp olyan, mint az embereké, de a kezek és rajtuk az ujjak száma már más. Noha a marslakók hattal többen voltak, mint a földiek, ujjaikból (a kezeket és a lábakat is figyelembe véve) összesen 1-gyel kevesebb volt. Hány résztvevője volt az első találkozónak?</p>",
        help1: "Írjatok fel egy két változós egyenletet, ahol a két változó <em>f</em>, a földiek száma a találkozón, és <em>k</em>, a marsiak kezein található ujjak száma!",
        help2: "Próbáljátok az egyenletet úgy alakítani, hogy kialakuljon egy <em>(10-k)(f+6)</em> szorzat!",
      },
    },
  },
  'fobwuhlb5k--otjegyu-szamot-csupa': {
    answer: 27,
    content: {
      hu: {
        problemText: "<p>Egy ötjegyű számot, amely csupa különböző számjegyből áll, megszoroztunk néggyel. Így egy olyan ötjegyű számot kaptunk, amelyet ugyanazok a számjegyek alkotnak, de most épp fordított sorrendben. Mennyi ennek a számnak a jegyeinek az összege? </p>",
        help1: "Mivel a számunkat 4-gyel megszorozva ötjegyű számot kapunk, az első jegy 1-es vagy kettes. Megfordítva párosnak kell legyen, így kettessel kezdődik.",
        help2: "Mivel az utolsó jegy 8-as, a második jegy legfeljebb 2 lehet, tehát 0 vagy 1.",
      },
    },
  },
  'lql8670sge--albrecht-szobas-kollegium': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>Albrecht egy 160 szobás kollégium legfelső emeletén lakik.  Az épületben – az alagsort nem számítva – mindegyik szinten pontosan 20 szoba van. Hányadik emeleten lakik Albrecht?</p>",
        help1: "Hány szintes az épület?",
        help2: "A földszint nem emelet.",
      },
    },
  },
  'ka5l4zxbmj--kulonbozo-szamot-valasztunk': {
    answer: 90,
    content: {
      hu: {
        problemText: "<p>Három különböző számot választunk a következő halmazból: {-5, -3, -1, 0, 2, 4, 6}. Mi a szorzatuk lehetséges legnagyobb értéke?</p>",
        help1: "Hány negatív számot választhatunk, ha pozitív szorzatot szeretnénk?",
        help2: "Válasszunk ki két negatív számot és egy pozitívat!",
      },
    },
  },
  'xa000s6muq--kulonbozo-szinu-filctollam': {
    answer: 2,
    content: {
      hu: {
        problemText: "<p>Három különböző színű filctollam van. Hányféleképp tehetem rájuk a kupakjaikat, ha egyikre sem a színének megfelelő kupakot rakom?</p>",
        help1: "Legyenek a tollak színei A, B és C. Milyen színű kupakok kerülhetnek az A színű tollra?",
        help2: "Hányféleképpen kerülhet a másik két kupak a két másik tollra?",
      },
    },
  },
  'hyt9tpx22u--negyzet-oldalai-egyseg': {
    answer: 22,
    content: {
      hu: {
        problemText: "<p>Az \\(ABCD\\) négyzet oldalai 6 egység hosszúak. \\(E\\), \\(F\\) és \\(G\\) a négyzet oldalainak harmadolópontjai. Hány négyzetegység a szürkére festett \\(AEFG\\) négyszög területe?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/8_D_B_5.png",
        help1: "Számoljátok ki a fehér háromszögek területeit!",
        help2: "A két kisebb háromszög területe négy egység.",
      },
    },
  },
  'hb171sbowo--legnagyobb-szam-eredmenyul': {
    answer: 100,
    content: {
      hu: {
        problemText: "<p>Mi a legnagyobb szám, amit eredményül kaphatunk, ha egy háromjegyű számot elosztunk a jegyeinek összegével?</p>",
        help1: "Keressetek minél nagyobb eredményt adó számot!",
        help2: "Kaphatunk háromjegyű eredményt?",
      },
    },
  },
  'i2o090cpqx--szuletesnapja-lucanak-leonak': {
    answer: 32,
    content: {
      hu: {
        problemText: "<p>Ma van a születésnapja Lucának, Leónak és Albertnek is: Leó és Luca éveinek száma összeadva megegyezik Albert életkorának másfélszeresével. Húsz éve ez még fordítva volt, akkor Albert egyedül éppen másfélszer annyi gyertyát kapott a tortájára, mint Leó és Luca együtt.<br>Hányadik születésnapját ünnepli ma Albert?</p>",
        help1: "Vezessetek be jelölést Leó, Luca és Albert jelenlegi életkoraira!",
        help2: "Húsz év alatt Leó és Luca összéletkora 40 évvel változik.",
      },
    },
  },
  'aga3u9xkmh--felirtam-egymast-koveto': {
    answer: 285,
    content: {
      hu: {
        problemText: "<p>Felírtam nyolc egymást követő pozitív egész számot egy lapra, majd az egyiket letöröltem. A megmaradó számok összege éppen 2015. Melyik számot töröltem le?</p>",
        help1: "Vezessetek be jelölést arra, hogy melyik a legkisebb szám amit felírtunk, majd írjátok fel az egyenletet, amely leírja hogy a nyolc szám összege mínusz az egyik 2015!",
        help2: "A hetes maradék meghatározza, hogy hanyadik számot töröltük le, így meghatározza a kezdő számunkat is.",
      },
    },
  },
  '1h1w9fz28r--moricka-nagymamaja-ketkaru': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>Móricka a nagymamája kétkarú konyhai mérlegével játszik. Észreveszi, hogy egy villa és egy kanál éppen egyensúlyban van két késsel. Két kanál pedig egyensúlyban van két villával és egy késsel. Hány kést kell feltennie, hogy egyensúlyban legyen négy kanállal?<br><i>Az étkészletben az azonos típusú evőeszközök azonos súlyúak.</i></p>",
        help1: "Írjátok fel egyenletként a két megadott egyensúlyi helyzetet, ahol a kanalak, kések és villák súlyát betűkkel jelölitek!",
        help2: "Adjátok hozzá az első egyenlet kétszeresét a második egyenlethez!",
      },
    },
  },
  '8ek3zs1a9p--rajzoltam-haromszoget-oldalegyenesuk': {
    answer: 4,
    content: {
      hu: {
        problemText: "<p>Rajzoltam három háromszöget úgy, hogy 9 oldalegyenesük közül semely kettő nem esett egybe. A sík azon pontjait, melyeken mindegyik háromszögvonal átment, pirossal megjelöltem.<br>Legfeljebb hány pontot jelölhettem meg pirossal?</p>",
        help1: "Hány pontban metszheti egymást legfeljebb az első két háromszögvonal?",
        help2: "Próbáljatok minél többet az eddigi metszéspontokból a harmadik háromszögvonallal elmetszeni!",
      },
    },
  },
  '0ha2ik8e7w--abc-egyenlo-szaru': {
    answer: 45,
    content: {
      hu: {
        problemText: "<p>Az ABC egyenlő szárú háromszög AB alapját a B csúcson túl meghosszabbítottuk a szár hosszával.  Az így kapott pont lett a C<sub>1</sup>. Az AB alapra az A csúcsban merőlegest állítottunk, majd a C-t tartalmazó félsík irányába a merőleges egyenesre felmértük a szár hosszát. Az így kapott pont lett a C<sub>2</sub>. Azt tapasztaltuk, hogy a C<sub>1</sub>, C és C<sub>2</sub> pontok egy egyenesre illeszkednek. Hány fokos az ABC háromszög legkisebb szöge?</p>",
        help1: "Rajzoljatok ábrát, és keressetek rajta egyenlőszárú háromszögeket!",
        help2: "Használjátok fel, hogy <em>C<sub>1</sub>CC<sub>2</sub></em> szög 180&deg!",
      },
    },
  },
  'ps32ose6yw--teglatest-alaku-szoba': {
    answer: 17,
    content: {
      hu: {
        problemText: "<p>Egy téglatest alakú szoba éleinek hossza 3, 5 és 15 méter. A szoba egyik sarkában ül egy pók. Minimális távolságot megtéve átmászik az átellenes sarokba. Hány méter hosszú utat tett meg?<br><i>A pók repülni nem tud, de bármelyik falon, a padlón vagy akár a plafonon is mászhat.</i></p>",
        help1: "Érdemes a póknak az egyik élt átmetszeni az útjával.",
        help2: "Három eset van, melyik él lehet az első segítségben említett. Mindhárom esetben \"egyenesítsétek ki\" a két oldalt, amelyen a pók haladna, és határozzátok meg a legrövidebb utat!",
      },
    },
  },
  '2ghe509qxa--albertnek-feher-kiskockaja': {
    answer: 12,
    content: {
      hu: {
        problemText: "<p>Albertnek van 27 fehér kiskockája. Gábor szeretne minél kevesebb kiskocka-oldalt befesteni feketére úgy, hogy Albert ne tudjon a kiskockákból olyan \\(3\\times3\\times3\\)-as nagyobb kockát építeni, amelynek minden lapja teljesen fehér. Legalább hány kiskockalapot kell Gábornak feketére festenie a cél eléréséhez?</p>",
        help1: "Érdemes-e Gábornak egy kis kockán legfeljebb 3 lapot kifestenie?",
        help2: "Hány teljesen fekete kockát tartalmazhat egy kívülről teljesen fehér kocka?",
      },
    },
  },
  'xe04ttf0k2--kacskaringos-krikszkrakszok-magukat': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>A <i>kacskaringós krikszkrakszok</i> olyan magukat nem metsző töröttvonalak, amelyek 21 egyenes részszakaszból állnak, és két végpontjuk különbözik. Legkevesebb hány egyenessel lehet lefedni egy kacskaringós krikszkrakszot? (Azaz mi a legkisebb \\(k\\) pozitív egész szám, amelyre teljesül a következő állítás: van olyan kacskaringós krikszkraksz, amelyhez kijelölhető \\(k\\) egyenes úgy, hogy az összes részszakasz valamelyik kijelölt egyenesre essék?)<br><i>Az ábra egy kacskaringós krikszkrakszot ábrázol. Szaggatottal egy három részszakaszt lefedő egyenest is jelöltünk.</i></p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/8_D_B_16.png",
        help1: "Hány pontban metszi egymást <em>n</em> általános helyzetű egyenes a síkban?",
        help2: "Konstrukció keresésénél próbáljátok meg előbb lerajzolni az egyeneseket, és utána azokon keresni a kacskaringós krikszkrakszot!",
      },
    },
  },
  'mlgrqzra1k--albrecht-szobas-kollegium': {
    answer: 9,
    content: {
      hu: {
        problemText: "<p>Albrecht egy 200 szobás kollégium legfelső emeletén lakik. Az épületben – az alagsort nem számítva – mindegyik szinten pontosan 20 szoba van. Hányadik emeleten lakik Albrecht?</p>",
        help1: "Hány szintes az épület?",
        help2: "A földszint nem emelet.",
      },
    },
  },
  'np3fgwnca0--tolmacs-mindenki-idegen': {
    answer: 14,
    content: {
      hu: {
        problemText: "<p>20 tolmács közül mindenki pontosan 3 idegen nyelvet beszél. 16-an tudnak franciául, 12-en angolul, 10-en csehül, 7-en japánul, 1 valaki törökül. Hányan beszélnek olaszul, ha ezen a hat nyelven kívül senki nem ismer mást?</p>",
        help1: "Számoljátok meg a (tolmács,nyelv) párokat!",
        help2: "A nem (tolmács,olasz) párok száma 16+12+10+7+1.",
      },
    },
  },
  'af3pgwf3qu--kulonbozo-erteket-vehet': {
    answer: 3,
    content: {
      hu: {
        problemText: "<p>Hány különböző értéket vehet fel az \\(\\frac{a}{|a|}+\\frac{b}{|b|}+\\frac{c}{|c|}+\\frac{abc}{|abc|}\\) kifejezés, ha \\(a\\), \\(b\\) és \\(c\\) nullától különböző valós számok?</p>",
        help1: "Helyettesítsetek be különböző előjelű számhármasokat!",
        help2: "Ha nem azonos mindhárom változó előjele, akkor hány lehetőség van?",
      },
    },
  },
  '1zc5tfn7to--rajzoltam-haromszoget-oldalegyenesuk': {
    answer: 4,
    content: {
      hu: {
        problemText: "<p>Rajzoltam három háromszöget úgy, hogy 9 oldalegyenesük közül semelyik kettő nem esett egybe. A sík azon pontjait, amelyeken mindegyik háromszögvonal átment, pirossal megjelöltem. Legfeljebb hány pontot jelölhettem meg pirossal?</p>",
        help1: "Hány pontban metszheti egymást legfeljebb az első két háromszögvonal?",
        help2: "Próbáljatok minél többet az eddigi metszéspontokból a harmadik háromszögvonallal elmetszeni!",
      },
    },
  },
  'noiyv1g2d2--egyenlet-megoldasait-primek': {
    answer: 494,
    content: {
      hu: {
        problemText: "<p>A \\(p^2-(q+r)^2=136\\) egyenlet olyan megoldásait keressük, ahol \\(p>q>r>0\\) prímek. Legfeljebb mennyi lehet \\(p\\cdot q\\cdot r\\)?</p>",
        help1: "Vizsgáljátok meg a paritást!",
        help2: "Használjátok az ismert <em>a<sup>2</sup>-b<sup>2</sup>=(a-b)(a+b)</em> azonosságot!",
      },
    },
  },
  'qovqbs1eo9--ajtosi-gyerekek-anna': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>Az Ajtósi gyerekek: Anna, Luca és Károly karatéznak. Az edzésre összesen 10 gyerek jár, rajtuk kívül mindenki egyke. Az egyik gyakorlathoz párokba kell állniuk. Jelölje \\(p\\) annak a valószínűségét, hogy egyik Ajtósi gyerek sem valamelyik testvére párja, ha minden párbaállítás egyenlő valószínűséggel fordul elő. Mekkora \\(p\\) egyszerűsített alakjában a számláló és nevező összege?</p>",
        help1: "Hányféle párbaállítás létezik?",
        help2: "A helyes párbaállítások megszámolhatóak úgy, hogy meghatározzuk az Ajtósi gyerekek párjait, majd a maradék négy ember párosításainak számával megszorozzuk.",
      },
    },
  },
  'o47itv7wu0--szamokra-teljesul-min': {
    answer: 975,
    content: {
      hu: {
        problemText: "<p>Az \\(a_1\\), \\(a_2\\), \\(\\dots\\) , \\(a_{10}\\) számokra teljesül, hogy \\(a_0=a_{10}=1000\\), és \\(a_n=frac{a_{n-1}+a_{n+1}}{2}-1\\) (\\(n=1\\), 2, 3, \\(\\ldots\\), 9). Mennyi min{\\(a_1\\), \\(a_2\\), \\(\\dots\\), \\(a_{10}\\)}?</p>",
        help1: "A sorozat szimmetrikus kell hogy legyen <sub>a_5</sub> körül, így <sub>a_1</sub>=<sub>a_9</sub>, <sub>a_2</sub>=<sub>a_8</sub>, <sub>a_3</sub>=<sub>a_7</sub> és <sub>a_4</sub>=<sub>a_6</sub>.",
        help2: "A fentebbiek miatt <em>a<sub>5</sub>=a<sub>4</sub>-1=a<sub>6</sub>-1</em>.",
      },
    },
  },
  'yuvyu9qozt--reszre-osztjak-sikot': {
    answer: 393,
    content: {
      hu: {
        problemText: "<p>Hány részre osztják a síkot egy szabályos 28-szög oldalegyenesei?</p>",
        help1: "Hány részre osztja a síkot 28 darab általános helyzetű egyenes?",
        help2: "Vannak párhuzamosak a szabályos 28-szög oldalegyenesei között? És egy ponton áthaladó egyeneshármasok?",
      },
    },
  },
  'k4pq2jyotz--durernek-edenye-melyek': {
    answer: 16,
    content: {
      hu: {
        problemText: "<p>Dürernek 25 edénye van, melyek rendre 1, 2, \\(\\ldots\\), 25 literesek. Hányféleképpen választható ki közülük 10 úgy, hogy a kiválasztottak közül bármely kettővel kimérhető legyen 1 liter?</p>",
        help1: "Hány darab prím van, amely kisebb, mint 25?",
        help2: "Lehetséges, hogy a 10 kiválasztott edény között szerepeljen olyan, amely nem prímhatvány?",
      },
    },
  },
  '0h83oxhnbb--oldalhosszusagu-szabalyos-haromszoget': {
    answer: 52,
    content: {
      hu: {
        problemText: "<p>Egy 13 oldalhosszúságú szabályos háromszöget az ábrához hasonló módon egységnyi oldalú kis háromszögekre bontottunk. Legfeljebb hány kisháromszög-oldal választható ki úgy, hogy a kiválasztottak közül semely kettőnek ne legyen azonos végpontja?<br><i>Az ábra a 8 oldalhosszúságú esetet mutatja.</i></p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/8_D_C_10.png",
        help1: "Hány kis háromszögcsúcs van a 13 oldalhosszúságú esetben?",
        help2: "Fel tudunk használni minden csúcsot?",
      },
    },
  },
  '0vvyqri6kc--kbol-ekbol-allo': {
    answer: 682,
    content: {
      hu: {
        problemText: "<p>Egy 0-kból és 1-ekből álló sorozatokat vizsgálunk. Ezeken megengedett átalakításnak nevezzük a következőket:</p><p><ol><li>Három szomszédos 0 törlése <i>Például:</i> 101<b>000</b>101 → 101101<li>Három szomszédos 1 törlése <i>Például:</i> 1<b>111</b>01001 → 101001<li>01 kicserélése 10-ra <i>Például:</i> 10<b>01</b>101 → 1010101)</ul></p><p>Az összes 10 hosszúságú 0/1 sorozat közül hányból érhető el megengedett lépések egymásutánjával egy 0 vagy egy 1 hosszúságú sorozat?</p>",
        help1: "Milyen esetben nem tudunk semmilyen megengedett átalakítást végrehajtani a sorozatunkon?",
        help2: "Válasszátok esetekre a feladatot aszerint, hogy hány darab 1-es van a sorozatban!",
      },
    },
  },
  '4ngxqn0eha--nemnegativ-valos-szamok': {
    answer: 365,
    content: {
      hu: {
        problemText: "<p>Az \\(a\\) és \\(b\\) nemnegatív valós számok teljesítik a következő egyenleteket:</p><p><center>\\(a\\sqrt{a}+b\\sqrt{b}=183\\)<br>\\(b\\sqrt{a}+a\\sqrt{b}=182\\)</center></p><p>Mennyi \\(9(a+b)\\)?</p>",
        help1: "Vezessetek be új jelölésként <em>x</em>-et és <em>y</em>-t <em>a</em> és <em>b</em> gyökére!",
        help2: "Az egyenlőségekből számoljátok ki <em>(x+y)<sup>3</sup></em>-t és <em>xy</em>-t!",
      },
    },
  },
  'n34pasdw42--kacskaringos-krikszkrakszok-magukat': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>A <i>kacskaringós krikszkrakszok</i> olyan magukat nem metsző töröttvonalak, amelyek 21 egyenes részszakaszból állnak, és két végpontjuk különbözik. Legkevesebb hány egyenessel lehet lefedni egy kacskaringós krikszkrakszot? (Azaz mi a legkisebb \\(k\\) pozitív egész szám, amelyre teljesül a következő állítás: van olyan kacskaringós krikszkraksz, amelyhez kijelölhető \\(k\\) egyenes úgy, hogy az összes részszakasz valamelyik kijelölt egyenesre essék?)<br><i>Az ábra egy kacskaringós krikszkrakszot ábrázol. Szaggatottal egy három részszakaszt lefedő egyenest is jelöltünk.</i></p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/8_D_C_13.png",
        help1: "Hány pontban metszi egymást <em>n</em> általános helyzetű egyenes a síkban?",
        help2: "Konstrukció keresésénél próbáljátok meg előbb lerajzolni az egyeneseket, és utána azokon keresni a kacskaringós krikszkrakszot!",
      },
    },
  },
  'v2hdew6c1x--egysegnyi-sugaru-korok': {
    answer: 9801,
    content: {
      hu: {
        problemText: "<p>Az egységnyi sugarú \\(k_{1}\\) és \\(k_{2}\\) körök a \\(P\\) pontban érintik egymást. A két kör egyik \\(P\\)-n át nem menő közös érintője az \\(e\\) egyenes. Legyen minden \\(i>2\\) esetén \\(k_{i}\\) az a \\(k_{i-2}\\)-től különböző kör, amely érinti \\(k_{1}\\)-et, \\(k_{i-1}\\)-et és \\(e\\)-t. Határozzuk meg \\(k_{100}\\) sugarának reciprokát.</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/8_D_C_14.png",
        help1: "Használjátok a Pitagorasz-tételt!",
        help2: "A rekurziós képlet, amit kapunk: <em>a<sub>i+1</sub>=a<sub>i</sub> / (1+a<sub>i</sub>)</em>, ahol <em>a<sub>i</sub></em> a <em>k<sub>i</sub></em> gyöke.",
      },
    },
  },
  'gvqpwjr0db--reszre-osztja-teret': {
    answer: 92,
    content: {
      hu: {
        problemText: "<p>Legfeljebb hány részre osztja a teret 10, egy ponton átmenő sík?</p>",
        help1: "Hány új térrészt kapunk, ha már néhány síkkal felosztottuk a teret pár részre, majd elhelyezünk még egyet?",
        help2: "Annyi új térrész alakul ki, ahány részre osztja a többi sík az újonnan behúzott síkot.",
      },
    },
  },
  'bprc8m5cqi--durer-hintojaba-befogva': {
    answer: 12,
    content: {
      hu: {
        problemText: "<p>Dürer hintójába 8 ló van befogva egymás mögé egy oszlopban. Minden ló csak a közvetlenül előtte futó ló farát látja. Hogy egyenletesebben fáradjanak, Dürer a hosszú utazás során néhányszor kicserél két közvetlenül egymás után futó lovat. Nincs két olyan ló, akiket kétszer is felcserélne egymással. Ha egy ló látja egy másiknak a farát, akkor barátság szövődik köztük, ami azonban örökre és megváltoztathatatlanul elromlik, ha a másik is meglátta az övét. Legfeljebb hány barátság élhet a lovak között az utazás végén?</p>",
        help1: "Keressetek minél nagyobb konstrukciót! Érdemes az első, vagy az utolsó lovat akármikor is megcserélni a szomszédjával?",
        help2: "Alakulhat ki barátság-háromszög a lovak között?<br><i>Pontos felső korlátra nem érdemes bizonyítást keresnetek.</i>",
      },
    },
  },
  'ur6qyro34s--kupacunk-bennuk-kavics': {
    answer: 0,
    content: {
      hu: {
        problemText: "<p>Van két kupacunk, bennük 6 illetve 8 kavics. Egy lépésben valamelyik kupacba beletehetünk néhány kavicsot, a másikba pedig háromszor annyit. Hogy pontosan mennyit, illetve hogy melyikbe tesszük a többet, azt mi választhatjuk ki. Hányféle lépéssorozattal lehet elérni, hogy mindkét kupacban 50–50 kavics legyen?</p>",
        help1: "Gondoljátok meg, hogy változik-e valamilyen, a két kupacra jellemző mennyiség a lépések során!",
        help2: "Összesen hány kavicsot kell beletenni a kupacokba?",
      },
    },
  },
  'idx9f3dhrf--faluban-ketfele-szamrendszert': {
    answer: 165,
    content: {
      hu: {
        problemText: "<p>Egy faluban kétféle számrendszert használnak. Megkérdeztünk két helyi lakost.</p><p>Az egyik ezt mondta: <i>„25 lakosa van a falunak, 13-an mindkét rendszert ismerik, 1 pedig egyet se.”</i><br>A másik így szólt: <i>„Az 10 alapú számrendszert 26-an ismerik, az 14-est ismerők 22-en vannak.”</i> </p><p>A lakosok egy mondaton belül végig ugyanazt a számrendszert használják, akkor is ha egyébként többféle számrendszert is ismernek. Mi a két számrendszer alapszámának a szorzata?</p>",
        help1: "Vezessetek be változókat. Az első lakos használhatott-e nagyobb alapú számrendszert?",
        help2: "Készítsetek halmazábrát, és írjatok fel egy egyenletet belőle.",
      },
    },
  },
  'uoo5mdmicj--osszuk-osszes-haromjegyu': {
    answer: 100,
    content: {
      hu: {
        problemText: "<p>Osszuk el az összes háromjegyű számot a számjegyeinek összegével. Mekkora a legnagyobb érték, amit így kaptunk?</p>",
        help1: "Keressetek minél nagyobb számot minél kisebb számjegyösszeggel!",
        help2: "Ha a százasok adottak, akkor a kisebb helyiértékeken milyen számjegyek legyenek?",
      },
    },
  },
  'vxqmvub18b--tol-kiszineztuk-szamokat': {
    answer: 8,
    content: {
      hu: {
        problemText: "<p>1-től \\(n\\)-ig kiszíneztük az egész számokat pirossal és kékkel úgy, hogy ne keletkezzen egyszínű, háromtagú számtani sorozat. Mi a legnagyobb \\(n\\), amire ezt még megtehetjük?</p>",
        help1: "Ahhoz, hogy <em>n</em> minél nagyobb legyen, szükség lesz két szomszédos egyszínű számra.",
        help2: "Keressetek konstrukciót két szomszédos egyszínűből indulva! Elérhető-e 9 darab?",
      },
    },
  },
  'p4pawexoyb--teglalap-atlojara-merolegeseket': {
    answer: 72,
    content: {
      hu: {
        problemText: "<p>Az \\(ABCD\\) téglalap \\(AC\\) átlójára merőlegeseket állítottunk a \\(B\\) és \\(D\\) csúcsokból. A talppontok az \\(AC\\) átlót három darab \\(\\sqrt2\\) hosszú szakaszra osztják fel. Mennyi a téglalap területének a négyzete?</p>",
        help1: "Sok derékszögű háromszög keletkezik, teremtsetek kapcsolatot az oldalaik között!",
        help2: "Használható a magasság-tétel!",
      },
    },
  },
  '04pazo8uta--sorozatra-fennall-tovabba': {
    answer: 3854,
    content: {
      hu: {
        problemText: "<p>Az \\(a_1\\), \\(a_2\\), \\(\\ldots\\) sorozatra \\(n\\geq3\\) esetén fennáll, hogy \\(a_n=a_{n-1}-a_{n-2}\\). Tudjuk továbbá, hogy \\(a_1+a_2+\\dots+a_{2015}=88\\) és \\(a_1+a_2+\\dots+a_{88}=2015\\). Mennyi \\(a_1+a_2+\\dots+a_{2013}\\)?</p>",
        help1: "Írjátok fel a sorozat első néhány elemét!",
        help2: "A sorozat periodikus.",
      },
    },
  },
  'wrtdsjo2wn--osszeszoroztunk-egymast-koveto': {
    answer: 37,
    content: {
      hu: {
        problemText: "<p>Összeszoroztunk 5 egymást követő egész számot, és így az \\(\\overline{ABABAB}\\) szám 120-szorosát kaptuk. Mi volt a középső szám?</p>",
        help1: "Bontsátok prímtényezőire a szorzatot!",
        help2: "Az öt szomszédos szám közül nagyobb prímek csak egyet-egyet oszthatnak.",
      },
    },
  },
  'r61wjn79ky--elemu-halmaznak-kivalasztjuk': {
    answer: 8,
    content: {
      hu: {
        problemText: "<p>Egy 8 elemű halmaznak kiválasztjuk \\(A_1\\), \\(A_2\\), \\(\\ldots\\), \\(A_k\\) 3-elemű részhalmazait úgy, hogy \\(\\left|A_i\\cap A_j\\right|\\) = 2 semelyik két halmazra nem teljesül. Mi a legnagyobb \\(k\\) amire ezt még megtehetjük?</p>",
        help1: "Keressetek konstrukciót szisztematikusan, mindig kihagyva a már felhasznált számpárokat!",
        help2: "Vizsgáljátok a megoldás gráfját!",
      },
    },
  },
  '6vw5miijar--egyenesek-metszespontja-hajlasszoguk': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>Az \\(e\\) és \\(f\\) egyenesek metszéspontja \\(O\\), hajlásszögük 18&deg, az \\(e\\) egyenes egy \\(O\\)-tól különböző pontja legyen \\(E_1\\). Ezután az \\(F_2\\), \\(E_3\\), \\(F_4\\), \\(E_5\\), \\(\\ldots\\) pontokat úgy jelöljük ki felváltva az \\(f\\) illetve \\(e\\) egyeneseken, hogy azok minden korábbi ponttól különbözzenek, továbbá \\(OE_1=E_1F_2=F_2E_3=E_3F_4=\\ldots\\) . Mennyi az indexe az utolsó pontnak, amit így fel tudunk venni?</p>",
        help1: "Számoljátok ki a keletkező szögeket!",
        help2: "Milyen szög esetén akadunk el?",
      },
    },
  },
  'v6wjkjlz2c--darab-esbol-allo': {
    answer: 6045,
    content: {
      hu: {
        problemText: "<p>A 4030 darab 1-esből álló számból kivontuk a 2015 darab 2-esből álló számot, majd a különbségből gyököt vontunk. Mennyi az így kapott szám számjegyeinek összege?</p>",
        help1: "A csupa 9-esekből álló szám 1-gyel kevesebb egy 10-hatványnál.",
        help2: "Nézzétek meg kis esetekre!",
      },
    },
  },
  'orkc89yey1--lathato-kis-szakaszokat': {
    answer: 243,
    content: {
      hu: {
        problemText: "<p>Az ábrán látható kis szakaszokat szeretnénk kiszínezni 3 színnel úgy, hogy a kis háromszögek egyikét se határolja pontosan két szín. Hányféleképpen tehetjük ezt meg?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/8_D_D_11.png",
        help1: "Bontsátok esetekre a feladatot egy- vagy többszínűség szerint.",
        help2: "A középső háromszög meghatározó.",
      },
    },
  },
  'su2lbs0qx9--trapez-alapja-egyseg': {
    answer: 38,
    content: {
      hu: {
        problemText: "<p>Egy trapéz két alapja 4 és 9 egység hosszú, továbbá lehet egy az alapokkal párhuzamos egyenest húzni, mely úgy osztja két kisebb trapézra, hogy mindkettőnek lesz beírható köre. Hány egység a trapéz kerülete?</p>",
        help1: "Egészítsétek ki háromszöggé a trapézt.",
        help2: "Használjátok a szelőtételt és az érintőnégyszög-tételt!",
      },
    },
  },
  'rgmiya7apd--tegyuk-valaki-tototippet': {
    answer: 4,
    content: {
      hu: {
        problemText: "<p>Tegyük fel, hogy valaki minden lehetséges totótippet elkészít egy héten (13 mérkőzés, kitöltve 1, vagy 2, vagy X jellel), majd a mérkőzések után csoportosítja tippjeit a rajtuk lévő találatok száma szerint. Hány találatos csoportba kerül a legtöbb tipp?</p>",
        help1: "Mennyi pontosan k találat valószínűsége?",
        help2: "<em>k+1</em> találat valószínűsége hányszorosa <em>k</em> találaténak?",
      },
    },
  },
  'qahmlyq9ab--egysegnegyzet-oldalat-feloszottuk': {
    answer: 10,
    content: {
      hu: {
        problemText: "<p>Egy egységnégyzet minden oldalát feloszottuk \\(n\\) egyenlő hosszúságú szakaszra, oldalanként \\(n-1\\) osztópont segítségével. Legyen az \\(AB\\) oldal \\(A\\)-hoz legközelebbi osztópontja \\(A_1\\), és hasonlóan körbe vegyük így fel a \\(BC\\), \\(CD\\), \\(DA\\) oldalakon a \\(B_1\\), \\(C_1\\), \\(D_1\\) pontokat. Ezután húzzuk be az \\(AC_1\\), \\(BD_1\\), \\(CA_1\\), \\(DB_1\\) szakaszokat. Ezek középen meghatároznak egy kis négyzetet, amelynek a területe \\(\\frac{1} {181} \\). Mekkora az \\(n\\)?</p>",
        help1: "Daraboljátok fel a nagy négyzetet a kisnégyzetre és más, könnyen számolható területű alakzatokra!",
        help2: "Hasonlósággal számolható, hogy a metsző szakaszok milyen arányban osztják egymást.",
      },
    },
  },
  'dkry9455pb--osztalytars-bizonyitvanyosztas-megallapitotta': {
    answer: 6,
    content: {
      hu: {
        problemText: "<p>Hét osztálytárs a bizonyítványosztás után megállapította, hogy nincs köztük kettő, aki mind a 12 tárgyból ugyanazt az osztályzatot kapta volna. A 12 tárgyból ki lehet választani \\(k\\) olyat, hogy ha csak az ebből a \\(k\\) tárgyból kapott osztályzatokat hasonlítjuk össze, akkor sincs a hét diák közt két olyan, aki mind a \\(k\\) tárgyból ugyanazt a jegyet kapta. Melyik a legkisebb \\(k\\), amire ezt még biztosan megtehetjük?</p>",
        help1: "Mennyi lenne a válasz két osztálytárs esetén?",
        help2: "Használjatok indukciót!",
      },
    },
  },
  'ou0dud34e2--tetraeder-csucsat-tukrozve': {
    answer: 15,
    content: {
      hu: {
        problemText: "<p>Az \\(ABCD\\) tetraéder \\(A\\) csúcsát tükrözve a \\(B\\)-re, kapjuk az \\(A_1\\) pontot. Hasonlóan a \\(B\\) tükörképe \\(C\\)-re \\(B_1\\), a \\(C\\)-é \\(D\\)-re \\(C_1\\) és a \\(D\\)-é \\(A\\)-ra \\(D_1\\). Hányszorosa az \\(A_1B_1C_1D_1\\) tetraéder térfogata az \\(ABCD\\) térfogatának?</p>",
        help1: "Egy tetraéder térfogata konstansszorosa (bármely lapra) a lap területének és a szemközti csúcs laptól való távolságának a szorzatával.",
        help2: "Próbáljátok a nagy tetraédert kitölteni olyan darabokkal (feldarabolni), amelyeknek ki tudjátok számolni a térfogatát! (Vagy ha ismeritek, használjatok vegyes szorzatot.)",
      },
    },
  },
};
