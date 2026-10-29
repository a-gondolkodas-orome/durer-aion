import { State } from 'boardgame.io';
import { MyGameState, RelayMoveArgs } from 'game';

export interface Problem {
  problemText: string;
  answer: number;
  points: number;
  url?: string;
  help1?: string;
  help2?: string;
}

interface RelayProblems {
  C: Problem[];
  D: Problem[];
  E: Problem[];
}

const problems : RelayProblems = {
  C: [
    {
      problemText: "Lili, a sarki kutató halkonzervből, kabátból és műszerből pakolt néhányat a hátizsákjába. Egy halkonzerv tömege 4 kilogramm, egy kabát tömege 7 kilogramm, míg egy műszer tömege 5 kilogramm. Hány halkonzervet rakott Lili a táskájába, ha a háromféle tárgyból összesen 29 kilogrammot pakolt be, és mindhárom tárgyból legalább egyet vitt magával?",
      answer: 3,
      points: 3,
    },
    {
      problemText: "Egy ásatáson falakat találtak, amelyeket az ábrán látható fekete szakaszok jelölnek. Áron körbesétálta a romokat a bal oldali ábrán látható módon és megszámozta a falak oldalait 1-től 26-ig. A falak mindkét oldalára írt számot, abban a sorrendben, ahogy elhaladt mellettük. \\\\Később találtak egy újabb falat, viszont egy korábbi másik fal leomlott, így a jobb oldalon látható rom keletkezett. Ezt Áron ismét körbejárta, és megszámozta a falak oldalait az előzőhöz hasonló módon. Hány falfelületre írta ugyanazt a számot Áron a két körbejárás esetén? \\\\ \\textit{Áron mindkét körbejárásnál azonos helyről és ugyanabba az irányba indult el.}",
      answer: 16,
      points: 3,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/20o/wq4IDQ9tA3bnbZ1U-asatas.png",
    },
    {
      problemText: "Ha egy mező területe $1$ egység, akkor hány egység az ábrán látható szürke rész területe?",
      answer: 11,
      points: 4,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/20o/jPc2Th4PaPMvqWr1-hal_rajz.png",
    },
    {
      problemText: "Andris otthon eltört egy tányért, így gyorsan elment az EIKA bútorüzletbe, hogy vegyen egy újat. A bolt $21$ bemutatórészből áll, amiben egy megadott útvonal mentén végighaladva lehet eljutni a bejárattól (B) a pénztárig (P). Szerencsére vannak átjárók, amelyek két-két bemutatórészt kötnek össze, ezeket szaggatott vonalak jelölik. Andris szeretne minél gyorsabban végezni, így olyan útvonalat választ, ami a lehető legkevesebb bemutatórészt érinti. Legkevesebb hány bemutatórészt kell érintenie Andrisnak a bejárattól a pénztárig, ha a tányérok az utolsó, $21$-es részben találhatók?",
      answer: 5,
      points: 4,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/20o/r27YCbJttjuvuLJd-EIKA.png",
    },
    {
      problemText: "Anita, Bea, Cila és Dalma piros, kék, sárga és zöld pulcsikat horgoltak. Mindegyikük csak egyféle színből horgolt pulcsikat és mindenki más színt használt. Tudjuk, hogy az elkészült pulcsik darabszáma színenként valamilyen sorrendben $2$, $5$, $10$ és $21$. Mennyi az Anita és Cila által horgolt pulcsik darabszámának szorzata, ha a következő információkat tudjuk? \\begin{itemize} \\item Anita zöld pulcsikat horgolt és páros sokat. \\item Bea páratlan sokat készített és többet, mint a sárga pulcsik száma. \\item Cila nem prím darabszámút horgolt. \\item Dalma nem piros pulcsikat készített, és nem ő horgolta a legtöbbet. \\item A piros pulcsik darabszáma prím. \\end{itemize}",
      answer: 210,
      points: 4,
    },
    {
      problemText: "Három pingvin egyenes vonalban, egyenletes sebességgel csúszik a hóban. Tudjuk, hogy a hóban hagyott nyomaik egy szabályos háromszög oldalegyeneseire illeszkednek, és csúszásuk során mindegyik pingvin találkozik mindkét másikkal az ábrán látható módon. A találkozási pontok távolsága páronként $30$ méter. Az először találkozó két pingvin $25$, illetve $30$ méter/perc sebességgel csúszik. Hány méter/perc a harmadik pingvin sebessége?\\\\ \\textit{A pingvineket pontszerűnek tekintjük. Találkozásaik nincsenek hatással a csúszásukra. A pingvinek mozgását az ábrán nyilakkal jelöltük, a találkozásokat pedig időrendben sorszámoztuk.}",
      answer: 150,
      points: 5,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/20o/C12kIbkmm9Agg2pZ-csuszo_pingvin_CDE.png",
    },
    {
      problemText: "Adott az $ ABCD $ szimmetrikus trapéz, melynek szárai $ AD$ és $ BC $. Tudjuk, hogy az $ AB $ oldal hossza $21$ cm, a $ CD $ oldal hossza $31$ cm és az $ AD$ oldal hossza $13$ cm. Hány $\\text{cm}^2$ az $ ABC $ háromszög területe?",
      answer: 126,
      points: 5,
    },
    {
      problemText: "Bendi kedvenc száma egy olyan négyjegyű szám, amely nem tartalmazza a $0$ számjegyet. Bendi észrevette, hogy ezen szám számjegyeinek az összege megegyezik az utolsó két számjegyéből alkotott kétjegyű számmal. Sőt, a számjegyeinek a szorzata megegyezik az első két számjegyéből alkotott kétjegyű számmal. Mi Bendi kedvenc száma?",
      answer: 3612,
      points: 6,
    },
    {
      problemText: "Egy malomtáblára szeretnénk lehelyezni bástyákat a körökbe úgy, hogy ne lehessen semelyikkel sem eljutni vagy csak vízszintes vagy csak függőleges berajzolt vonalakon egy másikhoz. Hányféleképpen tudunk $8$ bástyát így lehelyezni a táblára?\\\\ \\textit{Például egy jó bástyaelhelyezésben nem lehet a bal alsó és jobb alsó sarokban egyszerre bástya, hiszen ekkor a bal sarokból két vízszintes lépéssel el tudunk jutni a jobb alsó sarokba.}",
      answer: 36,
      points: 6,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/20o/J1S9Iox2GmjkYyts-malom.png",
    },
  ],
  D: [
    {
      problemText: "Egy ásatáson falakat találtak, amelyeket az ábrán látható fekete szakaszok jelölnek. Áron körbesétálta a romokat a bal oldali ábrán látható módon és megszámozta a falak oldalait 1-től 26-ig. A falak mindkét oldalára írt számot, abban a sorrendben, ahogy elhaladt mellettük. \\\\Később találtak egy újabb falat, viszont egy korábbi másik fal leomlott, így a jobb oldalon látható rom keletkezett. Ezt Áron ismét körbejárta, és megszámozta a falak oldalait az előzőhöz hasonló módon. Hány falfelületre írta ugyanazt a számot Áron a két körbejárás esetén? \\\\ \\textit{Áron mindkét körbejárásnál azonos helyről és ugyanabba az irányba indult el.}",
      answer: 16,
      points: 3,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/20o/wq4IDQ9tA3bnbZ1U-asatas.png",
    },
    {
      problemText: "Ha egy mező területe $1$ egység, akkor hány egység az ábrán látható szürke és fekete rész területe összesen?\\\\ \\textit{Az ábrán minden szakasz végpontjai rácspontok, rácsvonalak felezőpontjai, vagy rácsnégyzetek középpontjai.}",
      answer: 19,
      points: 3,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/20o/JBmGcpH85t6872Y0-pingvin_rajz.png",
    },
    {
      problemText: "Andris otthon eltört egy tányért, így gyorsan elment az EIKA bútorüzletbe, hogy vegyen egy újat. A bolt $21$ bemutatórészből áll, amiben egy megadott útvonal mentén végighaladva lehet eljutni a bejárattól (B) a pénztárig (P). Szerencsére vannak átjárók, amelyek két-két bemutatórészt kötnek össze, ezeket szaggatott vonalak jelölik. Andris szeretne minél gyorsabban végezni, így olyan útvonalat választ, ami a lehető legkevesebb bemutatórészt érinti. Legkevesebb hány bemutatórészt kell érintenie Andrisnak a bejárattól a pénztárig, ha a tányérok az utolsó, $21$-es részben találhatók?",
      answer: 5,
      points: 4,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/20o/r27YCbJttjuvuLJd-EIKA.png",
    },
    {
      problemText: "Adott az $ ABCD $ szimmetrikus trapéz, melynek szárai $ AD$ és $ BC $. Tudjuk, hogy az $ AB $ oldal hossza $21$ cm, a $ CD $ oldal hossza $31$ cm és az $ AD$ oldal hossza $13$ cm. Hány $\\text{cm}^2$ az $ ABC $ háromszög területe?",
      answer: 126,
      points: 4,
    },
    {
      problemText: "Három pingvin egyenes vonalban, egyenletes sebességgel csúszik a hóban. Tudjuk, hogy a hóban hagyott nyomaik egy szabályos háromszög oldalegyeneseire illeszkednek, és csúszásuk során mindegyik pingvin találkozik mindkét másikkal az ábrán látható módon. A találkozási pontok távolsága páronként $30$ méter. Az először találkozó két pingvin $25$, illetve $30$ méter/perc sebességgel csúszik. Hány méter/perc a harmadik pingvin sebessége?\\\\ \\textit{A pingvineket pontszerűnek tekintjük. Találkozásaik nincsenek hatással a csúszásukra. A pingvinek mozgását az ábrán nyilakkal jelöltük, a találkozásokat pedig időrendben sorszámoztuk.}",
      answer: 150,
      points: 4,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/20o/C12kIbkmm9Agg2pZ-csuszo_pingvin_CDE.png",
    },
    {
      problemText: "Bendi kedvenc száma egy olyan négyjegyű szám, amely nem tartalmazza a $0$ számjegyet. Bendi észrevette, hogy ezen szám számjegyeinek az összege megegyezik az utolsó két számjegyéből alkotott kétjegyű számmal. Sőt, a számjegyeinek a szorzata megegyezik az első két számjegyéből alkotott kétjegyű számmal. Mi Bendi kedvenc száma?",
      answer: 3612,
      points: 5,
    },
    {
      problemText: "Adott egy szabályos hatszög, amelynek középpontja $O$. Az $O$ pontból kétszeresére nagyítjuk a hatszöget, az ábrán látható módon. Az így kapott nagyobb szabályos hatszög területe $144$ egység. Hány egység az ábrán látható kék háromszög területe?",
      answer: 30,
      points: 5,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/20o/zADdU5pXnIxlS1nS-geo_Lili2.png",
    },
    {
      problemText: "Egy malomtáblára szeretnénk lehelyezni bástyákat a körökbe úgy, hogy ne lehessen semelyikkel sem eljutni vagy csak vízszintes vagy csak függőleges berajzolt vonalakon egy másikhoz. Hányféleképpen tudunk $8$ bástyát így lehelyezni a táblára?\\\\ \\textit{Például egy jó bástyaelhelyezésben nem lehet a bal alsó és jobb alsó sarokban egyszerre bástya, hiszen ekkor a bal sarokból két vízszintes lépéssel el tudunk jutni a jobb alsó sarokba.}",
      answer: 36,
      points: 6,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/20o/J1S9Iox2GmjkYyts-malom.png",
    },
    {
      problemText: "Lili felírta egymás mellé valamilyen sorrendben egy táblára az $1 , 2, \\ldots ,10$ számokat. Ezt követően Anita letörölt egy számot, ami kisebb a sorban következő még le nem törölt számnál, majd ezt a lépést addig ismételte, amíg már nem tudott további számot letörölni. Hányféle lehetett a számok eredeti sorrendje, ha Anita törlései után csak a $7$ és a $10$ számok maradtak a táblán?\\\\ \\textbf{Válaszként az eredmény első négy számjegyét adjátok meg!}",
      answer: 1209,
      points: 6,
    },
  ],
  E: [
    {
      problemText: "Ha egy mező területe $1$ egység, akkor hány egység az ábrán látható szürke és fekete rész területe összesen?\\\\ \\textit{Az ábrán minden szakasz végpontjai rácspontok, rácsvonalak felezőpontjai, vagy rácsnégyzetek középpontjai.}",
      answer: 19,
      points: 3,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/20o/JBmGcpH85t6872Y0-pingvin_rajz.png",
    },
    {
      problemText: "Az $(a_n)$ sorozat első tagja $a_1=7$, a második tagja $a_2=41$. Tudjuk, hogy minden $n\\geq 1$ esetén $a_n \\cdot a_{n+2}-a_{n+1}=0$ teljesül. Mi a sorozat 2026-odik tagja? \\textbf{Válaszként az eredmény legegyszerűbb közönséges tört alakjában a számláló és a nevező összegét adjátok meg!}",
      answer: 8,
      points: 3,
    },
    {
      problemText: "Andris otthon eltört egy tányért, így gyorsan elment az EIKA bútorüzletbe, hogy vegyen egy újat. A bolt $21$ bemutatórészből áll, amiben egy megadott útvonal mentén végighaladva lehet eljutni a bejárattól (B) a pénztárig (P). Szerencsére vannak átjárók, amelyek két-két bemutatórészt kötnek össze, ezeket szaggatott vonalak jelölik. Andris szeretne minél gyorsabban végezni, így olyan útvonalat választ, ami a lehető legkevesebb bemutatórészt érinti. Legkevesebb hány bemutatórészt kell érintenie Andrisnak a bejárattól a pénztárig, ha a tányérok az utolsó, $21$-es részben találhatók?",
      answer: 5,
      points: 4,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/20o/r27YCbJttjuvuLJd-EIKA.png",
    },
    {
      problemText: "Három pingvin egyenes vonalban, egyenletes sebességgel csúszik a hóban. Tudjuk, hogy a hóban hagyott nyomaik egy szabályos háromszög oldalegyeneseire illeszkednek, és csúszásuk során mindegyik pingvin találkozik mindkét másikkal az ábrán látható módon. Az először találkozó két pingvin $25$, illetve $30$ méter/perc sebességgel csúszik. Hány méter/perc a harmadik pingvin sebessége? \\\\\\textit{A pingvineket pontszerűnek tekintjük. Találkozásaik nincsenek hatással a csúszásukra. A pingvinek mozgását az ábrán nyilakkal jelöltük, a találkozásokat pedig időrendben sorszámoztuk.}",
      answer: 150,
      points: 4,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/20o/C12kIbkmm9Agg2pZ-csuszo_pingvin_CDE.png",
    },
    {
      problemText: "Adott egy szabályos hatszög, amelynek középpontja $O$. Az $O$ pontból kétszeresére nagyítjuk a hatszöget, az ábrán látható módon. Az így kapott nagyobb szabályos hatszög területe $144$ egység. Hány egység az ábrán látható kék háromszög területe?",
      answer: 30,
      points: 4,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/20o/zADdU5pXnIxlS1nS-geo_Lili2.png",
    },
    {
      problemText: "Egy malomtáblára szeretnénk lehelyezni bástyákat a körökbe úgy, hogy ne lehessen semelyikkel sem eljutni vagy csak vízszintes vagy csak függőleges berajzolt vonalakon egy másikhoz. Hányféleképpen tudunk $8$ bástyát így lehelyezni a táblára?\\\\ \\textit{Például egy jó bástyaelhelyezésben nem lehet a bal alsó és jobb alsó sarokban egyszerre bástya, hiszen ekkor a bal sarokból két vízszintes lépéssel el tudunk jutni a jobb alsó sarokba.}",
      answer: 36,
      points: 5,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/20o/J1S9Iox2GmjkYyts-malom.png",
    },
    {
      problemText: "Bendi kedvenc száma egy olyan négyjegyű szám, amely nem tartalmazza a $0$ számjegyet. Bendi észrevette, hogy ezen szám számjegyeinek az összege megegyezik az utolsó két számjegyéből alkotott kétjegyű számmal. Sőt, a számjegyeinek a szorzata megegyezik az első két számjegyéből alkotott kétjegyű számmal. Mi Bendi kedvenc száma?",
      answer: 3612,
      points: 5,
    },
    {
      problemText: "Lili felírta egymás mellé valamilyen sorrendben egy táblára az $1 , 2, \\ldots ,10$ számokat. Ezt követően Anita letörölt egy számot, ami kisebb a sorban következő még le nem törölt számnál, majd ezt a lépést addig ismételte, amíg már nem tudott további számot letörölni. Hányféle lehetett a számok eredeti sorrendje, ha Anita törlései után pontosan két szám maradt a táblán?\\\\ \\textbf{Válaszként az eredmény első négy számjegyét adjátok meg!}",
      answer: 1026,
      points: 6,
    },
    {
      problemText: "Zoli, a jégszobrász három- és négylevelű lóheréket faragott. A lóheréket egy $6 \\times 6$-os négyzetrács mezőibe helyezte el, minden mezőbe pontosan egyet. A jobb felső sarok kivételével minden lóhere jobb és felső oldalszomszédjainak leveleinek átlaga legalább annyi, mint a saját leveleinek száma. Ha egy lóherének nincs vagy jobb vagy felső oldalszomszédja, akkor a másikban lévő levelek számát tekintjük az átlagnak. Hányféle lehet a jégszobrok elhelyezkedése a táblán? \\\\ \\textit{Két elhelyezkedés pontosan akkor különböző, ha van olyan mező, amin különböző levélszámú lóhere van.}",
      answer: 924,
      points: 6,
    },
  ],
}

export function relayStrategy(problemList: Problem[]) {
  return (state: State<MyGameState>, _botID: string): [RelayMoveArgs, string] => {
    if (state.G.numberOfTry === 0) {
      const firstProblem = problemList[state.G.currentProblem];
      return [[firstProblem.problemText, problemList.map(p => p.points), firstProblem.url ?? ""], "firstProblem"];
    }
    let correctnessPreviousAnswer = false;
    if (state.G.answer === problemList[state.G.currentProblem].answer) {
      correctnessPreviousAnswer = true;
    } else if (state.G.numberOfTry < 3) {
      return [[state.G.currentProblemAvailablePoints - 1], "nextTry"];
    }

    if (state.G.currentProblem < problemList.length - 1) {
      const nextProblem = problemList[state.G.currentProblem + 1];
      return [[nextProblem.problemText, correctnessPreviousAnswer, nextProblem.url ?? ""], "newProblem"];
    }
    return [[correctnessPreviousAnswer], "endGame"];
  }
}

export function strategy(category: "C" | "D" | "E") {
  return relayStrategy(problems[category]);
}
