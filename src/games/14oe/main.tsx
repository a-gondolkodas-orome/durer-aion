import { MyGame } from './game';
import { MyBoard } from './board';
import { strategy } from './strategy';
import { ClientFactory } from '../../common/client_factory';

let description = <p>Ez egy játék</p>

export const { Client, ClientWithBot } = ClientFactory(MyGame, MyBoard, strategy, description);