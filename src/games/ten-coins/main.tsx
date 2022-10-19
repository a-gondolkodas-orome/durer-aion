import { MyGame } from './game';
import { MyBoard } from './board';
import { strategyWrapper } from './strategy';
import { ClientFactory } from '../../common/client_factory';

let descriptionC = <p className="text-justify">
Kezdetben van 10 érme az asztalon, melyek értékei 1 és 4 közé eső egészek lehetnek. A két játékos felváltva lép. A soron lévő játékos kiválaszt egy K értéket, amire igaz, hogy van az asztalon K értékű érme, és az összes K értékű érmét átváltoztatja valamilyen kisebb L értékűre (mindet ugyanarra az L értékre, ahol az L érték 1 és K-1 közötti). Az nyer, akinek a lépése után minden érme azonos értékű lesz. A kezdőállás ismeretében Ti dönthetitek el, hogy a kezdő vagy a második játékos bőrébe szeretnétek-e bújni.

(K: Melyik típusú érmét változtatjátok meg?; L: Mi legyen az új érme)
</p>

let descriptionDE = <p className="text-justify">
Kezdetben van 10 érme az asztalon, melyek értékei 1 és 5 közé eső egészek lehetnek. A két játékos felváltva lép. A soron lévő játékos kiválaszt egy K értéket, amire igaz, hogy van az asztalon K értékű érme, és az összes K értékű érmét átváltoztatja valamilyen kisebb L értékűre (mindet ugyanarra az L értékre, ahol az L érték 1 és K-1 közötti). Az nyer, akinek a lépése után minden érme azonos értékű lesz. A kezdőállás ismeretében Ti dönthetitek el, hogy a kezdő vagy a második játékos bőrébe szeretnétek-e bújni.

(K: Melyik típusú érmét változtatjátok meg?; L: Mi legyen az új érme)
</p>

export const { Client: Client_C, ClientWithBot: ClientWithBot_C } = ClientFactory(MyGame, MyBoard, strategyWrapper("C"), descriptionC);
export const { Client: Client_D, ClientWithBot: ClientWithBot_D } = ClientFactory(MyGame, MyBoard, strategyWrapper("D"), descriptionDE);
export const { Client: Client_E, ClientWithBot: ClientWithBot_E } = ClientFactory(MyGame, MyBoard, strategyWrapper("E"), descriptionDE);