import { RelayOnlineClient_C, RelayOnlineClient_D, RelayOnlineClient_E, RelayClientWithBot_C, RelayClientWithBot_D, RelayClientWithBot_E } from "../../games/relay/main";
import { OnlineClient_C as StrategyOnlineClient_C, OnlineClient_D as StrategyOnlineClient_D, OnlineClient_E as StrategyOnlineClient_E, ClientWithBot_C as StrategyClientWithBot_C, ClientWithBot_D as StrategyClientWithBot_D, ClientWithBot_E as StrategyClientWithBot_E,  } from "../../games/remove-from-circle/main";
import { IS_OFFLINE_MODE } from "../utils/util";

const DURER_XVI_CLIENT_C_RELAY = RelayOnlineClient_C;
const DURER_XVI_CLIENT_D_RELAY = RelayOnlineClient_D;
const DURER_XVI_CLIENT_E_RELAY = RelayOnlineClient_E;
const DURER_XVI_CLIENT_C_STRATEGY = StrategyOnlineClient_C;
const DURER_XVI_CLIENT_D_STRATEGY = StrategyOnlineClient_D;
const DURER_XVI_CLIENT_E_STRATEGY = StrategyOnlineClient_E;

export function DurerXVIRelayClient({ category, matchID, credentials }: {
  category: undefined | 'C' | 'D' | 'E', matchID: string,
  credentials: string
}) {
  if (IS_OFFLINE_MODE){
    return (
      <>
      {category === 'C' && (
          <RelayClientWithBot_C />
      )}
      {category === 'D' && (
          <RelayClientWithBot_D />
      )}
      {category === 'E' && (
          <RelayClientWithBot_E />
      )}
      </>
    );
  }

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

export function DurerXVIStrategyClient({ category, matchID, credentials }: {
  category: undefined | 'C' | 'D' | 'E', matchID: string,
  credentials: string
}) {
  if (IS_OFFLINE_MODE){
    return (
      <>
      {category === 'C' && (
          <StrategyClientWithBot_C />
      )}
      {category === 'D' && (
          <StrategyClientWithBot_D />
      )}
      {category === 'E' && (
          <StrategyClientWithBot_E />
      )}
      </>
    );
  }

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
