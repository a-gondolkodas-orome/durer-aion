import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import Languagedetector from 'i18next-browser-languagedetector';

i18next
  .use(initReactI18next)
  .use(Languagedetector)
  .init({
    debug: process.env.NODE_ENV === 'development',
    fallbackLng: 'hu',
    fallbackNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        disclaimer: {
          welcome: 'Dear Team <1>{{tname}}</1>, we welcome you in the online round!',
          category: 'Your category: <1>{{category}}</1>',
          start: 
            "In the online round, teams must work on their own; they must not ask for help from other people " +  
            "until the competition ends (at 21:30). The use of artificial intelligence is also forbidden.",
          progress: "Advancing to next rounds",
          progressDescription:
            "Teams that earn at least {{minpoints}} points out of the maximum {{maxpoints}} points that can be earned " +  
            "will proceed to the regional round. (We reserve the right to lower this minimum threshold, but we will not raise it.) " +  
            "The points earned in the online round do not count towards the later results.", 
          interface: "The interface",
          interfaceDescription:
            "The interface can be filled in using your PCs or phones as well. You can even log in from multiple devices.",
          interfaceDescriptionBHTML:
            "The interface can be filled in on both mobile and computer. Please make sure to complete the online round from <1>at most 1 device</1>, and also <3>do not refresh the page</3> during the competition.<5 />" +  
            "<6>(If you nevertheless refresh the page, the competition will restart (but your results so far will be kept). In that case, go back as quickly as possible to the task where you left off. " +  
            "Note that although the timer restarts after refreshing, we will still only take into account answers that arrive within the official time limit.)</6>",
          continue: "Continue to the competition",
        },
        chooser: {
          finish: {
            title: "Competition ended!",
            content: "Thank you for participating, we hope you enjoyed the competition. We are curious about your feedback on this round, so please <a href=\""+ process.env.VITE_FEEDBACK_URL +"\" target=\"_blank\" rel=\"noopener noreferrer\">fill out this form</a>. We will publish the results and the list of advancing teams by Thursday, and we will also send you a notification about it by email.",
            final: "Final score",
          },
          gameDescriptionHtml: `<p>In this task, you can play a two-player strategy game where you will be one player and the computer will be the other. Defeat the computer <b>twice in a row</b> in this game! Knowing the starting position, you can decide whether you want to play as the first or second player.</p>
          <p>You will receive points for successful completion as follows:
            <ul>
          <li>If you don't lose at all, you get 12 points.</li>
          <li>In case of 1, 2, 3, 4, or 5 losses, the points obtained decrease to 9, 6, 4, 3, and 2 respectively.</li>
          <li>In case of more losses, you still get 2 points if you manage to complete the game.</li>
          <li>If you fail to defeat the computer twice in a row within 30 minutes, you get 0 points.</li>
            </ul>
          </p>
          <p>
            When you're ready, click the button below and from then on you have a total of 30 minutes.
          </p>`,
          relayDescription: "Relay tasks are short text tasks where the answer is an integer (at least 0 and at most 9999). You can make a maximum of 3 guesses for each relay task, and after each wrong guess, the points you can earn for that task decrease by 1. After a correct guess or three wrong guesses, you will receive the next task. You have a total of 60 minutes for the relay tasks, and you can earn a total of 40 points with error-free performance. (The points available for individual tasks range from 3 to 6.)",
          filledAt: "Filled at",
          achievedPoint: "Points achieved",
          start: "Start",
          result: "Results",
        },
        relay: {
          endTable: {
            title: "Relay completed",
            task: "Task",
            point: "Points",
            try: "attempt",
            wrong: "Wrong answer",
            all: "Total points",
            pointsGained: "points scored",
            back: "Back to competition",
          },
          badCategory: "WRONG CATEGORY",
          remainingTime: "Remaining time",
          name: "Relay tasks",
          guess: "Guess:",
          send: "Submit",
          guessNum: 'guess #{{guessnum}}:'
        },
        general: {
          task: "task",
          point: "point",
        },
        header: {
          logout: "logout",
          subtitle: "Online round",
          title: "XIX. Dürer Competition",
        },
        login: {
          greeting: "Dear Competitor!",
          beforeTitle: "Welcome to the online round interface of the ",
          afterTitle: ".",
          loginInstruction: "To log in, check your emails and enter the code you find there here:",
          fallback: "If you can't find the email, write to us at the verseny (at) durerinfo (dot) hu email address.",
          loginButton: "Log in", 
        },
        waitingRoom: {
          soon: "The online round will start soon!",
          remainingStart: "Still",
          remainingEnd: "left until start!",
          instruction: "When the competition starts, you will be automatically redirected to the competition interface.",
        },
        strategy: {
          notSupported: "UNSUPPORTED GAME STATE",
          name: "Strategy game",
          endTable: {
            all: "Total points",
            gained: "Points earned",
            tries: "Number of attempts"
          },
          guide: {
            newgame: "Start a new game!",
            iffirstplayer: "Choose whether you want to be the first or second player.",
            yourturn: "Your turn now!",
            waitingforserver: "Waiting for server...",
            realgamewin: "Congratulations, you won! Defeat the computer one more time!",
            testgamewin: "Congratulations, you won the test game!",
            botwins: "Unfortunately the computer won.",
            endofgame: "The game has ended.",
          },
          instructions: "Further instructions",
          instructionDescription: "Clicking on the button “Start a new test game” starts a test game, which is not counted in the scoring. Feel free to play some test games before playing a real round in order to test your understanding of the game's logic. The latter mode can be initialised by clicking “Start a new live game”, which will start a game which now counts for points.", 
          realresults: "Live game results so far:",
          wins_one: "win",
          wins_other: "wins",
          defeats_one: "defeat",
          defeats_other: "defeats",
          testgamebutton: "Start a new test game",
          realgamebutton: "Start a new live game",
        },
        notFound: {
          message: "This page was not found.",
          back: "Back to main page",
        },
        error: {
          unsuspected: "An unexpected error occurred",
        },
        warnings: {
          timeNotMatch: "Your computer's clock is not synchronized with the server's clock, the displayed remaining time is not perfect, reloading the page may solve the problem",
        }
      },
      hu: {
        disclaimer: {
          welcome: 'Kedves <1>{{tname}}</1> csapat, üdvözlünk az online fordulón!',
          category: 'Kategóriátok: <1>{{category}}</1>',
          start: 
            "Az online fordulón a csapatoknak önállóan kell dolgozniuk, más emberektől nem kérhetnek segítséget" +
            " a versenyzési időszak végéig (21:30-ig). A mesterséges intelligencia használata is tilos.",
          progress: "Továbbjutás",
          progressDescription:
            "Azok a csapatok, amelyek az online forduló során a megszerezhető {{maxpoints}} pontból legalább {{minpoints}} pontot " +
            "elérnek, továbbjutnak a helyi fordulóba. (Fenntartjuk a jogot, hogy a ponthatárt esetleg csökkentsük, " +
            "növelni biztosan nem fogjuk.) Az online fordulón szerzett pontszám nem számít bele a további eredményekbe.",
          interface: "A felület",
          interfaceDescription:
            "A felület mobilon és gépen is kitölthető, egyszerre akár több eszközzel is bejelentkezhettek.",
          interfaceDescriptionBHTML:
            "A felület mobilon és gépen is kitölthető. Kérünk bennetek, hogy <1>legfeljebb 1 eszközről</1> töltsétek ki az online fordulót, továbbá <3>ne frissítsétek le az oldalt</3> a verseny során.<5 />" +
            "<6>(Ha mégis frissítitek az oldalt, akkor a verseny újraindul (de az eddigi eredményeitek megmaradnak). Ekkor - minél gyorsabban - menjetek vissza ahhoz a feladathoz, ahol jártatok. " +
            "Figyeljetek arra, hogy bár az időzítő újraindul a frissítés után, de így is csak az időben beérkezett válaszokat fogjuk figyelembe venni.)</6>",
          continue: "Tovább a versenyhez",
        },
        chooser: {
          finish: {
            title: "Vége a versenynek!",
            content: "Köszönjük a részvételeteket, reméljük, hogy tetszett nektek a verseny. Kíváncsiak vagyunk a fordulóval kapcsolatos véleményetekre, így kérjük, <a href=\""+ process.env.VITE_FEEDBACK_URL +"\" target=\"_blank\" rel=\"noopener noreferrer\">töltsétek ki ezt az űrlapot</a>. Várhatóan csütörtökig közzétesszük az eredményeket és a továbbjutó csapatok listáját, és erről emailben is fogunk nektek értesítést küldeni.",
            final: "Végső pontszám",
          },
          gameDescriptionHtml: `<p>Ebben a feladatban egy kétszemélyes stratégiás játékot játszhattok, ahol az egyik játékos Ti lesztek, a másik játékos pedig a gép. Győzzétek le a gépet <b>kétszer egymás után</b> ebben a játékban! A kezdő helyzet ismeretében Ti dönthetitek el, hogy a kezdő vagy a második játékos bőrébe szeretnétek bújni.</p>         
          <p>A sikeres teljesítésért az alábbiak szerint kaptok pontot:
            <ul>
              <li>Ha egyszer sem veszítetek, akkor 12 pontot kaptok.</li>
              <li>1, 2, 3, 4, illetve 5 vereség esetén a kapott pontszám 9-re, 6-ra, 4-re, 3-ra, illetve 2-re csökken.</li>
              <li>Ennél több vereség esetén is 2 pontot kaptok, ha sikerül teljesítenetek a játékot.</li>
              <li>Ha 30 perc alatt nem győzitek le kétszer egymás után a gépet, akkor 0 pontot kaptok.</li>
            </ul>
          </p>
          <p>
            Ha készen álltok, kattintsatok a lenti gombra és onnantól kezdve összesen 30 perc áll rendelkezésetekre.
          </p>`,
          relayDescription: "A váltófeladatok rövid szöveges feladatok, melyekre a válasz egy egész szám (legalább 0 és " + 
          "legfeljebb 9999). Minden váltófeladatra maximum 3 tippet adhattok le, egy-egy rossz tipp után az adott " +
          "feladatra megszerezhető pontszám 1-gyel csökken. Helyes tipp vagy három rossz tipp után megkapjátok a " +
          "következő feladatot. A váltófeladatokra összesen 60 perc áll rendelkezésre, és összesen 40 pont szerezhető " +
          "velük hibátlan teljesítés esetén. (Az egyes feladatokra kapható pontszám 3-tól 6-ig terjed.)",
          filledAt: "Kitöltve ekkor",
          achievedPoint: "Elért pont",
          start: "Kezdjük",
          result: "Eredmények",
        },
        relay: {
          endTable: {
            title: "A váltó befejeződött",
            task: "Feladat",
            point: "Pontszám",
            try: "próbálkozás",
            wrong: "Hibás válasz",
            all: "Összpontszám",
            pointsGained: "pontot szereztél",
            back: "Vissza a versenyhez",
          },
          badCategory: "ROSSZ KATEGÓRIA",
          name: "Váltófeladatok",
          guess: "Tipp:",
          send: "Küldés",
          guessNum: "{{guessnum}}. próba:",
        },
        general: {
          remainingTime: "Hátralevő idő",
          task: "feladat",
          point: "pont",
        },
        header: {
          logout: "kilépés",
          subtitle: "Online forduló",
          title: "XIX. Dürer Verseny",
        },
        login: {
          greeting: "Kedves Versenyző!",
          beforeTitle: "Üdvözlünk a ",
          afterTitle: " online fordulójának felületén.",
          loginInstruction: "Belépéshez nézd meg az emailjeidet, és üsd be az ott található kódot ide:",
          fallback: "Ha nem találjátok az emailt, akkor írjatok nekünk a verseny [K] durerinfo [P] hu email címre.",
          loginButton: "Belépés"
        },
        waitingRoom: {
          soon: "Az online forduló hamarosan kezdődik!",
          remainingStart: "Még",
          remainingEnd: "van hátra kezdésig!",
          instruction: "A verseny kezdetekor automatikusan átirányításra kerültök a verseny felületre.",
        },
        strategy: {
          notSupported: "NEM TÁMOGATOTT JÁTÉKÁLLAPOT",
          name: "Stratégiás játék",
          endTable: {
            all: "Összpontszám",
            gained: "Szerzett pontok",
            tries: "Próbálkozások száma"
          },
          guide: {
            newgame: "Kezdj új játékot!",
            iffirstplayer: "Válaszd ki, hogy első vagy második játékos akarsz-e lenni.",
            yourturn: "Most Te jössz!",
            waitingforserver: "Várakozás a szerverre...",
            realgamewin: "Gratulálok, nyertetek! Verjétek meg még egyszer a gépet!",
            testgamewin: "Gratulálok, a próbajátékban nyertetek!",
            botwins: "Sajnos a gép nyert.",
            endofgame: "A játék végetért.",
          },
          instructions: "Tudnivalók",
          instructionDescription: "Az „Új próbajáték kezdése” gombra kattintva próbajáték indul, ami a pontozásba nem számít bele. Bátran kérjetek próbajátékot, hiszen ezzel tudjátok tesztelni, hogy jól értitek-e a játék működését. Az „Új éles játék kezdése” gombra kattintva indul a valódi játék, ami már pontért megy.",
          realresults: "Éles játékok eddigi eredményei:",
          wins: "győzelem",
          defeats: "vereség",
          testgamebutton: "Új próbajáték kezdése",
          realgamebutton: "Új éles játék kezdése",
        },
        notFound: {
          message: "Ez az oldal nem található.",
          back: "Vissza a főoldalra", 
        },
        error: {
          unsuspected: "Váratlan hiba történt",
        },
        warnings: {
          timeNotMatch: "A számítógép órája nincs szinkronban a szerver órájával, a jelzett hátralevő idő nem tökéletes, az oldal újra töltése megoldhatja a problémát",
          timeNotReal: "Az óra csak tájékoztató jellegű. Más eszközökön és böngészőkben más időt fogtok látni, de így is csak az időben beérkezett válaszokat fogjuk figyelembe venni.",
        }
      }
    }
  })

export default i18next;