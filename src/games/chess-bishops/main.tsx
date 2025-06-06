import { MyGame } from './game';
import { MyBoard } from './board';
import { strategy } from './strategy';
import { ClientFactory } from '../../common/client_factory';

let description = <p>Károly és Dezső m-ig szeretnének elszámolni, és közben a következő játékot játsszák: 0-ról kezdenek, a két játékos felváltva adhat hozzá egy 13-nál kisebb pozitív egészet a korábbi számhoz, azonban a babonájuk miatt ha egyikük x-et adott hozzá, akkor másikuk a következő lépésben nem adhat hozzá 13-x-et. Az veszít, aki eléri (vagy átlépi) m-et. Az m szám ismeretében te döntheteted el, hogy a kezdő vagy a második játékos bőrébe szeretnél e bújni. Sok sikert! :)</p>

export const { Client, ClientWithBot } = ClientFactory(MyGame, MyBoard, strategy, description);
