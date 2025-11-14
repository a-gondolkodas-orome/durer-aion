import { GameRelay, MyBoardWrapper, MyGameWrappers, strategyNames } from "game";
import { ClientFactory, ClientFactoryRelay, InProgressRelay } from "common-frontend";
import React from "react";

const GameC = MyGameWrappers.C();
const GameD = MyGameWrappers.D();
const GameE = MyGameWrappers.E();

let description = <p className="text-justify"></p>
const serverUrl = import.meta.env.VITE_SERVER_URL;

// Lazy load descriptions to keep them out of main bundle
const getDescriptions = () => import('./descriptions').then(mod => ({
  descriptionC: mod.descriptionC,
  descriptionD: mod.descriptionD,
  descriptionE: mod.descriptionE
}));

// Create factories lazily when descriptions are needed
let clientFactoriesCache: any = null;

const getClientFactories = async () => {
  if (clientFactoriesCache) return clientFactoriesCache;

  const descriptions = await getDescriptions();

  clientFactoriesCache = {
    RelayClient_C: ClientFactoryRelay({...GameRelay, name: "relay_c"}, InProgressRelay, description, serverUrl).OnlineClient,
    RelayClient_D: ClientFactoryRelay({...GameRelay, name: "relay_d"}, InProgressRelay, description, serverUrl).OnlineClient,
    RelayClient_E: ClientFactoryRelay({...GameRelay, name: "relay_e"}, InProgressRelay, description, serverUrl).OnlineClient,
    StrategyOnlineClient_C: ClientFactory({...GameC, name: strategyNames.C}, MyBoardWrapper("C"), descriptions.descriptionC, serverUrl).OnlineClient,
    StrategyOnlineClient_D: ClientFactory({...GameD, name: strategyNames.D}, MyBoardWrapper("D"), descriptions.descriptionD, serverUrl).OnlineClient,
    StrategyOnlineClient_E: ClientFactory({...GameE, name: strategyNames.E}, MyBoardWrapper("E"), descriptions.descriptionE, serverUrl).OnlineClient,
  };

  return clientFactoriesCache;
};


export function RelayClient({ category, matchID, credentials }: {
  category?: undefined | 'C' | 'D' | 'E', matchID?: string,
  credentials?: string
}) {
  const [factories, setFactories] = React.useState<any>(null);

  React.useEffect(() => {
    getClientFactories().then(setFactories);
  }, []);

  if (!factories) {
    return <div>Loading...</div>;
  }

  return (
    <>
    {
      category === 'C' && (
        <factories.RelayClient_C {...{credentials, matchID}}/>
      )
    }
    {
      category === 'D' && (
        <factories.RelayClient_D {...{credentials, matchID}}/>
      )
    }
    {
      category === 'E' && (
        <factories.RelayClient_E {...{credentials, matchID}}/>
      )
    }
    </>
  );
}

export function StrategyClient({ category, matchID, credentials }: {
  category?: undefined | 'C' | 'D' | 'E', matchID?: string,
  credentials?: string
}) {
  const [factories, setFactories] = React.useState<any>(null);

  React.useEffect(() => {
    getClientFactories().then(setFactories);
  }, []);

  if (!factories) {
    return <div>Loading...</div>;
  }

  return (
    <>
    {
      category === 'C' && (
        <factories.StrategyOnlineClient_C {...{credentials, matchID}}/>
      )
    }
    {
      category === 'D' && (
        <factories.StrategyOnlineClient_D {...{credentials, matchID}}/>
      )
    }
    {
      category === 'E' && (
        <factories.StrategyOnlineClient_E {...{credentials, matchID}}/>
      )
    }
    </>
  );
}
