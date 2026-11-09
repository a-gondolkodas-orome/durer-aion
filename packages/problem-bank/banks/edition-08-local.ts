import type { CompetitionBank, ProblemBank } from '../src/sources';

// Edition 8's local round, relay only, as the relay practice site serves it: one
// competition per category, and the problems their relays use, each written
// once. Released, so the practice site may import it.

export const competitions: CompetitionBank = {
  'xdykhxjpqq--08-local-a': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: '991y9pwsue--feladat', points: 3 },
        { problemId: '4461i8a6kk--szamjegyek-osszege-legnagyobb', points: 3 },
        { problemId: 'vfg75mdto6--negyzet-rajz-fekete', points: 3 },
        { problemId: '8nut6zi8u5--sarkanyvarosban-sarkany-rendre', points: 3 },
        { problemId: '7el3c5r716--emeletes-haz-szinnel', points: 4 },
        { problemId: 'tbsngf27c1--nyaralas-soran-nap', points: 4 },
        { problemId: 'dh74q7o0p0--osszeszoroztuk-szamokat-tol', points: 4 },
        { problemId: '6ao2bc55m4--gyerek-osztozkodott-bizonyos', points: 4 },
        { problemId: 'xqf484f2qg--ember-asztal-korul', points: 5 },
        { problemId: 'd8ty985f7x--keszitsd-legkisebb-szamot', points: 5 },
        { problemId: '9zihfx9wgw--elso-gorog-betut', points: 5 },
        { problemId: 'byheumw1sk--tablazatba-szamokat-irtuk', points: 5 },
        { problemId: 'bvi8l4kbmt--kovetkezo-osszeadasban-kulonbozo', points: 6 },
        { problemId: '0jtpe42m68--azonos-termeszetes-szamot', points: 6 },
        { problemId: 'd87m6so3j3--nagy-negyzet-kis', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 8, round: 'local', category: 'A' },
  },
  '0j6wur1i20--08-local-b': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: '258j0w1cn2--feladat', points: 3 },
        { problemId: '8nut6zi8u5--sarkanyvarosban-sarkany-rendre', points: 3 },
        { problemId: 'ck9smeff6e--fullontode-dolgozoi-kedden', points: 3 },
        { problemId: 'ze4qi4zs3a--alpesi-siversenyeken-egyenkent', points: 3 },
        { problemId: 'wf8wqkhp46--viragboltban-rozsat-tulipant', points: 4 },
        { problemId: 'rdxtkvj2qe--rajzoltunk-negyzetracsot-fogtuk', points: 4 },
        { problemId: 'ipyyd180og--tizenket-ember-asztal', points: 4 },
        { problemId: 'fmyzj2afqb--elso-gorog-betut', points: 4 },
        { problemId: 'l3oz4vzhx0--varosban-ferfiak-resze', points: 5 },
        { problemId: 'mnxfddza3l--tanar-felir-tablara', points: 5 },
        { problemId: '96rwtvippt--egyenloszaru-haromszoget-kulonlegesnek', points: 5 },
        { problemId: '11j7bfzt4r--otjegyu-szamot-csupa', points: 5 },
        { problemId: 'uuxh6mshqj--jobb-oldali-nagy', points: 6 },
        { problemId: 'a45l5ewd27--szabalyos-nyolcszog-csucsat', points: 6 },
        { problemId: 's6jeep5jrh--hatarozzuk-legnagyobb-szamot', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 8, round: 'local', category: 'B' },
  },
};

export const problems: ProblemBank = {
  '991y9pwsue--feladat': {
    answer: 16,
    content: {
      hu: {
        problemText: "<p>\\(8+8-8+8-8+8-8+8=?\\)</p>",
        help1: "Csoportosítsátok, hogy hány hozzáadandó és hány kivonandó 8-as van!",
        help2: "5 hozzáadandó, és 3 kivonandó 8-as van.",
      },
    },
  },
  '4461i8a6kk--szamjegyek-osszege-legnagyobb': {
    answer: 71,
    content: {
      hu: {
        problemText: "<p>Mennyi a számjegyek összege a legnagyobb nyolcjegyű páros számban?</p>",
        help1: "Egy szám akkor páros, ha az utolsó jegye páros.",
        help2: "A kérdezett szám 99999998.",
      },
    },
  },
  'vfg75mdto6--negyzet-rajz-fekete': {
    answer: 14,
    content: {
      hu: {
        problemText: "<p>Hány olyan négyzet van összesen, amit a rajz fekete vonalai határolnak?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/8_H_A_3.png",
        help1: "Csoportosítsátok az ábrán fellelhető négyzeteket az oldalaik hossza szerint!",
        help2: "9 darab 1 oldalhosszú, 4 darab 2 oldalhosszú és 1 darab 3 oldalhosszú négyzet van az ábrán.",
      },
    },
  },
  '8nut6zi8u5--sarkanyvarosban-sarkany-rendre': {
    answer: 120,
    content: {
      hu: {
        problemText: "<p>Sárkányvárosban 8 sárkány él. Rendre 1, 2, \\(\\ldots\\), 8 fejük van. Minden sárkánynak meg vannak számozva a fejei 1-től addig, ahány feje van. Éppen annyi foga van egy fejnek, ahányas szám található rajta. Hány sárkányfog van összesen Sárkányvárosban?</p>",
        help1: "Hány foga van az <em>i</em> fejű sárkánynak?",
        help2: "A kérdezett szám egyenlő <em>1&sdot;1+2&sdot;2+3&sdot;3+4&sdot;4+5&sdot;5+6&sdot;6+7 &sdot;7+8&sdot;8</em>.",
      },
    },
  },
  '7el3c5r716--emeletes-haz-szinnel': {
    answer: 12,
    content: {
      hu: {
        problemText: "<p>Van egy három emeletes ház, amit három színnel: pirossal, kékkel és zölddel szeretnénk kifesteni, de nem muszáj az összes színt felhasználnunk. Egy-egy emeletet teljesen egyszínűre festünk és még arra is figyelünk, hogy a szomszédos emeleteket különböző színnel fessük ki.<br>Hányféleképpen tehetjük meg ezt?</p>",
        help1: "Feltehetjük, hogy először a legfelső emeletet festjük ki.",
        help2: "Ez után a középső emeletet kétféle színnel festhetjük csak ki.",
      },
    },
  },
  'tbsngf27c1--nyaralas-soran-nap': {
    answer: 9,
    content: {
      hu: {
        problemText: "<p>Egy nyaralás során hét olyan nap volt, amikor esett az eső, néha délelőtt, máskor délután. Ha délelőtt esett, akkor délután nem hullott egy csepp sem. Összesen ötször nem esett délelőtt és hatszor nem esett délután. Hány napig tartott a nyaralás?</p>",
        help1: "Háromféle nap volt a kirándulás során: amikor nem esett az eső, amikor csak délelőtt esett, és amikor csak délután esett.",
        help2: "Írjatok fel egyenleteket az ilyen napok számaival!",
      },
    },
  },
  'dh74q7o0p0--osszeszoroztuk-szamokat-tol': {
    answer: 0,
    content: {
      hu: {
        problemText: "<p>Összeszoroztuk a számokat 1-től 20-ig. Mi a szorzat utolsó 4 számjegyének az összege?</p>",
        help1: "A szorzat utolsó két jegye nulla, mert 10 és a 20 is tényező a szorzatban.",
        help2: "Mennyi <em>4&sdot;5&sdot;15</em>?",
      },
    },
  },
  '6ao2bc55m4--gyerek-osztozkodott-bizonyos': {
    answer: 36,
    content: {
      hu: {
        problemText: "<p>Három gyerek osztozkodott bizonyos számú almán. Péter kapta az összes almák felét meg még kettőt. Pista kapta a megmaradt almák felét és még kettőt. Jóska az ezután visszamaradt almák felét és még kettőt kapott. Így egy alma maradt. Hány almán osztozkodtak a gyerekek?</p>",
        help1: "Hány alma volt még, amiből Jóska elvette az övéit?",
        help2: "Hány alma volt, amikor Pista elvette az ő almáit?",
      },
    },
  },
  'xqf484f2qg--ember-asztal-korul': {
    answer: 2,
    content: {
      hu: {
        problemText: "<p>Nyolc ember ül egy asztal körül: lovagok és lókötők. Mindegyikük a következő állítást tette: <i>„Magamról és a szomszédaimról nem nyilatkozom, de a többiek mindegyike lókötő”</i>.</p><p>Hány lovag ül az asztalnál, ha tudjuk, hogy a lókötők mindig hazudnak, a lovagok pedig mindig igazat mondanak?</p>",
        help1: "Lehetséges, hogy legalább 3 lovag üljön az asztal körül?",
        help2: "Lehetséges, hogy nem ül lovag az asztalnál?",
      },
    },
  },
  'd8ty985f7x--keszitsd-legkisebb-szamot': {
    answer: 1944,
    content: {
      hu: {
        problemText: "<p>Készítsd el a legkisebb olyan számot, amiben a számjegyek összege 80 és bármely két szomszédos számjegy különböző. Mennyi a kapott szám első négy számjegyének szorzata?</p>",
        help1: "A számjegyeknek minél nagyobbaknak érdemes lenniük a számunkban.",
        help2: "Az első számjegy legyen a legkisebb a számunkban!",
      },
    },
  },
  '9zihfx9wgw--elso-gorog-betut': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>Az első ábrán egy a görög \\(\\pi\\) betűt formázó sokszög látható. Ezt felbontottunk néhány sorszámozott részre. A részekből összeállítottunk egy négyzetet, ennek egy részét látjátok a második ábrán.</p><p>Mennyi a szürke négyzetbe belemetsző darabok sorszámainak összege?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/8_H_A_11.png",
        help1: "Lehetséges, hogy a 3-as darab kerüljön az 5-ös mellé?",
        help2: "lehetséges, hogy 1-es vagy kettes darab kerüljön az 5-ös mellé?",
      },
    },
  },
  'byheumw1sk--tablazatba-szamokat-irtuk': {
    answer: 6,
    content: {
      hu: {
        problemText: "<p>Az alábbi táblázatba az 1, 2, 3, \\(\\ldots\\), 9 számokat írtuk úgy, hogy mindegyiket pontosan egyszer használtuk fel. Tudjuk, hogy a sorok összege 8, 15, 22 ebben a sorrendben és az oszlopok összege 8, 17, 20 ebben a sorrendben. Melyik szám áll a középső mezőben?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/8_H_A_12.png",
        help1: "Kerülhet 5-nél nagyobb szám az első sor/oszlopba?",
        help2: "Kerülhet a bal alsó sarokba 5-nél kisebb szám?",
      },
    },
  },
  'bvi8l4kbmt--kovetkezo-osszeadasban-kulonbozo': {
    answer: 145,
    content: {
      hu: {
        problemText: "<p>A következő összeadásban különböző betűk, különböző számjegyeket, az azonos betűk pedig azonos számjegyeket jelentenek:<br><center>ANYA + APA = SZÜLŐ.</center></p><p>Mennyi a SÜN szó értéke, ha tudjuk, hogy L = 6?</p>",
        help1: "Ha egy négy és egy háromjegyű számot összeadunk és ötjegyűt kapunk, mivel kell kezdődjön a négyjegyű szám, és mivel kell kezdődjön az 5 jegyű?",
        help2: "Az Y és P betűk értéke felcserélhető.",
      },
    },
  },
  '0jtpe42m68--azonos-termeszetes-szamot': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>Tíz azonos természetes számot összeszoroztam és 282 475 249-et kaptam. Melyik ez a szám?</p>",
        help1: "Nagyobb ez a szám 10-nél?",
        help2: "Ez a szám páratlan.",
      },
    },
  },
  'd87m6so3j3--nagy-negyzet-kis': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>Az alábbi \\(4\\times4\\)-es nagy négyzet minden kis négyzetét kifestjük egy-egy színnel úgy, hogy minden \\(2\\times2\\)-es résznégyzetben legyen két azonos színű rácsnégyzet. Legfeljebb hány különböző színt használhatunk egy ilyen kifestésben?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/8_H_A_15.png",
        help1: "Lehetséges, hogy 12 színnel kiszínezzük a négyzetrácsot?",
        help2: "Keressetek minél több színt tartalmazó megfelelő színezést!",
      },
    },
  },
  '258j0w1cn2--feladat': {
    answer: 3087,
    content: {
      hu: {
        problemText: "<p>\\(8887-7888+8877-7788+8777-7778=?\\)</p>",
        help1: "Szedjétek szét az összeadandó tagokat helyiértétkek szerint!",
        help2: "Figyeljetek arra, hogy az adott tagot hozzáadni, vagy kivonni kell!",
      },
    },
  },
  'ck9smeff6e--fullontode-dolgozoi-kedden': {
    answer: 2,
    content: {
      hu: {
        problemText: "<p>A Füllöntöde dolgozói kedden, szerdán és vasárnap igazat mondanak, a hét többi napján hazudnak. Egyik nap délelőttjén a Füllöntöde egy dolgozója ezt mondta: <i>Csütörtök van.</i> Pár perccel később pedig egy munkatársa ezt állította: <i>Tegnapelőtt hazudós nap volt.</i></p><p>Hány éjszaka volt hátra a következő vasárnapig?</p>",
        help1: "Lehetett a mai napon igazat mondó nap?",
        help2: "Két napja igazat mondó nap volt.",
      },
    },
  },
  'ze4qi4zs3a--alpesi-siversenyeken-egyenkent': {
    answer: 2,
    content: {
      hu: {
        problemText: "<p>Alpesi síversenyeken egyenként csúsznak le a versenyzők, a soron következő síelő azután indul, hogy az előző célba ért. A tévés közvetítések során, amint célba ér valaki, rögtön kiírják a képernyőre, hogy hányadik leggyorsabb volt az addig célba értek közül.<br>Egy versenyen nyolcan indultak, az élő közvetítésben sorban a következő nevek és helyezési számok jelentek meg:</p><p><center><i>Reichelt 1; Svindal 1; Jansrud 2; Pinturault 3; Küng 4; Hirscher 1; Ligety 3; Miller 2 </i></center></p><p>Hányadikként indult az a versenyző, aki a verseny végén a bronzérmet kapta?</p>",
        help1: "Írjátok le az eredménylista alakulását minden egyes lesiklás után!",
        help2: "Egy versenyző akkor kerül lejjebb az eredménylistán, ha valaki, aki őt követi, legalább ugyanolyan helyen kerül fel az eredménylistára.",
      },
    },
  },
  'wf8wqkhp46--viragboltban-rozsat-tulipant': {
    answer: 15,
    content: {
      hu: {
        problemText: "<p>Egy virágboltban rózsát, tulipánt és gerberát árulnak. Négy szál virágból álló csokrot szeretnénk vásárolni. Két csokrot akkor tekintünk egyformának, ha mindhárom fajta virágból ugyanannyi szál van benne. Hányféle különböző csokrot lehet köttetni?<br><i>Nem kell mindhárom fajta virágnak benne lennie a csokorban.</i></p>",
        help1: "Hányféle olyan csokor van, amelyben pontosan egyféle virág van?",
        help2: "Hányféle olyan csokor van, amelyben pontosan kétféle virág van?",
      },
    },
  },
  'rdxtkvj2qe--rajzoltunk-negyzetracsot-fogtuk': {
    answer: 50,
    content: {
      hu: {
        problemText: "<p>Rajzoltunk egy \\(4\\times4\\)-es négyzetrácsot, majd fogtuk a 16 kis négyzet középpontjait, és ezekre négyesével egy-egy újabb négyzetet rajzoltunk. Összesen hány olyan négyzet van, amit a rajz fekete vonalai határolnak? </p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/8_H_B_6.png",
        help1: "Hány olyan négyzet szerepel az ábrán, amely tartalmazza a középpontok közötti vonalak valamelyikét?",
        help2: "Azon az ábrán lévő négyzeteket, amelyek nem a középpontok közötti vonala valamelyike által vannak határolva, osszátok oldalhossz szerint csoportokba!",
      },
    },
  },
  'ipyyd180og--tizenket-ember-asztal': {
    answer: 10,
    content: {
      hu: {
        problemText: "<p>Tizenkét ember ül egy asztal körül: lovagok és lókötők. Mindegyikük a következő állítást tette: <i>„Magamról és a szomszédaimról nem nyilatkozom, de a többiek mindegyike lókötő\"</i>. Hány lókötő ül az asztalnál, ha tudjuk, hogy a lókötők mindig hazudnak, a lovagok pedig mindig igazat mondanak?</p>",
        help1: "Ülhet legalább 3 lovag az asztalnál?",
        help2: "Lehetséges, hogy nem ül egy lovag sem az asztalnál?",
      },
    },
  },
  'fmyzj2afqb--elso-gorog-betut': {
    answer: 4,
    content: {
      hu: {
        problemText: "<p>Az első ábrán egy a görög \\(\\pi\\) betűt formázó sokszög látható. Ezt felbontottunk néhány sorszámozott részre. A részekből összeállítottunk egy négyzetet, ennek egy részét látjátok a második ábrán.</p><p>Mennyi a szürke négyzetbe belemetsző darabok sorszámainak összege?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/8_H_B_8.png",
        help1: "Lehetséges, hogy az 1-es darab kerüljön az 5-ös mellé?",
        help2: "Lehetséges, hogy a 2-es vagy 4-es darab kerüljön az 5-ös mellé?",
      },
    },
  },
  'l3oz4vzhx0--varosban-ferfiak-resze': {
    answer: 31,
    content: {
      hu: {
        problemText: "<p>Egy városban a férfiak \\(\\frac23\\) része, a nők \\(\\frac35\\) része él házasságban.<br>A város lakóinak hányadrésze él házasságban?<br><i>A válasz a kapott tört legegyszerűbb alakjában a számláló és a nevező összege. Mindenkinek csak egy férje ill. felesége lehet, házasságot csak egy férfi és nő köttethet egymással, és a házastárs ugyanabban a városban lakik.</i></p>",
        help1: "Vezessetek be jelölést a házasságok számára!",
        help2: "A bevezetett jelölést 5/2+3/2 -el megszorozva megkapjuk a városban élő férfi és női lakosok számát.",
      },
    },
  },
  'mnxfddza3l--tanar-felir-tablara': {
    answer: 15,
    content: {
      hu: {
        problemText: "<p>Egy tanár felír a táblára egy pozitív egész számot, majd sorban minden diák mond egy állítást erről a számról:</p><p><center><ul style=\"list-style-type:none;\"><li>1. A szám osztható 2-vel.<li>2. A szám osztható 3-mal.<li>3. A szám osztható 4-gyel.<li>\\(\\vdots\\)<li>30. A szám osztható 31-gyel.</ul>/cente></p><p>Hányadiknak hangzott el az első helytelen állítás, ha tudjuk, hogy két egymást követő gyerek kivételével mindenki igaz állítást mondott?</p>",
        help1: "Lehetséges-e, hogy a kérdezett állítás 15-nél kisebb osztást állít?",
        help2: "Az első állítás az, hogy 2-vel osztható a szám.",
      },
    },
  },
  '96rwtvippt--egyenloszaru-haromszoget-kulonlegesnek': {
    answer: 36,
    content: {
      hu: {
        problemText: "<p>Egy egyenlőszárú háromszöget különlegesnek nevezünk, ha az egyik belső szögfelezője két egyenlőszárú háromszögre vágja szét. Albert megkereste a különleges egyenlőszárú háromszögekben előforduló lehető legkisebb szöget. Hány fokos ez a szög?</p>",
        help1: "Két háromszög alakul ki, ami lehet egyenlő szárú a felvágásnál.",
        help2: "Mindkét esetben számoljatok szögeket!",
      },
    },
  },
  '11j7bfzt4r--otjegyu-szamot-csupa': {
    answer: 27,
    content: {
      hu: {
        problemText: "<p>Egy ötjegyű számot, amely csupa különböző számjegyből áll, megszoroztunk néggyel. Így egy olyan ötjegyű számot kaptunk, amelyet ugyanazok a számjegyek alkotnak, de most épp fordított sorrendben. Mennyi ennek a számnak a jegyeinek az összege?</p>",
        help1: "Mivel a számunkat 4-gyel megszorozva ötjegyű számot kapunk, az első jegy 1-es vagy kettes. Megfordítva párosnak kell legyen, így kettessel kezdődik.",
        help2: "Mivel az utolsó jegy 8-as, a második jegy legfeljebb 2 lehet, tehát 0 vagy 1.",
      },
    },
  },
  'uuxh6mshqj--jobb-oldali-nagy': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>A jobb oldali \\(4\\times4\\)-es nagy négyzet minden kis négyzetét kifestjük egy-egy színnel úgy, hogy minden \\(2\\times2\\)-es résznégyzetben legyen két azonos színű rácsnégyzet. Legfeljebb hány különböző színt használhatunk egy ilyen kifestésben?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/8_H_B_13.png",
        help1: "Lehetséges, hogy 12 színnel kiszínezzük a négyzetrácsot?",
        help2: "Keressetek minél több színt tartalmazó megfelelő színezést!",
      },
    },
  },
  'a45l5ewd27--szabalyos-nyolcszog-csucsat': {
    answer: 30,
    content: {
      hu: {
        problemText: "<p>Egy szabályos nyolcszög minden csúcsát be kell színeznünk pirosra, kékre vagy zöldre úgy, hogy szomszédos csúcsok ne legyenek azonos színűek. Hányféleképpen tehetjük ezt meg, ha a nyolcszög forgatásával vagy tengelyes tükrözésével egymásba vihető színezéseket nem tekintjük különbözőknek?</p>",
        help1: "Hányféle kitöltés van, ha csak kétféle színt használunk?",
        help2: "Azokat a kitöltéseket, amikor három színt használunk, szedjétek aszerint csoportokba, hogy hány csúcs van az adott színből!",
      },
    },
  },
  's6jeep5jrh--hatarozzuk-legnagyobb-szamot': {
    answer: 5251,
    content: {
      hu: {
        problemText: "<p>Határozzuk meg a legnagyobb olyan pozitív egész számot, amely pontosan egyféleképpen írható fel</p><p><center>99x+100y+101z</center></p><p>alakban úgy, hogy az \\(x\\), \\(y\\) és \\(z\\) egyaránt pozitív egész számok legyenek!</p>",
        help1: "Nézzetek maradékokat!",
        help2: "Nézzetek 99-es és 101-es maradékokat!",
      },
    },
  },
};
