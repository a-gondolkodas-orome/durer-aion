import { MyGame } from './game';
import { MyBoard } from './board';
import { strategyWrapper } from './strategy';
import { ClientFactory } from '../../common/client_factory';

let description = <p className="text-justify">
  Kezdetben van 10 érme az asztalon, melyek értékei 1 és N közé eső pozitív egészek lehetnek.
  Amikor te jössz, akkor azt csinálhatod, hogy kiválasztasz egy K értéket, amire létezik K értékű érme,
  és az összes K értékű érmét átváltoztatod valamilyen kisebb L értékűre (mindet ugyanarra az értékre).
  Az nyer, akinek a lépése után minden érme azonos értékű lesz.

  Az új játék gombra kattintva generálhatsz egy felállást.

  A kezdőállás szám ismeretében te döntheteted el, hogy a kezdő vagy a második játékos bőrébe szeretnél e bújni.
</p>

export const { Client: Client_C, ClientWithBot: ClientWithBot_C, OnlineClient: OnlineClient_C } = ClientFactory(MyGame, MyBoard, strategyWrapper("C"), description);
export const { Client: Client_D, ClientWithBot: ClientWithBot_D, OnlineClient: OnlineClient_D } = ClientFactory(MyGame, MyBoard, strategyWrapper("D"), description);
export const { Client: Client_E, ClientWithBot: ClientWithBot_E, OnlineClient: OnlineClient_E } = ClientFactory(MyGame, MyBoard, strategyWrapper("E"), description);