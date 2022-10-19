import { RelayClientWithBot_C, RelayClientWithBot_D, RelayClientWithBot_E, RelayClient_C, RelayClient_D, RelayClient_E } from '../games/relay/main';
import { ClientWithBot_C, ClientWithBot_D, ClientWithBot_E } from '../games/ten-coins/main';


const DURER_XVI_CLIENT_C_RELAY = RelayClientOnlineClient_C;
const DURER_XVI_CLIENT_D_RELAY = RelayClientOnlineClient_D;
const DURER_XVI_CLIENT_E_RELAY = RelayClientOnlineClient_E;
const DURER_XVI_CLIENT_C_STRATEGY = ClientOnlineClient_C;
const DURER_XVI_CLIENT_D_STRATEGY = ClientOnlineClient_D;
const DURER_XVI_CLIENT_E_STRATEGY = ClientOnlineClient_E;

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
