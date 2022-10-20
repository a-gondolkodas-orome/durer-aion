import { State } from 'boardgame.io';
import { MyGameState } from './game';

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
      problemText: "Dionüszosz szőlőskertjében egy fürt szőlő egyik szeme megpenészedett (az ábrán a szürke). Minden nap pontosan azok a szemek fognak még megpenészedni, amik érintkeznek penészes szemmel. Hány nap múlva lesz penészes az egész szőlőfürt? (Az ábrán a teljes fürt látható.)",
      answer: 4,
      points: 3,
      url: "https://durer-images.s3.eu-central-1.amazonaws.com/PmeYbLwIvaAnVczS-szolo.png",
    },
    {
      problemText: "Mint köztudott, Trójánál a görögök egy óriási ajándéknak álcázott fából készült négylábú lóba rejtve katonákat juttattak a trójai várba. Ezzel a trójai falóval $25$-ször annyi láb került be a vár belsejébe, mint ahogy azt a trójaiak hitték. Hány görög katona jutott be a várba?",
      answer: 48,
      points: 3,
    },
    {
      problemText: "Morpheusznak, az álmok istenének egy olyan négyzet alakú kertje van, aminek egy oldalának a hossza $30~\\mathrm{m}$ (az ábrán a kert az $ABCD$ négyzet). Az oldalak harmadolópontjai által meghatározott nyolcszögbe mákot szeretne ültetni (az ábrán ez az $EFGHIJKL$ szürke nyolcszög). Hány négyzetméternyi területre szeretne mákot ültetni Morpheusz?",
      answer: 700,
      points: 4,
      url: "https://durer-images.s3.eu-central-1.amazonaws.com/crkXLXvbKLReqmO_-nyolcszog.png",
    },
    {
      problemText: "Zeusz egy óriási papírlapra egy hatalmas szabályos sokszöget rajzolt a halandóknak. A sokszög olyan nagy, hogy az emberek nem szeretnék körbejárni, viszont azt meg tudták mérni, hogy egy szöge $160^{\\circ}$. Hány oldala van az alakzatnak? (Szabályos sokszög az a sokszög, aminek minden szöge ugyanakkora és minden oldala ugyanakkora.)",
      answer: 18,
      points: 4,
    },
    {
      problemText: "Egy bolha csücsül a számegyenes $0$ pontjában. Az első lépésben a bolha egyet ugrik jobbra vagy balra, a második lépésben kettőt ugrik jobbra vagy balra, és így tovább, mindig ahányadik lépés jön, annyit ugrik jobbra vagy balra. Legkevesebb hányadik lépés végén érhet a $7$ pontba?",
      answer: 5,
      points: 4,
    },
    {
      problemText: "Szása, a macska különleges diétát kezd azután, hogy allergiás lett a sertéshúsra. Háromféle eledelt ehet ezután: csirkéset, marhásat és halasat. A diéta szerint nem ehet két egymást követő napon azonos fajtájú eledelt. Ezenkívül, ha halas eledelt evett egy napon, akkor a következő két napon nem ehet azt. Hányféleképpen ehet Szása a diéta első hét napján, ha a harmadik nap mindenképp halasat szeretne enni és a diéta előtti két napon még sertést evett?",
      answer: 16,
      points: 5,
    },
    {
      problemText: "Egy $4\\times 4$-es táblázat mezőit szeretnénk kitölteni $0$-sokkal és $2$-esekkel úgy, hogy minden mezőbe pontosan egy számot írunk. Hány olyan kitöltés van, aminél minden sorban és oszlopban pontosan egy darab $0$-s van, és van olyan sor, illetve oszlop is, amit balról jobbra, illetve fentről lefelé olvasva a $2022$ számot kapjuk?",
      answer: 24,
      points: 5,
    },
    {
      problemText: "Árész hadseregében kentaurok, emberek és pegazusok harcolnak. Mindenkinek $1$ feje van, a kentauroknak és pegazusoknak $4$ lába, az embereknek $2$ lába van, valamint az embereknek és a kentauroknak $2$ keze, a pegazusoknak pedig $0$ keze van. Árész a seregszemlén $193$ fejet, $666$ lábat és $244$ kezet számolt. Hány kentaur van Árész hadseregében?",
      answer: 69,
      points: 6,
    },
    {
      problemText: "Az alvilág kapuját Hádész háromfejű kutyája, Kerberosz őrzi. Orpheusz egyetlen esélye a bejutásra, ha egyszerre elaltatja Kerberosz mindhárom fejét, ezért addig játszik a hárfáján, amíg mindhárom fej el nem alszik. Miután elkezdett zenélni, az első fej egyből elaludt, utána felváltva $2$ percet alszik, $9$ percet ébren van. A második fej $2$ perc után aludt el, majd $2$ percet alszik és $4$ percet ébren van felváltva. A harmadik fej csak $4$ perc után aludt el, majd $2$ perceket alszik és $6$ perceket van ébren. Legkevesebb hány perc zenélés után tud Orpheusz elsétálni Kerberosz mellett? (Orpheusznak a Kerberosz melletti elhaladás 10 másodpercig tart.)",
      answer: 44,
      points: 6,
    },
  ],
  D: [
    {
      problemText: "Dionüszosz szőlőskertjében egy fürt szőlő két szeme megpenészedett (az ábrán a szürkék). Minden nap pontosan azok a szemek fognak még megpenészedni, amik legalább két penészes szemmel érintkeznek. Hány nap múlva lesz penészes az egész szőlőfürt? (Az ábrán a teljes fürt látható.)",
      answer: 6,
      points: 3,
      url: "https://durer-images.s3.eu-central-1.amazonaws.com/CX_-UsFATq6y3-5N-szolo2.PNG",
    },
    {
      problemText: "Morpheusznak, az álmok istenének egy olyan négyzet alakú kertje van, aminek egy oldalának a hossza $30~\\mathrm{m}$ (az ábrán a kert az $ABCD$ négyzet). Az oldalak harmadolópontjai által meghatározott nyolcszögbe mákot szeretne ültetni (az ábrán ez az $EFGHIJKL$ szürke nyolcszög). Hány négyzetméternyi területre szeretne mákot ültetni Morpheusz?",
      answer: 700,
      points: 3,
      url: "https://durer-images.s3.eu-central-1.amazonaws.com/crkXLXvbKLReqmO_-nyolcszog.png",
    },
    {
      problemText: "Jóska, Miki és Viktor elmentek a Trójai Falóba. Jóska rendelt $2$ gyrost pitában és $3$ baklavát, amiért $3660$ Ft-ot fizetett, míg Miki $5330$ Ft-ért $3$ gyrost pitában és $4$ baklavát rendelt. Hány forintot fizetett Viktor, ha $5$ gyrost pitában és $6$ baklavát rendelt?",
      answer: 8670,
      points: 4,
    },
    {
      problemText: "Egy bolha csücsül a számegyenes $0$ pontjában. Az első lépésben a bolha egyet ugrik jobbra vagy balra, a második lépésben kettőt ugrik jobbra vagy balra, és így tovább, mindig ahányadik lépés jön, annyit ugrik jobbra vagy balra. Legkevesebb hányadik lépés végén érhet a $12$ pontba?",
      answer: 7,
      points: 4,
    },
    {
      problemText: "Szása, a macska különleges diétát kezd azután, hogy allergiás lett a sertéshúsra. Háromféle eledelt ehet ezután: csirkéset, marhásat és halasat. A diéta szerint nem ehet két egymást követő napon azonos fajtájú eledelt. Ezenkívül, ha halas eledelt evett egy napon, akkor a következő két napon nem ehet azt. Hányféleképpen ehet Szása a diéta első hét napján, ha a harmadik nap mindenképp halasat szeretne enni és a diéta előtti két napon még sertést evett?",
      answer: 16,
      points: 4,
    },
    {
      problemText: "Egy $4\\times 4$-es táblázat mezőit szeretnénk kitölteni $0$-sokkal és $2$-esekkel úgy, hogy minden mezőbe pontosan egy számot írunk. Hány olyan kitöltés van, aminél minden sorban és oszlopban pontosan egy darab $0$-s van, és van olyan sor, illetve oszlop is, amit balról jobbra, illetve fentről lefelé olvasva a $2022$ számot kapjuk?",
      answer: 24,
      points: 5,
    },
    {
      problemText: "Thor, Freya, Idun és Loki dolgozatot írnak, de nem ugyanazon a napon. A dolgozatban minden feladat $1$ pontot ér. Thor a feladatok felét csinálta meg jól, Freya meg tudott csinálni $40$ feladatot pontosan, Idun pedig a dolgozat negyedéig csinált meg minden feladatot helyesen. A mai napon Lokin a sor, de mivel nem tanult semmit, ezért segítséget kér a három társától. A többiek elmondják az általuk megoldott feladatok megoldását. Loki így pontosan azokat a feladatokat tudja megcsinálni, amiket a többiek közül legalább egyvalaki megoldott. Legfeljebb hány olyan feladat volt, amit nem tudott megoldani így Loki, ha a társai összesen $130$ pontot szereztek?",
      answer: 60,
      points: 5,
    },
    {
      problemText: "Árész hadseregében kentaurok, emberek és pegazusok harcolnak. Mindenkinek $1$ feje van, a kentauroknak és pegazusoknak $4$ lába, az embereknek $2$ lába van, valamint az embereknek és a kentauroknak $2$ keze, a pegazusoknak pedig $0$ keze van. Árész a seregszemlén $193$ fejet, $666$ lábat és $244$ kezet számolt. Hány kentaur van Árész hadseregében?",
      answer: 69,
      points: 6,
    },
    {
      problemText: "Az alvilág kapuját Hádész háromfejű kutyája, Kerberosz őrzi. Orpheusz egyetlen esélye a bejutásra, ha egyszerre elaltatja Kerberosz mindhárom fejét, ezért addig játszik a hárfáján, amíg mindhárom fej el nem alszik. Miután elkezdett zenélni, az első fej egyből elaludt, utána felváltva $2$ percet alszik, $9$ percet ébren van. A második fej $2$ perc után aludt el, majd $2$ percet alszik és $4$ percet ébren van felváltva. A harmadik fej csak $4$ perc után aludt el, majd $2$ perceket alszik és $6$ perceket van ébren. Legkevesebb hány perc zenélés után tud Orpheusz elsétálni Kerberosz mellett? (Orpheusznak a Kerberosz melletti elhaladás 10 másodpercig tart.)",
      answer: 44,
      points: 6,
    },
  ],
  E: [
    {
      problemText: "Zeusz egy óriási papírlapra egy hatalmas szabályos sokszöget rajzolt a halandóknak. A sokszög olyan nagy, hogy az emberek nem szeretnék körbejárni, viszont azt meg tudták mérni, hogy egy szöge $160^{\\circ}$. Hány oldala van az alakzatnak? (Szabályos sokszög az a sokszög, aminek minden szöge ugyanakkora és minden oldala ugyanakkora.)",
      answer: 18,
      points: 3,
    },
    {
      problemText: "Jóska, Miki és Viktor elmentek a Trójai Falóba. Jóska rendelt $2$ gyrost pitában és $3$ baklavát, amiért $3660$ Ft-ot fizetett, míg Miki $5330$ Ft-ért $3$ gyrost pitában és $4$ baklavát rendelt. Hány forintot fizetett Viktor, ha $5$ gyrost pitában és $6$ baklavát rendelt?",
      answer: 8670,
      points: 3,
    },
    {
      problemText: "Egy bolha csücsül a számegyenes $0$ pontjában. Az első lépésben a bolha egyet ugrik jobbra vagy balra, a második lépésben kettőt ugrik jobbra vagy balra, és így tovább, mindig ahányadik lépés jön, annyit ugrik jobbra vagy balra. Legkevesebb hányadik lépés végén érhet a $12$ pontba?",
      answer: 7,
      points: 4,
    },
    {
      problemText: "Szása, a macska különleges diétát kezd azután, hogy allergiás lett a sertéshúsra. Háromféle eledelt ehet ezután: csirkéset, marhásat és halasat. A diéta szerint nem ehet két egymást követő napon azonos fajtájú eledelt. Ezenkívül, ha halas eledelt evett egy napon, akkor a következő két napon nem ehet azt. Hányféleképpen ehet Szása a diéta első hét napján, ha a harmadik nap mindenképp halasat szeretne enni és a diéta előtti két napon még sertést evett?",
      answer: 16,
      points: 4,
    },
    {
      problemText: "Egy $4\\times 4$-es táblázat mezőit szeretnénk kitölteni $0$-sokkal és $2$-esekkel úgy, hogy minden mezőbe pontosan egy számot írunk. Hány olyan kitöltés van, aminél minden sorban és oszlopban pontosan egy darab $0$-s van, és van olyan sor, illetve oszlop is, amit balról jobbra, illetve fentről lefelé olvasva a $2022$ számot kapjuk?",
      answer: 24,
      points: 4,
    },
    {
      problemText: "Árész hadseregében kentaurok, emberek és pegazusok harcolnak. Mindenkinek $1$ feje van, a kentauroknak és pegazusoknak $4$ lába, az embereknek $2$ lába van, valamint az embereknek és a kentauroknak $2$ keze, a pegazusoknak pedig $0$ keze van. Árész a seregszemlén $193$ fejet, $666$ lábat és $244$ kezet számolt. Hány kentaur van Árész hadseregében?",
      answer: 69,
      points: 5,
    },
    {
      problemText: "Egy pozitív egész számot \\emph{felezett}nek nevezünk, ha kétjegyű és a két számjegyének szorzata osztója az eredeti számnak. Mennyi az összege a felezett számoknak? (Megjegyzés: a $0$ nem osztója semelyik számnak sem.)",
      answer: 98,
      points: 5,
    },
    {
      problemText: "Perszephoné kertjében a ház, egy bokor és egy fa a következőképpen helyezkedik el: a ház a fától nyugatra $9$ méterre, míg a bokor $40$ méterre északra van a háztól. Perszephoné egy kör alakú virágágyást készített, amelynek a bokor a középpontja, a kerülete pedig ugyanolyan távolságra van a fától, mint a fa a háztól. Szeretne egy egyenes ösvényt is építeni a házától indulva, amely pont érinti a virágágyás körvonalát. A két lehetséges érintő szakasz közül választ egyet és azon építi meg az ösvényt. (Az ösvény egyik végpontja a ház, a másik végpontja az érintési pont.) Hány méter hosszú lesz az ösvény?",
      answer: 24,
      points: 6,
    },
    {
      problemText: "Az alvilág kapuját Hádész háromfejű kutyája, Kerberosz őrzi. Orpheusz egyetlen esélye a bejutásra, ha egyszerre elaltatja Kerberosz mindhárom fejét, ezért addig játszik a hárfáján, amíg mindhárom fej el nem alszik. Miután elkezdett zenélni, az első fej egyből elaludt, utána felváltva $2$ percet alszik, $9$ percet ébren van. A második fej $1$ perc után aludt el, majd $2$ percet alszik és $4$ percet ébren van felváltva. A harmadik fej csak $3$ perc után aludt el, majd $2$ perceket alszik és $5$ perceket van ébren. Legkevesebb hány perc zenélés után tud Orpheusz elsétálni Kerberosz mellett? (Orpheusznak a Kerberosz melletti elhaladás 10 másodpercig tart.)",
      answer: 67,
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
     return [[problems[category][state.G.currentProblem+1].problemText,problems[category][state.G.currentProblem+1].points,correctnessPreviousAnswer, url], "newProblem"];
    }
    // End of the game
    return [[], "endGame"];
  }
}