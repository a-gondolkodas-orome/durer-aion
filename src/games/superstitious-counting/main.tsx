import { MyClient } from '../../common/myclient';
import { MyGame } from './game';
import { MyBoard } from './board';
import { strategy } from './strategy';

let description = <p className="text-justify">
  Ez a játék a XIII. Dürer döntőjén szerepelt E kategóriában.

  Károly és Dezső m-ig szeretnének elszámolni, és közben a következő játékot játsszák:
  0-ról kezdenek, a két játékos felváltva adhat hozzá egy 13-nál kisebb pozitív egészet a korábbi
  számhoz, azonban a babonájuk miatt ha egyikük x-et adott hozzá, akkor másikuk a következő
  lépésben nem adhat hozzá 13 − x-et. Az veszít, aki eléri (vagy átlépi) m-et.

  Az új játék gombra kattintva generálhatsz egy felállást.

  Az m szám ismeretében te döntheteted el, hogy a kezdő vagy a második játékos bőrébe szeretnél e bújni.
</p>

const SuperstitiousCounting = MyClient(MyGame, MyBoard, strategy, description);

export default function () {
  return (
    <>
      <SuperstitiousCounting playerID='0' />
    </>
  )
};