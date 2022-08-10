import { MyClient } from '../../common/myclient';
import { MyGame } from './game';
import { MyBoard } from './board';
import { strategy } from './strategy';

const TicTacToe = MyClient(MyGame,MyBoard,strategy);

export default function() {
  return (
    <>
      <TicTacToe playerID='0' />
    </>
  );
};