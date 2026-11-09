import type { CompetitionBank, ProblemBank } from '../src/sources';

// Edition 11's final, relay only, as the relay practice site serves it: one
// competition per category, and the problems their relays use, each written
// once. Released, so the practice site may import it.

export const competitions: CompetitionBank = {
  '8tkx4uq3m1--11-final-a': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'ovvus5d19w--feladat', points: 3 },
        { problemId: 'pie500lctd--egyetlen-forintos-muzliszeletet', points: 3 },
        { problemId: 'hyijudzq6y--szinjatszo-szakkoron-gyerek', points: 3 },
        { problemId: 'a1l8z6qar3--farmon-teheneket-csirkeket', points: 3 },
        { problemId: 'iql76uzowh--labdat-tizedik-emeleti', points: 4 },
        { problemId: '46gng8npig--szam-amelynek-haromszorosa', points: 4 },
        { problemId: '2cqq5qsr0r--nagyapa-pont-annyi', points: 4 },
        { problemId: 'afoboir0ox--haromjegyu-szam-amelyben', points: 4 },
        { problemId: '1jwu1c5xfu--durer-verseny-egyik', points: 5 },
        { problemId: 'taphph5xdb--tibor-januar-occse', points: 5 },
        { problemId: '5a6rt6v8qg--nagymama-karacsonyra-tepsi', points: 5 },
        { problemId: 'q60ukj0t1s--bergengociaban-egyenes-orszagut', points: 5 },
        { problemId: 'd5yy99rvgt--fredi-kifutot-akar', points: 6 },
        { problemId: 'fc7mrfw6qa--lathato-negyzetracsban-tunder', points: 6 },
        { problemId: 'dnt5kzffta--reka-talalt-regi', points: 6 },
        { problemId: 'rv643do7mp--lathato-szultan-palotajanak', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 11, round: 'final', category: 'A' },
  },
  'vt8a13oavu--11-final-b': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'q0w39v5w8p--januar-szombat-esik', points: 3 },
        { problemId: '3w8x840zi7--harry-potter-suvegeben', points: 3 },
        { problemId: '46gng8npig--szam-amelynek-haromszorosa', points: 3 },
        { problemId: '1jwu1c5xfu--durer-verseny-egyik', points: 3 },
        { problemId: 'j7175knt6y--karacsonyt-megelozoen-hosszu', points: 4 },
        { problemId: 'tn1p8140y2--tibor-januar-occse', points: 4 },
        { problemId: 'jzs5x39ja5--lili-kata-belyeget', points: 4 },
        { problemId: '5a6rt6v8qg--nagymama-karacsonyra-tepsi', points: 4 },
        { problemId: 'q60ukj0t1s--bergengociaban-egyenes-orszagut', points: 5 },
        { problemId: 'd5yy99rvgt--fredi-kifutot-akar', points: 5 },
        { problemId: 'fviswlqfyr--lathato-negyzetracsban-tunder', points: 5 },
        { problemId: '26q4wjs6l9--reka-talalt-regi', points: 5 },
        { problemId: '2d4z1gp44f--dani-karacsonyfa-doboz', points: 6 },
        { problemId: 'j575kfh9by--hami-elhosszusagu-marcipan', points: 6 },
        { problemId: 'vr3juegnuy--lathato-szultan-palotajanak', points: 6 },
        { problemId: '89voh4k42a--egyenlo-szaru-haromszog', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 11, round: 'final', category: 'B' },
  },
  '1lw0brrs50--11-final-c': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'pe0upet68z--hanyfelekepp-irhato-ketjegyu', points: 3 },
        { problemId: 'nogog6cqm1--szabalyos-sokszog-korulirt', points: 3 },
        { problemId: 'g45s09x6fl--hangya-maszkalt-sakktabla', points: 3 },
        { problemId: '373gsm0ijq--karkotot-kesziteni-piros', points: 3 },
        { problemId: '5n1nk9pgu2--tablara-felirtuk-kisebb', points: 4 },
        { problemId: 'nv329aok7m--derekszogu-haromszogben-csucsnal', points: 4 },
        { problemId: 'yydbgouxxs--szorzat-utolso-szamjegye', points: 4 },
        { problemId: 'oymjz7tln0--legkisebb-primszam-felirhato', points: 4 },
        { problemId: 't3dniewttw--sakktabla-bal-also', points: 5 },
        { problemId: '127y0zxcz1--szamot-kettes-onvegzodonek', points: 5 },
        { problemId: 'f8aakd43q6--testver-eladta-birkanyajat', points: 5 },
        { problemId: '4pjrvl3z0q--varosban-eszak-deli', points: 5 },
        { problemId: 'c3pacse2k1--negyzetracson-kijelolt-kis', points: 6 },
        { problemId: 'l5hr7z6izm--negyjegyu-szam-amelyben', points: 6 },
        { problemId: 'xd4kc6b9ps--turazo-dontott-nap', points: 6 },
        { problemId: '2357glh9lp--haromszog-oldalan-pontok', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 11, round: 'final', category: 'C' },
  },
  'ggzlsmnq3h--11-final-c-plus': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: '6ru43lsn48--tablara-felirtuk-kisebb', points: 3 },
        { problemId: 'jcljcmu864--derekszogu-haromszogben-csucsnal', points: 3 },
        { problemId: 'jdainp6t8a--szorzat-utolso-szamjegye', points: 3 },
        { problemId: 'apaj8q3sti--legkisebb-primszam-felirhato', points: 3 },
        { problemId: 'bpont71ntf--sakktabla-bal-also', points: 4 },
        { problemId: '82btxrs2kv--szamot-kettes-onvegzodonek', points: 4 },
        { problemId: 'si8w9l3o8s--testver-eladta-birkanyajat', points: 4 },
        { problemId: '4pjrvl3z0q--varosban-eszak-deli', points: 4 },
        { problemId: 'l7zqjfi47a--negyzetracson-kijelolt-kis', points: 5 },
        { problemId: 'l5hr7z6izm--negyjegyu-szam-amelyben', points: 5 },
        { problemId: 'xd4kc6b9ps--turazo-dontott-nap', points: 5 },
        { problemId: 'fr6kgra62o--haromszog-oldalan-pontok', points: 5 },
        { problemId: 'ed57m4x6vh--gyerek-dobalt-labdat', points: 6 },
        { problemId: '39dj187r0g--darab-tol-szamozott', points: 6 },
        { problemId: '4w4bbnexjb--egyenlo-sugaru-korok', points: 6 },
        { problemId: '6qlufsuk4s--kartyabol-allo-pakli', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 11, round: 'final', category: 'C+' },
  },
  'ljsvt5yb4w--11-final-d': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'rtfozg4ljj--george-fibonacci-szamok', points: 3 },
        { problemId: '8n3ajwaieu--torpkertesz-epret-malnat', points: 3 },
        { problemId: 'oymjz7tln0--legkisebb-primszam-felirhato', points: 3 },
        { problemId: '127y0zxcz1--szamot-kettes-onvegzodonek', points: 3 },
        { problemId: 'yydbgouxxs--szorzat-utolso-szamjegye', points: 4 },
        { problemId: 'jn5lv1qb92--kis-haromszoge-feketere', points: 4 },
        { problemId: '5n1nk9pgu2--tablara-felirtuk-kisebb', points: 4 },
        { problemId: 'f8aakd43q6--testver-eladta-birkanyajat', points: 4 },
        { problemId: 'ceqt38jm5a--haromszog-oldalan-pontok', points: 5 },
        { problemId: 'xd4kc6b9ps--turazo-dontott-nap', points: 5 },
        { problemId: 'r9u60o8h2i--egyenlo-sugaru-korok', points: 5 },
        { problemId: 'xe5iuk5v6n--bergengocia-legnagyobb-varosa', points: 5 },
        { problemId: 'yr3rmtf6yd--gizaban-farao-legfobb', points: 6 },
        { problemId: 'bd7nadbfdl--szamra-legkisebb-primszam', points: 6 },
        { problemId: 'enzm4e8ki4--racspontbol-allo-haromdimenzios', points: 6 },
        { problemId: '31nn6x0je2--tabla-mezojere-vilagos', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 11, round: 'final', category: 'D' },
  },
  '29i0tzwfbo--11-final-d-plus': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'yydbgouxxs--szorzat-utolso-szamjegye', points: 3 },
        { problemId: '54ydab9n45--kis-haromszoge-feketere', points: 3 },
        { problemId: '5n1nk9pgu2--tablara-felirtuk-kisebb', points: 3 },
        { problemId: 'f8aakd43q6--testver-eladta-birkanyajat', points: 3 },
        { problemId: 'rkkslmp55p--haromszog-oldalan-pontok', points: 4 },
        { problemId: 'xd4kc6b9ps--turazo-dontott-nap', points: 4 },
        { problemId: 'a63kdq7e38--egyenlo-sugaru-korok', points: 4 },
        { problemId: 'xe5iuk5v6n--bergengocia-legnagyobb-varosa', points: 4 },
        { problemId: '69gukaa4ck--gizaban-farao-legfobb', points: 5 },
        { problemId: 'bd7nadbfdl--szamra-legkisebb-primszam', points: 5 },
        { problemId: 'enzm4e8ki4--racspontbol-allo-haromdimenzios', points: 5 },
        { problemId: 'kuhc89j2n5--tabla-mezojere-vilagos', points: 5 },
        { problemId: 'spfbhpwg4s--kartyabol-allo-pakli', points: 6 },
        { problemId: '6fe50it98l--haromszog-oldalai-hosszuak', points: 6 },
        { problemId: 'le01u09qow--harmadfoku-polinom-egyutthatoja', points: 6 },
        { problemId: 'utn480ep9r--haromszog-melynek-szogei', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 11, round: 'final', category: 'D+' },
  },
};

export const problems: ProblemBank = {
  'ovvus5d19w--feladat': {
    answer: 20,
    content: {
      hu: {
        problemText: "<p>\\(((2+0+1+8)-(0+1)-(0+5))\\cdot((2+0+1+8)-(0+1)-(0+6))=?\\)</p>",
        help1: "Először a belső zárójeleken belül számoljunk, majd a külső zárójeleken belül, végül végezzük el a szorzást",
        help2: "Számoljuk ki újra, figyelmesebben!",
      },
    },
  },
  'pie500lctd--egyetlen-forintos-muzliszeletet': {
    answer: 185,
    content: {
      hu: {
        problemText: "<p>Egyetlen 90 forintos müzliszeletet vettem a boltban. Egy százassal fizettem érte, de a boltos tévedésből egy ötvenest adott vissza a tízes helyett. Mennyi pénzzel mentem be a boltba, ha 135 forinttal jöttem ki?</p>",
        help1: "100 forintot fizettem, és 50 forintot kaptam vissza. Mit jelent ez? Számít egyáltalán, hogy mennyibe kerül a müzli?",
        help2: "Most 50 forinttal van kevesebbem, mint eredetileg volt.",
      },
    },
  },
  'hyijudzq6y--szinjatszo-szakkoron-gyerek': {
    answer: 12,
    content: {
      hu: {
        problemText: "<p>Egy színjátszó szakkörön 5 gyerek (Anna, Béla, Cili, Dávid, Emese) szeretné kipróbálni, hogy ki mennyire ügyes színész. Ezért elhatározták, hogy a következő darabjukat, amelyben épp 5 szerep van (a szegény leány, a mostohaanyja, a királyfi, az öreg király és az öreg királyné), minden lehetséges szereposztásban pontosan egyszer fogják előadni. Hány előadást fognak tartani, ha abban megegyeznek, hogy a fiú szerepeket csak fiúk, a lány szerepeket pedig csak lányok fogják alakítani?</p>",
        help1: "A fiúk egymás között hányféleképpen oszthatják ki a szerepeiket? A lányok egymás között hányféleképpen oszthatják ki a szerepeiket?",
        help2: "Minden egyes fiúszereposztáshoz választhatunk egy tetszőleges lányszereposztás, tehát az eredmény a két előbb kiszámolt érték szorzata.",
      },
    },
  },
  'a1l8z6qar3--farmon-teheneket-csirkeket': {
    answer: 23,
    content: {
      hu: {
        problemText: "<p>Egy farmon teheneket és csirkéket tartunk. Az állatoknak összesen 244 lábuk és 152 szárnyuk van. Hány tehenünk van?</p>",
        help1: "Egy csirkének ugyanannyi lába van, mint szárnya. Hány tehénláb van a farmon?",
        help2: "152 csirkeszárnyhoz 152 csirkeláb tartozik. 92 tehénláb van tehát. Ennek negyede a tehenek száma",
      },
    },
  },
  'iql76uzowh--labdat-tizedik-emeleti': {
    answer: 375,
    content: {
      hu: {
        problemText: "<p>Egy labdát a tizedik emeleti ablakból, 30 m magasról leejtünk a földre. A labda minden földet érés után előző magasságának feléig pattan vissza. Hány cm magasra pattan vissza a harmadik földet érés után?</p>",
        help1: "Ha elsőre a magasság feléig pattan fel, másodszorra a szabály miatt az eredeti negyedéig, harmadszorra a nyolcadáig pattan vissza",
        help2: "3000 cm nyolcadát keressük.",
      },
    },
  },
  '46gng8npig--szam-amelynek-haromszorosa': {
    answer: 84,
    content: {
      hu: {
        problemText: "<p>Hány olyan pozitív egész szám van, amelynek a háromszorosa háromjegyű, míg a négyszerese négyjegyű?</p>",
        help1: "250 négyszerese 1000, nála kisebb jó szám biztos nincsen. 333 háromszorosa 999, nála nagyobb jó szám biztos nincs. Ezek között megfelelő az összes szám?",
        help2: "Igen, jó az összes szám. Ne feledkezzünk meg arról, hogy 250-et, és 333-at is be kell számítanunk, úgyhogy nem szimplan a különbségük a megoldás",
      },
    },
  },
  '2cqq5qsr0r--nagyapa-pont-annyi': {
    answer: 8,
    content: {
      hu: {
        problemText: "<p>Nagyapa pont annyi éves, mint az unokái összesen. Minden unokája legalább 5 éves és a koraik években mérve különböző egész számok. Legfeljebb hány unokája lehet Nagyapának, ha ő 70 éves?</p>",
        help1: "A legfiatalabb unoka legalább 5 éves. a második legfiatalabb legalább 6 éves... legalább mennyi az összkora 9 unokának?",
        help2: "Kilenc unoka legalább 81 éves, és ez abba az esetben történhet meg, ha a 5-től 13-ig minden kor szerepel közöttük. EL tudunk hagyni egyet úgy, hogy 70 legyen a maradék összege?",
      },
    },
  },
  'afoboir0ox--haromjegyu-szam-amelyben': {
    answer: 32,
    content: {
      hu: {
        problemText: "<p>Hány olyan háromjegyű szám van, amelyben a két szélső számjegy szorzata a középső számjegy?</p>",
        help1: "Válasszuk szét az eseteket asszerint, hogy mi a középső szám! így könnyű leszámolni",
        help2: "prímszám középső jegyre 2 megoldás van, négyzetszámra 3, a többi számra 4 (kivéve 1-et és 0-t. ott menni lehetőség van?)",
      },
    },
  },
  '1jwu1c5xfu--durer-verseny-egyik': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>A Dürer verseny egyik szervezői megbeszélésén a következő beszélgetés hangzott el. </p><p>  <table border=\"0\"><table><tr><td width=\"50%\"><ul style=\"list-style-type:none;\"><li>Zsófi: A Dürer a legjobb verseny a világon.<li>Bálint: Zsófi téved.<li>Gábor: Zsófi téved<li>Kartal: Bálint téved.<li>Dani: Gábor téved.</ul></td><td width=\"50%\"><ul style=\"list-style-type:none;\"><li>Benedek: Gábor téved.<li>Magdi: Bálint téved.<li>Juli: Kartal téved.<li>Bea: Benedek téved.<li>Petya: Dani téved.</ul></td></tr></table></p><p>Hányan tévedtek?</p>",
        help1: "Számoljuk meg, hogy hányan tévednek, ha Dürer a legjobb verseny a világon! Számoljuk meg, hogy hányan tévednek, ha nem a Dürer a legjobb verseny a világon!",
        help2: "A két érték megegyezik és mindenki éppen az egyik esetben téved.",
      },
    },
  },
  'taphph5xdb--tibor-januar-occse': {
    answer: 4,
    content: {
      hu: {
        problemText: "<p>Tibor január 6-án, míg öccse, Zalán, pár évvel később, január 5-én született. Szüleik Tibor születésekor vettek egy 24 darabos gyertyakészletet, melyből mindig annyi darabot tesznek fel Tibor, illetve Zalán tortájára, ahány éves az adott fiú. (A használt gyertyákat az ünnepség után kidobják.) Most éppen annyi gyertya maradt még a készletből, hogy Tibor mai születésnapjára elég legyen. Hányadik születésnapját ünnepelte Tibor, mikor Zalán egynapos volt?</p>",
        help1: "Tibor születésnapjaira és Zalán születésnapjaira olyan számú gyertya fogyott el, ami előáll, mint a néhány első természetes szám összege. Melyek ezek a számok?",
        help2: "Ezek az 1,3,6,10,15,21 számok. Ezek közül egy olyan páros van, ami előállítja a 24-et összegként, a 21 és a 3. Ebből kell kikövetkeztetni, hogy hányadik születésnapját ünnepli TIbor és hanyadikat Zalán, majd venni a különbségüket.",
      },
    },
  },
  '5a6rt6v8qg--nagymama-karacsonyra-tepsi': {
    answer: 1037,
    content: {
      hu: {
        problemText: "<p>Nagymama karácsonyra 6 tepsi mazsolás kalácsot sütött, majd a tepsiket kirakta az asztalra hűlni. Minden tepsin 6 kis kalács volt, minden kalácsot 6 szeletre vágott és minden szeletbe 6 szem mazsola jutott. A fia elvitt egy tepsinyi kalácsot, a lánya a maradékból egy kalácsot, a veje egy szelet kalácsot és a kisunokája a maradék szeletek egyikéből egy szem mazsolát. Hány mazsola maradt az asztalon összesen?</p>",
        help1: "Hány darab mazsola volt összesen? az egyes emberek mennyi mazsolát vettek el?",
        help2: "osszesen 6*6*6*6 mazsola vot, az emberek rendre 6*6*6, 6*6, 6, 1 mazsolát vettek el. Végezzük el a kivonást!",
      },
    },
  },
  'q60ukj0t1s--bergengociaban-egyenes-orszagut': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>Bergengóciában egy egyenes országút mentén 8 fogadó helyezkedik el az alábbi sorrendben: A, B, C, D, E, F, G, H.</p><p>Tudjuk, hogy A és D távolsága 28 km, B és E távolsága 27 km, C és F távolsága 25 km, D és G távolsága 22 km, E és H távolsága 24 km, A és F távolsága 43 km, C és H távolsága 38 km. Hány km távolságra található egymástól A és B?</p>",
        help1: "könnyű kifejezni AB és DE szakaszok hosszkülönbségét az első 2 adatból. ennek mintájára BC;EF , CD;FG , DE;GH szakaszok különbségei is könnyen meghatározhatók. DF és FH szakaszok hossza pedig adódik az utolsó két egyenletből.",
        help2: "Ha az előző segítségből minden megvan, egyszerűen adódik EF távolság, FG távolság, (a DH távolság, majd ebből a ) GH távolság, ezekből az első egyenleteinkből könnyen kijön minden szomszédos fogadó távolsága, így AB is.",
      },
    },
  },
  'd5yy99rvgt--fredi-kifutot-akar': {
    answer: 9,
    content: {
      hu: {
        problemText: "<p>Frédi új kifutót akar készíteni Dínónak. Egy olyan téglalap alakú területet szeretne elkeríteni, melynek minden oldala méterben mérve egész szám. Az építkezéshez 24 méternyi kerítés áll rendelkezésre, de ezt nem feltétlenül használja fel mind. Hányféleképpen nézhet ki Dínó kifutója, ha tudjuk, hogy a kifutó területe 22 m<sup>2</sup> -nél nagyobb?<br><i>A téglalapok szélességét és hosszúságát nem különböztetjük meg, vagyis például az \\(1\\times2\\)-es és a \\(2\\times1\\)-es téglalapok ugyanúgy néznek ki.</i></p>",
        help1: "Nézzük végig az egyes eseteket a terület szerint. A területnek nem lehet 11-nél nagyobb prímosztója.",
        help2: "37 vagy nagyobb területű téglalapot nem tudunk körbekeríteni.",
      },
    },
  },
  'fc7mrfw6qa--lathato-negyzetracsban-tunder': {
    answer: 3,
    content: {
      hu: {
        problemText: "<p>Az ábrán látható négyzetrácsban egy tündér néhány kincset rejtett el. Egyes üres mezőkre ráírta, hogy a velük éllel vagy csúccsal szomszédos (legfeljebb) 8 mezőben összesen hány kincs található. Hány kincset rejtett el a tündér balról a 7. oszlopban?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_D_A_14.png",
        help1: "Kezdjétek el bejelölgetni, hogy hol van biztosan kincs, és hol nincs biztosan kincs. Jó kiindulások az alsó 3-as szomszédai, illetve a balszélső sor felső kettesének szomszédai. Ha ez az elindulás megvan, egy ponton ívül egyértelmű, hogyan kell előrehaladnunk a kitöltéssel.",
        help2: "Ha egy onton elakadtok ez a gondolat kell még nektek: A középső oszlop felülről második mezőjében van kincs (gondoljátok meg, mi lenne, ha nem lenne!)",
      },
    },
  },
  'dnt5kzffta--reka-talalt-regi': {
    answer: 730,
    content: {
      hu: {
        problemText: "<p>Réka talált két régi órát, felhúzta őket és mindkettőn beállította a pontos időt. Másnapra megfigyelte, hogy az egyik óránként 6 percet késik, a másik viszont óránként 4 percet siet. Egyik reggel Réka iskolába induláskor mindkét órát beállította, hogy a pontos időt mutassák. Mikor hazaért, az egyik 13 óra 21 percet, a másik 14 óra 26 percet mutatott. Mikor indult el otthonról Réka?<br><i>A válasz az órák százszorosának és a perceknek az összege. Például ha a megoldás 15:28, akkor válaszként 1528-at írjatok.</i></p>",
        help1: "Egy óra alatt 10 percet csúszik szét a két óra különbsége. Ha 65 percet távolodtak el egymástól, akkor 6 és fél órája indult el otthonról. Mennyi a pontos idő?",
        help2: "6,5 óra alatt a siető óra 26 percet száguldott előre. Mennyi a valódi idő?",
      },
    },
  },
  'rv643do7mp--lathato-szultan-palotajanak': {
    answer: 96,
    content: {
      hu: {
        problemText: "<p>Az ábrán látható a szultán palotájának alaprajza. A testőr azt a feladatot kapja, hogy éjfélkor járjon körbe a palotában úgy, hogy minden ajtón pontosan egyszer menjen át és az X jelű teremből induljon, illetve oda érkezzen vissza. Hányféleképpen tud körbejárni, ha csak az számít, hogy milyen sorrendben megy át az ajtókon?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_D_A_16.png",
        help1: "A bal és jobb oldali termekben egyértelmű, hogy milyen sorrendben megyünk végig, ők csak egy-egy bonyolultabb ösvény az x-es szoba fölötti szobába. A jobb felső sarokszoba pedig csak egy hurok az X fölötti szobához. Tehát a bejárás ,,térképe,, 3 csúcsból áll, ahol az első 2 csúcs között 4 ösvény megy, a 2. és 3. között 2.",
        help2: "Az 1 és a 2 között 4*3*2 féleképpen tudunk ingázni, és 2 helyre szúrhatjuk be a sarokszobába menő hurkot, azt kétféle menetirányban ejthetjük meg.",
      },
    },
  },
  'q0w39v5w8p--januar-szombat-esik': {
    answer: 2,
    content: {
      hu: {
        problemText: "<p>Ma január 6-a, szombat van. Összesen hány 6-a esik szombatra idén [értsd: 2018-ban]? (Az egyes hónapok sorban 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 naposak idén.)</p>",
        help1: "Számoljuk azt, hogy 6-a mennyi nappal van eltolódva januárhoz képest (ezt a hónapok hetes maradékával lehet jól mérni). Tehát így néz ki a sorozatunk januártól:0,3,3,6...",
        help2: "A sorozatot úgy képezzük, hogy az előző taghoz hozzáadjuk a következő hónap napszámának hetes maradékát, majd maradékosan osztunk 7-tel. A szombatok a nulláknak felelnek meg.",
      },
    },
  },
  '3w8x840zi7--harry-potter-suvegeben': {
    answer: 23,
    content: {
      hu: {
        problemText: "<p>Harry Potter süvegében 14 szürke, 8 fehér és 6 fekete egér van. A következő Sötét varázslatok kivédése órához szüksége lesz mindhárom színű egérből egyre-egyre. Mivel Piton professzor bekötötte a szemét, ezért Harry nem látja, hogy milyen színű egeret vesz ki. Hány egeret kell elővennie, hogy biztosan legyen köztük mindhárom színű?</p>",
        help1: "Ha Harry nagyon peches, 14 húzás után lehet, hogy még mindig csak egyszínű egere van. 15.-re viszont már biztosan lesz két  különböző színű egere. Hogy módosítsuk ezt 3-ra?",
        help2: "Ha a két legnépesebb csoport számánál nem többet húzunk, akkor előfordulhat, hogy ebből a két csoportból húztunk csak.",
      },
    },
  },
  'j7175knt6y--karacsonyt-megelozoen-hosszu': {
    answer: 20,
    content: {
      hu: {
        problemText: "<p>Karácsonyt megelőzően hosszú sorok álltak a boltokban. A várakozás alatt Kálmán megfigyelte, hogy előtte áll a vásárlók \\(\\frac15\\)-e, mögötte pedig a \\(\\frac34\\)-e. Hányan voltak ekkor ebben a sorban?</p>",
        help1: "Kálmán csak saját magát nem számolta be ennél a számolásnál. próbáljunk felírni egy egyenletet az emberek számára.",
        help2: "Ha n ember áll a sorban, akkor (1/5)*n+(3/4)*n+1=n",
      },
    },
  },
  'tn1p8140y2--tibor-januar-occse': {
    answer: 4,
    content: {
      hu: {
        problemText: "<p>Tibor január 6-án, míg öccse, Zalán, pár évvel később, január 5-én született. Szüleik Tibor születésekor vettek egy 24 darabos gyertyakészletet, melyből mindig annyi darabot tesznek fel Tibor, illetve Zalán tortájára, ahány éves az adott fiú. (A használt gyertyákat az ünnepség után kidobják.) Most éppen annyi gyertya maradt meg a készletből, hogy Tibor mai születésnapjára elég legyen. Hányadik születésnapját ünnepelte Tibor, mikor Zalán egynapos volt?</p>",
        help1: "Tibor születésnapjaira és Zalán születésnapjaira olyan számú gyertya fogyott el, ami előáll, mint a néhány első természetes szám összege. Melyek ezek a számok?",
        help2: "Ezek az 1,3,6,10,15,21 számok. Ezek közül egy olyan páros van, ami előállítja a 24-et összegként, a 21 és a 3. Ebből kell kikövetkeztetni, hogy hányadik születésnapját ünnepli TIbor és hanyadikat Zalán, majd venni a különbségüket.",
      },
    },
  },
  'jzs5x39ja5--lili-kata-belyeget': {
    answer: 140,
    content: {
      hu: {
        problemText: "<p>Lili és Kata bélyeget gyűjtenek. Lilinek kezdetben másfélszer annyi bélyege volt, mint Katának. Egy év alatt Lili 20, Kata 100 új bélyeget gyűjtött, így már Katának van másfélszer annyi bélyege, mint Lilinek. Hány bélyege volt kezdetben a két lánynak együtt?</p>",
        help1: "Kezdetben Katának n bélyege volt. Hány bélyege volt Lilinek? Hogyan fejezzük ki az egy évvel későbbi bélyegszámokat ezekből?",
        help2: "Felírható az 1,5(1,5n+20)=n+100 egyenlet. Ebből kiszámolható n+1,5n.",
      },
    },
  },
  'fviswlqfyr--lathato-negyzetracsban-tunder': {
    answer: 3,
    content: {
      hu: {
        problemText: "<p>Az ábrán látható négyzetrácsban egy tündér néhány kincset rejtett el. Egyes üres mezőkre ráírta, hogy a velük éllel vagy csúccsal szomszédos (legfeljebb) 8 mezőben összesen hány kincs található. Hány kincset rejtett el a tündér balról a 7. oszlopban?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_D_B_11.png",
        help1: "Kezdjétek el bejelölgetni, hogy hol van biztosan kincs, és hol nincs biztosan kincs. Jó kiindulások az alsó 3-as szomszédai, illetve a balszélső sor felső kettesének szomszédai. Ha ez az elindulás megvan, egy ponton ívül egyértelmű, hogyan kell előrehaladnunk a kitöltéssel.",
        help2: "Ha egy onton elakadtok ez a gondolat kell még nektek: A középső oszlop felülről második mezőjében van kincs (gondoljátok meg, mi lenne, ha nem lenne!)",
      },
    },
  },
  '26q4wjs6l9--reka-talalt-regi': {
    answer: 730,
    content: {
      hu: {
        problemText: "<p>Réka talált két régi órát, felhúzta őket és mindkettőn beállította a pontos időt. Másnapra megfigyelte, hogy az egyik óránként 6 percet késik, a másik viszont óránként 4 percet siet. Egyik reggel Réka iskolába induláskor mindkét órát beállította, hogy a pontos időt mutassák. Mikor hazaért, az egyik 13 óra 21 percet, a másik 14 óra 26 percet mutatott. Mikor indult el otthonról Réka?<br><i>(A válasz az órák százszorosának és a perceknek az összege. Például ha a megoldás 15:28, akkor válaszként 1528-at írjatok.)</i></p>",
        help1: "Egy óra alatt 10 percet csúszik szét a két óra különbsége. Ha 65 percet távolodtak el egymástól, akkor 6 és fél órája indult el otthonról. Mennyi a pontos idő?",
        help2: "6,5 óra alatt a siető óra 26 percet száguldott előre. Mennyi a valódi idő?",
      },
    },
  },
  '2d4z1gp44f--dani-karacsonyfa-doboz': {
    answer: 16,
    content: {
      hu: {
        problemText: "<p>Dani a karácsonyfa alatt 6 doboz ajándékot talált, amelyek az ábrán látható módon voltak egymásra pakolva. Mindig csak olyan dobozt vehet el, amelyen nincs másik. Hányféle sorrendben veheti el a 6 dobozt?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_D_B_13.png",
        help1: "Ha úgy szedjük el az ajándékokat, hogy mindig a legfelső sort ürítjük le először, könnyen számolható, hogy mennyi lehetőség volt. Hogyan történhetett az, hogy nem így vettük el a csomagokat?",
        help2: "Lényegében egyféleképpen (tükrözés miatt 2-féleképpen). ilyen esetben mara egy kicsi piramis, amit már tudjuk, hányféleképpen szedhetünk le.",
      },
    },
  },
  'j575kfh9by--hami-elhosszusagu-marcipan': {
    answer: 26,
    content: {
      hu: {
        problemText: "<p>Hami egy 10 cm élhosszúságú marcipán kockából készít desszertet. A kocka minden sarkát egy egyenes vágással levágja úgy, hogy a leeső kis részek egyformák. Egy ilyen kis darabkának a kocka eredeti csúcsából kiinduló élei épp 5 cm hosszúak. Hány lapja és csúcsa lesz összesen a megmaradó alakzatnak?</p>",
        help1: "A kocka eredeti lapja, és minden eredeti csúcs ad egy-egy lapot",
        help2: "A kockat élfelező pontjai lesznek az új csúcsok, ezek számát ismerjük.",
      },
    },
  },
  'vr3juegnuy--lathato-szultan-palotajanak': {
    answer: 64,
    content: {
      hu: {
        problemText: "<p>Az ábrán látható a szultán palotájának alaprajza. A testőr azt a feladatot kapja, hogy éjfélkor járjon körbe a palotában úgy, hogy minden ajtón pontosan egyszer menjen át és az X jelű teremből induljon, illetve oda érkezzen vissza. Hányféleképpen tud körbejárni, ha csak az számít, hogy milyen sorrendben megy át az ajtókon?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_D_B_15.png",
        help1: "Vegyük észre, hogy a felső szobák csak egy egyszerű ösvényt határoznak meg, tehát a térképünk egyszerűsíthető 3 szobára, mindegyik között 2-2 ösvénnyel. Ezzel a térképpel játszva kapjuk a megoldást",
        help2: "a szimmetria miatt kijelölhetünk egy élet, amin elindulunk, a vele kezdődő utak 4-szerese a megoldás. Itt tartsunk esetszétválasztást asszerint, hogy a másik élen visszamegyünk-e (innen már egy egyszerű esetbe jutunk), vagy át a harmadik szobába (ahol még egy ugyanilyen esetszétválasztást kell kiviteleznünk).",
      },
    },
  },
  '89voh4k42a--egyenlo-szaru-haromszog': {
    answer: 54,
    content: {
      hu: {
        problemText: "<p>\\(ABC\\) egy olyan egyenlő szárú háromszög, amelyben \\(AC=BC\\). Legyen \\(D\\) az \\(AC\\) oldal felezőpontja. Vegyük fel \\(E\\)-t a \\(BC\\) oldalon úgy, hogy \\(AB=CE\\). Tudjuk, hogy \\(CBA\\angle=AEB\\angle\\). Hány fokos az \\(AED\\angle\\)?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_D_B_16.png",
        help1: "A feltételek miatt AE is ugyanolyan hosszú, mint AB. Vizsgáljuk a kapott egyenlő szárú háromszögeket.",
        help2: "Az egyenlő szárú háromszögekből kijön majdnem minden szög. Vegyük észre, hogy ADE háromszögben D-nél derékszög van.",
      },
    },
  },
  'pe0upet68z--hanyfelekepp-irhato-ketjegyu': {
    answer: 80,
    content: {
      hu: {
        problemText: "<p>Hányféleképp írható fel a 99 két kétjegyű szám összegeként, ha a kétjegyű számokat egymás után írva kapott négyjegyű szám is osztható 99-cel?<br><i>Két felírást akkor is különbözőnek tekintünk, ha az összeadandó számpárok sorrendje különbözik, vagyis például 8-nak 3+5-ként és 5+3-ként történő felírása különbözőnek számít.</i></p>",
        help1: "Egy szám akkor osztható 99-cel, ha osztható 9-cel és 11-gyel is.",
        help2: "Mely így képzett négyjegyű számok nem oszthatóak 99-cel?",
      },
    },
  },
  'nogog6cqm1--szabalyos-sokszog-korulirt': {
    answer: 6,
    content: {
      hu: {
        problemText: "<p>Egy szabályos sokszög körülírt körének középpontját tükröztük a sokszög összes oldalára. Az így kapott pontokból álló sokszög területe éppen háromszorosa az eredeti sokszögének. Hány oldalú az eredeti sokszög?</p>",
        help1: "Készítsetek ábrát!",
        help2: "Próbáljátok meg kevés oldalú sokszögekre.",
      },
    },
  },
  'g45s09x6fl--hangya-maszkalt-sakktabla': {
    answer: 16,
    content: {
      hu: {
        problemText: "<p>Egy hangya mászkált egy \\(4\\times8\\)-as sakktábla élein. Hány élhossznyit kellett legalább másznia az egyik sarokból az átellenesbe, ha az útja során balra nézve mindig fekete mezőt látott?</p>",
        help1: "A hangya fekete sarokból indul.",
        help2: "Lehet-e kétszer ugyanabba az irányba lépni?",
      },
    },
  },
  '373gsm0ijq--karkotot-kesziteni-piros': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>Karkötőt szeretnénk készíteni két piros, két kék és két zöld gyöngy felfűzésével. A tervezés során egy szabályos hatszög csúcsaiba rakjuk le a gyöngyöket. Hányféle karkötő készíthető, ha a hatszög forgatásával vagy tengelyes tükrözésével egymásba vihető karkötőket nem tudjuk egymástól megkülönböztetni?</p>",
        help1: "Milyen helyzetben állhatnak a piros gyöngyök?",
        help2: "A piros gyöngyök távolsága lehet 0, 1 vagy 2.",
      },
    },
  },
  '5n1nk9pgu2--tablara-felirtuk-kisebb': {
    answer: 10,
    content: {
      hu: {
        problemText: "<p>Egy táblára felírtuk a 2018-at és egy kisebb pozitív számot. Egy lépésben, ha a két táblán levő szám átlaga egész, letörölhetjük az egyiket, és felírhatjuk helyette az átlagot. Legfeljebb hány ilyen lépést végezhetünk el?</p>",
        help1: "Mikor egész két szám átlaga?",
        help2: "A 2018 letörlésekor a játék biztosan véget ér.",
      },
    },
  },
  'nv329aok7m--derekszogu-haromszogben-csucsnal': {
    answer: 234,
    content: {
      hu: {
        problemText: "<p>\\(ABC\\) derékszögű háromszögben \\(C\\) csúcsnál van derékszög. \\(D\\) az \\(AB\\) felezőpontja, a \\(D\\)-ben \\(AB\\)-re állított merőleges \\(CB\\)-t \\(E\\)-ben metszi. Ha \\(AB\\) hossza 40 és \\(AC\\) hossza 24, akkor mekkora az \\(ADEC\\) négyszög területe?</p>",
        help1: "Húzzuk be a C csúcshoz tartozó magasságot, a talppont legyen T!",
        help2: "A BCT és BDE háromszögek hasonlóak.",
      },
    },
  },
  'yydbgouxxs--szorzat-utolso-szamjegye': {
    answer: 6,
    content: {
      hu: {
        problemText: "<p>Mi a \\(2018\\cdot2017\\cdot2016\\cdot\\cdots\\cdot2001\\cdot2000\\) szorzat utolsó nem 0 számjegye?</p>",
        help1: "Hány 0-ra végződik a szorzat?",
        help2: "Osszuk el a szorzatot 1000000-val és nézzük meg az utolsó számjegyét!",
      },
    },
  },
  'oymjz7tln0--legkisebb-primszam-felirhato': {
    answer: 43,
    content: {
      hu: {
        problemText: "<p>Melyik az a legkisebb pozitív prímszám, amely felírható 2, 3, 4, illetve 5 különböző pozitív prímszám összegeként is?</p>",
        help1: "A különböző prímszámok között legfeljebb 1 páros lehet.",
        help2: "5 különböző prímszám összegeként mi a legkisebb előálló prímszám?",
      },
    },
  },
  't3dniewttw--sakktabla-bal-also': {
    answer: 24,
    content: {
      hu: {
        problemText: "<p>Egy sakktábla bal alsó \\(3\\times3\\)-as résztáblájának minden mezőjére egy-egy korongot helyeztünk. Bármely koronggal átugorhatunk vele élben vagy csúcsban szomszédos mezőn álló korongot, ha az érkezési mező üres. Egy másik megengedett lépés, hogy egy korongot feljebb tolhatunk egy mezővel, ha az a mező üres. Szeretnénk eljuttatni a 9 korongot a bal felső \\(3\\times3\\)-as résztábla mezőire úgy, hogy minden mezőn egy korong álljon. Legalább hány lépés kell ehhez?</p>",
        help1: "Összesen hány mezővel kell feljebb jutniuk a korongoknak?",
        help2: "Legalább 3 feltolás szükséges.",
      },
    },
  },
  '127y0zxcz1--szamot-kettes-onvegzodonek': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>Egy pozitív egész számot „kettes önvégződőnek” nevezünk, ha a szám 2-es számrendszerbeli alakjának utolsó néhány számjegye éppen a szám 10-es számrendszerbeli alakja. Hány 2018-nál kisebb kettes önvégződő szám van?</p>",
        help1: "Milyen számjegyekből állhat egy kettes önvégződő szám?",
        help2: "Mely 0 és 1 számjegyeket tartalmazó számok kettes önvégződőek?",
      },
    },
  },
  'f8aakd43q6--testver-eladta-birkanyajat': {
    answer: 2,
    content: {
      hu: {
        problemText: "<p>Két testvér eladta a birkanyáját. Minden birkát annyi tallérért adtak el, ahány birka a nyájban eredetileg volt. A bevételen 10 talléronként osztozkodtak. Először az idősebb testvér kapott 10 tallért, azután a fiatalabb, majd újra az idősebb és így tovább. Utoljára a fiatalabbnak már csak 10-nél kevesebb tallér jutott, ezért az idősebb nekiadta a bicskáját, ezzel összességében mindkét testvér vagyona ugyanannyival változott. Hány tallért ért a bicska?</p>",
        help1: "Hány tallért kaptak összesen a birkákért, ha a birkák száma n?",
        help2: "Hány tallért kaphatott utoljára a fiatalabb, ha tudjuk, hogy összesen a bevételük négyzetszám?",
      },
    },
  },
  '4pjrvl3z0q--varosban-eszak-deli': {
    answer: 494,
    content: {
      hu: {
        problemText: "<p>Egy városban észak-déli irányú sugárutak és kelet-nyugati irányú utcák vannak, 1-től 10-ig számozva. Ha áthaladunk az \\(i\\)-edik sugárút és a \\(j\\)-edik utca kereszteződésén, \\(i\\cdot j\\) dollárt kell fizetnünk. Legkevesebb hány dollárért juthatunk el a az első sugárút és az első utca kereszteződéséből a 10-edik utca és a 10-edik sugárút kereszteződésébe? (az első és az utolsó kereszteződésnél nem kell fizetni) </p>",
        help1: "Hogyan tud a legolcsóbban 1-gyel nagyobb sorszámú sugárútra és utcára jutni?",
        help2: "Csak 1-szer kell fordulni útközben.",
      },
    },
  },
  'c3pacse2k1--negyzetracson-kijelolt-kis': {
    answer: 398,
    content: {
      hu: {
        problemText: "<p>Egy négyzetrácson kijelölt \\(20\\times18\\) kis négyzetből álló rácstéglalapban mekkora a legnagyobb kerületű önmagát nem metsző rácssokszög kerülete, ha a sokszög minden oldala a négyzetrács éleire illeszkedik? <i>Az ábrán egy \\(4\\times3\\)-as rácstéglalapba rajzolt 14 kerületű rácssokszög látható. </i></p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_D_C_13.png",
        help1: "Hány rácspont van?",
        help2: "Színezzük sakktáblaszerűen a rácspontokat!",
      },
    },
  },
  'l5hr7z6izm--negyjegyu-szam-amelyben': {
    answer: 4640,
    content: {
      hu: {
        problemText: "<p>Hány olyan négyjegyű pozitív egész szám van, amelyben a prím számjegyek száma prímszám?</p>",
        help1: "Hány prím számjegye lehet a számnak?",
        help2: "Milyen sorrendben állhatnak a prím és nem prím számjegyek?",
      },
    },
  },
  'xd4kc6b9ps--turazo-dontott-nap': {
    answer: 36,
    content: {
      hu: {
        problemText: "<p>Egy túrázó úgy döntött, hogy \\(n\\) \\((n\\geq 2)\\) nap alatt \\(m\\) (pozitív egész) km-t fog megtenni. Első nap 1 km-t és a megmaradó távolság hetedrészét tette meg, a másodikon 2 km-t és a még fennmaradó távolság hetedrészét, és így tovább. Végül az \\(n\\)-edik, azaz utolsó napon a még visszamaradt, pontosan \\(n\\) km-t gyalogolta le. Hány km-es volt a túra?</p>",
        help1: "Gondolkodjunk visszafelé!",
        help2: "Fejezzük ki m-et n segítségével!",
      },
    },
  },
  '2357glh9lp--haromszog-oldalan-pontok': {
    answer: 524,
    content: {
      hu: {
        problemText: "<p>Az \\(ABC\\) háromszög \\(BC\\) oldalán \\(D\\) és \\(E\\) pontok úgy helyezkednek el, hogy \\(BD:DE:EC=1:2:3\\). Az \\(F\\) pont a háromszög \\(AC\\) oldalát \\(AF:FC=1:2\\) arányban osztja. Az \\(M\\) és \\(N\\) pontok a \\(BF\\) szakasznak az \\(AE\\) és \\(AD\\) szakaszokkal való metszéspontjait jelöli. Írjuk fel az \\(MNDE\\) négyszög és az \\(ABC\\) háromszög területének arányát \\(\\frac{P}{Q}\\) alakban, ahol ez a tört már tovább nem egyszerűsíthető.<br><i>Mennyi \\(100P+Q\\) értéke? Például ha a felírt tört \\(\\frac{3}{10}\\), akkor \\(100P+Q= 310\\) legyen a válasz.</i></p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_D_C_16.png",
        help1: "Számoljuk ki milyen arányban osztja N az AD szakaszt és M az AE szakaszt.",
        help2: "Menelaosz-tétel",
      },
    },
  },
  '6ru43lsn48--tablara-felirtuk-kisebb': {
    answer: 10,
    content: {
      hu: {
        problemText: "<p>Egy táblára felírtuk a 2018-at és egy kisebb pozitív számot. Egy lépésben, ha a két táblán levő szám átlaga egész, letörölhetjük az egyiket, és felírhatjuk helyette az átlagot. Legfeljebb hány ilyen lépést végezhetünk el?</p>",
        help1: "Mikor egész két szám átlaga?",
        help2: "Vizsgáljuk minden lépésben a 2 felírt szám különbségét",
      },
    },
  },
  'jcljcmu864--derekszogu-haromszogben-csucsnal': {
    answer: 234,
    content: {
      hu: {
        problemText: "<p>\\(ABC\\) derékszögű háromszögben \\(C\\) csúcsnál van derékszög. \\(D\\) az \\(AB\\) felezőpontja, a \\(D\\)-ben \\(AB\\)-re állított merőleges \\(CB\\)-t \\(E\\)-ben metszi. Ha \\(AB\\) hossza 40 és \\(AC\\) hossza 24, akkor mekkora az \\(ADEC\\) négyszög területe?</p>",
        help1: "ABC és EBD háromszögek hasonlóak",
        help2: "A hasonlóságból CE és ED szakaszok hossza kiszámolható, majd a négyszöget ACE és ADE háromszögekre bontva a terület is.",
      },
    },
  },
  'jdainp6t8a--szorzat-utolso-szamjegye': {
    answer: 6,
    content: {
      hu: {
        problemText: "<p>Mi a \\(2018\\cdot2017\\cdot2016\\cdot\\cdots\\cdot2001\\cdot2000\\) szorzat utolsó nem 0 számjegye?</p>",
        help1: "Elég a számok utolsó számjegyét nézni a szorzat utolsó számjegyéhez",
        help2: "Nevezzük egy lépésnek azt a műveletet, amikor a szorzás egyik tényezőjét leosztod 5-tel, és egy másikat (vagy esetleg ugyanazt) pedig 2-vel. Végezzünk el annyi lépést, amennyi lehetséges!",
      },
    },
  },
  'apaj8q3sti--legkisebb-primszam-felirhato': {
    answer: 43,
    content: {
      hu: {
        problemText: "<p>Melyik az a legkisebb pozitív prímszám, amely felírható 2, 3, 4, illetve 5 különböző pozitív prímszám összegeként is?</p>",
        help1: "Vizsgáljuk az összeadott prímek paritását!",
        help2: "Ha egy prímszám felírható 5 prím összegeként, akkor páratlan, így a 2 nem lehet köztük. Ez ad egy alsó becslést, az ennél nagyobb prímeket végignézve eljutunk egy felírhatóhoz.",
      },
    },
  },
  'bpont71ntf--sakktabla-bal-also': {
    answer: 24,
    content: {
      hu: {
        problemText: "<p>Egy sakktábla bal alsó \\(3\\times3\\)-as résztáblájának minden mezőjére egy-egy korongot helyeztünk. Bármely koronggal átugorhatunk vele élben vagy csúcsban szomszédos mezőn álló korongot, ha az érkezési mező üres. Egy másik megengedett lépés, hogy egy korongot feljebb tolhatunk egy mezővel, ha az a mező üres. Szeretnénk eljuttatni a 9 korongot a bal felső \\(3\\times3\\)-as résztábla mezőire úgy, hogy minden mezőn egy korong álljon. Legalább hány lépés kell ehhez?</p>",
        help1: "Az optimális konstrukció megtalálásához próbáljunk meg minél több 'ugró' lépést tenni, mivel ezekkel 2-t tolunk előre egy korongot.",
        help2: "Ahhoz, hogy belássuk, hogy nem lehet kevesebb lépésből eljuttatni a korongokat, színezzük ki a sakktábla mezőt 4 színnel, azok legyenek egyszínűek, amelyek között egy (vagy néhány)  átlós vagy egyenes ugrással át lehet lépni.",
      },
    },
  },
  '82btxrs2kv--szamot-kettes-onvegzodonek': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>Egy pozitív egész számot „kettes önvégződőnek” nevezünk, ha a szám 2-es számrendszerbeli alakjának utolsó néhány számjegye éppen a szám 10-es számrendszerbeli alakja. Hány 2018-nál kisebb kettes önvégződő szám van?</p>",
        help1: "Csak azok a számok jönnek szóba, amelyek 10-es számrendszerbeli alakjában csak a 0 és az 1 szerepel, és 2018-nál kisebbek, ezek maradékait kell vizsgálni.",
        help2: "Vegyük észre, hogy az 1010 és az 1110 nem jók",
      },
    },
  },
  'si8w9l3o8s--testver-eladta-birkanyajat': {
    answer: 2,
    content: {
      hu: {
        problemText: "<p>Két testvér eladta a birkanyáját. Minden birkát annyi tallérért adtak el, ahány birka a nyájban eredetileg volt. A bevételen 10 talléronként osztozkodtak. Először az idősebb testvér kapott 10 tallért, azután a fiatalabb, majd újra az idősebb és így tovább. Utoljára a fiatalabbnak már csak 10-nél kevesebb tallér jutott, ezért az idősebb nekiadta a bicskáját, ezzel összességében mindkét testvér vagyona ugyanannyival változott. Hány tallért ért a bicska?</p>",
        help1: "A négyzetszámok lehetséges 20-as maradékát kell vizsgálni.",
        help2: "Mikor lesz a maradék 10-nél nagyobb és páros?",
      },
    },
  },
  'l7zqjfi47a--negyzetracson-kijelolt-kis': {
    answer: 398,
    content: {
      hu: {
        problemText: "<p>Egy négyzetrácson kijelölt \\(20\\times18\\) kis négyzetből álló rácstéglalapban mekkora a legnagyobb kerületű önmagát nem metsző rácssokszög kerülete, ha a sokszög minden oldala a négyzetrács éleire illeszkedik? <i>Az ábrán egy \\(4\\times3\\)-as rácstéglalapba rajzolt 14 kerületű rácssokszög látható. </i></p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_D_Cp_9.png",
        help1: "Minden rácsponton max. 2 oldal mehet át, ez ad egy felső korlátot a kerületre.",
        help2: "Egy ilyen konstrukció meg is valósítható, pl. egy \"fésű\"-szerű elrendezéssel.",
      },
    },
  },
  'fr6kgra62o--haromszog-oldalan-pontok': {
    answer: 524,
    content: {
      hu: {
        problemText: "<p>Az \\(ABC\\) háromszög \\(BC\\) oldalán \\(D\\) és \\(E\\) pontok úgy helyezkednek el, hogy \\(BD:DE:EC=1:2:3\\). Az \\(F\\) pont a háromszög \\(AC\\) oldalát \\(AF:FC=1:2\\) arányban osztja. Az \\(M\\) és \\(N\\) pontok a \\(BF\\) szakasznak az \\(AE\\) és \\(AD\\) szakaszokkal való metszéspontjait jelöli. Írjuk fel az \\(MNDE\\) négyszög és az \\(ABC\\) háromszög területének arányát \\(\\frac{P}{Q}\\) alakban, ahol ez a tört már tovább nem egyszerűsíthető.<br><i>Mennyi \\(100P+Q\\) értéke? Például ha a felírt tört \\(\\frac{3}{10}\\), akkor \\(100P+Q= 310\\) legyen a válasz.</i></p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_D_Cp_12.png",
        help1: "Számoljuk ki milyen arányban osztja N az AD szakaszt és M az AE szakaszt.",
        help2: "Vizsgáljuk meg a BEN és az ENA háromszögeket, ezeknek mekkora része van a beszínezett részben?",
      },
    },
  },
  'ed57m4x6vh--gyerek-dobalt-labdat': {
    answer: 1641,
    content: {
      hu: {
        problemText: "<p>4 gyerek dobált egy labdát. Béla kezdte a labdázást és a végén is hozzá került a labda. Összesen 8-szor dobták át a labdát valaki másnak. Hányféle útja lehetett a labdának?</p>",
        help1: "Számoljuk meg, hogy összesen hány útja lehetett a labdának, majd ebből vonjuk ki azon esetek számát, amikor a 8. dobás után nem Bélánál van a labda.",
        help2: "A rossz esetek száma pont a kérdésre a válasz, ha 8 helyett 7-re kérdezzük meg, így rekurzióval megoldható.",
      },
    },
  },
  '39dj187r0g--darab-tol-szamozott': {
    answer: 24,
    content: {
      hu: {
        problemText: "<p>27 darab 1-től 27-ig számozott kis kockából építettünk valahogyan egy \\(3\\times3\\ times3\\)-as kockát. Kiszámoltuk az összes lehetséges három kis kockából álló \\(3\\times1\\times1\\)-es téglatestben az alkotó kis kockák sorszámának az összegét. Ezen összegek közül legfeljebb mennyi lehet páratlan?</p>",
        help1: "A felső becsléshez vegyük észre, hogy a kockát 3 db 1x3x3-as téglára darabolva a 3 téglából maximum 2-ben lehet páratlan az összes, majd ezt is tovább lehet darabolni.",
        help2: "A konstrukcióhoz elég a számok paritását nézni.",
      },
    },
  },
  '4w4bbnexjb--egyenlo-sugaru-korok': {
    answer: 24,
    content: {
      hu: {
        problemText: "<p>\\(K_{1}\\) és \\(K_{2}\\) egyenlő sugarú körök, amelyek érintik egymást és az \\(e\\) egyenest. A \\(K_{3}\\) kör érinti az \\(e\\) egyenest, \\(K_{1}\\)-et és \\(K_{2}\\)-t, a \\(K_{4}\\) kör érinti \\(K_{1}\\)-et, \\(K_{2}\\)-t és \\(K_{3}-at, a /[K_{5}\\) kör érinti \\(K_{1}\\)-et, \\(K_{2}\\)-t és \\(K_{4}\\)-et az ábra szerint. Ha \\(K_{5}\\) sugara 1 cm, hány cm \\(K_{1}\\) sugara?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_D_Cp_15.png",
        help1: "A körök középpontjai és az érintési pontok egy egyenesre esnek.",
        help2: "Vegyük fel a 2 nagy kör középpontjain át húzott szakasz felezőpontját, e pont segítségével írjunk fel 4 Pitagorasz-tételt.",
      },
    },
  },
  '6qlufsuk4s--kartyabol-allo-pakli': {
    answer: 409,
    content: {
      hu: {
        problemText: "<p>Van egy 49 kártyából álló pakli, melyben 7-féle színűek a lapok, és minden színből 7 darab, 1-től 7-ig számozott lap van. Bella véletlenszerűen felhúzott 8 lapot. Ha tudjuk, hogy a 8 lap között minden szín és minden szám is előfordul, mennyi az esélye, hogy Bella el tud egy lapot dobni úgy, hogy a maradék 7 lap között is minden szín és minden szám előforduljon? A választ \\(100P+Q\\) formában adjátok meg, ahol \\(\\frac{P}{Q}\\) a keresett tört legegyszerűbb alakja!<br><i>Mennyi \\(100P+Q\\) értéke? Például ha a felírt tört \\(\\frac{3}{10}\\), akkor \\(100P+Q= 310\\) legyen a válasz.</i></p>",
        help1: "Átfogalmazzuk a feladatot: egy 7x7-es táblázatot nézünk, ennek mezőit választjuk ki. A 'jó' esetek azok, amikor veszünk egy 'bástyaelrendezést', majd hozzáveszünk egy pontot.",
        help2: "A rossz esetek azok, amikor van egy oszlop, és egy sor is, ahol van 2-2 kiválasztott mező, de a közös mező nincs kiválasztva. A valószínűség a jó és a rossz esetek hányadosából kiszámolható",
      },
    },
  },
  'rtfozg4ljj--george-fibonacci-szamok': {
    answer: 3568,
    content: {
      hu: {
        problemText: "<p>George a Fibonacci-számok mintájára felírta ezt a 15 számot: 1, 3, 4, 7, 11, 18, 29, 47, 76, 123, 199, 322, 521, 843, 1364. Mi a 15 szám összege?</p>",
        help1: "Ne egyesével adjuk össze",
        help2: "Adjuk össze minden harmadikat és használjuk fel ezt a 15 összegéhez.",
      },
    },
  },
  '8n3ajwaieu--torpkertesz-epret-malnat': {
    answer: 13,
    content: {
      hu: {
        problemText: "<p>Törpkertész epret és málnát ültet. Az epret egy derékszögű háromszög alakú ágyásba ülteti, melynek két befogója 10 illetve 24 méter. A málnát pedig egy téglalap alakú ágyásba, melynek rövidebbik oldala a háromszög átfogójához tartozó magassággal egyenlő. Hány méter a téglalap hosszabbik oldala, ha Törpkertész ugyanakkora területen ülteti az epret és a málnát?</p>",
        help1: "A háromszög átfogóját számítsátok ki Pitagorasz-tétellel!",
        help2: "Az átfogóhoz tartozó magasságot számítsátok ki a területképletből!",
      },
    },
  },
  'jn5lv1qb92--kis-haromszoge-feketere': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>Legalább hányat kell az alábbi ábra 36 kis háromszöge közül feketére festeni ahhoz, hogy minden fehéren maradt kis háromszögnek legyen közös csúcsa feketére festett háromszöggel?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_D_D_6.png",
        help1: "A 3 sarokban lévő kis háromszög mellé érdemes egy-egy fekete mezőt tenni.",
        help2: "A maradék mezőt próbáljuk meg minél kevesebbel, nem feltétlenül szimmetrikusan.",
      },
    },
  },
  'ceqt38jm5a--haromszog-oldalan-pontok': {
    answer: 512,
    content: {
      hu: {
        problemText: "<p>Az \\(ABC\\) háromszög \\(BC\\) oldalán \\(D\\) és \\(E\\) pontok úgy helyezkednek el, hogy \\(BD:DE:EC=1:2:3\\). Az \\(F\\) pont a háromszög \\(AC\\) oldalát \\(AF:FC=1:2\\) arányban osztja. Az \\(M\\) és \\(N\\) pontok a \\(BF\\) szakasznak az \\(AE\\) és \\(AD\\) szakaszokkal való metszéspontjait jelöli. Írjuk fel az \\(MNDE\\) négyszög és az \\(ABC\\) háromszög területének arányát \\(\\frac{P}{Q}\\) alakban, ahol ez a tört már tovább nem egyszerűsíthető.<br><i>Mennyi \\(100P+Q\\) értéke? Például ha a felírt tört \\(\\frac{3}{10}\\), akkor \\(100P+Q= 310\\) legyen a válasz.</i></p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_D_D_9.png",
        help1: "Számoljuk ki milyen arányban osztja N az AD szakaszt és M az AE szakaszt.",
        help2: "Menelaosz-tétel",
      },
    },
  },
  'r9u60o8h2i--egyenlo-sugaru-korok': {
    answer: 24,
    content: {
      hu: {
        problemText: "<p>\\(K_1\\) és \\(K_2\\) egyenlő sugarú körök, amelyek érintik egymást és az \\(e\\) egyenest. A \\(K_3\\) kör érinti az \\(e\\) egyenest, \\(K_1\\)-et és \\(K_2\\)-t, a \\(K_4\\) kör érinti \\(K_1\\)-et, \\(K_2\\)-t és \\(K_3\\)-at, a \\(K_5\\) kör érinti \\(K_1\\)-et, \\(K_2\\)-t és \\(K_4\\)-et az ábra szerint. Ha \\(K_5\\) sugara 1 cm, hány cm \\(K_1\\) sugara?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_D_D_11.png",
        help1: "Két érintő kör középpontja egy egyenesen van az érintési ponttal.",
        help2: "Fejezzük ki a kisebb körök sugarát a nagy kör sugarával Pitagorasz-tételt alkalmazva!",
      },
    },
  },
  'xe5iuk5v6n--bergengocia-legnagyobb-varosa': {
    answer: 544,
    content: {
      hu: {
        problemText: "<p>Bergengócia 5 legnagyobb városa közül bármelyikből bármelyikbe vezet közvetlen buszjárat. (A buszok útközben sehol sem állnak meg, csak a két végállomáson.) A busztársaság azonban szeretné megszüntetni a járatok felét úgy, hogy bármely két város között pontosan az egyik irányú járat maradjon meg. De persze azt is szeretné, hogy továbbra is bármelyik városból bármelyik másikba el lehessen utazni (esetleg átszállással). Hányféleképpen teheti ezt meg?</p>",
        help1: "Minden városból 1 kimenő és 1 bemenő járat szükséges és elégséges.",
        help2: "Használjátok a logikai szitát!",
      },
    },
  },
  'yr3rmtf6yd--gizaban-farao-legfobb': {
    answer: 6156,
    content: {
      hu: {
        problemText: "<p>Gízában a fáraó 6 legfőbb hivatalnokának is állítottak egy-egy piramist. A 6 piramist szorosan egymás mellé építették \\(2\\times3\\)-as formációban, ahogy az ábrán is látható. Ezek a piramisok olyan négyzet alapú gúlák, melyek oldallapjai 18 m oldalú szabályos háromszögek. Egy skarabeusz bogár (aki az oldallapokon is könnyedén tud sétálni) a lehető legrövidebb úton akar átjutni az ábrán jelölt két átellenes sarok között. Ha a legrövidebb út hossza \\(d\\) m, akkor mennyi \\(d^2\\) ?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_D_D_13.png",
        help1: "Készítsünk egy síkbeli hálót a piramisok azon oldalaiból amiket használunk.",
        help2: "A síkon két pont között az egyenes a legrövidebb út.",
      },
    },
  },
  'bd7nadbfdl--szamra-legkisebb-primszam': {
    answer: 1097,
    content: {
      hu: {
        problemText: "<p>Minden \\(k\\geq1\\) egész számra legyen \\(p(k)\\) a legkisebb olyan prímszám, ami nem osztja \\(k\\)-t. Legyen \\(y(k)\\) azon prímek szorzata, melyek kisebbek, mint \\(p(k)\\) (ha nincs ilyen prím, akkor \\(y(k)=1\\)). Legyen \\((x_n)\\) az a sorozat, ahol \\(x_0=1\\), és \\(x_{n+1}y(x_n)=x_np(x_n)\\) minden \\(n\\geq0\\)-ra. Keressétek meg a legkisebb olyan \\(t\\) pozitív egészet, melyre \\(x_t=7378\\).</p>",
        help1: "Írjuk fel az n-edik tag prímfelbontását.",
        help2: "Az n-edik tag prímfelbontását hasonlítsuk össze n kettes számrendszerbeli alakjával.",
      },
    },
  },
  'enzm4e8ki4--racspontbol-allo-haromdimenzios': {
    answer: 168,
    content: {
      hu: {
        problemText: "<p>Egy \\(10\\times10\\times10\\) rácspontból álló háromdimenziós kockarácsban hány olyan egyenes van, ami pontosan 8 rácspontot tartalmaz?</p>",
        help1: "Milyen iránya lehet az egyenesnek?",
        help2: "Hol metszheti az egyenes a kocka felszínét?",
      },
    },
  },
  '31nn6x0je2--tabla-mezojere-vilagos': {
    answer: 576,
    content: {
      hu: {
        problemText: "<p>Egy \\(4\\times4\\)-es tábla minden mezőjére világos vagy sötét huszárt helyeztünk el olyan módon, hogy minden huszár lát mindkét színű huszárt (azaz lóugrásban tőle áll világos és sötét színű huszár is). Hányféleképpen lehetséges az ilyen elhelyezés?</p>",
        help1: "Színezzük ki sakktáblaszerűen a táblát!",
        help2: "Számoljuk meg hogy a fehér mezőkre hányféleképpen tehetjük a lovakat.",
      },
    },
  },
  '54ydab9n45--kis-haromszoge-feketere': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>Legalább hányat kell az alábbi ábra 36 kis háromszöge közül feketére festeni ahhoz, hogy minden fehéren maradt kis háromszögnek legyen közös csúcsa feketére festett háromszöggel?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_D_Dp_2.png",
        help1: "A 3 sarokban lévő kis háromszög mellé érdemes egy-egy fekete mezőt tenni.",
        help2: "A maradék mezőt próbáljuk meg minél kevesebbel, nem feltétlenül szimmetrikusan.",
      },
    },
  },
  'rkkslmp55p--haromszog-oldalan-pontok': {
    answer: 512,
    content: {
      hu: {
        problemText: "<p>Az \\(ABC\\) háromszög \\(BC\\) oldalán \\(D\\) és \\(E\\) pontok úgy helyezkednek el, hogy \\(BD:DE:EC=1:2:3\\). Az \\(F\\) pont a háromszög \\(AC\\) oldalát \\(AF:FC=1:2\\) arányban osztja. Az \\(M\\) és \\(N\\) pontok a \\(BF\\) szakasznak az \\(AE\\) és \\(AD\\) szakaszokkal való metszéspontjait jelöli. Írjuk fel az \\(MNDE\\) négyszög és az \\(ABC\\) háromszög területének arányát \\(\\frac{P}{Q}\\) alakban, ahol ez a tört már tovább nem egyszerűsíthető.<br><i>Mennyi \\(100P+Q\\) értéke? Például ha a felírt tört \\(\\frac{3}{10}\\), akkor \\(100P+Q= 310\\) legyen a válasz.</i></p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_D_Dp_5.png",
        help1: "Számoljuk ki milyen arányban osztja N az AD szakaszt és M az AE szakaszt.",
        help2: "Menelaosz-tétel",
      },
    },
  },
  'a63kdq7e38--egyenlo-sugaru-korok': {
    answer: 24,
    content: {
      hu: {
        problemText: "<p>\\(K_1\\) és \\(K_2\\) egyenlő sugarú körök, amelyek érintik egymást és az \\(e\\) egyenest. A \\(K_3\\) kör érinti az \\(e\\) egyenest, \\(K_1\\)-et és \\(K_2\\)-t, a \\(K_4\\) kör érinti \\(K_1\\)-et, \\(K_2\\)-t és \\(K_3\\)-at, a \\(K_5\\) kör érinti \\(K_1\\)-et, \\(K_2\\)-t és \\(K_4\\)-et az ábra szerint. Ha \\(K_5\\) sugara 1 cm, hány cm \\(K_1\\) sugara?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_D_Dp_7.png",
        help1: "Két érintő kör középpontja egy egyenesen van az érintési ponttal.",
        help2: "Fejezzük ki a kisebb körök sugarát a nagy kör sugarával Pitagorasz-tételt alkalmazva!",
      },
    },
  },
  '69gukaa4ck--gizaban-farao-legfobb': {
    answer: 6156,
    content: {
      hu: {
        problemText: "<p>Gízában a fáraó 6 legfőbb hivatalnokának is állítottak egy-egy piramist. A 6 piramist szorosan egymás mellé építették \\(2\\times3\\)-as formációban, ahogy az ábrán is látható. Ezek a piramisok olyan négyzet alapú gúlák, melyek oldallapjai 18 m oldalú szabályos háromszögek. Egy skarabeusz bogár (aki az oldallapokon is könnyedén tud sétálni) a lehető legrövidebb úton akar átjutni az ábrán jelölt két átellenes sarok között. Ha a legrövidebb út hossza \\(d\\) m, akkor mennyi \\(d^2\\) ?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_D_Dp_9.png",
        help1: "Készítsünk egy síkbeli hálót a piramisok azon oldalaiból amiket használunk.",
        help2: "A síkon két pont között az egyenes a legrövidebb út.",
      },
    },
  },
  'kuhc89j2n5--tabla-mezojere-vilagos': {
    answer: 576,
    content: {
      hu: {
        problemText: "<p>Egy \\(4\\times4\\)-es tábla minden mezőjére világos vagy sötét huszárt helyeztünk el olyan módon, hogy minden huszár lát mindkét színű huszárt (azaz lóugrásban tőle áll világos és sötét színű huszár is). Hányféleképpen lehetséges az ilyen elhelyezés?</p>",
        help1: "Színezzük ki sakktáblaszerűen a táblát!",
        help2: "Számoljuk meg hogy a fehér mezőkre hány féle képpen tehetjük a lovakat.",
      },
    },
  },
  'spfbhpwg4s--kartyabol-allo-pakli': {
    answer: 409,
    content: {
      hu: {
        problemText: "<p>Van egy 49 kártyából álló pakli, melyben 7-féle színűek a lapok, és minden színből 7 darab, 1-től 7-ig számozott lap van. Bella véletlenszerűen felhúzott 8 lapot. Ha tudjuk, hogy a 8 lap között minden szín és minden szám is előfordul, mennyi az esélye, hogy Bella el tud egy lapot dobni úgy, hogy a maradék 7 lap között is minden szín és minden szám előforduljon? A választ \\(100P+Q\\) formában adjátok meg, ahol \\(\\frac{P}{Q}\\) a keresett tört legegyszerűbb alakja!<br><i>Mennyi \\(100P+Q\\) értéke? Például ha a felírt tört \\(\\frac{3}{10}\\), akkor \\(100P+Q= 310\\) legyen a válasz.</i></p>",
        help1: "Akkor tud Bella egy lapot eldobni megfelelően, ha van vele azonos színű lap és vele azonos számú lap is.",
        help2: "Csak egyfajta jó és egyfajta rossz eset van, ezeket kell összeszámolni, hogy hányféleképpen állnak elő.",
      },
    },
  },
  '6fe50it98l--haromszog-oldalai-hosszuak': {
    answer: 15,
    content: {
      hu: {
        problemText: "<p>Az \\(ABC\\) háromszög oldalai \\(c=\\sqrt{41}\\), \\(b=5\\) és \\(a=8\\) hosszúak. Legyen \\(O\\) a köréírt kör középpontja, és legyen \\(A_0\\) az \\(A\\) tükörképe \\(O\\)-ra. Mekkora az \\(A_0BC\\) háromszög területe?</p>",
        help1: "Keressetek húrnégyszöget az ábrán!",
        help2: "Ptolemaiosz-tétellel számítsátok ki a köréírt kör sugarát!",
      },
    },
  },
  'le01u09qow--harmadfoku-polinom-egyutthatoja': {
    answer: 620,
    content: {
      hu: {
        problemText: "<p>Egy harmadfokú \\(P\\) polinom minden együtthatója egész, valamint a főegyütthatója 1. Azt is tudjuk, hogy \\(P\\)-nek minden \\(z\\) (nem feltétlenül valós) gyökére igaz, hogy \\(|z|=18\\) vagy \\(|z|=20\\). Hány ilyen polinom létezik?</p>",
        help1: "Az egyenletnek lehet 1 valós és 2 komplex gyöke, vagy 3 valós gyöke.",
        help2: "A Viète-formulák alapján írjátok fel a komplex gyökök valós részének lehetséges értékeit.",
      },
    },
  },
  'utn480ep9r--haromszog-melynek-szogei': {
    answer: 399,
    content: {
      hu: {
        problemText: "<p>Adott egy háromszög, melynek szögei teljesítik a \\(cos(3\\alfa)+ cos(3\\beta)+ cos(3\\gamma)=1\\) összefüggést. Tudjuk, hogy a háromszögnek van egy 10 és egy 13 hosszú oldala. Mekkora a harmadik oldal hosszának négyzete, ha az ilyen feltételek mellett a lehető legnagyobb?</p>",
        help1: "Használjátok ki, hogy egy háromszög szögeiről van szó és alakítsátok szorzattá az egyenletet!",
        help2: "Lássátok be, hogy a háromszög legnagyobb szöge csak egyféle értéket vehet fel, és ezt határozzátok meg!",
      },
    },
  },
};
