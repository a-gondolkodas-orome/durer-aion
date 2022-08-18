import { MyClient } from '../../common/myclient';
import { MyGame } from './game';
import { MyBoard } from './board';
import { strategy } from './strategy';

let description = <p>Ez egy TicTacToe</p>

const TicTacToe = MyClient(MyGame, MyBoard, strategy, description);

export default function () {
  return (
    <>
      <TicTacToe playerID='0' />
    </>
  );
};