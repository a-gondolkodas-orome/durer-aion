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
      problemText: "Egy öböl két oldalán áll 1-1 világítótorony. Az egyik 63 másodpercenként jelez, a másik 42 másodpercenként jelez. Ebben a másodpercben jelzett mindkét világítótorony. Hány másodperc múlva lesz ismét az, hogy ugyanakkor jeleznek?",
      answer: 126,
      points: 3,
    },
    {
      problemText: "Egy kalózcsapat az Ananász-szigetről a Banán-szigetre szeretne eljutni. Útközben úgy döntenek, hogy néhány szigetet meglátogatnak. Hányféleképpen tudják megtenni az útjukat, hogyha az ábrán jelölt szakaszokon haladhatnak, a nyíllal jelölt szakaszon olyan erős az áramlat, hogy csak a jelzett irányba tudnak haladni, továbbá minden szigeten legfeljebb egyszer járnak?",
      answer: 8,
      points: 3,
    },
    {
      problemText: "András szülinapjára kapott 27 darab egybevágó fehér kockát, amiből azonnal egy nagyobb, $3\times 3\times 3$-as kockát épített. Testvére, Ábel, pirosra festette a nagy kocka egyik csúcsánál lévő három oldalát, majd megszáradás után szétszedte, és egy másik nagy kockát rakott belőle össze. Kisöccsük, Bendegúz, az új nagy kocka egyik csúcsánál lévő három oldalát lefestette pirosra. Legfeljebb hány olyan kis kocka keletkezhetett, aminek legalább 3 oldala festett?",
      answer: 14,
      points: 4,
    },
    {
      problemText: "Egy hajó legénysége kalózokból és majmokból áll. A kalózok között vannak egy-, illetve kétlábúak, a majmoknak pedig négy lábuk van. Eredetileg a lábak átlagos száma $1,75$. Egy szép nyári napon újabb (szintén négylábú) kismajommal bővült a legénység. Ekkor a lábak átlagos száma $2$-re nőtt. Hány tagja volt eredetileg a legénységnek?",
      answer: 8,
      points: 4,
    },
    {
      problemText: "A vitorlakészítő műhely $5m\\times 6m$-es vászondarabokat rendel, majd minden darabot felvágnak olyan egybevágó téglalap alakú vitorlákra, melyek minden oldalának hossza méterben mérve egész szám. Az irodában minden így elkészíthető különböző vitorlából pontosan egy ki van állítva. Mennyi a kiállított vitorlák összterülete? \\emph{Felvágásról beszélünk akkor is, ha a vászondarab egyben marad.}",
      answer: 78,
      points: 4,
    },
    {
      problemText: "Az alábbi térképen a szélcsendes B, D és E szigeteken kívül minden négyzetben fúj a szél a 4 irány valamelyikébe (az ábrán: fel, le, jobbra vagy balra). Ha egy csónak a térkép egy mezőjén van, akkor onnan a szél irányában sodródik tovább a szomszédos mezőre. Tudjuk, hogy az A négyzetről induló csónakok elsodródnak a B szigetre, a C-ről indulók pedig a D szigetre anélkül, hogy elhagynák a térképet. Ha egy hajó valamikor egy szigeten van, onnan a szélcsend miatt nem képes továbbmenni. Legfeljebb hány mezőről indulva lehet elérni az E szigetet a térkép elhagyása nélkül (magát az E szigetet is beleértve)?",
      answer: 18,
      points: 5,
    },
    {
      problemText: "Alex kalózkapitány újabb rablókörútjára készül, ehhez előkészíti a kincsesládáit. Összesen 6 üres ládája van, melyek különböző méretűek, ezeket szeretné egymásba rakni, hogy kisebb helyen elférjenek. Mindegyik ládának két rekesze van, egy aranyos és egy ezüstös rekesz, melyekbe legfeljebb egy-egy ládát rakhat. Egy láda a nála nagyobb ládák bármely rekeszébe belefér. Hányféleképpen pakolhat be Alex kapitány, ha végül minden láda bekerül a legnagyobba? \\emph{Két bepakolást akkor tekintünk különbözőnek, ha van olyan láda, ami más ládába, vagy ugyanazon láda másik rekeszébe került.}",
      answer: 720,
      points: 5,
    },
    {
      problemText: "A kalózok egy lakatlan szigeten hagytak egy kinccsel teli ládát, amire egy számzárral védett lakatot tettek. A kincskeresőknek elárulták, hogy a kód a legkisebb olyan pozitív egész szám, ami $3$-mal osztva $2$ maradékot ad, $5$-tel osztva $1$ maradékot ad és $8$-cal osztva $7$ maradékot ad. Mi a láda kódja?",
      answer: 71,
      points: 6,
    },
    {
      problemText: "Hány olyan háromszög van, amelynek csúcsai egy adott négyzet csúcsai és oldalfelezőpontjai közül kerülnek ki, és van olyan szöge, ami legalább $90^{\circ}$-os? ",
      answer: 44,
      points: 6,
    },
  ],
  D: [
    {
      problemText: "Egy hajó legénysége kalózokból és majmokból áll. A kalózok között vannak egy-, illetve kétlábúak, a majmoknak pedig négy lábuk van. Eredetileg a lábak átlagos száma $1,75$. Egy szép nyári napon újabb (szintén négylábú) kismajommal bővült a legénység. Ekkor a lábak átlagos száma $2$-re nőtt. Hány tagja volt eredetileg a legénységnek?",
      answer: 8,
      points: 3,
      
    },
    {
      problemText: "A kalózok egy lakatlan szigeten hagytak egy kinccsel teli ládát, amire egy számzárral védett lakatot tettek. A kincskeresőknek elárulták, hogy a kód a legkisebb olyan pozitív egész szám, ami $3$-mal osztva $2$ maradékot ad, $5$-tel osztva $1$ maradékot ad és $8$-cal osztva $7$ maradékot ad. Mi a láda kódja?",
      answer: 71,
      points: 3,
      
    },
    {
      problemText: "Két kalóz, Kartal és Kristóf üzletelni szeretne egymás között. Kartalnak $1$ darab $1$ dollárosa és $2$ darab $3$ dollárosa van, míg Kristófnak $3$ darab $5$ dollárosa. Ősi kalóztörvény szerint azonban csak háromféle műveletet hajthatnak végre (azokat viszont akárhányszor és bármilyen sorrendben): \begin{itemize} \item Egy $3$ dollárost egy $5$ dollárosra cserélnek; \item Egy $1$ dollárost egy $3$ dollárosra cserélnek;\item Az egyikük ad a másiknak egy $1$ dollárost. \end{itemize} A cserék végeztével hányféle értéket vehet fel Kartal vagyona?",
      answer: 21,
      points: 4,
    },
    {
      problemText: "Négy matróz egy lakatlan szigeten ragadt. Segítséget akarnak szerezni, ezért a sziget északi és déli partján egy-egy állomást állítottak fel, mindkettőn egyszerre egy matróz tud füstjeleket küldeni. Tegnap minden matróz valamely egész órában kezdte el a füstjelzést, majd pontosan két órán keresztül csinálta ezt. Hányféleképpen tehették ezt meg, ha minden matróz csak egyszer jelzett, és reggel 8 óra előtt és délután 3 óra után senki sem küldött jeleket? \\emph{Két eset akkor különböző, ha van olyan matróz, aki nem ugyanakkor vagy ugyanott küld füstjeleket.}",
      answer: 3552,
      points: 4,
    },
    {
      problemText: "András szülinapjára kapott 27 darab egybevágó fehér kockát, amiből azonnal egy nagyobb, $3\times 3\times 3$-as kockát épített. Testvére, Ábel, pirosra festette a nagy kocka egyik csúcsánál lévő három oldalát, majd megszáradás után szétszedte, és egy másik nagy kockát rakott belőle össze. Kisöccsük, Bendegúz, az új nagy kocka egyik csúcsánál lévő három oldalát lefestette pirosra. Legfeljebb hány olyan kis kocka keletkezhetett, aminek legalább 3 oldala festett?",
      answer: 14,
      points: 4,
    },
    {
      problemText: "Az alábbi térképen a szélcsendes B, D és E szigeteken kívül minden négyzetben fúj a szél a 4 irány valamelyikébe (az ábrán: fel, le, jobbra vagy balra). Ha egy csónak a térkép egy mezőjén van, akkor onnan a szél irányában sodródik tovább a szomszédos mezőre. Tudjuk, hogy az A négyzetről induló csónakok elsodródnak a B szigetre, a C-ről indulók pedig a D szigetre anélkül, hogy elhagynák a térképet. Ha egy hajó valamikor egy szigeten van, onnan a szélcsend miatt nem képes továbbmenni. Legfeljebb hány mezőről indulva lehet elérni az E szigetet a térkép elhagyása nélkül (magát az E szigetet is beleértve)?",
      answer: 18,
      points: 5,
    },
    {
      problemText: "Balszerencsés Bertold és Peches Péter kimennek a Terjedelmes Tengerre kincset keresni. A Terjedelmes Tenger négyzet alakú, és $4\times 4$ darab szektorra van felosztva. A két jóbarátnak van egy hálója, amit ha a tenger valamelyik szektorában a vízbe dobnak, akkor az ott és az azzal oldalszomszédos szektorokban lévő kincseket tudják kihalászni. Legalább hány szektorban van kincs, ha már első próbálkozásra biztosan találnak kincset, akárhova is dobják a hálójukat?",
      answer: 4,
      points: 5,
    },
    {
      problemText: "Alex kalózkapitány újabb rablókörútjára készül, ehhez előkészíti a kincsesládáit. Összesen 6 üres ládája van, melyek különböző méretűek, ezeket szeretné egymásba rakni, hogy kisebb helyen elférjenek. Mindegyik ládának két rekesze van, egy aranyos és egy ezüstös rekesz, melyekbe legfeljebb egy-egy ládát rakhat. Egy láda a nála nagyobb ládák bármely rekeszébe belefér. Hányféleképpen pakolhat be Alex kapitány, ha végül minden láda bekerül a legnagyobba? \\emph{Két bepakolást akkor tekintünk különbözőnek, ha van olyan láda, ami más ládába, vagy ugyanazon láda másik rekeszébe került.}",
      answer: 720,
      points: 6,
    },
    {
      problemText: "Az $ABCD$ négyzet belsejében vegyük fel a $P$ pontot úgy, hogy $CDP\sphericalangle=19^{\circ}$ és $PAB\sphericalangle=52^{\circ}$. Hány fokos a $PBC \sphericalangle$?",
      answer: 26,
      points: 6,
    },
  ],
  E: [
    {
      problemText: "Négy matróz egy lakatlan szigeten ragadt. Segítséget akarnak szerezni, ezért a sziget északi és déli partján egy-egy állomást állítottak fel, mindkettőn egyszerre egy matróz tud füstjeleket küldeni. Tegnap minden matróz valamely egész órában kezdte el a füstjelzést, majd pontosan két órán keresztül csinálta ezt. Hányféleképpen tehették ezt meg, ha minden matróz csak egyszer jelzett, és reggel 8 óra előtt és délután 3 óra után senki sem küldött jeleket? \\emph{Két eset akkor különböző, ha van olyan matróz, aki nem ugyanakkor vagy ugyanott küld füstjeleket.}",
      answer: 3552,
      points: 3,
    },
    {
      problemText: "Balszerencsés Bertold és Peches Péter kimennek a Terjedelmes Tengerre kincset keresni. A Terjedelmes Tenger négyzet alakú, és $4\times 4$ darab szektorra van felosztva. A két jóbarátnak van egy hálója, amit ha a tenger valamelyik szektorában a vízbe dobnak, akkor az ott és az azzal oldalszomszédos szektorokban lévő kincseket tudják kihalászni. Legalább hány szektorban van kincs, ha már első próbálkozásra biztosan találnak kincset, akárhova is dobják a hálójukat?",
      answer: 4,
      points: 3,
    },
    {
      problemText: "Két kalóz, Kartal és Kristóf üzletelni szeretne egymás között. Kartalnak $1$ darab $1$ dollárosa és $2$ darab $3$ dollárosa van, míg Kristófnak $3$ darab $5$ dollárosa. Ősi kalóztörvény szerint azonban csak háromféle műveletet hajthatnak végre (azokat viszont akárhányszor és bármilyen sorrendben): \begin{itemize} \item Egy $3$ dollárost egy $5$ dollárosra cserélnek; \item Egy $1$ dollárost egy $3$ dollárosra cserélnek;\item Az egyikük ad a másiknak egy $1$ dollárost. \end{itemize} A cserék végeztével hányféle értéket vehet fel Kartal vagyona?",
      answer: 21,
      points: 4,
    },
    {
      problemText: "Alex kalózkapitány újabb rablókörútjára készül, ehhez előkészíti a kincsesládáit. Összesen 6 üres ládája van, melyek különböző méretűek, ezeket szeretné egymásba rakni, hogy kisebb helyen elférjenek. Mindegyik ládának két rekesze van, egy aranyos és egy ezüstös rekesz, melyekbe legfeljebb egy-egy ládát rakhat. Egy láda a nála nagyobb ládák bármely rekeszébe belefér. Hányféleképpen pakolhat be Alex kapitány, ha végül minden láda bekerül a legnagyobba? \\emph{Két bepakolást akkor tekintünk különbözőnek, ha van olyan láda, ami más ládába, vagy ugyanazon láda másik rekeszébe került.}",
      answer: 720,
      points: 4,
    },
    {
      problemText: "András szülinapjára kapott 27 darab egybevágó fehér kockát, amiből azonnal egy nagyobb, $3\times 3\times 3$-as kockát épített. Testvére, Ábel, pirosra festette a nagy kocka egyik csúcsánál lévő három oldalát, majd megszáradás után szétszedte, és egy másik nagy kockát rakott belőle össze. Kisöccsük, Bendegúz, az új nagy kocka egyik csúcsánál lévő három oldalát lefestette pirosra. Legfeljebb hány olyan kis kocka keletkezhetett, aminek legalább 3 oldala festett?",
      answer: 14,
      points: 4,
    },
    {
      problemText: "Az alábbi térképen a szélcsendes B, D és E szigeteken kívül minden négyzetben fúj a szél a 4 irány valamelyikébe (az ábrán: fel, le, jobbra vagy balra). Ha egy csónak a térkép egy mezőjén van, akkor onnan a szél irányában sodródik tovább a szomszédos mezőre. Tudjuk, hogy az A négyzetről induló csónakok elsodródnak a B szigetre, a C-ről indulók pedig a D szigetre anélkül, hogy elhagynák a térképet. Ha egy hajó valamikor egy szigeten van, onnan a szélcsend miatt nem képes továbbmenni. Legfeljebb hány mezőről indulva lehet elérni az E szigetet a térkép elhagyása nélkül (magát az E szigetet is beleértve)?",
      answer: 18,
      points: 5,
    },
    {
      problemText: "Ágoston június $10$-én $5$ órakor született, így a kedvenc számai az $5$, a $6$ és a $10$. Mióta matekozik, csak ebben a három számrendszerben dolgozik. Hány olyan $A\times B=C$ műveletet tud elvégezni Ágoston, melyben mindhárom szám egész, $B$ nem tartalmaz páros számjegyeket, de tartalmazza a számrendszer összes páratlan számjegyét pontosan egyszer, $C$ pedig nem tartalmaz páratlan számjegyeket, de tartalmaza a számrendszer összes páros számjegyét pontosan egyszer?",
      answer: 0,
      points: 5,
    },
    {
      problemText: "Az $ABCD$ négyzet belsejében vegyük fel a $P$ pontot úgy, hogy $CDP\sphericalangle=19^{\circ}$ és $PAB\sphericalangle=52^{\circ}$. Hány fokos a $PBC \sphericalangle$?",
      answer: 26,
      points: 6,
    },
    {
      problemText: "A kalózok egy lakatlan szigeten hagytak egy kinccsel teli ládát, amire egy négyjegyű számzárral védett lakatot tettek. A kincskeresőknek elárulták, hogy a kódban nincsen $0$ számjegy, és ha összeadják az összes négyjegyű számot, amik minden számjegyből pontosan ugyanannyit tartalmaznak, mint a kód, akkor pont a kód $11$-szeresét kapják. Mi a kincsesláda kódja?",
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