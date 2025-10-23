import { State } from 'boardgame.io';
import { MyGameState } from 'game';

type Problem = {
  problemText: string;
  answer: number;
  points: number;
  url?: string;
}

type RelayProblems = {
  C: Problem[];
  D: Problem[];
  E: Problem[];
}

const problems : RelayProblems ={
  C: [
    {
      problemText: "Ábel a bolhapiacon 5 kalapot 2 madáretetőre tud elcserélni, illetve 3 madáretetőért 7 tányért kap. Legfeljebb hány tányérra tudja elcserélni Ábel a 35 kalapját és a 43 madáretetőjét a bolhapiacon?",
      answer: 133,
      points: 3,
    },
    {
      problemText: "Hányféleképpen lehet beírni az üres négyzetekbe egy-egy alapműveleti jelet ($+, -, \\times, \\div$) úgy, hogy igaz legyen az egyenlőség? \\[1\\ \\square\\ 1\\ \\square\\ 1=2\\] \\\\ \\textit{Az alapműveleteken kívül mást (pl. zárójeleket) nem lehet használni. A műveleteket a műveleti sorrendnek megfelelő módon kell elvégezni.}",
      answer: 4,
      points: 3,
    },
    {
      problemText: "Melyik a legkisebb pozitív egész szám, amelyben a számjegyek szorzata 2025?",
      answer: 5599,
      points: 4,
    },
    {
      problemText: "Egy vándor az erdőből a királyi palotába szeretne eljutni. Mezős területen 2 nap alatt, dombos területen 8 nap alatt, míg hegyes területen 13 nap alatt tud keresztülvágni. Legalább hány nap kell a vándornak ahhoz, hogy el tudjon jutni az erdőből a palotához, ha mindig csak oldalszomszédos területre tud átmenni? \\\\ \\textit{Az ábrán $E$-vel jelölt terület az erdő, míg a $P$-vel jelölt a palota. A mezőket fehér, a dombokat szürke, a hegyeket fekete szín jelöli. Az útba nem számít bele az erdő és a palota területe.}",
      answer: 40,
      points: 4,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/19o/cx7ishVhPcLsCDQE-vandor.png",
    },
    {
      problemText: "Egy számpárt \\textit{szép}nek nevezünk, ha a két tagjának szorzata osztható $12$-vel. Legfeljebb hány különböző egész számot lehet kiválasztani a $12$-nél nem nagyobb pozitív egészek közül úgy, hogy semelyik két kiválasztott szám ne alkosson szép számpárt?",
      answer: 8,
      points: 4,
    },
    {
      problemText: "Holle anyó téglalap alakú kertjének oldalai $40$ és $80$ méter hosszúak. A kert két sarkába rózsát, az egyik oldal felezőpontjába és egy harmadik sarokba pedig levendulát ültetett az ábrán látható módon. A kert egy pontjában annak a növénynek érezzük az illatát, amelyikhez a legközelebb vagyunk. A kertben hány négyzetméternyi területen érzünk levendulaillatot? \\\\ \\textit{Ha a kétféle növénytől ugyanolyan messze vagyunk, akkor mindkét illatot érezzük.}",
      answer: 2200,
      points: 5,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/19o/clihgCmk7tF1dyCl-geo_kert.png",
    },
    {
      problemText: "Kitti széfjét egy hat számjegyből álló számzár védi. A kódról tudjuk, hogy van benne két azonos számjegy. Hányféle lehet ezek alapján Kitti kódja? \\textbf{Válaszként az eredmény első négy jegyét adjátok meg!} \\\\ \\textit{A széf kódja kezdődhet 0-val.}",
      answer: 8488,
      points: 5,
    },
    {
      problemText: "Töltsétek ki az alábbi $3 \\times 3$-as táblázat mezőit a 0, 1, 2, 3, 4, 5, 6, 7, 8 számjegyek mindegyikét pontosan egyszer használva, úgy, hogy a sorokban balról jobbra, és az oszlopokban fentről lefelé kiolvasható háromjegyű számok oszthatóak legyenek a sor, illetve oszlop végén lévő számmal. Melyik háromjegyű szám olvasható ki az első sorból? \\\\ \\textit{A sorok és oszlopok első mezőjébe nem kerülhet 0.}",
      answer: 312,
      points: 6,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/19o/UpvXdoGFEJHZA56V-3x3.png",
    },
    {
      problemText: "Az ábrán látható kék hatszög minden szöge ugyanakkora, területe $1820$ egység, az oldalainak aránya sorban a következő: $$1:2:1:2:1:2$$. Az oldalegyenesek metszéspontjait az ábrán látható módon összekötve kapunk egy nagyobb hatszöget. Hány egység a nagy hatszög területe?",
      answer: 5600,
      points: 6,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/19o/SPHlriToBM5z92YK-hatszog_terulet.png",
    },
  ],
  D: [
    {
      problemText: "Ábel a bolhapiacon 5 kalapot 2 madáretetőre tud elcserélni, illetve 3 madáretetőért 7 tányért kap. Legfeljebb hány tányérra tudja elcserélni Ábel a 35 kalapját és a 43 madáretetőjét a bolhapiacon?",
      answer: 133,
      points: 3,
    },
    {
      problemText: "Hányféleképpen lehet beírni az üres négyzetekbe egy-egy alapműveleti jelet ($+, -, \\times, \\div$) úgy, hogy igaz legyen az egyenlőség? \\[1\\ \\square\\ 1\\ \\square\\ 1\\ \\square\\ 1=3\\] \\\\ \\textit{Az alapműveleteken kívül mást (pl. zárójeleket) nem lehet használni. A műveleteket a műveleti sorrendnek megfelelő módon kell elvégezni.}",
      answer: 6,
      points: 3,
    },
    {
      problemText: "Egy vándor az erdőből a királyi palotába szeretne eljutni. Mezős területen 2 nap alatt, dombos területen 8 nap alatt, míg hegyes területen 13 nap alatt tud keresztülvágni. Legalább hány nap kell a vándornak ahhoz, hogy el tudjon jutni az erdőből a palotához, ha mindig csak oldalszomszédos területre tud átmenni? \\\\ \\textit{Az ábrán $E$-vel jelölt terület az erdő, míg a $P$-vel jelölt a palota. A mezőket fehér, a dombokat szürke, a hegyeket fekete szín jelöli. Az útba nem számít bele az erdő és a palota területe.}",
      answer: 40,
      points: 4,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/19o/cx7ishVhPcLsCDQE-vandor.png",
    },
    {
      problemText: "Holle anyó téglalap alakú kertjének oldalai $40$ és $80$ méter hosszúak. A kert két sarkába rózsát, az egyik oldal felezőpontjába és egy harmadik sarokba pedig levendulát ültetett az ábrán látható módon. A kert egy pontjában annak a növénynek érezzük az illatát, amelyikhez a legközelebb vagyunk. A kertben hány négyzetméternyi területen érzünk levendulaillatot? \\\\ \\textit{Ha a kétféle növénytől ugyanolyan messze vagyunk, akkor mindkét illatot érezzük.}",
      answer: 2200,
      points: 4,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/19o/clihgCmk7tF1dyCl-geo_kert.png",
    },
    {
      problemText: "Ron, Harry és Hermione ebben a sorrendben állnak egy egyenes mentén a Tiltott Rengetegben. Meghallanak egy morajlást, mire Harry ijedten Hermione felé fut úgy, hogy a köztük lévő távolságot megfelezze. Erre Ron is feleszmél, így Harry felé fut úgy, hogy a köztük lévő jelenlegi távolság a felére csökkenjen. Ezután Hermione fut Ron felé szintén úgy, hogy a köztük lévő jelenlegi távolságot megfelezze. Végül Harry és Hermione ugyanott állnak, és mindketten 180 méterre vannak Rontól. Hány méterre volt egymástól eredetileg Harry és Hermione?",
      answer: 360,
      points: 4,
    },
    {
      problemText: "Töltsétek ki az alábbi $3 \\times 3$-as táblázat mezőit a 0, 1, 2, 3, 4, 5, 6, 7, 8 számjegyek mindegyikét pontosan egyszer használva, úgy, hogy a sorokban balról jobbra, és az oszlopokban fentről lefelé kiolvasható háromjegyű számok oszthatóak legyenek a sor, illetve oszlop végén lévő számmal. Melyik háromjegyű szám olvasható ki az első sorból? \\\\ \\textit{A sorok és oszlopok első mezőjébe nem kerülhet 0.}",
      answer: 312,
      points: 5,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/19o/UpvXdoGFEJHZA56V-3x3.png",
    },
    {
      problemText: "Az ábrán látható kék hatszög minden szöge ugyanakkora, területe $1820$ egység, az oldalainak aránya sorban a következő $$1:2:1:2:1:2$$. Az oldalegyenesek metszéspontjait az ábrán látható módon összekötve kapunk egy nagyobb hatszöget. Hány egység a nagy hatszög területe?",
      answer: 5600,
      points: 5,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/19o/SPHlriToBM5z92YK-hatszog_terulet.png",
    },
    {
      problemText: "Egy $3\\times 3$-as táblázatot ki szeretnénk tölteni az $1$, $2$, $3$, $4$, $5$, $6$, $7$, $8$, $9$ számokkal úgy, hogy minden mezőbe pontosan egy szám kerüljön és minden számot pontosan egyszer használjunk. Hányféleképpen lehet ezt megtenni úgy, hogy minden sorban, oszlopban és a két átlóban is hárommal osztható legyen a számok összege?",
      answer: 5184,
      points: 6,
    },
    {
      problemText: "Gandalf \\textit{bűvös}nek nevezi azokat a számokat, amelyek harmadik legnagyobb osztója $55$. Legolas egy napon nagyon unatkozott, így megkereste az összes bűvös számot, majd összeadta őket. Milyen eredményt kapott Legolas?",
      answer: 1210,
      points: 6,
    },
  ],
  E: [
    {
      problemText: "Egy vándor az erdőből a királyi palotába szeretne eljutni. Mezős területen 2 nap alatt, dombos területen 8 nap alatt, míg hegyes területen 13 nap alatt tud keresztülvágni. Legalább hány nap kell a vándornak ahhoz, hogy el tudjon jutni az erdőből a palotához, ha mindig csak oldalszomszédos területre tud átmenni? \\\\ \\textit{Az ábrán $E$-vel jelölt terület az erdő, míg a $P$-vel jelölt a palota. A mezőket fehér, a dombokat szürke, a hegyeket fekete szín jelöli. Az útba nem számít bele az erdő és a palota területe.}",
      answer: 40,
      points: 3,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/19o/cx7ishVhPcLsCDQE-vandor.png",
    },
    {
      problemText: "Holle anyó téglalap alakú kertjének oldalai $40$ és $80$ méter hosszúak. A kert két sarkába rózsát, az egyik oldal felezőpontjába és egy harmadik sarokba pedig levendulát ültetett az ábrán látható módon. A kert egy pontjában annak a növénynek érezzük az illatát, amelyikhez a legközelebb vagyunk. A kertben hány négyzetméternyi területen érzünk levendulaillatot? \\\\ \\textit{Ha a kétféle növénytől ugyanolyan messze vagyunk, akkor mindkét illatot érezzük.}",
      answer: 2200,
      points: 3,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/19o/clihgCmk7tF1dyCl-geo_kert.png",
    },
    {
      problemText: "Ron, Harry és Hermione ebben a sorrendben állnak egy egyenes mentén a Tiltott Rengetegben. Meghallanak egy morajlást, mire Harry ijedten Hermione felé fut úgy, hogy a köztük lévő távolságot megfelezze. Erre Ron is feleszmél, így Harry felé fut úgy, hogy a köztük lévő jelenlegi távolság a felére csökkenjen. Ezután Hermione fut Ron felé szintén úgy, hogy a köztük lévő jelenlegi távolságot megfelezze. Végül Harry és Hermione ugyanott állnak, és mindketten 180 méterre vannak Rontól. Hány méterre volt egymástól eredetileg Harry és Hermione?",
      answer: 360,
      points: 4,
    },
    {
      problemText: "Töltsétek ki az alábbi $3 \\times 3$-as táblázat mezőit a 0, 1, 2, 3, 4, 5, 6, 7, 8 számjegyek mindegyikét pontosan egyszer használva, úgy, hogy a sorokban balról jobbra, és az oszlopokban fentről lefelé kiolvasható háromjegyű számok oszthatóak legyenek a sor, illetve oszlop végén lévő számmal. Melyik háromjegyű szám olvasható ki az első sorból? \\\\ \\textit{A sorok és oszlopok első mezőjébe nem kerülhet 0.}",
      answer: 312,
      points: 4,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/19o/UpvXdoGFEJHZA56V-3x3.png",
    },
    {
      problemText: "Az ábrán látható kék hatszög minden szöge ugyanakkora, területe $1820$ egység, az oldalainak aránya sorban a következő: $$1:2:1:2:1:2$$. Az oldalegyenesek metszéspontjait az ábrán látható módon összekötve kapunk egy nagyobb hatszöget. Hány egység a nagy hatszög területe?",
      answer: 5600,
      points: 4,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/19o/SPHlriToBM5z92YK-hatszog_terulet.png",
    },
    {
      problemText: "Egy $3\\times 3$-as táblázatot ki szeretnénk tölteni az $1$, $2$, $3$, $4$, $5$, $6$, $7$, $8$, $9$ számokkal úgy, hogy minden mezőbe pontosan egy szám kerüljön és minden számot pontosan egyszer használjunk. Hányféleképpen lehet ezt megtenni úgy, hogy minden sorban, oszlopban és a két átlóban is hárommal osztható legyen a számok összege?",
      answer: 5184,
      points: 5,
    },
    {
      problemText: "Gandalf \\textit{bűvös}nek nevezi azokat a számokat, amelyek harmadik legnagyobb osztója $55$. Legolas egy napon nagyon unatkozott, így megkereste az összes bűvös számot, majd összeadta őket. Milyen eredményt kapott Legolas?",
      answer: 1210,
      points: 5,
    },
    {
      problemText: "Viki négy szabályos dobókockával dob egyszerre. Akkor tekinti a dobását sikeresnek, ha a négy dobott szám között lesz kettő, melyek összege 6, 7 vagy 8. Mi a valószínűsége annak, hogy Viki egy dobása sikeres? \\textbf{Válaszként a tört egyszerűsített alakjában a számláló és a nevező összegét adjátok meg!}",
      answer: 311,
      points: 6,
    },
    {
      problemText: "Egy tizenegy pozitív egész számból álló sorozat első tagja 1, az utolsó pedig 1001. Tudjuk, hogy a sorozat második tagjától kezdve mindegyik számra igaz, hogy legalább akkora, mint az azt megelőző tag, de legfeljebb annak a kétszerese. Hányféle ilyen sorozat van?",
      answer: 74,
      points: 6,
    },
  ],
}

export function strategy(category: "C" | "D" | "E"){
  return (state: State<MyGameState>, botID: string): [any[] | undefined, string] => {
    if (state.G.numberOfTry === 0) {
      let url = problems[category][state.G.currentProblem].url;
      if(url === undefined){
        url = "";
      }
      return [[problems[category][state.G.currentProblem].problemText,3,url], "firstProblem"];
    }
    let correctnessPreviousAnswer = false;
    if(state.G.answer === problems[category][state.G.currentProblem].answer){
      correctnessPreviousAnswer = true;
    } else if (state.G.numberOfTry < 3){
      // One more try
      return [[state.G.currentProblemMaxPoints-1], "nextTry"];
    }
  
    // Next problem if there is one and the time is not over
    if (state.G.currentProblem < 8) { // TODO: it should be 9 if we count from 1 and not from 0. But it is currently 8 because we count from 0.
      let url = problems[category][state.G.currentProblem+1].url;
      if(url === undefined){
        url = "";
      }
      let nextProblem = problems[category][state.G.currentProblem+1];
      return [[nextProblem.problemText, nextProblem.points, correctnessPreviousAnswer, url], "newProblem"];
    }
    // End of the game
    return [[correctnessPreviousAnswer], "endGame"];
  }
}