import type { CompetitionBank, ProblemBank } from '../src/sources';

// Edition 6's final, relay only, as the relay practice site serves it: one
// competition per category, and the problems their relays use, each written
// once. Released, so the practice site may import it.

export const competitions: CompetitionBank = {
  'brzrrsj6dl--06-final-a': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'cakym758di--velenceben-otemeletes-fogado', points: 2 },
        { problemId: 'aqgh9xvjoj--durer-postakocsival-utazik', points: 3 },
        { problemId: 'hja80ecw0s--durer-velence-hires', points: 3 },
        { problemId: 'nonrp9853q--kiolvasni-tablazatbol-durer', points: 4 },
        { problemId: 'po9n8pebje--durer-megparancsolja-szolgalojanak', points: 5 },
        { problemId: 'gtkkbktx9e--durer-kulonos-levelet', points: 2 },
        { problemId: 'ihn07vix71--durer-velencei-fogadojaban', points: 3 },
        { problemId: 'jvhzb99ng7--kockank-melynek-csucsaira', points: 3 },
        { problemId: 'gdx3e93ak2--marco-elkezdi-tol', points: 4 },
        { problemId: '4xdnycd8b5--durer-kulonbozo-szam', points: 5 },
        { problemId: 'kmakizf5xl--erdekes-evszam-mert', points: 2 },
        { problemId: '0cl0ggnh5c--velenceben-kulonfele-kereskedok', points: 3 },
        { problemId: 'om8icl24vo--legkisebb-szam-szamjegyei', points: 3 },
        { problemId: '3v8blpallz--haromszog-amelynek-oldalai', points: 4 },
        { problemId: '6zs3ubeexv--durer-kimegy-piacra', points: 5 },
      ],
    },
    metadata: { kind: 'competition', edition: 6, round: 'final', category: 'A' },
  },
  '8z2d46pbk4--06-final-b': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'z82zvj4unz--lathato-trapez-terulete', points: 2 },
        { problemId: 'pba7v4r2ry--egyenlo-szaru-hegyesszogu', points: 3 },
        { problemId: 'pkit5pujra--nagy-negyzet-belsejebe', points: 3 },
        { problemId: 'ro157xcuhy--haromszog-magassaga', points: 4 },
        { problemId: '6nngle29q7--hetszognek-kiszamoltuk-szomszedos', points: 5 },
        { problemId: '46x9qk2bm8--legkisebb-paros-szam', points: 2 },
        { problemId: 'xqbmjfd64j--osszeszoroztunk-egymast-koveto', points: 3 },
        { problemId: 'kfq84ga8xm--negyjegyu-szamokkal-foglalkozunk', points: 3 },
        { problemId: '5ecpul4j8e--negyjegyu-paros-negyzetszam', points: 4 },
        { problemId: 'gxayiv7w9f--szamok-amelyekre-kulonbozo', points: 5 },
        { problemId: 'fmrexgfiup--lovagok-lokotok-szigeten', points: 2 },
        { problemId: 'ur24meend8--tablazat-mezoiben-kozotti', points: 2 },
        { problemId: '7vmaotlhqy--futoversenyen-otfos-csapat', points: 3 },
        { problemId: 'c6yjuk11y6--betuben-mezot-szamokkal', points: 4 },
        { problemId: 'yw49i7vd8x--sakktabla-minel-tobb', points: 5 },
      ],
    },
    metadata: { kind: 'competition', edition: 6, round: 'final', category: 'B' },
  },
  'irr749k51s--06-final-c': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: '0uwj4kzsoz--sorba-rakni-kek', points: 2 },
        { problemId: 'pqf1uvjq8j--velencei-karnevalon-kulon', points: 3 },
        { problemId: '66gyzj3r28--tarsasag-egyutt-utazik', points: 4 },
        { problemId: 'l2yhz267ks--tablazat-mezojet-pirosra', points: 4 },
        { problemId: 'e8edmu9eds--nevezzunk-sorozatot-edeninek', points: 4 },
        { problemId: 'qfuvewtefj--sorozat-elso-tagja', points: 2 },
        { problemId: '3aig1gi4d1--jelolje-szamjegyeinek-osszeget', points: 3 },
        { problemId: 'n9vo4rc8my--nehany-szam-osszege', points: 3 },
        { problemId: 'fr1sepcy5b--halmaz-reszhalmazaban-kiszamoljuk', points: 4 },
        { problemId: 'iukrr6z3cv--reszhalmazahoz-hozzarendelunk-erteket', points: 5 },
        { problemId: 'czotm2fkzl--kis-herceg-szabalyos', points: 2 },
        { problemId: 'oxrj063x62--metszespontja-kilencszognek-tizszognek', points: 3 },
        { problemId: '5mkm3p9cqw--negyzet-oldalan-felvettunk', points: 3 },
        { problemId: 'gr7mc6xob1--haromszogben-oldal-felezopontja', points: 4 },
        { problemId: 'npqg2sc7tx--haromszog-csucsanal-levo', points: 5 },
      ],
    },
    metadata: { kind: 'competition', edition: 6, round: 'final', category: 'C' },
  },
  'hd1te124s9--06-final-d': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'fc47rqashy--sorba-rakni-kek', points: 2 },
        { problemId: 'lcd6cyqth6--este-aladar-hutojeben', points: 3 },
        { problemId: '1e53agv0mv--kiszinezni-tablazat-mezoit', points: 4 },
        { problemId: 'uvlw3vo6ca--ter-bizonyos-koordinataju', points: 4 },
        { problemId: '3eztrsp8nr--embert-osztottak-elvegzendo', points: 4 },
        { problemId: 'ip929u2jlz--nehany-szam-osszege', points: 3 },
        { problemId: '3aig1gi4d1--jelolje-szamjegyeinek-osszeget', points: 3 },
        { problemId: '22fg18xbcg--elso-szambol-valaszthatunk', points: 4 },
        { problemId: 'lvqj3na522--nel-kisebb-tel', points: 5 },
        { problemId: 'o2j28sd23m--teruletu-szabalyos-hatszogbe', points: 2 },
        { problemId: 'btruohg8wb--egysegoldalu-szabalyos-haromszog', points: 3 },
        { problemId: 'iuntljn3kh--szampar-amire-oldalu', points: 3 },
        { problemId: 'u264lzg40b--eves-hollonal-eselye', points: 4 },
        { problemId: '0xm73zgh3z--haromszogben-oldal-harmadolopontjai', points: 5 },
      ],
    },
    metadata: { kind: 'competition', edition: 6, round: 'final', category: 'D' },
  },
};

export const problems: ProblemBank = {
  'cakym758di--velenceben-otemeletes-fogado': {
    answer: 120,
    content: {
      hu: {
        problemText: "<p>Velencében van egy ötemeletes fogadó. Dürer és szolgálója, Marco a fogadó ötödik emeletén szállt meg. (A fogadóban a földszintet 0-val számozzák.) Egyik nap elkezdenek felfelé baktatni, amikor Marco a második emeleten rájön, hogy lent hagyta a bőröndöket. Leszalad érte, majd felviszi gazdájához, az ötödik emeletre. Így összesen 216 lépcsőt tett meg. Két emelet között azonos a lépcsőfokok száma. Hány lépcsőfok van összesen?</p>",
        help1: "Hány emeletet tett meg Marco?",
        help2: "Olvasd el figyelmesen a kérdést.",
      },
    },
  },
  'aqgh9xvjoj--durer-postakocsival-utazik': {
    answer: 384,
    content: {
      hu: {
        problemText: "<p>Dürer postakocsival utazik Velencébe. A kocsihoz öt kerék van, egyet mindig felrak tartaléknak a csomagtartóba. A kerekeket időnként lecseréli az ötödikre, úgy, hogy a megérkezésig minden kerék ugyanannyit fusson. Velence 480 km-re van. Hány kilométert fut egy kerék?</p>",
        help1: "Egy kerék az út hányad részén van használatban?",
        help2: "Mennyit fut az öt kerék összesen?",
      },
    },
  },
  'hja80ecw0s--durer-velence-hires': {
    answer: 21,
    content: {
      hu: {
        problemText: "<p>Dürer Velence híres hídján, a Rialto hídon szeretne átkelni. A hídon a vámszedő először mindig megkétszerezi az átkelő pénzét, majd ebből elvesz 24 dukátot. Dürer egyik nap háromszor kel át a hídon, és a harmadszori fizetésnél pont elfogy a pénze. Hány dukátja volt az adott nap reggelén Dürernek, mielőtt először átkelt volna?</p>",
        help1: "Gondolkozzatok visszafelé!",
        help2: "Próbáljátok ki konkrét számokkal!",
      },
    },
  },
  'nonrp9853q--kiolvasni-tablazatbol-durer': {
    answer: 12,
    content: {
      hu: {
        problemText: "<p>Hányféleképpen lehet kiolvasni az alábbi táblázatból a DÜRER-szót? Egy betűt csak egyszer használhatunk, de bármelyik oldalszomszédos mezőre léphetünk.</p><p><center>D Ü R<br>Ü R E<br>R E R</center></p>",
        help1: "Írjátok oda az egyes betűkhöz, hogy hányféleképpen lehet oda jutni!",
        help2: "Hányféleképpen juthattok el az E betűkig, és onnan merre tudjátok befejezni?",
      },
    },
  },
  'po9n8pebje--durer-megparancsolja-szolgalojanak': {
    answer: 3,
    content: {
      hu: {
        problemText: "<p>Dürer megparancsolja szolgálójának, Marconak, hogy adja össze az egész számokat 1-től 200-ig. Marco el is kezdi a hosszadalmas munkát: 1+2+3+\\(\\ldots\\). Később Dürer odamegy Marcohoz, hogy megnézze, hol tart, és azt látja, hogy a lapon 3000 szerepel. Megszólal: <i>Hmmm, ha jól látom, kihagytál egy számot!</i> Melyik számot hagyta ki Marco?</p>",
        help1: "Hány számot kell legalább összeadni, hogy 3000-nél nagyobb számot kapjunk?",
        help2: "Összeadni trükkösen is lehet, például 1+2+3+4=(1+4)+(2+3)=5+5=10",
      },
    },
  },
  'gtkkbktx9e--durer-kulonos-levelet': {
    answer: 4,
    content: {
      hu: {
        problemText: "<p>Dürer az alábbi különös levelet kapta:</p><p><center><ul><li>Ezen a lapon 1 hamis állítás van.<li>Ezen a lapon 2 hamis állítás van.<li>Ezen a lapon 3 hamis állítás van.<li>Ezen a lapon 4 hamis állítás van.<li> Ezen a lapon 5 hamis állítás van.</ul></center></p><p>Mennyi az igaz állítások sorszámainak szorzata?</p>",
        help1: "Legfeljebb hány igaz állítás lehet?",
        help2: "Lehet-e mind hamis?",
      },
    },
  },
  'ihn07vix71--durer-velencei-fogadojaban': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>Dürer velencei fogadójában, ahol megszállt, különös kártyákkal mulatnak a helyiek. A kártyák egyik felén betű van, a másik felén szám. Azok a szabályos kártyák, amelyekre a következő igaz: magánhangzó mögött páros szám van. Az asztalra az 11 lapot pakoltak le, amelyeknek a következők betűk/számok láthatóak: A, B, C, D, E, F, 1, 2, 3, 4, 5.</p><p>Hányat kell legalább megfordítanunk, hogy kiderüljön, melyek a hamisak?</p>",
        help1: "Vajon szabályos kártya-e a D-1 vagy a D-2?",
        help2: "Lehet-e szabálytalan olyan kártya, amelyiken páros szám van?",
      },
    },
  },
  'jvhzb99ng7--kockank-melynek-csucsaira': {
    answer: 120,
    content: {
      hu: {
        problemText: "<p>Van egy kockánk, melynek a csúcsaira számokat írtunk. A kocka éleire az élen lévő csúcsok számának összegét írjuk, a lapokra pedig a lapon elhelyezkedő éleken szereplő számok összegét. Az egész kocka száma a lapokra írt számok összege, továbbá tudjuk, hogy a csúcsokra írt számok összege 20. Mi a kocka száma?</p>",
        help1: "Egy csúcsból hány él indul?",
        help2: "Egy csúcs számát az összeg hányszor tartalmazza?",
      },
    },
  },
  'gdx3e93ak2--marco-elkezdi-tol': {
    answer: 422,
    content: {
      hu: {
        problemText: "<p>Marco elkezdi 2-től egyesével felírni a számokat. Az 1-es tiltott számjegy, tehát amiben van 1-es számjegy, átugorja. Mi lesz a 253. felírt szám?</p>",
        help1: "Hány számot hagy ki az első százból? És a másodikból?",
        help2: "Hány szám marad az utolsó százasra? Írjátok le sorban a maradékot!",
      },
    },
  },
  '4xdnycd8b5--durer-kulonbozo-szam': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>Dürer előtt van öt különböző pozitív egész szám. Páronként összeadja őket, és az alábbi összegeket kapja:</p><p><center>5, 7, 8, 11, 12, 12, 13, 14, 15, 19</center></p><p>Mi a (nagyság szerint) középső szám?</p>",
        help1: "Hogyan lehet kiszámolni az öt szám összegét?",
        help2: "Mennyi a két legkisebb szám összege? Mennyi lehet a legkisebb és a középső szám összege?",
      },
    },
  },
  'kmakizf5xl--erdekes-evszam-mert': {
    answer: 711,
    content: {
      hu: {
        problemText: "<p>2013 egy érdekes évszám, mert négy egymást követő számjegy szerepel benne: 0, 1, 2, 3. Mennyi a következő és az előző ugyanilyen számjegyekből (0, 1, 2, 3) álló évnek a különbsége?</p>",
        help1: "Célszerű az évszámnak csak a kisebb helyiértékű számjegyeit cserélgetni, ha lehet.",
        help2: "Van-e olyan 2000-es évekbeli évszám, ami 2013-nál kisebb?",
      },
    },
  },
  '0cl0ggnh5c--velenceben-kulonfele-kereskedok': {
    answer: 132,
    content: {
      hu: {
        problemText: "<p>Velencében a különféle kereskedők a fahéj lejárati idejét ’hónap nap’ vagy ’nap hónap’ sorrendben tüntetik fel. Emiatt gyakran összekeverednek az emberek, hogy például az adott dátum vajon január másodika vagy február elseje. Hány olyan dátum van az évben, ami keveredést okozhat?</p>",
        help1: "Hány hónap jöhet szóba, és havonta hány megfelelő nap?",
        help2: "Például március 3-a egyértelmű-e?",
      },
    },
  },
  'om8icl24vo--legkisebb-szam-szamjegyei': {
    answer: 36,
    content: {
      hu: {
        problemText: "<p>Melyik az a legkisebb pozitív egész szám, amely számjegyei szorzatának a kétszeresével egyenlő?</p>",
        help1: "Lehet-e egyjegyű, 10-zel kezdődő, stb?",
        help2: "Ha a szám <em>10+b</em>, ahol <em>b</em> egyjegyű, akkor 10+b=2&sdot;1&sdot;b lenne...",
      },
    },
  },
  '3v8blpallz--haromszog-amelynek-oldalai': {
    answer: 13,
    content: {
      hu: {
        problemText: "<p>Hány olyan háromszög van, amelynek oldalai centiméterben mérve egész számok, és egyik oldala sem hosszabb 4 cm-nél? <br><i>Két háromszöget azonosnak tekintünk, ha oldalhosszaik ugyanazok.<i></p>",
        help1: "Gondoljátok át, mikor nem létezik háromszög adott oldalhosszokkal!",
        help2: "Érdemes a legrövidebb vagy a leghosszabb oldal szerint csoportosítva összeszámolni a lehetőségeket.",
      },
    },
  },
  '6zs3ubeexv--durer-kimegy-piacra': {
    answer: 38,
    content: {
      hu: {
        problemText: "<p>Dürer kimegy a piacra és elbeszélget az egyik tojást áruló nénivel. Marika néni kétféle tojást árul: tyúktojást és kacsatojást. Összesen 6 kosara van, egy kosárba csak azonos fajta tojást tesz. A kosarakban a tojások száma a következő: 6, 4, 12, 13, 22, 29. Dürer megveszi az egyik kosárból az összes tojást, erre a néni felkiált: most kétszer annyi tyúktojásom van, mint kacsa! Hány tyúktojása van Marika néninek Dürer vásárlása után?</p>",
        help1: "Ha a bal kezemben kétszer annyi alma van, mint a jobb kezemben, akkor lehet-e összesen 10 almám?",
        help2: "Mennyi a kosarakban levő almák számának 3-as maradékai?",
      },
    },
  },
  'z82zvj4unz--lathato-trapez-terulete': {
    answer: 30,
    content: {
      hu: {
        problemText: "<p>Az ábrán látható trapéz területe 60 egység. Az egyik szár felezőpontja \\(F\\). Tekintsük az \\(F\\) pont és a másik szár által bezárt háromszöget (az ábrán szürkével van jelölve). Mekkora a területe?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/6_D_B_1.png",
        help1: "Az F felezőponton keresztül húzzatok párhuzamost az alapokkal!",
        help2: "A két részben mekkora a satírozott háromszögek területének aránya?",
      },
    },
  },
  'pba7v4r2ry--egyenlo-szaru-hegyesszogu': {
    answer: 36,
    content: {
      hu: {
        problemText: "<p>Az \\(ABC\\) egyenlő szárú, hegyesszögű háromszöget az egyik belső szögfelezője két egyenlő szárú háromszögre bontja. Mekkora az \\(ABC\\) háromszög legkisebb szöge?</p>",
        help1: "Jelöljétek, hogy melyik szögek lehetnek egyenlők a keletkező háromszögekben!",
        help2: "Az egyik keletkező háromszögnek biztosan lesz legalább 90&deg fokos szöge, csak a másik kettő lehet egyenlő.",
      },
    },
  },
  'pkit5pujra--nagy-negyzet-belsejebe': {
    answer: 66,
    content: {
      hu: {
        problemText: "<p>Egy nagy négyzet belsejébe egy kisebb négyzetet tettünk úgy, hogy a megfelelő oldalaik párhuzamosak legyenek. A kis négyzet egy-egy oldalát összekötöttük a nagy négyzet egy-egy csúcsával, az ábrán látható módon. Az így keletkezett kis háromszögek területe rendre 53, 22 illetve 35 egység. Hány egység a negyedik háromszög területe?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/6_D_B_3.png",
        help1: "Rajzoljátok be a kis négyzet oldalegyeneseit!",
        help2: "Vizsgáljátok a szemközti háromszögek magasságai összegét!",
      },
    },
  },
  'ro157xcuhy--haromszog-magassaga': {
    answer: 3,
    content: {
      hu: {
        problemText: "<p>Egy háromszög három magassága \\(m_a<m_b<m_c\\), ahol mindhárom magasság hossza centiméterben mérve egy-egy egész szám. Tudjuk, hogy \\(m_a=2 cm\\). Milyen hosszú \\(m_b\\)?</p>",
        help1: "A magasságok hossza arányos az oldalhosszok reciprokaival.",
        help2: "Ha b túl nagy, akkor túl rövidek háromszög rövidebb oldalai.",
      },
    },
  },
  '6nngle29q7--hetszognek-kiszamoltuk-szomszedos': {
    answer: 42,
    content: {
      hu: {
        problemText: "<p>Egy hétszögnek kiszámoltuk a szomszédos szögeinek összegét. Az első hat eredmény rendre 264&deg;, 263&deg;, 309&deg;, 292&deg;, 285&deg;, valamint 185&deg; lett. Mekkora a hétszög legkisebb szöge?</p>",
        help1: "Jelöljétek például x-szel az egyik szög nagyságát, és fejezzétek ki vele a többit.",
        help2: "A szögeket összeadva, egy egyenletet kaptok <em>x</em>-re. Mennyi is a hétszög belső szögeinek összege?",
      },
    },
  },
  '46x9qk2bm8--legkisebb-paros-szam': {
    answer: 902,
    content: {
      hu: {
        problemText: "<p>Mennyi a 100 legkisebb pozitív páros szám számjegyeinek összege?</p>",
        help1: "Célszerű helyiértékenként csoportosítva számolni.",
        help2: "Melyik helyiértéken melyik számjegy hányszor szerepel? Figyeljetek külön a 200-ra is.",
      },
    },
  },
  'xqbmjfd64j--osszeszoroztunk-egymast-koveto': {
    answer: 19,
    content: {
      hu: {
        problemText: "<p>Összeszoroztunk 7 egymást követő, 50-nél kisebb pozitív egész számot, és eredményül egy olyan számot kaptunk, melynek utolsó két jegye 0. Hányféleképpen választhattuk ki a 7 egymást követő egészet?</p>",
        help1: "Milyen oszthatósági feltételnek kell teljesülnie?",
        help2: "7 egymást követő szám közül általában hánynak kell 5-tel oszthatónak lennie ehhez? Nézzétek végig a lehetőségeket!",
      },
    },
  },
  'kfq84ga8xm--negyjegyu-szamokkal-foglalkozunk': {
    answer: 81,
    content: {
      hu: {
        problemText: "<p>Olyan négyjegyű számokkal foglalkozunk, amikben csak 3-as vagy 4-es számjegy szerepel. Az összes lehetséges olyan számpárt elkészítjük, aminek mindkét tagja ilyen típusú. Ezután minden párban összeadjuk a pár két tagját. Hány különböző összeget kapunk?</p>",
        help1: "Ha két ilyen számot összeadtok, akkor minden helyiérték hasonlóan viselkedik.",
        help2: "Az összeg jegyei csak 6, 7 vagy 8 lehetnek. Milyen összegek fordulhatnak elő ezek közül?",
      },
    },
  },
  '5ecpul4j8e--negyjegyu-paros-negyzetszam': {
    answer: 3136,
    content: {
      hu: {
        problemText: "<p>A négyjegyű \\(\\overline{abcd}\\) egy páros négyzetszám, ahol \\(a\\cdot b\\codt c\\cdot d=54\\). Melyik ez a szám?</p>",
        help1: "d páros kell, hogy legyen. Lehet-e 2? És 6?",
        help2: "Egy négyzetszám 4-es maradéka mi lehet? Bontsátok esetekre c szerint, és nézzétek végig az összes lehetőséget.",
      },
    },
  },
  'gxayiv7w9f--szamok-amelyekre-kulonbozo': {
    answer: 14,
    content: {
      hu: {
        problemText: "<p>Legyenek \\(a\\), \\(b\\), \\(c\\), \\(d\\) pozitív egész számok, amelyekre \\(1=\\frac{1}{a}+\\frac{1}{b}+\\frac{1}{c}+\\frac{1}{d}\\) Hányféle (különböző) megoldás van, ha \\(a\\geq b\\geq c\\geq d\\)?</p>",
        help1: "Becsüld sorban az a, b, ... változókat (például ha a=3, akkor b<=4). Bontsd esetekre a feladatot.",
        help2: "Nincs mese, végig kell nézni az eseteket. a, b, c, d sorrendben vizsgáljátok meg a változók minimális és maximális lehetséges értékeit, és gyűjtsétek táblázatba a megoldásokat!",
      },
    },
  },
  'fmrexgfiup--lovagok-lokotok-szigeten': {
    answer: 4,
    content: {
      hu: {
        problemText: "<p>A lovagok és lókötők szigetén öt emberrel találkozunk. Tudjuk azt, hogy több lovag van köztük, mint lókötő. A lovagok mindig igazat mondanak, a lókötők mindig hazudnak. Az öt ember a következőket mondja:</p><p><center><ol type=\"A\"><li>E lovag.<li>D lovag<li>A lókötő.<li>C lókötő.<li>B lovag.</ol></center></p><p>Hány lovag van közöttük?</p>",
        help1: "Tegyétek fel, hogy valamelyik konkrét ember lovag (vagy hogy lókötő).",
        help2: "Ha A szerint E lovag, akkor mindketten lovagok vagy lókötők. Nézzétek végig a láncot!",
      },
    },
  },
  'ur24meend8--tablazat-mezoiben-kozotti': {
    answer: 2,
    content: {
      hu: {
        problemText: "<p>Egy \\(3\\times 3\\)-as táblázat mezőiben 1 és 9 közötti egész számok vannak, mindegyik pontosan egyszer. Valaki megadta nekünk a három oszlopban és a három sorban az ott lévő elemek szorzatát. A sorok szorzatai rendre \\(20=a\\cdot b\\cdot c\\), \\(108=d\\cdot e\\cdot f\\), \\(168=g\\cdot h\\cdot i\\); az oszlopok szorzatai pedig \\(42=a\\cdot d\\cdot g\\), \\(80=b\\cdot e\\cdot h\\), \\(108=c\\cdot f\\cdot i\\).</p><p>Mivel egyenlő \\(e\\)? </p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/6_D_B_12.png",
        help1: "Melyik betű jelöli az 5-öt?",
        help2: "Nézzétek meg a szorzatokat 5-ös és 7-es oszthatóság szerint, azután 4-es és 9-es maradékokat is vegyetek figyelembe.",
      },
    },
  },
  '7vmaotlhqy--futoversenyen-otfos-csapat': {
    answer: 13,
    content: {
      hu: {
        problemText: "<p>Egy futóversenyen 2 ötfős csapat versenyzett. Egy csapat pontszáma a tagok helyezéseinek összege (holtverseny nem alakult ki). Hányféle pontszáma lehetett a győztes (kevesebb pontot gyűjtő) csapatnak?</p>",
        help1: "Számít-e, hogy ki hány pontot ért el, vagy a csapat összpontszáma az, ami lényeges?",
        help2: "Legrosszabb esetben mennyi a győztes csapat összpontszáma? És legjobb esetben?",
      },
    },
  },
  'c6yjuk11y6--betuben-mezot-szamokkal': {
    answer: 23,
    content: {
      hu: {
        problemText: "<p>Az alábbi \\(M\\) betűben a 9 mezőt az 1, 2, \\(\\ldots\\), 9 számokkal töltötték ki úgy, hogy mindegyik pontosan egyszer szerepeljen. A négy száron a számhármasok összege ugyanaz az \\(n\\) szám. Mennyi a kérdőjelek helyére írt számok összege, ha \\(n\\) a lehető legnagyobb?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/6_D_B_14.png",
        help1: "A kérdőjeles mezőkbe lehetőleg kicsi vagy nagy számok kerüljenek?",
        help2: "A négy szárba írt számok összege <em>4n</em> (a ?-es számokat többször számolva).",
      },
    },
  },
  'yw49i7vd8x--sakktabla-minel-tobb': {
    answer: 48,
    content: {
      hu: {
        problemText: "<p>Egy sakktábla minél több mezőjét szeretnénk pirosra festeni úgy, hogy ne legyen teljesen pirosra festett átló (akár egyetlen sarokmező is átlónak számít). Legfeljebb hány mezőt festhetünk pirosra?</p>",
        help1: "Tekintsétek külön-külön azokat a téglalapokat, amelyeket négy ilyen átlós vonal határoz meg.",
        help2: "Legalább hány pontját kell színezetlenül hagyni a főátlóknak és az átlók által meghatározott téglalapoknak?",
      },
    },
  },
  '0uwj4kzsoz--sorba-rakni-kek': {
    answer: 10,
    content: {
      hu: {
        problemText: "<p>Hányféleképpen lehet sorba rakni három kék, két zöld, és egy piros golyót úgy, hogy azonos színűek ne kerüljenek egymás mellé?</p>",
        help1: "Először tegyük le a három két golyót egymástól elég távol az asztalra, majd utána a többit a sorrendbe!",
        help2: "Osszátok fel esetekre a lehetséges elhelyezéseket az alapján, hogy a két zöld golyó hova kerül a kékekhez képest.",
      },
    },
  },
  'pqf1uvjq8j--velencei-karnevalon-kulon': {
    answer: 43,
    content: {
      hu: {
        problemText: "<p>A velencei karneválon külön pénzt vezetnek be, van 6, 9, és 20 értékű fabatka. Mennyi az a legmagasabb összeg, amit sehogyan sem tudunk pontosan kifizetni?</p>",
        help1: "Melyik a legnagyobb 3-mal osztható szám, amit nem lehet kifizetni?",
        help2: "Nézzétek meg más hármas maradékokra is, melyik a legkisebb szám, amit ki tudtok fizetni.",
      },
    },
  },
  '66gyzj3r28--tarsasag-egyutt-utazik': {
    answer: 12,
    content: {
      hu: {
        problemText: "<p>Egy társaság együtt utazik a velencei karneválra, kilencféle álarcból vásárolnak maguknak. Ha mindenki három fajta álarcot vesz, és bármely két ember legfeljebb egy egyforma álarcot vesz, akkor hányan lehetnek legfeljebb a társaságban?</p>",
        help1: "Az eredményre kaphatunk egy felső becslést az (ember,maszk) párokat kétféleképpen számolva.",
        help2: "Keressetek minél nagyobb konstrukciót!",
      },
    },
  },
  'l2yhz267ks--tablazat-mezojet-pirosra': {
    answer: 510,
    content: {
      hu: {
        problemText: "<p>Egy \\(8\\times8\\)-as táblázat minden mezőjét pirosra vagy kékre színezzük úgy, hogy minden \\(2\\times2\\)-es részen két kék és két pirosra festett mező legyen. Hányféleképpen tehetjük ezt meg, ha az egymásba forgatható színezéseket különbözőnek tekintjük?</p>",
        help1: "Ha van két szomszédos, azonos színű mező, az meghatározza a mellettük lévő két mezőt, amelyekkel egy 2×2-es részt alkotnak.",
        help2: "Próbáljátok meg aszerint csoportosítani a megfelelő kitöltéseket az első oszlop kitöltése szerint.",
      },
    },
  },
  'e8edmu9eds--nevezzunk-sorozatot-edeninek': {
    answer: 6764,
    content: {
      hu: {
        problemText: "<p>Nevezzünk egy sorozatot édeninek, ha elemei az {1, 2, \\(\\ldots\\), \\(N\\)} halmazból valók, a sorozat szigorúan monoton nő, páratlan indexű helyeken páratlan szám áll, páros indexű helyeken páros. Jelölje \\(e(N)\\) az {1, 2, \\(\\ldots\\), \\(N\\)} halmazból képezhető édeni sorozatok számát, például \\(e(3) = 4\\), mert az {1, 2, 3} elemekből képezhető édeni sorozatok:   1;   3;   1, 2;   1, 2, 3. </p><p>Ha tudjuk, hogy \\(e(17)=4180\\) és \\(e(20)=17710\\), mennyi \\(e(18)\\)?</p>",
        help1: "Osszátok szét az <em>e(N)</em> által megszámolt sorozatokat aszerint, hogy az <em>N</em> szám szerepel-e bennük.",
        help2: "Érdemes definiálni <em>a(N)<em> (és <em>b(N)</em>-t) úgy, mint az {1, 2, ..., <em>N</em>} halmazból képezhető édeni, páros (páratlan) számra végződő sorozatok számát.",
      },
    },
  },
  'qfuvewtefj--sorozat-elso-tagja': {
    answer: 89,
    content: {
      hu: {
        problemText: "<p>Egy sorozat első tagja 2, második tagja 5, a további tagokat pedig az /[a_{n+2}=a_{n+1}\\cdot a_{n} rekurzív képlet alapján határozzuk meg. Tízes számrendszerben hány 0-ra végződik a sorozat 13. tagja?</p>",
        help1: "Figyeljétek meg a 2, illetve az 5 kitevőjét a sorozat tagjaiban.",
        help2: "Ezek a sorozatok (eltolt) Fibonacci-sorozatok.",
      },
    },
  },
  '3aig1gi4d1--jelolje-szamjegyeinek-osszeget': {
    answer: 13,
    content: {
      hu: {
        problemText: "<p>Jelölje \\(s(n)\\) \\(n\\) számjegyeinek összegét tízes számrendszerben. Maximálisan mennyi lehet \\(\\frac{s(n)}{s(16n)}\\) értéke?</p>",
        help1: "Igaz-e, hogy <em>s(a+b)<=s(a)+s(b)</em>?",
        help2: "Igaz-e, hogy <em>s(a&sdot; b)<=s(a)&sdot; s(b)</em>?",
      },
    },
  },
  'n9vo4rc8my--nehany-szam-osszege': {
    answer: 1458,
    content: {
      hu: {
        problemText: "<p>Néhány pozitív egész szám összege 20. Mennyi lehet legfeljebb a szorzatuk?</p>",
        help1: "Lehet 4-nél nagyobb szám a számok között?",
        help2: "Lehet több, mint 2 darab kettes?",
      },
    },
  },
  'fr1sepcy5b--halmaz-reszhalmazaban-kiszamoljuk': {
    answer: 18,
    content: {
      hu: {
        problemText: "<p>Az \\(A=\\){1, 2, \\(\\ldots\\), 16, 17} halmaz minden részhalmazában kiszámoljuk az elemek reciprokának szorzatát. Mi ezen értékek összege?<br><i>Az üres szorzatot tekintsük 1-nek.</i></p>",
        help1: "Osszátok a szorzatokat párba aszerint, hogy szerepel-e bennük az 1/17.",
        help2: "Használjatok indukciót!",
      },
    },
  },
  'iukrr6z3cv--reszhalmazahoz-hozzarendelunk-erteket': {
    answer: 2520,
    content: {
      hu: {
        problemText: "<p>Legyen \\(A=\\){1, 2, 3, 4, 5, 6}. Minden részhalmazához hozzárendelünk egy értéket úgy, hogy egy egyelemű részhalmaz értéke a benne lévő elem, egy \\(k\\) elemű részhalmaz értéke az összes benne lévő \\(k-1\\) elemű részhalmaz értékének összege. Mennyi \\(A\\) értéke?</p>",
        help1: "A kételemű halmazokhoz rendelt érték a két elem összege.",
        help2: "A három elemű halmazokhoz rendelt érték a három elem összegének kétszerese.",
      },
    },
  },
  'czotm2fkzl--kis-herceg-szabalyos': {
    answer: 10,
    content: {
      hu: {
        problemText: "<p>A Kis Herceg egy szabályos gömb alakú bolygón él, melynek sugara 24 km. Egy helikopterrel 2 km magasan a felszín felett lebeg. Milyen messze van tőle az a legtávolabbi pont a felszínen, amit még lát?</p>",
        help1: "A kérdezett pont az a tőle a bolygóhoz húzott egyik érintő egyenesen van rajta.",
        help2: "A bolygó középpontja, a helikopter és a kérdezett pont egy derékszögű háromszög csúcsai.",
      },
    },
  },
  'oxrj063x62--metszespontja-kilencszognek-tizszognek': {
    answer: 80,
    content: {
      hu: {
        problemText: "<p>Legfeljebb hány metszéspontja lehet egy kilencszögnek és egy tízszögnek? (A két sokszög lehet konkáv is.)</p>",
        help1: "Keressetek minél nagyobb konstrukciót.",
        help2: "Legfeljebb hány oldalát metszheti a 9-szögnek egy egyenes?",
      },
    },
  },
  '5mkm3p9cqw--negyzet-oldalan-felvettunk': {
    answer: 45,
    content: {
      hu: {
        problemText: "<p>Az \\(ABCD\\) négyzet \\(CD\\) oldalán felvettünk egyenlő távolságra \\(k\\) darab osztópontot: \\(F_1\\), \\(F_2\\), \\(\\ldots\\) , \\(F_k\\), azaz \\(DF_1=F_1F_2=\\dots=F_kC\\). Az \\(AB\\) oldalon felvettük az \\(E\\) pontot úgy, hogy az \\(AE\\) és \\(DF_1\\) szakaszok egyenlő hosszúak. Mennyi fokban mérve az \\(AF_1E\\measuredangle+AF_2E\\measuredangle +\\dots+AF_kE\\measuredangle+ACE\\measuredangle\\) szögösszeg?</p>",
        help1: "Toljátok el a szögeket mind C-be!",
        help2: "A szögek összege így a BCA szög lesz.",
      },
    },
  },
  'gr7mc6xob1--haromszogben-oldal-felezopontja': {
    answer: 32,
    content: {
      hu: {
        problemText: "<p>Az \\(ABC\\) háromszögben \\(AB=25\\), \\(CA=39\\). A \\(BC\\) oldal felezőpontja legyen \\(F\\). \\(F\\)-en keresztül húzzunk párhuzamost az \\(A\\) csúcsbeli külső szögfelezővel, ez messe a \\(CA\\) oldalt \\(M\\)-ben. Mekkora az \\(AM\\) távolság?</p>",
        help1: "Húzzatok M-en keresztül AB-vel párhuzamos egyenest!",
        help2: "Használjátok a külső szögfelező tételt!",
      },
    },
  },
  'npqg2sc7tx--haromszog-csucsanal-levo': {
    answer: 80,
    content: {
      hu: {
        problemText: "<p>Az \\(ABC\\) háromszög \\(C\\) csúcsánál lévő szög 60&deg-os, és \\(BC^2=AC(AC+AB)\\). Mekkora a háromszög legnagyobb szöge fokban mérve?</p>",
        help1: "Keressetek egy alkalmas pontot, amelyet ha felvesztek, lesz egy egyenlő szárú háromszög.",
        help2: "Ez az alkalmas pont az AC egyenes A-n túli AB hosszúsággal való meghosszabbítása.",
      },
    },
  },
  'fc47rqashy--sorba-rakni-kek': {
    answer: 10,
    content: {
      hu: {
        problemText: "<p>Hányféleképpen lehet sorba rakni három kék, két zöld és egy piros korongot, hogy azonos színűek ne kerüljenek egymás mellé?</p>",
        help1: "Először helyezzük el a három kék korongot úgy, hogy maradjon köztük hely, ha a sorrendben oda kerülne zöld/piros korong.",
        help2: "Miután elhelyeztük a három kék korongot, a 2 köztük lévő helyre kell, hogy kerüljön korong, különben lenne két szomszédos kék színű korong a sorrendben.",
      },
    },
  },
  'lcd6cyqth6--este-aladar-hutojeben': {
    answer: 80,
    content: {
      hu: {
        problemText: "<p>Ha este Aladár hűtőjében lévő sörök száma 3-mal osztható, akkor megissza a \\(\\frac{2}{3}\\)-át, különben megelégszik eggyel. Ha kezdetben üres volt a hűtője, és legfeljebb 100 sört tud venni a pénzéből, akkor mennyit szerezzen be, hogy a legtovább kitartson?</p>",
        help1: "Gondolkozzatok hármas számrendszerben!",
        help2: "ha Aladár söreinek száma hármas számrendszerben 0-ra végződik, akkor letöröljük azt a végéről, különben pedig egyel csökkentjük.",
      },
    },
  },
  '1e53agv0mv--kiszinezni-tablazat-mezoit': {
    answer: 510,
    content: {
      hu: {
        problemText: "<p>Hányféleképpen lehet kiszínezni egy \\(8\\times8\\)-as táblázat mezőit pirosra és kékre, hogy bármely \\(2/times2\\)-es részben két piros és két kék mező legyen?</p>",
        help1: "Ha van két szomszédos, azonos színű mező, az meghatározza a mellettük lévő két mezőt, amelyekkel egy 2×2-es részt alkotnak.",
        help2: "Próbáljátok meg aszerint csoportosítani a megfelelő kitöltéseket az első oszlop kitöltése szerint.",
      },
    },
  },
  'uvlw3vo6ca--ter-bizonyos-koordinataju': {
    answer: 462,
    content: {
      hu: {
        problemText: "<p>A tér bizonyos egész koordinátájú rácspontjaira betűket helyeztünk. Az origóba D betűt, az origótól 1 távolságra lévő rácspontokra Ü-betűt, 2 távolságra R-betűt, 3 távolságra E-betűt, 4 távolságra pedig szintén R-betűt. Hányféleképpen tudunk az origóból indulva, attól mindig távolodva, a rácspontokon haladva pont a DÜRER kifejezés betűin végig haladni?<br><i>Itt egy \\((x,y,z)\\) koordinátájú pont origótól vett távolságán az \\(|x|+|y|+|z|\\) számot értjük.</i></p>",
        help1: "Úgy szeretnénk végighaladni, hogy a pontok távolsága az origótól sorra 0, 1, 2, 3, 4 legyen.",
        help2: "Az első lépés irányára szimmetrikus a feladat.",
      },
    },
  },
  '3eztrsp8nr--embert-osztottak-elvegzendo': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>Ha 8 embert osztottak be elvégzendő feladatokhoz úgy, hogy minden feladatot 3 embernek is kiadtak, de senki sem kapott 2-nél többet, akkor maximum hány elvégzendő feladat volt?</p>",
        help1: "Könnyű felső korlátot találni úgy, hogy az ember-feladata párokat megszámoljátok kétféleképpen.",
        help2: "Keressetek minél több feladatos konstrukciót!",
      },
    },
  },
  'ip929u2jlz--nehany-szam-osszege': {
    answer: 1458,
    content: {
      hu: {
        problemText: "<p>Néhány pozitív egész szám összege 20, mennyi lehet maximálisan a szorzatuk?</p>",
        help1: "Lehet 4-nél nagyobb szám a számok között?",
        help2: "Lehet több, mint 2 darab kettes?",
      },
    },
  },
  '22fg18xbcg--elso-szambol-valaszthatunk': {
    answer: 4,
    content: {
      hu: {
        problemText: "<p>Az első 5000 pozitív egész számból legfeljebb hányat választhatunk ki, ha tudjuk, hogy bármely kettőnek van 1-nél nagyobb közös osztója, de bármely háromnak nincs?</p>",
        help1: "Keressetek minél több számra konstrukciót!",
        help2: "Legalább hány darab prímszám kell ossza valamelyik számot?",
      },
    },
  },
  'lvqj3na522--nel-kisebb-tel': {
    answer: 16497,
    content: {
      hu: {
        problemText: "<p>Mennyi a 7000-nél kisebb, 7-tel osztható természetes számok számjegyeinek összege?</p>",
        help1: "Lehetséges-e, hogy az adott számok közül kettőnek megegyezik az utolsó 3 jegye?",
        help2: "143&sdot;7=1001.",
      },
    },
  },
  'o2j28sd23m--teruletu-szabalyos-hatszogbe': {
    answer: 671,
    content: {
      hu: {
        problemText: "<p>Egy 2013 területű szabályos hatszögbe behúztuk a 6 rövidebb átlót. Mennyi a középső hatszög területe?</p>",
        help1: "A terület az oldalak hosszúságával négyzetesen arányos.",
        help2: "Számoljatok szögeket!",
      },
    },
  },
  'btruohg8wb--egysegoldalu-szabalyos-haromszog': {
    answer: 1342,
    content: {
      hu: {
        problemText: "<p>Egy egységoldalú szabályos háromszög az egyik oldalán áll, de mi megdöntöttük és alátámasztottuk a levegőben lévő csúcsát egy függőlegesen álló pálcával úgy, hogy délben az árnyéka egy 120&deg-os egyenlő szárú háromszög volt. Legyen a pálca hossza \\(x\\). Mennyi \\(2013x^2\\) , ha délben a nap merőlegesen süt a földfelszínre?</p>",
        help1: "A 120&deg-os háromszög alapja a szabályos háromszög egy oldala, így egységhosszú.",
        help2: "<em>x</em>, a 120&deg-os háromszög szárai, és a 60&deg-os háromszög levegőben lévő oldalai derékszögű háromszögeket alkotnak.",
      },
    },
  },
  'iuntljn3kh--szampar-amire-oldalu': {
    answer: 104,
    content: {
      hu: {
        problemText: "<p>Hány olyan \\((n,k)\\) számpár van, amire az \\(n\\) és \\(k\\) oldalú szabályos sokszög belső szögének eltérése 1&deg?</p>",
        help1: "Egy szabályos <em>n</em>-szög belső szögei (180-360/<em>n</em>)&deg -osak.",
        help2: "360<sup>2</sup> osztóinak a száma 105.",
      },
    },
  },
  'u264lzg40b--eves-hollonal-eselye': {
    answer: 60,
    content: {
      hu: {
        problemText: "<p>Ha 75 éves hollónál 50% az esélye, hogy még legalább 10 évet, 20% az esélye, hogy még legalább 15 évet él, és 80 éves korában 24% az esélye, hogy még legalább 10 évet él, akkor hány % az esélye annak, hogy 80 éves korban még legalább 5 évet él?</p>",
        help1: "Az, hogy egy 80 éves holló még legalább 5 (vagy 10) évig él, pont azt jelenti, hogy ő 75-évesen még legalább 10 (vagy 15) évig él.",
        help2: "A 80 éves valószínűségek konstansszorosai a 75 éves valószínűségeknek.",
      },
    },
  },
  '0xm73zgh3z--haromszogben-oldal-harmadolopontjai': {
    answer: 25,
    content: {
      hu: {
        problemText: "<p>Az \\(ABC\\) háromszögben az \\(AB\\) oldal harmadolópontjai (\\(A\\)-tól \\(B\\)-ig) \\(C_1\\) és \\(C_2\\), az \\(AC\\) oldal negyedelőpontjai (\\(A\\)-tól \\(C\\)-ig) \\(B_1\\), \\(B_2\\) és \\(B_3\\). Legyen \\(O\\) a \\(C_2B_1\\) és \\(C_1B_3\\) szakaszok metszéspontja, \\(P\\) pedig az \\(AO\\) és \\(BC\\) szakaszok által meghatározott egyenesek metszéspontja. Számoljuk ki, hogy milyen arányban osztja \\(P\\) a \\(BC\\) oldalt, majd a törtet hozzuk a legegyszerűbb alakra. Mi a számláló és nevező összege?</p>",
        help1: "A merőleges affinitás nem változtatja meg az osztási arányokat.",
        help2: "Merőleges affinitás miatt feltehető, hogy az A csúcsnál derékszög van. Használjátok Euklideszi koordinátákat!",
      },
    },
  },
};
