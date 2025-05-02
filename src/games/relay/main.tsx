import { GameRelay } from './game';
import { strategy } from './strategy';
import { ClientFactoryRelay } from '../../common/client_factory';
import { InProgressRelay } from '../../client/components/teamstates/InProgressRelay';

let description = <p className="text-justify">
</p>

export const { Client:RelayClient_C, ClientWithBot:RelayClientWithBot_C, OnlineClient:RelayOnlineClient_C } = ClientFactoryRelay({...GameRelay, name: "relay_c"}, InProgressRelay, strategy("C"), description);
export const { Client:RelayClient_D, ClientWithBot:RelayClientWithBot_D, OnlineClient:RelayOnlineClient_D } = ClientFactoryRelay({...GameRelay, name: "relay_d"}, InProgressRelay, strategy("D"), description);
export const { Client:RelayClient_E, ClientWithBot:RelayClientWithBot_E, OnlineClient:RelayOnlineClient_E } = ClientFactoryRelay({...GameRelay, name: "relay_e"}, InProgressRelay, strategy("E"), description);
