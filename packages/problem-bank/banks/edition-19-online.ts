import type { CompetitionBank, ProblemBank } from '../src/sources';

// Edition 19's online round, relay only, as the relay practice site serves it: one
// competition per category, and the problems their relays use, each written
// once. Released, so the practice site may import it.

export const competitions: CompetitionBank = {
  'oxhy1gzqgo--19-online-c': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: '4ammq4jxmz--abel-bolhapiacon-kalapot', points: 3 },
        { problemId: '7sjhzxoevv--beirni-ures-negyzetekbe', points: 3 },
        { problemId: 'h8zk2rz6i1--legkisebb-szam-amelyben', points: 4 },
        { problemId: 'wsq5ut0d33--vandor-erdobol-kiralyi', points: 4 },
        { problemId: '1xykmqmyhg--szampart-szep-nevezunk', points: 4 },
        { problemId: 'hxvku1zcwt--holle-anyo-teglalap', points: 5 },
        { problemId: 'rnsup44xl8--kitti-szefjet-szamjegybol', points: 5 },
        { problemId: 'bj4h27u1th--toltsetek-tablazat-mezoit', points: 6 },
        { problemId: 'hwyt6ghg0x--lathato-kek-hatszog', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 19, round: 'online', category: 'C' },
  },
  'wa72dtu688--19-online-d': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: '4ammq4jxmz--abel-bolhapiacon-kalapot', points: 3 },
        { problemId: '9zcytf93ng--beirni-ures-negyzetekbe', points: 3 },
        { problemId: 'wsq5ut0d33--vandor-erdobol-kiralyi', points: 4 },
        { problemId: 'hxvku1zcwt--holle-anyo-teglalap', points: 4 },
        { problemId: 'pkcisdh8ld--ron-harry-hermione', points: 4 },
        { problemId: 'bj4h27u1th--toltsetek-tablazat-mezoit', points: 5 },
        { problemId: 'gtuqgrmj1n--lathato-kek-hatszog', points: 5 },
        { problemId: '2ocnoxifdh--tablazatot-tolteni-szamokkal', points: 6 },
        { problemId: 'gracmb67oo--gandalf-buvos-nevezi', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 19, round: 'online', category: 'D' },
  },
  'j9y0ga3led--19-online-e': {
    languages: ['hu'],
    relay: {
      durationMinutes: 60,
      problems: [
        { problemId: 'wsq5ut0d33--vandor-erdobol-kiralyi', points: 3 },
        { problemId: 'hxvku1zcwt--holle-anyo-teglalap', points: 3 },
        { problemId: 'pkcisdh8ld--ron-harry-hermione', points: 4 },
        { problemId: 'bj4h27u1th--toltsetek-tablazat-mezoit', points: 4 },
        { problemId: 'hwyt6ghg0x--lathato-kek-hatszog', points: 4 },
        { problemId: '2ocnoxifdh--tablazatot-tolteni-szamokkal', points: 5 },
        { problemId: 'gracmb67oo--gandalf-buvos-nevezi', points: 5 },
        { problemId: 'ffphwga9t3--viki-szabalyos-dobokockaval', points: 6 },
        { problemId: 'qjov5bn40b--tizenegy-szambol-allo', points: 6 },
      ],
    },
    metadata: { kind: 'competition', edition: 19, round: 'online', category: 'E' },
  },
};

export const problems: ProblemBank = {
  '4ammq4jxmz--abel-bolhapiacon-kalapot': {
    answer: 133,
    content: {
      hu: {
        problemText: "Ábel a bolhapiacon 5 kalapot 2 madáretetőre tud elcserélni, illetve 3 madáretetőért 7 tányért kap. Legfeljebb hány tányérra tudja elcserélni Ábel a 35 kalapját és a 43 madáretetőjét a bolhapiacon?",
      },
    },
  },
  '7sjhzxoevv--beirni-ures-negyzetekbe': {
    answer: 4,
    content: {
      hu: {
        problemText: "Hányféleképpen lehet beírni az üres négyzetekbe egy-egy alapműveleti jelet ($+, -, \\times, \\div$) úgy, hogy igaz legyen az egyenlőség? \\[1\\ \\square\\ 1\\ \\square\\ 1=2\\] \\\\ \\textit{Az alapműveleteken kívül mást (pl. zárójeleket) nem lehet használni. A műveleteket a műveleti sorrendnek megfelelő módon kell elvégezni.}",
      },
    },
  },
  'h8zk2rz6i1--legkisebb-szam-amelyben': {
    answer: 5599,
    content: {
      hu: {
        problemText: "Melyik a legkisebb pozitív egész szám, amelyben a számjegyek szorzata 2025?",
      },
    },
  },
  'wsq5ut0d33--vandor-erdobol-kiralyi': {
    answer: 40,
    content: {
      hu: {
        problemText: "Egy vándor az erdőből a királyi palotába szeretne eljutni. Mezős területen 2 nap alatt, dombos területen 8 nap alatt, míg hegyes területen 13 nap alatt tud keresztülvágni. Legalább hány nap kell a vándornak ahhoz, hogy el tudjon jutni az erdőből a palotához, ha mindig csak oldalszomszédos területre tud átmenni? \\\\ \\textit{Az ábrán $E$-vel jelölt terület az erdő, míg a $P$-vel jelölt a palota. A mezőket fehér, a dombokat szürke, a hegyeket fekete szín jelöli. Az útba nem számít bele az erdő és a palota területe.}",
        imageUrl: "https://durerimages.s3.eu-north-1.amazonaws.com/19o/cx7ishVhPcLsCDQE-vandor.png",
      },
    },
  },
  '1xykmqmyhg--szampart-szep-nevezunk': {
    answer: 8,
    content: {
      hu: {
        problemText: "Egy számpárt \\textit{szép}nek nevezünk, ha a két tagjának szorzata osztható $12$-vel. Legfeljebb hány különböző egész számot lehet kiválasztani a $12$-nél nem nagyobb pozitív egészek közül úgy, hogy semelyik két kiválasztott szám ne alkosson szép számpárt?",
      },
    },
  },
  'hxvku1zcwt--holle-anyo-teglalap': {
    answer: 2200,
    content: {
      hu: {
        problemText: "Holle anyó téglalap alakú kertjének oldalai $40$ és $80$ méter hosszúak. A kert két sarkába rózsát, az egyik oldal felezőpontjába és egy harmadik sarokba pedig levendulát ültetett az ábrán látható módon. A kert egy pontjában annak a növénynek érezzük az illatát, amelyikhez a legközelebb vagyunk. A kertben hány négyzetméternyi területen érzünk levendulaillatot? \\\\ \\textit{Ha a kétféle növénytől ugyanolyan messze vagyunk, akkor mindkét illatot érezzük.}",
        imageUrl: "https://durerimages.s3.eu-north-1.amazonaws.com/19o/clihgCmk7tF1dyCl-geo_kert.png",
      },
    },
  },
  'rnsup44xl8--kitti-szefjet-szamjegybol': {
    answer: 8488,
    content: {
      hu: {
        problemText: "Kitti széfjét egy hat számjegyből álló számzár védi. A kódról tudjuk, hogy van benne két azonos számjegy. Hányféle lehet ezek alapján Kitti kódja? \\textbf{Válaszként az eredmény első négy jegyét adjátok meg!} \\\\ \\textit{A széf kódja kezdődhet 0-val.}",
      },
    },
  },
  'bj4h27u1th--toltsetek-tablazat-mezoit': {
    answer: 312,
    content: {
      hu: {
        problemText: "Töltsétek ki az alábbi $3 \\times 3$-as táblázat mezőit a 0, 1, 2, 3, 4, 5, 6, 7, 8 számjegyek mindegyikét pontosan egyszer használva, úgy, hogy a sorokban balról jobbra, és az oszlopokban fentről lefelé kiolvasható háromjegyű számok oszthatóak legyenek a sor, illetve oszlop végén lévő számmal. Melyik háromjegyű szám olvasható ki az első sorból? \\\\ \\textit{A sorok és oszlopok első mezőjébe nem kerülhet 0.}",
        imageUrl: "https://durerimages.s3.eu-north-1.amazonaws.com/19o/UpvXdoGFEJHZA56V-3x3.png",
      },
    },
  },
  'hwyt6ghg0x--lathato-kek-hatszog': {
    answer: 5600,
    content: {
      hu: {
        problemText: "Az ábrán látható kék hatszög minden szöge ugyanakkora, területe $1820$ egység, az oldalainak aránya sorban a következő: $$1:2:1:2:1:2$$. Az oldalegyenesek metszéspontjait az ábrán látható módon összekötve kapunk egy nagyobb hatszöget. Hány egység a nagy hatszög területe?",
        imageUrl: "https://durerimages.s3.eu-north-1.amazonaws.com/19o/SPHlriToBM5z92YK-hatszog_terulet.png",
      },
    },
  },
  '9zcytf93ng--beirni-ures-negyzetekbe': {
    answer: 6,
    content: {
      hu: {
        problemText: "Hányféleképpen lehet beírni az üres négyzetekbe egy-egy alapműveleti jelet ($+, -, \\times, \\div$) úgy, hogy igaz legyen az egyenlőség? \\[1\\ \\square\\ 1\\ \\square\\ 1\\ \\square\\ 1=3\\] \\\\ \\textit{Az alapműveleteken kívül mást (pl. zárójeleket) nem lehet használni. A műveleteket a műveleti sorrendnek megfelelő módon kell elvégezni.}",
      },
    },
  },
  'pkcisdh8ld--ron-harry-hermione': {
    answer: 360,
    content: {
      hu: {
        problemText: "Ron, Harry és Hermione ebben a sorrendben állnak egy egyenes mentén a Tiltott Rengetegben. Meghallanak egy morajlást, mire Harry ijedten Hermione felé fut úgy, hogy a köztük lévő távolságot megfelezze. Erre Ron is feleszmél, így Harry felé fut úgy, hogy a köztük lévő jelenlegi távolság a felére csökkenjen. Ezután Hermione fut Ron felé szintén úgy, hogy a köztük lévő jelenlegi távolságot megfelezze. Végül Harry és Hermione ugyanott állnak, és mindketten 180 méterre vannak Rontól. Hány méterre volt egymástól eredetileg Harry és Hermione?",
      },
    },
  },
  'gtuqgrmj1n--lathato-kek-hatszog': {
    answer: 5600,
    content: {
      hu: {
        problemText: "Az ábrán látható kék hatszög minden szöge ugyanakkora, területe $1820$ egység, az oldalainak aránya sorban a következő $$1:2:1:2:1:2$$. Az oldalegyenesek metszéspontjait az ábrán látható módon összekötve kapunk egy nagyobb hatszöget. Hány egység a nagy hatszög területe?",
        imageUrl: "https://durerimages.s3.eu-north-1.amazonaws.com/19o/SPHlriToBM5z92YK-hatszog_terulet.png",
      },
    },
  },
  '2ocnoxifdh--tablazatot-tolteni-szamokkal': {
    answer: 5184,
    content: {
      hu: {
        problemText: "Egy $3\\times 3$-as táblázatot ki szeretnénk tölteni az $1$, $2$, $3$, $4$, $5$, $6$, $7$, $8$, $9$ számokkal úgy, hogy minden mezőbe pontosan egy szám kerüljön és minden számot pontosan egyszer használjunk. Hányféleképpen lehet ezt megtenni úgy, hogy minden sorban, oszlopban és a két átlóban is hárommal osztható legyen a számok összege?",
      },
    },
  },
  'gracmb67oo--gandalf-buvos-nevezi': {
    answer: 1210,
    content: {
      hu: {
        problemText: "Gandalf \\textit{bűvös}nek nevezi azokat a számokat, amelyek harmadik legnagyobb osztója $55$. Legolas egy napon nagyon unatkozott, így megkereste az összes bűvös számot, majd összeadta őket. Milyen eredményt kapott Legolas?",
      },
    },
  },
  'ffphwga9t3--viki-szabalyos-dobokockaval': {
    answer: 311,
    content: {
      hu: {
        problemText: "Viki négy szabályos dobókockával dob egyszerre. Akkor tekinti a dobását sikeresnek, ha a négy dobott szám között lesz kettő, melyek összege 6, 7 vagy 8. Mi a valószínűsége annak, hogy Viki egy dobása sikeres? \\textbf{Válaszként a tört egyszerűsített alakjában a számláló és a nevező összegét adjátok meg!}",
      },
    },
  },
  'qjov5bn40b--tizenegy-szambol-allo': {
    answer: 74,
    content: {
      hu: {
        problemText: "Egy tizenegy pozitív egész számból álló sorozat első tagja 1, az utolsó pedig 1001. Tudjuk, hogy a sorozat második tagjától kezdve mindegyik számra igaz, hogy legalább akkora, mint az azt megelőző tag, de legfeljebb annak a kétszerese. Hányféle ilyen sorozat van?",
      },
    },
  },
};
