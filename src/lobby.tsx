import { Lobby } from 'boardgame.io/react';
import { MyGame as ChessBishopGame } from './games/chess-bishops/game';
import { MyBoard as ChessBishopBoard } from './games/chess-bishops/board';
import { MyGame as TicTacToeGame } from './games/tictactoe/game';
import { MyBoard as TicTacToeBoard } from './games/tictactoe/board';
import { MyGame as TenCoinsGame } from './games/ten-coins/game';
import { MyBoard as TenCoinsBoard } from './games/ten-coins/board';
import { myGameWrapper as StrategyGameremovefromcirclewrapper } from './games/remove-from-circle/game';
import { MyBoard as StrategyBoardremovefromcircle } from './games/remove-from-circle/board';
import { MyGame as SuperstitiousCountingGame } from './games/superstitious-counting/game';
import { MyBoard as SuperstitiousCountingBoard } from './games/superstitious-counting/board';
import { gameWrapper } from './common/gamewrapper';
import { boardWrapper } from './common/boardwrapper';
import { GameRelay } from './games/relay/game';
import { InProgressRelay } from './client/components/teamstates/InProgressRelay';

// TODO: use Nginx as a proxy
const server = `http://${window.location.host}`; // DO NOT use trailing slash!
console.assert(!server.endsWith('/'));

export default function () {
  return (
    <div>
      <h1> This should not be included in the live version</h1>
      <h1>Lobby</h1>
      <Lobby gameServer={server} lobbyServer={server} gameComponents={[
        {
          game: gameWrapper(TicTacToeGame),
          board: boardWrapper(TicTacToeBoard, "TODO")
        },
        {
          game: gameWrapper(SuperstitiousCountingGame),
          board: boardWrapper(SuperstitiousCountingBoard, "TODO")
        },
        {
          game: gameWrapper(ChessBishopGame),
          board: boardWrapper(ChessBishopBoard, "TODO")
        },
        {
          game: {...GameRelay, name: "relay_c"},
          board: InProgressRelay
        },
        {
          game: {...GameRelay, name: "relay_d"},
          board: InProgressRelay
        },
        {
          game: {...GameRelay, name: "relay_e"},
          board: InProgressRelay
        },
        {
          game: {...gameWrapper(TenCoinsGame), name: "tencoins_c"},
          board: boardWrapper(TenCoinsBoard, "Kezdetben van 10 érme az asztalon, melyek értékei 1 és 4 közé eső egészek lehetnek. A két játékos felváltva lép. A soron lévő játékos kiválaszt egy K értéket, amire igaz, hogy van az asztalon K értékű érme, és az összes K értékű érmét átváltoztatja valamilyen kisebb L értékűre (mindet ugyanarra az L értékre, ahol az L érték 1 és K-1 közötti). Az nyer, akinek a lépése után minden érme azonos értékű lesz. A kezdőállás ismeretében Ti dönthetitek el, hogy a kezdő vagy a második játékos bőrébe szeretnétek-e bújni.")
        },
        {
          game: {...gameWrapper(TenCoinsGame), name: "tencoins_d"},
          board: boardWrapper(TenCoinsBoard, "Kezdetben van 10 érme az asztalon, melyek értékei 1 és 5 közé eső egészek lehetnek. A két játékos felváltva lép. A soron lévő játékos kiválaszt egy K értéket, amire igaz, hogy van az asztalon K értékű érme, és az összes K értékű érmét átváltoztatja valamilyen kisebb L értékűre (mindet ugyanarra az L értékre, ahol az L érték 1 és K-1 közötti). Az nyer, akinek a lépése után minden érme azonos értékű lesz. A kezdőállás ismeretében Ti dönthetitek el, hogy a kezdő vagy a második játékos bőrébe szeretnétek-e bújni. (K: Melyik típusú érmét változtatjátok meg?; L: Mi legyen az új érme)")
        },
        {
          game: {...gameWrapper(TenCoinsGame), name: "tencoins_e"},
          board: boardWrapper(TenCoinsBoard, "Kezdetben van 10 érme az asztalon, melyek értékei 1 és 5 közé eső egészek lehetnek. A két játékos felváltva lép. A soron lévő játékos kiválaszt egy K értéket, amire igaz, hogy van az asztalon K értékű érme, és az összes K értékű érmét átváltoztatja valamilyen kisebb L értékűre (mindet ugyanarra az L értékre, ahol az L érték 1 és K-1 közötti). Az nyer, akinek a lépése után minden érme azonos értékű lesz. A kezdőállás ismeretében Ti dönthetitek el, hogy a kezdő vagy a második játékos bőrébe szeretnétek-e bújni. (K: Melyik típusú érmét változtatjátok meg?; L: Mi legyen az új érme)")
        },
        {
          game: {...gameWrapper(StrategyGameremovefromcirclewrapper("C")), name: "remove-from-circle_c"},
          board: boardWrapper(StrategyBoardremovefromcircle, "Kezdetben van 10 érme az asztalon, melyek értékei 1 és 5 közé eső egészek lehetnek. A két játékos felváltva lép. A soron lévő játékos kiválaszt egy K értéket, amire igaz, hogy van az asztalon K értékű érme, és az összes K értékű érmét átváltoztatja valamilyen kisebb L értékűre (mindet ugyanarra az L értékre, ahol az L érték 1 és K-1 közötti). Az nyer, akinek a lépése után minden érme azonos értékű lesz. A kezdőállás ismeretében Ti dönthetitek el, hogy a kezdő vagy a második játékos bőrébe szeretnétek-e bújni. (K: Melyik típusú érmét változtatjátok meg?; L: Mi legyen az új érme)")
        },
        {
          game: {...gameWrapper(StrategyGameremovefromcirclewrapper("D")), name: "remove-from-circle_d"},
          board: boardWrapper(StrategyBoardremovefromcircle, "Kezdetben van 10 érme az asztalon, melyek értékei 1 és 5 közé eső egészek lehetnek. A két játékos felváltva lép. A soron lévő játékos kiválaszt egy K értéket, amire igaz, hogy van az asztalon K értékű érme, és az összes K értékű érmét átváltoztatja valamilyen kisebb L értékűre (mindet ugyanarra az L értékre, ahol az L érték 1 és K-1 közötti). Az nyer, akinek a lépése után minden érme azonos értékű lesz. A kezdőállás ismeretében Ti dönthetitek el, hogy a kezdő vagy a második játékos bőrébe szeretnétek-e bújni. (K: Melyik típusú érmét változtatjátok meg?; L: Mi legyen az új érme)")
        },
        {
          game: {...gameWrapper(StrategyGameremovefromcirclewrapper("E")), name: "remove-from-circle_e"},
          board: boardWrapper(StrategyBoardremovefromcircle, "Kezdetben van 10 érme az asztalon, melyek értékei 1 és 5 közé eső egészek lehetnek. A két játékos felváltva lép. A soron lévő játékos kiválaszt egy K értéket, amire igaz, hogy van az asztalon K értékű érme, és az összes K értékű érmét átváltoztatja valamilyen kisebb L értékűre (mindet ugyanarra az L értékre, ahol az L érték 1 és K-1 közötti). Az nyer, akinek a lépése után minden érme azonos értékű lesz. A kezdőállás ismeretében Ti dönthetitek el, hogy a kezdő vagy a második játékos bőrébe szeretnétek-e bújni. (K: Melyik típusú érmét változtatjátok meg?; L: Mi legyen az új érme)")
        },
      ]} />
    </div>
  );
};