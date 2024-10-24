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
      problemText: "Három kismalac egy esős délután otthon ül a nappalijukban és könyvet olvas. Sajnos csak 3 könyvük van, melyekből az elsőt 30, a másodikat és a harmadikat 90 perc alatt tudják elolvasni. Mindegyikük minden könyvet legfeljebb egyszer olvas el. Mindhárom kismalac leírta egy papírra, hogy hány könyvet olvasott végig délután 2 és 5 óra között. Legfeljebb mennyi lehet a leírt számok összege? \\newline \\textit{Egy könyvet egyszerre csak egy kismalac tud olvasni.}",
      answer: 6,
      points: 3,
    },
    {
      problemText: "Anita és Bori, a két maffiózó az ábrán látható, szigetekre épült város különböző szigetein garázdálkodnak (Anita az A, Bori a B betűvel jelölt szigeten). Egy nap a rendőrség szigorú ellenőrzést vezetett be néhány hídon. Legalább hány hídra kellett kivonulnia a rendőröknek ahhoz, hogy a két maffiózó ne tudjon találkozni? \\newline \\textit{A maffiózók csak akkor tudnak találkozni, ha az egyikük el tud jutni a másikhoz kizárólag nem ellenőrzött hidakat használva.}",
      answer: 3,
      points: 3,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/18o/uIDqvMSMIGiNaAPH-szigetek.png"
    },
    {
      problemText: "Robi anyukája négyzet alakú tortát sütött, melynek a tetejére pár szem málnát és epret szórt. Robi választhat egy szeletet a tortából, ha fel tudja vágni a rácsvonalak mentén téglalap alakú részekre úgy, hogy minden szeleten éppen egy szem eper és egy szem málna legyen. Maximum hány egység területű szeletet tud így magának választani Robi, ha a torta területe 100 egység? \\newline \\textit{Az ábrán látható a torta a négyzetráccsal, az epreket $E$, a málnákat $M$ betűk jelölik.}",
      answer: 35,
      points: 4,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/18o/eXdSScpPVGdGgHKM-torta.png",
    },
    {
      problemText: "Peti, Zoli, Marci és Zsoma 72 kilométer hosszú biciklitúrára indultak. Peti minden negyedik, Zoli minden ötödik, Marci pedig minden hetedik kilométer megkezdésekor ivott a kulacsából a túra kezdetétől számítva. (Tehát például Peti a 4., 8., 12., ... kilométerek elején ivott.) Peti éppen ivott, amikor Zsomának eszébe jutott, hogy elfelejtette hányadik kilométernél tartanak. Elkezdte figyelni a társait: következőként Zoli vette elő a kulacsát egyedül, három kilométerrel Peti után. Hány kilométer volt ekkor (amikor Zoli ivott) hátra a túrából?",
      answer: 18,
      points: 4,
    },
    {
      problemText: "Az ábrán látható egy 144 egység területű szabályos hatszög, melynek minden átlóját berajzoltuk. Összesen hány egység a kiszínezett részek területe?",
      answer: 24,
      points: 4,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/18o/YpTzVbSWGBKMkSgm-hatszog.png",
    },
    {
      problemText: "Az alábbi ábra 8 háromszög alakú részből áll. Hányféleképpen színezhetők ki a részek a piros, sárga, zöld és kék színekkel úgy, hogy bármely két szomszédos rész színe különböző legyen?\\newline \\textit{Azok a részek szomszédosak, melyeknek van közös pontja. A forgatással és tükrözéssel egymásba vihető megoldásokat különbözőnek tekintjük.}",
      answer: 24,
      points: 5,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/18o/kLIhdjfdvoZGykuR-4szin.png",
    },
    {
      problemText: "Az $ABCD$ trapéz alapjai az $AB$ és $DC$ oldalak. Az $AD$ és $DC$ oldalai egyenlő hosszúak. Húzzunk párhuzamost a $C$ csúcson keresztül az $AD$ oldallal, ez az $AB$ alapot az $F$ pontban metszi. Tudjuk, hogy $F$ éppen felezi az $AB$ oldalt, valamint hogy a $DAC$ szög $24^{\\circ}$-os. Hány fokos az $FBC$ szög?",
      answer: 66,
      points: 5,
    },
    {
      problemText: "Egy nap a Kerekerdő hét lakója arra ébredt, hogy a kedvenc almafájukról eltűnt az összes alma. Az egér a sólymot, a farkas az őzet, a medve a farkast, a nyúl a rókát, az őz a medvét, a róka az egeret és a sólyom a nyulat gyanúsítja. Meghívták a baglyot, hogy megtalálja a tettest. A bagoly valamilyen sorrendben minden lakót kihallgat és közben felírja egy lapra, hogy az adott lakó kit gyanúsít, azonban csak annak a vallomását veszi figyelembe, akit addig még senki sem vádolt meg. Hányféle lehet a kihallgatás után a gyanúsítottak listája, ha a nevek sorrendje nem számít?",
      answer: 18,
      points: 6,
    },
    {
      problemText: "Melyik a legnagyobb háromjegyű tízes számrendszerbeli szám, ami osztható a jegyeinek szorzatával?",
      answer: 816,
      points: 6,
    },
  ],
  D: [
    {
      problemText: "Négy kismalac egy esős délután otthon ül a nappalijukban és könyvet olvas. Sajnos csak 4 könyvük van, melyekből az elsőt 30, a másodikat, harmadikat és negyediket 90 perc alatt tudják elolvasni. Mindegyikük minden könyvet legfeljebb egyszer olvas el. Minden kismalac leírta egy papírra, hogy hány könyvet olvasott végig délután 2 és 5 óra között. Legfeljebb mennyi lehet a leírt számok összege? \\newline \\textit{Egy könyvet egyszerre csak egy kismalac tud olvasni.}",
      answer: 8,
      points: 3,      
    },
    {
      problemText: "Anita és Bori, a két maffiózó az ábrán látható, szigetekre épült város különböző szigetein garázdálkodnak (Anita az A, Bori a B betűvel jelölt szigeten). Egy nap a rendőrség szigorú ellenőrzést vezetett be néhány hídon. Legalább hány hídra kellett kivonulnia a rendőröknek ahhoz, hogy a két maffiózó ne tudjon találkozni? \\newline \\textit{A maffiózók csak akkor tudnak találkozni, ha az egyikük el tud jutni a másikhoz kizárólag nem ellenőrzött hidakat használva.}",
      answer: 3,
      points: 3,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/18o/uIDqvMSMIGiNaAPH-szigetek.png",
    },
    {
      problemText: "Robi anyukája téglalap alakú tortát sütött, melynek a tetejére pár szem málnát és epret szórt. Robi választhat egy szeletet a tortából, ha fel tudja vágni a rácsvonalak mentén téglalap alakú részekre úgy, hogy minden szeleten éppen egy szem eper és egy szem málna legyen. Maximum hány egység területű szeletet tud így magának választani Robi, ha a torta területe 77 egység? \\newline \\textit{Az alábbi, méretarányos ábrán látható a torta a négyzetráccsal, az epreket $E$, a málnákat $M$ betűk jelölik.}",
      answer: 28,
      points: 4,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/18o/KxwXqgNaDDxdyRUe-torta2.png",
    },
    {
      problemText: "Ági, Bálint, Csilla, Dénes, Enikő, Feri és Gréta, a hét barát eltervezte, hogy a Balatonnál töltik a hétvégét és ehhez le is foglaltak 4 kétfős szobát. A szobák számozva vannak. Az utolsó pillanatban ketten úgy döntöttek, hogy inkább kempingeznek. A többiek elfoglalták a szobákat úgy, hogy egyik sem maradt üresen. Hányféle lehetett a szobabeosztás?\\newline \\textit{Két beosztás eltérő, ha van olyan szoba, ahol más az ott alvók halmaza.}",
      answer: 5040,
      points: 4,
    },
    {
      problemText: "Az ábrán látható egy 144 egység területű szabályos hatszög, melynek minden átlóját berajzoltuk. Összesen hány egység a kiszínezett részek területe?",
      answer: 24,
      points: 4,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/18o/YpTzVbSWGBKMkSgm-hatszog.png"
    },
    {
      problemText: "Az $ABCD$ trapéz alapjai az $AB$ és $DC$ oldalak. Az $AD$ és $DC$ oldalai egyenlő hosszúak. Húzzunk párhuzamost a $C$ csúcson keresztül az $AD$ oldallal, ez az $AB$ alapot az $F$ pontban metszi. Tudjuk, hogy $F$ éppen felezi az $AB$ oldalt, valamint hogy a $DAC$ szög $24^{\\circ}$-os. Hány fokos az $FBC$ szög?",
      answer: 66,
      points: 5,
    },
    {
      problemText: "$A$, $B$ és $C$ pozitív egész számok, melyekre: \\begin{itemize} \\item $A+A\\cdot B=C$ \\item $B^3+1=C$ \\item $A\\geq24$ \\end{itemize} Mi az a legkisebb $C$, amire létezik olyan $A$ és $B$, hogy a feltételek teljesülnek rájuk?",
      answer: 217,
      points: 5,
    },
    {
      problemText: "Melyik a legnagyobb háromjegyű tízes számrendszerbeli szám, ami osztható a jegyeinek szorzatával?",
      answer: 816,
      points: 6,
    },
    {
      problemText: "Adott egy utcahálózat, amiben Zsuzsi az $A$ jelű pontból a $B$ jelűbe akar eljutni. Az ábrán látható, hogy melyik kereszteződés hány méter magasan van a tengerszint felett. Két szomszédos kereszteződés között az utca vagy végig emelkedik, vagy végig lejt. Zsuzsi nagyon nem szeret felfele menni, így azt az utat választja, amin összesen a lehető legkevesebbet kell felfele mennie. Összesen hány métert megy felfele Zsuzsi a sétája során? \\newline \\textit{Például ha Zsuzsi $A$-ból $C$-be menne egyenesen, akkor ezen a két útszakaszon összesen $40$ métert menne felfelé: az elsőn $40$-et és a másodikon $0$-t.}",
      answer: 265,
      points: 6,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/18o/btjhRlZdPorfVImQ-Zsuzsi.png",
    },
  ],
  E: [
    {
      problemText: "Öt kismalac egy esős délután otthon ül a nappalijukban és könyvet olvas. Sajnos csak 5 könyvük van, melyekből az elsőt 30, a többit egyenként 90 perc alatt tudják elolvasni. Mindegyikük minden könyvet legfeljebb egyszer olvas el. Minden kismalac leírta egy papírra, hogy hány könyvet olvasott végig délután 2 és 5 óra között. Legfeljebb mennyi lehet a leírt számok összege? \\newline \\textit{Egy könyvet egyszerre csak egy kismalac tud olvasni.}",
      answer: 10,
      points: 3,
    },
    {
      problemText: "Feri, a Dürer Általános Iskola rendszerető portása minden talált tárgyat külön dobozban tart. Egy nap azt vette észre, hogy valaki elővette a nyakláncokat a dobozokból és összegubancolódva az asztalon hagyta őket az ábrán látható módon. Legalább hány nyaklánc csatját kell kinyitnia Ferinek, hogy mindegyiket visszatehesse a helyére?",
      answer: 2,
      points: 3,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/18o/PyqzrGpHuowfBudr-konnyucsomo.png",
    },
    {
      problemText: "Peti, Zoli, Marci és Zsoma 72 kilométer hosszú biciklitúrára indultak. Peti minden negyedik, Zoli minden ötödik, Marci pedig minden hetedik kilométer megkezdésekor ivott a kulacsából a túra kezdetétől számítva. (Tehát például Peti a 4., 8., 12., ... kilométerek elején ivott.) Peti éppen ivott, amikor Zsomának eszébe jutott, hogy elfelejtette hányadik kilométernél tartanak. Elkezdte figyelni a társait: következőként Zoli vette elő a kulacsát egyedül, három kilométerrel Peti után. Hány kilométer volt ekkor (amikor Zoli ivott) hátra a túrából?",
      answer: 18,
      points: 4,
    },
    {
      problemText: "$A$, $B$ és $C$ pozitív egész számok, melyekre: \\begin{itemize} \\item $A+A\\cdot B=C$ \\item $B^3+1=C$ \\item $A\\geq24$ \\end{itemize} Mi az a legkisebb $C$, amire létezik olyan $A$ és $B$, hogy a feltételek teljesülnek rájuk?",
      answer: 217,
      points: 4,
    },
    {
      problemText: "Az $ABCD$ trapéz alapjai az $AB$ és $DC$ oldalak. Az $AD$ és $DC$ oldalai egyenlő hosszúak. Húzzunk párhuzamost a $C$ csúcson keresztül az $AD$ oldallal, ez az $AB$ alapot az $F$ pontban metszi. Tudjuk, hogy $F$ éppen felezi az $AB$ oldalt, valamint hogy a $DAC$ szög $24^{\\circ}$-os. Hány fokos az $FBC$ szög?",
      answer: 66,
      points: 4,
    },
    {
      problemText: "Egy nap a Kerekerdő hét lakója arra ébredt, hogy a kedvenc almafájukról eltűnt az összes alma. Az egér a sólymot, a farkas az őzet, a medve a farkast, a nyúl a rókát, az őz a medvét, a róka az egeret és a sólyom a nyulat gyanúsítja. Meghívták a baglyot, hogy megtalálja a tettest. A bagoly valamilyen sorrendben minden lakót kihallgat és közben felírja egy lapra, hogy az adott lakó kit gyanúsít, azonban csak annak a vallomását veszi figyelembe, akit addig még senki sem vádolt meg. Hányféle lehet a kihallgatás után a gyanúsítottak listája, ha a nevek sorrendje nem számít?",
      answer: 18,
      points: 5,
    },
    {
      problemText: "Az ábrán egy szabályos nyolcszög látható. Mi a kiszínezett rész területének és a nyolcszög területének hányadosa? \\newline \\textbf{A válasz a megoldás (tört) egyszerűsített alakjában a számláló és a nevező összege.}",
      answer: 5,
      points: 5,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/18o/uHAFYMBhxxBhaRSB-nyolcszog.png",
    },
    {
      problemText: "Melyik a legnagyobb háromjegyű tízes számrendszerbeli szám, ami osztható a jegyeinek szorzatával?",
      answer: 816,
      points: 6,
    },
    {
      problemText: "Adott egy utcahálózat, amiben Zsuzsi az $A$ jelű pontból a $B$ jelűbe akar eljutni. Az ábrán látható, hogy melyik kereszteződés hány méter magasan van a tengerszint felett. Két szomszédos kereszteződés között az utca vagy végig emelkedik, vagy végig lejt. Zsuzsi nagyon nem szeret felfele menni, így azt az utat választja, amin összesen a lehető legkevesebbet kell felfele mennie. Összesen hány métert megy felfele Zsuzsi a sétája során? \\newline \\textit{Például ha Zsuzsi $A$-ból $C$-be menne egyenesen, akkor ezen a két útszakaszon összesen $40$ métert menne felfelé: az elsőn $40$-et és a másodikon $0$-t.}",
      answer: 265,
      points: 6,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/18o/btjhRlZdPorfVImQ-Zsuzsi.png",
    },
  ],
}

export function strategy(category: "C" | "D" | "E"){
  return (state: State<MyGameState>, botID: string): [any[] | undefined, string] => {
    console.log("strategy", state.ctx.phase);
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