import type { CompetitionBank, ProblemBank } from '../src/sources';

// Edition 11's local round, relay only, as the relay practice site serves it: one
// competition per category, and the problems their relays use, each written
// once. Released, so the practice site may import it.

export const competitions: CompetitionBank = {
  'v3f919p3ya--11-local-a': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'j7eqd7sonw--szurke-negyzetbol-all', points: 3 },
        { problemId: 'g9y5849hmm--juhasznak-baranya-egyik', points: 3 },
        { problemId: '6f1ommz8m9--albrecht-vette-legkisebb', points: 3 },
        { problemId: 'v97o9y8ybk--szam-amelynek-ketszerese', points: 3 },
        { problemId: '69cm6t8n2m--gyufasdobozunk-melyekben-jelenleg', points: 4 },
        { problemId: 'n3kp1oxpru--mikkamakka-vacskamati-szigfrid', points: 4 },
        { problemId: '87vgxdn58s--oldalhosszusagu-negyzet-alaku', points: 4 },
        { problemId: '1ulh74e71c--testverpar-mindket-tagja', points: 4 },
        { problemId: 'hlgb5s3td4--kis-haromszoge-feketere', points: 5 },
        { problemId: 'wnxwp72kdx--lakotelepen-hazat-epitenek', points: 5 },
        { problemId: 'u0h02ufywl--tom-eszreveszi-jerry', points: 5 },
        { problemId: '56cdg5xjgs--kulonbozo-szamot-megadni', points: 5 },
        { problemId: 'j6yuj0ir2q--bergengocia-jarasanak-falujat', points: 6 },
        { problemId: '3ulcb6u743--cinegecsaladban-himnek-perc', points: 6 },
        { problemId: '26n5ja65wc--martin-martina-marcell', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 11, round: 'local', category: 'A' },
  },
  'd1acvde8qh--11-local-b': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'ammgftn0y3--matuzsalem-iden-eves', points: 3 },
        { problemId: 'v97o9y8ybk--szam-amelynek-ketszerese', points: 3 },
        { problemId: '5clsdluhoy--gyufasdobozunk-melyekben-jelenleg', points: 3 },
        { problemId: 'csqs64khfu--oldalhosszusagu-negyzet-alaku', points: 3 },
        { problemId: '1ulh74e71c--testverpar-mindket-tagja', points: 4 },
        { problemId: 'epy00ro7yu--kis-haromszoge-feketere', points: 4 },
        { problemId: 'mqrc2tj8a1--lakotelepen-hazat-epitenek', points: 4 },
        { problemId: 'u0h02ufywl--tom-eszreveszi-jerry', points: 4 },
        { problemId: 'keeo5nlrva--fiu-lany-satrazni', points: 5 },
        { problemId: 'a55volgi2f--bergengocia-jarasanak-falujat', points: 5 },
        { problemId: '3ulcb6u743--cinegecsaladban-himnek-perc', points: 5 },
        { problemId: '71afl0041s--oxiszi-versenyen-feladatot', points: 5 },
        { problemId: 'sxp8x1kh8j--kulonbozo-szamot-megadni', points: 6 },
        { problemId: 'i1kcqrsm4a--fules-egyik-teli', points: 6 },
        { problemId: 'hkoncffsce--martin-martina-marcell', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 11, round: 'local', category: 'B' },
  },
};

export const problems: ProblemBank = {
  'j7eqd7sonw--szurke-negyzetbol-all': {
    answer: 58,
    content: {
      hu: {
        problemText: "<p>Hány szürke négyzetből áll az alábbi ábra?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_H_A_1.png",
        help1: "Számozd meg a négyzeteket!",
        help2: "Számold meg betűnként külön-külön.",
      },
    },
  },
  'g9y5849hmm--juhasznak-baranya-egyik': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>Egy juhásznak 33 báránya volt. Egyik nap eladta a bárányok harmadát a vásárban. A következő héten sajnos a bárány-járvány miatt a megmaradt bárányok közül hét kivételével az összes megbetegedett. Hány egészséges báránya maradt a juhásznak?</p>",
        help1: "Olvasd el, hogy biztos a kérdésre válaszoltál-e!",
        help2: "Ez egy becsapós feladat, nézd meg még egyszer!",
      },
    },
  },
  '6f1ommz8m9--albrecht-vette-legkisebb': {
    answer: 6,
    content: {
      hu: {
        problemText: "<p>Albrecht vette a 11 legkisebb, csak 1-es számjegyekből álló számot:</p><p><center>1, 11, 111, 1111, 11111, 111111, 1111111, 11111111, 111111111, 1111111111, 11111111111</center></p><p>Először vette ezek közül azokat, amelyek páratlan sok 1-esből állnak, és összeadta őket. Másodszor vette azokat, amelyek páros sok 1-esből állnak, és ezeket is összeadta. Végül az első összegből kivonta a második összeget. Mennyi a kapott szám jegyeinek összege?</p>",
        help1: "Próbáld meg más sorrendben elvégezni a műveleteket!",
        help2: "(11-1)+(1111-111)+...",
      },
    },
  },
  'v97o9y8ybk--szam-amelynek-ketszerese': {
    answer: 16,
    content: {
      hu: {
        problemText: "<p>Hány olyan pozitív egész szám van, amelynek a kétszerese kétjegyű, míg a háromszorosa háromjegyű?</p>",
        help1: "Melyik a legkisebb szám, ami teljesíti a feltételt?",
        help2: "Melyik a legnagyobb szám, ami teljesíti a feltételt?",
      },
    },
  },
  '69cm6t8n2m--gyufasdobozunk-melyekben-jelenleg': {
    answer: 12,
    content: {
      hu: {
        problemText: "<p>Van 4 gyufásdobozunk, melyekben jelenleg 15, 27, 31 és 19 gyufa van. Egy lépésben egy gyufát áttehetünk az egyik dobozból egy másikba. Legkevesebb hány lépéssel lehet elérni, hogy minden dobozban ugyanannyi gyufa legyen?</p>",
        help1: "Hány gyufának kell lennie egy dobozban?",
        help2: "Minden lépésben rakj a legtöbb gyufát tartalmazó dobozból a legkevesebbet tartalmazóba!",
      },
    },
  },
  'n3kp1oxpru--mikkamakka-vacskamati-szigfrid': {
    answer: 10,
    content: {
      hu: {
        problemText: "<p>Mikkamakka, Vacskamati, Szigfrid, Aromó és Dömdödöm sátrazni megy. Hányféleképpen alhatnak egy két- és egy háromfős sátorban? (Csak az számít, hogy kik vannak egysátorban.)</p>",
        help1: "Hányféleképpen lehet kiválasztani 2 embert a kétfős sátorhoz?",
        help2: "Próbáld az összes esetet felírni!",
      },
    },
  },
  '87vgxdn58s--oldalhosszusagu-negyzet-alaku': {
    answer: 78,
    content: {
      hu: {
        problemText: "<p>Egy 12 cm oldalhosszúságú négyzet alakú kartonpapírból kivágtunk egy alakzatot, hogy utána dobozt tudjunk belőle hajtogatni. Hány cm<sup>2</sup> a kivágott (szürke) rész területe?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_H_A_7.png",
        help1: "Számítsd ki külön-külön a részek nagyságát!",
        help2: "Rakd össze a háromszögeket úgy, hogy téglalapokat kapj!",
      },
    },
  },
  '1ulh74e71c--testverpar-mindket-tagja': {
    answer: 18,
    content: {
      hu: {
        problemText: "<p>Egy testvérpár mindkét tagja november 10-én született, de különböző években. Mindkettőjükre igaz, hogy ma annyi évesek, mint a születési évszámukban a számjegyek összege. Hány évvel idősebb az egyikük a másiknál?</p>",
        help1: "A feladat 2017-re szól!",
        help2: "Keressétek meg külön-külön a két lehetséges évszámot!",
      },
    },
  },
  'hlgb5s3td4--kis-haromszoge-feketere': {
    answer: 9,
    content: {
      hu: {
        problemText: "<p>Legalább hányat kell az alábbi ábra 36 kis háromszöge közül feketére festeni ahhoz, hogy minden fehéren maradt kis háromszögnek legyen közös oldala feketére festett kis háromszöggel?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_H_A_9.png",
        help1: "Hány háromszöget fog le egy fekete háromszög?",
        help2: "Hány darab 2 oldalhosszúságú háromszög kell a nagy háromszög lefedéséhez?",
      },
    },
  },
  'wnxwp72kdx--lakotelepen-hazat-epitenek': {
    answer: 6,
    content: {
      hu: {
        problemText: "<p>Egy lakótelepen 16 új házat építenek, egy \\(4\\times4\\)-es rács szerint. A kreatív építők úgy tervezték a lakótelepet, hogy minden háznak 1, 2, 3 vagy 4 emelete legyen. Ezenkívül arra is figyeltek, hogy ne legyen két azonos magasságú épület semelyik sorban vagy oszlopban. Annáék egy lakást szeretnének vásárolni, ezért körbejárták a lakótelepet. Néhány sorban, illetve oszlopban felírták, hogy ha onnan benéznek, hány házat látnak. Egy házat akkor lehet látni, ha nincs előtte magasabb ház. A végén úgy döntöttek, hogy az \\(A\\), \\(B\\) vagy \\(C\\) épületben vesznek lakást. Hány emelete van ennek a 3 háznak összesen?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_H_A_10.png",
        help1: "Milyen háznak kell állnia az 1-es mellett, illetve milyennek a 4-es mellett?",
        help2: "Próbáld kihasználni, hogy minden sorba és oszlopba minden ház pontosan egyszer szerepel!",
      },
    },
  },
  'u0h02ufywl--tom-eszreveszi-jerry': {
    answer: 120,
    content: {
      hu: {
        problemText: "<p>Tom észreveszi, hogy Jerry éppen sajtot lop a hűtőből, ezért üldözőbe veszi. Jerry erre azonnal elkezd szaladni Tom elől. Amíg Tom kettőt lép, addig Jerry hármat és Jerry lépései feleakkorák, mint Tom lépései. Hányat kell Tomnak lépnie, hogy utolérje Jerryt, ha Tom 30 lépésben jut el a hűtőig?</p>",
        help1: "Mennyi utat tesz meg Jerry, amíg Tom 2-t lép?",
        help2: "Mennyit közeledik Tom egy lépéssel Jerryhez?",
      },
    },
  },
  '56cdg5xjgs--kulonbozo-szamot-megadni': {
    answer: 5,
    content: {
      hu: {
        problemText: "<p>Legfeljebb hány különböző pozitív egész számot lehet megadni úgy, hogy semelyik kettő összege és semelyik kettő különbsége se legyen osztható 8-cal?</p>",
        help1: "Nem vehetünk bele két olyan számot, ami 8-cal osztva ugyanazt a maradékot adja.",
        help2: "Az előző segítség miatt elég csak a 0 és 7 közti számokat megnézni.",
      },
    },
  },
  'j6yuj0ir2q--bergengocia-jarasanak-falujat': {
    answer: 42,
    content: {
      hu: {
        problemText: "<p>Az ábrán Bergengócia egy járásának kilenc faluját \\((A\\), \\(B\\), \\(C\\), \\(D\\), \\(E\\), \\(F\\), \\(G\\), \\(H\\), \\(I)\\) ábrázolták az őket összekötő utakkal együtt. A térképre sajnos nem írták rá a városok neveit, csak besorszámozták őket.Tudjuk, hogy két buszos körjárat is közlekedik a járásban: az egyik \\(A\\), \\(B\\), \\(C\\), \\(D\\), \\(E], /[A\\) a másik \\(G\\), \\(B\\), \\(D\\), \\(E\\), \\(A\\), \\(F\\), \\(G\\) sorrendben járja be a falvakat. <i>A buszok csak az utakon közlekednek, és nem mennek át megállás nélkül egy falun sem.</i> Milyen számot kapunk, ha \\(A\\) és \\(C\\) városok sorszámát összeszorozzuk?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_H_A_13.png",
        help1: "Melyik városnak kell az 5-ös csúcsban lennie?",
        help2: "Melyek az a városok, amelynek legalább 3 szomszédja van?",
      },
    },
  },
  '3ulcb6u743--cinegecsaladban-himnek-perc': {
    answer: 24,
    content: {
      hu: {
        problemText: "<p>Egy cinegecsaládban a hímnek 4 perc, a tojónak pedig 5 perc kell ahhoz, hogy találjon egy kukacot és azzal visszatérjen az odúhoz. Az etetéssel mindkét madár mindig egy percet tölt bent az odúban. Mindketten reggel 6-tól este 6-ig gyűjtik a kukacokat. Hány percet töltenek együtt ezalatt az odúban?</p>",
        help1: "Milyen gyakran vannak egyszerre a fészekben?",
        help2: "Mennyi időt töltenek 1 óra alatt együtt a fészekben?",
      },
    },
  },
  '26n5ja65wc--martin-martina-marcell': {
    answer: 75,
    content: {
      hu: {
        problemText: "<p>Martin, Martina, Marcell és Marcella maratonon indultak. Hányféle sorrendben érhettek célba, ha köztük holtverseny is lehetett (azaz elképzelhető, hogy egyszerre ketten vagy többen is beértek a célba)?</p>",
        help1: "Hányféle különböző megoldás van, ha csak azt nézzük, hogy hol van holtverseny?",
        help2: "Melyik esetben hány lehetőség van az előző felbontásban?",
      },
    },
  },
  'ammgftn0y3--matuzsalem-iden-eves': {
    answer: 4,
    content: {
      hu: {
        problemText: "<p>Matuzsálem idén lesz 101 éves. Ez azért érdekes, mert életkora egy négyzetszámról épp egy prímszámra fog változni. Hányszor történt ilyen vele ezelőtt?</p>",
        help1: "Milyen négyzetszámok voltak eddig?",
        help2: "Nézd végig az eseteket!",
      },
    },
  },
  '5clsdluhoy--gyufasdobozunk-melyekben-jelenleg': {
    answer: 7,
    content: {
      hu: {
        problemText: "<p>Van 4 gyufásdobozunk, melyekben jelenleg 20, 25, 28 és 19 gyufa van. Egy lépésben egy gyufát áttehetünk az egyik dobozból egy másikba. Legkevesebb hány lépéssel lehet elérni, hogy minden dobozban ugyanannyi gyufa legyen?</p>",
        help1: "Melyik a legkisebb szám, ami teljesíti a feltételt?",
        help2: "Melyik a legnagyobb szám, ami teljesíti a feltételt?",
      },
    },
  },
  'csqs64khfu--oldalhosszusagu-negyzet-alaku': {
    answer: 78,
    content: {
      hu: {
        problemText: "<p>Egy 12 cm oldalhosszúságú négyzet alakú kartonpapírból kivágtunk egy alakzatot, hogy utána dobozt tudjunk belőle hajtogatni. Hány cm<sup>2</sup> a kivágott (szürke) rész területe?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_H_B_4.png",
        help1: "Számítsd ki külön-külön a részek nagyságát!",
        help2: "Rakd össze a háromszögeket úgy, hogy téglalapokat kapj!",
      },
    },
  },
  'epy00ro7yu--kis-haromszoge-feketere': {
    answer: 9,
    content: {
      hu: {
        problemText: "<p>Legalább hányat kell az alábbi ábra 36 kis háromszöge közül feketére festeni ahhoz, hogy minden fehéren maradt kis háromszögnek legyen közös oldala feketére festett kis háromszöggel?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_H_B_6.png",
        help1: "Hány háromszöget fog le egy fekete háromszög?",
        help2: "Hány darab 2 oldalhosszúságú háromszög kell a nagy háromszög lefedéséhez?",
      },
    },
  },
  'mqrc2tj8a1--lakotelepen-hazat-epitenek': {
    answer: 6,
    content: {
      hu: {
        problemText: "<p>Egy lakótelepen 16 új házat építenek, egy \\(4\\times4\\)-es rács szerint. A kreatív építők úgy tervezték a lakótelepet, hogy minden háznak 1, 2, 3 vagy 4 emelete legyen. Ezenkívül arra is figyeltek, hogy ne legyen két azonos magasságú épület semelyik sorban vagy oszlopban. Annáék egy lakást szeretnének vásárolni, ezért körbejárták a lakótelepet. Néhány sorban, illetve oszlopban felírták, hogy ha onnan benéznek, hány házat látnak. Egy házat akkor lehet látni, ha nincs előtte magasabb ház. A végén úgy döntöttek, hogy az \\(A\\), \\(B\\) vagy \\(C\\) épületben vesznek lakást. Hány emelete van ennek a 3 háznak összesen?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_H_B_7.png",
        help1: "Milyen háznak kell állnia az 1-es mellett, illetve milyennek a 4-es mellett?",
        help2: "Próbáld kihasználni, hogy minden sorba és oszlopba minden ház pontosan egyszer szerepel!",
      },
    },
  },
  'keeo5nlrva--fiu-lany-satrazni': {
    answer: 100,
    content: {
      hu: {
        problemText: "<p>Öt fiú és öt lány sátrazni megy kettő kétfős, illetve kettő háromfős sátorral. Hányféleképpen alhatnak, ha fiúk és lányok nem alhatnak egy sátorban, és csak az számít, hogy kik vannak egy sátorban?</p>",
        help1: "Milyen felosztásban kell a sátraknak lenniük?",
        help2: "Hányféleképpen tud az 5 fiú elhelyezkedni?",
      },
    },
  },
  'a55volgi2f--bergengocia-jarasanak-falujat': {
    answer: 42,
    content: {
      hu: {
        problemText: "<p>Az ábrán Bergengócia egy járásának kilenc faluját \\((A\\), \\(B\\), \\(C\\), \\(D\\), \\(E\\), \\(F\\), \\(G\\), \\(H\\), \\(I)\\) ábrázolták az őket összekötő utakkal együtt. A térképre sajnos nem írták rá a városok neveit, csak besorszámozták őket.Tudjuk, hogy két buszos körjárat is közlekedik a járásban: az egyik \\(A\\), \\(B\\), \\(C\\), \\(D\\), \\(E], /[A\\) a másik \\(G\\), \\(B\\), \\(D\\), \\(E\\), \\(A\\), \\(F\\), \\(G\\) sorrendben járja be a falvakat. <i>A buszok csak az utakon közlekednek, és nem mennek át megállás nélkül egy falun sem.</i> Milyen számot kapunk, ha \\(A\\) és \\(C\\) városok sorszámát összeszorozzuk?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_H_B_10.png",
        help1: "Melyik városnak kell az 5-ös csúcsban lennie?",
        help2: "Melyek az a városok, amelynek legalább 3 szomszédja van?",
      },
    },
  },
  '71afl0041s--oxiszi-versenyen-feladatot': {
    answer: 23,
    content: {
      hu: {
        problemText: "<p>Egy óxiszi versenyen 4 feladatot tűztek ki. A versenyen elindult 50 versenyző egyike sem oldotta meg mind a 4 feladatot, de azt tudjuk, hogy közülük az első feladatot 43-an, a másodikat 34-en, a harmadikat 36-an és a negyediket 37-en oldották meg. Hányan oldották meg a 3. és 4. feladatot is?</p>",
        help1: "Vedd figyelembe, hogy senki nem oldott meg mindent!",
        help2: "Hányan oldottak meg 3 feladatot?",
      },
    },
  },
  'sxp8x1kh8j--kulonbozo-szamot-megadni': {
    answer: 11,
    content: {
      hu: {
        problemText: "<p>Legfeljebb hány különböző pozitív egész számot lehet megadni úgy, hogy semelyik kettő összege és semelyik kettő különbsége se legyen osztható 20-szal?</p>",
        help1: "Nem vehetünk bele két olyan számot, ami 20-szal osztva ugyanazt a maradékot adja.",
        help2: "Az előző segítség miatt elég csak a 0 és 19 közti számokat megnézni.",
      },
    },
  },
  'i1kcqrsm4a--fules-egyik-teli': {
    answer: 8,
    content: {
      hu: {
        problemText: "<p>Füles egyik téli reggel észreveszi, hogy eltűnt a farka. Ezért elhatározza, hogy felkeresi barátait, hátha náluk felejtette. A nagy hó miatt a Százholdas pagonyban csak az ábrán látható utak mentén lehet közlekedni. Hányféle sorrendben látogathatja meg az összes barátját, mielőtt hazaérve megtalálja a farkát az ágy mögött, ha mindenkihez pontosan egyszer szeretne elmenni, és két barátja között nem tér le az egyenes útról, mert fél, hogy különben eltévedne?</p>",
        imageUrl: "https://durerinfo.hu/wp-content/uploads/2019/07/11_H_B_14.png",
        help1: "Figyeljetek arra, hogy minden útnak van egy fordítottja, ami szintén jó megoldás!",
        help2: "Bontsátok szét az eseteket aszerint, hogy kihez indult el először!",
      },
    },
  },
  'hkoncffsce--martin-martina-marcell': {
    answer: 75,
    content: {
      hu: {
        problemText: "<p>Martin, Martina, Marcell, és Marcella maratonon indultak. Hányféle sorrendben érhettek célba, ha köztük holtverseny is lehetett (azaz elképzelhető, hogy egyszerre ketten vagy többen is beértek a célba)?</p>",
        help1: "Hányféle különböző megoldás van, ha csak azt nézzük, hogy hol van holtverseny?",
        help2: "Melyik esetben hány lehetőség van az előző felbontásban?",
      },
    },
  },
};
