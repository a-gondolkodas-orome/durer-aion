import { MyClient } from '../../common/myclient';
import { MyGame } from './game';
import { MyBoard } from './board';
import { strategy } from './strategy';

const SuperstitiousCounting = MyClient(MyGame,MyBoard,strategy);

export default function () {
  return (
    <>
      <SuperstitiousCounting playerID='0' />
    </>
  )
};