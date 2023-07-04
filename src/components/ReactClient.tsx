import { RelayOnlineClient_C, RelayOnlineClient_D, RelayOnlineClient_E } from "../games/relay/main";
import { OnlineClient_C as StrategyOnlineClient_C, OnlineClient_D as StrategyOnlineClient_D, OnlineClient_E as StrategyOnlineClient_E } from "../games/ten-coins/main";

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
