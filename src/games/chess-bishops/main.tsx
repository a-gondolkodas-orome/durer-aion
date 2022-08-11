import { MyClient } from '../../common/myclient';
import { MyGame } from './game';
import { MyBoard } from './board';
import { strategy } from './strategy';

const ChessBishops = MyClient(MyGame,MyBoard,strategy);

export default function() {
  return (
    <>
      <ChessBishops playerID='0' />
    </>
  );
};