import { MyGame } from './game';
import { MyBoard } from './board';
import { strategyWrapper } from './strategy';
import { ClientFactory } from '../../common/client_factory';


let descriptionC = <p className="text-justify">
<strong>Feladat leírása:</strong> TODO


</p>

let descriptionD = <p className="text-justify">
<strong>Feladat leírása:</strong> TODO


</p>

let descriptionE = <p className="text-justify">
<strong>Feladat leírása:</strong> TODO


</p>

export const { Client: Client_C, ClientWithBot: ClientWithBot_C, OnlineClient: OnlineClient_C } = ClientFactory({...MyGame, name: "circle"}, MyBoard, strategyWrapper("C"), descriptionC);
export const { Client: Client_D, ClientWithBot: ClientWithBot_D, OnlineClient: OnlineClient_D } = ClientFactory({...MyGame, name: "circle"}, MyBoard, strategyWrapper("D"), descriptionD);
export const { Client: Client_E, ClientWithBot: ClientWithBot_E, OnlineClient: OnlineClient_E } = ClientFactory({...MyGame, name: "circle"}, MyBoard, strategyWrapper("E"), descriptionE);
