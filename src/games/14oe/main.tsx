import { MyClient } from '../../common/myclient';
import { MyGame } from './game';
import { MyBoard } from './board';
import { strategy } from './strategy';

let description = <p>Ez egy játék</p>

const Game14OnlineE = MyClient(MyGame, MyBoard, strategy, description);

export default function () {
  return (
    <>
      <Game14OnlineE playerID='0' />
    </>
  );
};