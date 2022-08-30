import { MyClient } from '../../common/myclient';
import { MyGame } from './game';
import { MyBoard } from './board';
import { strategy } from './strategy';

let description = <p>Ez egy TicTacToe</p>

const Game14OnlineC = MyClient(MyGame, MyBoard, strategy, description);

export default function () {
  return (
    <>
      <Game14OnlineC playerID='0' />
    </>
  );
};