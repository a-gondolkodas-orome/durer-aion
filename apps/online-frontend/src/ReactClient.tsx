import { GameRelay, descriptionC, descriptionD, descriptionE, MyBoardWrapper, MyGameWrappers, strategyNames } from "game";
import { ClientFactory, ClientFactoryRelay, InProgressRelay } from "common-frontend";

const GameC = MyGameWrappers.C();
const GameD = MyGameWrappers.D();
const GameE = MyGameWrappers.E();

let description = <p className="text-justify"></p>
const serverUrl = import.meta.env.VITE_SERVER_URL;
export const { Client:RelayClient_C, OnlineClient:RelayOnlineClient_C } = ClientFactoryRelay({...GameRelay, name: "relay_c"}, InProgressRelay, description, serverUrl);
export const { Client:RelayClient_D, OnlineClient:RelayOnlineClient_D } = ClientFactoryRelay({...GameRelay, name: "relay_d"}, InProgressRelay, description, serverUrl);
export const { Client:RelayClient_E, OnlineClient:RelayOnlineClient_E } = ClientFactoryRelay({...GameRelay, name: "relay_e"}, InProgressRelay, description, serverUrl);
export const { Client: Client_C, OnlineClient: StrategyOnlineClient_C } = ClientFactory({...GameC, name: strategyNames.C}, MyBoardWrapper("C"), descriptionC, serverUrl);
export const { Client: Client_D, OnlineClient: StrategyOnlineClient_D } = ClientFactory({...GameD, name: strategyNames.D}, MyBoardWrapper("D"), descriptionD, serverUrl);
export const { Client: Client_E, OnlineClient: StrategyOnlineClient_E } = ClientFactory({...GameE, name: strategyNames.E}, MyBoardWrapper("E"), descriptionE, serverUrl);


const DURER_XVI_CLIENT_C_RELAY = RelayOnlineClient_C;
const DURER_XVI_CLIENT_D_RELAY = RelayOnlineClient_D;
const DURER_XVI_CLIENT_E_RELAY = RelayOnlineClient_E;
const DURER_XVI_CLIENT_C_STRATEGY = StrategyOnlineClient_C;
const DURER_XVI_CLIENT_D_STRATEGY = StrategyOnlineClient_D;
const DURER_XVI_CLIENT_E_STRATEGY = StrategyOnlineClient_E;

export function RelayClient({ category, matchID, credentials }: {
  category?: undefined | 'C' | 'D' | 'E', matchID?: string,
  credentials?: string
}) {
  return (
    <>
    {
      category === 'C' && (
        <DURER_XVI_CLIENT_C_RELAY {...{credentials, matchID}}/>
      )
    }
    {
      category === 'D' && (
        <DURER_XVI_CLIENT_D_RELAY {...{credentials, matchID}}/>
      )
    }
    {
      category === 'E' && (
        <DURER_XVI_CLIENT_E_RELAY {...{credentials, matchID}}/>
      )
    }
    </>
  );
}

export function StrategyClient({ category, matchID, credentials }: {
  category?: undefined | 'C' | 'D' | 'E', matchID?: string,
  credentials?: string
}) {

  return (
    <>
    {
      category === 'C' && (
        <DURER_XVI_CLIENT_C_STRATEGY {...{credentials, matchID}}/>
      )
    }
    {
      category === 'D' && (
        <DURER_XVI_CLIENT_D_STRATEGY {...{credentials, matchID}}/>
      )
    }
    {
      category === 'E' && (
        <DURER_XVI_CLIENT_E_STRATEGY {...{credentials, matchID}}/>
      )
    }
    </>
  );
}
