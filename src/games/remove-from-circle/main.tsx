import { MyGame } from './game';
import { MyBoard } from './board';
import { strategyWrapper } from './strategy';
import { ClientFactory } from '../../common/client_factory';


let descriptionC = <p className="text-justify">
<strong>Feladat leírása:</strong> "Bergengócia fővárosában a 7 legnagyobb bank épülete egy körben, a Nagykörút mentén helyezkedik el. Két rivális bűnbanda ezen bankok kirablását tervezi, mégpedig úgy, hogy felváltva választanak ki egy-egy bankot. Nem választanak ki olyat, amit már korábban az egyikük kifosztott, és olyat sem, aminek már mindkét szomszédját kirabolták, mert ott már lesben áll a rendőrség. Az a banda veszt, aki már nem talál bankot, amit kirabolhat. Győzzétek le a gépet kétszer egymás után ebben a játékban! Ti dönthetitek el, hogy a kezdő vagy a második banda bőrébe szeretnétek bújni.


</p>

let descriptionD = <p className="text-justify">
<strong>Feladat leírása:</strong> Bergengócia fővárosában a 9 legnagyobb bank épülete egy körben, a Nagykörút mentén helyezkedik el. Két rivális bűnbanda ezen bankok kirablását tervezi, mégpedig úgy, hogy felváltva választanak ki egy-egy bankot. Nem választanak ki olyat, amit már korábban az egyikük kifosztott, és olyat sem, aminek már mindkét szomszédját kirabolták, mert ott már lesben áll a rendőrség. Az a banda veszt, aki már nem talál bankot, amit kirabolhat. Győzzétek le a gépet kétszer egymás után ebben a játékban! Ti dönthetitek el, hogy a kezdő vagy a második banda bőrébe szeretnétek bújni


</p>

let descriptionE = <p className="text-justify">
<strong>Feladat leírása:</strong> Bergengócia fővárosában legalább 3 és legfeljebb 10 bank található, melyek körben, a Nagykörút mentén helyezkednek el. Két rivális bűnbanda ezen bankok kirablását tervezi, mégpedig úgy, hogy felváltva választanak ki egy-egy bankot. Nem választanak ki olyat, amit már korábban az egyikük kifosztott, és olyat sem, aminek már mindkét szomszédját kirabolták, mert ott már lesben áll a rendőrség. Az a banda veszt, aki már nem talál bankot, amit kirabolhat. Győzzétek le a gépet kétszer egymás után ebben a játékban! Ti dönthetitek el, hogy a kezdő vagy a második banda bőrébe szeretnétek bújni.

</p>

export const { Client: Client_C, ClientWithBot: ClientWithBot_C, OnlineClient: OnlineClient_C } = ClientFactory({...MyGame, name: "remove-from-circle_c"}, MyBoard, strategyWrapper("C"), descriptionC);
export const { Client: Client_D, ClientWithBot: ClientWithBot_D, OnlineClient: OnlineClient_D } = ClientFactory({...MyGame, name: "remove-from-circle_d"}, MyBoard, strategyWrapper("D"), descriptionD);
export const { Client: Client_E, ClientWithBot: ClientWithBot_E, OnlineClient: OnlineClient_E } = ClientFactory({...MyGame, name: "remove-from-circle_e"}, MyBoard, strategyWrapper("E"), descriptionE);
