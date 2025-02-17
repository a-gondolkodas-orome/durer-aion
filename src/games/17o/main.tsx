import { MyGame } from './game';
import { MyBoard } from './board';
import { strategyWrapper } from './randomStrategy';
import { ClientFactory } from '../../common/client_factory';


let descriptionC = <p className="text-justify">
<strong>Feladat leírása:</strong> Kezdetben van egy kupacban 17 zseton az asztalon. A két játékos felváltva lép. A soron lévő játékos elvehet egy zsetont a kupacból, vagy ha páros számú zseton van az asztalon, akkor elveheti a zsetonok felét. Az nyer, akinek a lépése után nem marad zseton az asztalon. Ti dönthetitek el, hogy a kezdő vagy a második játékos bőrébe szeretnétek-e bújni.


</p>

let descriptionD = <p className="text-justify">
<strong>Feladat leírása:</strong> Kezdetben van egy kupac zseton az asztalon, a zsetonok száma legalább 20 és legfeljebb 25. A két játékos felváltva lép. A soron lévő játékos elvehet egy zsetont a kupacból, vagy ha páros számú zseton van az asztalon, akkor elveheti a zsetonok felét. Az nyer, akinek a lépése után nem marad zseton az asztalon. A kezdőállás ismeretében Ti dönthetitek el, hogy a kezdő vagy a második játékos bőrébe szeretnétek-e bújni.


</p>

let descriptionE = <p className="text-justify">
<strong>Feladat leírása:</strong> Kezdetben van egy kupac zseton az asztalon. A két játékos felváltva lép. A soron lévő játékos elvehet egy zsetont a kupacból, vagy ha páros számú zseton van az asztalon, akkor elveheti a zsetonok felét. Az nyer, akinek a lépése után nem marad zseton az asztalon. A kezdőállás ismeretében Ti dönthetitek el, hogy a kezdő vagy a második játékos bőrébe szeretnétek-e bújni.


</p>

export const { Client: Client_C, ClientWithBot: ClientWithBot_C, OnlineClient: OnlineClient_C } = ClientFactory({...MyGame, name: "17o_c"}, MyBoard, strategyWrapper("C"), descriptionC);
export const { Client: Client_D, ClientWithBot: ClientWithBot_D, OnlineClient: OnlineClient_D } = ClientFactory({...MyGame, name: "17o_d"}, MyBoard, strategyWrapper("D"), descriptionD);
export const { Client: Client_E, ClientWithBot: ClientWithBot_E, OnlineClient: OnlineClient_E } = ClientFactory({...MyGame, name: "17o_e"}, MyBoard, strategyWrapper("E"), descriptionE);
