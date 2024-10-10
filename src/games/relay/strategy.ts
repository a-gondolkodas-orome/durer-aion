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
      problemText: "Egy öböl két oldalán áll egy-egy világítótorony. Az egyik 18, a másik pedig 28 másodpercenként jelez. Ebben a másodpercben jelzett mindkét világítótorony. Hány másodperc múlva fog a két torony ismét ugyanakkor jelezni?",
      answer: 252,
      points: 3,
    },
    {
      problemText: "Egy kalózcsapat az Ananász-szigetről a Banán-szigetre szeretne eljutni. Útközben úgy döntenek, hogy néhány szigetet is meglátogatnak. Hányféleképpen tudják megtenni az útjukat, hogyha csak az ábrán jelölt szakaszokon haladhatnak; a nyíllal jelölt szakaszon olyan erős az áramlat, hogy ott csak a jelzett irányba tudnak menni, továbbá minden szigeten legfeljebb egyszer járhatnak?",
      answer: 8,
      points: 3,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/17o/fgTEvjDYAzTpmZgZ-utszamolas.png",
    },
    {
      problemText: "A kalózok egy lakatlan szigeten hagytak egy kinccsel teli ládát, amire egy számzárral védett lakatot tettek. A kincskeresőknek elárulták, hogy a kód a legkisebb olyan pozitív egész szám, ami $3$-mal osztva $2$ maradékot ad, $5$-tel osztva $1$ maradékot ad és $8$-cal osztva $7$ maradékot ad. Mi a láda kódja?",
      answer: 71,
      points: 4,
    },
    {
      problemText: "Egy hajó legénysége kalózokból és majmokból áll. A kalózok között vannak egy-, illetve kétlábúak, a majmoknak pedig négy lábuk van. Eredetileg a lábak átlagos száma $1{,}75$. Egy szép nyári napon egy újabb (szintén négylábú) kismajommal bővült a legénység. Ekkor a lábak átlagos száma $2$-re nőtt. Hány tagja volt eredetileg a legénységnek?",
      answer: 8,
      points: 4,
    },
    {
      problemText: "A vitorlakészítő műhely $5\\,\\mathrm{m}\\times 6\\,\\mathrm{m}$-es vászondarabokat rendel, majd minden darabot felvágnak olyan egybevágó téglalap alakú vitorlákra, melyek minden oldalának hossza méterben mérve egész szám. Az irodában minden így elkészíthető különböző vitorlából pontosan egyet állítottak ki. Hány négyzetméter a kiállított vitorlák összterülete? \\\\ \\emph{Felvágásról beszélünk akkor is, ha a vászondarab egyben marad. Két vitorla különböző, ha nem egybevágók. Például egy $1\\,\\mathrm{m}\\times 2\\,\\mathrm{m}$-es vitorla ki van állítva, mivel egy $5\\,\\mathrm{m}\\times 6\\,\\mathrm{m}$-es vászondarab felvágható az $1\\,\\mathrm{m}\\times 2\\,\\mathrm{m}$-es téglalappal egybevágó darabokra.}",
      answer: 78,
      points: 4,
    },
    {
      problemText: "Egy négyzet alakú szoba minden sarkában áll egy-egy szobor, amelyek eredetileg valamelyik fallal párhuzamos irányba néznek (fel, le, jobbra vagy balra, példa az ábrán). Az állásukat két gombbal tudjuk szabályozni, az egyikkel a felső két szobrot tudjuk egyszerre, a másikkal a jobb oldalon lévő két szobrot tudjuk egyszerre az óramutató járásával megegyező irányba forgatni $90^{\\circ}$-kal. Hány olyan lehetséges kiinduló állása van a négy szobornak, amelyből el tudjuk érni, hogy minden szobor egy olyan szobrot nézzen, amely őt nézi?\\\\ \\textit{Két kiinduló állás különböző, ha van olyan szobor, ami nem ugyanabba az irányba néz.}",
      answer: 32,
      points: 5,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/17o/zhfSrJSFoKYoVkkB-szobrok.png",
    },
    {
      problemText: "Az alábbi térképen a szélcsendes A, B és C szigeteken kívül minden négyzetben fúj a szél a négy irány valamelyikébe (az ábrán: fel, le, jobbra vagy balra). Ha egy csónak a térkép egy mezőjén van, akkor onnan a szél irányában továbbsodródik a szomszédos mezőre. Tudjuk, hogy az X négyzetről induló csónakok elsodródnak a B szigetre, az Y-ról indulók pedig a C szigetre anélkül, hogy elhagynák a térképet. Ha egy hajó valamikor egy szigeten van, onnan a szélcsend miatt nem tud továbbmenni. Legfeljebb hány olyan mező lehet, ahonnan indulva a szél sodrása az A szigetre visz a térkép elhagyása nélkül (magát az A szigetet is beleértve)?",
      answer: 18,
      points: 5,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/17o/NrLvEWnrhQHSxxVA-szelfujas.png",
    },
    {
      problemText: "Timi kapott a szülinapjára 27 darab egybevágó fehér kockát, amiből azonnal egy nagyobb, $3\\times 3\\times 3$-as kockát épített. Testvére, András, pirosra festette a nagy kocka három olyan oldalát, melyek egy csúcsban találkoznak, majd megszáradás után a kockát szétszedte, és a 27 kis kockából egy másik $3\\times 3\\times 3$-as kockát rakott össze. Kishúguk, Nóri, pirosra festette az új nagy kocka három olyan oldalát, melyek egy csúcsban találkoznak. Ezek után legfeljebb hány olyan kis kocka lehet, aminek legalább 3 oldala piros?",
      answer: 14,
      points: 6,
    },
    {
      problemText: "Hány olyan háromszög van, amelynek csúcsai az alábbi négyzet csúcsai és oldalfelező pontjai közül kerülnek ki, és van olyan szöge, ami legalább $90^{\\circ}$-os? ",
      answer: 44,
      points: 6,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/17o/fpoDGCfzXRoZpheQ-tompaszoguek.png",
    },
  ],
  D: [
    {
      problemText: "Egy kalózcsapat az Ananász-szigetről a Banán-szigetre szeretne eljutni. Útközben úgy döntenek, hogy néhány szigetet is meglátogatnak. Hányféleképpen tudják megtenni az útjukat, hogyha csak az ábrán jelölt szakaszokon haladhatnak; a nyíllal jelölt szakaszon olyan erős az áramlat, hogy ott csak a jelzett irányba tudnak menni, továbbá minden szigeten legfeljebb egyszer járhatnak?",
      answer: 8,
      points: 3,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/17o/fgTEvjDYAzTpmZgZ-utszamolas.png",
      
    },
    {
      problemText: "A kalózok egy lakatlan szigeten hagytak egy kinccsel teli ládát, amire egy számzárral védett lakatot tettek. A kincskeresőknek elárulták, hogy a kód a legkisebb olyan pozitív egész szám, ami $3$-mal osztva $2$ maradékot ad, $5$-tel osztva $1$ maradékot ad és $8$-cal osztva $7$ maradékot ad. Mi a láda kódja?",
      answer: 71,
      points: 3,
      
    },
    {
      problemText: "Egy hajó legénysége kalózokból és majmokból áll. A kalózok között vannak egy-, illetve kétlábúak, a majmoknak pedig négy lábuk van. Eredetileg a lábak átlagos száma $1{,}75$. Egy szép nyári napon egy újabb (szintén négylábú) kismajommal bővült a legénység. Ekkor a lábak átlagos száma $2$-re nőtt. Hány tagja volt eredetileg a legénységnek?",
      answer: 8,
      points: 4,
    },
    {
      problemText: "Négy matróz egy lakatlan szigeten ragadt. Segítséget akarnak szerezni, ezért a sziget északi és déli partján egy-egy állomást állítottak fel, mindkettőn egyszerre egy matróz tud füstjeleket küldeni. Tegnap minden matróz valamely egész órában kezdte el a füstjelzést, majd pontosan két órán keresztül csinálta ezt. Hányféleképpen tehették ezt meg, ha minden matróz csak egyszer jelzett, és reggel 8 óra előtt és délután 3 óra után nem volt látható füst az égen? \\\\ \\emph{Két eset akkor különböző, ha van olyan matróz, aki nem ugyanakkor vagy nem ugyanott küld füstjeleket.}",
      answer: 3552,
      points: 4,
    },
    {
      problemText: "Balszerencsés Bertold és Peches Panna kimennek a Terjedelmes Tengerre kincset keresni. A Terjedelmes Tenger négyzet alakú, és $4\\times 4$ darab szektorra van felosztva. A két jóbarátnak van egy hálója, amit ha a tenger valamelyik szektorában a vízbe dobnak, akkor az ott és az azzal oldalszomszédos szektorokban lévő kincseket tudják kihalászni. Legalább hány szektorban van kincs, ha már első próbálkozásra biztosan találnak kincset, akárhova is dobják a hálójukat?",
      answer: 4,
      points: 4,
    },
    {
      problemText: "Az alábbi térképen a szélcsendes A, B és C szigeteken kívül minden négyzetben fúj a szél a négy irány valamelyikébe (az ábrán: fel, le, jobbra vagy balra). Ha egy csónak a térkép egy mezőjén van, akkor onnan a szél irányában továbbsodródik a szomszédos mezőre. Tudjuk, hogy az X négyzetről induló csónakok elsodródnak a B szigetre, az Y-ról indulók pedig a C szigetre anélkül, hogy elhagynák a térképet. Ha egy hajó valamikor egy szigeten van, onnan a szélcsend miatt nem tud továbbmenni. Legfeljebb hány olyan mező lehet, ahonnan indulva a szél sodrása az A szigetre visz a térkép elhagyása nélkül (magát az A szigetet is beleértve)?",
      answer: 18,
      points: 5,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/17o/NrLvEWnrhQHSxxVA-szelfujas.png",
    },
    {
      problemText: "Timi kapott a szülinapjára 27 darab egybevágó fehér kockát, amiből azonnal egy nagyobb, $3\\times 3\\times 3$-as kockát épített. Testvére, András, pirosra festette a nagy kocka három olyan oldalát, melyek egy csúcsban találkoznak, majd megszáradás után a kockát szétszedte, és a 27 kis kockából egy másik $3\\times 3\\times 3$-as kockát rakott össze. Kishúguk, Nóri, pirosra festette az új nagy kocka három olyan oldalát, melyek egy csúcsban találkoznak. Ezek után legfeljebb hány olyan kis kocka lehet, aminek legalább 3 oldala piros?",
      answer: 14,
      points: 5,
    },
    {
      problemText: "Két kalóz, Zorka és Kristóf üzletelni szeretne egymással. Zorkának egy darab $1$ dollárosa és kettő darab $3$ dollárosa van, míg Kristófnak három darab $5$ dollárosa. Az ősi kalóztörvény szerint azonban csak háromféle műveletet hajthatnak végre egymás között (azokat viszont akárhányszor és bármilyen sorrendben): \\begin{itemize}\\item Egy $3$ dollárost egy $5$ dollárosra cserélnek; \\item Egy $1$ dollárost egy $3$ dollárosra cserélnek;\\item Az egyikük ad a másiknak egy $1$ dollárost.\\end{itemize} Zorka minden csere után felírja egy lapra, hogy éppen mennyi pénze van. Legfeljebb hány különböző szám szerepelhet a cserék végeztével Zorka lapján?",
      answer: 21,
      points: 6,
    },
    {
      problemText: "Az $ABCD$ négyzet belsejében vegyük fel a $P$ pontot úgy, hogy $CDP\\sphericalangle=19^{\\circ}$ és $PAB\\sphericalangle=52^{\\circ}$. Hány fokos a $PBC \\sphericalangle$?",
      answer: 26,
      points: 6,
    },
  ],
  E: [
    {
      problemText: "Egy hajó legénysége kalózokból és majmokból áll. A kalózok között vannak egy-, illetve kétlábúak, a majmoknak pedig négy lábuk van. Eredetileg a lábak átlagos száma $1{,}75$. Egy szép nyári napon egy újabb (szintén négylábú) kismajommal bővült a legénység. Ekkor a lábak átlagos száma $2$-re nőtt. Hány tagja volt eredetileg a legénységnek?",
      answer: 8,
      points: 3,
    },
    {
      problemText: "Négy matróz egy lakatlan szigeten ragadt. Segítséget akarnak szerezni, ezért a sziget északi és déli partján egy-egy állomást állítottak fel, mindkettőn egyszerre egy matróz tud füstjeleket küldeni. Tegnap minden matróz valamely egész órában kezdte el a füstjelzést, majd pontosan két órán keresztül csinálta ezt. Hányféleképpen tehették ezt meg, ha minden matróz csak egyszer jelzett, és reggel 8 óra előtt és délután 3 óra után nem volt látható füst az égen? \\\\ \\emph{Két eset akkor különböző, ha van olyan matróz, aki nem ugyanakkor vagy nem ugyanott küld füstjeleket.}",
      answer: 3552,
      points: 3,
    },
    {
      problemText: "Balszerencsés Bertold és Peches Panna kimennek a Terjedelmes Tengerre kincset keresni. A Terjedelmes Tenger négyzet alakú, és $4\\times 4$ darab szektorra van felosztva. A két jóbarátnak van egy hálója, amit ha a tenger valamelyik szektorában a vízbe dobnak, akkor az ott és az azzal oldalszomszédos szektorokban lévő kincseket tudják kihalászni. Legalább hány szektorban van kincs, ha már első próbálkozásra biztosan találnak kincset, akárhova is dobják a hálójukat?",
      answer: 4,
      points: 4,
    },
    {
      problemText: "Alex kalózkapitány újabb rablókörútjára készül, ehhez készíti elő a kincsesládáit. Összesen hat üres ládája van, melyek különböző méretűek, ezeket szeretné egymásba rakni, hogy kisebb helyen is elférjenek. Mindegyik ládának két rekesze van, egy aranyos és egy ezüstös rekesz. Egy láda a nála nagyobb ládák bármely rekeszébe belefér. A bepakolás után minden láda minden rekeszében legfeljebb egy láda van, de az az egy láda tartalmazhat a belsejében további ládát vagy ládákat. Hányféleképpen pakolhat be Alex kapitány, ha végül minden láda bekerül a legnagyobba? \\\\ \\textit{Két bepakolást akkor tekintünk különbözőnek, ha van olyan láda, ami más ládába, vagy ugyanazon láda másik rekeszébe került.}",
      answer: 720,
      points: 4,
    },
    {
      problemText: "Az alábbi térképen a szélcsendes A, B és C szigeteken kívül minden négyzetben fúj a szél a négy irány valamelyikébe (az ábrán: fel, le, jobbra vagy balra). Ha egy csónak a térkép egy mezőjén van, akkor onnan a szél irányában továbbsodródik a szomszédos mezőre. Tudjuk, hogy az X négyzetről induló csónakok elsodródnak a B szigetre, az Y-ról indulók pedig a C szigetre anélkül, hogy elhagynák a térképet. Ha egy hajó valamikor egy szigeten van, onnan a szélcsend miatt nem tud továbbmenni. Legfeljebb hány olyan mező lehet, ahonnan indulva a szél sodrása az A szigetre visz a térkép elhagyása nélkül (magát az A szigetet is beleértve)?",
      answer: 18,
      points: 4,
      url: "https://durerimages.s3.eu-north-1.amazonaws.com/17o/NrLvEWnrhQHSxxVA-szelfujas.png",
    },
    {
      problemText: "Timi kapott a szülinapjára 27 darab egybevágó fehér kockát, amiből azonnal egy nagyobb, $3\\times 3\\times 3$-as kockát épített. Testvére, András, pirosra festette a nagy kocka három olyan oldalát, melyek egy csúcsban találkoznak, majd megszáradás után a kockát szétszedte, és a 27 kis kockából egy másik $3\\times 3\\times 3$-as kockát rakott össze. Kishúguk, Nóri, pirosra festette az új nagy kocka három olyan oldalát, melyek egy csúcsban találkoznak. Ezek után legfeljebb hány olyan kis kocka lehet, aminek legalább 3 oldala piros?",
      answer: 14,
      points: 5,
    },
    {
      problemText: "Két kalóz, Zorka és Kristóf üzletelni szeretne egymással. Zorkának egy darab $1$ dollárosa és kettő darab $3$ dollárosa van, míg Kristófnak három darab $5$ dollárosa. Az ősi kalóztörvény szerint azonban csak háromféle műveletet hajthatnak végre egymás között (azokat viszont akárhányszor és bármilyen sorrendben): \\begin{itemize}\\item Egy $3$ dollárost egy $5$ dollárosra cserélnek; \\item Egy $1$ dollárost egy $3$ dollárosra cserélnek;\\item Az egyikük ad a másiknak egy $1$ dollárost.\\end{itemize} Zorka minden csere után felírja egy lapra, hogy éppen mennyi pénze van. Legfeljebb hány különböző szám szerepelhet a cserék végeztével Zorka lapján?",
      answer: 21,
      points: 5,
    },
    {
      problemText: "Az $ABCD$ négyzet belsejében vegyük fel a $P$ pontot úgy, hogy $CDP\\sphericalangle=19^{\\circ}$ és $PAB\\sphericalangle=52^{\\circ}$. Hány fokos a $PBC \\sphericalangle$?",
      answer: 26,
      points: 6,
    },
    {
      problemText: "A kalózok egy lakatlan szigeten hagytak egy kinccsel teli ládát, amire egy négyjegyű számzárral védett lakatot tettek. A kincskeresőknek elárulták, hogy a kódban nincsen $0$ számjegy, és ha összeadják azokat a négyjegyű számokat, amik megkaphatók a kód számjegyeinek összekeverésével, akkor pont a kód $11$-szeresét kapják. Mi a kincsesláda kódja?\\\\ \\textit{Például az $1161$ szám számjegyeinek összekeverésével megkapható számok: $1116, 1161, 1611, 6111$.}",
      answer: 2727,
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
    return [[correctnessPreviousAnswer], "endGame"];
  }
}